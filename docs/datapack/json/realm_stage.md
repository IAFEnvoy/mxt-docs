---
title: realm_stage（境界阶段）
aside: false
---

# realm_stage（境界阶段） {#realm_stage}

文件位置：`data/<namespace>/mxt/realm_stage/<path>.json`

**用途**：线性境界链和突破。

| 字段 | 类型 | 默认 | 说明 |
| --- | --- | --- | --- |
| `name` | Text Component | `realm_stage.mxt.<命名空间>.<路径>` | 可选显示名。省略时用左列的默认键。 |
| `description` | Text Component | `realm_stage.mxt.<命名空间>.<路径>.description` | 可选描述。省略时用左列的默认键；目前只被存储与读取，还没有界面绘制它。 |
| `aura` | `Holder<aura>` | **必填** | 该阶段所属的灵气链。一个阶段只指向一个 `aura` 定义，而定义才指向被存储的数值；链条本身不以数值为键。 |
| `aura_share_weight` | `NumberProvider` | `1` | `aura_zone.distribution: realm_weighted` 时参与同区块灵气分配的权重。 |
| `cultivate_condition` | `EntityCondition` | `mxt:always_true` | 该境界允许修炼的环境条件；例如用 `mxt:aura_range` 要求最低浓度。 |
| `next_realm` | `Holder<realm_stage>` | 无 | 线性链的下一个境界；最多一个。 |
| `breakthrough_exp` | `NumberProvider` | `0` | 从当前境界突破到下一境界所需的最小修为计数。 |
| `max_experience` | `NumberProvider` | `Double.MAX_VALUE` | 当前境界前往下一境界前允许持有的最大修为计数；达到后不再接受任何修为增加。必须不小于 `breakthrough_exp`。 |
| `minor_stages` | `List<Component>` 或 `int` | `[]` | 子境界名。写数组就是这些名字（字符串当翻译键、对象当完整组件）；写一个整数就是这么多重，名字自动生成为 `realm_stage.mxt.<命名空间>.<路径>.minor_stage.<下标>`（下标从 `0` 起，上限 `1024`）。用于三处：信息面板在境界名后带上当前这一重、公式变量 `minor_stage`、以及 `minor_stage_abilities` 的门槛下标。切分是均匀的——本境界的 `breakthrough_exp` 均匀切成条目数那么多段，进度落在第几段就是第几个子境界（下标从 `0` 起）。 |
| `breakthrough` | `CultivateConditions` | 空对象 | 达到最小修为后检查的突破条件。 |
| `auto_breakthrough` | `Boolean` | `false` | 是否在修炼模式运行时自动尝试突破；关闭时只能通过命令、KubeJS 或其他服务端调用主动突破。 |
| `passive_modifiers` | `List<AttributeEntry>` | `[]` | 当前境界提供的原版属性修正；条目包含 `attribute`、原版 modifier 的 `id/amount/operation`，并可选填写公式 `value`。 |
| `costs` | `List<Cost>` | `[]` | 突破消耗，从突破的实体身上扣，整份数组**全有或全无**；写法见[共享数据类型 · `Cost`](../types/shared_data_types.md#cost)。 |
| `ability_requirements` | `HolderOrTag<ability>[]` | `[]` | 突破前必须拥有的能力。 |
| `minor_stage_abilities` | `{stage, ability}[]` | `[]` | **按子境界解锁能力**：条目形如 `{ "stage": 2, "ability": ["example:qi_sense"] }`，`stage` 是 `minor_stages` 的 **0 起下标**（与公式变量 `minor_stage` 同一套编号），`ability` 是 `HolderOrTag<ability>` 列表（可省略＝这一层不解锁任何东西）。**累计**：层数 ≥ `stage` 即生效；**解锁过就永久保留**——突破离开这个境界、进度归零都不会收回去。加载期校验：`stage` 非负、必须落在本境界 `minor_stages` 范围内、同一个 `stage` 不能写两次。 |
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
  "minor_stages": 9,
  "minor_stage_abilities": [
    {"stage": 2, "ability": ["example:qi_sense"]},
    {"stage": 5, "ability": ["example:spirit_flight"]}
  ],
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

上面这份用整数写法声明了九重，名字自动生成为 `realm_stage.mxt.example.foundation.minor_stage.0` 到 `…minor_stage.8`。写到数组里时可以混用翻译键与完整组件，例如：

```json
{
  "minor_stages": ["example:layer_1", {"text": "三重", "color": "gold"}]
}
```

子境界本身不改任何阈值，只回答「现在算第几重」：本境界的 `breakthrough_exp` 求值后均匀切成条目数那么多段，修为进度落在第几段就是第几个子境界（`0` 是第一个；例如 9 个子境界、`breakthrough_exp` 为 `900`，则 `0`~`100` 是第一个、`minor_stage` 为 `0`）。进度超过 `breakthrough_exp`（上限是 `max_experience`）后停在最后一重；`breakthrough_exp` 求值为 `0` 或负数、本境界没写 `minor_stages`、以及玩家还没有任何境界时，公式变量 `minor_stage` 读出 `NaN`（凡人读 `realm` 仍是 `0`，两者口径不同）。段宽随 `breakthrough_exp` 的公式一起变，写成公式时段宽要到运行时才定下来。

**按子境界解锁**（`minor_stage_abilities`）与**条件式门槛**（实体条件 `mxt:realm` 的 `min_minor_stage`）读的是同一份记录：身体在**每个境界上达到过的最高层数**，存在 `spirit_identity` 附件里，**只增不减**——这就是"解锁过就永久保留"的载体，也是 `min_minor_stage` 在离开该境界后仍然成立的原因。记录在每次修为增加落到盘上、以及突破成功之后各刷新一次（`/realm set` 也刷），所以它不会落后于实际到过的层数；没到过的境界读作"没有记录"，任何 `min_minor_stage` 都不满足。

```json
{
  "type": "mxt:realm",
  "realm": "example:qi_refining",
  "comparison": "at_least",
  "min_minor_stage": 5
}
```

`mxt:realm` 的三个部分这样分工：`realm` + `comparison` 决定境界本身（`exact` / `at_least` / `at_most`），可选的 `min_minor_stage`（`0` 起）要求身体在**该境界**上达到过的最高层数不小于它。所以 `{"realm": "example:qi_refining", "min_minor_stage": 500}` 读作"炼气期层数达到过 500"（单调，突破离开也照样成立），而 `comparison: "exact"` 配 `min_minor_stage` 读作"此刻就在这一境界的这一层以上"。

境界附件按 `aura` 定义保存当前境界与修为进度（链条的键就是定义本身，读状态时不需要再反查数值）；服务器境界缓存保存“境界 -> 灵气定义”的映射与链内序号。境界链只能通过 `next_realm` 单向推进，链身份是档案而不是数值本身。

