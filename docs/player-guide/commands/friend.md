---
title: /friend
---

# `/friend`

| 命令 | 作用 |
| --- | --- |
| `/friend`（= `/mxt friend`） | 输出好友指令帮助，每一行可点击把指令填入聊天栏（不发送）。 |
| `/friend list`（= `/mxt friend list`） | 列出永久与临时好友名单，名单中的名字可点击填入移除指令。 |
| `/friend add <player>`（= `/mxt friend add`） | 添加**临时**好友，重登后失效。 |
| `/friend remove <player>`（= `/mxt friend remove`） | 移除临时好友；对永久好友会拒绝并提示改用下一条。 |
| `/friend permanent add <player>`（= `/mxt friend permanent add`） | 添加**永久**好友，写入存档；临时好友会被升级。 |
| `/friend permanent remove <player>`（= `/mxt friend permanent remove`） | 移除永久好友。 |

## 好友名单

好友名单的"临时"指的是**下次登录时会被清空**：重登与服务器重启都会清掉它，**重生不会**。添加和移除都按玩家档案解析，对方离线也能操作，因此要加一个离线玩家直接写名字即可。细节见[敌我识别系统](/technical/identification)。
