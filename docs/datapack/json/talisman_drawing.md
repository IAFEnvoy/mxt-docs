---
title: talisman_drawing（画符配方）
description: 画符配方只在画符工作站里按玩家画出来的笔迹判定：它声明画什么符形、怎么判分、每一档给什么产物，以及附带的消耗。
aside: false
---

# talisman_drawing（画符配方）

画符配方是原版配方类型 **`mxt:talisman_drawing`**，只在**画符工作站**里跑：玩家照着参考层誊写符形，判分器按笔迹给一个完成度，再由配方自己的档位决定产物。它**不进配方书**，也**不会在原版配方格里匹配**。

这是本模组注册的**原版配方类型**，不是数据包注册表。

## 文件位置

符方放在数据包内的 `data/<namespace>/recipe/` 目录，和合成配方、丹方同一棵树。文件名对应它的 ID：`data/example/recipe/fire_talisman.json` 的 ID 是 `example:fire_talisman`。

每个文件都要声明 `"type": "mxt:talisman_drawing"`。

## 五块各答一件事

一份符方分五块：`talisman` 出什么、`costs` 额外花什么、`pattern` 画什么、`judgement` 怎么判、`result` 判完给什么；另有两个只改纸面观感的颜色字段（`background_color` 纸底、`foreground_color` 笔画）。**最小配方只需要 `talisman`、`pattern.strokes` 和 `result.grades` 的一档**，其余全有默认值。

| 字段 | 类型 | 默认 | 说明 |
| --- | --- | --- | --- |
| `type` | String | **必填** | 必须是 `mxt:talisman_drawing`。 |
| `unlock_condition` | [实体条件](../types/condition/entity_condition_types.md) | `mxt:always` | 这位玩家此刻能不能在这台工作站里选到这份符方，打开界面时现算。 |
| `talisman` | 符箓 id | **必填** | 这份符方画出来的那张符，见 [talisman](./talisman.md)。**命中任意一档产出的都是它**；一份符方一种符，要"下品 / 常品 / 完美"三份定义就写三份符方。ID 写错会让整个文件加载失败。 |
| `costs` | 数组，条目见 [`Cost`](../types/shared_data_types.md#cost) | `[]` | **只写额外消耗**：这个配方类型自己永远从界面那一格取走 `1 × mxt:blank_talisman`，写不写 `costs` 都存在。那一格是菜单自己的临时格（照原版工作台，关界面把格里剩下的还给玩家），`mxt:item` 条目从那一格扣，其余类型由玩家付。 |
| `pattern` | 对象 | **必填** | 画什么，见下。 |
| `background_color` | `RGBColor` | `#FFFE85` | 纸面的底色（浅黄）。 |
| `foreground_color` | `RGBColor` | `#FF0000` | **玩家画出来的那条线**的颜色（纯红）。**参考层（`pattern.guide` 描红那一层）不吃它**——参考层一直是那身淡褐，否则与笔画分不开。 |
| `judgement` | 对象 | 见下 | 判分参数，整块可选。**这一块没有一个字段影响产物**，改它只动完成度。 |
| `result` | 对象 | **必填** | 判档、写产物、跑动作，见下。 |

### `pattern`

| 字段 | 类型 | 默认 | 说明 |
| --- | --- | --- | --- |
| `guide` | `always` / `fade` / `none` | `fade` | 誊写时参考层的显示方式：一直显示 / 起笔后淡出 / 不画。 |
| `show_order` | Boolean | `false` | `true` 时在每一笔的起点画一个小点与笔序号，帮玩家记笔顺。 |
| `tolerance` | double | `0.06` | 判分容差，必须为正。口径是**画布高度的比例**，同时决定笔迹简化的阈值与"闭合笔"的判据。 |
| `strokes` | `double[2][][]` | **必填** | 符形本体：每一笔一条折线，点是 `[u, v]`，必须有限并落在 `[0,1]²`，至少一笔、每笔至少两点。**画布尺寸不可配置**：固定 90 × 210，`[u, v]` 按它换算。 |

### `judgement`

| 字段 | 类型 | 默认 | 说明 |
| --- | --- | --- | --- |
| `sigma` | double | `1.0` | 完成度映射的宽容度，必须为正。 |
| `direction_weight` / `topology_weight` / `order_weight` | double | `0.25` / `0.25` / `0.25` | 方向、拓扑、笔序三个辅助项的权重，都不小于 `0`。形状项固定是 `1.0`，没有对应字段。三个都为 `0` 时只按形状判分（允许，加载期记一条警告）。 |
| `stroke_count_strict` | Boolean | `false` | `true` 时笔数与参考不符就直接让笔序项判满。 |
| `min_stroke_length` | double | `0.02` | 短笔门槛，不小于 `0`，口径同样是画布高度的比例；短于它的整笔在计分前被丢掉。 |
| `preview` | Boolean | `true` | `false` 时客户端不算本地完成度预览。 |

这一块一个字段都改不动产物，改它只动完成度；完成度本身是怎么算出来的、每一项的份量落在哪里，见[画符判分](/technical/talisman-scoring)。

### `result`

| 字段 | 类型 | 默认 | 说明 |
| --- | --- | --- | --- |
| `grades` | 对象数组 | **必填**，非空 | `1`–`64` 档。`min_completion` 必须**唯一且升序**，重复或乱序在加载期被拒。最低档就是整份符方的及格线，写一档 `min_completion: 0` 就是必然成功。 |
| `grades[].min_completion` | double | **必填** | 这一档的及格线，落在 `[0,1]`。 |
| `grades[].quality` | 品质 id | 无 | 命中这一档时写给产物的品阶；不写就落到顶层 `talisman` 定义自己的 `quality`。 |
| `grades[].max_damage` | [数值提供器](../types/number_provider_types.md) | 无 | 覆盖载体耐久上限，形状与符箓定义那一套相同。 |
| `grades[].charge_ratio` | [数值提供器](../types/number_provider_types.md) | `0` | 产出时按比例灌注灵气，默认 `0` 就是不灌；求值不大于 `0` 就一项都不灌。 |
| `grades[].outputs` | `ItemStackTemplate[]` | `[]` | 这一档的额外产物。 |
| `failure_outputs` | `ItemStackTemplate[]` | `[]` | 失败时给的东西；默认空就是只烧掉材料。 |
| `success_action` / `failure_action` | [实体行为](../types/action/entity_action_types.md) | `mxt:no_op` | 成功与失败各跑一次。 |

`result` 里的公式**只多一个变量 `percentage`**，就是本次完成度（0 到 1）：`max_damage`、`charge_ratio` 与两个动作里的数值提供器都能读它，写法就是普通公式（`"0.5 + 0.5 * percentage"`、`"percentage * percentage"`）。变量名必须是 `percentage` 或注册表提供的公式变量，**两边都不是的名字在加载期被拒**，不会静默取 0。`outputs` 读不到它——`ItemStackTemplate` 的数量是写死的，要按完成度给不同数量就分档写。

符方**不声明 `name` / `description`**：符方列表里的条目名与产物 tooltip 里那条符箓名，一律取自顶层 `talisman` 点名的那份定义。

## 加载期校验

`pattern.strokes` 非空（1–256 笔）、每笔 2–4096 点、点有限且在 `[0,1]²`、整份符形的点云 RMS 半径大于 `0`（所有点重合的符形没有意义）；`tolerance > 0`；`sigma > 0`；三个权重与 `min_stroke_length` 不小于 `0`；`result.grades` 为 1–64 档且 `min_completion` 唯一升序。

重采样步长与笔迹简化的阈值系数是判分器里的常量，不是字段：`judgement` 里写 `resample_step` / `simplify_epsilon` 与写任何未知键一样**被静默忽略**。

## 材料与颜料

界面那一格只接受 `mxt:blank_talisman`（符纸），这一张由配方类型自己扣，删不掉。所以 `costs` 里额外写的 `mxt:item` 实际上只有"再多一张符纸"能成立。其余条目（`mxt:resource` / `mxt:aura` / `mxt:js`）照普通消耗的规则由玩家付。**画到一半关掉界面 = 这次画符判失败**（符纸不退、配方的 `failure_action` 照跑）；一笔都没画就关则整格退回背包。

**颜料不进 `costs`**：画符按每一笔的长度从**符笔自己的存量**里扣，那口存量是物品组件 `mxt:brush_pigment`。加料照原版储物袋那套点击：**光标提着符笔对着颜料物品点一下**，一次一份（点几下就蘸几份）——背包、箱子、工作站都行，与槽位无关（工作站里没有颜料槽），哪些物品算颜料由物品标签 `#mxt:brush_pigment` 说了算（本体只有朱砂 `mxt:cinnabar`）。一份多少由服务端配置「符箓 → 一份颜料的点数」说了算，一支笔还剩多少由服务端配置「符箓 → 符笔容量」封顶。

## 示例

```json
{
  "type": "mxt:talisman_drawing",
  "unlock_condition": { "type": "mxt:realm", "realm": "example:foundation", "comparison": "at_least" },
  "talisman": "example:fire_talisman",
  "pattern": {
    "guide": "fade",
    "show_order": false,
    "tolerance": 0.06,
    "strokes": [
      [[0.50, 0.06], [0.50, 0.94]],
      [[0.22, 0.28], [0.50, 0.10], [0.78, 0.28]],
      [[0.30, 0.72], [0.70, 0.72]]
    ]
  },
  "result": {
    "grades": [
      { "min_completion": 0.35, "quality": "example:inferior" },
      { "min_completion": 0.65, "quality": "example:common" },
      { "min_completion": 0.88, "quality": "example:perfect",
        "charge_ratio": "0.5 + 0.5 * percentage",
        "outputs": [{ "id": "mxt:cinnabar" }] }
    ],
    "failure_outputs": [],
    "success_action": { "type": "mxt:no_op" },
    "failure_action": { "type": "mxt:no_op" }
  }
}
```

这份符方画的是 `example:fire_talisman`，名字与描述也取自那份定义：完成度不低于 `0.35` 给 `example:inferior`、不低于 `0.65` 给 `example:common`、不低于 `0.88` 换成 `example:perfect` 并按 `0.5 + 0.5 × 完成度` 灌注灵气、额外再给一份 `mxt:cinnabar`；低于 `0.35` 走失败，`failure_outputs` 为空，所以只烧掉材料。三笔的 `[u, v]` 都落在 `[0,1]²` 里，按 90 × 210 换算成像素就是一竖两横。
