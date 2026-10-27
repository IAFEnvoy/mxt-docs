---
title: /picker
---

# `/picker`

<div class="cmd-tree">

- `/picker [<category>]`

  打开物品选择器，列出所选分类对应的物品；`category` 是分类 ID（如 `mxt:aura`、`mxt:artifact`、`mxt:currency`、`mxt:item_binding`、`mxt:technique`），不填列出全部已登记分类。需要 gamemaster 权限，且只在创造模式下可用。

</div>

## 分类能列出什么

`/picker` 由 **Picker** 模组提供——本模组通过 `jarJar` 内置它，所以装本模组就有。界面长什么样、搜索怎么匹配、物品怎么拿出来，都归它，这里只写“分类能列出什么”。

`category` 是一张数据包注册表的 ID：按物品认领的表（`item_aura`、`item_binding`、`default_quality` 等用 `items`，`currency` 用 `item`）展开成它们认领到的物品，`block_aura` 与 `heat_source` 按 `blocks` 认领方块，一行就是那个方块；`spirit_herb` 按**果实**（`growth.drops`）展开，一行就是那件果实物品——那是 tooltip 与丹炉真正去问的那一堆；没写 `growth` 的草没有果实，退回它认领的方块对应的物品。分类按登记顺序是（前两个是 Picker 自己的内置分类）：

`minecraft:item`、`minecraft:block`、`mxt:item_aura`、`mxt:currency`、`mxt:spirit_herb`、`mxt:pill_binding`、`mxt:artifact`、`mxt:item_binding`、`mxt:weapon_binding`、`mxt:tool_binding`、`mxt:blueprint_binding`、`mxt:default_quality`、`mxt:block_aura`、`mxt:heat_source`、`mxt:pill`、`mxt:contract_type`、`mxt:secret_realm`、`mxt:formation`、`mxt:talisman`、`mxt:technique`、`mxt:alchemy_furnace`、`mxt:alchemy_wall_material`、`mxt:aura`、`mxt:spirit_root`、`mxt:physique`、`mxt:quality`。

`mxt:technique` 是分类，`mxt:technique_binding` **不是**：拿到一行的是功法本身，那一行是本体为它生成的载体（这条功法定义里 `carrier_item` 指定的物品，不写就是功法书），并且**已经带好 `mxt:technique` 组件**。见[功法绑定](/datapack/json/technique_binding#carrier)。
