---
title: CaptureListener
---

# CaptureListener

**被捕捉与释放的通知接口**。捕捉**不是实体的资格**——任何生物都可能被捕捉，**怎么捕捉由物品决定**（能装什么、要不要契约、代价多少，全是那个物品自己的规则；灵兽袋自己的规则是"你自己的已契约灵兽、一次一只"）。所以这里只剩两个可选钩子：

| 成员 | 说明 |
| --- | --- |
| `void onCaptured(@Nullable Player captor)` | 被收走之后、实体离开世界之前。 |
| `void onReleased(@Nullable Player captor)` | 重新回到世界之后。 |

两个都有默认空实现：**不实现它也照样能被捕捉**，只是收不到这两次通知；`captor` 在不是玩家动手时为空。

捕捉本身的状态不在这个接口里：妖宠记在物品自己的组件上，接口只负责"告诉这只生物"。契约资格见 [Contractable](./contractable.md)。
