---
title: technique（功法）
aside: false
---

# technique（功法） {#technique}

文件位置：`data/<namespace>/mxt/technique/<path>.json`

**用途**：功法定义（可学习、按水平授予能力与修炼修正）。

| 字段 | 类型 | 默认 | 说明 |
| --- | --- | --- | --- |
| `name` | Text Component | `technique.mxt.<命名空间>.<路径>` | 可选显示名。省略时用左列的默认键。 |
| `description` | Text Component | `technique.mxt.<命名空间>.<路径>.description` | 可选描述。省略时用左列的默认键；目前只被存储与读取，还没有界面绘制它。 |
| `grade` | String | `common` | 功法等级标识，显示在功法面板的行悬浮提示里（`品阶：<原文>`）。它是自由文本：语言文件里存在 `mxt.technique_grade.<grade>` 时用那条翻译，否则原样显示，因此内容可以给自己的等级命名并自行翻译。 |
| `icon` | **图标引用** | 无 | 功法在界面（如功法面板）中显示的图标。 |
| `learn_condition` | `EntityCondition` | `mxt:always_true` | 学习条件。 |
| `exclusive_tags` | `Identifier[]` | `[]` | 功法互斥标签。 |
| `cultivation_modifier` | `NumberProvider` | `1` | 修炼倍率。 |
| `passive_modifiers` | `List<AttributeEntry>` | `[]` | 被动属性；使用原版 AttributeModifier，`value` 为可选动态公式。 |
| `granted_abilities` | `HolderOrTag<ability>[]` | `[]` | 学习后授予的能力，始终生效。 |
| `default_stage` | `Holder<skill_stage>` | 无 | 该功法水平链的入口等级；不定义水平时可以省略。 |
| `mastery_resource` | `Holder<resource>` | 无 | 衡量该功法熟练度的存储数值。写了它，功法就会随该数值增长自动晋升；不写则永不晋升。 |
| `configuration` | `Map<Holder<skill_stage>, StageConfiguration>` | `{}` | 该功法对共用水平链上每一级的注释；条目字段见下表。 |

`configuration` 的每个条目描述一级：

| 条目字段 | 类型 | 默认 | 说明 |
| --- | --- | --- | --- |
| `condition` | `EntityCondition` | **必填** | **到达**该级所需的条件。不需要条件就写 `mxt:always_true`；写数组表示全部满足。 |
| `ability` | `HolderOrTag<ability> 或数组` | `[]` | 该级授予的能力。它是**最低要求**——持有者在更高级别时依然生效，所以能力是累积的而不是逐级替换。可写单个能力、`#` 标签或它们的数组。 |

水平本身属于水平链，所以同一条链可以被多个功法共用，而"每级给什么、要什么条件"由各功法自己决定。入口等级（`default_stage`）是持有者的起点，**不需要**写条目；若仍然写了，它的 `ability` 照常在该级生效，而 `condition` 只被解析、不会成为任何门槛（不存在"晋升到入口等级"这件事）。入口之后的每一级**必须**配置；配置了从 `default_stage` 永远走不到的等级会在缓存重建时被拒绝——链条不能经过一个没有任何描述级别的台阶。

`granted_abilities` 与 `configuration` 相互独立：前者只要学会功法就生效；后者随持有者水平推进而累积。`configuration` 需要 `default_stage` 来指明它属于哪条链，缺少 `default_stage` 会在解析期报错；缺失的中间等级或不可达的 key 会在缓存重建时被拒绝。

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

