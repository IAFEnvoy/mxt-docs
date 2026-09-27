---
title: NamedDefinition
---

# NamedDefinition

数据包定义自带的两个显示文本：`name()` 与 `description()`。两者在 JSON 里都是可选字段，省略的那个由 `ContextNameCodec` 在加载期填成**这条定义自己的翻译键**，所以包要么翻译这个生成的键，要么把文本直接写出来。

| 成员 | 说明 |
| --- | --- |
| `Component name()` | 定义自己的名字：包里写了就是它，没写就是生成的键。 |
| `Component description()` | 定义自己的描述；没写时按名字键加 `.description` 生成。 |

显示侧问的是定义本身，而不是自己去推键——这正是"写出来的名字能压过生成的名字"的原因。要显示名就调 `DefinitionText.name(holder, category)`（见[公开 API](../../api.md)），它认得这个接口就直接读字段，否则按 holder 的 key 推键。

**键只有一套拼法**：`<类别>.<注册表命名空间>.<定义命名空间>.<路径>`，类别就是注册表 id 的 path，注册表命名空间恒为 `mxt`——`mxt:aura` 里的 `mxt:fire` 是 `aura.mxt.mxt.fire`。别在别处再拼一套名字键，也别再造第二套键。
