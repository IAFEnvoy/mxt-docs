---
title: secret_realm_generation_type（秘境生成方式）
description: mxt:secret_realm_generation_type 的五个内置条目、字段、默认值与解析时机。
---

# secret_realm_generation_type（秘境生成方式）

## `secret_realm_generation_type`

[秘境](../../json/secret_realm.md) 的 `generation` 用这一族决定实例维度怎么造出来。数据包只能选用已注册的类型，不能新增。

`generation` 里引用的注册表项（`stem`、`dimension_type`、`biome`）都在**实例创建时**解析：数据包注册表是并行加载的，解码那一刻读到的未必已经绑定。解析失败即创建失败（`GENERATION_FAILED`）并记一条日志，不会留下半个实例。

```json
"generation": { "type": "mxt:void", "biome": "minecraft:the_void", "dimension_type": "minecraft:the_end" }
```

### `mxt:stem`

拿一个已注册的维度生成器当模板，开一份新维度键的实例。

| 字段 | 类型 | 默认 | 说明 |
| --- | --- | --- | --- |
| `stem` | 维度生成器 id | **必填** | 例如 `minecraft:overworld`、`minecraft:the_end`。 |

```json
{ "type": "mxt:stem", "stem": "minecraft:the_end" }
```

### `mxt:flat`

超平坦世界。

| 字段 | 类型 | 默认 | 说明 |
| --- | --- | --- | --- |
| `preset` | String | **必填** | 原版超平坦层串，例如 `"1*minecraft:bedrock,2*minecraft:dirt,minecraft:grass_block;minecraft:plains"`。 |
| `dimension_type` | 维度类型 id | `minecraft:overworld` | 实例用哪种维度类型。 |
| `structures` | Boolean | `true` | 是否生成结构。 |

```json
{ "type": "mxt:flat", "preset": "1*minecraft:bedrock,2*minecraft:dirt,minecraft:grass_block;minecraft:plains" }
```

### `mxt:void`

空世界：没有地层、一个生物群系、默认不生成结构，适合全靠 `structures` 造景的秘境。

| 字段 | 类型 | 默认 | 说明 |
| --- | --- | --- | --- |
| `biome` | 生物群系 id | `minecraft:the_void` | 整份实例用的生物群系。 |
| `dimension_type` | 维度类型 id | 无 | 实例用哪种维度类型。 |
| `structures` | Boolean | `false` | 是否生成结构。 |

```json
{ "type": "mxt:void", "biome": "minecraft:the_void", "dimension_type": "minecraft:the_end" }
```

### `mxt:template`

从存档目录 `<服务器目录>/mxt_secret_realm/<template>/` 复制 `region`、`entities`、`poi` 后再加载；手工搭好的地图走这条。

| 字段 | 类型 | 默认 | 说明 |
| --- | --- | --- | --- |
| `template` | String | **必填** | 模板目录名，只认 `[A-Za-z0-9_-]+`；不匹配就是创建失败。 |
| `stem` | 维度生成器 id | **必填** | 加载这份模板用的维度生成器。 |

```json
{ "type": "mxt:template", "template": "trial_arena", "stem": "minecraft:overworld" }
```

### `mxt:existing`

不创建任何维度，直接用一个已存在的维度（含数据包 `dimension/` 条目）。`max_instances` 对它没有意义，实例结束时也不会卸载或删除那个维度。

| 字段 | 类型 | 默认 | 说明 |
| --- | --- | --- | --- |
| `dimension` | 维度 id | **必填** | 直接拿这个已有维度当实例。 |

```json
{ "type": "mxt:existing", "dimension": "minecraft:the_end" }
```

边界也归它：只有这一档会在写了 [`border`](../../json/secret_realm.md) 时去动那个真实维度的边框，别的档新造出来的维度一律显式设成原版默认边界。
