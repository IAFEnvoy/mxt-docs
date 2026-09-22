---
title: Curios 槽位
---

# Curios 槽位

本模组为玩家提供两个 `back_weapon` 槽位、两个 `belt_item` 槽位与四个 `charm` 槽位。全部都是物理槽位，不创建 Curios cosmetic 槽位；背部和腰部物品渲染直接读取物理槽位，**`charm` 里的物品不渲染在角色身上**。

| 槽位 id | 格数 | 验证器 | 接收什么 |
| --- | :---: | --- | --- |
| `back_weapon` | 2 | `curios:tag`、`mxt:back_weapon_auto` | 物品标签里的物品，加上自动验证器放行的部分。 |
| `belt_item` | 2 | `curios:tag`、`mxt:belt_item_auto` | 同上。 |
| `charm` | 4 | `curios:tag`、`mxt:charm_artifact_auto` | 物品标签里的物品，加上声明了 `curios_equipable: true` 的法器。 |

三个槽位都注册给 `minecraft:player`。`back_weapon`/`belt_item` 的 `curios:tag` 标签里已经列了原版剑（腰带另有弓）与本模组自己的 `#mxt:back_equipable`、`#mxt:belt_equipable` 扩展标签；`charm` 用的是 Curios **内置**槽型，本模组不往 `curios:charm` 标签里塞东西。

`back_weapon` 和 `belt_item` 都保留 `curios:tag` 验证器，并额外使用一个由本模组注册的自动验证器：

- `mxt:back_weapon_auto`
- `mxt:belt_item_auto`

服务端配置的**「饰品栏」标签页**控制自动验证范围，改完由服务端同步给客户端：

| 条目 | 默认 | 可选值 |
| --- | --- | --- |
| 背部槽位 | 手动 | 手动 / 仅武器 / 全部 |
| 腰部槽位 | 手动 | 手动 / 武器与灵宝 / 全部 |
| 强制渲染 | 关 | 开 / 关 |

**背部槽位**可选**手动**、**仅武器**、**全部**：

- **手动**：自动验证不允许额外物品，只有 `curios:tag` 允许的物品可放入。
- **仅武器**：在 tag 物品之外，允许匹配 `weapon_binding` 的物品。
- **全部**：在 tag 物品之外，允许所有物品。

**腰部槽位**可选**手动**、**武器与灵宝**、**全部**：

- **手动**：只允许 `curios:tag`。
- **武器与灵宝**：额外允许已匹配 `weapon_binding` 的武器，以及 `artifact` 里声明了 `curios_equipable: true` 的法器。判断依据是定义本身，不是物品堆上有没有法器状态。
- **全部**：在 tag 物品之外，允许所有物品。

### `charm` 槽位（四个）

四个 `charm` 槽位直接用 **Curios 内置的 `charm` 槽型**：本模组只在它上面补了格数（4）和一个自动验证器 `mxt:charm_artifact_auto`，槽位名字与图标仍由 Curios 提供（`curios.identifier.charm`、`curios:slot/empty_charm_slot`）。它只接收 `artifact` 里声明了 `curios_equipable: true` 的法器，**没有对应的服务端配置项**——要让别的物品也能放进去，就把物品加进 `curios:charm` 物品标签（`curios:tag` 验证器仍然生效）。放在槽里的法器照常生效：它授予的被动／主动技能与其他 Curios 物品走同一条同步，脱下即回收。这四格不渲染，也没有快捷交换。

> Curios 的槽位 id 是全局字符串，同 id 的定义会合并，所以这 4 格是给整个整合包的 `charm` 槽型定的：别的模组的 charm 物品同样共享它们。

三个验证器都是“额外允许”逻辑，不会覆盖或修改 `curios:tag`。其他模组也可以通过 Curios API 注册自己的 validator，但不能通过数据包创建新的验证算法。

Curios 的槽位界面按钮会控制每个槽位的 `getRenders()` 状态以及槽位整体的可见状态；本模组的背部和腰部渲染会遵守这些状态。服务端配置「饰品栏 → 强制渲染」打开时，仅强制显示本模组的背部和腰部槽位，不影响其他模组槽位。
