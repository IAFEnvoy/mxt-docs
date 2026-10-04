---
title: 定义灵根与体质
description: "用 JSON 定义灵根与体质：元素与占比、修炼与亲和倍率、授予的技能、持有条件、互斥标签与两个伤害倍率，以及持有与生效的区别。"
---

# 定义灵根与体质

**灵根**（`spirit_root`）与**体质**（`physique`）是两套东西。灵根把身体绑到一个或多个元素上，给出修炼倍率、元素亲和倍率、技能与互斥元素；体质给的是与元素无关的那一份：原版属性、技能、互斥标签与两个伤害倍率。两张表各自注册（`mxt:spirit_root` 与 `mxt:physique`），文件放在 `data/<命名空间>/mxt/spirit_root/<路径>.json` 与 `data/<命名空间>/mxt/physique/<路径>.json`。

这篇教程各写一条，再把**持有**与**生效**讲清楚：身体上的状态分两份记录，所有效果都只读生效的那一份。

## 你要搭建什么

| 文件 | 注册表 | 用途 |
| --- | --- | --- |
| `data/example/mxt/spirit_root/fire_common_root.json` | `spirit_root` | 一条双元素灵根：火占七成、普通元素占三成，带修炼倍率、亲和倍率与一个授予的技能。 |
| `data/example/mxt/physique/sword_bone.json` | `physique` | 一条只在持有火灵根时才授予的体质：属性、技能、互斥标签与两个伤害倍率。 |

灵根还能被标签引用，标签文件放在 `data/<命名空间>/tags/mxt/spirit_root/<名字>.json`。体质没有标签路径：它的 `exclusive_tags` 只是写在体质上的自由标识符，不是注册表引用。

## 第 1 步 —— 灵根：绑定元素与占比

`data/example/mxt/spirit_root/fire_common_root.json`：

```json
{
  "elements": [
    {"element": "example:fire", "weight": 0.7},
    {"element": "example:common", "weight": 0.3}
  ],
  "cultivation_multiplier": 1.25,
  "element_ability_modifier": 1.1,
  "quality": "example:refined",
  "granted_abilities": ["example:spark"]
}
```

`elements` 是唯一必填的字段，而且必须是**非空数组**。每一项可以只是一个元素 id（等于占满这条灵根的全部占比），也可以是 `{"element": <元素 id>, "weight": <占比>}`。元素指向 `mxt:element` 注册表，也可以写 `#标签`。`weight` 默认 `1`，必须是有限正数。

占比不是倍率，它只在一处起作用。**生效**灵根持有哪些元素取并集，**与权重无关**：`example:fire_common_root` 同时持有火与普通两种元素，写 `0.7` 与 `0.3`、还是都写 `1`，结果一样。权重只在修炼亲和与对立惩罚那一侧按归一化占比加权平均；能力加成一条灵根只算一次，同样与权重无关。

其余字段都可选：

| 字段 | 默认 | 效果 |
| --- | --- | --- |
| `cultivation_multiplier` | `1` | 修炼倍率，数字或公式串，有限非负。 |
| `element_ability_modifier` | `1` | 缩放「元素与这条灵根相符」的技能，数字或公式串，有限非负。 |
| `quality` | 无 | 一档品质的条目 id，可选。写了它，这条灵根的档就是它。 |
| `granted_abilities` | `[]` | 技能 id 或 `#技能标签` 的数组。 |
| `conflicting_elements` | `[]` | 元素 id 或 `#元素标签` 的数组；与**生效中**的其他灵根逐元素双向判定，冲突就拒绝授予。 |

`conflicting_elements` 判定的是**身体上生效的那一份**，已经关掉的灵根不参与——这一点在第 3 步会变得很重要。

## 第 2 步 —— 体质：条件、属性与互斥

`data/example/mxt/physique/sword_bone.json`：

```json
{
  "holder_condition": {"type": "mxt:has_spirit_root", "spirit_root": "example:fire_root"},
  "attribute_modifiers": [
    {"attribute": "minecraft:max_health", "id": "example:physique/sword_bone", "amount": 2, "operation": "add_value"}
  ],
  "granted_abilities": ["example:qi_recovery"],
  "exclusive_tags": ["example:body"],
  "allow_stacking": false,
  "quality": "example:refined",
  "damage_dealt_multiplier": 1.2,
  "damage_taken_multiplier": 1.0
}
```

| 字段 | 默认 | 效果 |
| --- | --- | --- |
| `attribute_modifiers` | `[]` | 原版属性修饰符形状的数组：每项 `attribute` 必填，另加 `id` / `amount` / `operation`，以及可选的 `value` 公式。 |
| `granted_abilities` | `[]` | 技能 id 或 `#技能标签` 的数组。 |
| `holder_condition` | `mxt:always` | 实体条件。**授予前判一次，之后不再复查**：条件后来不成立，已经拿到的体质照样留着。 |
| `exclusive_tags` | `[]` | 自由标识符数组，不是注册表引用。授予时与**已经持有的体质（包括被关闭的）**的同类标签求交集，非空就拒绝。 |
| `allow_stacking` | `false` | 为假时同一个体质不能重复授予。 |
| `quality` | 无 | 一档品质的条目 id，可选，同灵根。 |
| `damage_dealt_multiplier` | `1` | **攻击方**一侧的伤害倍率，数字或公式串。 |
| `damage_taken_multiplier` | `1` | **受击方**一侧的伤害倍率，数字或公式串。 |

示例包里已经有 `example:fire_root` 这条火灵根，所以 `sword_bone` 只在持有它的身体上授予得了；`holder_condition` 里也可以写 `mxt:has_physique`，串出先决体质。

两个伤害倍率的读法：多条**生效**体质**相乘**；某一条求值抛异常、结果非有限或为负时跳过它，其余照常；`0` 是合法值（免疫，或者打不出伤害）。

## 第 3 步 —— 持有与生效

身体上分两份记录：一份是**持有**（已经拿到的），一份是**被关闭**（临时停用的）。这两份被读的地方不一样。

- **所有效果只读「生效」的那一份**：元素、修炼亲和、被动属性、伤害倍率，全部只看生效。
- **只读「持有」的有**：实体条件 `mxt:has_spirit_root` / `mxt:has_physique`、对应的战利品条件、列表命令，以及脚本里的「有没有 / 列出」。

所以关掉一条灵根只是停用：它还在身上，仍然能被移除，也仍然会被那些只读持有的地方看到。

::: warning 灵根与体质的判定口径不一致

灵根的冲突判定只看**生效中**的灵根，体质的互斥判定看**全部持有**（含被关闭的），而启停那个入口**不复查**互斥。按「关掉 A → 授予 B → 再打开 A」的顺序操作，两条本该因 `conflicting_elements` 互斥的灵根会同时生效：关掉 A 时判定看不到它，B 顺利通过；再打开 A 时没有任何地方再检查一遍。

体质那一侧不吃这套：它连被关闭的体质也一起参与互斥判定。

:::

## 第 4 步 —— 四个入口

能授予、移除、启停的有四条路，这个模块**没有玩家按键与界面**（物品的"右键用掉一个"不算界面）。

命令都需要管理员权限：

| 命令 | 作用 |
| --- | --- |
| `/mxt spirit_root grant` / `remove` / `enable` / `disable` `<目标>` `<灵根>` | 授予 / 移除 / 启用 / 关闭一条灵根。 |
| `/mxt physique grant` / `remove` / `enable` / `disable` `<目标>` `<体质>` | 同上，体质那一侧。 |

顶层别名 `/spirit_root` 与 `/physique` 可以在服务端配置里关掉，关掉之后 `/mxt` 下那两条照旧可用。

数据包行为：`mxt:grant_spirit_root` / `mxt:remove_spirit_root` 读字段 `spirit_root`，`mxt:grant_physique` / `mxt:remove_physique` 读字段 `physique`。**这几个字段只收具体 id，不收 `#标签`**。授予体质时 `holder_condition` 当场判一次，不满足就拒绝。

脚本侧是 `MxtSpiritRoots` 与 `MxtPhysiques` 两个全局对象，各带 `grant` / `remove` / `setEnabled`；授予与开关会带回 `changed` 与 `failure`，被拒时原因写在 `failure` 里。

物品侧是两件**右键即授予**的物品：`mxt:spirit_root` 与 `mxt:physique` 的堆上各带组件 `mxt:spirit_root` / `mxt:physique` 指名要授予的定义，右键走的是与命令、行为、脚本同一道判定，成功消耗 1 个（**创造模式不消耗**），被拒时物品留在手上并说明原因。取用见 `/picker mxt:spirit_root` 与 `/picker mxt:physique`（每个定义一行，已经带好组件），或 `/give @s mxt:physique[mxt:physique="example:sword_bone"]`。

## 第 5 步 —— 命名与加载

`name` 与 `description` 都可以省略。省略时自动用 `spirit_root.mxt.<命名空间>.<路径>` 与 `physique.mxt.<命名空间>.<路径>`，描述再加 `.description`，路径里的 `/` 原样保留。

这两张表和别的数据包注册表一样在**世界加载时**读取并校验，`/reload` 不会重读：改完文件要重新进世界，或者重启服务器。解码失败的定义会让世界进不去——不是「少一条就算了」。

## 在游戏里验证

```text
(重新加载世界)
/mxt registries list          → 这两张表各自的条目数
/mxt spirit_root list         → 名字、品质、元素与是否生效
/mxt physique list            → 名字、品质与是否生效
/mxt attachment status        → 持有条数
```

- `/mxt registries validate` **不校验**这两张表。它管的是境界链、触发器规则、进度链、品质阶梯与法器归属，别拿它当灵根体质的校验器；条目数看 `/mxt registries list`。
- `/mxt spirit_root list` 与 `/mxt physique list` 读的是身体上的记录，所以关掉的条目照样列出，只是在「是否生效」那一栏上看得出来。列表里的「品质」读定义声明的 `quality`，没声明时那一栏写 `-`；信息面板里那一行画的是「定义名 · 品质名」，没声明品质时后半段整个不画。

在游戏里逐条试一遍：

1. 用 `/mxt spirit_root grant @s example:fire_common_root` 授予自己。`list` 会列出它绑定的两种元素。
2. 用 `/mxt physique grant @s example:sword_bone` 授予体质。身上没有 `example:fire_root` 时会被 `holder_condition` 挡下，理由会报出来。
3. 关掉刚拿到的灵根，`list` 仍然列出它，但标记为不生效；它的元素、修炼倍率与技能一并停下。
4. 移除它，`list` 里就没有了。
5. `/picker mxt:physique` 拿一件**已经带好组件**的体质物品，右键服下：身上没有 `example:fire_root` 时同样被 `holder_condition` 挡下，物品留在手上并给出理由；满足条件时物品少 1 个、`/mxt physique list` 里多出它。

测试包里备了探针 `/mxt_test identity`，会断言持有 / 生效 / 关闭 / 移除、`quality` 读回它引用的那一档、未知字段被忽略、负倍率被拒。

## 常见错误

| 现象 | 原因 |
| --- | --- |
| 世界进不去，注册表少一条 | `elements` 不是数组、漏写、空数组、写了不存在的元素 id、权重小于等于 `0`、同一个元素写两次——**整份定义解码失败**，而定义坏掉会挡住世界加载。 |
| 加载期报「必须是有限非负数」 | `name` / `description` / 数值倍率这类字段的值非法，例如倍率写成负数。 |
| 体质里的元素字段毫无动静 | 体质只有字段表里那几个键。`element`、`cultivation_multiplier`、`damage_types` 之类写进体质**静默忽略，不报错也几乎不留日志**。字段名写错不会被发现，只会「那一项不生效」。 |
| 数组里的一条技能或元素莫名其妙不见了 | `granted_abilities` / `conflicting_elements` 这类数组里的坏条目会被丢掉，并记一行 `Ignoring invalid list element`，文件其余部分照常加载；但**写成单个坏 id**（不是数组）会让整份定义失败。 |
| 某条行为解析失败 | 行为里的 `spirit_root` / `physique` 写成了当前包里不存在的 id。定义被删掉之后，命令与脚本**仍然能按身体里记着的引用移除它**，因为身体存的是引用本身。 |
| `/mxt registries validate` 什么都没报 | 它不校验这两张表（只管境界链、触发器规则、进度链、品质阶梯、法器归属）。 |
| 文件明明在，游戏里却没有这条定义 | 被 `neoforge:conditions` 挡掉的定义根本不进表，日志里只有一行 DEBUG。 |
| 关掉的灵根「拿不回来」 | 关闭只是停用，它还在身上、还能被移除，也仍然会被只读持有的条件与命令列出。 |

## 接下来

- [定义灵气与境界](./define-aura-and-realms.md) —— 先有灵气与境界链，灵根改的修炼速度才有东西可加速。
- [KubeJS 创建物品并绑定行为](./create-items-with-kubejs.md) —— 把灵根与体质挂到物品行为上，做成丹药。
- [spirit_root（灵根）](../datapack/json/spirit_root.md)与 [physique（体质）](../datapack/json/physique.md) —— 完整字段表与边界。
