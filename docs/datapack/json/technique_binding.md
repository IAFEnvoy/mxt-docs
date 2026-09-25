---
title: technique_binding（功法绑定）
aside: false
---

# technique_binding（功法绑定） {#technique_binding}

文件位置：`data/<namespace>/mxt/technique_binding/<path>.json`

**用途**：一条功法**怎么被读**——长按时长、姿势、音效、品质链与条件，外加本体替它生成的载体物品。**这一叠是不是手册、教的是哪门功法，由堆上的物品组件 `mxt:technique` 决定，不由本表决定。**

| 字段 | 类型 | 默认 | 说明 |
| --- | --- | --- | --- |
| `technique` | `Holder<technique>` | **必填** | 本定义描述的是哪门功法。按功法 id 匹配，不再是按物品匹配。 |
| `carrier_item` | 物品 id | `mxt:cultivation_jade_slip` | 本体替这门功法**生成载体**时使用哪个物品。单个物品 id，不支持物品标签、通配符或数组。 |
| `quality_chain` | `Holder<quality_chain>` | 无 | 这个物品所在的品质链条（见 [quality_chain](./quality_chain.md)）。链同时给出成员资格（解析出的档必须在链上，否则不能使用）、默认档（链的 `default`）与可升级的路径。 |
| `conditions` | `EntityCondition[]` | `[]` | 学习前条件；支持内联条件或带描述的条件对象。 |
| `learn_time` | Integer | `0` | 需要**长按**的时长，单位 tick，范围 `0..72000`。`0` 表示右键立刻学会。 |
| `hold_animation` | String | `block` | 长按时播放的动作。仅在写了 `learn_time` 时有意义。取值见下表。 |
| `hold_sound` | `Holder<sound_event>` | `minecraft:item.book.page_turn` | 长按时播放的音效。仅在写了 `learn_time` 时有意义；**附近所有玩家都能听到**。 |

::: warning 旧写法已经失效
旧版本用 `items` 字段把一个物品（或标签、数组）绑到一门功法上。这个字段**已经不存在**：定义 Codec 不认识未知字段，写在新文件里的 `items` 会被**静默忽略**，加载不报错，只是那条规则不再生效。请改用 `carrier_item`，并按下面的方式给堆写上 `mxt:technique` 组件。
:::

## 一叠物品怎么才算手册 {#manual}

**堆上有 `mxt:technique` 组件，这一叠就是那份功法的手册。** 组件存的是功法定义的 id（`Holder<technique>`）：

```mcfunction
give @s mxt:cultivation_jade_slip[mxt:technique="example:azure_breath"]
```

没有这个组件的同一物品（例如创造模式物品栏里拿出来的 `mxt:cultivation_jade_slip`）**什么都不教、Tooltip 里也不显示功法**——这正是本次修正的行为：以前任何一叠玉简都会被当成某门功法的手册。

组件是**堆数据**，所以世界里自然生成的物品不会自动带上它。任何能写到堆上的途径都同样成立：

- 配方产物的 `components`；
- 战利品函数；
- `/give` 的物品组件语法（如上）。

## 本体替功法生成的载体 {#carrier}

本体按 `mxt:technique` 注册表**为每条功法自动生成一份载体**：创造模式物品栏里有，物品选择器的 `/picker mxt:technique` 分类里也有。生成用的物品就是这条功法定义里 `carrier_item` 指定的那个，**不写就是玉简** `mxt:cultivation_jade_slip`。

内容包想用自己的物品当手册，就写 `carrier_item: "命名空间:物品"`，然后从上面两个入口取生成的载体——取到手的那一叠已经带好 `mxt:technique` 组件。

**一条功法可以没有定义。** 定义按功法 id 匹配，找不到就按默认值读：右键即学、默认姿势与音效、无品质链、无条件、载体是玉简。也就是说没有任何 `technique_binding` 文件的功法照样能通过组件学习，只是读起来是最朴素的那一种。

## 长按与判定

`learn_time` 大于 `0` 时，物品改为**长按**学习：按住右键蓄力，进度走完才学会，中途松手视为取消、什么也不会发生。进度条、手臂动作和松手取消都由原版的 use 周期提供，不需要额外界面。

两种写法互不影响：省略 `learn_time`（或写 `0`）保持右键即学，写正数就是长按学。

**物品不需要做任何特殊处理。** 只要堆上有 `mxt:technique` 组件，该物品就会按定义获得长按行为，无论它是原版物品、其他模组的物品，还是 KubeJS 注册的物品——组件写在堆上，不要求物品属于某个特定类，也不要求它就是 `carrier_item`。

原理：原版的 use 周期向**物品堆**要两样东西——“这个动作持续多久”（`getUseDuration`）和“播哪个姿势”（`getUseAnimation`），而这两问读的都是栈上的原版组件 `minecraft:consumable`。模组在右键那一刻把该组件写到手持的那份堆上，于是长按、姿势与进度全部由原版驱动，模组既不接管 `Item` 的任何方法、也不 patch 它。写入在客户端与服务端**各自执行**：两端从同一份同步过来的组件与定义算出同样的时长，所以看到的是同一个长按；服务端在长按开始后立刻把组件摘掉，因此它不会存进存档。

这套长按驱动是本体里的一个**通用模块**，不属于功法：任何模块只要提供"多久、什么姿势、什么声音"就能复用它，`technique_binding` 只是第一个用户。所以本页的 `learn_time` / `hold_animation` / `hold_sound` 三个字段是功法模块自己的说法，换到别的模块上字段名会不同、行为一样。

**判定以服务端为准，姿势不是。** 原版的一次使用周期在客户端和服务端各有一个独立计数器，而服务端不一定跑满 20 TPS——那样服务端的 60 tick 在真实时间里就比客户端的 60 tick 长。模组让**判定**（读完没有、学会没有、进度条）走服务端，所以 `learn_time` 是"服务端需要跑满的 tick 数"，服务端掉帧时会相应变长，这是正确的行为。**手臂姿势走的是客户端自己的计数**，所以服务端掉帧或延迟较大时，姿势可能比判定早一点收掉：那段尾巴通常只有一两 tick，正常服务器上看不出来，只有服务端明显跟不上时才会看到"动画断了一下、功法随后才到"。模组不为这件事修改客户端，也不再为此往日志里写任何东西（原先那个每 tick 检查并打印 `[mxt] hold pose ...` 的诊断器已删除），所以遇到时只能靠观感判断，没有日志可以对照。

**长按期间有声音，而且附近所有人都听得到。** 阅读者听到的那一次由**他自己客户端**上的组件播放（也就是原版放吃东西声音的同一条路）；附近的其他人听到的那一次由**服务端**按距离广播。两处刻意错开——服务端广播时把阅读者排除在外，否则阅读者会同时听到两遍。默认是翻书声，因为原版给"可以使用的东西"配的默认音是**吃东西的咀嚼声**，读书时听着不对。间隔沿用原版规则（约 1/5 时长之后每 4 tick 一次）：`learn_time` 越长响得越多，调小音效音量比改这里更有效；`learn_time` 为 4 或 5 tick 时这个窗口根本不会打开，那两种长按没有声音。

:::warning
长按**不会消耗**手册：驱动长按的组件在长按一开始就被摘掉了，读完物品原样留在手上，即使该物品**本来就有食用属性**（例如把组件写到面包上）也不会被吃掉。

不过把 `learn_time` 用在**食物**物品上仍有一个边角：原版在开始使用之前会先问一次“现在能不能吃”，玩家不饿时这次右键会被直接拒绝，长按根本不会开始。手册请使用非食物物品。
:::

学会成功后会在**动作栏**提示"习得功法：<名字>"（`actionbar.mxt.technique.learned`）；被拒绝时同样在动作栏给出原因。此前只有失败提示，成功时没有任何反馈，看上去和"右键没反应"一模一样。

物品冷却由**服务端配置「修炼 → 习得冷却」**控制，不在数据包里：单位 tick，范围 `0..72000`，默认 `60`（3 秒），写 `0` 关闭。**无论学会成功与否，一次读完的阅读都会进冷却**——冷却是"这次尝试"的代价，不是失败的惩罚：它要挡的是同一本手册被反复读，而"被拒绝不花冷却"恰好把这条路径留给任何当前学不会的功法。走的是原版 `Player#getCooldowns`，所以热键栏的灰色扫描和 `mxt:on_cooldown` 物品条件都能直接读到。

中途松手不算一次阅读（读数没有完成，也没有产生任何学习判定），因此不进冷却。

`hold_animation` 复用原版的 `ItemUseAnimation`，但**只接受无副作用的那几个**：

| 取值 | 表现 |
| --- | --- |
| `block`（默认） | 举在身前，像捧起来看 |
| `brush` | 原版刷子的动作 |
| `bundle` | 原版收纳袋的动作 |
| `toot_horn` | 原版山羊角的动作 |
| `none` | 不做动作，只有进度条 |

以下取值会被拒绝并在加载时直接报错：

- `spyglass`：原版把这个姿势直接等同于 `Player#isScoping`，而那个判定会**强制把视场角锁到 0.1**、并切换到低鼠标灵敏度，这两处都在我们改不到的类里。而且 `ItemInHandRenderer` 在 scoping 时会把整只手（连同物品）整个跳过不渲染，所以"只取姿势、屏蔽副作用"的版本会什么都不显示。
- `eat`、`drink`、`spear`：这三个声明了 `hasCustomArmTransform`，原版会因此跳过本该把物品举起来的手臂变换，而这些物品并没有配套的手臂模型。
- `bow`、`trident`、`crossbow`：这三个会按"已蓄力多少"来缩放姿势，用它们会让阅读看起来像在拉一张并不存在的弓。

## 示例

一门要让内容包自己的物品当载体的功法：

```json
// data/example/mxt/technique_binding/fire_manual.json
{
  "technique": "example:fire_manual",
  "carrier_item": "kubejs:fire_manual",
  "quality_chain": "example:manual",
  "conditions": [{"type": "mxt:realm", "realm": "example:foundation"}]
}
```

同样一门功法，要求长按三秒、用刷子的姿势：

```json
{
  "technique": "mxt_test:azure_water_manual",
  "carrier_item": "mxt_test:azure_water_manual",
  "learn_time": 60,
  "hold_animation": "brush",
  "conditions": [{"type": "mxt:always_true"}]
}
```

写完之后，手册本身还是得从**带组件的堆**来：用上面 `give` 那样的物品组件语法，或让配方产物带上 `{"mxt:technique": "mxt_test:azure_water_manual"}`。
