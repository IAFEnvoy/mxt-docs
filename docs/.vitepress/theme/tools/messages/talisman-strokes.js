/*
 * Every string the stroke editor shows. `labels` holds the fixed text that sits in the markup (keyed by that text, so
 * the English side needs no map at all), and the rest are the strings the editor builds — the status line, the readout,
 * the warnings. `mount()` takes a locale name and reads this table.
 */

export const en = {
  labels: {},
  hint: (resample, tolerance, detail) => 'Paste this as the value of `pattern.strokes`. The scorer resamples every '
    + resample + ' and drops detail finer than 0.5 × the ' + tolerance
    + ' tolerance, which is ' + detail + ' at the default.',
  stats: (count, max, points, length) => 'strokes: ' + count + ' / ' + max
    + '    points: ' + points
    + '    ink length: ' + length + ' px (≈ that many pigment points)',
  noStrokes: 'No strokes yet: a pattern needs at least one.',
  tooManyStrokes: max => 'The loader takes at most ' + max + ' strokes.',
  onePoint: n => 'Stroke ' + n + ' has one point; every stroke needs at least two.',
  tooManyPoints: (n, max) => 'Stroke ' + n + ' has more than ' + max + ' points.',
  samePlace: 'Every point is in the same place; a pattern like that is rejected at load.',
  accepted: 'The recipe loader would accept this shape.',
  listRow: (index, points, px) => '#' + index + '  ' + points + ' pts  ' + px + ' px',
  removeTitle: 'Remove this stroke',
  tooFewPoints: 'a stroke needs at least two points',
  pointReadout: (x, y, u, v) => 'pointer: x ' + x + '  y ' + y + '    u ' + u + '  v ' + v,
  copied: n => 'copied ' + n + ' strokes',
  copiedSelection: 'copied (via the text selection)',
  notJson: message => 'that is not JSON: ' + message,
  noStrokesArray: 'no strokes array in that JSON',
  badRow: 'every stroke has to be an array of points',
  badPair: 'every point has to be a pair of finite numbers',
  outside: 'a point is outside [0,1]²',
  loaded: n => 'loaded ' + n + ' strokes'
}

export const zh = {
  labels: {
    'Polyline (click to add, Enter / right click to end)': '折线（点击加点，Enter / 右键收笔）',
    'Freehand (drag)': '手绘（拖动）',
    'Snap to whole pixels': '对齐整格',
    'Grid': '网格',
    'Stroke order': '笔序',
    'Simplify ε': '简化 ε',
    'px': '像素',
    'Simplify all': '全部简化',
    'Zoom': '缩放',
    'Decimals': '小数位',
    'Undo': '撤销',
    'Redo': '重做',
    'Clear': '清空',
    'Copy JSON': '复制 JSON',
    'Download JSON': '下载 JSON',
    'Load from JSON': '从 JSON 载入',
    'pointer: —': '指针：—'
  },
  hint: (resample, tolerance, detail) => '粘到 ' + '`pattern.strokes` 里。判分每 ' + resample
    + ' 重采样一次，按 ' + tolerance + ' 的 0.5 倍简化（默认 ' + detail + '），比这更细的点留不下来。',
  stats: (count, max, points, length) => '笔数：' + count + ' / ' + max
    + '    点数：' + points
    + '    墨长：' + length + ' 像素（≈ 要付这么多颜料点）',
  noStrokes: '还没有笔画：一份图案至少要有一笔。',
  tooManyStrokes: max => '加载器最多收 ' + max + ' 笔。',
  onePoint: n => '第 ' + n + ' 笔只有一个点，每一笔至少要两个点。',
  tooManyPoints: (n, max) => '第 ' + n + ' 笔超过 ' + max + ' 个点。',
  samePlace: '所有点都在同一处，这样的图案加载时会被拒。',
  accepted: '符方加载器会收下这个形状。',
  listRow: (index, points, px) => '#' + index + '  ' + points + ' 点  ' + px + ' 像素',
  removeTitle: '删掉这一笔',
  tooFewPoints: '一笔至少要两个点',
  pointReadout: (x, y, u, v) => '指针：x ' + x + '  y ' + y + '    u ' + u + '  v ' + v,
  copied: n => '已复制 ' + n + ' 笔',
  copiedSelection: '已复制（走文本选择）',
  notJson: message => '这不是 JSON：' + message,
  noStrokesArray: '这份 JSON 里没有 strokes 数组',
  badRow: '每一笔都要是点的数组',
  badPair: '每个点都要是两个有限数字',
  outside: '有点跑到 [0,1]² 外面了',
  loaded: n => '载入 ' + n + ' 笔'
}
