---
title: 命令
---

# 命令

所有命令都挂在 `/mxt` 根节点下：本模组自己的注册表、资源、修炼、世界状态与管理员工具都在这里。命令是框架的诊断与管理工具，玩法本身由数据包驱动。

面向玩家的部分命令同时注册了顶层别名，所以 `/aura` 和 `/mxt aura` 是同一棵树。每个别名都在服务端配置的**「命令别名」标签页**里单独开关（条目名就是命令本身，默认全开），例如关闭 `aura` 只移除 `/aura` 这个顶层写法；`/mxt` 下的入口始终完整，不会出现配置误关导致命令完全不可用的情况。别名一共 19 个：`ability`、`aura`、`contract`、`curse`、`display`、`flight`、`formation`、`friend`、`lifespan`、`lightning`、`physique`、`picker`、`quality`、`realm`、`spirit_root`、`talisman`、`technique`、`trade`、`tribulation`。

**有两条命令不走 `/mxt`：`/hud` 与 `/wheel`**。它们注册在客户端自己的命令表里，只在聊天栏里手打有效、不需要权限，也不发往服务端。

| 命令 | 作用 |
| --- | --- |
| `/hud` | 列出每个可拖动的 HUD 元素：布局键、绑定的锚点、位置、尺寸、当前有没有内容。HUD 布局编辑器里看不到东西时，用它区分"元素没登记"和"元素只是现在没内容"。 |
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
- [/lifespan](/player-guide/commands/lifespan)
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

## 权限

需要管理员权限的命令在命令树中校验 `gamemaster` 权限：`/mxt resource <id> set`、`/mxt breakthrough`、`/mxt secret_realm`（整棵子树：`list` / `info` / `enter` / `exit` / `destroy`）、`/mxt rift`（整棵子树：`info` / `target` / `color` / `place` / `bind`）、`/mxt soul reclaim`、`/mxt trigger publish`、`/realm set`、`/lifespan get <targets>` / `set` / `add` / `reincarnate`、`/aura cache clear`、`/ability cast` / `grant` / `revoke`、`/contract bind` / `break` / `recall` / `behavior`、`/curse apply` / `remove` / `cleanse`、`/flight`（整棵子树，目前只有 `fill`）、`/formation bind` 与 `/formation owners add|remove`、`/spirit_root` 与 `/physique` 的 `grant` / `remove` / `enable` / `disable`、`/quality get <target>` / `set` / `clear` / `upgrade`、`/technique repair`（含 `dry-run`）/ `drop`，以及 `/lightning`、`/talisman`、`/tribulation` 的每一个节点。`/picker` 另外还要求 `gamemaster` 权限、由玩家执行且处于创造模式。

其余命令没有权限要求——纯查询的节点如 `/mxt curse list`、`/ability list`、`/mxt trigger list` 都在其中——但其中几条在命令树上就要求由玩家执行（`/friend` 整棵子树就是如此），不填目标时也要用到自己：从控制台跑它们会被拒，或者干脆没有结果。

## 补全

命令里的注册表 ID 用原版 `ResourceArgument`：解析、Tab 补全与"没有这个条目"的报错都由它给出，补全建议来自服务端当前加载的注册表，所以补出来的总是数据包真正定义了的 ID。**补全里的一条就是能用的**：被 `neoforge:conditions` 挡掉的条目根本不进注册表（见[停用一条定义](/datapack/overview#停用一条定义)），所以不存在"补全里有、执行时被拒"这种状态。

少数参数**故意**不这样做，因为它们的用途就是点名一个**当前数据包已经不提供**的引用——`/technique drop`、`/spirit_root remove|enable|disable`、`/physique remove|enable|disable`、`/curse remove`、`/ability revoke`。这些参数的补全来自注册表里当前存在的条目，而它们真正要救的是**身体里还存着、当前包却已经不提供**的那份引用：条目被 `neoforge:conditions` 挡掉、或者文件直接被删之后，**同一次会话里**附件里那份 `Holder` 还在（附件只在**世界加载**时解码，`/reload` 不重解；那一刻找不到定义的引用会被容错列表丢掉，所以重新进一次世界就干净了），所以 `remove`、`enable`、`disable` 都按身体持有的那条引用来找、不回查注册表。

维度 ID（`/mxt secret_realm info|destroy`、`/mxt rift target|place|bind`）、触发器信号（`/mxt trigger rules|publish`）与 `/picker` 的注册表 ID（如 `mxt:aura`）同样不是注册表条目，它们的补全各自来自维度列表、信号表与选择器分类。
