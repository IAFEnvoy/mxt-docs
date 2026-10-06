---
title: 定义品质链
description: "一条从低到高的物品品质阶梯：链名写在哪、入口档怎么认、升级那一步的代价与条件写在哪一档。"
---

# 定义品质链

一档品质是 `data/<命名空间>/mxt/quality/<路径>.json` 里的一个文件，注册表 id 是 `mxt:quality`。一档写四件事：这档叫什么、怎么显示；它上面那一档是谁（`next`）；升上去要付什么、要满足什么（`upgrade_costs` / `upgrade_condition`）；以及它属于哪条链（`quality`）。

档次的顺序不写在第二个地方：没有一张只装阶梯的表，运行期沿 `next` 走一遍，得到的是一条直线。

| 字段 | 默认 | 作用 |
| --- | --- | --- |
| `name` | `quality.mxt.<命名空间>.<路径>` | 品质显示名。 |
| `description` | 上面那个键再加 `.description` | 品质名下面那一行，非空才画。 |
| `color` | 无 | 给品质名上色，写 `#RRGGBB`（整数或 `[r,g,b]` 浮点数组也接受），一律按不透明处理。 |
| `value_multiplier` | `1` | 货币价值修正。 |
| `forging_modifier` | `1` | 锻造修正，用来除锻造读取的额外步数。 |
| `alchemy_modifier` | `1` | 炼丹修正，用来除酿造时长。 |
| `condition` | `mxt:always` | 用这一档品质的物品能不能用。 |
| `next` | 无 | 上面那一档的条目 id；最高档不写。 |
| `upgrade_costs` | `[]` | 升到上面那一档要付的消耗。 |
| `upgrade_condition` | `mxt:always` | 升到上面那一档要满足的条件。 |
| `quality` | 无 | 这条链的名字，写在入口档上。 |

字段全都可以省略。三个修正是三个同形的子对象 `{"description": …, "modifier": …}`：`modifier` 是数字或公式串，省略等于 `1`；`description` 写了才在物品提示框里画出那一行，不写不影响修正生效。修正值不是有限正数时一律按 `1` 处理。

`condition` 不满足时这件物品用不了，和绑定条件是同一道门。完整字段说明见 [quality（品质）](../datapack/json/quality.md)。

## 你要搭建什么

| 文件 | 用途 |
| --- | --- |
| `data/example/mxt/quality/common.json` | 最低一档，也就是这条链的入口档；链名写在这里。 |
| `data/example/mxt/quality/refined.json` | 中间一档；从 `common` 升上来的代价与修正写在这里。 |
| `data/example/mxt/quality/flawless.json` | 最高一档，不写 `next`。 |

代价花的是 `example:qi` 这个数值，[定义灵气与境界](./define-aura-and-realms.md) 里已经有 `resource/qi.json`；挂档位的物品是 KubeJS 注册的 `kubejs:qi_pill`，见 [KubeJS 创建物品并绑定行为](./create-items-with-kubejs.md)。

## 第 1 步 —— 三档品质

```json
// data/example/mxt/quality/common.json
{
  "quality": "example:pill",
  "next": "example:refined"
}
```

```json
// data/example/mxt/quality/refined.json
{
  "next": "example:flawless",
  "upgrade_costs": [{"id": "example:qi", "amount": 20}],
  "value_multiplier": {
    "description": "quality.mxt.example.refined.value",
    "modifier": 1.25
  }
}
```

```json
// data/example/mxt/quality/flawless.json
{}
```

- `next` 指向上面那一档，沿 `next` 走上去就是 `common` → `refined` → `flawless`。
- `flawless` 是空对象：最高档不写 `next`，也不给它名字和修正。
- `upgrade_costs` 里的 `{"id": …, "amount": …}` 是 `mxt:resource` 消耗的简写，也可以写成带 `type` 的完整消耗条目。
- 修正写在结算它的那一档上：`refined` 的 `value_multiplier` 让这档物品的货币价值乘 `1.25`，它自己的 `description` 决定提示框里要不要多画那一行。`common` 与 `flawless` 没写修正，都按 `1`。

## 第 2 步 —— 链名写在入口档

入口档是**没有任何一档把它写成 `next` 的那一档**。上面三档里 `common` 没有被谁指向，所以它是入口档。链名是字段 `quality`，写在入口档上，顺着 `next` 覆盖这条链的每一档：例子里三档都属于 `example:pill`。

链名只在入口档上读一次。把 `"quality": "example:pill"` 从 `common` 挪到 `refined`，入口档 `common` 就没有名字——于是**整条链都没有名字**，`/quality chain` 把链名显示成 `null`。写在中间档上的那份只会参与下面「一档收到两个不同链名」的检查。这**不报错**：没有哪条校验看得出你本来想给这条链起个名字。

链名只是一个 id，在一条链上写一次就够。链名本身只有两处会报出来：

- 一档自己写的链名和从上面继承来的不同，加载期报 `names quality <写的> inside <继承到的>`。
- 两个入口档抢同一个链名，报 `starts a second ladder named <名字>, which another tier already names`。

## 第 3 步 —— 代价写在升到的那一档

从 `common` 升到 `refined`，读的是 `refined` 的 `upgrade_costs` 与 `upgrade_condition`：那笔消耗代表「升进这一档」，所以 20 点 `example:qi` 写在 `refined` 上，不写在 `common` 上。

写在来源档上不会生效，也**不报错**：`common` 的 `upgrade_costs` 代表「升进 `common` 自己」，而入口档没有任何一档能升进去，那笔代价永远收不到，那一步实际是免费的。

- 某一档没写 `upgrade_costs` 时，升进它的那一步免费；空数组也是免费。
- 想让某一档当顶端，就不写它的 `next`。写了 `next` 却没写 `upgrade_costs`，那一步仍然存在，只是代价为空。
- 一档没有 `next` 却写了 `upgrade_costs` 或非 `mxt:always` 的 `upgrade_condition`，报 `declares upgrade_costs or upgrade_condition but no next tier`。
- 升级是原子的：条件不满足或代价付不出时，物品一点不动，也不写新档。

`upgrade_condition` 管这一步能不能走，在扣费之前判；`condition` 管用这档品质的物品能不能用。

## 第 4 步 —— 给物品定档

物品的档位按固定顺序取**第一个能拿到的**：

| 途径 | 怎么写 |
| --- | --- |
| 物品上的 `mxt:quality` 组件 | `/give @s kubejs:qi_pill[mxt:quality="example:common"]`；`/quality set`、一次成功的升级、锻造台结算与画符铭刻写的都是它。 |
| 这一堆携带的定义声明的 `quality` | 物品上装着定义身份的那份组件，读的是那份定义自己写的档。 |
| 注册表 [default_quality](../datapack/json/default_quality.md) | 有一条定义的 `items` 命中这件物品，就用它写的 `quality`；裸的创造 / `/give` 物品与按物品认领的 `artifact` / `spirit_herb` 走的就是这一条。 |

第 2 层答的是"一类定义共用一件内置物品、物品说不清是哪一档"的那批：功法书默认是 `mxt:cultivation_jade_slip`（`technique_binding` 的 `carrier_item` 可以换成别的）、所有丹药都是 `mxt:pill`、所有炉型规格都是方块物品 `mxt:alchemy_furnace`、灵根石是 `mxt:spirit_root`、体质石是 `mxt:physique`。声明 `quality` 的九个定义是 `technique`、`alchemy_furnace`、`alchemy_wall_material`、`spirit_root`、`physique`、`pill`、`formation`、`secret_realm`、`contract_type`。

组件装的是**整份品质对象**，所以它同时决定档位与所属的链：写 `example:common` 就把这枚丹药放进了 `example:pill` 这条链。绑定表不声明品质，别在绑定里写品质链。锻造记录 `mxt:forging_result` 只有蓝图 id 与步数、**不含档位**。这枚丹药是 KubeJS 注册的普通物品，堆上没有任何装定义身份的组件，所以它只有第 1 层与第 3 层能答。三层都没有答案时这枚丹药就是**没有品质**，不会去补链的入口档。

| 命令 | 作用 |
| --- | --- |
| `/quality get [玩家]` | 看主手物品的档；带玩家参数时需要 gamemaster 权限。 |
| `/quality set <目标> <品质>` | 把覆盖组件写到目标主手的物品上，需要 gamemaster 权限。 |
| `/quality clear <目标>` | 摘掉覆盖组件，需要 gamemaster 权限。 |
| `/quality upgrade <目标>` | 沿链往上走一步，需要 gamemaster 权限。 |
| `/quality chain <品质>` | 把整条链画出来，第一格是链名，不需要权限。 |

顶层别名 `/quality` 可以在服务端配置的「命令别名」标签页里关掉，关掉之后 `/mxt quality` 照旧可用。

## 第 5 步 —— 加载与校验

品质是数据包注册表，在世界加载时读一遍，`/reload` 不重读。改完文件要退回标题界面重新打开世界，或者重启服务器。

```text
(重新打开世界)
/mxt registries validate          → 一次报出全部问题
/mxt registries list              → mxt:quality=3
/quality chain example:common     → 整条链，链名是 example:pill
/quality get                      → 主手物品的那一档
```

`/mxt registries validate` 一次报出全部问题，问题太多时只串前 12 条。链本身的问题都在这里出现：成环、分叉、两个入口抢一个名字。`next` 指向一个当前包没有的档不在这里——那是整个数据包加载失败。

## 在游戏里验证

1. 重新打开世界，`/mxt registries validate` 不报错。
2. `/give @s kubejs:qi_pill[mxt:quality="example:common"]`，再 `/quality get`：显示 `common`。
3. `/quality chain example:common`：链名是 `example:pill`，三档按顺序排在同一行里。
4. 手上拿着这枚丹药执行 `/quality upgrade @s`：身上有 20 点 `example:qi` 时升到 `refined`，`/quality get` 跟着变，提示框里多出 `value_multiplier` 的那行描述；不够 20 点时报代价付不出，档位一点不动。
5. `/quality set @s example:flawless` 把档位覆盖成最高档，`/quality clear @s` 摘掉覆盖组件。这枚丹药没有在 `default_quality` 里写档，堆上也没有装定义身份的组件，所以摘掉之后 `/quality get` 报它当前没有品质。
6. 把 `refined` 的 `upgrade_costs` 删掉，重开世界再升一次：那一步不花任何东西。

## 常见错误

| 现象 | 原因 |
| --- | --- |
| 链名显示成 `null` | 链名写在了中间档上，入口档拿不到名字，整条链就没有名字。**不报错**。 |
| 升级从来收不到代价 | `upgrade_costs` 写在了来源档上，那笔代价代表「升进它自己」，而入口档没人能升进去。那一步实际免费。**不报错**。 |
| 报 `names quality <写的> inside <继承到的>` | 一档自己写的链名和从上面继承来的不同。 |
| 报 `starts a second ladder named <名字>, which another tier already names` | 两个入口档抢同一个链名。 |
| 报 `next <id> is not a quality` | 这个包加载不到这一步：`next` 指向不存在的档时世界直接拒绝加载，整次加载失败，而不是「那条链被丢掉」。 |
| 报 `follows both <A> and <B>` | 一档被两档写成 `next`（分叉），报在被指向的那一档；**走进这个分叉点的几条链整条不索引**（另一条入口那条线也在内），不会替你挑一个入口。 |
| 报 `the chain is cyclic at <id>` | 成环。纯环、且环上没人写链名时什么都不报，那几档就是不在任何链上。 |
| 报 `declares upgrade_costs or upgrade_condition but no next tier` | 某档没有 `next`，却写了 `upgrade_costs` 或非 `mxt:always` 的 `upgrade_condition`。 |
| 报 `cannot be reached from the start of its ladder: it is cyclic, points into another, or names a quality that is already taken` | 一档写了链名却接不到入口。 |
| 写了 `chain` 字段没有任何效果 | `chain` 不是字段，会被当未知键静默忽略；链名只有 `quality` 一个来源。 |
| 改了文件却什么也没变 | 数据包注册表在世界加载时读，`/reload` 不重读。 |

## 接下来

- [quality（品质）](../datapack/json/quality.md) —— 每个字段的完整说明，以及颜色、修正与品质解析顺序。
- [KubeJS 创建物品并绑定行为](./create-items-with-kubejs.md) —— 把自己的物品挂到这条链上。
- [定义灵气与境界](./define-aura-and-realms.md) —— 升级要花掉的那个数值从哪来。
