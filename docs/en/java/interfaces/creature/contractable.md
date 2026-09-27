---
title: Contractable
---

# Contractable

The eligibility interface that lets a creature **be contracted**. **Implementing it is the whole of eligibility** - no datapack can turn an entity type into a contract subject, so vanilla creatures can never be contracted, which is what "not every creature may be contracted" means in practice. It is also a vanilla `OwnableEntity`, so **who owns it is answered by the vanilla owner logic**: `getOwner()` resolves the `EntityReference` through the level, and `getRootOwner()` comes for free.

| Member | Description |
| --- | --- |
| `void setContractOwner(LivingEntity owner)` | Called by the framework when a contract is signed; the creature writes the owner **wherever its own class keeps owners**. |
| `boolean acceptsContract(ContractContext context)` | Whether it signs a given contract type. By default it reads **that contract type's own entity type tag**, `#<namespace>:contract/<path>`, where a tag that is absent or written empty places no restriction - see [contract_type](/en/datapack/json/contract_type). |
| `void onContractBound(ContractContext context)` | Called once the owner is written. |
| `void onContractReleased(ContractContext context)` | The owner or an operator released the creature while it lives. |
| `void onContractDeath(ContractContext context)` | The creature died and the contract went with it. |

**There is no second copy of the owner**: the framework stores none, and the `mxt:contract` attachment has no such field - `getOwnerReference()` and `setContractOwner` are both the creature's own implementation. A tamed animal uses the pair `TamableAnimal` already has; anything else keeps an `EntityReference<LivingEntity>` of its own (and saves and syncs it alongside its other data). The framework has exactly one reading point (`Contracts.ownerOf` / `Contracts.owner`), and it always asks the creature.

**Releasing a contract clears the contract record only**: whether the owner is forgotten as well is the creature's own call inside `onContractReleased` - ending a contract and forgetting who tamed you are not the same act. The two endings are separate hooks, so neither has to guess which one happened.

The rest of the contract is not part of the interface: the contract type, the signing moment and the recall latch have exactly one copy, on the creature's `mxt:contract` attachment. What the creature does on its own afterwards is a second interface, see [ContractOperations](./contract-operations.md).
