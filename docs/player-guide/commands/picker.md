---
title: /picker
---

# `/picker`

| 命令 | 作用 |
| --- | --- |
| `/picker [<category>]`（= `/mxt picker`） | 打开物品选择器，列出所选数据包注册表定义对应的物品；`category` 是注册表 ID（如 `mxt:aura`、`mxt:artifact`、`mxt:currency`、`mxt:item_binding`、`mxt:technique`），不填列出全部已注册分类。需要 gamemaster 权限，且只在创造模式下可用。 |

## `/picker`

`/picker [<category>]` 打开一个仿原版创造模式搜索页的客户端界面：标题、搜索框、五乘九的可滚动网格，下面是玩家真正的快捷栏。网格里的条目是模组数据包定义对应的物品，加上原版物品与方块注册表，所以它是"看看内容包到底注册了什么"的窗口，而不是创造模式物品栏的副本。

已注册的分类按顺序是：

`minecraft:item`、`minecraft:block`、`mxt:item_aura`、`mxt:currency`、`mxt:spirit_herb`、`mxt:item_binding`、`mxt:weapon_binding`、`mxt:pill_binding`、`mxt:technique`、`mxt:artifact`、`mxt:contract_type`、`mxt:secret_realm`、`mxt:formation`、`mxt:talisman`、`mxt:aura`、`mxt:block_aura`、`mxt:quality`。

注意 `mxt:technique` 是分类，`mxt:technique_binding` **不是**：拿到一行的是功法本身，那一行是本体为它生成的载体（这条功法定义里 `carrier_item` 指定的物品，不写就是玉简），并且**已经带好 `mxt:technique` 组件**。见[功法绑定](/datapack/json/technique_binding#carrier)。

不写参数时会遍历所有分类。自己没有物品的定义会显示在一件替代物品上（灵石、契约卷轴、秘境令牌、阵盘、符箓载体或鉴定镜），这一行除了堆本身的样子，还能用定义名与注册表 ID 搜到；按物品匹配的注册表会展开成它们指到的那些物品。

搜索框按空白切分，每个词都要命中：以 `@` 开头的词只匹配物品命名空间，其它词是行内名字的子串。物品离开界面的方式和创造模式物品栏完全一样——拿进快捷栏或丢出面板——所以走的是原版创造模式通道，玩家不在创造模式时服务端会拒绝。命令本身需要执行者是玩家、有 `gamemaster` 权限，并且在创造模式下。
