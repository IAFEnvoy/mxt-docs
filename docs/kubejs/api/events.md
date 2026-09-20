---
title: MxtEvents：事件
---

# `MxtEvents`：事件

所有事件都注册在服务器事件组。订阅方式：

```js
MxtEvents.abilityUse(event => {
  if (event.isPre() && event.getAbility() === 'example:forbidden') {
    event.cancel()
  }
})
```

`event.cancel()` 会立即停止当前 KubeJS 监听链。只有底层是可取消 NeoForge 事件时才会取消 MXT 事务；非可取消阶段调用仅停止脚本监听，不会撤销已经发生的游戏行为。

## 专用事件包装

| 事件 | 阶段 | 可用方法 | 可修改内容 |
| --- | --- | --- | --- |
| `abilityUse` | `Pre`、`Post` | `getEntity()`、`getAbility()`、`isPre()`、`getPaidCosts()` | `Pre` 可取消。`getPaidCosts()` 在 `Pre` 返回空映射。 |
| `curseApply` | `Pre`、`Post` | `getCurse()`、`isPre()`、`getStacks()`、`setStacks(n)`、`getSource()`、`setSource(text)` | 仅 `Pre` 可取消和修改层数/来源；层数必须大于 0。对 `Post` 调用 setter 会抛异常。 |
| `resourceConsume` | `Pre`、`Post` | `isPre()`、`getAmounts()`、`setAmount(resource, amount)` | 仅 `Pre` 可取消和修改单项资源量；金额必须有限且大于 0。 |
| `auraZone` | `enter`、`leave`、`tick`、`override` | `getKind()`、`getSource()`、`getConcentration()`、`isCultivationSuppressed()`、`getOverrideZone()` | 仅 `override` 可取消。`getOverrideZone()` 非 override 时返回空字符串。 |
| `friendRelation` | 无（判断型事件） | `getJudgeId()`、`getJudge()`、`hasJudge()`、`getCandidate()`、`getResult()`、`isAnswered()`、`setFriend(friend)`、`abstain()` | 脚本给自己判断：`setFriend(true/false)` 表态，`abstain()` 交回玩家好友名单。`getResult()` 返回 `"true"` / `"false"` / `"default"`。判断者以 **UUID** 给出（`getJudgeId()` 永远有值），`getJudge()` 在对方离线时返回 `null`，先用 `hasJudge()` 判断。**不可取消**，也不该返回布尔值——表态只能通过 setter。没有脚本监听时该事件根本不会派发。 |

资源映射的键已转换为字符串 ID。例如：

```js
MxtEvents.resourceConsume(event => {
  if (!event.isPre()) return
  const amounts = event.getAmounts()
  if (amounts['mxt:spirit_power'] > 0) {
    event.setAmount('mxt:spirit_power', 5)
  }
})
```

`friendRelation` 是**判断型**事件：脚本不改游戏状态，只回答问题，所以没有"阶段"也没有取消。

```js
MxtEvents.friendRelation(event => {
  // 只认这一位是自己人；其余情况什么都不做，交回玩家好友名单。
  // 需要用判断者实体时先看 hasJudge()：对方可能离线。
  if (event.getCandidate().getName().getString() === 'Alice') {
    event.setFriend(true)
  }
})
```

不表态（或调用 `abstain()`）等于"按名单来"，**不等于否定**。所有事件都在服务端派发。

## 通用生命周期事件

其余事件使用通用包装，方法为：

| 方法 | 返回/作用 |
| --- | --- |
| `getType()` | KubeJS 事件名，例如 `cultivationBreak`。 |
| `getPhase()` | 实际 Java 阶段类名，例如 `Pre`、`StrikePre`、`StartPost`。 |
| `isCancellable()` | 当前阶段是否可取消。 |
| `getEvent()` | 原生 MXT 事件实例，可调用下表列出的 Java accessor。 |
| `cancel()` | KubeJS 标准取消方法；仅在 `isCancellable()` 为 `true` 时会取消底层事务。 |

以下表中 `native` 代表 `const native = event.getEvent()`。Identifier、Holder、Attachment 等返回值均为 Java 对象；需要文本 ID 时使用 `String(value)`。

| KubeJS 事件 | 阶段类名 | `native` 的主要 accessor / 语义 |
| --- | --- | --- |
| `abilityTriggered` | `Pre`、`Post` | `getEntity()`、`getAbility()`、`signalType()`、`context()`；`Pre` 可取消触发的技能。原生事件的 `ability()` 返回 `Holder<Ability>`，需要 ID 时使用 `HolderHelper.id(...)` 或 KubeJS 包装器的 `getAbility()`。 |
| `curseRemove` | `Pre`、`Post` | `curse()`（`Holder<Curse>`）、`state()`、`reason()`、`gameTime()`、`holder()`；`Pre` 可取消移除。reason 为 `EXPLICIT`、`EXPIRED`、`CLEANSED`、`REPLACED`（`replace` 叠层模式覆盖旧实例时补发的 `Post` 用它，且不可取消）。 |
| `cultivationBreak` | `Pre`、`Post` | `target()`（`Holder<RealmStage>`）、`threshold()`、`context()`、`spirit()`、`resources()`；`Pre` 另有 `originalCosts()`、`costs()`、`setCost(resource, amount)`，可取消；`Post` 有 `paidCosts()`。 |
| `techniqueLearn` | `Pre`、`Post` | `technique()`（`Holder<Technique>`）、`spirit()`；`Pre` 可取消。 |
| `alchemyCraft` | `Pre`、`Post` | `recipe()`（`RecipeHolder<AlchemyRecipe>`）；`Pre.inputs()` 为输入 ID 列表且可取消；`Post.spoiled()`、`Post.outputs()` 为结果状态。 |
| `artifactRefine` | `Pre`、`Post` | `stack()`、`owner()`；`Pre` 可取消。 |
| `forging` | `Start`、`Started`、`StrikePre`、`StrikePost`、`CompletePre`、`CompletePost`、`Cancel` | 每个阶段都可读 `player()`（`ServerPlayer`）与 `pos()`（`BlockPos`，台子位置）。分阶段：`Start.blueprint()`；`Started/StrikePost/Cancel.session()`；`StrikePre.method()`（`Holder<ForgingMethod>`）、`resources()`、`context()`、`costs()`、`setCosts(costs)`；`CompletePre.blueprint()`、`session()`；`CompletePost.blueprint()`、`session()`、`result()`。`Start`、`StrikePre`、`CompletePre`、`Cancel` 可取消。 |
| `formation` | `Activate`、`Deactivate`、`Tick`、`TickEffects`、`UpkeepFailed` | `level()`、`controller()`、`instance()`（阵法 ID 取 `instance().formation()`）；`Activate`、`TickEffects`、`UpkeepFailed` 可取消，`Deactivate` 与 `Tick` 不可取消。`Tick` 是"本周期已付费"的观察点，`TickEffects` 只挡这一周期的效果且不退费，`UpkeepFailed` 取消表示让阵法撑过付不出钱的这一周期；`UpkeepFailed` 另有 `payer()`（`Optional<Entity>`，无人付款时为空）与 `failedResource()`（`Optional<Identifier>`，没有付款者时为空），脚本据此知道谁欠费、欠的是哪种资源。 |
| `lifespanEnd` | `Pre`、`Post` | `entity()`、`spirit()`；`Pre` 可取消结束，取消后寿元会被设为不受限。 |
| `realmInstance` | `Create`、`Destroy`、`EnterPre`、`EnterPost`、`Exit` | `definition()`（`Holder<RealmInstance>`）、`dimension()`（`ResourceKey<Level>`，实例维度键）、`index()`（第几份，从 0 数）、`owner()`（`Optional<UUID>`，主人）、`server()`；成员事件另有 `member()`（`UUID`）。只有 `EnterPre` 可取消。`Create` 在一份新实例维度建好后、第一位成员落下之前发布；`Destroy` 在实例结束时发布——无论它是销毁地形还是（被认领的实例）只卸载休眠。 |
| `soul` | `TransferPre`、`TransferPost`、`ReclaimPre`、`ReclaimPost` | `entity()`、`soul()`；所有 `*Pre` 可取消。 |
| `spiritContract` | `Pre`、`Post` | `contract()`、`contractType()`、`requester()`、`action()`；`contractType()` 是 `Optional<Holder<ContractType>>`，`action()` 为 `BIND`、`BREAK`、`RECALL`、`RELEASE`；`Pre` 可取消。 |
| `tribulation` | `StartPre`、`StartPost`、`EntryPre`、`EntryPost`、`Complete` | `tribulation()`（`Holder<Tribulation>`）、`data()`；两种节拍事件另有 `index()`（第几拍，从 0 数）与 `entry()`。`data()` 就是附件本身：`peek()`/`remaining()` 读队首与还剩几拍，`state()` 读当前节拍写下的现场，`windup()` 读启动前摇还剩多少 tick（0 表示已经在走时间线、或这场天劫没有前摇）。`StartPre` 可取消（拒绝这次启动），`EntryPre` 可取消（跳过该节拍）。 |

## `forging` 的两条额外约定

**会话是只读的。** `session()` 返回 `ForgingSessionView`，可读 `value()`、`steps()`、`optimalSteps()`、
`history()`（不可变列表）、`canComplete()`，**不能**改写会话——原生的 `ForgingSession` 是可变对象，
已不再交给监听器，所以 `event.getEvent().session().strike(...)` 这类写法不存在。台子本身也不交给监听器，
只给位置 `pos()`；要读槽位就用 `player.level().getBlockEntity(pos)`。

**监听器不要抛异常，抛了也不会搞坏操作。** 四个决定型事件（`Start`、`StrikePre`、`CompletePre`、
`Cancel`）在事务中间派发，所以监听器抛出时会被服务端就地转成一次拒绝：日志记为 `LISTENER_ERROR`
（与脚本主动 `cancel()` 的 `CANCELLED` 区分），操作不发生、材料不消耗、会话保持原样。
三个通知型事件（`Started`、`StrikePost`、`CompletePost`）派发时操作已经生效，抛出只记录并忽略。

例如调整突破消耗：

```js
MxtEvents.cultivationBreak(event => {
  if (event.getPhase() !== 'Pre') return
  const native = event.getEvent()
  native.setCost('mxt:spirit_power', 20)
})
```
