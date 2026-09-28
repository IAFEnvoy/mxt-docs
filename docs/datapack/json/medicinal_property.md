---
title: medicinal_property（药性）
description: 药性的身份定义：一种药用效果的名字与描述，不复用元素、灵气或资源的 ID。
aside: false
---

# medicinal_property（药性） {#medicinal_property}

一条 `medicinal_property` 是**一种药用效果的身份**：它回答「这是哪一种药性」，不回答「有多强」。定义里只有名字和描述，没有数值、不绑物品、也不指任何元素——药力写在使用它的地方。

药性 id 由内容包自己提供。不要复用[元素](./element.md)、灵气或 `resource` 的 id：它们是各自的身份，药性与元素之间没有任何自动换算。

## 文件位置

药性文件放在数据包的 `data/<namespace>/mxt/medicinal_property/`。

**用途**：药性身份。

文件名对应它的 ID。例如 `data/example/mxt/medicinal_property/blood_moving.json` 的 ID 是 `example:blood_moving`。

## 字段

| 字段 | 类型 | 默认 | 说明 |
| --- | --- | --- | --- |
| `name` | Text Component | `medicinal_property.mxt.<命名空间>.<路径>` | 药性显示名。 |
| `description` | Text Component | 同上加 `.description` | 药性描述。 |

两个字段都可以省略：省略时用表格里那个按条目 id 生成的键，写了就用你给的文本（字符串当翻译键、对象当完整组件）。所以 `data/example/mxt/medicinal_property/blood_moving.json` 里写一个空对象就够：

```json
{}
```

## 用在哪

| 用在哪 | 字段 | 含义 |
| --- | --- | --- |
| 丹方（配方类型 `mxt:alchemy`） | `main_requirements` / `auxiliary_requirements` | 药性到药力阈值的映射：这条丹方要哪些主药与辅药药性、各要多少。 |
| 灵植（`spirit_herb`） | `main_effects` / `auxiliary_effects` | 这件材料当主药或辅药时，每件提供多少该药性的药力。 |

同一份药性在不同丹方里可以有不同阈值，一株草也可以在主药与辅药里给出不同药力：药性只负责「是哪一种效果」，数值全在引用它的地方。丹方怎么比药力、灵植怎么声明药力，见 [alchemy_recipe](./alchemy_recipe.md) 与 [spirit_herb](./spirit_herb.md)。
