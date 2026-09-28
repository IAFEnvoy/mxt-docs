---
title: aura_zone（灵气区域）
description: 定义一份环境灵气模板：每种灵气的库存、匹配的维度与群系、波动、规则、粒子、客户端雾效与 HUD 条。
aside: false
---

# aura_zone（灵气区域） {#aura_zone}

一个 `aura_zone` 是环境灵气模板：这一带每种灵气的初始量、上限、恢复与颜色，它匹配哪些维度与群系，怎么随时间波动，套哪些修炼规则，以及客户端看到的雾效、粒子与 HUD 条。模板本身不存数量，可消耗的灵气记在区块附件上，所以同一个位置的所有系统读的是同一份库存。

## 文件位置

灵气区域文件放在数据包的 `data/<namespace>/mxt/aura_zone/`。

**用途**：环境灵气模板。

文件名对应它的 ID。例如 `data/example/mxt/aura_zone/spirit_land.json` 的 ID 是 `example:spirit_land`。

## 字段

| 字段 | 类型 | 默认 | 说明 |
| --- | --- | --- | --- |
| `aura` | 灵气 id 到数值的映射 | `{}` | 这个模板里有哪几种灵气，各自的初始量、上限、恢复与颜色。 |
| `distribution` | Enum | `equal` | 同区块多玩家灵气不足时的共享分配方式：`random`、`equal`、`realm_weighted`。 |
| `cultivate_condition` | `EntityCondition` | `mxt:always` | 当前环境允许修炼的条件；与当前境界条件同时检查。 |
| `dimensions` | 维度 id 或 `#标签` 的数组 | `[]` | 维度匹配。 |
| `biomes` | 群系 id 或 `#标签` 的数组 | `[]` | 群系匹配。 |
| `fluctuation` | 对象 | `static` / `0` | 昼夜或月相波动。 |
| `rules` | 对象 | 全部关闭 | 修炼压制、天劫、灵植和炼丹环境规则。 |
| `element_fit_bonus` | Double | `0` | 灵根元素适配奖励：这里存在该灵根自己的灵气时加这么多。 |
| `element_conflict_penalty` | Double | `0` | 元素冲突惩罚：乘在「对立浓度」上。 |
| `noise` | 对象 | 关闭 | 带 seed 的二维噪声分布。 |
| `particle` | `ParticleEffect` | 无 | 服务端控制的可选粒子。 |
| `client_render` | 对象 | 白色、`64`、`0.35` | 客户端雾色和雾强度。 |
| `client_hud` | 对象 | 两条均隐藏 | 当前库存与感知浓度条。 |
| `priority` | Integer | `0` | 同层级（群系或维度）内多个模板重叠时的选择优先级。 |

**对立浓度**是本区域内所有与灵根元素有 `overcomes` / `adapted_to` 关系的**其它**元素的浓度之和，所以空区域不会被当成对立区域。

## `aura` 的每一项

`aura` 的每个值都是同一个形状，[block_aura](./block_aura.md) 也用它：

| 字段 | 类型 | 默认 | 说明 |
| --- | --- | --- | --- |
| `amount` | Double | `0` | 该灵气的初始库存，必须非负；方块那边是每个方块贡献的基础量。 |
| `max` | 上限 | `initial_multiplier`、倍率 `1` | 该灵气的上限，四种写法见下。 |
| `regen_per_tick` | Double | `0` | 每 tick 补回多少。 |
| `color` | `RGBColor` | `#FFFFFF` | 颜色，只用于环境渲染。 |

自然环境以每个灵气的 `amount` 为初始库存，噪声和波动作用于它；`max` 省略时等于初始值。`max` 有四种写法：固定数值、`{ "type": "mxt:fixed", "value": 100 }`、`{ "type": "mxt:initial_multiplier", "multiplier": 2 }` 或 `{ "type": "mxt:unlimited" }`。裸数字是 `mxt:fixed` 的简写；`mxt:initial_multiplier` 把初始库存乘上 `multiplier`，所以不写 `max` 就等于"上限跟着初始库存走"；`mxt:unlimited` 表示没有上限，修炼速度那一侧改用 `concentration / (concentration + 1)` 换算，而不是 `concentration / maximum`。这个分派器来自固有注册表 `mxt:aura_maximum_type`，数据包只能选择既有算法。

这里填的是**环境基础**上限。方块灵气会额外提高对应灵气的有效容量，不占用这个上限；阵法也能再往上加。`element_fit_bonus` 与 `element_conflict_penalty` 必须是有限数，`client_hud` 两条的 `maximum` 必须有限且大于 `0`，不满足就是加载错误。

## `fluctuation`

| 字段 | 类型 | 默认 | 说明 |
| --- | --- | --- | --- |
| `enable` | Boolean | `false` | 是否启用波动。 |
| `cycle_type` | Enum | `static` | `day`、`moon` 或 `static`。 |
| `amplitude` | Double | `0` | 波动幅度。 |
| `offset_tick` | Long | `0` | 周期采样偏移。 |

波动只影响查询到的环境浓度，不改写区块库存；库存按 `regen_per_tick × 经过的刻数` 补回，补回周期由服务端配置「灵气 → 方块灵气周期」决定（默认每 10 tick）。

## `rules`

| 字段 | 类型 | 默认 | 说明 |
| --- | --- | --- | --- |
| `cultivate_suppress` | Boolean | `false` | 是否禁止或中止修炼。 |
| `tribulation_modify` | Double | `0` | 天劫难度修正，正值提高难度。 |
| `spirit_plant_bonus` | Double | `0` | 灵植生长加成。必须有限且 ≥ `-1`。 |
| `alchemy_env_bonus` | Boolean | `false` | 顶替丹方的环境门槛 `minimum_aura`。不替丹炉支付燃料。 |

`rules.cultivate_suppress` 会中止正在进行的修炼。`tribulation_modify` 注入公式变量 `aura_tribulation_modifier`。

`spirit_plant_bonus` 乘进灵田里每 `20` tick 一次的增长量：[spirit_herb](./spirit_herb.md) 的 `growth.growth_rate` 先按当前公式求值，再乘一次 `max(0, 1 + spirit_plant_bonus)`，所以公式里不要再乘它。这个值必须有限且不小于 `-1`，越界是加载错误。

`alchemy_env_bonus` 开启后，位置落在该区域内的丹方**直接视为满足** `minimum_aura`——它是开关、没有可缩放的量，所以只能顶替要求，而不是把池子放大，也不替丹炉供热；关闭时仍按配方自己的最低值逐项比较。

## `noise`

| 字段 | 类型 | 默认 | 说明 |
| --- | --- | --- | --- |
| `enable` | Boolean | `false` | 是否启用二维噪声。 |
| `seed` | Long | `0` | 数据包控制的可复现种子。 |
| `scale` | Double | `640` | 采样尺度；越大越平缓。 |
| `amplitude` | Double | `0` | 噪声幅度。 |

区块第一次加载时，以 `max(0, (该灵气的 amount + 柏林噪声) / 10 - 5)` 初始化，负值归零；`noise.seed` 完全由数据包控制，便于整合包复现分布。`noise.scale` 越大，空间变化越平缓；内置环境使用约 `640` 至 `960`。常规环境建议把 `noise.amplitude` 保持在 `5`，对应未截断前约 `-5` 至 `5` 的噪声扰动。

## `client_render`

| 字段 | 类型 | 默认 | 说明 |
| --- | --- | --- | --- |
| `fog_color` | `RGBColor` | `#FFFFFF` | 雾颜色；支持 `#RRGGBB` 或 `0..16777215` 整数。 |
| `render_distance` | Integer | `64` | 雾效影响距离，范围 `8..256`。 |
| `fog_strength` | Float | `0.35` | 覆盖原版雾的比例，范围 `0..1`。 |

`client_render` 只负责客户端雾效，粒子不在其中。`fog_strength` 控制雾色和雾距离覆盖原版值的比例，`0` 为不覆盖，`1` 为完全覆盖。雾效强度还会按环境浓度缩放，因此低浓度区域会更淡。

## `particle`

| 字段 | 类型 | 默认 | 说明 |
| --- | --- | --- | --- |
| `particle` | `ParticleOptions` | **必填** | 原版粒子类型及其参数。 |
| `count` | Integer | `16` | 每次发送数量；`0` 保留原版定向粒子语义。 |
| `speed` | Float | `0` | 原版粒子速度参数。 |
| `force` | Boolean | `false` | 是否强制发送给客户端。 |
| `spread` | Vec3 | `[0.5,0.5,0.5]` | 三轴扩散范围。 |
| `offset_x` / `offset_y` / `offset_z` | Float | `0,0.5,0` | 生成位置偏移。 |

`particle` 是灵气区域顶层的可选粒子效果，用原版粒子类型解析，粒子类型要写成对象：

```json
"particle": { "type": "minecraft:glow" }
```

字段省略时才不发送粒子。`count`、`speed`、`spread`、`offset_*` 与 `force` 会原样传给原版粒子发送 API；`count: 0` 保留原版的特殊定向粒子语义。灵气粒子按同步周期刷新，默认每 `5` tick。

## `aura_zone.client_hud`

`stored_aura` 和 `sensed_concentration` 均可省略，也可以只写其中一条；每一项字段如下：

| 字段 | 类型 | 默认 | 说明 |
| --- | --- | --- | --- |
| `maximum` | Double | **必填** | 满条对应的灵气值，必须大于 `0`。 |
| `bar_index` | Integer | `0` | Origins 风格贴图行。 |
| `inverted` | Boolean | `false` | 是否反向显示。 |
| `anchor` | `left` / `right` | `left` | HUD 左列或右列。 |
| `order` | Integer | `0` | 同侧排序。 |

`stored_aura` 显示区块附件里的实际库存，`sensed_concentration` 显示当前位置的环境模板浓度。两条都用 Origins 风格的 71x8 贴图：`maximum` 是满条对应的浓度，必须大于零；`bar_index` 选择贴图行和图标；`inverted` 可选，默认 `false`。`anchor` 为 `left` 或 `right`，`order` 控制同侧灵气条从下到上的顺序，灵气条会自动排在同侧资源条上方。资源条上下文另提供 `mxt:environment_concentration` 与 `mxt:actual_concentration`，分别对应环境值和全部来源的实际值。

## 环境怎么定下来

环境解析优先级固定为：**群系绑定 < 维度绑定 < 永久人工区域 < 活跃阵法**。后一级整份替换前一级的灵气类型、元素值、规则和显示模板。普通区块的可消耗灵气仍保存于区块附件，因此同一位置所有系统共享同一份灵气库存。

- `dimensions` 和 `biomes` 可以同时填写；维度匹配优先于群系匹配。列表为空仅表示该模板不会参与静态绑定，仍可被人工区域或阵法引用。
- `priority` 只在同一层级内部比较。多个群系模板同时命中、或多个维度模板同时命中时，`priority` 最大者生效；`priority` 相同时按模板 ID 升序取首个，因此重叠定义的选择结果在每次加载后稳定可复现。维度绑定始终优先于群系绑定，较高的群系 `priority` 不会越过维度层。
- `cultivate_condition` 是此环境允许修炼的实体条件，默认为 `mxt:always`。例如 `mxt:aura_range` 可要求当前最终浓度处于 `min..max`；环境条件通过后，各 `realm_stage.cultivate_condition` 按资源链独立判断，不满足的链仅跳过自身恢复与转换。
- 同一区块内到期修炼的玩家共享区块附件中的灵气库存。`distribution` 控制当库存不足时的分配方式：`random` 随机排序后优先满足；`equal`（默认）按最大最小公平方式均分并重分未使用份额；`realm_weighted` 按当前境界的 `aura_share_weight` 加权分配并重分未使用份额。共享区块内有重叠动态灵气域时，以稳定排序后的首个请求者所处环境的策略为准。
- 修炼获得的修为与 `aura_gains` 会同时乘以当前位置浓度倍率。有限上限使用 `concentration / maximum`，无上限环境使用 `concentration / (concentration + 1)`；分配到的灵气不足请求量时还会额外按实际配额比例降低本次收益。
- 这里没有「环境类型」字段：一处环境有什么灵气就是它 `aura` 的键；要求某处能修炼或能炼丹就写 `condition`（`cultivate_action` 的 `start_condition` / `condition`）或 `minimum_aura`（炼丹），两者都按灵气 id 或 `#标签` 说话。
- `block_aura` 不占用环境基础上限：它会同时为当前区块增加等量可储存灵气容量。环境上限为 100、方块总贡献为 30 时，该区块有效上限为 130。实际位置查询采用有界子区块算法：距离当前子区块 3 个子区块以内按方块真实位置计算，外围按子区块中心近似，并使用 `1 / max(1, 距离平方)` 衰减；同一来源子区块会按当前访问玩家数粗略平分，区块库存仍由玩家共享。
- 方块灵气缓存和区块库存更新周期由服务端配置「灵气 → 方块灵气周期」控制，默认每 10 tick 更新一次，允许范围为 1 至 1200 tick。
- 推荐的自然灵气模板将每种灵气的 `amount` 设为 `0`，并启用正负噪声。经 `/ 10 - 5` 处理后，大面积区域没有自然灵气；方块贡献会在此基础上按区块内方块数量累加，可将灵石矿脉配置为远高于自然值。
- `aura` 的键是 `mxt:aura` 注册表中的灵气 ID。每种灵气独立存储数量、上限、恢复速度和环境颜色；它的元素标记是同一份 `mxt:aura` 定义里的 `aura_type`（可选的 `mxt:element`）。

## 示例

```json
{
  "aura": {
    "example:spirit_power": {
      "amount": 120.0,
      "max": { "type": "mxt:initial_multiplier", "multiplier": 2.0 },
      "regen_per_tick": 0.05,
      "color": "#88ffdd"
    }
  },
  "distribution": "realm_weighted",
  "cultivate_condition": {
    "type": "mxt:aura_range",
    "aura": { "example:spirit_power": { "min": 20, "max": 200 } }
  },
  "dimensions": ["minecraft:the_nether"],
  "biomes": ["minecraft:badlands"],
  "fluctuation": {
    "enable": true,
    "cycle_type": "day",
    "amplitude": 0.3,
    "offset_tick": 0
  },
  "rules": {
    "cultivate_suppress": false,
    "tribulation_modify": 0.15,
    "spirit_plant_bonus": 0.2,
    "alchemy_env_bonus": true
  },
  "element_fit_bonus": 0.25,
  "element_conflict_penalty": 0.2,
  "noise": {
    "enable": true,
    "seed": 739430,
    "scale": 640.0,
    "amplitude": 5.0
  },
  "particle": {
    "particle": { "type": "minecraft:glow" },
    "count": 4,
    "speed": 0.01,
    "force": false,
    "spread": [0.5, 0.5, 0.5],
    "offset_x": 0.0,
    "offset_y": 0.5,
    "offset_z": 0.0
  },
  "client_render": {
    "fog_color": "#88ffdd",
    "render_distance": 64,
    "fog_strength": 0.35
  },
  "client_hud": {
    "stored_aura": {
      "maximum": 200.0,
      "bar_index": 1,
      "anchor": "left",
      "order": 4
    },
    "sensed_concentration": {
      "maximum": 200.0,
      "bar_index": 2,
      "anchor": "left",
      "order": 5
    }
  }
}
```

## 客户端看到什么

服务端按服务端配置「灵气 → 同步周期」向玩家同步当前位置的实际浓度与环境浓度，默认每 5 tick 一次。同步里的 `actual` 包含环境、区块库存、方块和阵法等全部来源，`environment` 只包含环境模板；`stored_aura` 仍显示实际库存，`sensed_concentration` 和雾效只显示环境模板计算值。环境波动不会直接改写库存显示，但方块贡献、修炼消耗和库存回复仍会改变实际浓度。客户端只负责画，不决定扣除与收益。

## 阵法联动

阵法定义可以带一个 `mxt:buff` 功能模块，在其中增加 `aura_zone`：

```json
{
  "structure_template": "example:gathering_array",
  "radius": 8,
  "actions": [
    {
      "type": "mxt:buff",
      "max_bonus": { "example:spirit_power": 50 },
      "aura_zone": "example:spirit_gathering"
    }
  ]
}
```

活跃阵法以阵眼和 `radius` 覆盖范围内环境。`max_bonus` 可选，默认 `0`，为范围内区块的有效上限追加数值；重叠阵法取最高加成。阵法失效、维护失败或结构被破坏后，覆盖自动消失。

## 人工区域与 KubeJS

```js
const aura = MxtAura.get(player.level, player.blockPos)
console.log(aura.concentration())

const area = MxtAura.addBox(
  player.level, 'example:blessing_land',
  0, 64, 0, 64, 128, 64, 10
)
MxtAura.remove(player.level, area)
```

人工区域会保存到世界。`priority` 越大，同类人工区域重叠时越优先。KubeJS 事件名为 `MxtEvents.auraZone`，事件的 `kind` 是 `enter`、`leave`、`tick` 或 `override`；`override` 可取消以拒绝阵法环境覆盖。

## 其他系统字段

炼丹配方可以使用：

```json
{
  "minimum_aura": { "example:spirit_power": 50 }
}
```

妖兽档案可以使用：

```json
{
  "preferred_aura_elements": ["example:fire"],
  "minimum_aura": { "example:spirit_power": 30 }
}
```

服务端查脚下的灵气用这几条：

| 命令 | 作用 |
| --- | --- |
| `/mxt aura query` | 列出这个位置的全部灵气与各自的量。 |
| `/mxt aura query <灵气 id>` | 只看点名的那一条灵气。 |
| `/mxt aura query element <元素 id>` | 只看元素标记是它的那些灵气；几条灵气可以带同一个元素标记，所以这个问法是问元素。 |
| `/mxt aura vein` | 站在灵石矿石上时，查相连矿脉的方块数与等级。 |
| `/mxt aura cache clear [半径]` | 清掉方块灵气查询缓存，半径 `0..32`，不写按 `3` 清；需要 gamemaster 权限。 |
