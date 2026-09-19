---
title: 人物信息面板
description: 模组如何通过 InformationManager 在人物信息面板里注册自己的一行行内容。
---

# 人物信息面板

人物信息面板（默认用 `Z` 打开）是模组自己的客户端界面。这个界面是内部的，但 `InformationManager` 是一个开放的注册点：任何模组都可以往面板里贡献自己的行。

## 注册行

```java
InformationManager.register(
        Identifier.fromNamespaceAndPath("example", "realm"),
        InformationManager.Side.CULTIVATION,
        collector -> collector.add("info.example.realm", "Azure Realm"));
```

| 方法 | 说明 |
| --- | --- |
| `register(String id, Side side, Consumer<InformationCollector> collector)` | 在模组自己的命名空间里注册一个收集器；id 会变成 `mxt:<id>` |
| `register(Identifier id, Side side, Consumer<InformationCollector> collector)` | 在你自己的命名空间下注册一个收集器 |
| `collectEntries(Player player, Side side)` | 收集某一侧的行；面板调用的就是这个 |

| `Side` 取值 | 分区 |
| --- | --- |
| `BASIC` | 基本信息 |
| `CULTIVATION` | 修炼信息 |

- 同一侧已注册的收集器按注册顺序运行，每一侧都作为自己的分区显示。
- 重复注册同一个 id 会替换先前的收集器。
- 抛异常的收集器会被记录并跳过；其余的行仍会被收集，所以一个出问题的模组不会拖垮整个面板。
- 收集器在面板每次打开时运行，所以它应当读取状态、保持轻量，而不是修改任何东西。

## 写入行

收集器会收到一个 `InformationCollector`：

| 成员 | 说明 |
| --- | --- |
| `Player getPlayer()` | 正在构建面板的那个玩家 |
| `<T> T getData(Supplier<AttachmentType<T>> type)` | 读取玩家的某个附件，例如 `MxtAttachments.CULTIVATION` |
| `add(String key, String value)` | 添加一行，行名就是翻译键 |
| `add(String key, Component value)` | 同上，但值是一个组件 |
| `add(@Nullable Component name, Component value)` | 添加一行并显式指定行名；`name` 为 `null` 时它是续行 |
| `add(@Nullable Component name, Component value, int color, @Nullable Component tooltip)` | 同上，并带文本颜色和可选的 Tooltip |
| `add(Component value)` | 添加一行没有行名的续行 |
| `add(InformationEntry entry)` / `addAll(List<InformationEntry>)` | 添加预构建的条目 |
| `List<InformationEntry> getEntries()` | 目前已收集到的行 |

`InformationEntry` 持有 `name`（可为空）、`value`、`color`（默认 `0xFFE0E4EC`）和一个可选的 `tooltip`。行名和值都为空的条目会被丢弃，这让收集器可以按条件构建一行，只在它有意义时才添加。

## 列出定义

`InformationHelper` 把一个注册表分类下的 Holder 列表渲染成它们的定义名称：

| 成员 | 说明 |
| --- | --- |
| `lineWithDefinitions(InformationCollector collector, String key, Collection<? extends Holder<?>> values, String category)` | 添加一行，把每个值连接起来，并在前面加上翻译后的键 |
| `joinDefinitions(Collection<? extends Holder<?>> values, String category)` | 只返回连接后的文本，供更大的行内部使用 |

`category` 是这些 Holder 所属的注册表，例如 `"spirit_root"`、`"physique"` 或 `"technique"`。
