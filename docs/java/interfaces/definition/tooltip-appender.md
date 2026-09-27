---
title: TooltipAppender
---

# TooltipAppender

物品提示框的注册口子，NeoForge 的扩展点。每个模块注册自己的 appender，资源、货币、品质与灵气存储的显示互不耦合，所以加一条提示行不会碰到别人那几行。

两种注册形状，都挂在 `RegisterTooltipAppendersEvent` 上：

| 形状 | 用在哪 |
| --- | --- |
| `event.registerAppender(TooltipLocation.HEAD / POST_CUSTOM, ...)` | 按位置插一段：品质在 `HEAD`，灵气存储、法器绑定、货币价值、符箓提示跟在自定义内容之后。 |
| `event.registerComponentAppenderBeforeAll(组件, TooltipAppender.createComponentAppender(组件))` | 由**物品组件**驱动的一整段：契约铃、灵兽袋、符箓、储物容器这类"东西自己带着说明"的组件各注册一条。 |

规矩是"一个模块一个 appender"：提示行拼什么、按什么顺序，写在那个模块自己的类里。数值的拼法（两位小数、带符号、一行之间用翻译键连接而不是硬编码标点）统一走 `TooltipText`，见[公开 API](../../api.md)。
