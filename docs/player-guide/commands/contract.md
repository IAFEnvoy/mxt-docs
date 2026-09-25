---
title: /contract
---

# `/contract`

| 命令 | 作用 |
| --- | --- |
| `/contract list [<player>]`（= `/mxt contract list`） | 按**主人索引**列出该玩家名下的灵兽：契约类型、灵兽 UUID，以及它此刻是否已加载；不填 `player` 时看自己，不需要权限。索引是名单不是真值，所以每一行都会回查灵兽身上的契约记录，已经对不上的行当场清掉。 |
| `/contract info <target>`（= `/mxt contract info`） | 读目标身上的契约记录：类型、主人、签订时刻、召回状态与冷却剩余、当前行为。不需要权限。 |
| `/contract bind <player> <target> <contract_type> [force]`（= `/mxt contract bind …`） | 让 `<player>` 与目标生物签订契约（需要 gamemaster 权限），与契约卷轴走完全同一条流程，代价由该玩家支付；`force` 跳过代价与每人上限。 |
| `/contract break <target> [force]`（= `/mxt contract break …`） | 解除目标身上的契约（需要 gamemaster 权限），灵宠还活着；`force` 跳过"必须是主人"的校验。 |
| `/contract recall <target> [force]`（= `/mxt contract recall …`） | 让目标响应召回，等同于在御兽铃轮盘上点它的「召回」；`force` 跳过召回冷却。 |
| `/contract behavior <target> <behavior> [force]`（= `/mxt contract behavior …`） | 给目标下一条行为命令（需要 gamemaster 权限），与御兽铃轮盘走完全同一条流程。`behavior` 是代码里的行为 id，默认有 `mxt:follow` / `mxt:wander` / `mxt:stay` / `mxt:recall`（补全给的就是这一份），目标没提供这条命令时报"它不接受这道命令"；`mxt:recall` 是**一次性**的，等价于上面的 `recall`。`force` 跳过"必须是主人"的校验（召回时也跳过冷却）。 |

## 谁能被契约

**能不能被契约是代码事实**：目标生物必须自己实现 `com.iafenvoy.mxt.api.Contractable`（见[特殊公开接口](/java/interfaces)）。数据包造不出这个资格，所以**原版生物默认都签不了**——对着一只狼用 `bind` 会得到"它不能被契约"。

数据包能做的是**收窄**：[contract_type](/datapack/json/contract_type) 可以用自己的**实体类型标签** `#<命名空间>:contract/<路径>` 限定"这一类生物签不签这份契约"，可以用 `owner_condition` / `creature_condition` 限定双方，也可以用 `costs` 收代价。**没写这个标签、或标签写成空的，都表示不限制**（在实现接口的生物里谁都签得了）。

## 签订一步的顺序

`bind`（以及契约卷轴）按固定顺序问，**收钱排在最后**：

1. 它已经有契约了？→ 它不能被契约？→ 这份契约类型被 `#mxt:disabled` 停用了？
2. 接口的 `acceptsContract` → `owner_condition` → `creature_condition` → 每人上限 `max_owned`；
3. `Pre` 事件（可取消，**此时一分钱没花**）；
4. `costs` 付款 → 写记录 → 写主人索引 → 生物的 `onContractBound`。

代价由**主人**支付，可以用主人的资源账户、背包与脚本通道（灵宠不付）。把付款排在事件之后是因为脚本通道退不了款：取消之后再还钱是做不到的。

## 解除与死亡是两条路

`break` 让灵宠**活着**离开契约：执行契约类型的 `release_action`，回调生物的 `onContractReleased`，然后清掉记录与主人索引。灵宠自己死亡走另一条：执行 `death_action`，回调 `onContractDeath`，同样清记录与索引，内丹照常掉落（额外战利品由原版战利品表负责，见[生物档案](/datapack/json/creature_profile)）。**两个动作字段各自只负责一个时刻**，不会有一个动作同时管两件事。

## 召回

`recall` 只是**置上召回闩**（和摇御兽铃一模一样），真正的移动发生在灵宠的下一个 tick，由它自己实现的操作接口落地——默认实现就是传送到主人身边。契约类型的 `recall_cooldown` 是两次召回之间的最短间隔，按记录里的时间戳判定；`force` 是管理员对这段等待的绕过。主人离线或不在同一维度时，闩会一直留着，等主人回来才落地。

## 行为（order）

主人能给灵宠下的命令是 **跟随 / 游荡 / 驻守 / 召回** 四条，它们是**生物自己的代码**回答的（`ContractOperations.behaviors()`），不是数据包字段；内容模组可以自己再加一条。**当前那条只有一份**，记在灵宠的契约记录里，旧存档或读不出来的 id 一律按"跟随"处理。

玩家的入口是**御兽铃**：右键一只自己的已契约灵宠＝把铃对准它（铃会记住它的名字与它认的命令），再右键空处＝打开轮盘并停在「契约灵兽」那一页，点哪一格就下哪条命令——**跟随 / 游荡 / 驻守**是常驻的（换一条就覆盖上一条），**召回**是一次性的（执行完当前命令不变）。这组 `behavior` 命令是同一件事的管理员入口。契约类型的 `follow_action` 只在**当前是跟随**时跑。

## 捕捉是物品的事

**捕捉不是实体侧的门槛**：任何生物都可能被捕捉，**怎么捕捉由物品决定**——能装什么、要不要契约、代价多少，全是那个物品自己的规则。灵兽袋自己的规则是"你自己的已契约灵兽、一次一只"。生物只有在实现 `CaptureListener` 时才会收到"被收走 / 被放出"的通知（`onCaptured` / `onReleased`），**不实现它照样能被收走**，只是收不到通知。

## 失败原因

卷轴、御兽铃、灵兽袋与这组命令打的是**同一张**文案表，键是 `contract.mxt.failure.<小写枚举名>`：`already_bound`、`disabled`、`not_contractable`、`owner_conditions`、`creature_conditions`、`limit_reached`、`insufficient_cost`、`not_bound`、`not_owner`、`recall_cooldown`、`cancelled`、`unsupported_behavior`（这只生物不认这条命令）、`behavior_refused`（它认，但拒绝了这次）。
