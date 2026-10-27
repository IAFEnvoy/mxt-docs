---
title: /breakthrough
---

# `/breakthrough`

按一门灵气当场试一次突破。需要 2 级 OP，而且必须由玩家执行；也可以写成 `/mxt breakthrough …`。

<div class="cmd-tree">

- `/breakthrough <aura>`

  尝试用这门灵气的境界链突破一次。

</div>

`<aura>` 是 `mxt:aura` 的条目，补全来自服务端当前注册表。

## 突破到哪一档

同一份灵气定义连成一条只能前进的链，目标按身体现在的位置取：

- **已经在这条链上**：目标是 `next_realm` 指的下一档，走的是服务端校验过的那条链；链在某一档断了（被 `neoforge:conditions` 挡掉或文件被删）就没有下一档。
- **还没进过这条链**：目标是这份灵气定义的 `first_realm`，也就是链的入口。

## 与自然突破的区别

它走的就是突破触发时的**同一条路径**：进度门槛、这一档自己的 `breakthrough` 条件、`ability_requirements`、代价、`Pre` / `Post` 事件全部照旧，成功时把这条链的修为进度清零。省掉的只有"要不要开始"这一个外部判断——命令不看自动突破开关、也不要求正在打坐，所以它是管理员手动点一次。

代价由这一档的 `breakthrough_costs` 声明，缺哪一种由境界自己写，失败时会点名。

## 结果

成功报「突破成功：`<灵气名>`」，失败报「突破失败：`<原因>`」。常见原因：没有可突破的下一境界、修为不足、条件不满足、代价不足（会点名缺的那门资源）、这一档的数值配置有误、被监听者取消。

境界本身怎么搭见[定义一个灵气与境界链](../../tutorial/define-aura-and-realms.md)，这一档要求的字段见 [realm_stage](../../datapack/json/realm_stage.md)。
