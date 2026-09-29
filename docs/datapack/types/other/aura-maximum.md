---
title: aura_maximum_type（环境上限）
description: 灵气上限 mxt:aura_maximum_type 的三种算法、字段、裸数字简写，以及省略 max 时的含义。
---

# aura_maximum_type（环境上限）

`mxt:aura_maximum_type` 解析一块灵气区块的**环境**储存上限。[aura_zone](../../json/aura_zone.md) 与 [block_aura](../../json/block_aura.md) 的 `aura` 里每一项都是同一个形状，上限写在那一项的 `max` 里。方块贡献和阵法加成在运行时另行应用，不占这个上限。

这些算法由模组注册，数据包只能选用，不能新增。

## `aura_maximum_type`

`max` 省略时按 `mxt:initial_multiplier`、倍率 `1` 算，也就是上限跟着初始库存走。裸的**非负**数字是 `mxt:fixed` 的简写：写 `100` 与写 `{"type": "mxt:fixed", "value": 100}` 等价；裸负数解不出来，加载失败。

### `mxt:fixed`

固定上限，与初始库存无关。

| 字段 | 类型 | 默认 | 说明 |
| --- | --- | --- | --- |
| `value` | Double | **必填** | 固定上限，`0` 或更大 |

```json
{"type": "mxt:fixed", "value": 100}
```

裸数字简写：

```json
100
```

### `mxt:initial_multiplier`

上限是初始库存的倍数。

| 字段 | 类型 | 默认 | 说明 |
| --- | --- | --- | --- |
| `multiplier` | Double | `1` | 作用于非负初始库存的系数，`0` 或更大 |

```json
{"type": "mxt:initial_multiplier", "multiplier": 2}
```

### `mxt:unlimited`

没有上限。

| 字段 | 类型 | 默认 | 说明 |
| --- | --- | --- | --- |
| — | — | — | 没有字段。 |

```json
{"type": "mxt:unlimited"}
```

---

`mxt:initial_multiplier` 乘的是**非负化之后**的初始库存：初始库存为负时按 `0` 算，倍率又限定在 `0` 或更大，所以结果不会为负。

`mxt:unlimited` 求值出的是正无穷。修炼速度那一侧对无穷上限改用 `concentration / (concentration + 1)` 换算，而不是 `concentration / maximum`；区块库存与方块、阵法的贡献再往上加时，上限仍是无穷。

`max` 只是**环境**上限：方块灵气会额外提高同一门灵气的有效容量，那部分不受 `mxt:fixed` 或 `mxt:initial_multiplier` 的限制。
