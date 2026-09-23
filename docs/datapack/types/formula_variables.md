---
title: 公式变量
---

# 公式变量

## 常见公式变量

`mxt:formula_variable` 是**固有注册表**，数据包不能添加条目：每个条目负责从 `FormulaContext` 携带的对象里"拆出"一个数字——施法者、目标、资源对象或随机源。变量按需读取，公式只为自己真正用到的名字付出代价；名字与变量的对应关系在每个表达式里只解析一次（`caster_` 之类的名字族会按前缀切开，只把后半段交给条目处理），之后每次求值只是重新取值。事件载荷（`damage`、`block_x` 等）不属于任何对象，仍由调用方写入上下文的显式值表。

取值顺序是：上下文显式值 → 变量注册表；`params` 只覆盖它所在的那一个表达式。

- 实体族（`caster_` / `target_`）：`caster_health`、`caster_max_health`、`caster_level`，以及 `caster_<资源 ID>`、`caster_<属性 ID>`（命名空间与路径用 `_` 连接，路径中的 `/`、`.`、`-` 也替换为 `_`）。双实体上下文另有同名的 `target_` 前缀变量。元素走同一套压平规则：`caster_element_<命名空间>_<路径>` / `target_element_<…>` 是 `1`/`0`（该实体是否有这个元素），`caster_element_count` / `target_element_count` 是灵根命名的元素个数。客户端只认识同步过来的属性，其余属性名读作 `0`。
- 资源族：`realm`、`realm_rank`、`level`（三者都是该数值修炼链的境界序号，与实体的 `caster_level` 无关）以及 `absorbed_aura`、`cultivation_progress`、`minor_stage`（当前境界的子境界序号，从 `0` 起；当前境界没配 `minor_stages`、或还没有境界时为 `NaN`）。它们只在该数值的修炼上下文里存在。
- 所有上下文都可用：`zero`（恒为 `0`）和 `random`（从上下文的权威随机源取 `0..1`）。
- 技能：配置了 `element_affinity` 时提供 `element_modifier`；`aura` 类型的每目标求值另有 `aura_radius` 与 `distance`。**这个值由[伤害结算](/technical/damage)第一层自己乘**，所以伤害公式里不要再手写 `* element_modifier`（那是同一个数的第二次相乘）；它仍然可以在消耗、时长、条件这类**不是伤害**的地方读。
- 技能伤害：一次施放提供了 `damage_multiplier`（授予这个能力、且施法者当前所在的技能水平的 `damage_multiplier`），伤害管线的第一层会读它；内容自己的公式也可以读同一个名字。体质自己的 `damage_dealt_multiplier` / `damage_taken_multiplier` 不放进公式上下文，它们只由管线读。
- 技能消耗：`costs` 里 `mxt:resource` 条目的 `amount` 在施法者上下文之外还带上**该数值自己的公式上下文**（资源族变量，如 `realm_rank`、`absorbed_aura`）。
- 秘境实例：`secret_realm_members`、`secret_realm_limit`（不限时为 `-1`）、`secret_realm_elapsed`、`secret_realm_duration`、`secret_realm_index`、`secret_realm_is_owner`（`1` 或 `0`）。只要公式是对某份[秘境实例](../json/secret_realm.md)的成员求值的就能读，最典型的是定义自己的进出条件与进出行为。不在任何秘境实例里时这些名字无法提供，按错误处理而不是静默为 `0`。前缀带 `secret_realm_` 是因为 `realm` 已经被境界占用了。
- 触发器：`attack` 提供 `target_is_living`、`target_health`；`hurt` 提供 `damage`；`kill` 提供 `target_health`；`death` 提供 `victim_health`；`block_break` / `block_use` 提供 `block_x`、`block_y`、`block_z`；`item_use` 提供 `use_duration`；`equip` 提供 `equipment_slot`；`breakthrough` 提供 `breakthrough`（恒为 `1`）。
- 其他系统：契约战斗行为提供 `damage`；阵法 `entity_tick_action` 提供 `formation_radius` 与 `distance`；天劫时间线提供 `aura_tribulation_modifier`。

名字写错、或当前上下文确实无法提供该名字时会在求值时被报告：开发环境打印完整 ERROR 日志（有异常时包含异常与堆栈）方便立刻定位，生产环境每个不同消息只记录一行 WARN；两者都不会中断调用方，而是按 `0` 继续求值。不要再依赖"未知变量静默为 0"来写完数据包。某个公式点具体能用哪些变量，以文档站点的 Formula Variables 页为准。使用 `params` 可以为同一公式显式提供变量，并覆盖同名上下文变量。
