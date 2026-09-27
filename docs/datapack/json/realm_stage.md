---
title: realm_stage（境界阶段）
description: 定义灵气链上的一档境界：突破阈值、子境界、突破消耗与突破时加的寿元。
aside: false
---

# realm_stage（境界阶段） {#realm_stage}

文件位置：`data/<namespace>/mxt/realm_stage/<path>.json`

一个 `realm_stage` 是某条灵气链上的一档境界。`aura` 决定这一档属于哪条链，`next_realm` 接上下一档，若干档串成一条只能往前走、不能回头的线性链。修为上限、突破条件、子境界、突破消耗与突破时加的寿元都写在这一档上。

| 字段 | 类型 | 默认 | 说明 |
| --- | --- | --- | --- |
| `name` | Text Component | `realm_stage.mxt.<命名空间>.<路径>` | 显示名。省略时用左列的默认键。 |
| `description` | Text Component | `realm_stage.mxt.<命名空间>.<路径>.description` | 描述。省略时用左列的默认键；只有存储与读取，没有界面画它。 |
| `aura` | 灵气 id | **必填** | 这一档所属的灵气链。 |
| `aura_share_weight` | `NumberProvider` | `1` | `aura_zone.distribution` 为 `realm_weighted` 时参与同区块灵气分配的权重。 |
| `cultivate_condition` | `EntityCondition` | `mxt:always` | 该境界允许修炼的环境条件。 |
| `next_realm` | 境界 id | 无 | 链上的下一档，最多一个。 |
| `breakthrough_exp` | `NumberProvider` | `0` | 突破到下一档所需的最小修为计数。 |
| `max_experience` | `NumberProvider` | `Double.MAX_VALUE` | 前往下一档前允许持有的最大修为计数。 |
| `minor_stages` | 文本组件数组或整数 | `[]` | 子境界名，或子境界的重数。 |
| `breakthrough` | 条件组对象 | 空对象 | 达到最小修为后检查的突破条件。 |
| `auto_breakthrough` | `Boolean` | `false` | 修炼模式运行时是否自动尝试突破。 |
| `passive_modifiers` | 属性修正条目数组 | `[]` | 本档提供的原版属性修正。 |
| `lifespan` | `NumberProvider` | 无 | 成功抵达本档时给身体加上的寿元，单位刻。 |
| `costs` | `Cost` 数组 | `[]` | 突破消耗，从突破的实体身上扣。 |
| `ability_requirements` | 能力 id 或 `#标签` 的数组 | `[]` | 突破前必须拥有的能力。 |
| `minor_stage_abilities` | `{stage, ability}` 数组 | `[]` | 按子境界解锁的能力。 |
| `tribulation` | 天劫 id | 无 | 可选天劫。 |
| `breakthrough_particle` | `ParticleEffect` | 无 | 可选突破粒子，省略时不发送。 |
| `success_action` | `EntityAction` | `mxt:no_op` | 突破成功行为。 |
| `fail_action` | `EntityAction` | `mxt:no_op` | 突破失败行为。 |

`aura` 写的是 `aura` 定义而不是被存储的数值：一个阶段只指向一个定义，定义才指向数值，链条本身不以数值为键。

`cultivate_condition` 说的是"这个境界允许在什么环境下修炼"，例如用 `mxt:aura_range` 要求最低浓度。

`max_experience` 必须不小于 `breakthrough_exp`；修为到了 `max_experience` 就不再接受任何增加。

`auto_breakthrough` 关着时，只能通过命令、KubeJS 或其他服务端调用主动突破。

`passive_modifiers` 的条目写 `attribute`、原版 modifier 的 `id/amount/operation`，可选再写一个公式 `value`。

`costs` 整份数组**全有或全无**；写法见[共享数据类型 · `Cost`](../types/shared_data_types.md#cost)。

`lifespan` 只在成功突破到这一档的那一次加，而且只加一次。它是**增量**：后一档写得更小只是加得更少，不会把已经拿到的寿元收回去。写死常量时必须有限且非负，否则加载期直接拒绝；写成公式则到突破那一刻才判定，求值不是有限值或为负时记一条警告、什么都不加。写 `0`（或公式算出 `0`）＝这一档不延寿，**不会**因此把身体判成"寿元已尽"。详见[寿元](/player-guide/lifespan)。

`minor_stages` 写数组就是这些名字（字符串当翻译键、对象当完整组件）；写一个整数就是这么多重，名字自动生成为 `realm_stage.mxt.<命名空间>.<路径>.minor_stage.<下标>`（下标从 `0` 起，上限 `1024`）。子境界名用在三处：信息面板在境界名后带上当前这一重、公式变量 `minor_stage`、以及 `minor_stage_abilities` 的门槛下标。

`breakthrough` 是一个条件组，不是单个条件。它读三个键：`conditions`（条件数组，默认空，全部满足才算过）、`triggers`（触发数组，默认空）与 `action`（可选实体行为）。`conditions` 在达到突破阶段时立即求值；`triggers` 要到达到突破阶段之后才注册成运行时订阅，匹配到事件再尝试突破。订阅不写进存档，存档或数据表加载后由修炼状态重建。

`minor_stage_abilities` 的条目形如 `{ "stage": 2, "ability": ["example:qi_sense"] }`：`stage` 是 `minor_stages` 的 **0 起下标**（与公式变量 `minor_stage` 同一套编号），`ability` 是能力 id / `#标签` 列表，省略＝这一层不解锁任何东西。判定是**累计**的：层数 ≥ `stage` 即生效；**解锁过就永久保留**，突破离开这个境界、进度归零都不会收回去。加载期校验：`stage` 非负、必须落在本境界 `minor_stages` 的范围内、同一个 `stage` 不能写两次。

```json
// data/example/mxt/realm_stage/foundation.json
{
  "aura": "example:qi",
  "aura_share_weight": 2,
  "cultivate_condition": {"type": "mxt:aura_range", "aura": {"example:qi": {"min": 20, "max": 200}}},
  "next_realm": "example:qi_condensation",
  "breakthrough_exp": "1000 + level * 250",
  "max_experience": "2000 + level * 500",
  "minor_stages": 9,
  "minor_stage_abilities": [
    {"stage": 2, "ability": ["example:qi_sense"]},
    {"stage": 5, "ability": ["example:spirit_flight"]}
  ],
  "auto_breakthrough": false,
  "breakthrough": {
    "conditions": [
      {"type": "mxt:realm", "realm": "example:foundation", "comparison": "at_least"},
      {"type": "mxt:resource_compare", "resource": "example:qi", "min": 100}
    ]
  },
  "costs": [{"id": "example:qi", "amount": 100}],
  "lifespan": 2400,
  "success_action": {
    "type": "mxt:grant_ability",
    "ability": "example:body_tempering",
    "source": "example:foundation"
  }
}
```

上面这份用整数写法声明了九重，名字自动生成为 `realm_stage.mxt.example.foundation.minor_stage.0` 到 `…minor_stage.8`。写到数组里时可以混用翻译键与完整组件，例如：

```json
{
  "minor_stages": ["example:layer_1", {"text": "三重", "color": "gold"}]
}
```

子境界本身不改任何阈值，只回答「现在算第几重」：本境界的 `breakthrough_exp` 求值后均匀切成条目数那么多段，修为进度落在第几段就是第几个子境界（`0` 是第一个；例如 9 个子境界、`breakthrough_exp` 为 `900`，则 `0`~`100` 是第一个、`minor_stage` 为 `0`）。进度可以超过 `breakthrough_exp`（上限是 `max_experience`），超过后停在最后一重。`breakthrough_exp` 求值为 `0` 或负数、本境界没写 `minor_stages`、以及玩家还没有任何境界时，公式变量 `minor_stage` 读出 `NaN`（凡人读 `realm` 仍是 `0`，两者口径不同）。段宽随 `breakthrough_exp` 的公式一起变，写成公式时段宽要到运行时才定下来。

**按子境界解锁**（`minor_stage_abilities`）与**条件式门槛**（实体条件 `mxt:realm` 的 `min_minor_stage`）读的是同一份记录：身体在**每个境界上达到过的最高层数**，存在 `spirit_identity` 附件里，**只增不减**。这就是"解锁过就永久保留"的载体，也是 `min_minor_stage` 在离开该境界后仍然成立的原因。记录在每次修为增加落到盘上、以及突破成功之后各刷新一次（`/realm set` 也刷），所以它不会落后于实际到过的层数；没到过的境界读作"没有记录"，任何 `min_minor_stage` 都不满足。

```json
{
  "type": "mxt:realm",
  "realm": "example:qi_refining",
  "comparison": "at_least",
  "min_minor_stage": 5
}
```

`mxt:realm` 的三个部分这样分工：`realm` + `comparison` 决定境界本身（`exact` / `at_least` / `at_most`），可选的 `min_minor_stage`（`0` 起）要求身体在**该境界**上达到过的最高层数不小于它。所以 `{"realm": "example:qi_refining", "min_minor_stage": 500}` 读作"炼气期层数达到过 500"（单调，突破离开也照样成立），而 `comparison: "exact"` 配 `min_minor_stage` 读作"此刻就在这一境界的这一层以上"。字段细节见[实体条件类型](../types/condition/entity_condition_types.md)。

注意：`mxt:realm` 比的是**此刻所在**的境界，所以把目标境界用默认的 `exact` 写进它自己 `breakthrough` 的 `conditions` 里永远过不了；这种写法要写 `"comparison": "at_least"`，或者改查一个数值。

还没有任何境界的凡人不走链上的任何一档：凡人阶段的突破阈值与上限来自这条灵气定义的 `start_exp`，`first_realm` 只确定首次突破的目标，首次突破用的是目标首境界的 `breakthrough` 条件，`start_cultivate_conditions` 只用于开始修炼。

一个阶段只认一条 `aura`，链只能通过 `next_realm` 单向推进，链身份是档案而不是数值本身：`spirit_identity` 附件按 `aura` 保存当前境界与修为进度，读状态时不需要再反查数值。链的顺序在加载时推导：把 `first_realm` 指的那一档当作第一档，沿 `next_realm` 依次编号，于是任意两档都能比较先后，而且**上一档与下一档都是直接查这份顺序**，两个方向对称。链必须是一条直线，所以两件事会被报出来：**两档把同一个 `next_realm` 写成目标**（分叉，点名那一档跟着哪两档），以及**某一档没从 `first_realm` 接上**（谁也到不了它）。成环、指向不存在的境界、或某一档的 `aura` 与链对不上会让整条链不被索引，宁可拒绝也不留下顺序不全的结果。
