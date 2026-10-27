---
title: 基本信息与安装
description: 在 NeoForge 客户端与服务端运行 MiXianTu 的环境要求、必需前置与可选兼容模组。
---

# 基本信息与安装

MiXianTu 是 NeoForge 模组，安装方式与其他模组相同：先准备与所需 Minecraft 版本匹配的 NeoForge 安装，再把 MiXianTu 本体 Jar 及其必需前置放进客户端与服务端的 `mods` 文件夹。

## 环境要求

| 项目 | 要求 |
| --- | --- |
| Minecraft | `26.1.2` |
| NeoForge | `26.1.2.99` 或更高 |
| 运行侧 | 客户端与服务端（`BOTH`） |

## 必需前置

Jupiter 与 ApricityUI 是必需前置，且**没有**打进模组 Jar，需要一起单独安装；其余必需前置都通过 Jar-in-Jar 打包，无需手动下载。

| 前置 | 下载地址 |
| --- | --- |
| Jupiter | https://www.curseforge.com/minecraft/mc-mods/jupiter |
| ApricityUI | https://www.curseforge.com/minecraft/mc-mods/apricityui |

## 可选兼容

| 模组 | 作用 |
| --- | --- |
| KubeJS | 仅在你想用脚本注册内容时需要，见 [KubeJS](./kubejs/index.md) |
| JEI | 配方查看集成：显示灵气有序合成与灵气无序合成及其灵气消耗 |
| Jade | 方块信息集成：方块灵气、灵气工作台的灵气、展示架中储存的灵力、灵植的药龄与成熟状态，以及供热方块的最高炉温与升温速度 |

## 配置

所有配置都在**游戏内的配置界面**里修改：打开**模组列表 → MiXianTu → 配置**。

::: warning

不需要、也不建议手改 `config/` 下的文件。

:::

| 部分 | 权限 | 包含的标签页 |
| --- | --- | --- |
| 客户端设置 | 无（只影响本机） | 轮盘选择、资源条、人物信息面板、功法、裂隙、提示框 |
| 服务端配置 | **OP** | 饰品栏、修炼、寿元、转世、符箓、灵气、阵法、命令别名、兼容 |

本文档提到配置时一律写作**服务端配置「标签页 → 条目」**或**客户端配置「标签页 → 条目」**，按这个名字在界面的对应标签页里找即可。
