---
title: realm_stage（境界阶段）
---

# realm_stage（境界阶段） {#realm_stage}

文件位置：`data/<namespace>/mxt/realm_stage/<path>.json`

**用途**：线性境界链和突破。

| 字段 | 类型 | 默认 | 说明 |
| --- | --- | --- | --- |
| `aura` | `Holder<aura>` | **必填** | 该阶段所属的灵气链。一个阶段只指向一个 `aura` 定义，而定义才指向被存储的数值；链条本身不以数值为键。 |
| `aura_share_weight` | `NumberProvider` | `1` | `aura_zone.distribution: realm_weighted` 时参与同区块灵气分配的权重。 |
| `cultivate_condition` | `EntityCondition` | `mxt:always_true` | 该境界允许修炼的环境条件；例如用 `mxt:aura_range` 要求最低浓度。 |
| `next_realm` | `Holder<realm_stage>` | 无 | 线性链的下一个境界；最多一个。 |
| `breakthrough_exp` | `NumberProvider` | `0` | 从当前境界突破到下一境界所需的最小修为计数。 |
| `max_experience` | `NumberProvider` | `Double.MAX_VALUE` | 当前境界前往下一境界前允许持有的最大修为计数；达到后不再接受任何修为增加。必须不小于 `breakthrough_exp`。 |
| `breakthrough` | `CultivateConditions` | 空对象 | 达到最小修为后检查的突破条件。 |
| `auto_breakthrough` | `Boolean` | `false` | 是否在修炼模式运行时自动尝试突破；关闭时只能通过命令、KubeJS 或其他服务端调用主动突破。 |
| `passive_modifiers` | `List<AttributeEntry>` | `[]` | 当前境界提供的原版属性修正；条目包含 `attribute`、原版 modifier 的 `id/amount/operation`，并可选填写公式 `value`。 |
| `costs` | `List<ResourceCost>` | `[]` | 突破消耗；每项为 `id` 和 `amount`。 |
| `ability_requirements` | `HolderOrTag<ability>[]` | `[]` | 突破前必须拥有的能力。 |
| `tribulation` | `Holder<tribulation>` | 无 | 可选天劫。 |
| `breakthrough_particle` | `ParticleEffect` | 无 | 可选突破粒子；省略时不发送。 |
| `success_action` | `EntityAction` | `mxt:no_op` | 突破成功行为。 |
| `fail_action` | `EntityAction` | `mxt:no_op` | 突破失败行为。 |

示例：

```json
// data/example/mxt/realm_stage/foundation.json
{
  "aura": "example:qi",
  "aura_share_weight": 2,
  "cultivate_condition": {"type": "mxt:aura_range", "min": 20, "max": 200},
  "next_realm": "example:qi_condensation",
  "breakthrough_exp": "1000 + level * 250",
  "max_experience": "2000 + level * 500",
  "auto_breakthrough": false,
  "breakthrough": {
    "conditions": [
      {"type": "mxt:realm", "realm": "example:foundation"},
      {"type": "mxt:resource_compare", "resource": "example:qi", "min": 100}
    ]
  },
  "costs": [{"id": "example:qi", "amount": 100}],
  "success_action": {
    "type": "mxt:grant_ability",
    "ability": "example:body_tempering",
    "source": "example:foundation"
  }
}
```

境界附件按 `aura` 定义保存当前境界与修为进度（链条的键就是定义本身，读状态时不需要再反查数值）；服务器境界缓存保存“境界 -> 灵气定义”的映射与链内序号。境界链只能通过 `next_realm` 单向推进，链身份是档案而不是数值本身。

