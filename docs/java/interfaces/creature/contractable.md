---
title: Contractable
---

# Contractable

让生物**能被契约**的资格接口。**实现它就是全部资格**——数据包无法把一个实体变成契约对象，所以原版生物默认都签不了；"不是所有生物均可契约"就是这条的落地。它同时继承原版的 `OwnableEntity`，所以"谁是主人"整个交给**原版的 owner 逻辑**：`getOwner()` 由 `EntityReference` 经所在维度解析，`getRootOwner()` 白拿。

| 成员 | 说明 |
| --- | --- |
| `void setContractOwner(LivingEntity owner)` | 签订时由框架调用；生物把主人写进**它自己存主人的地方**。 |
| `boolean acceptsContract(ContractContext context)` | 这份契约类型它签不签。默认读**该契约类型自己的实体类型标签** `#<命名空间>:contract/<路径>`，标签不存在或写成空即不限制，见 [contract_type](/datapack/json/contract_type)。 |
| `void onContractBound(ContractContext context)` | 主人写好之后。 |
| `void onContractReleased(ContractContext context)` | 主人或管理员解除了契约，生物还活着。 |
| `void onContractDeath(ContractContext context)` | 生物死亡，契约随之结束。 |

**主人没有第二份**：本体不存主人，`mxt:contract` 附件里也没有这个字段——`getOwnerReference()` 与 `setContractOwner` 都由实体自己实现。原版驯服动物用 `TamableAnimal` 已有的那一对，其它生物自己存一个 `EntityReference<LivingEntity>`（记得跟着自己的存档与同步数据走）。框架侧只有一个读点（`Contracts.ownerOf` / `Contracts.owner`），问的永远是实体。

**解除契约只清契约记录**：要不要连主人一起忘掉由生物自己在 `onContractReleased` 里决定——"解约"与"忘掉谁驯服了它"不是同一件事。两个结束钩子是分开的，谁也不替谁猜。

契约的其余部分不在接口里：契约类型、签订时刻、召回闩只有一份，在生物的 `mxt:contract` 附件上。契约之后"这只灵兽自己怎么做"是另一个接口，见 [ContractOperations](./contract-operations.md)。
