---
title: 飞行法器
description: "把一件物品做成飞行法器：载具定义、御器之术、灵气燃料的两笔账，以及起剑、飞行与落剑的完整验证。"
---

# 飞行法器

这一篇也是[储物与灵器](./storage-and-spirit-vessels.md)的子教程，但它与储物、灵器都没有关系：**飞行是同一件物品的另一种声明**，三件事各归各的。

- **法器**（`artifact`）声明"我能飞"——它引用一条载具技能。
- **载具**（`mxt:mount`）说明飞起来是什么样、多快、坐几个人、烧什么。
- **术**（`mxt:flight_control`）是**你按的那一下**，由功法这类常驻来源授予，**不写法器上**（原因见第 3 步）。

## 你要搭建什么

| 文件 | 用途 |
| --- | --- |
| `data/example/mxt/ability/azure_sword_mount.json` | 载具：速度、座位、每 tick 燃料、外观。 |
| `data/example/mxt/ability/azure_sword_flight.json` | 御器之术：从哪只手取、速度倍率、起剑一次的代价。 |
| `data/example/mxt/artifact/azure_sword.json` | 法器定义：认领物品、挂上载具、声明能存多少灵气。 |

术的授予不用新文件：一条命令或一门功法就够（见第 4 步）。

## 第 1 步 —— 载具（`mxt:mount`）

```json
// data/example/mxt/ability/azure_sword_mount.json
{
  "type": "mxt:mount",
  "speed": 0.12,
  "seats": 2,
  "costs": [{ "id": "example:qi", "amount": 0.1 }],
  "mount_action": {
    "on_mount": { "type": "mxt:play_sound", "sound": "minecraft:item.trident.riptide_1" },
    "on_dismount": { "type": "mxt:play_sound", "sound": "minecraft:item.trident.riptide_3" }
  },
  "trail": {
    "particle": { "type": "minecraft:end_rod" },
    "count": 2,
    "moving_only": true
  }
}
```

| 字段 | 类型 | 默认 | 说明 |
| --- | --- | --- | --- |
| `speed` | 数字或公式串 | **必填** | 每 tick 飞多少格，求值后夹在 `0.01`–`1.0`。 |
| `seats` | 整数 | `1` | 总座位数，含驾驶者，取值 1–4。 |
| `sit` | bool | `false` | 全车一个姿势；`false` 是站着。 |
| `render` | 渲染器 | `mxt:item` | 用哪套渲染器画它。 |
| `entity_type` | 实体类型 id | `mxt:flying_sword` | 用哪个实体飞。 |
| `display` | `{translation, rotation, scale}` | 该渲染器自己的默认姿势 | 模型相对载具原点怎么摆。 |
| `width` / `height` | 数字 | `0.35` / `0.12` | 碰撞箱宽高。 |
| `step_height` | 数字 | `0` | 跨台阶高度。 |
| `seat_offsets` | 向量数组 | 沿后方每格 `0.8`，第 0 个在 `0.65` 高 | 每个座位的落点，单位格。 |
| `mount_action` | `{on_mount, on_dismount, tick}` | 三个都是 `mxt:no_op` | 三个行为，都跑在驾驶者身上。 |
| `trail` | 对象 | 不写＝没有尾迹 | 载具自己发的尾迹粒子。 |

四条口径值得先记住：

- **它从不被发动**，所以它不占轮盘格：真正按下去的是术（第 2 步）。
- 顶层 `costs` 是**每 tick 的燃料**：先从载具里那件法器自己存的灵气扣，扣不动的余额才由驾驶者付；两边都付不出就落剑。
- 顶层 `condition` **每 tick 复查**，不成立就落地。
- 撞到方块或地面就落剑：载具每 tick 真的移动，落剑的判据就是它留下的碰撞标志。

## 第 2 步 —— 御器之术（`mxt:flight_control`）

```json
// data/example/mxt/ability/azure_sword_flight.json
{
  "type": "mxt:flight_control",
  "name": "御器之术",
  "hand": "either",
  "speed_multiplier": 1.0,
  "costs": [{ "id": "example:qi", "amount": 5 }]
}
```

| 字段 | 类型 | 默认 | 说明 |
| --- | --- | --- | --- |
| `hand` | `main` / `off` / `either` | `either` | 从哪只手找载具，主手优先。 |
| `speed_multiplier` | 数字或公式串 | `1` | 乘在载具的 `speed` 上。 |
| `costs` | `Cost` 数组 | `[]` | 起剑一次的代价，由发动者付。 |
| `cooldown` | 数字或公式串 | `0` | 起剑的冷却。 |
| `condition` | 条件 | 恒真 | 按下前的门槛。 |

它是**按键型**：按一下开、再按一下关。它**不需要承载物**——按的是你这个人，载具是从手上找来的。

## 第 3 步 —— 挂到法器上

```json
// data/example/mxt/artifact/azure_sword.json
{
  "items": "minecraft:diamond_sword",
  "abilities": ["example:azure_sword_mount"],
  "spirit_capacity": { "example:qi": 60 },
  "require_owner": false
}
```

| 字段 | 类型 | 默认 | 说明 |
| --- | --- | --- | --- |
| `items` | 物品 id、`#标签` 或数组 | **必填** | 这份定义认领哪些物品。 |
| `abilities` | 技能 id 或 `#技能标签` 的数组 | `[]` | 这里**只写载具**。 |
| `spirit_capacity` | 灵气 id 到上限的映射 | `{}` | 这件法器能存哪几门灵气、各存多少。 |
| `require_owner` | bool | `false` | 为真时未认主一律拒绝飞行与储物。 |

**为什么术不写在这里。** 起剑那一刻，法器会被收进载具、离开你的手，而它的授予是"拿着才生效"的——术写在这件法器的 `abilities` 里，起飞后那一格当场消失，你就再也按不到"落剑"了（只剩原版的潜行下坐骑）。所以**载具写法器，术交给常驻来源**。

`spirit_capacity` 决定这件法器**自己**能存多少灵气，也就是每 tick 燃料的第一口从哪来：长按右键（默认 20 刻）把灵气灌进去，上限就是这里写的数。温养加成由管线乘上，公式里不要自己再乘一遍。不写它也能飞：燃料会整笔落到驾驶者头上。

`require_owner` 决定要不要先认主：`false`（默认）时未认主的谁都能用，一旦认主就只认主人；`true` 时未认主一律拒绝。认主就是长按右键，代价写在 `claim_action` 里（默认扣 4 点生命，免费要显式写 `{"type": "mxt:no_op"}`）。

## 第 4 步 —— 把术授予出去

术必须有来源。正式做法是写进一门功法（或灵根、体质）的 `granted_abilities`（下面只列要加的那一段），见[定义功法与晋级](./define-a-technique.md)：

```json
// data/example/mxt/technique/azure_breath.json
{
  "granted_abilities": ["example:azure_sword_flight"]
}
```

测试时也可以直接用命令（需要 gamemaster 权限）：

```text
/mxt ability grant @s example:azure_sword_flight
/mxt ability list
```

`/mxt ability list` 会列出这条术与**还在维持它的来源**。授予之后，它出现在**轮盘配置界面右边的技能池**里——把它钉到主盘的一格上，那一格就是起剑 / 落剑的开关。

## 第 5 步 —— 起剑、飞行与落剑

**起剑**：把那件法器**拿在手上**（主手优先，其次副手；放进背包或 Curios 槽不算），按一下那一格。法器被收进载具、你骑上去。

`seats` 是**总人数、含驾驶者**，而且驾驶者必须是你（位移来自你的输入）；其余座位谁都能坐——对着载具按右键就上座，你落地时他们一起被放下。

飞行中的操作：

| 动作 | 键 |
| --- | --- |
| 上升 | `跳跃` |
| 下沉 | 下降键（默认 `X`，可改绑） |
| 加速 | `疾跑`（水平速度 ×1.5） |
| 前后左右 | 默认沿视线方向（服务端配置「飞行 → 朝视线方向飞行」） |
| 落剑 | 再按一下那一格，或原版的潜行（`Shift`） |

**两笔账各付各的**：起剑一次＝术的 `costs`，由发动者付，走共用闸门（授予 → 冷却 → 条件 → 代价）；每 tick＝载具的 `costs`，法器存量优先，余额才由驾驶者付。想让起剑免费就把术的 `costs` 留空，想让每 tick 免费就把载具的 `costs` 留空。

**这一趟怎么结束**：撞到方块或地面、`condition` 不成立、燃料两边都付不出，或者驾驶者本人下线 / 死亡 / 被挤出 0 号位。前三样是落剑，最后一样是载具当场消失——**那件法器都会原样还给你**（你不在线就落在载具消失的位置），同车乘客一起被放下，副驾驶不会接手。

座位落点靠眼睛调：`/mxt flight fill`（需要 gamemaster）把空座位全塞上无 AI 的僵尸当参照，它们随这一趟结束一起消失。

## 第 6 步 —— 外观与"飞的是什么"

`render` 有三档：

- `mxt:item`（默认）：画承载物品的物品模型，也就是展示框那套上下文。
- `mxt:geckolib`：用 GeckoLib 的模型与动画，客户端要装了它；没装就回落成物品模型并记一条警告。
- 内容模组注册的类型：见[载具渲染器](../java/interfaces/mount/renderer.md)。

`display` 可选，不写就用那一档自己的默认姿势。座位落点不属于它，那是 `seat_offsets`。

`entity_type` 决定**用哪个实体飞**：不写就是本体自带的 `mxt:flying_sword`。写别的实体类型时，那个类型必须实现[载具实体契约](../java/interfaces/mount/vehicle.md)——移动、座位、上座与渲染都归它自己，本体只把速度写给它、付燃料、判落剑。"船 / 轿 / 飞舟"这类新载具就是这么做的。

## 在游戏里验证

数据包定义在世界加载时读取，改完要退回标题界面重新进世界。

1. 发一件被认领的物品（`minecraft:diamond_sword`），拿在主手。
2. 用命令授予或学会那门功法，然后 `/mxt ability list`：这条术在名册上，来源是命令或那门功法。
3. 打开轮盘配置界面：它出现在右边的技能池里，钉到主盘一格。
4. 按一下那一格：法器从手上消失（它进了载具），你骑上去了，那一格底色变绿（开着）。
5. 空中试一遍：`跳跃`上升、下降键下沉、`疾跑`加速、抬头前进会爬升（关掉服务端配置「飞行 → 朝视线方向飞行」后四个方向都在水平面上）。
6. 按原版潜行落剑：载具消失，法器回到背包。
7. 燃料：先长按右键给法器灌一点灵气，再飞一次——每 tick 的消耗先从法器里扣；把 `spirit_capacity` 删掉、法器里也烧空了、身上同样没有那门灵气，飞到某一刻就会因为付不出燃料而落剑。
8. 撞墙：朝方块飞过去，落剑。
9. 座位：`seats` 写 `2`，用 `/mxt flight fill` 看两个座位的落点，再改 `seat_offsets` 对齐。
10. `/mxt registries validate` 复查注册表，或看日志里有没有定义被拒。

## 常见错误

| 现象 | 原因 |
| --- | --- |
| 轮盘池里根本没有这一格 | 术没有被授予。法器不授予它——术要给常驻来源（功法 / 灵根 / 体质 / 命令）。 |
| 按下去报「手上没有能飞的载具」 | 手上那件物品没有被任何法器定义认领，或者那条载具没写进这份定义的 `abilities`。 |
| 按下去报「这件法器不认你」 | 这份定义的 `require_owner` 为 `true`，而这件法器还没认主。 |
| 按下去就被拒，报「数值配置有误」 | `speed` 求值不是有限正数（算不出来、`≤ 0`，或者术的倍率把它乘没了）。 |
| 起飞后立刻落地 | `condition` 每 tick 复查不成立，或者燃料两边都付不出。 |
| 起剑之后那一格消失了，落不下来 | 你把术写进了法器自己的 `abilities`。法器被收进载具后它的授予就失效了（第 3 步）。 |
| 法器在 Curios 槽里，按下去找不到载具 | 起剑只看双手，主手优先、其次副手。 |
| 外观还是物品模型 | `render` 写了 `mxt:geckolib`，但这台客户端没装 GeckoLib：回落成物品模型并记一条警告，不是报错。 |
| 座位落点对不上 | `seat_offsets` 要靠眼睛调，用 `/mxt flight fill` 造参照；它最多 4 项。 |
| `entity_type` 写了一个不做载具的实体类型 | 那个类型没有实现载具实体契约：起剑被拒（动作栏报「现在骑不上去」），日志点名是哪个类型、每个类型只记一次。不写 `entity_type` 就是自带的 `mxt:flying_sword`。 |

## 接下来

- [储物与灵器](./storage-and-spirit-vessels.md) —— 回到父页：灵力容器那件东西。
- [储物](./storage.md) —— 另一篇子教程：给同一件物品挂一条储物技能。
- [技能类型](../datapack/types/other/ability.md) —— `mxt:mount` 与 `mxt:flight_control` 的完整字段表。
- [artifact（法器）](../datapack/json/artifact.md) —— `abilities` / `spirit_capacity` / `require_owner` 与长按认主。
- [定义功法与晋级](./define-a-technique.md) —— 把术写进 `granted_abilities`，让学会功法就能飞。
- [载具渲染器](../java/interfaces/mount/renderer.md) / [载具实体契约](../java/interfaces/mount/vehicle.md) —— 自己画一套外观，或自带一种载具本体。
- [轮盘、资源条与灵气 HUD](../player-guide/keys-and-hud.md) —— 起剑那一格怎么钉、开关怎么显示。
- [命令 · 飞行](../player-guide/commands/flight.md) —— `/flight fill` 的完整说明。
