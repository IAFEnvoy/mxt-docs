---
title: 轮盘条目
---

# 轮盘条目

技能、灵气与法器技能共用 **12 扇轮盘**，它是三者**唯一的触发入口**；原来"技能栏 + 灵力栏"两条客户端 Hotbar 与它们各自的配置界面已经删除。框架在 `com.iafenvoy.mxt.screen.wheel`，内容在 `com.iafenvoy.mxt.screen.wheel.content`。轮盘由**主盘 + 从盘**组成，用**一套连续编号**串起来：主盘是玩家自己摆的 12 格（编号 `0..11`），从盘（主手物品 / 副手物品 / 法器）由随身装备**自动生成**、格子从 `12` 起接着排，用小键盘 `4` / `6` 翻页、`R` 打开永远回到主盘（见 [主盘、从盘与编号](#主盘与从盘的编号)）。

**框架不决定轮盘上有什么。** `WheelMenuProvider` 回答"这个来源现在贡献哪些条目"（`entries(player, source)`，`source` 是 `WheelSource`；返回值**可以比一页长**，分页由 `WheelMenuContent` 做），唯一实现是 `WheelContent`（在客户端初始化时 `WheelContent.register()`）。`WheelMenuEntry` 是条目契约：

| 成员 | 说明 |
|---|---|
| `WheelEntryKind kind()` | `ABILITY`、`AURA` 或 `ARTIFACT`，决定 tooltip 首行、配置界面里的池，以及触发时服务端往哪边分派。 |
| `Identifier id()` | 定义 id（`mxt:ability` / `mxt:aura` 的条目）；`ARTIFACT` 用的是**法器 id 加上能力 key**（`ns:path/key`），见 [法器技能](#法器技能)。 |
| `Component title()` | **画在轮盘正中间**的名字。 |
| `Optional<IconReference> icon()` | 扇区里画的图标，贴图或物品都行；可以不画（法器技能就不画，改画名字）。 |
| `int accentColor()` | 配置界面里这一格底边那条颜色（灵气蓝、技能金、法器技能按状态取绿 / 灰 / 紫）。 |
| `List<Component> tooltip(Player)` | 类型 + 名字 + 具体数值；按需重建，因为数值取决于玩家此刻的状态。 |
| `long cooldownTicks(Player)` / `boolean usable(Player)` | 还剩几 tick，`0` 表示就绪；不可用时扇区变暗、中间写「冷却中 4.3s」。**它不会阻止触发包发出**——能不能用由服务端判。 |
| `void onSelected(WheelSelection)` | 触发回调（按 `V` 或左键），调用时轮盘**不关**，所以实现里可以接着开自己的界面、也可以被连续调用；`WheelSelection` 带着这一格的编号与它读自哪个来源。 |

```java
public record AbilityWheelEntry(Identifier id, Ability definition) implements WheelMenuEntry {
    @Override public WheelEntryKind kind() { return WheelEntryKind.ABILITY; }
    @Override public Component title() { return DefinitionText.name(this.id, "ability"); }
    @Override public Optional<IconReference> icon() { return this.definition.icon(); }
    @Override public void onSelected(WheelSelection selection) { WheelTrigger.send(this, selection.source()); }
}
```

## 主盘与从盘的编号

轮盘由**主盘 + 从盘**组成，用**一套连续编号**串起来。来源是 `runtime/wheel/WheelSource`（枚举，枚举顺序即编号顺序）：

| `WheelSource` | 名字 | 内容从哪来 | 存不存 |
|---|---|---|---|
| `CONFIGURED` | 主盘 | 附件 `wheel_layout` 里玩家自己摆的 12 格 | 存 |
| `MAIN_HAND` | 主手物品 | 主手物品现在**授予**的主动技能，加上它这件法器声明的**技能** | 不存，现读 |
| `OFF_HAND` | 副手物品 | 副手物品现在授予的主动技能，加上它这件法器声明的技能 | 不存，现读 |
| `CURIOS` | 法器 | Curios 已装备物现在授予的主动技能，加上这些法器声明的技能 | 不存，现读 |

- **格子按整张轮盘连续编号**：主盘 12 格是 `0..11`，从盘的格子从 `12` 起接着排。
- **一页 12 格**：每个来源占 `ceil(条目数 / 12)` 页，**一条都没有就一页都不占**（主盘永远占一页）。所以"一个从盘不够用就再开一个新的"——15 个技能占两页，第 2 页 3 格 + 9 个空格，**没有条目会被丢掉**。
- 页会随装备出现和消失，**后面的编号因此会前后移动**：编号是"第几格"这个位置，不是某个条目的身份。这正是要的效果——拿掉物品时编号不动，物品回来时同一个编号指回同一个技能。
- 页列表只在客户端（`screen/wheel/WheelMenuContent#pages`，每页一个 `WheelPage`）；服务端不知道有几页。

从盘读的是**技能授予账**（`AbilityAttachment` 的 `SourceLedger`），而它本来就按来源计数（装备槽记 `mxt:equipment/<槽位>/<物品>`，Curios 记 `mxt:curios_equipment`）；来源 id 的写法收在 `runtime/ability/AbilitySources`，授予侧与轮盘侧共用一份。读取与判定都在 `runtime/wheel/WheelSources`：`abilities(entity, source)` 给出一个来源现在的**全部技能**条目（只列 `mxt:active`、按 id 排序、**不截断**：分页是客户端的事），`equipment(entity, source)` 给出这一页该读哪几件装备的栈（主盘给双手 + Curios，见 [法器技能](#法器技能)），`toggles(entity, source)` 在它上面读**法器技能**，`offers(entity, source, kind, id)` 回答"这个来源现在认不认这一项"。**从盘没有任何存储**：把物品换掉、摘掉法器，那几页当场就没了；法器技能也一样，它读的是栈本身而不是账本。

`R` 打开时判空的是**"整张轮盘一格有内容的都没有"**：主盘空但手里那把剑有技能时轮盘照样开，否则从盘永远够不着。

## 法器技能

判据只有一句：**凡是要按键才发动的都算技能，都进轮盘**。法器定义 `abilities` 里凡是实现 `ToggableArtifactAbility` 的条目都是这样的东西——实现这个接口就是在说"把这一项放进轮盘"（设计见 `research/32_法器开关与轮盘接线设计.md`）。它既包括**开关**（`mxt:flight`：开＝起剑、关＝落剑），也包括**一次性**（`mxt:storage`：按一下打开这件法器的储物箱，什么都不留下）。接口把四件事交给实现自己回答：

| 方法 | 谁问、问什么 |
|---|---|
| `String key()` | 这件法器里这个能力的名字，同一件法器内唯一（`flight` / `storage`）。**轮盘的条目身份 = 法器 id + key**。 |
| `Component displayName()` | 这一格叫什么（`wheel.mxt.artifact_skill.flight` / `.storage`）。 |
| `Optional<Boolean> state(ArtifactToggleContext)` | 有没有"开着 / 关着"这回事、现在是哪一边；**空 = 一次性**（储物就是空的）。**两侧都问**：客户端画状态，服务端据此决定做什么。 |
| `Result activate(ArtifactToggleContext)` | 按下了，返回"做了没有 + 为什么没做"（`Failure`：不在身上 / 不认你 / 状态已经是这样 / 现在用不了）。只有服务端调。 |

约定：

- **条目身份是 `法器 id/key`**（写成 `ns:path/key`，`ArtifactCapability` 负责拼与解析），所以**一件法器可以有好几个技能，一个 key 一个**——同一把剑既能飞又能储物；同一个 key 写两次在加载期就被拒绝。`WheelEntryKind.ARTIFACT.exists` 要求"这一对真的存在"，光是法器 id 不算，所以布局校验收不下编造的格子。
- **状态归实现自己管**，不是数据包字段：飞行读的是玩家那份 `FlightAttachment`，储物没有状态。客户端那一格只是**报告**——开着的开关绿、关着的灰、一次性的紫（`ArtifactWheelEntry`），tooltip 写「法器：X」与（有状态时的）「状态：已开启 / 已关闭」，`usable` 走 `ArtifactService#mayUse`（不属于你的法器画暗）。**格子画能力名而不是法器图标**：一件法器的两个技能若都画同一把剑就分不出谁是谁，哪件法器等 tooltip 说。
- **它出现在声明它的那张从盘上**（排在技能之后、按 id 排序），也出现在配置界面右侧池子里，因此可以被钉到主盘任意一格。主盘那 12 格存的是 `法器/key`，所以那一格读的是**双手 + Curios**（放进背包不算"在身上"）——与从盘同一套栈。
- **按一下只是"按了这一格"**：请求里没有方向也没有动作，服务端把实现问一遍（见 [触发](#触发)）。这与带 `enabled` 字段的 `FlightToggleC2SPayload` 不同，而那条通道客户端今天并不使用。
- **储物那一格打开的是原版箱子菜单**：`MxtMenus.ARTIFACT_STORAGE` 注册的就是 `ChestMenu`（行数走 `IMenuTypeExtension` 的附加数据），客户端注册原版 `ContainerScreen`，所以**这个窗口没有自己的菜单类也没有自己的界面类**；容器是 `runtime/artifact/ArtifactStorageContainer`——一个读组件、改动即整份写回的实时视图，**不持有物品堆**，法器一离身 `stillValid` 就是假、服务端每刻的菜单检查把窗口关掉。格数由定义给出：**按 9 向上取整、最多 6 行 = 54 格**（容量与窗口永远同一个数）。

## 12 格从哪来

1. **玩家自己的布局**：玩家附件 `WheelLayoutAttachment`（`wheel_layout`）存一份 12 格 `WheelLayout`，每格是 `WheelSlot`（`WheelEntryKind` + id），空格用 `WheelSlot.EMPTY` 哨兵；同一个附件还有 `armed` 字段，存**当前选中的格子编号**（一个 `int`，见 [选中项跨会话](#选中项跨会话)）。附件同步给本人。**只有主盘进这个附件**，从盘不存。
2. **配置界面**（`WheelConfigurationScreen`）编辑这份布局：左 6 列灵气池、右 6 列"技能与法器技能"池各自滚动（右池 = `WheelContent#pool`，即玩家持有的主动技能 + 双手与 Curios 上法器声明的技能），下面一排 12 格共用；`Esc` 保存并关闭。关闭时发 `WheelLayoutC2SPayload`（**整份布局**，不是逐格改动），并把编号**重新上送一次**（页列表刚被换掉）。**只有主盘在这里编辑**：从盘的内容由随身装备决定，界面不预览也不改它们（标题栏那一行会写明）。打开它对服务端没有任何要求——客户端命令 `/wheel`，或按键 `key.mxt.wheel_configuration`（默认未绑定）——所以它没有 S2C payload，也不占服务端一次往返。
3. **服务端校验后落库**：`WheelService.sanitize` 把大小强制成 12，逐格检查 id 能否在该类型的注册表里解析，解析不了就归一化成空格，然后写回附件。只写请求者自己的附件。
4. **没保存过时**：客户端拿到的是 **12 个空格**——**不预填任何东西**（原来的"前 6 个灵气进 0–5 格、前 6 个技能进 6–11 格"默认填充已删除）。放什么完全由玩家决定；代价是**整张轮盘都空**时按 `R` 不会打开（没东西可选），新档第一次要先 `/wheel` 放条目。
5. **解析成条目**：`WheelContent.entries(player, source)` 把一个来源的条目逐个在当前可用池里找（主盘在当前灵气与已授予技能里找，从盘就是它现读出来的那张表）；找不到（授予被撤销、定义被删、灵气不再满足条件）就是**空格子**，但保存的布局**不动**——授予回来它就回来。这与旧 Hotbar"找不到就补位"相反：补位会让玩家的肌肉记忆悄悄漂移。

## 扇区里画什么

每个扇区在环上先画条目的 `icon()`（物品或贴图，16px）；**没有图标时改画名字**——`IconRenderer.renderName` 取 `title()` 里放得下的开头几个字，画在图标本来的位置上，所以一圈填满没有图标的条目也不会出现空扇区。文字宽度按该半径上一扇的弧长减去留白算（`WheelMenuScreen#labelWidth`），因此相邻扇区的文字不会互相压。完整名字始终在轮盘正中间与 tooltip 里。

配置界面那一排 12 格同理：有图标画图标，没有就画名字的开头（`IconRenderer.renderOrName`）——22px 的格子只放得下两个汉字，全名看 tooltip。

## 选择与使用是两个键

`key.mxt.wheel`（默认 `R`）**只负责选**：按住打开轮盘、指针指哪一格就选哪一格；松开（`mode = HOLD`）或再按一次（`TOGGLE`）**只关闭轮盘，不触发**；**打开永远回到主盘（第一页）**。`key.mxt.wheel_use`（默认 `V`，新增）**负责用**：轮盘开着时用掉指针当前那一格且**轮盘不关**（可以换一格接着按），关着时用掉**编号此刻代表的那一格**；鼠标左键等同于它。

**页是视图，编号才是选择**（`WheelSelectionState` 里是 `page` + `number` 两个值）：轮盘界面画当前页、HUD 轮盘格画**整张轮盘**、12 个槽位键作用于当前页、关着时的 `V` 作用于编号此刻代表的那一格。切换是 `key.mxt.wheel_previous` / `key.mxt.wheel_next`（**默认小键盘 `4` / `6`**，可改绑）：

- **轮盘开着关着都能切**，两头环绕；每切一次动作栏报一句「轮盘 2/3：主手物品」——从盘的页由随身物品决定，摘掉东西后那几页就没了，不报一声就不知道自己站在哪一页上。
- **切页不动编号**：切换不是瞄准，所以也不会上送任何东西（编号没变就没有包）。
- 有别的界面打开（聊天栏、物品栏……）时不动作，与其余轮盘键同一口径。
- 页面只在**轮盘环的上方**写一行：「轮盘 2/3：主手物品」（末尾带两把切换键的实际绑定）。HUD 轮盘格**不写任何字**——它是拿来看的一块，翻到哪一页由轮盘自己说。

- **"编号"是客户端状态**（`screen/wheel/WheelSelectionState` 的 `number`，`-1` = 还没选过）：轮盘打开期间每帧写入指针所在格（空格子也写——"指着空的就是没选"比偷偷留着上一格更诚实），关轮盘后保留，`ClientPlayerNetworkEvent.LoggingIn` 清空，再由服务端记住的 `armed` 填回来（见 [选中项跨会话](#选中项跨会话)）。同一份状态里还存着**这一客户端刻解析出来的全部页**（`pages()`，每页恒 12 格、`null` = 空格子），因为 HUD 那张网格每帧都要读每一页的每一格，而解析要走一遍灵气注册表与"能不能发射"的公式，所以只在每客户端刻刷新一次（切页时控制器会立刻再刷一次）；因此授予被撤销、定义被删、灵气付不起时，那一格最迟下一刻就变成"没有目标"，按 `V` 什么都不做。
- **越界自动落到最后一个技能**（`WheelMenuContent#effective`）：编号指向**根本不存在的格子**时（它的页没了，或那一页的条目变少了），代表的那一格是**最后一个有东西的格子**；编号落在现有格子里、但那格是空的（只可能是主盘），仍然是**没有目标**（"指着空格子就是没选"这条老口径不变）。**编号本身在任何分支里都不改写**，所以页回来时同一个编号又指回同一个技能。指针停在从盘页面上空着的那半圈，不会把编号写进那些不存在的格子（`selectSector` 先问 `exists`）：那种位置在画面上根本没有格子。金框画在"此刻代表的那一格"上，`V` 花掉的是它，发出去的编号是原来那个。
- **这把键与两把切页键都读原始输入**（`WheelMenuController` 用 `InputConstants`/GLFW 轮询），不走 `KeyMapping`：任何 `Screen` 一打开原版就 `KeyMapping.releaseAll()`，而且"按着 `V` 松开 `R`"会让 `grabMouse()` 里的 `KeyMapping.setAll()` 把 `V` 重新置为按下、补出一次假按下（等于多触发一次）。一个键只在一处判边沿才不会有这个问题。关着轮盘时还要求没有任何界面打开，否则在聊天栏打 `v` 就会放技能。
- **按了没生效会有一句动作栏提示**，只有两种情况：`open(...)` 的"**整张轮盘都空**"分支发「轮盘上还没有任何条目」，`use(...)` 里"从没选过任何格子"那一支提醒你按住轮盘键选一格（键名取实际绑定）。**选中的格子是空的（或它的条目已被删/被撤销）时不提示**——那一格在 HUD 上本来就画成空框，按 `V` 也不会关轮盘，所以 `usePointed(...)` 的这一支保持静默。走**客户端** action bar（`Minecraft#gui#setOverlayMessage`），不发包；**有别的界面打开时按键都不提示**——那是在聊天栏打字或翻背包，不是请求。
- **12 个槽位各有一把键**（`key.mxt.wheel_slot.1` … `.12`，**默认全部未绑定**，单独一个「**觅仙途：轮盘槽位**」分类）：`MxtKeyMappings.WHEEL_SLOTS` 由 static 块里的 `for` 按扇区数填出，下标 `i` = 页内第 `i` 格、键名数字 = `i + 1`（配置界面编号 `1` 在正上方、顺时针）。**分类内的顺序由 `order` 决定**：原版按键列表是 `Arrays.sort` → `KeyMapping#compareTo`，同一分类内先比 `order`、相同才比"翻译后的显示名"，不设 `order` 就会排成 `1、10、11、12、2…`；做法是给每把键传扇区号当 `order`（`KeyMappingHolder` 为此加了一个转发原版五参构造器的重载），于是编号不需要前导零、顺序在任何语言下都固定。按下槽位键 = **在当前页上选中该格并立刻用掉**（等于"把指针指过去再按 `V`"）：`useSlotKey(...)` 先算出编号（`page * 12 + sector`）、取出那一格、`WheelSelectionState.selectSector(sector)` 让 HUD 金框跟过去、编号随之跨会话持久化，然后 `entry.onSelected(...)` 发一次触发；空格子按下什么都不发生。**行为写在 `WheelMenuController` 的裸轮询里，不是 `onStateChange` 回调**：`setAll()` 会伪造一次按下，对施法就是白放一个技能，而裸轮询还顺带让"轮盘开着时按槽位键"也能用。
- **客户端配置 `release_to_select` 已删除**（松开不再选中），`mode`（按住 / 切换）保留；`WheelSelection.Method` 由 `RELEASE`/`CLICK` 改成 `KEY`/`CLICK`，只表示这次请求来自键盘还是鼠标。
- 轮盘中间那一行：可用时写「按 `V` 使用」（键名取实际绑定，改键后跟着变），不可用时写「冷却中 4.3s」——剩余时间读的是"冷却结束在哪一 tick"（附件里就有），由 `WheelDuration.seconds` 写成**永远一位小数**的秒数，与 tooltip 里的冷却 / 施法同一种写法。
- **可拖动 HUD 元素「轮盘格」**（`screen/wheel/WheelSelectionEntry`，布局键 `wheel.selection`）：**永远 4 列，行数随内容的格子数向下长**——它是**整张轮盘的一览**。**只有主盘画空格子**（那 12 个空框是玩家自己摆的布局，空着就要看得见），从盘的页只画它真正贡献的那几格，所以 3 个技能就是 3 格、不再补一串空框；页边界因此不再一定等于行边界。每格画图标或名字开头、底边一条类型色，不可用时压暗，空格子只有空框；**编号此刻代表的那一格是金色边框**（与配置界面选中的候选格、轮盘上指针所在格子的金色同一套语汇）。尺寸每帧按内容算（`layoutWidth` / `layoutHeight` 动态，`refreshPlacement` 里 `setSize` 回报给框架，长出去会被夹回窗口），默认位置在**窗口左边、竖直居中**。**块的上方不写任何字**：它是拿来看的，翻到哪一页由轮盘自己说。关着轮盘也能用 `V` 这件事靠它才不盲目，顺带能一眼看到每一格里还放了什么。

## 选中项跨会话

服务端记住的是**一个格子编号**，不是条目——格子按整张轮盘连续编号，而页会随装备来去，所以编号是一个**位置**：它的页不在了也不作废，页回来时同一个编号指回同一个技能。它存在同一个 `wheel_layout` 附件的 `armed` 字段里（`Optional<Integer>`，空 = 没选过），两个方向由 `screen/wheel/content/WheelSelectionSync` 负责：

- **恢复（登录后一次）**：客户端读同步过来的附件，把编号原样写进 `WheelSelectionState`（`restore`）——**不解析、不校验、不报 warning**："这个位置上现在什么都没有"本来就是合法状态，客户端那边会按 [越界规则](#选择与使用是两个键)落到最后一个有东西的格子。附件是在玩家加入之后才发过来的，"还没收到"和"这个玩家从来没选过"在头几刻看起来一样，所以在那之前每刻查一次附件；一旦本次会话自己选了东西就再也不查。
- **上送（变了才发）**：编号变了才发 `WheelSelectionC2SPayload`（`Optional<Integer>`）；关着轮盘、翻页、或者指针停在同一格里都不发。配置界面保存布局时会**强制重发一次**——页列表刚被换掉。
- **服务端只做范围检查**：`WheelService.sanitizeArmed` 收下 `0..MAX_ARMED` 的值、别的当"没选"，不解析也不记 warning——它根本无从判断"这一格现在有没有东西"，也不该判断（那取决于玩家身上带着什么）。附件同步给本人，所以客户端恢复时读到的就是服务端存下的那个编号。

## 触发

只有一条通道：`WheelActionC2SPayload(source, kind, id)`——**哪个来源**、哪一类、哪个 id（由客户端在按下的那一刻从**当时那一格**解析出来）。服务端 `WheelService.trigger` 先要求**这个来源现在仍然认这一项**（`WheelSources#offers`：主盘读存档布局、从盘读现在的授予账），不认就整个请求作废，然后才按 `kind` 分派：

- `ABILITY` → `AbilityService.use`（内部再校验授予、条件、消耗、冷却与施法时间）；
- `AURA` → `SpiritBurstService.fireOnce`（校验元素、使用条件、冷却与余量后发一发 `SpiritBurstEntity`）；
- `ARTIFACT` → `ArtifactToggleService`：在请求说的那张盘上重读一遍，调实现自己的 `activate(...)`（开关自己读状态决定往哪边，储物直接开箱）。失败进日志、并在动作栏报「使用失败：<原因>」（`actionbar.mxt.artifact_skill.*`）。

**主盘也走这道检查**：布局本来就是客户端交上来的，所以它不是防作弊，而是让"这一项确实来自你说的那个来源"对所有来源都成立——配置界面刚清掉一格、玩家手里还按着 `V` 时，那次请求会被拒。**编号不参与触发**：它只回答"打哪一格"。

**没有"取消"这个动作**：用一次触发一次，所以没有松开手势可以拿来取消待施法或停发；松开轮盘键只是关掉轮盘。引导型技能（`mxt:channelled`）也不再能由玩家主动中断。

数据包那边：`mxt:active` 的 `slot` 字段现在**不再被读取**（轮盘的位置由玩家的 12 格布局决定），写了也不会报错，只是没有作用。
