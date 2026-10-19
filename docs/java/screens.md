---
title: 客户端界面
---

# 客户端界面

客户端界面统一放在 `com.iafenvoy.mxt.screen` 下：容器**菜单**在 `screen.menu`、它们的**界面**在 `screen.gui`，纯客户端信息界面在 `screen.information`，物品选择器在 `screen.picker`，方向性选择（12 扇轮盘）在 `screen.wheel`，HUD 元素在 `screen.hud`（框架）、`screen.resourcebar`（资源条）与 `screen.wheel`（轮盘格）。新增界面优先复用现成的 `Screen` 基类和原版组件，不要自己造滚动和文本输入。

## 可拖动 HUD 框架 `screen.hud`

模块自己画的 HUD 元素要让玩家能拖动并存档，就接上这套框架。框架只做四件事：**登记元素**、**每帧画它们**、**给编辑器提供命中与占位框**、**把位置写进客户端配置**。

**元素不自己算屏幕坐标，也不自己决定画在哪。** 子区域（比如资源条两列）只负责"提供对象"：把这一帧要显示的东西描述成一组 `RenderBlock`（各自的宽高 + 一个画法），由框架唯一的渲染器 `HudRenderer` 竖着堆进元素矩形——**垂直位置只有这一处算法**，块按自己的高度顺序叠，容器尺寸与内容排布因此永远是同一个数字；要留空隙就用 `RenderBlock.spacer`，不要把它加进某一条的高度。整块自绘的元素走另一条口子：`renderBlocks()` 返回空列表，框架改成调 `render()`。

```java
public final class MyBar extends AbstractHudEntry {
    public MyBar() {
        // 布局键：同时是配置里的存储键与重复登记的检查依据，一个元素一个，跨版本别改
        super("my_bar", WIDTH, HEIGHT);
    }

    @Override public String displayName() { return Component.translatable("hud.mxt.my_bar").getString(); }
    @Override public int layoutWidth() { return WIDTH; }
    @Override public int layoutHeight() { return HEIGHT; }
    @Override public int defaultOffsetX() { return 4; }
    @Override public int defaultOffsetY() { return 4; }

    // 只描述：一块底、一行数值；位置由框架决定
    @Override
    public List<RenderBlock> renderBlocks() {
        return List.of(
                RenderBlock.fill(WIDTH, 6, 0xFF10131D),
                RenderBlock.label(Component.literal("42 / 100"), 0xFFFFFFFF));
    }
}

// 在客户端初始化（FMLClientSetupEvent）里登记一次；返回的就是这个实例，可以直接留引用
MyBar bar = HudManager.register(new MyBar());
```

要点：

- **位置是「窗口锚点 + 像素偏移」存的**：`config/mxt/mxt-hud.json` 的根是一个 `version` 加一张 `layout` 表，每一项是一个对象——`{"anchor": {"horizontal": "center", "vertical": "bottom"}, "offset_x": -55, "offset_y": -47, "visible": true}`。锚点是窗口的八个点之一（四角 + 上下左右四个边中点，JSON 里写成两个轴的对象，而不是一个拼好的字符串），偏移是**从那个窗口点到元素自己同名点的像素距离**，所以换分辨率、换 GUI 缩放后布局不会漂，拖动也不会被比例取整吃掉一像素。显示的像素每次读取都夹进窗口，元素不可能被拖到看不见的地方；夹取不改写存档，窗口缩小时贴边、还原后回到原处。`version` 是 `3`：旧版那种 `hud.layout_v2` 的 `x,y,visible` 字符串不再被读，那批布局退回默认位置。
- **HUD 布局不进配置框架**：它是模组自己的一个 JSON 文件（`config/mxt/mxt-hud.json`，由 `HudLayoutFile` 读写），一行一个元素的对象，编辑器拖动一步就写一次；其余配置仍然统一收进 `config/mxt/`（`mxt-client.json`、`mxt-server.json`）。
- **锚点 `HudAnchor`** 是窗口的八个点（四角 + 四个边中点），它同时管两件事：偏移**从哪个窗口点量起**，以及**尺寸变化时元素的哪个点不动**。默认是左上角；会往上长的东西（一列资源条）用 `CENTER_BOTTOM`（下边中点），轮盘格用 `LEFT_CENTER`（左边中点）。玩家把元素拖到某个锚点方框上就**自动绑定**到它：绑定不移动元素，只把偏移按新锚点重算，所以拖过锚点的瞬间不会跳，之后窗口变化时它跟着那个点走。
- **改动即存档**：拖动、方向键微调、显隐切换都会立刻写布局文件。没有"关界面时统一保存"，所以崩了也不会丢布局；反过来，手动改 JSON 之后要重开客户端才生效（元素只在构造时读一次）。
- **位置只有一个来源**：存档里有这个布局键就用键里的锚点与像素偏移（窗口变化时不需要重算：两个数都是绝对的），没有就用元素自己给的默认（`defaultAnchor()` + `defaultOffsetX()` / `defaultOffsetY()`，每帧重算，所以跟着窗口走）。`resetToDefault()` 会把键**从存档里删掉**——复位必须跨重启有效，否则看起来就像"布局没保存"。（这里曾经多存了一个布尔标志表示"当前用的是存档位置"，它初值是 `false`、只有拖动才置真，于是文件里的位置永远读不到：每次重启都退回默认。删掉那个标志、只留"键在不在"这一个事实，问题就没了。）
- **`moveableEntries()` 收的是所有 `moveable()` 的元素，隐藏的也在内**：编辑器要把隐藏的也画成半透明、并用它右上角的勾选框把它收回来，在这里过滤掉就再也点不到了。自己算位置、不该被拖的元素（比如居中的快捷栏）重写 `moveable() { return false; }` 即可，它依然会被框架画；这类元素若连尺寸都由世界状态决定，还要重写 `refreshPlacement()` 并调用基类的 `placeAtDefault()` 把默认位置应用上去——**只算尺寸不落位置的话，锚点会一直停在 `(0,0)`**，元素画在窗口左上角。
- **尺寸由元素自己说了算**：宽度随内容变化的元素在变化时调用 `setSize(w, h)`。空元素也要给非零尺寸，否则编辑器里看不到。
- **元素要在客户端初始化时登记**，不要等第一帧渲染：框架的 GUI 层只在世界里绘制，否则玩家在主菜单打开编辑器时会看到一片空白。
- **编辑界面**由 `HudManager.openEditor()` 打开（按键 `key.mxt.hud_layout`，默认右 Shift，或客户端命令 `/hud open`）。里面左键拖动、**把元素拖到窗口边上的八个锚点方框上即自动绑定、并画一条从锚点到它的连接线**（线只画选中/正在拖的那一个，八个方框常显）、**元素右上角框内的勾选框切换显隐**（隐藏的元素在编辑器里半透明、勾选框本身不透明）、方向键 1 像素（按住修饰键 10 像素）微调、`Esc` 放弃当前选中、点空白处取消选中；**选中在松开鼠标后保留**。**还没有缩放**：这一版只做移动与绑定，KronHUD 那种拖角缩放与吸附参考线都没移植。
- 编辑器里元素**照常真实绘制**，编辑器只额外画半透明矩形与名字标签，所以拖的时候看到的就是实际效果。
- 诊断用客户端命令 `/hud`：打出每个元素的布局键、**绑定的锚点**、位置、尺寸、当前块数与可见/可拖状态。"一个元素都没登记"和"登记了但这一帧没有内容"在界面上长得一样，只有它能分开。

当前**已接入的元素**是五个：资源条四个——两列可拖的（`resource_bars.left` / `resource_bars.right`）+ 两条不可拖的固定行（`resource_bars.target` / `resource_bars.boss`）——加上轮盘的「轮盘格」（`wheel.selection`，`screen/wheel/WheelSelectionEntry`：它 `renderBlocks()` 返回空、自己 `render()` 画**永远 4 列、行数随页数向下长的格子**（每格 22px，一页 12 格 = 三行；块宽固定 94、高按内容算，格子号 = 编号读序，**编号此刻代表的那一格换金色边框贴图**；**冷却中的格子按原版物品冷却那样压一层白幕**——盖住图标的剩余比例、随时间从上往下退（剩余读条目的 `cooldownTicks`、全长读 `cooldownLength`），其它原因不可用时才压暗），是"整块自己画"那条口子的第一个范例，也是"尺寸随内容变"的第一个范例（`layoutWidth` / `layoutHeight` 每帧算，`refreshPlacement` 里 `setSize` 回报，长出去会被夹回窗口）；默认位置在窗口左边、竖直居中；**画的是整张轮盘的一览**（每一页的每一格）；**不写任何文字标签**）。资源条那四个的做法可以当范例：`ResourceBarOverlay.column(anchor)`／`row(target, layout)` 只回答"哪些条、什么顺序"，条目用 `ResourceBarEntry.blocksWithGaps(...)` 把每条包成块并在条之间插 `spacer`。**位置在数据包那边没有字段**——`resource.bars` 的 `anchor` 只决定落进哪一列，列摆在哪是玩家自己的设置在客户端配置里；两条固定行钉在准心实体上、位置每帧现算、永不入档。资源条自己的 `mxt:resource_bars` GUI 层已经删掉，全部走框架那一层。框架本身的取舍见仓库里的 `research/26_可拖动HUD框架设计.md`，轮盘格这次的改动见 `research/27_轮盘选择系统设计.md` §8 与 `research/31_多轮盘与轮盘来源设计.md` §10.4。

## 轮盘选择系统 `screen.wheel`

按住按键（`key.mxt.wheel`，默认 `R`），屏幕上出现一个 **12 扇**的轮盘：指针**朝哪个方向**就选中哪一扇，选中的扇区**底色变深**并向外扩一点，**这一扇的名字与 tooltip 写在轮盘正中间**。它是技能与灵气**唯一的触发入口**——法器能力就是技能，原来"技能栏 + 灵力栏"两条快捷栏与它们各自的配置界面已经删除（过程见 `research/28_技能与灵气归一化设计.md`）。

**轮盘由"主盘 + 从盘"组成，用一套连续编号串起来**（见 `research/31_多轮盘与轮盘来源设计.md` §10）：主盘是玩家自己摆的 12 格（编号 `0..11`），从盘（主手物品 / 副手物品 / 法器 / 契约灵兽）按随身装备与手里的御兽铃**自动生成、不存储**（内容是这些装备此刻授予的主动技能，加上它们作为法器声明的**技能**；契约灵兽那一页是铃对准的灵宠认的行为），格子从 `12` 起接着排；**一页 12 格**，一个来源占 `ceil(条目数 / 12)` 页（一条都没有就一页都不占），所以"一个从盘不够用就再开一个新的"。翻页是两把键（`key.mxt.wheel_previous` / `key.mxt.wheel_next`，默认键盘左 / 右方向键，**默认两头环绕**，由客户端配置「轮盘选择 → 循环翻页」决定绕回还是停在两端），`R` **打开始终回到主盘（第一页）**。**页只是视图，编号才是选择**：轮盘画当前页、HUD 轮盘格画整张轮盘、12 把槽位键作用于当前页，关着时的 `V` 作用于编号此刻代表的那一格（**编号指向不存在的格子时落到最后一个有东西的格子，编号落在空格子上时落到第一个有内容的格子，编号本身不改写**）。

框架（几何、开合状态机、选择语义）在 `screen.wheel`，环与它的动画由 ApricityUI 页面画（`assets/apricityui/apricity/mxt/wheel/`，页面随模组打包在 jar 里、直接从资源包读），内容（技能与灵气怎样变成条目、每个来源贡献什么）在 `screen.wheel/content`，编辑界面是 `WheelConfigurationScreen`；接法、布局的存储与校验、编号与分页、触发分派见[轮盘条目](../java/wheel.md#轮盘条目)，这里只记要点：

- **框架不决定轮盘上有什么**：`WheelMenuProvider` 回答"这个来源现在贡献哪些条目"，并且**按来源 id 登记**（`WheelMenuContent.register(source, provider)`；内建那五页由 `WheelContent` 在客户端初始化时一起登记，所以内容模组加的是**自己那一页**，不会顶掉内建页），入参是玩家与来源 `api/WheelSource`（`runtime/wheel/WheelSourceTypes` 注册出来的实例，**不再是枚举**；一条来源要回答 `id()` / `displayName()` / `configured()` / `grantSources(entity)` / `equipment(entity)` / `offers(entity, kind, id)`）；返回值可以比一页长，分页由 `WheelMenuContent` 做。条目契约是 `WheelMenuEntry`（`kind` / `id` / `title` / `icon` / `tooltip` / `cooldown` / `usable` / `onSelected`）。这替换掉了框架最初"模块静态登记 12 个槽位"的做法：内容已经是玩家自己的布局，第二条入口只会和它抢格子。
- **布局内容存在服务端**：玩家附件 `wheel_layout` 存一份 12 格 `WheelLayout`（每格 `WheelSlot = 种类 + id`，**种类也按 id 存、也按 id 读**，空格是 `EMPTY` 哨兵，**只有主盘进附件**），以及一个 `armed` 字段存"当前选中的格子编号"（`Optional<Integer>`，一个数字）；配置界面关闭时发 `WheelLayoutC2SPayload`，服务端 `WheelService.sanitize` 强制 12 格、逐格问该种类的 `exists` 后再写回。编号走 `WheelSelectionC2SPayload`，由 `screen.wheel/content/WheelSelectionSync` 在登录时恢复、编号变化时上送——细节见[轮盘条目](../java/wheel.md#选中项跨会话)。
- **一个事实只留一份：指针方向 → 扇区号的换算只在 `WheelGeometry` 里**（`sectorStart` / `sectorCentre` / `sectorAt` 由同一组常量推出，`sectorAt(sectorCentre(k)) == k` 恒成立）。绘制、命中、图标摆位全部问它。MineMenu 把这段换算抄了三处，其中一处的角度约定还和另外两处不同。
- **判扇区只看方向，不看距离**：指针还在内圈里也算数，所以中间那块空地能一直显示"当前指着的扇区叫什么"。
- **扇区数是 `WheelLayout.SLOTS`（12）**，几何从它取数，"一页 12 格"也取自它（`WheelMenuContent.SECTORS`），所以不会有"12 扇的几何配 10 格的页"这种事。
- **空格子画成很淡的占位块**，不响应指针、中间也不显示文字；**整张轮盘一格有内容的都没有**时按键提醒一句「轮盘上还没有任何条目」而不是打开。
- **选择与使用是两个键**：`key.mxt.wheel`（默认 `R`）只**选**——按住打开、指针决定格子，松开（`mode = HOLD`）或再按一次（`TOGGLE`）**只关闭、不触发**；`key.mxt.wheel_use`（默认 `V`）负责**用**——轮盘开着时用掉指针那一格且**不关轮盘**，关着时用掉**编号此刻代表的那一格**（客户端 `WheelSelectionState` 里是 `page` + `number` 两个值；`LoggingIn` 先清空，随后由服务端记住的 `armed` 填回来，见[选中项跨会话](../java/wheel.md#选中项跨会话)），左键等同于它。`WheelSelection.Method` 是 `KEY` / `CLICK`，只表示请求来自键盘还是鼠标。客户端配置「轮盘选择」现在有三项：`mode`（按住 / 切换）、`scroll_switch`（滚轮翻页，默认开）与 `wrap_pages`（循环翻页，默认开）；`release_to_select` 已随这次改版删除。
- **触发不关屏**：用掉一格不会关闭轮盘，所以一次按住可以连用几格；轮盘的开关只由轮盘键决定。
- **按键不能用 `KeyMapping#isDown()` 读**：`Minecraft#setScreen` 一开界面就 `KeyMapping.releaseAll()`，用 `isDown()` 的话轮盘会在出现的那一帧就被判成已松手。第二个理由与使用键有关：按着 `V` 松开 `R` 时 `MouseHandler#grabMouse()` 里的 `KeyMapping.setAll()` 会按物理状态把 `V` 重新置成按下、补出一次假按下，等于多触发一次。控制器因此对轮盘键、使用键和两把切盘键都用 `InputConstants` / GLFW 直接读原始状态，并且一个键只在一处判边沿；`KeyMapping` 只负责让它们出现在按键设置里。代价是判定精度为客户端刻。
- **它是个 `Screen`，不是 GUI 层**：开界面时原版会自动放开鼠标（指针才能指方向，而且角度与 GUI 缩放无关），关掉时又会把准心收回来。它不暂停游戏，也不画背景——默认背景会把这之前提取的整层 HUD 糊掉。
- **半径与适配缩放是常量**（`WheelGeometry`，窗口太小时扇环整体缩小），**颜色与动画时长写在页面 CSS 里**：整套是灰阶，指向那一扇压深一档；HUD 的「轮盘格」选中框仍是金色贴图。
- **按住轮盘时角色会停下**：原版对任何 `Screen` 都会 `KeyMapping.releaseAll()`，移动键随之松开（松开轮盘键时 `setScreen(null)` 又会 `grabMouse()` 把物理按键状态同步回来，不用重新按）。要"边跑边开"就得改成 GUI 层并自己接管指针。

## 法器储物窗口 `MxtMenus.ARTIFACT_STORAGE`

轮盘上「储物」那一格按下去打开的就是它（见 `research/32_法器开关与轮盘接线设计.md`，由 `AbilityActivationService` 统一进入）：**没有自己的菜单类，也没有自己的界面类**——它就是原版箱子那一套，注册的是 `ChestMenu`，客户端注册的是 `ContainerScreen`（`generic_54.png` 那张贴图本来就画 1..6 行），所以宽度固定 176、行数由 `getRowCount()` 决定，标题由开窗包带过去（`screen.mxt.artifact_storage` = 「储物 · 法器名」）。行数走 `IMenuTypeExtension` 的附加数据（服务端写 `capacity / 9`），客户端据此重建一个同样大小的 `SimpleContainer` 镜像，格子内容照常走菜单同步。

内容那一侧是 `runtime/artifact/ArtifactStorageContainer`（`SimpleContainer` 子类）：开窗时从承载物的 `mxt:storage` 组件读进来——内容是其中按**这条储物技能自己的 id** 寻址的一条 `mxt:container` 记录（组件 `mxt:artifact_storage` 已删除），之后**每一次改动都在 `setChanged()` 里整份写回**（`ArtifactStorageService#replace`，一次组件更新而不是每格一次）。它**故意不持有那个物品堆**——法器的位置是会变的，往一个没人拿着的栈里写就是物品消失的经典成因：所以每次读写都按"这件法器还在不在玩家身上"重新解析（`ArtifactService#carried` 扫双手、背包与 Curios），`stillValid` 一旦为假，服务端每刻的菜单检查就会把窗口关掉。储物格数由定义给出：**按 9 向上取整、最多 6 行（54 格）**，容量与窗口永远是同一个数。

## 丹炉的四个界面

四个页面分别由核心、主药仓、辅药仓、产物仓打开，炉壁不打开任何界面。唯一开界面入口是 `AlchemyFurnaceMenus.open(ServerPlayer, BlockPos)`：方块右键时把访问位置交过去，它按那个位置的方块决定页面（核心＝监控、主药仓＝主药、辅药仓＝辅药、产物仓＝产物），别的方块什么都不开。

布局不在 Java 里：四个页面各对应一份随模组发布的 HTML 与共用样式表——`monitor.html`、`main_input.html`、`auxiliary_input.html`、`output.html` 与 `alchemy.css`，由 ApricityUI 渲染，皮肤是随模组发布的扁平半透明深色样式表，文字用游戏自带的字体绘制（页面不写 `font-family`）。Java 只按稳定 ID 抓节点，然后绑状态与事件（**槽位不归它**，见下句），**不手写布局树，也没有备用树**：四个页面都要有 `panel`、`title`、`inventory_label`、`player_inventory`，三个仓页另有 `machine`，监控页**没有 `machine`**（供热是世界里的一格方块）；监控页另有 `temperature`、`limit`、`status`、`progress`（进度条本身是 `progress_fill`）、`target`、`apply`、`start`、`abort`。`machine` 声明这一页的机器槽位数（主药 2、辅药 3、产物 4），`player_inventory` 是 36 格玩家物品栏。缺了哪个必需节点，那一页的页面绑定就整份丢掉、屏幕上一个字都不画，只在日志里留一条 WARN：`Page <name> does not match its contract: <missing piece>`（槽位是 ApricityUI 按菜单布局绑的，不受这条契约影响，所以格子照旧能点）——视觉重排随便改，这些 ID 与这两个容器不能改。槽位归 ApricityUI：页面里的 `<slot>` 按祖先 `<container id>` 与组内 `slot-index` 绑到菜单槽位，`Slot.x/y` 每帧由它写回，物品、悬停高亮、拖拽与槽位提示框也都是它的；Java 这边只剩读面板的实时矩形，喂给屏幕自己的命中判定与 `hasClickedOutside`。**页面不要写 `aui-mouse-events` 这个 meta**，写了点击会被页面吃掉，槽位就点不动了。页面要自己撑满视口做居中时用视口单位（`height: 100vh`）：ApricityUI 里 `body` 的百分比高度不生效，写 `height: 100%` 面板会一直贴着顶边。宿主屏幕在 `extractBackground` 里先画原版那层半透明灰底（`AuiStyles.extract`，就是原版容器界面那块渐变）再交页面；**别调 `super.extractBackground`**——普通 `Screen` 宿主的 `isInGameUi()` 是 false，super 会走「模糊 + 菜单底图」那一支，把已经画好的 HUD 一起糊掉。**唯一的例外是轮盘菜单**：它是边玩边读的，`extractBackground` 保持空的，世界与 HUD 都按原亮度显示。

页面随模组打包在 `assets/apricityui/apricity/mxt/alchemy/` 下，每次打开都直接从资源包读。所以改页面就是改 jar（或资源包）里的那一份：开着热重载时存盘即生效，否则在游戏里按 END 重扫资源、再重开丹炉界面。游戏目录下的 `<gameDir>/apricity/` 只是玩家的覆盖层，同名文件优先于 jar。

## 其余容器界面

锻造台、灵气工作台、经济组（交易站顾客与店主两页、兑换站、支票台、玩家交易）与人物信息是同一套：面板、文字、选择格与数值尺都由页面画（`assets/apricityui/apricity/mxt/forging/`、`assets/apricityui/apricity/mxt/spirit_crafting/`、`assets/apricityui/apricity/mxt/economy/`、`assets/apricityui/apricity/mxt/information/`，共用 `assets/apricityui/apricity/mxt/common/theme.css`），槽位由 ApricityUI 绑到菜单槽位上，页面里的 `<slot>` 放在"凹面格"的位置上（物品画在格里的 +1 处，偏移来自 ApricityUI `global.css` 里的 `slot > item`）。这些页面和丹炉一样随模组打包、直接从资源包读，游戏目录里不写任何东西。玩家交易的界面可以在**开发环境**里一个人验收：`/trade` 的目标写自己就直接开一场自己对自己的交易（一个人占两侧、按一次确认即算双方确认），正式环境仍然拒绝。

这几页要自己改时记住三条：**面板不要写 `border`**（页面的定位基准是面板的内容盒，加了边框，页面里每个坐标都会整体偏一点，边框用 `box-shadow: inset` 画）；**别用 `overflow: hidden` 裁内容**（游戏里会画出一块暗色方块）；页面里容器要带 `primary="true"`，否则重复生成的槽位不会展开、槽位序号也不会归一化。人物信息的面板会随窗口缩放，所以它的位置与尺寸不是写死的，而是每次开界面按窗口算出来的；它左上角的两个页签（**人物信息**与**习得功法**）在两页之间切换，两页共用同一块面板，面板上没有单独那行标题。

还有一类界面**整幅窗口都是页面**：阵法 `/formation show` 的结构预览（`assets/apricityui/apricity/mxt/multiblock/`）。上下两条压边、标题、层号、提示、播放控制与时间轴都由页面画，只有三维场景仍由 Java 以画中画（picture-in-picture）提交到页面留出的那块矩形里，所以那块矩形**必须保持透明**。这一页里一个坐标都不写——场景、按键与时间轴的盒子由 Java 按窗口尺寸写进去（窗口一变就重写一遍），按键的悬停与按下交给 CSS，只有"点时间轴跳层"与"在场景里拖动转视角"这两件要看指针位置的事仍由 Java 处理。

监控页画的是服务端下发的只读读数（`AlchemyStateS2CPayload`，见[网络协议](./network.md)），界面自己不算配方，也不显示丹方名或丹方按钮；温度输入框、开始与终止只是把那三件事发回服务端。页面里的 `player_inventory` 与 `machine` 都是真实槽位，机器槽位与玩家物品栏同在菜单里；监控页没有机器槽。

## 物品选择器

选择器**不在本模组里**：界面、`/picker` 命令、开屏包与目录读取都由 **Picker** 模组提供（本模组通过 `jarJar` 内置它）。本模组只登记「哪张注册表对应哪些行」，也就是 `data/PickerCategories`，在模组构造时登记一次。`minecraft:item` 与 `minecraft:block` 两个分类是 Picker 自己的内置内容，本模组不再登记它们。

一行是 `PickerRow(堆, 名字列表)`：**要画的堆**，加上**这一行能被哪些名字搜到**。堆本身保持原样，**不往物品上写任何东西**（没有自定义名称、没有后缀）——同一件替身物品代表好几个定义时靠搜索区分，不靠名字上的标记。

- 物品/方块注册表的条目本身就是物品，堆上已经写着它叫什么，于是名字就是「它显示的名字 + 它的注册 id」；
- 数据驱动定义没有自己的物品，堆上根本看不出它代表谁，于是名字由 `DefinitionText` 从它的 `Holder` / `ResourceKey` 生成翻译键得到——`mxt:fire` 在 `mxt:aura` 里就查 `mxt.aura.mxt.fire`——再补上它的 id。定义里**没有 `name` / `description` 字段**，名字与描述永远按注册 id 现算（描述就是名字键再加 `.description`）；
- 标签匹配展开出来的行，名字里既有那个物品自己的名字，也有它所属定义的名字和 id。

用列表而不是单个名字，是因为一行可以有好几种叫法：一个定义的定义名与 id 都该能被搜到。

分类就是一张注册表，`/picker <分类 id>` 可以只列出某一个（如 `/picker mxt:aura`、`/picker mxt:artifact`、`/picker mxt:currency`、`/picker mxt:item_binding`），不写则给出全部已登记分类。分类顺序就是登记顺序：Picker 自己的两个内置分类在最前，随后是本模组登记的那些；每个类目里的行序就是那张注册表自己的顺序。

别的模组要读同一批行（例如拼自己的创造栏），用 Picker 的 `PickerContents`：每条查询都要求调用方自己传注册表访问器（`itemsOf(Provider, key)`），`itemsOf*` 一个定义一行、不去重，`stacksOf*` 按原版创造栏规则（同物品同组件算同一件）去重且每份都是拷贝。