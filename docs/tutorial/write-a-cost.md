---
title: 编写消耗
description: "一套被满包复用的消耗数组：五种写法、四种类型各扣在哪条通道、全有或全无的边界与回退顺序、付不出时玩家看到什么，以及脚本消耗怎么注册。"
---

# 编写消耗

**消耗没有自己的文件。** `Cost` 是十几个字段共用的一个数组：技能、修炼、阵法、锻造、契约、符箓、数值升级都写它，每一项说「要扣一样东西，扣多少」。形状只有这一个，学会它，满包的「要付什么」就都会写了。

这篇教程只讲这个数组本身——数组长什么样、四种类型各从哪儿扣、一次动作里好几笔怎么算一笔、付不出时发生什么。**具体某个模块的 `costs` 字段什么时候付、和它的冷却与条件谁先谁后，属于那个模块自己的页面**，本篇不展开，只把出处列在 `## 接下来` 里。

## 你要搭建什么

| 文件 | 用途 |
| --- | --- |
| `data/example/mxt/ability/qi_bolt.json` | *（编辑）* 把这发灵力弹的 `costs` 换成一份四种类型都有的消耗数组。 |
| `kubejs/server_scripts/mxt_costs.js` | *（新建）* 用 `MxtCosts.register` 注册一条脚本消耗，给脚本侧的自己实现一种代价。 |

前提是示例包已经搭好，并且 `example:qi_bolt` 这条技能已经存在——`## 约定` 里那份文件树列出的就是本篇改的那个文件。它还用到 `example:qi` 这个数值，以及 `example:qi` 这门灵气。[定义灵气与境界](./define-aura-and-realms.md) 里两者都已经写好了。

本篇**不新增任何注册表文件**。

## 第 1 步 —— 数组与简写

需要消耗东西的字段统一是同一个数组，每项写一种 `Cost`：

```json
"costs": [
  {"id": "example:qi", "amount": 10}
]
```

只写 `id` 与 `amount` 的那一项是**简写**，它被读作 `mxt:resource`——也就是「从付款者的账户里扣掉 `example:qi` 这个数值 10 点」。写成完整形式一模一样：

```json
"costs": [
  {"type": "mxt:resource", "resource": "example:qi", "amount": 10}
]
```

简写是给老写法用的口子，两种写法可以混在同一个数组里，`MxtCosts` 与 `MxtResources.consume` 也照样接受。

`amount` 一律是[数值提供器](../datapack/types/number_provider_types.md)：常量、公式串或固有提供器都行。它**使用时必须求值为有限正数**——算不出有限值、算了 `0` 或负数，这一项就付不出（失败原因是 `INVALID_AMOUNT`），而不是「按 0 扣」。

```json
"costs": [
  {"id": "example:qi", "amount": "5 * caster_example_qi"}
]
```

`amount` 也接受公式串（上面那项就是一个），而公式按**付款者**求值。`Cost` 只用付款者做检查，所以它拿不到事件载荷：付款者上下文里有的名字读得到，某个事件注入的变量读不到——脚本回调那边说得最直白：`context.value('level')` 可用，`context.value('damage')` 不可用。想知道某个名字在消耗里能不能用，先看它是不是付款者自己提供的。

## 第 2 步 —— 四种类型，各挑各的

写 `type` 的四种由固有注册表 `mxt:cost_type` 分派，模组注册、数据包只能选用不能新增：

| `type` | 字段 | 从哪儿扣 |
| --- | --- | --- |
| `mxt:resource` | `resource`、`amount` | 付款者自己的数值账户。 |
| `mxt:aura` | `aura`、`amount` | 按灵气身份扣；扣哪一份由付款通道决定，见下。 |
| `mxt:item` | `items`、`amount` | 匹配的物品，向上取整。 |
| `mxt:js` | `id`、`params` | 交给服务端脚本回调。 |

```json
"costs": [
  {"type": "mxt:resource", "resource": "example:qi", "amount": 10},
  {"type": "mxt:aura", "aura": "example:qi", "amount": 2},
  {"type": "mxt:item", "items": ["minecraft:emerald", "#c:gems"], "amount": 2},
  {"type": "mxt:js", "id": "example:quest_token", "params": {"count": 3}}
]
```

**`mxt:resource` 点的是一个数值，`mxt:aura` 点的是一门灵气身份**——这是两件不同的事。灵气是身份、数值是存量：灵气定义指出「这门灵气用哪个数值来度量」，所以付款者自己支付一笔 `mxt:aura` 时，扣的其实是那个数值。

`mxt:item` 的 `items` 是一个 [`ItemMatcher`](../datapack/types/shared_data_types.md#itemmatcher)：裸物品 ID、`#物品标签`，或带 `type` 的匹配条目（`mxt:item`、`mxt:tag`、`mxt:wildcard`、`mxt:regex`、`mxt:technique`、`mxt:spirit_storage`、`mxt:herb_tag`、`mxt:quality`、`mxt:ingredient`）混在一个数组里。它的 `amount` **向上取整**，所以写 `1.5` 是取走 2 个；取整后非正或非有限表示这一笔无法支付，而不是「取走 0 个」。

`mxt:aura` 比另外三种多一件事：**它能扣的不止一份存量**。付款者自己支付时，扣的是这门灵气所度量的那个数值；由场地从**共享灵气池**支付时（修炼的 `aura_costs`），先按同区块多人修炼的池子分配份额缩放，再由池子全有或全无地扣；从**方块实体的自有存量**支付时（灵气合成配方的 `aura`），扣这门灵气本身、按整单位向上取整。同一份 `mxt:aura` 条目写在哪，就由那处的通道决定它扣在哪——条目自己不带这个信息。

有两条字段**只收 `mxt:aura` 条目**，写别的类型是加载错误：`cultivation.aura_costs` 与灵气合成配方的 `aura`。它们还接受映射写法：键是灵气 id、值是数值提供器。

## 第 3 步 —— 把数组接到技能上

打开示例包里已有的这发灵力弹，只换掉 `costs`：

```json
// data/example/mxt/ability/qi_bolt.json
{
  "type": "mxt:active",
  "icon": "example:textures/gui/ability/qi_bolt.png",
  "costs": [
    {"id": "example:qi", "amount": 10},
    {"type": "mxt:aura", "aura": "example:qi", "amount": 2},
    {"type": "mxt:item", "items": ["minecraft:emerald", "#c:gems"], "amount": 2}
  ],
  "cooldown": 40,
  "condition": {"type": "mxt:has_realm", "aura": "example:qi"}
}
```

其余字段原样不动：换个字段名、少写一项都不影响数组本身的语义，`costs` 在哪个字段上就由哪个字段付。这里是用技能当例子，因为它最容易在游戏里试——但被换掉的只有 `costs`。

`costs` 出现的字段一共十二个：`ability.costs`（**所有技能类型共用**，所以 `mxt:mount` 的每 tick 燃料与 `mxt:upkeep` 的每周期费用也写在这里）、`mxt:channelled` 的 `upkeep_costs`、`realm_stage.costs`、`cultivation.costs` 与 `cultivation.aura_costs`、`formation.activation_costs` 与 `formation.maintenance_costs`、`forging_method.costs`、`contract_type.costs`、`talisman.costs`、`quality.upgrade_costs`，以及灵气合成配方的 `aura`。它们共用的就是这一套形状。

## 第 4 步 —— 全有或全无

**一份数组是一笔账。** 任何一项付不出，整份数组就什么都不扣——连本来付得出的那几项也不动：

```text
costs = [qi ×10, aura example:qi ×2, emerald ×2]
身上有 20 qi、没有绿宝石  →  qi 一点也不少
```

一笔之内也有合并规则。**同一数组里两项指向同一个存储是加载错误**：同一个数值写两次、或同一门灵气写两次，直接报 `Duplicate resource cost` / `Duplicate aura cost` 并带上那个 id。而两项只是**经由不同路径到达同一个值**不是错误——一个 `mxt:resource` 与一个用该数值度量的 `mxt:aura` 会把金额**相加**，因为这是唯一不依赖书写顺序的答案。所以上面的数组一次扣：资源账户里 10 + 2 = 12 点 `example:qi`。

上面说的是「一份数组」。**一次动作里的好几份数组是另一回事**：符箓一次发动好几条技能、复合技能带好几个子技能、修炼一拍既付环境灵气又付身体费用，都是「好几笔付款 + 一次边界」。边界的规则是：

- 后面的哪一笔被拒，前面已经写下的**按倒序回退**（后写的先还），整个动作当作没发生、行为也不跑。
- **脚本那一笔不能回退**，所以它排在最后跑：其它通道全部付完之后才轮到 `mxt:js`。代价是脚本必须自己对这一笔保持**幂等**——它做出去的外部动作没有任何东西能收回来。

## 第 5 步 —— 付不出时玩家看到什么

付款发生在动作之前，所以一次拒付的表现是「什么都没发生，外加一句说明」：

| 玩家看到的 | 什么时候 |
| --- | --- |
| `资源不足`／`某某 不足` | 付款者自己的数值账户不够（`INSUFFICIENT_RESOURCE`）。 |
| `消耗付不出（物品或其它代价不足）` | 其余通道付不出：物品不够、没有玩家背包可扣、没有那条通道。 |
| `灵气不足` / `灵气不足，无法继续修炼` | 共享灵气池或方块存量不够。 |
| `该道法配置无效` / `这门技能的数值配置有误` | 某项 `amount` 算不出有限正数。 |

**拒绝发生在动作执行之前**，这一点比那句文案重要：技能不会先进冷却再扣钱、符箓不会先烧掉再报错、阵法不会先激活再欠费。`CostFailure` 是个枚举值，不是异常——同一份定义永远加载得进来，只是付不出时干干净净地停在该停下的一步。

缺通道**只会被报成「付不出」**，永远不会被报成「定义坏了」：`mxt:item` 需要玩家背包，付款者不是玩家（或阵法没有阵主）就是付不出；`mxt:js` 需要玩家。付款者本身是**活着的实体**——玩家、生物、召唤物都算，不一定非是玩家。

反过来说，**解不出来的条目会让整份定义加载失败**（未知 `type`、缺必填字段都会）：`costs` 数组**不套用**容错列表的口径，不存在「打一条警告然后把这一项丢掉」。

## 第 6 步 —— 脚本消耗

`mxt:js` 类型是给脚本自己实现一种代价的口子，注册点在服务端脚本里：

```js
// kubejs/server_scripts/mxt_costs.js
MxtCosts.register('example:quest_token',
  (player, params, context) => {
    const needed = params.count || 1
    return player.persistentData.getInt('tokens') >= needed
  },
  (player, params, context) => {
    const needed = params.count || 1
    player.persistentData.putInt('tokens', player.persistentData.getInt('tokens') - needed)
  }
)
```

回调签名是 `(player, params, context)`：第一个是 `(player, params, context) => boolean` 的检查，第二个是 `(player, params, context) => void` 的支付。`player` 是付款者，`params` 就是 JSON 里那个 `params` 对象（省略时是空对象 `{}`），`context` 由该付款者构建——`context.value('level')` 可用，`context.value('damage')` 不可用，理由与第 1 步一样：`Cost` 只用付款者求值。

然后数据包这一侧写：

```json
{"type": "mxt:js", "id": "example:quest_token", "params": {"count": 3}}
```

三条要记住的：**别用同一个 id 注册两次**（后注册的覆盖先注册的）；**回调没注册时这一笔永远付不出**，日志里会写 `Unknown KubeJS cost` 并带上那个 id、说明这笔消耗付不出——类型照样加载，只是没人替它答话；**这个类型不需要 KubeJS 也在**：`mxt:js` 无条件注册，用它的包永远加载得进来，只是在脚本缺席时付不出。

## 在游戏里验证

数据包注册表在世界加载时读取，所以 `/reload` 不够：退回标题界面重新打开世界（或重启服务器）。`kubejs/server_scripts/` 下的脚本不一样——`/reload` 会清空全部回调并重新执行它们，所以改一个 `MxtCosts.register` 用 `/reload` 就能生效（注册物品、方块那类**启动脚本**才必须重启游戏）。

```text
（重新打开世界）
/mxt registries validate           → 没有错误
/mxt resource example:qi set 500   → 给足数值，方便逐项试
```

1. 学会 `example:qi_bolt`（或直接把它授予自己），在轮盘上按下它：`example:qi` 一次少 12 点，背包里的绿宝石少 2 个。
2. `/mxt resource example:qi set 11` 之后再按一次：技能不发动，聊天栏报资源不足，**背包里的绿宝石一点也不少**——整份数组是全有或全无。
3. `/mxt resource example:qi set 12` 再按一次：一样成功，账户正好见底。10 + 2 = 12 就是那份数组里资源项与灵气项相加的结果。
4. 把物品项的 `amount` 改成 `1.5`，重开世界再按一次：取走 2 个，向上取整。
5. 把某项 `amount` 改成 `0`，重开世界再按一次：那一项算不出可用金额，整份数组付不出，报的是配置无效一类的说明，不是「扣 0 点」。
6. 把 `{"id": "example:qi", "amount": 10}` 复制成两项，重开世界：世界加载不了，日志报 `Duplicate resource cost`——同一个数值在同一个数组里只能写一次。
7. 给技能加上 `{"type": "mxt:js", "id": "example:quest_token", "params": {"count": 3}}`，把 `mxt_costs.js` 里的 `register` 整段注释掉再 `/reload`：日志里报这个脚本消耗没人注册（`Unknown KubeJS cost`），技能付不出；把注册加回来再 `/reload`，`tokens` 够 3 时就能发动。

## 常见错误

| 现象 | 原因 |
| --- | --- |
| 报 `Duplicate resource cost` | 同一个数组里同一个数值写了两项。两项只是经过不同路径到达同一个值是合法的（会相加），同名才是错误。 |
| 报 `Duplicate aura cost` | 同一个数组里同一门灵气写了两项。 |
| 报 `Every entry of an aura cost list must be an mxt:aura cost` | `cultivation.aura_costs` 或灵气合成配方的 `aura` 里写了别的类型。这两个字段只收 `mxt:aura`。 |
| 报 `Unknown KubeJS cost`（带那个 id，并说明这笔消耗付不出） | 脚本消耗的回调没有注册（脚本没加载、id 写错、或注册在客户端脚本里）。类型本身照常加载。 |
| 整份定义加载失败 | `costs` 数组里有一项解不出来（未知 `type`、缺必填字段）。这个数组不套容错列表的口径，不会只丢那一项。 |
| 消耗从头到尾收不到 | 付款者不提供这条通道：`mxt:item` / `mxt:js` 需要玩家。这报成「付不出」，不报成定义坏了。 |
| 消耗被扣了两次 | 把多次 `MxtCosts.consume` 当成了一笔原子支付；要整份数组一次付清请用 `MxtResources`。 |
| 脚本已经改过世界，最后却没付成 | 脚本这一笔排在最后、且不能回退。回调必须自己幂等，别把不可撤销的动作写在前半段。 |
| 改了数据包文件却什么也没变 | 数据包注册表在世界加载时读，`/reload` 不重读。服务端脚本相反：`/reload` 会重新执行它们。 |

## 接下来

- [cost_type（消耗）](../datapack/types/other/cost-type.md) —— 四种类型的字段表、默认值与判定规则。
- [共享数据类型 · `Cost`](../datapack/types/shared_data_types.md#cost) —— 通道规则、加载期校验，以及哪些字段故意不是 `Cost`。
- [`MxtCosts`：单个消耗](../kubejs/api/costs.md) —— 脚本侧的 `register` / `check` / `consume`，以及多条目一次付清的 [`MxtResources`](../kubejs/api/resources.md)。
- [定义技能](./add-an-ability.md) —— `costs` 在一个模块里什么时候付、和冷却与条件谁先谁后。
