---
title: ability_target_selector_type（技能目标选择器）
---

# ability_target_selector_type（技能目标选择器）

`ability_target_selector_type` 决定技能的双实体行为作用于哪些实体，写在技能顶层的 `target_selector` 里，默认值是 `mxt:self`。

## `ability_target_selector_type`

`mxt:area` / `mxt:ray` / `mxt:cone` 三种选择器都支持 `include_actor`、`limit` 与 `order`；`mxt:self` 与 `mxt:js` 没有这三个字段——`mxt:self` 永远只选施法者，`mxt:js` 交出多少就是多少。

读它的时机由技能类型决定：

- `mxt:active`、`mxt:triggered`、`mxt:channelled`、`mxt:interval` 每次跑动作都走选择器。
- `mxt:aura` 只在被**一次性发动**（命令 / 脚本 / 符箓）那一次读它；它自己的重复脉冲不读选择器，只用 `radius` 选人。
- `mxt:targeted` 拿它问「这次施放够得着谁」：范围技能与射线技能的差别只在这个选择器上，一个写 `radius`、一个写 `length`，两者都必须给出距离。

### `mxt:self`

只选择技能施法者。

没有字段，整份选择器就是 `{"type": "mxt:self"}`。

```json
{"type": "mxt:self"}
```

### `mxt:area`

以施法者（或本次激发的原点）为中心的**方盒**。

| 字段 | 类型 | 默认 | 说明 |
| --- | --- | --- | --- |
| `radius` | `NumberProvider` | **必填** | 方盒的半径 |
| `include_actor` | Boolean | `false` | 是否把施法者包含在选择结果中 |
| `limit` | Integer | `0` | 最多留下几个目标 |
| `order` | `nearest` / `farthest` / `random` | `nearest` | 超出 `limit` 时按这个顺序留下目标 |

方盒的形状：没有原点时是行为者自己的碰撞箱按 `radius` 外扩，有原点时是边长 `2 × radius` 的立方体——**不是球**。

```json
{"type": "mxt:area", "radius": 6, "include_actor": true, "limit": 3, "order": "nearest"}
```

### `mxt:ray`

沿施法者视线的**圆柱**。

| 字段 | 类型 | 默认 | 说明 |
| --- | --- | --- | --- |
| `length` | `NumberProvider` | **必填** | 沿视线伸出的长度 |
| `radius` | `NumberProvider` | `0.5` | 圆柱的粗细 |
| `include_actor` | Boolean | `false` | 是否把施法者包含在选择结果中 |
| `limit` | Integer | `0` | 最多留下几个目标 |
| `order` | `nearest` / `farthest` / `random` | `nearest` | 超出 `limit` 时按这个顺序留下目标 |

圆柱从眼睛位置（或本次激发的原点）起，长 `length` 格、粗 `radius` 格。

```json
{"type": "mxt:ray", "length": 24, "radius": 0.5, "limit": 1}
```

### `mxt:cone`

沿施法者视线的**圆锥**，`angle` 是**半角**。

| 字段 | 类型 | 默认 | 说明 |
| --- | --- | --- | --- |
| `length` | `NumberProvider` | **必填** | 沿视线伸出的长度 |
| `angle` | `NumberProvider` | **必填** | 圆锥的半角，单位为度，取值 `0`..`180` |
| `include_actor` | Boolean | `false` | 是否把施法者包含在选择结果中 |
| `limit` | Integer | `0` | 最多留下几个目标 |
| `order` | `nearest` / `farthest` / `random` | `nearest` | 超出 `limit` 时按这个顺序留下目标 |

```json
{"type": "mxt:cone", "length": 8, "angle": 30}
```

::: info 圆柱与圆锥都被方块挡住

`mxt:ray` 的圆柱沿视线的**中心线**被方块裁断，因此它不会穿墙打到人；`mxt:cone` 的中心线同样被裁断——正前方一堵墙会让圆锥变短。但**圆锥侧面造成的遮挡不逐个目标判定**：目标落在圆锥里、中心线又没被挡住时就会入选，哪怕它与施法者之间隔着东西。

:::

### `mxt:js`

选择服务端脚本返回的实体，没有 `limit` 与 `order`。

| 字段 | 类型 | 默认 | 说明 |
| --- | --- | --- | --- |
| `id` | String | **必填** | 用 `MxtAbilities.selector(id, callback)` 注册的回调 id |
| `params` | Object | `{}` | 传给回调的任意 JSON |

```json
{"type": "mxt:js", "id": "example:nearest_three", "params": {"range": 12}}
```

回调在技能执行期间于服务端运行，并返回一个实体数组。技能的每一次执行都会进行一次选择，因此回调缺失时选不出任何实体，并记录一条警告。它拿不到本次激发的原点。

**这些上限是运行期夹住的，不是报错**：`mxt:area` 的 `radius` 夹在 `128`，`mxt:ray` 的 `radius` 夹在 `64`，`mxt:ray` / `mxt:cone` 的 `length` 夹在 `128`，`mxt:cone` 的 `angle` 求值超过 `180` 按 `180` 算。夹住是为了不让一次选择走遍整个关卡。

**加载期只校验写成常量的值**：`limit` 不能为负、`length` 必须有限且为正、`mxt:ray` 的 `radius` 必须有限且非负、`angle` 必须在 `0`..`180` 之间。**`mxt:area` 的 `radius` 加载期不查**：常量负数只是让这一次选择为空。写成公式的值都到运行时才定，求值不合法时这一次选择就是空的。

**选不出实体的情况**：`radius` 为负数或非有限值、`length` 非有限或非正数时，这一次选择为空。`limit` 为 `0` 或负数表示全都留下。

**`order` 只在真的限了量时才有意义**：三种区域型选择器都能用它写出「最近的三个」与「随机几个」，**平局按实体 id 打破**，因此同一瞬间永远选出同一批生物。

**两个「半径」不是同一种形状**：`mxt:area` 的选择器取的是**方盒**，而 `mxt:aura` 的脉冲是**球**（它以施法者为中心、对每个候选逐个比对直线距离）。两者都有 `radius`，但覆盖的实体集合不同。
