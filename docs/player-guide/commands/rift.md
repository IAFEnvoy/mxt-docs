---
title: /rift
---

# `/rift`

裂隙是以 UUID 管理的平面多边形传送门。整棵子树需要 2 级 OP；也可以写成 `/mxt rift …`。

<div class="cmd-tree">

- `/rift ...`

  - `... spawn <preset> <origin> <facing> (position <dimension> <destination> | secret_realm <definition> | return)`

    按预设 `mxt:rift` 的轮廓与外观，在 `origin` 立刻建一扇门，朝向 `facing`，并直接给出目的地。

  - `... target <id> (position <dimension> <destination> | secret_realm <definition> | return)`

    只换这扇门的目的地，不打开编辑器。

  - `... edit`

    打开编辑器做一份新草稿（默认禁用，提交后才发布）。

  - `... edit <id>`

    打开编辑器改这一扇门，等同于对准门面使用编辑物品。

  - `... info`

    列出当前维度的全部门。

  - `... info <id>`

    读这一扇门。

  - `... remove <id>`

    删除这扇门。

  - `... duration <id> <ticks>`

    重设这扇门的剩余时长（刻），重设即重新计时；`0` 表示永久保留。

  - `... enabled <id> <true|false>`

    启用或停用这扇门。

  - `... copy <id> <origin>`

    把这一扇门复制到 `origin`，副本拿到新的 UUID。

  - `... transform <id> move <offset>`

    整体平移轮廓。

  - `... transform <id> rotate <角度>`

    旋转轮廓，取值 `-360`–`360`。

  - `... transform <id> scale <倍率>`

    缩放轮廓，取值 `0.001`–`100`。

  - `... transform <id> mirror`

    镜像轮廓。

  - `... export <id> preset`

    把这一扇门导出成 `rift` 预设 JSON，直接发到聊天栏。

  - `... export <id> layout`

    导出成 `secret_realm.portals` 的布局 JSON，直接发到聊天栏。

</div>

`<facing>` 取 `north` / `south` / `east` / `west` / `up` / `down`，它决定门面法线，所以建门时必须写。

`<id>` 补全只列**当前维度里还没过期**的门；写一个不存在的 UUID 报「找不到这扇门」。

## 目的地

`<destination>` 三选一：

- `position <dimension> <destination>`——指定维度与坐标，落点检查与铺平台照常；
- `secret_realm <definition>`——指向一份秘境定义，第一次成功进入后绑定实例；
- `return`——使用进入秘境时记下的来源，不在秘境旅行中的实体不能用。

与编辑器里那三种目的地是同一套规则，传送判定、冷却、`nearby` 搜索与泥土平台见[裂隙](../rift.md#目的地与传送)。

## info 打什么

每扇门一行：UUID、修订号、顶点数、目的地类型、剩余刻数与是否启用。`info` 不带 `<id>` 时列当前维度的全部门。

## 导出

`export` 只把 JSON 打进聊天栏，不写文件；要落到磁盘用编辑器的「保存文件」，写在游戏目录下的 `exports/mxt/rifts/`，同名不覆盖。两种格式分别对应 [rift 定义](../../datapack/json/rift.md)与 [secret_realm.portals](../../datapack/json/secret_realm.md)。

## 与编辑器、秘境令牌的关系

命令只做"建门、改目的地、改时长、开关、复制、变换、导出"这些能一次说清的事；拉轮廓、画形状、世界预览这类操作在编辑器里做（见[裂隙](../rift.md#创建与编辑)）。秘境令牌召门走的是另一条路：令牌只召门，接触门面才传送，见[令牌](../rift.md#秘境令牌)。
