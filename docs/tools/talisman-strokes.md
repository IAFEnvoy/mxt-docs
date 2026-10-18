---
title: 符箓笔画编辑器
description: 在符纸自己的画布上画出 mxt:talisman_drawing 的 pattern.strokes，顺带报出加载期会拒收的问题。
aside: false
---

# 符箓笔画编辑器

一张符方的 `pattern.strokes` 就是一串笔画，每一笔是一串点，点都按固定的 `90 × 210` 画布归一化到 `[0,1]²`。这台编辑器画的就是它：棋盘用的正是那个比例、纸 `#FFFE85` 与墨 `#FF0000`（符方类型的两个默认色），所以看起来和画符台上的纸一样。

<div class="mxt-tool-open"><a href="/tools/talisman-strokes-full" target="_blank" rel="noopener">在新窗口打开编辑器</a></div>

<ToolFrame tool="talisman-strokes" host="mxt-tool-talisman" />

## 怎么画

- **折线**：点出各个顶点，`Enter`、右键或双击收笔，`Esc` 丢掉这一笔。
- **手绘**：按住拖着画，松手时按工具条上的 ε 做一次 Ramer-Douglas-Peucker 简化——判分本来就会丢掉这些点，留着只让符方更难读。
- `Ctrl+Z` / `Ctrl+Y` 撤销重做，列表里可以单删一笔，`Clear` 清空。
- `Snap to whole pixels` 对齐整格、`Grid` 画格线、`Stroke order` 显示每一笔的起点与序号（就是 `pattern.show_order: true` 让游戏画的那个）。
- `Load from JSON` 两种都收：单独一份笔画数组，或者整份 `pattern` 块。
- `Zoom` 只改显示倍数（画布本身仍是 `90 × 210`），`Decimals` 决定写进文件的坐标保留几位小数。

## 它在报什么

- **笔画序与墨量**：列表里每一笔的像素长度大约就是它要付的颜料点数——笔按画出来的长度扣，一个像素一点。
- **加载期的问题**：一笔少于两个点、整份超过 `256` 笔、单笔超过 `4096` 个点、点云完全没有铺开（所有点挤在一处），都是符方加载时会被拒的形状。编辑器先一步报出来，省得等你进游戏才看到定义加载失败。

判分把平移与缩放归一化掉，但**不归一化旋转**——所以这一笔画在哪儿、画多大都不影响得分，画歪了就影响。判分每 `2` 像素重采样一次，并按 `0.5 × tolerance`（默认 `0.06` 时是 `6.3` 像素）简化，比这更细的点留不下来。

## 写出来的是什么

```json
[
  [[0.5, 0.05], [0.5, 0.95]],
  [[0.1, 0.5], [0.9, 0.5]]
]
```

这一串直接作为 `pattern.strokes` 的值。编辑器只写形状：`pattern.tolerance`、`pattern.guide`、`pattern.show_order` 是符方自己的字段，还有 `talisman`、`result` 与各档完成度，都要你自己写。

## 接下来

- [talisman_drawing（符方）](../datapack/json/talisman_drawing.md) —— 符方的全部字段，含 `pattern` 与各档完成度。
- [写一张符方](../tutorial/author-a-talisman-drawing.md) —— 从一张符开始的完整流程。
- [画符判分](../technical/talisman-scoring.md) —— 判分怎么重采样、怎么归一化、怎么算分。
