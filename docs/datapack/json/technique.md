---
title: technique（功法）
description: 定义一门可以学会的功法：品阶、学习条件、被动属性、授予的能力与水平链。
aside: false
---

# technique（功法） {#technique}

文件位置：`data/<namespace>/mxt/technique/<path>.json`

一门功法是可以被学会的东西。学会之后它一直生效：`granted_abilities` 立刻给能力，`passive_modifiers` 一直给属性；爬升的那部分另有一份账——功法给出一条水平链的入口，持有者沿这条链逐级晋升，每一级再解锁自己的能力。已学会的功法全部同时生效。

| 字段 | 类型 | 默认 | 说明 |
| --- | --- | --- | --- |
| `name` | Text Component | `technique.mxt.<命名空间>.<路径>` | 显示名。省略时用左列的默认键。 |
| `description` | Text Component | `technique.mxt.<命名空间>.<路径>.description` | 描述。省略时用左列的默认键；只有存储与读取，没有界面画它。 |
| `quality` | 品质 id | 无 | 这门功法自己的品阶，一个 [quality](./quality.md) 条目。 |
| `icon` | 图标引用 | 无 | 功法在界面（如功法面板）中显示的图标。 |
| `learn_condition` | `EntityCondition` | `mxt:always` | 学习条件。 |
| `exclusive_tags` | Identifier 数组 | `[]` | 功法互斥标签。 |
| `cultivation_modifier` | `NumberProvider` | `1` | 修炼倍率。 |
| `passive_modifiers` | 属性修正条目数组 | `[]` | 被动属性。 |
| `granted_abilities` | 能力 id 或 `#标签` 的数组 | `[]` | 学习后授予的能力，始终生效。 |
| `default_stage` | 技能水平 id | 无 | 该功法水平链的入口等级。 |
| `mastery_resource` | 数值 id | 无 | 衡量该功法熟练度的存储数值。 |
| `configuration` | 技能水平 id 到条目对象的映射 | `{}` | 该功法对共用水平链上每一级的注释；条目字段见下表。 |

`configuration` 的每个条目描述一级：

| 字段 | 类型 | 默认 | 说明 |
| --- | --- | --- | --- |
| `condition` | `EntityCondition` | **必填** | **到达**该级所需的条件。不需要条件就写 `mxt:always`；写数组表示全部满足。 |
| `ability` | 能力 id 或 `#标签`，可写数组 | `[]` | 该级授予的能力。它是**最低要求**——持有者在更高级别时依然生效，所以能力是累积的。可写单个能力、`#` 标签或它们的数组。 |

`quality` 管两件事：功法面板行首是「功法名 + 等级」，名称按品阶的 `color` 上色，悬浮提示的「品阶」读它的名字与颜色；同时它是这门功法**载体物品的默认档**，物品上写了 `mxt:quality` 组件时以组件为准。省略 `quality` 就不显示品阶，也不给载体默认档。

`passive_modifiers` 用原版 AttributeModifier，`value` 为可选的动态公式。

`default_stage` 不定义水平时可以省略。

`mastery_resource` 不写则永不晋升。

水平本身属于水平链，所以同一条链可以被多个功法共用，而"每级给什么、要什么条件"由各功法自己决定。入口等级（`default_stage`）是持有者的起点，**不需要**写条目；若仍然写了，它的 `ability` 照常在该级生效，而 `condition` 只被解析、不会成为任何门槛（不存在"晋升到入口等级"这件事）。入口之后的每一级**必须**配置；配置了从 `default_stage` 永远走不到的等级会在链重建时被拒绝——链条不能经过一个没有任何描述级别的台阶。

`granted_abilities` 与 `configuration` 相互独立：前者只要学会功法就生效；后者随持有者水平推进而累积。`configuration` 需要 `default_stage` 来指明它属于哪条链，缺少 `default_stage` 会在解析期报错；缺失的中间等级或不可达的 key 会在链重建时被拒绝。

晋升由数据驱动，而不是只看功法文件：`mastery_resource` 决定**用什么**衡量熟练度，水平自身的 `mastery` 决定**需要多少**，该级的 `condition` 决定**还需要什么**，而数值怎么涨由功法之外的任意内容决定（触发规则、修炼档案，或脚本）。

已学会的功法在服务端周期检查中逐级晋升（一次检查里每级最多晋升一层），同时满足以下条件才晋升：

- 定义了 `mastery_resource`；
- 持有者该资源的存储值不小于下一级的 `mastery`；
- 下一级的 `condition` 成立。

晋升后按新水平重算能力授予：`granted_abilities` 加上已到达的每一级的 `ability`（因为 `ability` 是最低要求）。晋升会发布 `mxt:technique_stage` 信号，供其它内容响应（信号携带刚到达的等级 rank，公式变量 `stage`，以及扩展值 `technique`）。由于水平在链上、熟练度数值在资源上，内容包可以自由决定熟练度怎么涨：

```json
// data/example/mxt/trigger/mastery_from_combat.json
{
  "trigger": { "type": "mxt:kill" },
  "action": { "type": "mxt:add_resource", "resource": "example:sword_mastery", "amount": 1 }
}
```

只有 `configuration` 而没有 `mastery_resource` 的功法不会自行晋升；反之，写了 `mastery_resource` 却没有 `default_stage` 会在解析期被拒绝，因为没有可爬的链。

**读写功法状态。** 实体条件 `mxt:technique` 问这一位**学过**哪些功法：`techniques` 接受条目、`#` 标签或数组，空表就是"学过任意一门"，`match` 取 `any`（默认，命中其一即可）或 `all`（写下的每一项都要满足，此时空表会在加载期被拒绝，免得静默变成恒真）；`mxt:skill_stage` 再问它们爬到了哪一级。它读的是**学过**而不是"正在生效"——功法没有启用开关，灵根与体质才有；要表达"没有功法"用 `mxt:not` 套一条。战利品表里用同名的 `mxt:technique`（多一个 `entity` 目标字段，其余同形，见 [战利品与进度条件](../loot-and-criteria.md)）。问的是身体里那份授予账本，所以当前包已经不提供的功法照样答得出来。字段细节见 [实体条件类型](../types/condition/entity_condition_types.md)。

```json
// data/example/mxt/technique/azure_breath.json
{
  "granted_abilities": ["example:azure_guard"],
  "default_stage": "example:azure_breath_1",
  "configuration": {
    "example:azure_breath_1": {
      "condition": { "type": "mxt:has_realm", "aura": "example:qi" },
      "ability": "example:azure_bolt"
    },
    "example:azure_breath_2": {
      "condition": { "type": "mxt:realm", "realm": "example:foundation", "comparison": "at_least" },
      "ability": ["example:azure_bolt", "#example:azure_mastery"]
    },
    "example:azure_breath_3": {
      "condition": [
        { "type": "mxt:realm", "realm": "example:core_formation", "comparison": "at_least" },
        { "type": "mxt:health", "comparison": ">=", "compare_to": 20 }
      ]
    }
  }
}
```
