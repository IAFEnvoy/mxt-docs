---
title: 内置物品
---

# 内置物品

MiXianTu 不为每个玩法预设具体数值，但提供少量通用承载物品和组件。数据驱动物品玩法通常通过绑定表或物品键注册表挂到现有物品上（见[物品绑定](/datapack/json/item_binding)）。

## 通用物品

当前内置内容包括灵石系列、灵铁锭、灵木、朱砂、符纸、符箓、契约卷轴、召回符、御兽铃、令牌、灵石袋、戒指、锻造台、丹炉部件、丹药载体、药渣、杂质、奖励箱和展示架等。具体注册名以 `src/main/java/com/iafenvoy/mxt/registry` 和资源文件为准。

## 灵气物品

`item_aura` 注册表给一件物品可释放的灵气容量、消耗速度、完成行为和可选 `result_stack`。修炼时会整组取出物品，容量、消耗速度和释放速度均按堆叠数量叠加，因此总消耗时间不变。物品剩余灵气保存在 `item_aura` 组件中，容量始终由数据包动态计算。

| 物品 | 默认货币值 | 框架定位 |
|---|---|---|
| 下品灵石 | 1 | 基础灵气媒介与交易单位 |
| 中品灵石 | 10 | 压缩的基础灵石 |
| 上品灵石 | 100 | 高阶交易与高消耗系统的默认媒介 |
| 极品灵石 | 1000 | 稀有的高价值媒介 |
| 支票 | 由物品组件决定 | 现有交易系统的可签发价值载体 |

::: warning

灵石只有在充满灵气时才有价值

:::

## 空白载体与固定材料

以下物品同样都是普通 `Item`，没有本体行为；它们的用途由绑定表、物品键注册表、组件、数据包和 KubeJS 决定。方块与已经存在的四阶灵石不在此表重复列出。

| 分类 | 物品 |
| --- | --- |
| 基础材料 | `mxt:spirit_iron_ingot`、`mxt:spirit_iron_nugget`、`mxt:spirit_wood`、`mxt:spirit_wood_core`、`mxt:cinnabar`、`mxt:alchemy_dregs`、`mxt:impurity` |
| 空白载体 | `mxt:spirit_ring`、`mxt:spirit_stone_bag` |
| 身份与记录 | `mxt:wooden_token`、`mxt:stone_token`、`mxt:blank_talisman` |
| 固定道具 | `mxt:contract_scroll`、`mxt:recall_talisman`、`mxt:beast_taming_bell` |

## 统一功能载体

以下物品由本体提供统一服务端实现。物品只保存数据包 Holder 或持久化状态，不复制对应模块的规则；具体契约、阵法、秘境和资源数值仍由数据包定义。它们各自组件怎么手写见[数据组件](/technical/data-components)。

| 物品 | 持久化组件 | 统一行为 |
| --- | --- | --- |
| 契约卷轴 | `mxt:contract_scroll` | 保存契约类型，对生物使用时校验并签订契约。 |
| 御兽铃 | `mxt:contract_bell` | 保存"对准的那只灵宠"，可打开轮盘「契约灵兽」发送命令。 |
| 灵兽袋 | `mxt:spirit_beast` | 保存一只已契约生物的完整持久化实体数据。对灵宠右键收纳，对着方块右键在方块上方放出。 |
| 阵盘 | `mxt:formation_plate` | 保存允许激活哪些阵法与当前选中的，没绑定阵法时默认均可激活。对方块使用后自动识别并激活阵法。 |
| 秘境令牌 | `mxt:secret_realm_token` | 右键召唤通往绑定秘境的门；秘境中召返回门，接触后按进出条件与成员上限传送。 |
| 奖励箱 | `mxt:reward_box` | 保存一张掉落物表的 id；右键按这张表抽一次，抽到的东西直接进背包。 |
| 裂隙编辑器 | `mxt:rift` | 与裂隙锚共用平面门编辑器，需要 2 级 OP。见[裂隙](./rift.md)。 |
| 灵力容器 | `mxt:resource_capacity` <br> `mxt:resource_container` | 保存任意 `resource`，每种资源各自一份上限（上限表里没写的资源存不进）；**按住右键**把它倒进持有者账户（每 tick 每种资源 1 单位）；往里灌靠展示架的灵力射线，或者**把它拿在主手发射灵力**（那一次灵力直接充进容器，不射出射线）。 |
| 功法书 | `mxt:technique` | 保存一份 `technique` 定义，长按后可学习功法。 |
| 玉简 | `mxt:stored_text` <br> `mxt:jade_slip_reading` | 存一段文字，长按打印到聊天栏。 |
| 木/石令牌 | `mxt:token` | 统一承载 `kind`、`value`、`owner`，供秘境和交易等权限系统共用。**在铁砧里给它改名即认主**。 |
| 鉴定镜 | `mxt:identification` | 统一解析带有鉴定组件的物品；具体待鉴定物品由内容包或其他模组提供。 |
| 灵根 | `mxt:spirit_root` | 保存一份 `spirit_root` 定义；右键获得这条灵根。 |
| 体质 | `mxt:physique` | 保存一份 `physique` 定义；右键获得这项体质。 |
| 符笔 |`mxt:brush_pigment` | 符笔装自己的颜料存量，符笔在物品栏中点击颜料即可添加颜料。（见[符笔与颜料](./alchemy-and-brush.md#符笔与颜料)） |
| 符箓 | `mxt:talisman` <br> `mxt:spirit_storage` | 保存**已铭刻的那条符箓**，根据符箓类型的不同点击或者长按即可使用。 |

## 另见

- 裂隙与裂隙锚的完整机制见[裂隙](./rift.md)。
- 管理单个裂隙的命令见[命令](./commands/mxt.md)。
