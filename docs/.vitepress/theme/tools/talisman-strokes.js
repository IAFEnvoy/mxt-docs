import {applyLabels} from './labels.js'
import {en, zh} from './messages/talisman-strokes.js'

// The stroke editor for the pattern.strokes of an mxt:talisman_drawing recipe.
export const TEMPLATE = `<div class="mxt-tool-grid">
    <div class="mxt-tool-board">
        <canvas id="board" width="270" height="630"></canvas>
        <div class="readout" id="readout">pointer: —</div>
        <div class="readout" id="stats"></div>
        <div class="readout" id="status"></div>
    </div>

    <div class="mxt-tool-panel">
        <div class="group">
            <label><input type="radio" name="mode" value="polyline" checked> Polyline (click to add, Enter / right click to end)</label>
            <label><input type="radio" name="mode" value="free"> Freehand (drag)</label>
        </div>

        <div class="group">
            <label><input type="checkbox" id="snap" checked> Snap to whole pixels</label>
            <label><input type="checkbox" id="grid" checked> Grid</label>
            <label><input type="checkbox" id="order" checked> Stroke order</label>
        </div>

        <div class="group">
            <label>Simplify ε <input type="number" id="epsilon" value="2" min="0" max="30" step="0.5"> px</label>
            <button id="simplify">Simplify all</button>
            <label>Zoom <select id="zoom">
                <option value="2">×2</option>
                <option value="3" selected>×3</option>
                <option value="4">×4</option>
            </select></label>
            <label>Decimals <select id="precision">
                <option value="2">2</option>
                <option value="3" selected>3</option>
                <option value="4">4</option>
                <option value="6">6</option>
            </select></label>
        </div>

        <div class="group">
            <button id="undo">Undo</button>
            <button id="redo">Redo</button>
            <button id="clear">Clear</button>
        </div>

        <div id="warnings"></div>
        <ol id="list"></ol>

        <div class="group">
            <button id="copy">Copy JSON</button>
            <button id="download">Download JSON</button>
            <button id="load">Load from JSON</button>
        </div>
        <textarea id="json" spellcheck="false"></textarea>
        <p class="hint" id="hint"></p>
    </div>
</div>`

/**
 * Fills `host` with the board and the controls, then wires them up. Returns the pure functions the page and the check
 * drive, plus a `dispose` that unbinds every listener: the site is a single-page app, so a second visit mounts a fresh
 * copy into a fresh host rather than reusing the old one.
 */
export function mount(host, lang = 'en') {
    if (!host || host.dataset.mxtTool === 'mounted') return null
    host.dataset.mxtTool = 'mounted'
    // `en` is the wording the markup and the code below already carry, so it is the identity table.
    const t = lang === 'zh' ? zh : en
    host.innerHTML = TEMPLATE
    applyLabels(host, t.labels)
    // One signal for all of them: `dispose` has to unhook the listeners that sit on document and window too.
    const abort = new AbortController()
    const listen = (target, type, handler) => target.addEventListener(type, handler, {signal: abort.signal})

// ── constants mirrored from the mod ──────────────────────────────────────────────────────────────────────────
    // TalismanDrawingScorer.CANVAS_WIDTH / CANVAS_HEIGHT: the canvas is a code constant, never a recipe field.
    const COLUMNS = 90, ROWS = 210;
    // TalismanDrawingRecipe's load-time rules and the two colour defaults.
    const MAX_STROKES = 256, MIN_STROKE_POINTS = 2, MAX_STROKE_POINTS = 4096;
    const PAPER = '#fffe85', INK = '#ff0000';
    // TalismanDrawingScorer: RESAMPLE_STEP and SIMPLIFY_EPSILON (the latter is a multiple of pattern.tolerance).
    const RESAMPLE_STEP = 2, DEFAULT_TOLERANCE = 0.06, SIMPLIFY_FACTOR = 0.5;
    const DETAIL_PX = SIMPLIFY_FACTOR * DEFAULT_TOLERANCE * ROWS;
    const MIN_FREEHAND_STEP = 1;
    const MIN_RMS = 1e-6;

    const ORDER_INK = '#8a4a1e', GRID_INK = 'rgba(0,0,0,0.10)', AXIS_INK = 'rgba(0,0,0,0.22)';
    const ACTIVE_INK = 'rgba(255,0,0,0.55)', HOVER_INK = 'rgba(30,60,160,0.9)';

    // ── state ────────────────────────────────────────────────────────────────────────────────────────────────────
    // Strokes are kept in canvas pixels (x in 0..90, y in 0..210); the JSON is these divided by the canvas size.
    let strokes = [];
    let current = null;
    let history = [], future = [];
    let hover = -1, pointer = null;
    let mode = 'polyline', dragging = false;

    const board = document.getElementById('board');
    const ctx = board.getContext('2d');
    const readout = document.getElementById('readout');
    const status = document.getElementById('status');
    const statsBox = document.getElementById('stats');
    const warningsBox = document.getElementById('warnings');
    const list = document.getElementById('list');
    const jsonBox = document.getElementById('json');
    const snapBox = document.getElementById('snap');
    const gridBox = document.getElementById('grid');
    const orderBox = document.getElementById('order');
    const zoomBox = document.getElementById('zoom');
    const precisionBox = document.getElementById('precision');
    const epsilonBox = document.getElementById('epsilon');

    const zoom = () => Number(zoomBox.value);
    const precision = () => Number(precisionBox.value);
    const epsilon = () => Math.max(0, Number(epsilonBox.value) || 0);
    const clone = value => JSON.parse(JSON.stringify(value));

    // ── history ──────────────────────────────────────────────────────────────────────────────────────────────────
    function pushHistory() {
        history.push(clone(strokes));
        future.length = 0;
        syncButtons();
    }

    function undo() {
        if (!history.length) return;
        future.push(clone(strokes));
        strokes = history.pop();
        current = null;
        refresh();
    }

    function redo() {
        if (!future.length) return;
        history.push(clone(strokes));
        strokes = future.pop();
        current = null;
        refresh();
    }

    function syncButtons() {
        document.getElementById('undo').disabled = history.length === 0;
        document.getElementById('redo').disabled = future.length === 0;
    }

    // ── geometry ─────────────────────────────────────────────────────────────────────────────────────────────────
    function toCanvas(event) {
        const box = board.getBoundingClientRect();
        const scale = zoom();
        let x = (event.clientX - box.left) / scale;
        let y = (event.clientY - box.top) / scale;
        x = Math.min(COLUMNS, Math.max(0, x));
        y = Math.min(ROWS, Math.max(0, y));
        if (snapBox.checked) return {x: Math.round(x), y: Math.round(y)};
        return {x, y};
    }

    function samePoint(a, b) {
        return Math.abs(a.x - b.x) < 1e-9 && Math.abs(a.y - b.y) < 1e-9;
    }

    function strokeLength(points) {
        let total = 0;
        for (let index = 1; index < points.length; index++)
            total += Math.hypot(points[index].x - points[index - 1].x, points[index].y - points[index - 1].y);
        return total;
    }

    function segmentDistance(point, from, to) {
        const dx = to.x - from.x, dy = to.y - from.y;
        const length2 = dx * dx + dy * dy;
        if (length2 === 0) return Math.hypot(point.x - from.x, point.y - from.y);
        let t = ((point.x - from.x) * dx + (point.y - from.y) * dy) / length2;
        t = Math.min(1, Math.max(0, t));
        return Math.hypot(point.x - (from.x + t * dx), point.y - (from.y + t * dy));
    }

    /**
     * Ramer-Douglas-Peucker, the same simplification the scorer applies before scoring: a freehand stroke is mostly
     * points the judge throws away, and keeping them only makes the recipe longer to read.
     */
    function simplify(points, tolerance) {
        if (points.length < 3 || tolerance <= 0) return points.map(point => ({...point}));
        const keep = new Array(points.length).fill(false);
        keep[0] = keep[points.length - 1] = true;
        const stack = [[0, points.length - 1]];
        while (stack.length) {
            const [first, last] = stack.pop();
            let worst = -1, worstAt = -1;
            for (let index = first + 1; index < last; index++) {
                const distance = segmentDistance(points[index], points[first], points[last]);
                if (distance > worst) { worst = distance; worstAt = index; }
            }
            if (worst > tolerance) {
                keep[worstAt] = true;
                stack.push([first, worstAt], [worstAt, last]);
            }
        }
        return points.filter((_, index) => keep[index]).map(point => ({...point}));
    }

    // ── drawing ──────────────────────────────────────────────────────────────────────────────────────────────────
    function redraw() {
        const device = window.devicePixelRatio || 1, scale = zoom();
        board.style.width = (COLUMNS * scale) + 'px';
        board.style.height = (ROWS * scale) + 'px';
        board.width = Math.round(COLUMNS * scale * device);
        board.height = Math.round(ROWS * scale * device);
        // Everything below is drawn in canvas pixels, so the line the player gets is the line drawn here.
        ctx.setTransform(device * scale, 0, 0, device * scale, 0, 0);

        ctx.fillStyle = PAPER;
        ctx.fillRect(0, 0, COLUMNS, ROWS);

        if (gridBox.checked) {
            ctx.lineWidth = 1 / scale;
            ctx.strokeStyle = GRID_INK;
            for (let x = 10; x < COLUMNS; x += 10) line(x, 0, x, ROWS);
            for (let y = 10; y < ROWS; y += 10) line(0, y, COLUMNS, y);
            ctx.strokeStyle = AXIS_INK;
            line(COLUMNS / 2, 0, COLUMNS / 2, ROWS);
            line(0, ROWS / 2, COLUMNS, ROWS / 2);
        }

        ctx.lineWidth = 2;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';

        strokes.forEach((points, index) => {
            ctx.strokeStyle = index === hover ? HOVER_INK : INK;
            path(points);
        });

        if (current) {
            ctx.strokeStyle = INK;
            path(current);
            if (pointer && mode === 'polyline') {
                ctx.save();
                ctx.setLineDash([3, 3]);
                ctx.strokeStyle = ACTIVE_INK;
                line(current[current.length - 1].x, current[current.length - 1].y, pointer.x, pointer.y);
                ctx.restore();
            }
        }

        if (orderBox.checked) {
            ctx.fillStyle = ORDER_INK;
            ctx.font = '9px ui-sans-serif, system-ui, sans-serif';
            ctx.textBaseline = 'middle';
            strokes.forEach((points, index) => {
                const start = points[0];
                ctx.beginPath();
                ctx.arc(start.x, start.y, 1.4, 0, Math.PI * 2);
                ctx.fill();
                ctx.fillText(String(index + 1), start.x + 3, start.y);
            });
        }

        if (pointer) {
            ctx.save();
            ctx.setLineDash([2, 4]);
            ctx.strokeStyle = 'rgba(0,0,0,0.35)';
            ctx.lineWidth = 1 / scale;
            line(pointer.x, 0, pointer.x, ROWS);
            line(0, pointer.y, COLUMNS, pointer.y);
            ctx.restore();
        }
    }

    function line(x1, y1, x2, y2) {
        ctx.beginPath();
        ctx.moveTo(x1, y1);
        ctx.lineTo(x2, y2);
        ctx.stroke();
    }

    function path(points) {
        if (points.length === 0) return;
        ctx.beginPath();
        ctx.moveTo(points[0].x, points[0].y);
        for (let index = 1; index < points.length; index++) ctx.lineTo(points[index].x, points[index].y);
        if (points.length === 1) ctx.lineTo(points[0].x + 0.01, points[0].y);
        ctx.stroke();
    }

    // ── the JSON the recipe takes ────────────────────────────────────────────────────────────────────────────────
    function number(value) {
        let text = value.toFixed(precision());
        if (text.includes('.')) text = text.replace(/0+$/, '').replace(/\.$/, '');
        return text === '-0' ? '0' : text;
    }

    function toJson() {
        if (!strokes.length) return '[]';
        const rows = strokes.map(points => '    [' + points
            .map(point => '[' + number(point.x / COLUMNS) + ', ' + number(point.y / ROWS) + ']')
            .join(', ') + ']');
        return '[\n' + rows.join(',\n') + '\n]';
    }

    function refresh() {
        hover = -1;
        jsonBox.value = toJson();
        redraw();
        report();
    }

    function report() {
        const points = strokes.reduce((total, stroke) => total + stroke.length, 0);
        const length = strokes.reduce((total, stroke) => total + strokeLength(stroke), 0);
        statsBox.textContent = t.stats(strokes.length, MAX_STROKES, points, length.toFixed(0));

        const problems = [];
        if (strokes.length === 0) problems.push([t.noStrokes, false]);
        if (strokes.length > MAX_STROKES) problems.push([t.tooManyStrokes(MAX_STROKES), true]);
        strokes.forEach((stroke, index) => {
            if (stroke.length < MIN_STROKE_POINTS)
                problems.push([t.onePoint(index + 1), true]);
            if (stroke.length > MAX_STROKE_POINTS)
                problems.push([t.tooManyPoints(index + 1, MAX_STROKE_POINTS), true]);
        });
        const rms = pointCloudRms();
        if (points > 0 && rms <= MIN_RMS)
            problems.push([t.samePlace, true]);
        if (!problems.some(problem => problem[1]))
            problems.push([t.accepted, false]);

        warningsBox.replaceChildren(...problems.map(([text, bad]) => {
            const row = document.createElement('div');
            row.textContent = text;
            if (!bad) row.className = 'ok';
            return row;
        }));

        list.replaceChildren(...strokes.map((stroke, index) => {
            const row = document.createElement('li');
            const label = document.createElement('span');
            label.textContent = t.listRow(index + 1, stroke.length, strokeLength(stroke).toFixed(0));
            const remove = document.createElement('button');
            remove.textContent = '✕';
            remove.title = t.removeTitle;
            listen(remove, 'click', () => removeStroke(index));
            row.append(label, remove);
            listen(row, 'mouseenter', () => { hover = index; redraw(); });
            listen(row, 'mouseleave', () => { hover = -1; redraw(); });
            return row;
        }));
    }

    function pointCloudRms() {
        const points = strokes.flat();
        if (!points.length) return 0;
        const centreX = points.reduce((total, point) => total + point.x / COLUMNS, 0) / points.length;
        const centreY = points.reduce((total, point) => total + point.y / ROWS, 0) / points.length;
        const squared = points.reduce((total, point) => {
            const dx = point.x / COLUMNS - centreX, dy = point.y / ROWS - centreY;
            return total + dx * dx + dy * dy;
        }, 0);
        return Math.sqrt(squared / points.length);
    }

    // ── editing ──────────────────────────────────────────────────────────────────────────────────────────────────
    function removeStroke(index) {
        pushHistory();
        strokes.splice(index, 1);
        refresh();
    }

    function finishStroke() {
        if (!current) return;
        const points = current;
        current = null;
        if (points.length < MIN_STROKE_POINTS) {
            status.textContent = t.tooFewPoints;
            redraw();
            return;
        }
        pushHistory();
        strokes.push(points);
        refresh();
    }

    function startStroke(point) {
        current = [point];
        redraw();
    }

    listen(board, 'pointerdown', event => {
        if (event.button !== 0) return;
        board.setPointerCapture(event.pointerId);
        const point = toCanvas(event);
        if (mode === 'free') {
            dragging = true;
            startStroke(point);
            return;
        }
        if (!current) startStroke(point);
        else if (!samePoint(current[current.length - 1], point)) {
            current.push(point);
            redraw();
        }
    });

    listen(board, 'pointermove', event => {
        pointer = toCanvas(event);
        readout.textContent = t.pointReadout(pointer.x.toFixed(1), pointer.y.toFixed(1),
            (pointer.x / COLUMNS).toFixed(3), (pointer.y / ROWS).toFixed(3));
        if (mode === 'free' && dragging && current) {
            const last = current[current.length - 1];
            if (Math.hypot(pointer.x - last.x, pointer.y - last.y) >= MIN_FREEHAND_STEP) current.push(pointer);
        }
        redraw();
    });

    listen(board, 'pointerup', event => {
        if (event.button !== 0) return;
        if (board.hasPointerCapture(event.pointerId)) board.releasePointerCapture(event.pointerId);
        if (mode !== 'free' || !dragging) return;
        dragging = false;
        if (current && epsilon() > 0) {
            const reduced = simplify(current, epsilon());
            if (reduced.length >= MIN_STROKE_POINTS) current = reduced;
        }
        finishStroke();
    });

    listen(board, 'pointerleave', () => {
        pointer = null;
        redraw();
    });

    listen(board, 'dblclick', event => {
        event.preventDefault();
        finishStroke();
    });

    listen(board, 'contextmenu', event => {
        event.preventDefault();
        finishStroke();
    });

    listen(document, 'keydown', event => {
        const typing = event.target instanceof HTMLElement
            && ['INPUT', 'TEXTAREA', 'SELECT'].includes(event.target.tagName);
        if (event.key === 'Escape' && current && !typing) {
            current = null;
            redraw();
            return;
        }
        if (event.key === 'Enter' && current && !typing) {
            finishStroke();
            return;
        }
        if (!(event.ctrlKey || event.metaKey) || typing) return;
        if (event.key.toLowerCase() === 'z' && !event.shiftKey) { event.preventDefault(); undo(); }
        else if (event.key.toLowerCase() === 'y' || (event.key.toLowerCase() === 'z' && event.shiftKey)) {
            event.preventDefault();
            redo();
        }
    });

    document.querySelectorAll('input[name="mode"]').forEach(radio => {
        listen(radio, 'change', () => {
            mode = document.querySelector('input[name="mode"]:checked').value;
            if (current && current.length < MIN_STROKE_POINTS) current = null;
            else if (current) finishStroke();
        });
    });

    listen(document.getElementById('undo'), 'click', undo);
    listen(document.getElementById('redo'), 'click', redo);
    listen(document.getElementById('clear'), 'click', () => {
        if (!strokes.length && !current) return;
        pushHistory();
        strokes = [];
        current = null;
        refresh();
    });

    listen(document.getElementById('simplify'), 'click', () => {
        const tolerance = epsilon();
        if (!strokes.length || tolerance <= 0) return;
        pushHistory();
        strokes = strokes.map(stroke => {
            const reduced = simplify(stroke, tolerance);
            return reduced.length >= MIN_STROKE_POINTS ? reduced : stroke;
        });
        refresh();
    });

    [snapBox, gridBox, orderBox].forEach(box => listen(box, 'change', redraw));
    listen(zoomBox, 'change', redraw);
    listen(precisionBox, 'change', () => { jsonBox.value = toJson(); });

    listen(document.getElementById('copy'), 'click', async () => {
        const text = toJson();
        jsonBox.value = text;
        try {
            await navigator.clipboard.writeText(text);
            status.textContent = t.copied(strokes.length);
        } catch (error) {
            jsonBox.select();
            document.execCommand('copy');
            status.textContent = t.copiedSelection;
        }
    });

    listen(document.getElementById('download'), 'click', () => {
        const blob = new Blob([toJson() + '\n'], {type: 'application/json'});
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = 'talisman_strokes.json';
        link.click();
        URL.revokeObjectURL(link.href);
    });

    listen(document.getElementById('load'), 'click', () => {
        let parsed;
        try {
            parsed = JSON.parse(jsonBox.value);
        } catch (error) {
            status.textContent = t.notJson(error.message);
            return;
        }
        // Accept both the bare strokes array and the whole pattern block, so a recipe can be pasted in as it is.
        const rows = Array.isArray(parsed) ? parsed : parsed.strokes;
        if (!Array.isArray(rows)) {
            status.textContent = t.noStrokesArray;
            return;
        }
        const loaded = [];
        for (const row of rows) {
            if (!Array.isArray(row)) { status.textContent = t.badRow; return; }
            const points = [];
            for (const pair of row) {
                if (!Array.isArray(pair) || pair.length !== 2 || !pair.every(Number.isFinite)) {
                    status.textContent = t.badPair;
                    return;
                }
                const [u, v] = pair;
                if (u < 0 || u > 1 || v < 0 || v > 1) {
                    status.textContent = t.outside;
                    return;
                }
                points.push({x: u * COLUMNS, y: v * ROWS});
            }
            loaded.push(points);
        }
        pushHistory();
        strokes = loaded;
        current = null;
        refresh();
        status.textContent = t.loaded(loaded.length);
    });

    document.getElementById('hint').textContent = t.hint(RESAMPLE_STEP + ' px', String(DEFAULT_TOLERANCE),
        DETAIL_PX.toFixed(1) + ' px');
    syncButtons();
    refresh();

    return {
        dispose: () => abort.abort(),
        api: {
            simplify,
            strokeLength,
            toJson,
            refresh,
            redraw,
            report
        }
    }
}
