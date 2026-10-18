/*
 * Every string the figure editor shows. `labels` holds the fixed text that sits in the markup (keyed by that text, so
 * the English side needs no map at all), and the rest are the strings the editor builds — the status line, the readouts,
 * the warnings. `mount()` takes a locale name and reads this table.
 */

export const en = {
  labels: {},
  hint: (points, radius, cap) =>
    'This figure asks ' + points + ' points at radius ' + radius + ' and one stroke is capped at ' + cap + ' points.',
  opened: 'opened on the {5/2} star: the ring plus one pentagram, which is the mod\'s `five`',
  rampStops: n => 'a ramp of ' + n + ' stops: click to add, drag a marker to move it',
  painted: (index, paint) => 'stroke ' + index + ' is painted ' + paint,
  stats: (count, length, points, progress, radius, spacing) => 'strokes: ' + count
    + '    length: ' + length + ' R'
    + '    drawn now: ' + points + ' points at progress ' + progress
    + ' at radius ' + radius + ' / ' + spacing,
  spacing: value => 'spacing ' + value,
  spacingPerStroke: 'spacing per stroke',
  clock: (drawn, ticks) => drawn + ' / ' + ticks + ' ticks',
  circleRadius: r => 'circle r ' + r,
  polylinePoints: n => 'polyline ' + n + ' pts',
  listRow: (index, kind, length, points) => '#' + index + '  ' + kind + '  ' + length + ' R  ' + points + ' pts',
  selectedStroke: (index, kind) => '#' + index + ' ' + (kind === 'circle' ? 'circle' : 'polyline'),
  nothingSelected: 'nothing selected',
  reverseTitle: 'Reverse this stroke, so it grows the other way round',
  removeTitle: 'Remove this stroke',
  pointReadout: (x, z, r, angle) =>
    'pointer: x ' + x + '  z ' + z + '    r ' + r + '    angle ' + angle + '°',
  strokeName: n => 'Stroke ' + n,
  noStrokes: 'There are no strokes, so there is nothing to draw.',
  noRadius: name => name + ' is a circle with no radius.',
  onePoint: name => name + ' has one point; a stroke needs at least two.',
  windowClosed: name => name + ' has a window that never opens (start is not below end), so it is never drawn.',
  emptyStrokes: n => n + ' stroke(s) have no length and would draw nothing.',
  cappedStrokes: (n, cap) => n + ' stroke(s) want the whole ' + cap
    + ' point ceiling at this radius and their own spacing, so their far end is dropped.',
  nothingDropped: 'Nothing here would be dropped at this radius and spacing.',
  play: 'Play',
  stop: 'Stop',
  noRadiusStatus: 'a circle needs a radius',
  tooFewPoints: 'a stroke needs at least two points',
  added: kind => 'added a ' + (kind === 'circle' ? 'circle' : 'polyline'),
  modeInstruction: mode => mode === 'circle' ? 'press where the centre goes, drag out the radius' : 'click vertices',
  cleared: 'cleared',
  star: (count, step, ring) => 'figure replaced with the {' + count + '/' + step + '} star' + (ring ? ' and its ring' : ''),
  ngon: count => 'added a ' + count + '-gon',
  rays: count => 'added ' + count + ' rays, one per division, the first due east',
  copied: n => 'copied ' + n + ' strokes',
  copiedSelection: 'copied (via the text selection)',
  notJson: message => 'that is not JSON: ' + message,
  noStrokesArray: 'no strokes array in that JSON',
  loaded: (n, renamed) => 'loaded ' + n + ' strokes'
    + (renamed ? ' (' + renamed + ' written without a namespace, read as mxt:…)' : '')
}

export const zh = {
  labels: {
    'Polyline': '折线',
    'Circle': '圆',
    'click vertices, Enter / right click ends · drag a vertex, a circle\'s centre or its rim to move it':
      '点出顶点，Enter / 右键收笔 · 拖顶点、圆心或圆周可以改形状',
    'snap': '吸附',
    '0.05 grid': '0.05 网格',
    'ring r = 1': '环 r = 1',
    'divisions N': 'N 等分',
    'show': '显示',
    'grid': '网格',
    'rays': '射线',
    'dust': '尘埃',
    'stroke order': '笔序',
    'lines': '描线',
    'generate': '生成',
    'with the ring': '带上环',
    'Star N/K': 'N/K 星形',
    'N-gon': 'N 边形',
    'Rays': '射线',
    'Undo': '撤销',
    'Redo': '重做',
    'Clear': '清空',
    'paint': '上色',
    'solid': '纯色',
    'gradient': '渐变',
    '+ stop': '+ 节点',
    '− stop': '− 节点',
    'new strokes': '新笔颜色',
    'one stroke': '单笔',
    'growth': '生长',
    'speed': '速度',
    'loop': '循环',
    'array': '阵法',
    'decimals': '小数位',
    'Copy JSON': '复制 JSON',
    'Download JSON': '下载 JSON',
    'Load from JSON': '从 JSON 载入',
    'pointer: —': '指针：—'
  },
  hint: (points, radius, cap) =>
    '这幅图要 ' + points + ' 个点（半径 ' + radius + '，按每笔自己的疏密），单笔封顶 ' + cap + ' 点。',
  opened: '打开的是 {5/2} 星：外环加一个五角星，就是本体自带的 `five`',
  rampStops: n => n + ' 个节点的渐变：点一下加节点，拖标记移动节点',
  painted: (index, paint) => '第 ' + index + ' 笔上色为 ' + paint,
  stats: (count, length, points, progress, radius, spacing) => '笔数：' + count
    + '    长度：' + length + ' R'
    + '    当前画到 ' + points + ' 点，进度 ' + progress
    + '，半径 ' + radius + '，' + spacing,
  spacing: value => '疏密 ' + value,
  spacingPerStroke: '按每笔疏密',
  clock: (drawn, ticks) => '已画 ' + drawn + ' / ' + ticks + ' tick',
  circleRadius: r => '圆 r ' + r,
  polylinePoints: n => '折线 ' + n + ' 点',
  listRow: (index, kind, length, points) => '#' + index + '  ' + kind + '  ' + length + ' R  ' + points + ' 点',
  selectedStroke: (index, kind) => '#' + index + ' ' + (kind === 'circle' ? '圆' : '折线'),
  nothingSelected: '没有选中',
  reverseTitle: '把这一笔倒过来，生长方向也跟着倒',
  removeTitle: '删掉这一笔',
  pointReadout: (x, z, r, angle) =>
    '指针：x ' + x + '  z ' + z + '    r ' + r + '    角度 ' + angle + '°',
  strokeName: n => '第 ' + n + ' 笔',
  noStrokes: '一笔都没有，没什么可画。',
  noRadius: name => name + ' 是半径不大于 0 的圆。',
  onePoint: name => name + ' 只有一个点，一笔至少要两个点。',
  windowClosed: name => name + ' 的生长窗口没有打开（start 不小于 end），永远不会画出来。',
  emptyStrokes: n => n + ' 笔没有长度，画不出任何东西。',
  cappedStrokes: (n, cap) => n + ' 笔在这个半径与自己的疏密下要满 ' + cap + ' 点的上限，远端会被丢掉。',
  nothingDropped: '这个半径与疏密下不会丢掉任何点。',
  play: '播放',
  stop: '停止',
  noRadiusStatus: '圆要有半径',
  tooFewPoints: '一笔至少要两个点',
  added: kind => (kind === 'circle' ? '加了一笔圆' : '加了一笔折线'),
  modeInstruction: mode => mode === 'circle' ? '按下处是圆心，拖出半径' : '点出各个顶点',
  cleared: '已清空',
  star: (count, step, ring) => '图形换成了 {' + count + '/' + step + '} 星' + (ring ? '，连同外环' : ''),
  ngon: count => '加了一个 ' + count + ' 边形',
  rays: count => '加了 ' + count + ' 根射线，每等分一根，第一根正东',
  copied: n => '已复制 ' + n + ' 笔',
  copiedSelection: '已复制（走文本选择）',
  notJson: message => '这不是 JSON：' + message,
  noStrokesArray: '这份 JSON 里没有 strokes 数组',
  loaded: (n, renamed) => '载入 ' + n + ' 笔'
    + (renamed ? '（其中 ' + renamed + ' 笔没写命名空间，按 mxt:… 读了）' : '')
}
