---
title: contract_type（契约类型）
aside: false
---

# contract_type（契约类型） {#contract_type}

::: warning 已标记为将来可能移除

`ContractType` 上是 `//TODO::May be removed`。契约的**资格**本就不由数据决定（由实体实现 `Contractable` 决定），**主人**也交给生物自己回答（原版 `OwnableEntity`），所以这个注册表剩下的只是双方条件、四个时刻的动作、签订代价与两个上限；若将来这部分也改由生物自己声明，它会连同 `ContractAttachment` 里的类型字段、`ContractService` 的绑定与解除路径、`/contract` 命令一起消失。**现在声明它是完全受支持的**，只是不要把它当成不会变的地基。

:::

文件位置：`data/<namespace>/mxt/contract_type/<path>.json`

**用途**：契约生命周期。**已标记为将来可能移除。**

**谁能签由代码决定**：目标生物必须实现 `com.iafenvoy.mxt.api.Contractable`（见[特殊公开接口](../../java/interfaces)），数据包无法给一个实体加上契约资格。它同时是原版的 `OwnableEntity`，所以**主人由生物自己回答**（本体不存主人）。数据包能做的是三件事：用下面的 `*_condition` 收窄双方条件、用 `costs` 收代价、用**实体类型标签**收窄名单——标签与契约类型同 id，写作 `#<命名空间>:contract/<路径>`（文件 `data/<命名空间>/tags/entity_type/contract/<路径>.json`）；**没写这个标签、或标签是空的，都表示不限制**。

| 字段 | 类型 | 默认 | 说明 |
| --- | --- | --- | --- |
| `name` | Text Component | `contract_type.mxt.<命名空间>.<路径>` | 可选显示名。省略时用左列的默认键。 |
| `description` | Text Component | `contract_type.mxt.<命名空间>.<路径>.description` | 可选描述。省略时用左列的默认键；目前只被存储与读取，还没有界面绘制它。 |
| `owner_condition` | `EntityCondition` | `mxt:always_true` | 主人条件。 |
| `creature_condition` | `EntityCondition` | `mxt:always_true` | 灵宠条件（资格接口之后判定）。 |
| `follow_action` | `EntityAction` | `mxt:no_op` | **当前命令是「跟随」时**每 tick 执行；只对实现 `ContractOperations` 的实体生效（见 [特殊公开接口](/java/interfaces)）。 |
| `combat_action` | `BiEntityAction` | `mxt:no_op` | 灵宠打出伤害、结算之后执行。 |
| `release_action` | `EntityAction` | `mxt:no_op` | **解除契约**（主人主动解除）时执行，灵宠还活着。 |
| `death_action` | `EntityAction` | `mxt:no_op` | **灵宠死亡**带动契约结束时执行。解除与死亡是两个字段。 |
| `costs` | `Cost[]` | `[]` | 签订代价，由**主人**支付；排在全部条件与 `Pre` 事件之后，付不出就不签、也不扣。 |
| `max_owned` | int | `0` | 每个主人同时能持有的本类型契约数，`0` = 不限。 |
| `recall_cooldown` | int | `0` | 召回冷却（tick），`0` = 不限；作用于御兽铃轮盘/命令下的那条「召回」命令。 |

**行为（order）不是这里的数据包字段**：主人能给灵宠下的命令（跟随 / 游荡 / 驻守 / 召回）由**生物自己的代码**回答，内容模组可以自己再加一条；当前那条记在灵宠的契约记录里，旧存档与读不出来的 id 都按「跟随」处理。见 [命令](/player-guide/commands/contract) 与 [特殊公开接口](/java/interfaces)。

