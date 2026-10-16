---
title: technique（功法）
description: 定义一门可以学会的功法：学习条件、长按时长、被动属性、授予的能力与进度链。
aside: false
---

# technique（功法） {#technique}

文件位置：`data/<namespace>/mxt/technique/<path>.json`

一门功法是可以被学会的东西。学会之后它一直生效：`granted_abilities` 立刻给能力，`passive_modifiers` 一直给属性；爬升的那部分另有一份账——功法给出一条进度链的入口，持有者沿这条链逐级晋升，每一级再解锁自己的能力。已学会的功法全部同时生效。

| 字段 | 类型 | 默认 | 说明 |
| --- | --- | --- | --- |
| `quality` | 品质 id | 无 | 可选。这门功法自己的品阶：携带这份定义的功法书读到的就是它。 |
| `icon` | 图标引用 | 无 | 功法在界面（如功法面板）中显示的图标。 |
| `primary_color` | `RGBColor` | `#0E54A0` | **内置功法书** `mxt:technique_book` 第一层贴图（书身）的颜色，写 `#RRGGBB`（整数或 `[r,g,b]` 浮点数组也接受，一律按不透明处理）。 |
| `secondary_color` | `RGBColor` | `#E4E8EB` | 同一本书第二层贴图（书面上那个标记）的颜色，写法同上。 |
| `learn_condition` | `EntityCondition` | `mxt:always` | 学习条件。 |
| `learn_time` | [`NumberProvider`](../types/number_provider_types) | `0` | 读完这门功法需要**长按**多久，单位 tick。**按读取者求值**（长按开始时求一次、之后每 tick 再求一次），结果向下取整；小于 `1` 当作 `0`，也就是右键立刻学会。没有上限（求值超过 int 就按 `2147483647` 算）。 |
| `hold_animation` | String | `eat` | 长按时播放的动作。仅在 `learn_time` 大于 `0` 时有意义，取值见[下表](#holding)。 |
| `hold_sound` | 音效 id（`sound_event` 注册表） | `minecraft:item.book.page_turn` | 长按时播放的音效。仅在 `learn_time` 大于 `0` 时有意义；**附近所有玩家都能听到**。 |
| `exclusive_tags` | Identifier 数组 | `[]` | 功法互斥标签。 |
| `cultivation_modifier` | `NumberProvider` | `1` | 修炼倍率。 |
| `passive_modifiers` | 属性修正条目数组 | `[]` | 被动属性。 |
| `granted_abilities` | 能力 id 或 `#标签` 的数组 | `[]` | 学习后授予的能力，始终生效。 |
| `default_level` | 进度等级 id | 无 | 该功法进度链的入口等级。 |
| `mastery_resource` | 数值 id | 无 | 衡量该功法熟练度的存储数值。 |
| `configuration` | 进度等级 id 到条目对象的映射 | `{}` | 该功法对共用进度链上每一级的注释；条目字段见下表。 |

`configuration` 的每个条目描述一级：

| 字段 | 类型 | 默认 | 说明 |
| --- | --- | --- | --- |
| `condition` | `EntityCondition` | **必填** | **到达**该级所需的条件。不需要条件就写 `mxt:always`；写数组表示全部满足。 |
| `ability` | 能力 id 或 `#标签`，可写数组 | `[]` | 该级授予的能力。它是**最低要求**——持有者在更高级别时依然生效，所以能力是累积的。可写单个能力、`#` 标签或它们的数组。 |
| `action` | `EntityAction` | `mxt:no_op` | **进入**该级时执行一次的行为。 |

这三个字段功法与生物档案共用，没有灵宠专用的条目字段。`action` 在进入那一级时跑一次：自然晋升与管理员的等级写入都算进入，它**先**跑、`mxt:progression_level` 信号**后**发，所以反应方看到的是已经变过的身体；写数组就是按顺序执行。

`quality` 引用 `mxt:quality` 里的一档，可以省略。所有功法共用一件载体物品 `mxt:technique_book`，物品本身说不清是哪一档，只有堆上携带的这份定义报得出：携带这份定义的功法书按它读档。堆上写了自己的 `mxt:quality` 组件时以组件为准；这份定义没写 `quality` 时这一层不作答，继续落到注册表 [default_quality](./default_quality.md)。

`primary_color` 与 `secondary_color` 只染**本体那件功法书**：这本书的模型分两层贴图，第一层用 `primary_color`、第二层用 `secondary_color`，所以内容包写两个颜色就能换掉这本书的样子。堆上没有 `mxt:technique` 组件（创造栏里的空功法书），或它点名的那条功法已经不在注册表里，就用上面那两个默认色；被绑定认领的物品照旧用它们自己的贴图。

翻开这本书时，两页的贴图按**功法自己的 id** 取：`assets/<功法命名空间>/textures/item/technique/<功法路径>_left.png` 与 `..._right.png`；那一页没画就退回同一命名空间的 `assets/<功法命名空间>/textures/item/technique_book_page.png`；两张都没有，那一页保持模型自己写的那张。两页各落在模型里哪个贴图槽，写在物品模型（`assets/mxt/items/technique_book.json`）的 `pages` 里：**两页写同一个槽时，先按 `_left` 取图、没有再按 `_right`——先画出来的那张归这个槽**；要让左右两页各用一张图，模型里得给它们各留一个槽、再在 `pages` 里分别点名。`pages` 点了一个模型里没有的槽，日志里会有一条 ERROR，那一页不会换图。功法定义不写任何贴图字段；图画在该槽实际用到的 UV 区块里，UV 不跟着换。

**一本手册的提示框里会印出这门功法的名字与它的描述**——描述取自生成键 `<功法键>.description`，包没翻译就不印（提示框里不会出现键名）。**右键一本功法书就是读它**：本体先印书上写的文本（如果有），再印同样的名字与描述。写了 `learn_time` 的功法照旧是长按读完才学会，右键那一下只负责把书读出来。长按那一套的规则见[长按与判定](#holding)。

`passive_modifiers` 用原版 AttributeModifier，`value` 为可选的动态公式。

`default_level` 不定义进度时可以省略。

`mastery_resource` 不写则永不晋升。

等级本身属于进度链，所以同一条链可以被多个功法共用，而"每级给什么、要什么条件"由各功法自己决定。入口等级（`default_level`）是持有者的起点，**不需要**写条目；若仍然写了，它的 `ability` 照常在该级生效，而 `condition` 只被解析、不会成为任何门槛（不存在"晋升到入口等级"这件事）。入口之后的每一级**必须**配置；配置了从 `default_level` 永远走不到的等级会在链重建时被拒绝——链条不能经过一个没有任何描述级别的台阶。

`granted_abilities` 与 `configuration` 相互独立：前者只要学会功法就生效；后者随持有者等级推进而累积。`configuration` 需要 `default_level` 来指明它属于哪条链，缺少 `default_level` 会在解析期报错；缺失的中间等级或不可达的 key 会在链重建时被拒绝。

晋升由数据驱动，而不是只看功法文件：`mastery_resource` 决定**用什么**衡量熟练度，等级自身的 `mastery` 决定**需要多少**，该级的 `condition` 决定**还需要什么**，而数值怎么涨由功法之外的任意内容决定（触发规则、修炼档案，或脚本）。

已学会的功法在服务端周期检查中逐级晋升（一次检查里每级最多晋升一层），同时满足以下条件才晋升：

- 定义了 `mastery_resource`；
- 持有者该资源的存储值不小于下一级的 `mastery`；
- 下一级的 `condition` 成立。

晋升后按新等级重算能力授予：`granted_abilities` 加上已到达的每一级的 `ability`（因为 `ability` 是最低要求）。晋升会发布 `mxt:progression_level` 信号，供其它内容响应（信号携带刚到达的等级 rank，公式变量 `level`，以及扩展值 `owner`）。由于等级在链上、熟练度数值在资源上，内容包可以自由决定熟练度怎么涨：

```json
// data/example/mxt/trigger/mastery_from_combat.json
{
  "trigger": { "type": "mxt:kill" },
  "action": { "type": "mxt:add_resource", "resource": "example:sword_mastery", "amount": 1 }
}
```

只有 `configuration` 而没有 `mastery_resource` 的功法不会自行晋升；反之，写了 `mastery_resource` 却没有 `default_level` 会在解析期被拒绝，因为没有可爬的链。

**读写功法状态。** 实体条件 `mxt:technique` 问这一位**学过**哪些功法：`techniques` 接受条目、`#` 标签或数组，空表就是"学过任意一门"，`match` 取 `any`（默认，命中其一即可）或 `all`（写下的每一项都要满足，此时空表会在加载期被拒绝，免得静默变成恒真）；`mxt:progression` 再问它们爬到了哪一级。它读的是**学过**而不是"正在生效"——功法没有启用开关，灵根与体质才有；要表达"没有功法"用 `mxt:not` 套一条。战利品表里用同名的 `mxt:technique`（多一个 `entity` 目标字段，其余同形，见 [战利品与进度条件](../loot-and-criteria.md)）。问的是身体里那份授予账本，所以当前包已经不提供的功法照样答得出来。字段细节见 [实体条件类型](../types/condition/entity_condition_types.md)。

```json
// data/example/mxt/technique/azure_breath.json
{
  "granted_abilities": ["example:azure_guard"],
  "default_level": "example:azure_breath_1",
  "configuration": {
    "example:azure_breath_1": {
      "condition": { "type": "mxt:has_realm", "aura": "example:qi" },
      "ability": "example:azure_bolt"
    },
    "example:azure_breath_2": {
      "condition": { "type": "mxt:realm", "realm": "example:foundation", "comparison": ">=" },
      "ability": ["example:azure_bolt", "#example:azure_mastery"]
    },
    "example:azure_breath_3": {
      "condition": [
        { "type": "mxt:realm", "realm": "example:core_formation", "comparison": ">=" },
        { "type": "mxt:health", "comparison": ">=", "compare_to": 20 }
      ]
    }
  }
}
```

## 长按与判定 {#holding}

`learn_time` 大于 `0` 时，这门功法改为**长按**学习：按住右键蓄力，进度走完才学会，中途松手视为取消、什么也不会发生。手臂动作与松手取消来自原版的 use 周期；进度条是**动作栏上的一行文字**（`#--------- 12%`），从按下一直显示到读完或松手，读得越久一格走得越慢。

两种写法互不影响：省略 `learn_time`（或写 `0`）保持右键即学，写正数就是长按学。`learn_time` 可以写公式（见[数值提供器](../types/number_provider_types)）：按**读取者**求值——按下那一刻的值写进 use 组件、由原版计数，而进度条与音效每一 tick 重算；公式随身体变化时格子会跳，想稳稳走完就写常量。

**手册物品不需要做任何特殊处理。** 只要那一叠**能被解析成手册**（带 `mxt:technique` 组件，或被某条[功法绑定](./technique_binding.md)的 `items` 认领），该物品就会按这门功法获得长按行为，无论它是原版物品、其他模组的物品，还是 KubeJS 注册的物品——载体是**堆**，不要求物品属于某个特定类，也不要求它就是绑定里写的 `carrier_item`。

原理：原版的 use 周期向**物品堆**要两样东西，一是「这个动作持续多久」，二是「播哪个姿势」，而这两问读的都是栈上的原版组件 `minecraft:consumable`。模组在右键那一刻把该组件写到手持的那份堆上，于是长按与姿势由原版驱动，不接管物品自身的任何行为。写入在客户端与服务端**各自执行**：两端从同一份同步过来的堆与功法算出同样的时长，所以看到的是同一个长按；服务端在长按开始后立刻把组件摘掉，因此它不会存进存档。

`learn_time` / `hold_animation` / `hold_sound` 是功法这一侧的字段名；别的模块也有同一套长按，字段名不同、行为一样。同一门功法的某几堆想读得不一样，就写 `mxt:technique_reading` 组件（字段与这里同名、全部可选，按**字段**覆盖功法给的这一套）。

**判定以服务端为准，姿势不是。** 原版的一次使用周期在客户端和服务端各有一个独立计数器，而服务端不一定跑满 20 TPS——那样服务端的 60 tick 在真实时间里就比客户端的 60 tick 长。模组让**判定**（读完没有、学会没有、进度条）走服务端，所以 `learn_time` 是「服务端需要跑满的 tick 数」，服务端掉帧时会相应变长，这是正确的行为。**手臂姿势走的是客户端自己的计数**，所以服务端掉帧或延迟较大时，姿势可能比判定早一点收掉：那段尾巴通常只有一两 tick，正常服务器上看不出来，只有服务端明显跟不上时才会看到「动画断了一下、功法随后才到」。这件事不进日志，遇到时只能靠观感判断。

**长按期间有声音，而且附近所有人都听得到。** 阅读者听到的那一次由**他自己的客户端**播放，和他客户端正在画的手臂动作同一拍；附近的其他人听到的那一次由**服务端**按距离广播。两处刻意错开——服务端广播时把阅读者排除在外，否则阅读者会同时听到两遍。默认是翻书声，因为原版给「可以使用的东西」配的默认音是**吃东西的咀嚼声**，读书时听着不对。间隔是**固定的**：读到第 4 tick 响第一声，之后每 4 tick 一声，**不随时长变化**——原版那套是「跑完 1/5 时长之后才开始」，`learn_time` 写成几天就几天不响；`learn_time` 不超过 4 tick 的长按不会响。嫌吵就调小音效音量，比改这里有效。

:::warning
长按**不会消耗**手册：驱动长按的组件在长按一开始就被摘掉了，读完物品原样留在手上，即使该物品**本来就有食用属性**（例如把组件写到面包上）也不会被吃掉。

不过把 `learn_time` 用在**食物**物品上仍有一个边角：原版在开始使用之前会先问一次“现在能不能吃”，玩家不饿时这次右键会被直接拒绝，长按根本不会开始。手册请使用非食物物品。
:::

学会成功后会在**动作栏**提示「习得功法：<名字>」（`actionbar.mxt.technique.learned`）；被拒绝时同样在动作栏给出原因。

物品冷却由**服务端配置「修炼 → 习得冷却」**控制，不在数据包里：单位 tick，范围 `0..72000`，默认 `60`（3 秒），写 `0` 关闭。**无论学会成功与否，一次读完的阅读都会进冷却**——冷却是「这次尝试」的代价，不是失败的惩罚：它要挡的是同一本手册被反复读，而「被拒绝不花冷却」恰好把这条路径留给任何当前学不会的功法。走的是原版物品冷却，所以热键栏的灰色扫描和 `mxt:on_cooldown` 物品条件都能直接读到。

中途松手不算一次阅读（读数没有完成，也没有产生任何学习判定），因此不进冷却。

`hold_animation` 只接受**无副作用的那几个**取值：

| 取值 | 表现 |
| --- | --- |
| `eat`（默认） | 举到嘴边，像就着书页读（原版吃东西那套动作）。第一人称能看见物品抬起来抖动，第三人称只是普通持有姿势 |
| `drink` | 与 `eat` 是同一套动作 |
| `block` | 举在身前，像捧起来看 |
| `brush` | 原版刷子的动作 |
| `bundle` | 原版收纳袋的动作 |
| `toot_horn` | 原版山羊角的动作 |
| `none` | 不做动作，只有进度条 |

以下取值会被拒绝并在加载时直接报错：

- `spyglass`：原版把这个姿势直接等同于「正在用望远镜」，而那个判定会**强制把视场角锁到 0.1**、并切换到低鼠标灵敏度，这两处都改不到。而且原版在望远镜状态下会把整只手（连同物品）整个跳过不渲染，所以「只取姿势、屏蔽副作用」的版本会什么都不显示。
- `spear`：自带手臂变换的覆盖，原版会因此跳过本该把物品举起来的那一步，而这类物品并没有配套的手臂模型。
- `bow`、`trident`、`crossbow`：这三个会按「已蓄力多少」来缩放姿势，而阅读没有蓄力可言，看起来会像在拉一张并不存在的弓；`crossbow` 还多一层问题——第一人称渲染器里**根本没有这个分支**，所以第一人称什么动作都看不到。

**内置功法书 `mxt:technique_book` 的姿势是钉死的**：它永远用默认的 `eat`，功法里写什么都不生效——姿势属于这件共用物品，而不是某一门功法。`hold_animation` 只在手册**自带别的物品**时才看得见（[功法绑定](./technique_binding.md) 用 `carrier_item` 换掉了那件物品，或用它的 `items` 认领了一件通常带自己模型的物品）；`mxt:technique_reading` 组件对内置功法书同样改不动姿势。
