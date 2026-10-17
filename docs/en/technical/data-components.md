---
title: Data Components
description: Every item data component the mod registers - what it holds, who writes it, who reads it, and which ones override datapack declarations.
---

# Data Components

Every piece of state the mod hangs on an item stack goes through a vanilla **data component** (`DataComponentType`). There is no "mod-specific NBT on the item" anywhere. All 35 are registered in one place, `registry.MxtDataComponents`, and each declares both a **persistent codec** and a **network codec** (`persistent(...).networkSynchronized(...)`) - so they all save with the world and all sync to the client. There is no server-only component and no session-only component.

A component is **this stack's own fact**: it was forged, it has a talisman inscribed on it, it holds this much aura. The other half is the **datapack declaration** ("what this kind of item usually is"). Which way they merge is fixed in [Data Loading](/en/technical/data-loading).

## At a Glance

The **Payload** column is the Java shape the codec decodes into, not JSON key names - the field-level JSON goes on each definition's own page. `Holder<X>` means a **registry reference** (follows the pack); `Identifier` means a **bare id** (existence is not checked).

### Quality and Elements

| Component id | Payload | What it does |
| --- | --- | --- |
| `mxt:quality` | `Holder<ItemQuality>` | **The only component in the whole mod that holds a tier**, and layer one of quality resolution. It holds a **whole quality object**, so it decides the tier *and* which ladder this stack reads: writing it means "this stack is this tier". `/quality set`, a successful upgrade, a Forge Table settlement and a talisman inscription all write it; `/quality clear` removes it and the stack falls back to the tier its carried definition declares. |
| `mxt:element` | `List<Either<Holder<Element>, TagKey<Element>>>` | Elements this stack carries **in addition to** the definition's, unioned. Either a concrete element or an element tag. |

### Forging

| Component id | Payload | What it does |
| --- | --- | --- |
| `mxt:forging_result` | `ForgingResultComponent` (`blueprint`, `final_value`, `actual_steps`, `optimal_steps`, `extra_steps`) | What a **successful** forging session did: which blueprint, the final value, the steps actually taken and the shortest solution. The constructor requires `actual_steps - optimal_steps == extra_steps`. It holds **no tier** - the tier the session settled on goes to `mxt:quality`, so `/quality clear` takes that with it. |
| `mxt:forging_methods` | `List<Holder<ForgingMethod>>` | Methods this stack can run **when used as a tool**. Decoded tolerantly (a bad entry is logged and dropped), unioned with the definition's. |
| `mxt:forging_blueprints` | `List<Holder<ForgingBlueprint>>` | Blueprints this stack carries, unioned with the definition's; a tolerantly decoded list as well. |

### Pills

| Component id | Payload | What it does |
| --- | --- | --- |
| `mxt:pill` | `PillComponent` (optional `pill`, `on_consume`, `toxicity_gain`, `toxicity_threshold`, `on_overdose`, `toxicity_after_overdose`) | A stack of pills **declaring its own identity and effect**. The `pill` written here names a pill definition and **wins over** the one the `pill_binding` matched; the five effect keys then override field by field. **Use count and cooldown are not here** - they still belong to the matched binding only. |

### Techniques

| Component id | Payload | What it does |
| --- | --- | --- |
| `mxt:technique` | `Holder<Technique>` | Which technique this stack **teaches**. With it, the `technique_binding` is no longer picked by matcher at all: the declaration whose `technique` equals this one is named instead. |
| `mxt:technique_reading` | `TechniqueReadingComponent` (optional `learn_time`, `hold_animation`, `hold_sound`) | How this stack **is read**, overriding what the technique writes for those three fields. Which technique it teaches is not here - that is `mxt:technique`. |
| `mxt:stored_text` | `Component` (a bare string is a translation key, an object is a full component) | The text a jade slip carries, printed into the chat log whole when it is read; a slip without it says it has nothing written. |
| `mxt:jade_slip_reading` | `int` (ticks, `0` and up) | How long reading a jade slip takes: the content appears once the hold has run that many ticks. Absent is `40` (two seconds); `0` reads it on the click, and so does a sneaking right-click. |

### Aura and Artifacts

| Component id | Payload | What it does |
| --- | --- | --- |
| `mxt:item_aura` | `double remain` | The aura left on one **partially consumed** stack, as a single number. |
| `mxt:spirit_storage` | `Object2DoubleMap<Holder<Aura>>` | The aura store on a stack implementing `ItemAuraAccess`: which auras and how much of each. The key is the **aura itself**, never the `resource` it is counted in - a plain counter carries no aura and has no business here. Amounts are doubles, so an artifact's fuel can be bought a fraction a tick while a talisman is still filled one whole unit at a time. A **missing component** means whatever the item says (pristine stone is full, an untouched carrier is empty); an **empty map** is a third thing, a store that was drained. |
| `mxt:artifact_state` | `ArtifactStateComponent` (optional `owner_uuid`, `owner_name`, `nourishment`) | An artifact's owner and how well it has been fed. The **identity** is the UUID (every ownership question asks it); the name is display only, written once by whoever claimed the stack. Which artifact it is comes from the item's definition and how much aura it holds lives in `mxt:spirit_storage` - neither is repeated here. |
| `mxt:item_abilities` | `ItemAbilitiesComponent` (`abilities`) | Ability IDs granted **in addition to** the definition's while the stack is equipped or otherwise active, unioned. The `mxt:add_ability` action is its dedicated producer (an entry already present is not written twice, and existing entries are always kept). |
| `mxt:storage` | `DataStorageHolder` | The host for ability runtime state (cooldown, charges, toggle, timer, target lock). One `(ability id, state kind)` address is exactly one slot, so a second value of a kind already there **replaces** it instead of joining it. Values are mutable and written wholesale by the content side or the item host. |

### Curses

| Component id | Payload | What it does |
| --- | --- | --- |
| `mxt:curse_container` | `CurseContainerComponent` (`curses`, each an `mxt:apply_curse` entry) | The curses an item carries: applied to its holder while equipped, and removing it takes off **the ones it owns**. The entries *are* `mxt:apply_curse` actions, so a stack cannot declare anything that action could not do, and the item never touches the holder's state directly. |

### Contracts and Spirit Beasts

| Component id | Payload | What it does |
| --- | --- | --- |
| `mxt:contract_scroll` | `ContractScrollComponent` (optional `contract_type`) | Which contract definition a reusable contract scroll **points at**. |
| `mxt:contract_bell` | `ContractBellComponent` (`beast`, `name`, `behaviors`) | The beast a taming bell is tuned to and the orders it takes. The choice lives on the tool because two bells may name two different beasts; the order list is a **snapshot** taken when the beast was picked, which is exactly what lets the owner's wheel draw the page without resolving the creature on the client. |
| `mxt:spirit_beast` | `SpiritBeastComponent` (`entity_type`, `entity`, `name`, `contract_type`, `owner`, `owner_name`) | The **one** creature a spirit beast bag holds: its saved data, the entity type it has to be rebuilt from, and the contract it was under. The type is stored *beside* the data rather than inside it, so the saved data keeps exactly what the creature wrote. Name, contract type and owner are snapshots, because a tooltip is drawn where nothing may be decoded or looked up. |

### Formations

| Component id | Payload | What it does |
| --- | --- | --- |
| `mxt:formation_plate` | `FormationPlateComponent` (`allowed`, optional `formation`) | What a portable formation controller **is allowed to run**, and **which** formation this copy runs. The allow list is the same on every copy and the selection must be a member of it; an empty list means unrestricted unless a server config entry turns it into "nothing". |

### Secret Realms, Tokens and Identification

| Component id | Payload | What it does |
| --- | --- | --- |
| `mxt:secret_realm_token` | `SecretRealmTokenComponent` (optional `realm`) | Which secret realm an access token opens, named by the datapack. |
| `mxt:reward_box` | `ResourceKey<LootTable>` | Which loot table a reward box opens. It stores a **`ResourceKey`, not a `Holder`**: `/reload` swaps loot table instances, so a held one would keep rolling the table from before the reload. |
| `mxt:token` | `TokenComponent` (optional `kind`, `value`, `owner`) | The **identity and permission** payload shared by realm and trading tokens. `owner` is a permission record and deliberately stays out of the tooltip. |
| `mxt:identification` | `IdentificationComponent` (`result`) | The resolved item id a framework-provided unidentified item turns into once identified. |

### Economy

| Component id | Payload | What it does |
| --- | --- | --- |
| `mxt:cheque` | `ChequeComponent` (`value`, `issuer`) | The value recorded on a cheque, independent of any particular currency item. |

### Resource Containers

| Component id | Payload | What it does |
| --- | --- | --- |
| `mxt:resource_container` | `ResourceContainerComponent` (`values`) | What this item's **vessel** currently holds and how much of each. It is a vessel rather than a battery: it holds whatever the holder's own pool holds, fractions included, and pours them back into that pool while held down. |
| `mxt:resource_capacity` | `ResourceCapacityComponent` (`values`) | How much of each resource the vessel **can hold**, written by whoever hands the container out. **A resource with no entry here has no room at all** - a resource has no natural maximum of its own, so the number has to be written somewhere. |

### Talismans and the Brush

| Component id | Payload | What it does |
| --- | --- | --- |
| `mxt:talisman` | `TalismanComponent` (`talismans`, `mode`) | The talismans **inscribed on one carrier**, in append order (so one carrier can hold several); an empty list is a blank carrier. `mode` is `fire` (default) or `store` and lives **on the stack, not on any definition**, so the same inscriptions behave differently on different carriers. Its tooltip is drawn separately by `TalismanTooltipAppender` so those lines sit above the carrier's charge line. |
| `mxt:brush_pigment` | `int` (0 to a cap) | The talisman brush's own **pigment store**, a non-negative integer where **1 unit is 1 pixel of arc length**. Not writing the component and writing `0` are the same thing. It is not a cost entry: refilling is the vanilla bundle's click, and the judgement and conversion live in exactly one place, `runtime.talisman.BrushPigmentService`. |

### Herbs, Furnaces and Spirit Roots

| Component id | Payload | What it does |
| --- | --- | --- |
| `mxt:herb_age` | `int` (0 to a cap) | The **age** of a spirit herb fruit. Breaking a mature plant stamps the grown years, floored, onto every drop here, and **at that same moment** looks that age up in the herb's own `quality_by_age` ladder, writing the tier it hits to `mxt:quality`. It is also an **input to the potency formulas** (the `herb_age` variable) rather than a second multiplier - a pack that wants older herbs to be stronger reads it there. |
| `mxt:alchemy_furnace` | `Holder<AlchemyFurnaceDefinition>` | Which **furnace specification** this furnace core was built to. One specification is shared by the one block item, which cannot say which tier applies, so the tier is read from this reference too. |
| `mxt:alchemy_wall_material` | `Holder<AlchemyWallMaterial>` | Which **wall material** this block is, that is, its temperature rating. The furnace ceiling is the **lowest** of the 18 wall cells. |
| `mxt:spirit_root` | `Holder<SpiritRoot>` | Which spirit root definition this item (usually a spirit root stone) carries. |
| `mxt:physique` | `Holder<Physique>` | Which physique definition this item (usually a physique stone or scroll) carries. |

### Rifts

| Component id | Payload | What it does |
| --- | --- | --- |
| `mxt:rift` | `RiftComponent` (`target`, `color`) | The destination and colour an anchor stamps into a rift. Carrying it on the item is what lets a rift be configured before it exists: one stack describes the rift it will place, and reconfigures a rift it is used on. |

## Three Kinds of "Who Decides"

Read together, the table above collapses into three sentences:

- **Only `mxt:quality` holds a tier.** No other component carries quality, and `mxt:forging_result` only records the forging session.
- **`mxt:pill` / `mxt:technique` / `mxt:technique_reading` take part in "which declaration applies".** The first two can name or pick out a declaration; the third overrides a layer of parameters on top. Those three are the entire contents of the "components override declarations" table in [Data Loading](/en/technical/data-loading).
- **Everything else only holds state.** They never affect which declaration applies; they only answer "what is this stack right now".

## Components Are Not Cost Entries

Two things that are easy to conflate:

- **Brush pigment is not a `Cost`.** The "a carrier's own store" shape has exactly two instances - aura poured into a talisman carrier (`mxt:spirit_storage`) and the brush's pigment (`mxt:brush_pigment`) - and both are paid by **the tool being used** rather than by a player. Forcing them into `Cost` would mean inventing a payer out of thin air.
- **Currency is not a cost.** The value on a cheque and a `currency` definition's rates are prices and values, and never enter `Cost`.

## Two Traps When Writing Components

- **Use `ItemStack.OPTIONAL_CODEC` for empty stacks in a list.** Components are saved and synced, and one empty stack in a list makes the **whole packet fail to encode**. Every list in this mod that uses an empty stack as a placeholder goes through that codec.
- **`mxt:rift`'s `color` of `-1` means "follow the target dimension"**, not "no colour".

## See Also

- [Data Loading](/en/technical/data-loading) - where the persistent and network codecs are registered, the order components and declarations merge in, and the three layers of quality resolution.
- [Attachments](/en/technical/attachments) - the other half of the "where does state live" question: the things that hang on an entity, a chunk or a level.
- [Java API](/en/java/api) - the service entry points that read components, such as `QualityService`.
- [Generic Items](/en/player-guide/items) - which built-in items carry which components, with `give` examples to copy.
