---
title: 命令
---

# 命令

所有命令都挂在 `/mxt` 根节点下，需要管理员权限的命令会在命令树中校验 `gamemaster` 权限；纯查询的入口（例如 `/mxt curse list`、`/ability list`、`/mxt trigger list`）不需要权限，只是不填目标时要用到自己，因此仍需由玩家执行。

面向玩家的部分命令同时注册了顶层别名，所以 `/aura` 和 `/mxt aura` 是同一棵树。每个别名都在服务端配置的**「命令别名」标签页**里单独开关（条目名就是命令本身，默认全开），例如关闭 `aura` 只移除 `/aura` 这个顶层写法；`/mxt` 下的入口始终完整，不会出现配置误关导致命令完全不可用的情况。别名一共 18 个：`ability`、`aura`、`contract`、`curse`、`display`、`flight`、`formation`、`friend`、`lightning`、`physique`、`picker`、`quality`、`realm`、`spirit_root`、`talisman`、`technique`、`trade`、`tribulation`。

**有两条命令不走 `/mxt`：`/hud` 与 `/wheel`**。它们注册在客户端自己的命令表里，只在聊天栏里手打有效、不需要权限，也不发往服务端。

| 命令 | 作用 |
| --- | --- |
| `/hud` | 列出每个可拖动的 HUD 元素：布局键、位置、尺寸、当前有没有内容。HUD 布局编辑器里看不到东西时，用它区分"元素没登记"和"元素只是现在没内容"。 |
| `/hud open` | 打开 HUD 布局编辑器，等同于按键 `key.mxt.hud_layout`（默认右 Shift）。 |
| `/hud <布局键> reset` | 把某个元素放回默认位置，布局键见 `/hud` 的输出（如 `resource_bars.left`）。复位会**同时删掉 `config/mxt/mxt-hud.json` 里保存的那一项**，所以重启后它仍在默认位置（删除后这个元素重新跟着窗口走，直到你再次拖动它）。 |
| `/wheel`（= `/wheel configure`） | 打开**轮盘配置界面**，等同于按键 `key.mxt.wheel_configuration`（**默认未绑定**，可以在按键设置里自己设一个）。左边 6 列是能发射的灵气、右边 6 列是已学会的主动技能，下面一排 12 格是**主盘**的 12 格；`Esc` 保存并关闭。还没进世界时只会报一句"现在无法打开轮盘配置"，不会打开空界面。 |

## 子页面

- [/mxt（含子命令）](/player-guide/commands/mxt)
- [/ability](/player-guide/commands/ability)
- [/aura](/player-guide/commands/aura)
- [/contract](/player-guide/commands/contract)
- [/curse](/player-guide/commands/curse)
- [/display](/player-guide/commands/display)
- [/flight](/player-guide/commands/flight)
- [/formation](/player-guide/commands/formation)
- [/friend](/player-guide/commands/friend)
- [/hud](/player-guide/commands/hud)
- [/lightning](/player-guide/commands/lightning)
- [/physique](/player-guide/commands/physique)
- [/picker](/player-guide/commands/picker)
- [/quality](/player-guide/commands/quality)
- [/realm](/player-guide/commands/realm)
- [/spirit_root](/player-guide/commands/spirit_root)
- [/talisman](/player-guide/commands/talisman)
- [/technique](/player-guide/commands/technique)
- [/trade](/player-guide/commands/trade)
- [/tribulation](/player-guide/commands/tribulation)
- [/wheel](/player-guide/commands/wheel)

## 补全

命令里的注册表 ID 用原版 `ResourceArgument`：解析、Tab 补全与"没有这个条目"的报错都由它给出，补全建议来自服务端当前加载的注册表，所以补出来的总是数据包真正定义了的 ID。有一点要知道：**被停用的定义也会出现在补全里**（补全读的是原始注册表），真正执行时才会被拒绝。

少数参数**故意**不这样做，因为它们的用途就是点名一个**当前数据包已经不提供**的引用——`/technique drop`、`/spirit_root remove|enable|disable`、`/physique remove|enable|disable`、`/curse remove`、`/ability revoke`。这些参数的补全来自注册表里**还生效**的条目。要注意它们真正救的是哪一种：对灵根与体质来说，**已经删掉**的定义到不了这里（附件里存的是定义本身，解码时那条会被丢掉），所以这几条要救的是被 **`mxt:disabled` 停用**、但仍然被身体持有的条目——`remove`、`enable`、`disable` 都按身体持有的那条引用来找、不回查注册表，因此停用不会把它们挡住。

维度 ID（`/mxt secret_realm info|destroy`、`/mxt rift target|place|bind`）、触发器信号（`/mxt trigger rules|publish`）与 `/picker` 的注册表 ID（如 `mxt:aura`）同样不是注册表条目，它们的补全各自来自维度列表、信号表与选择器分类。
