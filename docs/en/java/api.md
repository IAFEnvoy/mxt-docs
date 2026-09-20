---
title: Public API
description: "The runtime services a Java addon calls into: aura and resource resolution, cultivation, abilities, damage, formations and data definition naming."
---

# Public API

These are the runtime services a Java addon calls into once it has a data definition in hand. They read the same registries the datapack does, so an addon and a datapack resolve the same way.

| API | Purpose |
|-----|---------|
| `MxtDatapackRegistries` | Queries native datapack registries, holders, disabled tags and client-synchronised data. |
| `AuraService` | Queries the final aura at a position, its environment sources, the aura pools separated by resource and area overrides; a resource may carry element markers. |
| `ResourceService` | Initialises, reads and modifies resources, and performs maximum and regeneration calculations. |
| `CultivationService` | Cultivation, resource conversion, realm breakthrough and realm assignment. |
| `AbilityService` | Server-side ability execution, costs, cooldowns, cancellation and actions. |
| `DamageCalculationService` | The one path every hit this mod deals takes: `outgoing(...)` shapes it on the attacker's side, `incoming(...)` is what the target's own relations make of it, `deal(...)` shapes a hit and applies it, and `source(...)` is the one place a damage source with an attacker is built. Call `deal` instead of `hurtServer` when a new system deals damage, so the hit inherits attribution, element relations and mastery. See the [damage system](../technical/damage.md). |
| `FriendService` / `FriendEvent` | Decides whether one entity treats another as its own. `FriendEvent.Relation` answers with the vanilla `TriState`, so another mod can give its own verdict; the judge is named by a **UUID plus an optional entity**, so a source that keeps its data in a server manager (a team, a faction) can still answer while the player is offline. `DEFAULT` hands the question to the **built-in friend system**, which posts no further event; when the judge is offline that system reads `FriendCache`, the in-memory mirror both ends of the session refresh. See [Foe Identification](../technical/identification.md). |
| `FormationActionType` / `MxtFormationActionTypes` | A formation's **functional modules**: `formation.actions` selects one with `type`, and each module's own fields live on its own record. Adding one is a record plus one `DeferredRegister` registration; the runtime dispatches on the record type, so the `data` package never touches the world. |
| `FormationProtection` | Queries whether an action is stopped by a formation's protection module: it applies when **either** the actor or the target is inside the radius. When `delegate_to_claims` is set and claim protection is currently in force (`FtbChunksCompat.claimsProtect()`, constrained by **Server Config → Compatibility → Delegate Needs Claims**), the whole decision is handed to the claim plugin, so it then always answers "not prevented". It takes the actor's UUID rather than a `ServerPlayer`, so another mod that hooks its own event can reuse the same judgement, including the owner's unconditional exemption and the friend exemption controlled by config. |
| `CurrencyValueService` | Computes an item's currency value and handles the reason it is unavailable. |
| `ItemMatcher` | The item matching syntax of a data definition: `ItemMatcher.Entry` has five kinds — `item`, `tag`, `wildcard`, `regex` and `spirit_storage` — and supports the single-entry shorthand (an item id or a tag) next to mixed arrays; `find`/`findAll` take the first/all of them in ascending `priority`. |
| `NumberProvider` | Constants, expressions, registry type dispatch and finite value handling. |
| `DefinitionText` | Turns a datapack definition into a name: with a `Holder` or a `ResourceKey` in hand, call `name(holder)` directly, and the category defaults to the registry's own path (`mxt:fire` in `mxt:aura` looks up `aura.mxt.fire`). The few that are not translated under the registry path are declared once in its internal `CATEGORIES` (such as `mxt:item_quality` → `quality`), so one definition can never have two names in a tooltip and in the item picker. |

::: warning

Unless an interface is explicitly marked as a client API, do not call server lifecycle registry queries from the render thread.

:::
