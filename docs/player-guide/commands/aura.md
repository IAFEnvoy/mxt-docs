---
title: /aura
---

# `/aura`

| 命令 | 作用 |
| --- | --- |
| `/aura`（= `/mxt aura`） | 打开灵气快捷栏配置界面。 |
| `/aura query [type]`（= `/mxt aura query [type]`） | 查询当前位置灵气；`type` 是**灵气 ID**（`mxt:aura` 的条目，补全给的就是它），不填时显示全部灵气，并在名字后附带该灵气的元素标记。 |
| `/aura query element <element>`（= `/mxt aura query element …`） | 按**元素**查询：把这个位置上所有元素标记为该元素的灵气汇总列出（元素被停用时不参与）。补全来自 `mxt:element`。 |
| `/aura vein`（= `/mxt aura vein`） | 查询当前位置灵石矿脉等级。 |
| `/aura cache clear [radius]`（= `/mxt aura cache clear [radius]`） | 清除并立即重建周围已加载区块的子区块灵气缓存；半径按区块计算，默认 3，范围 0–32。 |
