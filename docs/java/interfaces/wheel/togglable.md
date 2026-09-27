---
title: Togglable
---

# Togglable

**需要按键才能发动的技能**：技能类型实现它就是声明"把这一项放进轮盘"。判据只有一句——凡是要按键才发动的都算技能、都进轮盘——所以它既包括一次性（按一下放完），也包括开关（开与关都按它）。接口只有三个方法，状态归实现自己管。

| 成员 | 说明 |
| --- | --- |
| `Optional<Boolean> state(ToggleContext context)` | 这个开关现在在哪一边。**空 = 一次性**，没有状态可报（储物就是这样）。 |
| `boolean gated(ToggleContext context)` | 这次按压要不要先过共用的"条件 + 冷却 + 消耗"闸门。默认 `true`；施放类在自己的事务里付款、开关在**关**的那一下不收费，两者都答 `false`。 |
| `Togglable.Result activate(ToggleContext context)` | 按下了，**只有服务端调**。返回 `Result(changed, failure, failedResource)`。 |

`ToggleContext(holder, carrier, ability)` 就是这次按压的上下文：谁按的、按的是哪条技能，以及它从哪一堆物品上来的（由物品承载时 `carrier` 有值，由功法之类授予时为空）。

`Result` 用 `activated()` 与 `refused(failure)` / `refused(failure, failedResource)` 造。`Failure` 的 18 个取值与 `AbilityService.Failure` **同名同义**，会被轮盘按 `actionbar.mxt.ability.failure.*` 一份文案表翻成动作栏那一句，日志里留的也是真原因：条件不满足、灵根与元素不符、某门资源不足、次数用完、还在冷却、数值配置有误、没有承载物、手上没有能飞的载具、没有符合条件的目标、指定的技能不能作用在目标身上、现在骑不上去……付不出资源时 `failedResource` 还带上是哪一门。`UNAVAILABLE` 只是兜底。

服务端受理按压只有一条路，`AbilityActivationService.activate(holder, ability, carrier)`：实现 `Togglable` 的技能走它（`gated` 为真时先过 `AbilityService.gate`，再过就调 `activate`），不实现的技能在按下时回落成一次 `AbilityService.use`（给已保存的轮盘格子，它可以点名一个不可按键的技能）。轮盘的候选池也只筛"实现了 `Togglable`"这一条。

今天有五个实现，都是普通技能类型：`mxt:active`（按一下施放）、`mxt:channelled`（按一下开始引导，之后按 `tick_interval` 收维持费）、`mxt:targeted`（按一下对选择器挑中的每个实体各跑一次子技能）、`mxt:flight_control`（开关：开＝起剑、关＝落剑）、`mxt:storage`（一次性：打开储物箱）。加一种要按键的技能就是加一个实现它的 `mxt:ability_type` 条目，不用动轮盘。技能本身的字段见 [ability](/datapack/json/ability)，玩家侧表现见[轮盘条目](../../wheel.md)。
