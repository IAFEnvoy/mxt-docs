---
title: /aura
---

# `/aura`

查询当前位置的灵气、元素归属与灵石矿脉，并清理子区块缓存。每个节点也可以写成 `/mxt aura …`。

<div class="cmd-tree">

- `/aura ...`

  - `... query [type]`

    查询当前位置的灵气。`type` 是**灵气 ID**（`mxt:aura` 的条目，补全给的就是它）；不填时列出全部灵气，并在名字后附带该灵气的元素标记。

  - `... query element <element>`

    按**元素**查询：把这个位置上所有元素标记为该元素的灵气汇总列出。补全来自 `mxt:element`。

  - `... vein`

    查询当前位置的灵石矿脉等级。

  - `... cache clear [radius]`

    清除并立即重建周围已加载区块的子区块灵气缓存；半径按区块计算，默认 3，范围 0–32。

</div>

单独打出 `/aura` 什么都不做，查询都挂在 `query` 与 `vein` 上。
