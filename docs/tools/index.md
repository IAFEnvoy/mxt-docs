---
title: 工具
description: 两台写数据包时用得上的编辑器，在浏览器里跑，写出来的就是定义文件能直接读的 JSON。
---

# 工具

这两页是给写数据包的人用的编辑器。它们不连游戏，只把一份定义里最难手写的那部分画出来，再把结果写成可以直接贴进 JSON 的文本。

| 工具 | 写的是什么 | 打开 |
| --- | --- | --- |
| 阵法图形编辑器 | 一份 `mxt:formation_shape` 的 `strokes` | [阵法图形编辑器](formation-figure.md) |
| 符箓笔画编辑器 | 一份 `mxt:talisman_drawing` 的 `pattern.strokes` | [符箓笔画编辑器](talisman-strokes.md) |

两台都在页面里跑，不用下载、不用构建。画完点 `Copy JSON` 或 `Download JSON` 拿走结果，`Load from JSON` 可以把写过的文件读回来接着改。

编辑器只负责形状。阵法图形里不写 `duration_ticks`（那是 `mxt:particle` 模块的字段），符箓笔画里不写 `tolerance` / `guide` / `show_order`（那是符方的字段）——这些仍然要你自己写进 JSON。
