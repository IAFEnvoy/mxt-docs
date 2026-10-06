---
title: quality（品质）
description: 定义一档品质的名字、颜色与三个修正，以及它在品质链上的位置、链名与升级代价。
aside: false
---

# quality（品质） {#quality}

文件位置：`data/<namespace>/mxt/quality/<path>.json`

一个 `quality` 是一档品质。它叫什么是给界面看的，`value_multiplier` / `forging_modifier` / `alchemy_modifier` 是给经济、锻造与炼丹结算用的。它同时是品质链的一个环节：`next` 指向它上面那一档，`quality` 是这条链的名字，写在入口档上。

| 字段 | 类型 | 默认 | 说明 |
| --- | --- | --- | --- |
| `name` | Text Component | `quality.mxt.<命名空间>.<路径>` | 品质名称。 |
| `description` | Text Component | `quality.mxt.<命名空间>.<路径>.description` | 品质描述，画在品质名下面。 |
| `color` | Color | 无 | 品质颜色，写 `#RRGGBB`（整数或 `[r,g,b]` 浮点数组也接受），一律按不透明处理。 |
| `value_multiplier` | `Modifier` | `1` | 货币价值修正。 |
| `forging_modifier` | `Modifier` | `1` | 锻造修正。 |
| `alchemy_modifier` | `Modifier` | `1` | 炼丹修正。 |
| `condition` | `EntityCondition` | `mxt:always` | 使用该品质的条件。 |
| `next` | `quality` id | 无 | 指向它上面那一档，也就是升级的目标档；最高一档省略。 |
| `upgrade_costs` | `Cost` 数组 | `[]` | **升到这一档**要付的代价（写在目标档上），与技能消耗走同一套事务：`plan` → `commit` **整组原子**，付不出就一步都不动、也不写档。 |
| `upgrade_condition` | `EntityCondition` | `mxt:always` | **升到这一档**这一步能不能走，在扣费之前判。 |
| `quality` | Identifier | 无 | 这条链的名字，**写在入口档上**（入口档＝没有任何一档把它写成 `next` 的那一档）。链名只从入口档读一次，写在别的档上不会被当成链名。 |

`name` 与 `description` 都可以省略：省略就是表格里那个按条目 id 生成的键，写了就用你给的文本（字符串当翻译键、对象当完整组件）。

`condition` 不满足时，解析到这一档的物品用不了：使用、攻击、主手武器的周期行为，以及它给的原版属性修正都会停下。

`color` 的规矩与这两个文本字段不同：**写了就以它为准**（连 `name` 组件里自带的颜色也会被它盖过），**不写就一个字都不改**。它不是「默认白色」，没写颜色的品质照旧显示原版稀有度色。上色的地方只有四处：物品提示框的物品名那一行、提示框里「品质：<名>」那一行、`/picker` 里品质分类的条目名、锻造台蓝图 tooltip 的档位表。物品名那一行还能由玩家自己关掉：客户端配置「提示框 → 物品名跟随品质」（默认开），其余三处不受它影响。品质描述那一行始终是灰的。

`Modifier` 是三个可选对象，每个对象里的 `description` 与 `modifier` 也都可以省略：`modifier` 省略等于 `1`，`description` 省略**就不画那一行**（修正照样生效）。它的文案完全由数据包自己指定，没有自动生成：

```json
{
  "value_multiplier": {
    "description": "quality.mxt.example.refined.value_multiplier",
    "modifier": 1.25
  },
  "forging_modifier": {
    "modifier": "1 + level * 0.01"
  }
}
```

上面这份省略了 `name`、`description` 与 `forging_modifier.description`。

`value_multiplier` 结算时按 `modifier` 乘在该物品的货币单位面值上并四舍五入到整数，因此**看得到的就是付得出的**（Tooltip 显示的也是结算值）。`modifier` 缺失、非有限或 ≤0 时按 1 处理；乘积非有限、小于 1、超出 `long` 时退回声明面值，不会凭空造出一个数据包没写过的数。

`forging_modifier` 结算时用 `有效额外步数 = 实际额外步数 ÷ modifier` 去查品质档，也就是 >1 表示同样的手法能拿到更好的档。取值来自这场会话**锁定的材料**：多种材料取其中最低的一档品质，没有品质解析结果的材料跳过。`modifier` 为 1 时行为完全不变。

`alchemy_modifier` 决定开炉时长，`时长 = 声明时长 ÷ (原料侧修正 × 核心侧修正)`，>1 炼得更快，结果写进会话快照。两处各取一次：**作为材料**时取**开炉那一刻**炉内原料栈里最低的那一档（同样取最低品质、跳过无品质者）；**作为丹炉核心那一档**时，它直接缩短这台炉子炼**任何**丹方的时长（核心没有档时算 `1.0`）。它不参与炉温上限，任何档位的 `alchemy_modifier` 公式也读不到 `furnace_rank`。

## 品质链 {#ladder}

品质的高低不写在别处：每一档用 `next` 指向上一档，顺序、入口与链身份由运行时沿这些指针走一遍得出。链名是字段 `quality`，**写在入口档上**：

```json
// data/example/mxt/quality/common.json
{
  "quality": "example:pill",
  "next": "example:refined"
}

// data/example/mxt/quality/refined.json
{
  "next": "example:flawless",
  "upgrade_costs": [{ "id": "example:qi", "amount": 20 }]
}

// data/example/mxt/quality/flawless.json
{}
```

- 这三档属于同一条链 `example:pill`：链名写在入口档 `common` 上，运行时再顺着 `next` 传到 `refined` 与 `flawless`。想给链换名字就改这一处。
- **入口档自动是「没有任何一档指向它」的那一档**（这里就是 `common`）。它只决定链的顺序，**不给没有品质的物品补默认档**；链条不需要写 `default`，最低一档也就不需要写 `next`。
- **链名只从入口档读一次。** 把 `quality` 写到中间档上，入口档拿不到名字，于是**整条链都没有名字**（`/quality chain` 显示的链名是 `null`）。这**不报错**：写在中间档上的那份只会参与下面「一档收到两个不同链名」的检查。
- **升级的代价与条件写在升到的那一档上。** `common → refined` 读的是 `refined` 的 `upgrade_costs` 与 `upgrade_condition`。写在来源档上代表「升进它自己」，而入口档没有任何一档能升进去，那笔代价永远收不到——那一步实际免费，也**不报错**。
- **想把某一档当成顶端，就不写 `next`。** 写了 `next` 却没写 `upgrade_costs` 时那一步仍然存在，代价是空数组；反过来，一档没有 `next` 却写了 `upgrade_costs` 或非 `mxt:always` 的 `upgrade_condition` 会被报出来，因为那份数据永远读不到。
- **一条链是一条直线。** 一档只写一个 `next`，所以每档最多一个「下一档」；**两档把同一个 `next` 写成自己**（分叉）会被报出来，点名那一档跟着哪两档——分叉之后「这一档下面是谁」本来就没有唯一答案，所以**走进分叉点的那几条链整条不索引**（不是按注册表顺序挑一条），与成环同一个口径。**`next` 指向一个当前包没有的档不是「链不索引」，而是整个数据包加载失败**（世界直接拒绝加载），那条路走不到运行期。上一档与下一档都是从走出来的顺序里查表，两个方向对称。
- **一条链上一个名字。** 一档同时收到两个不同的链名（它自己写一个、上方的档又写了另一个）会被报出来；成环、或整条链接不到入口同样会报出来（`/reload` 会重跑一遍）。
- **不属于任何链的档也能用**：孤零零一档既没有 `next` 也没有 `quality` 时它自成一体，能显示、能被 `mxt:quality` 组件与三个修正读到，只是没有顺序、不能升级。

::: tip 两个同名的东西
`quality` 是**这一档上的字段**（这条链的名字，一个字符串），`mxt:quality` 是**物品上的组件**（装整份品质对象）。两个名字像，但不是同一个东西。
:::

## 品质是哪一档 {#resolution}

一条物品堆是哪一档，按固定顺序取**第一个能拿到的**答案。一共**三层**，先命中的赢。

**第一层，堆上的 `mxt:quality` 组件**（整份品质对象）。每个写档的地方写的都是它：[`/quality set`](/player-guide/commands/quality) 与 [MxtQuality](/kubejs/api/quality)，一次成功的 `upgrade`，以及**锻造台结算**与**画符铭刻**。它按注册表读回，所以当前包不再提供的那一档答不出东西，这一层落空后继续往下走，不会留下一个死的档位。

**第二层，这一堆携带的定义自己声明的 `quality`。** 一类定义共用一件内置物品——每本功法手册都是 `mxt:cultivation_jade_slip`、每颗丹都是 `mxt:pill`、每份炉型规格都是方块物品 `mxt:alchemy_furnace`、灵根石是 `mxt:spirit_root`、体质石是 `mxt:physique`——物品本身说不清是哪一档，只有堆上携带的这份定义说得清。这个字段一律可选，为了从堆上读到它，那一类定义要有一个已登记的载体组件（模组在类加载时登记自己的几个；附属模组登记自己的载体是另一页的事）。九个定义声明 `quality`，各由一个已登记的载体读到：

| 定义 | 载体组件 |
| --- | --- |
| `technique` | `mxt:technique`，值就是这份定义 |
| `alchemy_furnace` | `mxt:alchemy_furnace`，值就是这份定义 |
| `alchemy_wall_material` | `mxt:alchemy_wall_material` |
| `spirit_root` | `mxt:spirit_root` |
| `physique` | `mxt:physique` |
| `pill` | `mxt:pill`，组件是一个 record，定义在它里面的 `pill` 下 |
| `formation` | `mxt:formation_plate`，定义在 `formation` 下 |
| `secret_realm` | `mxt:secret_realm_token`，定义在 `realm` 下 |
| `contract_type` | `mxt:contract_scroll`，定义在 `contract_type` 下 |

当前包不再提供那一档时（那份定义被删掉，或引用没绑定）这一层答空，解析继续往下走。

`spirit_root` 与 `physique` 没有自由文本的档位字段，档位就是它们这个可选的 `quality` 引用；也没有 `mxt.rarity.<值>` 这类按文本值查档位的键。列一档时显示的是那一档自己的名字。

**第三层，注册表 [default_quality](./default_quality.md)**（条目用 `items` 认领物品，`quality` 写这一堆的档）。它是**第三层，也是最后一层**，恰好在这一堆**没有定义可问**的时候给出答案：裸的创造模式 / `/give` 物品，以及**按物品认领**的定义——`artifact` 与 `spirit_herb` 命中一件物品就算数，堆上没有任何装定义身份的组件。

三个定义刻意没有 `quality` 字段：

- `artifact` 与 `spirit_herb` 按物品认领（一件物品命中一份定义），堆上没有装定义身份的组件，没有可问的对象。它们的档写在 `default_quality` 里；一件物品只意味着一份定义时，这就是准确答案。
- `talisman` 的载体组件 `mxt:talisman` 装的是一**列**铭刻，同一堆上可能有好几张符，没有单份定义可问。它的档由画符配方的 `grades[].quality` 定，铭刻时写进 `mxt:quality` 组件；写不上才兜底到 `default_quality`。

**装列表的载体一律不登记**：`mxt:forging_methods`、`mxt:forging_blueprints`、`mxt:element`、`mxt:talisman`——一列东西答不出「这一堆是哪一档」。

链看这一堆解析出的那一档：链名写在档位自己身上，所以绑定表与组件都不必声明链。三层都没有答案时这一堆就是**没有品质**，不会去补某条链的入口档。

`/quality clear` 摘掉组件之后，这一堆退回**携带的定义**那一档，再退回注册表。堆上的 `mxt:pill` 组件里那些效果字段（`on_consume`、`toxicity_gain` 之类）只改写这一堆服用时做什么，不参与定档：定档读的是它里面 `pill` 那份定义自己的 `quality`。

**三个看起来像默认档、其实不是的东西：**

- `forging_blueprint.quality_by_extra_steps[].quality` —— 锻造曲线上的**目标档**，按额外步数查出来；
- 画符配方里的 `grades[].quality` —— 完成时命中的**目标档**，铭刻时写进组件；
- `quality` 条目自己的 `quality` 字段 —— 那是**链名**，写在入口档上。

这三个都不参与「这一堆是哪一档」的解析。

## 按档位筛物品 {#gating}

三个口子共用同一份要求，另外两处槽位仍是硬判据：`quality`（成员判定，条目 / `#品质标签` / 数组）与 `min_quality`（**至少到这一档**）。`min_quality` 按**这一档所在的那条链**比位置（与升级、`/quality chain` 同一份实现），**跨链一律答否**——不同链的序号没有可比性；两个都写就要都满足；只写 `min_quality` 时**没有档的物品答否**。两个都没写的要求在加载期被**拒绝**（空要求会静默恒真）。判据只有一处实现，三个口子只是把要求挂上去的不同方式：

1. **物品条件 `mxt:item_quality`**（`quality` 与新增的可选 `min_quality`）：任何跑物品条件的地方都能用，例如货币的 `unavailable_when`、绑定表的 `conditions`；见[物品条件](/datapack/types/condition/item_condition_types)。
2. **匹配器条目 `mxt:quality`**（`items` 必填，再加上面两个字段）：凡是用 [ItemMatcher](/datapack/types/other/item-matcher) 的地方都能用——`Cost` 的 `mxt:item`、`artifact` / `pill_binding` / `technique_binding` / `spirit_herb` 的 `items`、`mxt:item_matcher` / `mxt:item_id` / `mxt:item_tag` 条件、灵植的种子、拾取器。
3. **自定义材料 `mxt:quality`**（`neoforge:ingredient_type` + `items` + 上面两个字段）：**凡是用原版 `Ingredient` 的地方都能用**——原版与别的模组的配方、灵气合成、画符、`mxt:ingredient` 条件、[锻造蓝图](./forging_blueprint.md)的 `input`（那一项就是 sized ingredient），以及[画符配方](./talisman_drawing.md)的 `paper`（那一项就是 ingredient）；见[灵气合成](./spirit_crafting.md)。

还有一条窄路只对"材料条目"成立：匹配器条目 [**`mxt:ingredient`**](/datapack/types/other/item-matcher#mxtingredient) 能把一整个原版材料（含 `mxt:quality`）写进任何接受 `ItemMatcher` 的地方，画符那次取纸的代价走的就是它。

丹方还有两个字段挂在机器侧，不是物品自己的匹配条目：[`furnace_quality`](./alchemy_recipe.md) 要求**丹炉核心**的档位，[`input_quality`](./alchemy_recipe.md) 逐格要求输入仓里**每一格非空物品**（主药、辅药、药引都算；炉壁与多方块结构不看品质）。两份形状相同，都至少写一个字段、写空对象会被拒；不过就拒绝开炉、不扣料、不动供热方块。核心的档位还能作为变量 **`furnace_rank`** 进丹方自己的公式字段（药力公式与任何 `alchemy_modifier` 公式读不到它）；核心那一档自己的 `alchemy_modifier` 也进这一炉的时长换算，所以更高级的炉子炼得越快。

**两处槽位自己的谓词今天仍读不到档**：**丹炉输入仓**（认"被哪条 `spirit_herb` 认领 + 那味药的药力"；要按档筛投进去的药材就写在丹方的 `input_quality` 上，它在开局时逐格判，不是槽位谓词）与**符笔颜料**（`mxt:brush_pigment` 标签 + 服务端配置）。**画符符纸格**已经从硬 id 放宽成 `mxt:talisman_paper` 标签（内容把自己的纸加进标签即可），而"至少某档"这类要求现在写在**符方自己的 `paper` 字段**上——那一格答的是"这算不算纸"（客户端也答得出），"这份符方收不收"在开局时判。

**客户端答得出 `min_quality`**：连上服务器之后，客户端手里有同一份同步过来的品质注册表与标签，档位顺序就是从它自己走出来的，所以按档筛物品在客户端一样成立。只有**完全没有关卡**时（比如还在主菜单）才只剩成员判定可答——那时没有注册表，也就没有位置可比。落在服务端的匹配（配方、扣费、槽位）不受影响。

条件 `mxt:component` 也读不到品质——它要求 `nbt` 是复合标签并做偏序比较，而品质序列化成一个字符串。

原版标签不参与品质解析：`group/<name>` 标签不读。`tooltip_order` 只决定**列档位的顺序**——`/picker` 的品质类目就跟着它排，标签里点名的档位按标签写的顺序排在最前，其余档位随后；它不参与品质解析，也不改变链。`color` 只影响画品质名的地方，同样不参与解析。

## 名称与翻译 {#translation}

类别就是注册表自己的 path：`example:refined` 查 `quality.mxt.example.refined`，描述再加 `.description`（**注册表命名空间仍是 `mxt`**）。自带 `name` / `description` 的注册表里，品质是唯一会把 `description` 画出来的一张（画在品质名下面）；其余那些的 `description` 只被存储与读取，没有界面画它。JSON 里没有 `translation_key` 字段；路径里的 `/` 和其它注册表一样原样保留在键中。
