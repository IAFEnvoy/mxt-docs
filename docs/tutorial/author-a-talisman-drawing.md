---
title: 编写画符配方
description: "写一份画符配方：符形怎么描、判分参数管什么、每一档给什么产物，以及符纸与颜料这两笔账。"
---

# 编写画符配方

一份符方是 `data/<命名空间>/recipe/` 里的一个文件，配方类型是 **`mxt:talisman_drawing`**，ID 就是文件名带的路径：`data/example/recipe/talisman/flame_sigil.json` 的 ID 是 `example:talisman/flame_sigil`。它只在**画符工作站**里跑：玩家照着参考层誊写符形，服务端按笔迹算出一个完成度，再由配方自己的档位决定成败、档位与产物。

**它不是数据包注册表，而是原版配方类型**，所以走原版 `RecipeManager`：`/reload` 会重新读取它，它也不进配方书、永远不会在原版配方格里匹配。一份符方画**一种**符——"下品 / 常品 / 完美"想要三份定义就写三份符方，而不是在一份里分三种产物。

::: tip 这一篇与《定义符箓》的分工

[定义符箓](./inscribe-a-talisman.md) 讲的是那条链的另外几段：符箓定义写了什么、怎么把载体交到玩家手里、怎么灌注、怎么发动，以及手持与展示架两套规则。这一篇只讲**手工画出来的那一段**：玩家在工作站里把符形描出来，描得怎么样由这份文件判定。两者不重叠——符箓定义本身不在这页重复，画出来的产物是什么由顶层的 `talisman` 字段点名它。

:::

## 你要搭建什么

| 文件 | 用途 |
| --- | --- |
| `data/example/recipe/talisman/flame_sigil.json` | 本页唯一的文件：画出 `example:flame_sigil`，收哪些纸、描什么形、判得怎么样、每一档给什么。 |

**前提是[定义符箓](./inscribe-a-talisman.md)已经做完**：那份符箓定义 `data/example/mxt/talisman/flame_sigil.json` 与它铭刻的技能 `example:spark` 都在包里。符方自己**不写名字也不写描述**，列表里的条目名与产物 tooltip 里那一行都取自顶层 `talisman` 点名的那份定义。

一份符方分几块，各答一件事：`talisman` 出什么、`pattern` 画什么、`judgement` 怎么判、`result` 判完给什么、`paper` 画在什么纸上、`costs` 额外花什么；另有两个只改纸面观感的颜色字段。**最小配方只需要 `talisman`、`pattern.strokes` 与 `result.grades` 的一档**，其余全有默认值：

```json
{
  "type": "mxt:talisman_drawing",
  "talisman": "example:flame_sigil",
  "pattern": {
    "strokes": [[[0.50, 0.06], [0.50, 0.94]]]
  },
  "result": {
    "grades": [{"min_completion": 0}]
  }
}
```

这份最小配方永远成功（最低档就是及格线，写在 `0` 就是必然成功），画出来的是没有额外档位、没有额外产物的 `example:flame_sigil`。下面五步把它长成一份真正能用的符方。完整字段表见 [talisman_drawing（画符配方）](../datapack/json/talisman_drawing.md)。

## 第 1 步 —— 符形：`pattern`

```json
// data/example/recipe/talisman/flame_sigil.json
{
  "type": "mxt:talisman_drawing",
  "talisman": "example:flame_sigil",
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
    "grades": [{"min_completion": 0}]
  }
}
```

| 字段 | 类型 | 默认 | 说明 |
| --- | --- | --- | --- |
| `guide` | `always` / `fade` / `none` | `fade` | 誊写时参考层的显示方式：一直显示 / 起笔后淡出 / 不画。 |
| `show_order` | Boolean | `false` | `true` 时在每一笔的起点画一个小点与笔序号，帮玩家记笔顺。 |
| `tolerance` | double | `0.06` | 判分容差，必须为正；口径是**画布高度的比例**。 |
| `strokes` | `double[2][][]` | **必填** | 符形本体：每一笔一条折线，点是 `[u, v]`。 |

**`strokes` 的坐标空间是固定的。** 每个点都是 `[u, v]`，必须有限、落在 `[0,1]²` 里，至少一笔、每笔至少两点。`[0,1]²` 换算到的画布**不可配置**：固定 90 × 210，`u` 乘 90 是横坐标、`v` 乘 210 是纵坐标。所以上面三笔按像素读出来是一竖（`x=45`）两横，与参考页的示例同一个形状。

**`strokes` 怎么写得出来。** 手写这几个数很难看，仓库里带了一个单文件浏览器编辑器 `tools/talisman_strokes.html`：直接双击打开（`file://` 即可，不用构建、不用起服务），它画的正是工作站那张纸——90 × 210 的画布、`#FFFE85` 纸底与 `#FF0000` 笔画这两个默认色。两种画法（点顶点的折线与拖拽的徒手线），`Ctrl+Z` / `Ctrl+Y` 撤销重做，右侧的 `Copy JSON` 复制出来的就是 `pattern.strokes` 的值，`Load from JSON` 也能把已有的 `strokes` 数组或整个 `pattern` 块喂回去。它只画形状：`guide` / `show_order` / `tolerance` 都是配方字段，工具不写；它也会提前报出加载期会拒的形状问题（某一笔不足两点、超过 256 笔、单笔超过 4096 点、所有点重合）。

`tolerance` 一处管三件事：判分容差、笔迹简化的阈值、以及"这一笔算不算闭合"的判据。它是**画布高度的比例**，`0.06` 就是 210 × 0.06 ≈ 12.6 像素。

## 第 2 步 —— 判分：`judgement`

```json
// data/example/recipe/talisman/flame_sigil.json
{
  "type": "mxt:talisman_drawing",
  "talisman": "example:flame_sigil",
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
  "judgement": {
    "sigma": 0.8,
    "topology_weight": 0.35
  },
  "result": {
    "grades": [{"min_completion": 0}]
  }
}
```

整块 `judgement` 都可以省略（省略就是每一项的默认值），它**没有一个字段改得动产物**：改它只改完成度那个数。

| 字段 | 类型 | 默认 | 说明 |
| --- | --- | --- | --- |
| `sigma` | double | `1.0` | 完成度映射的宽容度，必须为正。 |
| `direction_weight` / `topology_weight` / `order_weight` | double | `0.25` / `0.25` / `0.25` | 方向、拓扑、笔序三个辅助项的权重，都不小于 `0`。 |
| `stroke_count_strict` | Boolean | `false` | `true` 时笔数与参考不符就直接让笔序项判满。 |
| `min_stroke_length` | double | `0.02` | 短笔门槛，不小于 `0`，口径同样是画布高度的比例。 |
| `preview` | Boolean | `true` | `false` 时客户端不算本地完成度预览。 |

三个权重之外还有一个**形状项**，它固定是 `1.0`，没有对应字段。三个权重全写 `0` 是允许的（只按形状判分），加载期会记一条警告。上例把 `topology_weight` 抬到 `0.35`，意思是"交叉与闭合这类结构比方向更容易描错，多罚一点"。

完成度这个数怎么算出来的、每一项的份量落在哪里，见[画符判分](../technical/talisman-scoring.md)。

**`resample_step` / `simplify_epsilon` 不是字段**：重采样步长与笔迹简化的阈值系数是判分器里的常量，写进 `judgement` 与写任何未知键一样被静默忽略。

## 第 3 步 —— 档位与产物：`result`

```json
// data/example/recipe/talisman/flame_sigil.json
{
  "type": "mxt:talisman_drawing",
  "talisman": "example:flame_sigil",
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
  "judgement": {
    "sigma": 0.8,
    "topology_weight": 0.35
  },
  "result": {
    "grades": [
      {"min_completion": 0.35, "quality": "example:common"},
      {"min_completion": 0.60, "quality": "example:refined"},
      {
        "min_completion": 0.85,
        "quality": "example:flawless",
        "charge_ratio": "percentage",
        "max_damage": "10 + 5 * paper_rank",
        "outputs": [{"id": "mxt:cinnabar"}]
      }
    ],
    "failure_outputs": [],
    "success_action": {"type": "mxt:no_op"},
    "failure_action": {"type": "mxt:no_op"}
  }
}
```

| 字段 | 类型 | 默认 | 说明 |
| --- | --- | --- | --- |
| `grades` | 对象数组 | **必填**，非空 | `1`–`64` 档，`min_completion` 必须唯一且升序。 |
| `grades[].min_completion` | double | **必填** | 这一档的及格线，落在 `[0,1]`。 |
| `grades[].quality` | 品质 id | 无 | 命中这一档时写给产物的档位，不写就不写组件。 |
| `grades[].max_damage` | 数值提供器 | 无 | 覆盖载体耐久上限，形状与符箓定义那一套相同。 |
| `grades[].charge_ratio` | 数值提供器 | `0` | 产出时按比例灌注灵气，`0` 就是不灌。 |
| `grades[].outputs` | `ItemStackTemplate[]` | `[]` | 这一档的额外产物。 |
| `failure_outputs` | `ItemStackTemplate[]` | `[]` | 失败时给的东西；默认空就是只烧掉材料。 |
| `success_action` / `failure_action` | 实体行为 | `mxt:no_op` | 成功与失败各跑一次。 |

四条要记住的语义：

- **命中哪一档只看完成度**：逐档往下走，取**最后一个不会超过完成度的及格线**。所以最低档就是整份符方的及格线，`0.35` 意味着低于它走失败；写 `0` 就是必然成功。
- **`min_completion` 必须唯一且升序**，1 到 64 档；重复或乱序在加载期被拒，而不是"取其中一个"。
- **完成度决定成败，档位与产物由这一档决定**：命中的档写不写 `quality`、灌不灌灵气、给不给额外产物，都是这一档自己的事。`failure_outputs` 只在**真正走到结算**的那次失败上给东西。
- **`result` 里的公式多两个变量**：`percentage` 是本次完成度（0 到 1），`paper_rank` 是实际取走的那张纸上写的档在它自己那条链上的位置（从入口档数起，`0` 是入口档，也是"这张纸没有档 / 档不在链上"时唯一能给的数——公式分不出这两种）。变量名两边都不是的名字在**加载期**被拒；`outputs` 读不到它们，`ItemStackTemplate` 的数量是写死的，要按完成度给不同数量就分档写。

**画出来的东西是什么**：命中档产出的是 `mxt:talisman` 那件载体，上面铭刻顶层 `talisman` 点名的那份定义（模式是 `fire`），档位写进 `mxt:quality` 组件、耐久按 `max_damage` 写进原版组件、`charge_ratio` 按载体容量灌注灵气，`outputs` 另外给。所以"描得越好，符越好"就写在这一块里。

`success_action` / `failure_action` 是普通的实体行为，可以在这里发一条消息、给药水、扣别的东西；两个都省略等于 `mxt:no_op`。

## 第 4 步 —— 符纸与颜料

```json
// data/example/recipe/talisman/flame_sigil.json
{
  "type": "mxt:talisman_drawing",
  "talisman": "example:flame_sigil",
  "paper": "mxt:blank_talisman",
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
  "judgement": {
    "sigma": 0.8,
    "topology_weight": 0.35
  },
  "result": {
    "grades": [
      {"min_completion": 0.35, "quality": "example:common"},
      {"min_completion": 0.60, "quality": "example:refined"},
      {
        "min_completion": 0.85,
        "quality": "example:flawless",
        "charge_ratio": "percentage",
        "max_damage": "10 + 5 * paper_rank",
        "outputs": [{"id": "mxt:cinnabar"}]
      }
    ],
    "failure_outputs": [],
    "success_action": {"type": "mxt:no_op"},
    "failure_action": {"type": "mxt:no_op"}
  }
}
```

**符纸是两条口径，别混。**

| 那条口径 | 由谁说了算 |
| --- | --- |
| 界面那一格收不收这一叠 | 物品标签 `#mxt:talisman_paper`（本体往里面放的是 `mxt:blank_talisman`，内容包可以加自己的纸）。**槽位只认这个标签**，因为客户端也要答得出"这算不算纸"。 |
| 这份符方收不收、取走哪一份 | 配方自己的 `paper` 字段（原版 `Ingredient`），**不写就是那个标签**。 |

所以 `paper` 是"在标签范围内再收窄"：写到标签外面的纸永远开不了局。上例写 `"mxt:blank_talisman"` 就是那个标签里的那一张；想按档位收纸就写自定义材料 `{"neoforge:ingredient_type": "mxt:quality", "items": "#mxt:talisman_paper", "min_quality": "example:common"}`，于是没档的纸根本开不了局。那张纸由配方类型自己从界面那一格扣，删不掉；`costs` 里额外写的 `mxt:item` 实际上只有"再多一张纸"能成立。

**颜料不进 `costs`。** 画符是按**每一笔的长度**从**符笔自己的存量**里扣，那口存量是物品组件 `mxt:brush_pigment`（1 单位＝1 像素弧长），而符笔怎么蘸料、一份颜料算多少、一支笔能装多少，全都不在数据包里：

| 由谁说了算 | 默认 | 管什么 |
| --- | --- | --- |
| 物品标签 `#mxt:brush_pigment` | 本体只有朱砂 `mxt:cinnabar` | 哪些物品算颜料。加料是原版储物袋那套点击：**光标提着符笔对着颜料物品点一下**，一次一份，背包 / 箱子 / 工作站都行（界面里没有颜料槽）。 |
| 服务端配置「符箓 → 符笔容量」 | `4000` | 一支符笔能装多少颜料。 |
| 服务端配置「符箓 → 一份颜料的点数」 | `1000` | 一份颜料蘸进符笔后给多少。 |
| 服务端配置「符箓 → 颜料换算率」 | `1.0` | 每像素弧长扣多少颜料。 |
| 服务端配置「符箓 → 单笔颜料保底」 / 「单笔颜料上限」 | `1` / `0` | 每一笔至少扣多少、最多扣多少（`0` 不封顶）。 |

一张 90 × 210 的符，笔画总长通常在 400–1200 像素，所以默认一支笔约能描满 3–5 张。**一笔颜料不够会被拒收**，被拒的笔数超过服务端配置「符箓 → 允许被拒的笔数」（默认 `3`）这一次绘制就判失败、材料不退；"光标上已经没有那支笔了"不计入。颜料与笔的完整玩法见[符笔与颜料](../player-guide/items.md#符笔与颜料)。

## 第 5 步 —— 在工作站里描

摆一个画符工作站（`mxt:talisman_workstation`）右键打开：左边是要描的那张纸，中间是符形列表，右边是画布。

1. **放纸。** 那一格只收 `#mxt:talisman_paper` 里的物品。放好之后列表里会列出所有**此刻能选**的符方：解锁条件（`unlock_condition`，默认 `mxt:always`）成立、纸与 `costs` 付得出，那一行才是可选的。
2. **选符方。** 一条都选不了时先看 `unlock_condition`——它读的是**打开界面这一拍**的玩家状态，所以"境界不够"这类门槛表现为"这一行选不了"。
3. **描。** 每一笔的长度从符笔的颜料里扣。笔不在光标上、颜料不够、单笔点数超过「单笔点数上限」（默认 `512`）、两笔间隔小于「最小落笔间隔」（默认 300 毫秒）都会被拒；被拒太多（默认超过 3 笔）这一次就判失败。
4. **提交。** 服务端拿 1–64 笔、总共不超过 4096 点的那份笔迹算完成度，再按 `result.grades` 判档：命中一档就产出载体（档位、耐久、灌注与额外产物都按那一档写），一笔都没命中就按失败结算，`failure_outputs` 与 `failure_action` 这时才跑。
5. **关界面也算一次判定**：描到一半关掉（或切走、按取消）**判失败**——符纸不退、`failure_action` 照跑，因为纸上的笔迹擦不掉。**一笔都没画就关**则整格退回背包，什么都没发生。

工作站里画的每一笔都由服务端重新量、完成度也由服务端重算，客户端报上来的时间与用量不读。

## 在游戏里验证

符方是**原版配方**，所以 `/reload` 就能重新读取它（改的是本章开头那个 JSON 的话，不用重开世界）：

```text
/reload                                  → 重新读取符方
/mxt registries validate                 → 顺带确认注册表没问题
/give @s mxt:talisman_brush
/give @s mxt:blank_talisman 8
/give @s mxt:cinnabar 2
```

1. 把符笔放到光标上，对着背包里的朱砂点一下：笔吸进一份颜料（默认 1000），提示框里出现「颜料：已存 / 上限」那一行。点两下就是两份。
2. 摆一个画符工作站右键打开，把符纸放进左格：列表里出现 `example:flame_sigil`（名字就是那份符箓定义的显示名）。境界不满足时它**选不了**，这就是 `unlock_condition` 在起作用。
3. 选中它，照着参考层描完三笔：`guide: "fade"` 表现为起笔之后参考层淡出；描的时候笔上的颜料按弧长往下掉。
4. 认认真真描到 `0.85` 以上：产出的载体带 `example:flawless` 档（tooltip 里那一行档位）、有耐久条、已经被灌进一部分灵气（`charge_ratio: "percentage"` 按完成度灌），另外还给一份朱砂。
5. 故意画歪、让完成度落到 `0.35` 以下：这一次失败，纸与颜料都没了，`failure_outputs` 是空的，所以什么也不给。
6. 把 `tolerance` 从 `0.06` 改成 `0.02` 再 `/reload`，用**同样的笔迹**重画一次：容差变小、同样的手抖换来更低的完成度，命中的档位跟着掉。
7. 把 `charge_ratio` 从第三档删掉再 `/reload`：产物不再被灌注，其余不变——判分参数与产物是两块互不影响的东西。

## 常见错误

| 现象 | 原因 |
| --- | --- |
| 列表里一份符方都没有 | 这个配方类型不进配方书、也不在原版格里匹配，它只在画符工作站里出现；先去工作站里看。 |
| 某一行的符方选不了 | `unlock_condition` 对**打开界面这一拍**的玩家不成立，或者纸/`costs` 付不出；这条判定里没有笔，笔是每一笔单独查的。 |
| 世界带着 Codec 错误拒绝加载 | `pattern` 或 `result` 整块漏了、`grades` 为空、`min_completion` 重复或乱序（必须唯一升序）、`tolerance` 或 `sigma` 不是正数、某个点是 NaN 或落在 `[0,1]²` 外面。 |
| 符形画到纸上位置不对 | `[u, v]` 是**归一化**坐标，画布固定 90 × 210；写了像素值（例如 `45`）就落在 `[0,1]²` 外面，加载期直接拒。 |
| 产物里没有档位那一行 | 命中的那一档没写 `quality`，于是产物不带 `mxt:quality` 组件；兜底档要看注册表 `default_quality`。 |
| 写 `resample_step` / `simplify_epsilon` 没有反应 | 它们不是字段，与任何未知键一样被静默忽略；重采样与简化是判分器里的常量。 |
| 明明描得不错却判失败 | 失败不是"完成度不够"一条路：被拒的笔数超过服务端配置「符箓 → 允许被拒的笔数」、提交的笔迹与服务端收到的不一致、笔数或点数超过上限，都会判失败。 |
| 描到一半关掉界面，符纸不见了 | **画到一半关＝失败**（纸不退、`failure_action` 照跑）；一笔都没画就关才会整格退回背包。 |
| 想给"描得越好给得越多" | `outputs` 的数量写死在 `ItemStackTemplate` 里、读不到公式；按完成度给不同数量要分档写。 |
| 想按符纸的档位加成 | `paper_rank` 就是为这个准备的，写进 `max_damage` / `charge_ratio` 这类公式字段；`outputs` 读不到它。 |
| 改了文件却什么也没变 | 符方走原版配方，`/reload` 会重读；但如果符方点名的 `talisman` 那份**定义**没写对，加载期就会拒绝整个文件。 |

## 接下来

- [talisman_drawing（画符配方）](../datapack/json/talisman_drawing.md) —— 每个字段的完整说明、加载期校验与那一份带档位要求的示例。
- [talisman（符箓）](../datapack/json/talisman.md) —— 顶层 `talisman` 点名的那份定义：铭刻了什么、装得下多少、一次扣多少，以及耐久与档位怎么落到载体上。
- [通用物品](../player-guide/items.md) —— 画符工作站、符笔与颜料在游戏里怎么用。
- [定义符箓](./inscribe-a-talisman.md) —— 这一篇的前提与另一半：先把 `example:flame_sigil` 与它铭刻的技能写出来，再回来看这一页画的是什么。
