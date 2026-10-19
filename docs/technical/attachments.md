---
title: 附件
description: 本体注册的每一个附件：挂在实体、区块还是世界上，装什么状态，存档与同步各是哪一档，以及"一个模块一份"是按什么拆的。
---

# 附件

本模组所有**与实体、区块、世界一起走**的状态都走 NeoForge 附件（`AttachmentType`），没有"往实体 NBT 里塞一份模组自己的键"这回事。全部 30 个登记在 `registry.MxtAttachments` 一处。

附件与[数据组件](/technical/data-components)是同一件事的两个宿主：**组件挂在物品堆上**，"这一堆是什么样"；**附件挂在实体 / 区块 / 世界上**，"这个身体、这块地现在是什么样"。两者都同时有持久化 codec 与网络 codec，所以都跟着存档走、也能同步给客户端——但**同步与否是每个附件单独决定的**，下面会讲。

## 三档同步

登记时用三个私有工厂，选哪个决定了这个附件会不会同步、死了会不会跟着走：

| 工厂 | 存档 | 同步客户端 | 死亡时复制 | 用它的附件 |
| --- | --- | --- | --- | --- |
| `entity` | 是 | 是 | 是 | 大多数实体状态 |
| `entityWithoutDeathCopy` | 是 | 是 | **否** | `float_holding_item`、`flight`、`perch` |
| `entityServerOnly` | 是 | **否** | 是 | `friend`、`trigger_cooldowns` |

两个"否"各有理由：`float_holding_item` 里是**进行中的物品栏**，复制一份会在重生时凭空多出一组物品；`flight` 与 `perch` 描述的是此刻骑着什么、坐在什么上，重生后那具载具已经不在了。`friend` 与 `trigger_cooldowns` **不同步**是因为客户端没有它们的读者——好友名单的会话那一半在每次登录时会被清空，同步出去的副本从下次登录起就是旧的；触发规则的冷却也没有任何界面在画它。

**非实体的附件（区块与世界）只有 `serialize`，没有 `sync`。** 它们不是"发给某个客户端"的东西：区块灵气与灵植行是服务端权威，世界级索引（人工灵气区域、秘境登记、阵法索引、灵兽索引）本来就不该发给客户端。

## 实体附件

字段列是 codec 解出来的 JSON 键名（也就是存档形状），不是 Java 字段名。

| 附件 id | 装什么 | 作用 | 同步档位 |
| --- | --- | --- | --- |
| `mxt:cultivation` | `cultivation_progress`、`realm_stages`、`cultivation`、`cultivating`、`cultivate_started_at`、`next_cultivate_tick`、`cultivate_cooldowns` | 修为进度与当前境界（按**修炼档案**分键）、正在跑的法门与它的计时、各法门的冷却。进度与境界按档案存，所以"存在哪个档案"就是全部身份，不会再和数值本身重复一遍。 | 存档 + 同步 + 过世 |
| `mxt:minor_stages` | `minor_stage_records` | 身体在**每个境界上达到过的最高重数**。这份记录只增不减，所以突破之后"解锁过"仍然成立——尽管把它爬到那个高度的进度已经归零。 | 存档 + 同步 + 过世 |
| `mxt:lifespan` | `lifespan_remaining`、`lifespan_total` | 寿元台账：还剩多少、这一世最多被给过多少。两个数由**同一个**服务一起写，所以不会出现只更新了一半的账。 | 存档 + 同步 + 过世 |
| `mxt:spirit_identity` | `spirit_roots`、`physiques`、`disabled_spirit_roots`、`disabled_physiques` | 身上有哪些灵根与体质，以及哪些被**关掉**了。两个 `disabled_*` 集合指的是"仍然持有但被关闭"，所以**持有与生效是两个问题**：归属读 `spiritRoots()`，一切效果读 `activeSpiritRoots()`。 | 存档 + 同步 + 过世 |
| `mxt:technique` | `learned_techniques`、`technique_levels` | 学过哪些功法，以及每门爬到了哪一级。两者必须同一份：一门已经遗忘的功法，它的层数记录是**没有任何东西能读到**的状态，所以"交出一门功法"与"删掉它的层数记录"是同一次写入。 | 存档 + 同步 + 过世 |
| `mxt:soul_stats` | `karma`、`heart_demon`、`strength`、`sense_range` | 四个长期灵魂数值。**目前没有任何东西读它们**——只有转世会写（按"灵魂是否随转世保留"那个开关），所以这是给灵魂系统预留的存储，不是已生效的状态。 | 存档 + 同步 + 过世 |
| `mxt:soul` | `active`、`origin`、`created_at`、`manifestation` | 死亡转换之后保留的**可选灵魂形态**状态。与 `soul_stats` 是两回事：那个装数值，这个装"现在是不是魂体、从哪来"。 | 存档 + 同步 + 过世 |
| `mxt:creature_spirit` | `profile`、`intelligence`、`inner_core`、`profile_levels` | 灵宠自己的档案状态（它走的是 `creature_profile` 链，不是玩家的修炼链）。层数存在这里而不是共用的附件里，所以**同 id 的档案与功法各自一格、读不到对方**。 | 存档 + 同步 + 过世 |
| `mxt:resource_holder` | `values`、`audit`、`min_snapshot`、`max_snapshot`、`last_changed_tick` | 服务端权威的资源当前值与**已解析的上下限快照**。快照跟着附件一起同步，所以客户端**不需要**为了画一条资源条而去权威地求值一遍公式。 | 存档 + 同步 + 过世 |
| `mxt:element_attachment` | `amounts` | 身上每种元素攒了多少，一个元素一个数、不带任何规则。攒、读它触发的反应、每 tick 的衰减**三件事是分开的**，所以这个附件自己一条规则都没有。归零的键会被删掉，"没攒下东西"只有一种表示。 | 存档 + 同步 + 过世 |
| `mxt:ability_holder` | `sources`、`channelled_ability`、`storage` | 授予的技能**按来源记账**（所以撤掉一个来源不会连带撤掉别人的），以及每个已授予技能自己的运行期状态。撤销最后一个来源时会连状态一起丢掉，**冷却除外**——它继续跑，所以把物品再戴上不能白嫖一次按键。 | 存档 + 同步 + 过世 |
| `mxt:wheel_layout` | `layout`、`armed` | 轮盘那几个格子的排布，以及界面上没开轮盘时按键会花掉哪一格。`armed` 是一个**纯编号**、不记名字：那个格子里的条目没了，编号仍然找得回它。 | 存档 + 同步 + 过世 |
| `mxt:spirit_burst_cooldowns` | `cooldowns` | 灵气爆发的冷却。同步给客户端**只为了**在轮盘上画剩下的那一圈，与原版物品冷却的表现一致。 | 存档 + 同步 + 过世 |
| `mxt:curse_holder` | `instances`（内含 `stacks`、`applied_at`、`expires_at` 等） | 身上带着的诅咒实例，以及"谁让它活着"的**来源台账**——与技能授予用的是同一套台账，所以"撤掉一个来源不会撤掉别人的诅咒"在这里和在那里是同一句话。定义本身每次从诅咒注册表查，不存副本。 | 存档 + 同步 + 过世 |
| `mxt:tribulation` | `tribulation`、`timeline`、`cursor`、`state`、`windup` | 正在跑的这一场天劫：哪份定义接下了这次尝试、还剩多少前摇、整场的每一拍、以及**游标**站在哪一拍。游标是存下来的而不是算出来的，因为分支拍可以让这场往回走。 | 存档 + 同步 + 过世 |
| `mxt:contract` | `contract_type`、`bound_at`、`recalled`、`recall_at`、`behavior` | 一只生物自己的契约记录，而且是**唯一一份**（主人侧那份灵兽索引只是索引）。主人不在这里：谁拥有这只契约兽由生物自己的 `OwnableEntity` 回答，框架不另存主人。 | 存档 + 同步 + 过世 |
| `mxt:secret_realm_travel` | `realm`、`origin_dimension`、`origin_x/y/z`、`origin_yaw/pitch` | 玩家在临时秘境里时保留的**返回点**，出来时按它送回去。 | 存档 + 同步 + 过世 |
| `mxt:pill_toxicity` | `toxicity`、`decay_remainder` | 累积的丹毒。`decay_remainder` 是没走完的那个 20 tick 衰减周期，**它不是丹毒**，而且只在配了正的衰减速率时才推进。 | 存档 + 同步 + 过世 |
| `mxt:pill_usage` | `entries`（内含 `uses`、`cooldown_until`） | 每条丹药绑定各吃了几次、冷却到什么时候，**按绑定而不是按载体物品**分键。次数不会被死亡、换维度或登出清掉。 | 存档 + 同步 + 过世 |
| `mxt:float_holding_item` | `item` | 被服务端物品消费者**临时借走**的那一堆物品（例如灵气燃料处理中途）。 | 存档 + 同步，**不过世** |
| `mxt:flight` | `active`、`archetype`、`vehicle`、`vehicle_uuid`、`started_at`、`previous_flight`、`previous_flying`、`previous_flying_speed` | 御剑状态的存档：存的是飞行**属性值**而不是已废弃的 `mayfly` 标志（属性留着不还，玩家下剑之后就会一直飞），外加用来还原的那几个"之前的值"。 | 存档 + 同步，**不过世** |
| `mxt:perch` | `offset` | 肩上那只生物坐在载具的哪个位置。偏移是**已经解析好的**（"左肩右肩"这种名字属于写记录的那一层），y 从载具当前顶部往下量，所以载具换姿势变高变矮时它会跟着走。 | 存档 + 同步，**不过世** |
| `mxt:friend` | `permanent`、`temporary` | 这个玩家认哪些人是自己人。两份名单都是"存档但登录时清掉临时那一半"——**正因为存了盘**，一局里的临时好友才活得过一次死亡。匹配一律按 id，名字只为了离线时也读得出来。 | 存档，**不同步** |
| `mxt:trigger_cooldowns` | `cooldowns` | 这个持有者的每条触发规则下一次最早能在哪一 tick 触发，按规则自己的注册表 id 分键。 | 存档，**不同步** |

## 区块与世界附件

这六个的 scope 不是"实体"，而是被哪一级 `getData` 读出来的——登记本身不声明 scope，由调用方决定：

| 附件 id | 挂在哪 | 装什么 | 作用 |
| --- | --- | --- | --- |
| `mxt:aura_chunk` | **区块** | `template`、`block_aura_sections`、`aura` | 这一块的**权威灵气库存**，`aura` 与 `block_aura_sections` 一样按**子区块**分键：每个 16 格高的子区块各有自己的存量、上限与再生。每份里的每个值按自己的资源独立分键，**刻意没有**一个总的灵气池。 | 
| `mxt:herb_chunk` | **区块** | `plants`（每行一个打包坐标，含 `position`、`age`、`clock`） | 这块地里每一株灵植的行。药龄与"测到那个药龄的时刻"两个数**都要**：药龄不能只从时钟推出来（生长取决于这段区间从哪个药龄起步），存下来才让"读一次"是幂等的；负的时钟表示**自然生成、没人碰过**的植株，读第一次时才被变成真正的行。 |
| `mxt:aura_world` | **世界** | 人工灵气区域 | 数据包 / 脚本**手工加**的灵气区域。阵法造成的区域是实时推导的，**刻意不存**在这里。 |
| `mxt:formation_world` | **世界** | 按已验证的阵主坐标索引的活跃阵法 | 一个世界上正在运行的阵法索引。它装的是**活的** `FormationInstance`，所以从这里拿到一个实例的调用方是在**原地改**存档状态。 |
| `mxt:secret_realm_world` | **世界** | 已登记的秘境 | 存在**主世界**上，所以一个被占用的秘境能与它自己那个维度的 region 文件一起活过一次重启。 |
| `mxt:bound_beasts` | **世界（主世界）** | 已绑定灵兽的索引 | 服务端全服一份。**真正决定事情的是生物身上那份 `mxt:contract`**；这份列表存在只为了三件事：查上限、列清单、解除绑定时不必去遍历已加载的维度，以及主人离线时那只兽死了也能把这一行清掉。 |

`aura_chunk` 与 `herb_chunk` 都存成**行的列表而不是按打包坐标的 map**：`formation_world` 踩过这个坑——用打包坐标当键会让索引非空时**直接存档失败**。

## 脏标记与同步

实体附件能持续同步给客户端，靠的是一条独立的脏标记链路，而不是"每个 tick 都发一遍"：

1. 附件实现 `ChangeTrackable`，`markDirty()` 只置一个布尔，`checkDirty()` **读它就是清它**。
2. 每 tick 的 `EntityTickEvent.Post` 上，`MxtAttachments.flushDirtyAttachments` 遍历**所有已同步的实体附件**，对每个 `checkDirty()` 为真的调一次 `entity.syncData(附件类型)`。
3. 客户端侧不需要自己判断：它只是在收到包时替换掉自己那份附件。

**嵌在附件里的状态要由宿主把它"并上来"。** 有些附件内部还装着会自己变脏的东西（例如 `technique` 里的等级记录），它们**不持有附件引用**，所以脏标记不会自动往上冒。宿主的写法是覆写 `checkDirty()` 先把自己的内层读一遍：

```java
@Override
public boolean checkDirty() {
    if (this.techniqueLevels.checkDirty()) this.markDirty();
    return super.checkDirty();
}
```

这条"读它就是清它"的语义要求遍历顺序不能漏——漏掉一个内层就等着它永远不同步。非同步的那两个实体附件（`friend`、`trigger_cooldowns`）根本不在那张已同步列表里，所以它们的脏标记没人读。

## 为什么一个模块一份

附件的拆法：**一个模块一份附件**。判据是**这些字段属不属于同一件事**，而不是"有几个模块读它"：

- **各自有拥有者。** 修为进度属于修炼档案、灵宠层数属于灵宠档案，两者都放"进度"里就会让同 id 的档案与功法互相读到。
- **各自有生命周期。** 死亡时要清哪些，不同模块的答案不一样。
- **各有各的转世开关。** 见下。

所以 `resource_holder` 被二十多个模块读也**不拆**——它装的就是"这具身体的资源账"这一件事。反过来，过去一份 `spirit_stats` 同时装寿元、层数记录、灵魂数值与功法/灵根/体质，这四个分属四个模块、有四个独立的转世开关，于是拆成了 `lifespan` / `minor_stages` / `soul_stats` / `technique` / `spirit_identity`。

**拆开的实际收益**在转世那一处：`LifeSpanService.reincarnate` 按一组服务端开关逐个复位状态，拆开之后**一个开关只能够到它自己模块的那份附件**；拆之前任意一个开关都可能清掉别的模块的状态。开关有 `resetCultivation`、`clearMinorStages`、`cancelTribulation`、`clearResources`、`keepSpiritRoots`、`keepTechniques`、`keepSoul`，默认分别是开、开、开、关、保留、保留、保留。

**同属一件事的字段必须留在一起**，即使它被别的模块读：`technique` 把"学过哪些"和"每门几级"放在同一份附件里，因为"遗忘一门功法"与"删掉它的层数"必须是同一次写入——分开就迟早会出现一份没有任何东西能读到的孤儿记录。

## 相关阅读

- [数据组件](/technical/data-components)：同一个"状态放哪"问题的另一侧——挂在物品堆上的那些。
- [数据加载](/technical/data-loading)：附件的持久化与网络 codec 在哪里登记，以及**附件不在 `/reload` 范围内**意味着什么。
- [Java API](/java/api)：读附件的服务入口与 `getExistingData` / `getData` 的区别。
