---
title: Public API
description: "The runtime entry points another mod can call directly: reading datapack registries, definition display names, the item catalogue and creative tabs, aura and resources, cultivation and breakthrough, abilities, damage, formations, foe identification and currency."
---

# Public API

This page lists the **entry points another mod can call directly**. What a datapack can express (definitions, conditions, actions, costs) needs no Java; the things here are only for when you want to ask in code "how much aura is at this position", "cast this ability on its behalf" or "does this item count as this definition".

Three things up front:

- **These entry points stay in their own module packages** (`registry`, `util`, `runtime/*`, `data`); only the interfaces you are meant to **implement** live in `com.iafenvoy.mxt.api`, see [Interfaces](interfaces/index.md).
- **The server is authoritative**: costs, cultivation, abilities, damage and formation settlement all happen on the server only; the client only renders and sends requests. Which entry points go dead on the client are collected in [The Server and Client Boundary](#boundary).
- To learn **why** a given line looks the way it does (rather than "which methods exist"), see the technical pages: [Aura Calculation](../technical/aura.md), [Damage System](../technical/damage.md), [Foe Identification](../technical/identification.md).

## Finding an entry point by what you want to do {#pick}

| What you want to do | Entry point | Where |
| --- | --- | --- |
| Read a definition out of a datapack registry | [`MxtDatapackRegistries`](#mxtdatapackregistries) | `registry` |
| Turn a definition into a display name | [`DefinitionText`](#definitiontext) | `util` |
| Assemble one tooltip line of numbers | [`TooltipText`](#tooltiptext) | `util` |
| Evaluate a datapack number | [`NumberProvider`](#numberprovider) | `util.formula` |
| Ask "does this item count as this definition" | [`ItemMatcher`](#itemmatcher) | `util.matcher` |
| Turn a registry's definitions into creative tab items | [`CreativeTabHelper`](#creativetabhelper) | `data` |
| Ask how much aura a position has | [`AuraService`](#auraservice) | `runtime.world` |
| Read or write one value on an entity | [`ResourceService`](#resourceservice) | `runtime.resource` |
| Add cultivation progress, break through, set a realm | [`CultivationService`](#cultivationservice) | `runtime.cultivation` |
| Read or write a body's lifespan, have it reborn | [`LifeSpanService`](#lifespanservice) | `runtime.cultivation` |
| Execute an ability, accept one key press | [`AbilityService`](#abilityservice) | `runtime.ability` |
| Deal a hit yourself | [`DamageCalculationService`](#damagecalculationservice) | `runtime.damage` |
| Add a kind of functional module to a formation | [`FormationActionType`](#formationactiontype) | `data.formation` |
| Ask "will a formation stop this" | [`FormationProtection`](#formationprotection) | `runtime.formation` |
| Ask "does it count as one of mine" | [`FriendService`](#friendservice) | `runtime.friend` |
| Compute an item's currency value | [`CurrencyValueService`](#currencyvalueservice) | `runtime.economy` |
| Preview a batch, light a furnace, abort a batch | [`AlchemyWorkstationService`](#alchemyworkstationservice) | `runtime.alchemy` |

## Reading data definitions {#definitions}

### `MxtDatapackRegistries` {#mxtdatapackregistries}

Package `com.iafenvoy.mxt.registry`. The declarations of the 39 native datapack registries and their uniform read entry point; `/reload` rebuilding and client synchronisation are both left to the vanilla registry system, and this class **holds no snapshot**.

Reading a value by id / holder (it reads the **server** registry):

| Method | Purpose | Notes |
| --- | --- | --- |
| `get(ResourceKey<? extends Registry<T>> key, Identifier id)` | Gets the definition value by id | A missing entry gives `Optional.empty()` |
| `holder(key, Identifier id)` | Gets a holder by id | Reads the **server** registry |
| `holders(key)` | Iterates every holder of the whole registry | |

Explicitly passing a registry accessor (**use these on the client**):

| Method | Purpose | Notes |
| --- | --- | --- |
| `holder(HolderLookup.Provider access, key, Identifier id)` | The **only correct entry point** for getting a holder by id on the client | Does not touch `ServerLifecycleHooks` |
| `holders(Provider access, key)` / `holders(RegistryAccess access, key)` | Iterates the whole registry | |
| `get(Provider access, key, Identifier id)` | Gets a value | Same as above |

**This layer filters nothing.** Whether an entry is in the registry is the whole answer, and switching a definition off is load-time work (`neoforge:conditions`, see [Disabling a Definition](../datapack/overview.md#disabling-a-definition)): an entry a condition blocks is simply not in the registry. So a holder you read is a holder you may act on, and there is no such state as "I read a definition that was switched off".

Tags:

| Method | Purpose | Notes |
| --- | --- | --- |
| `isTagged(key, Identifier id, Identifier tagId)` / `isTagged(key, Holder<T> holder, Identifier tagId)` | Whether it is in a tag | A missing entry returns `false` |

Lenient lookup and size:

| Method | Purpose | Notes |
| --- | --- | --- |
| `holderOrEmpty(key, Identifier id)` | The same as `holder(key, id)`, but **gives empty instead of throwing when no server is running** | For readers that also run on the client (for example `CurseService.definitionState`) |
| `registry(key)` | Gets the vanilla `Registry<T>` itself | Throws `IllegalStateException` when no server is running |
| `size(key)` | The number of entries in that registry | The same server assertion as `registry(...)` |
| `registries()` | Every registry key this class has registered | |

Key points:

- The class **caches no registry instance**. To cache, key by **registry instance** (`/reload` does not replace the instance, only a world load does), see `DamageElements`.
- A `Holder` an attachment still stores while the current pack no longer provides it (the entry is blocked by `neoforge:conditions`, or its file was deleted) **does not disappear on its own between two world loads**: attachments are decoded while the world loads, a reference whose definition cannot be found at that moment is dropped by the tolerant list codec (entering the world again clears it), and `/reload` does not decode attachments again, so the old reference is still there for the rest of the session. To ask "is it still there", look the id up in the registry yourself (`Elements.of`, `activeSpiritRoots` and `SecretRealmService.enter` all do), rather than taking a holder you hold for proof that it still exists.
- `newDatapackRegistries(NewRegistry)` is called by the startup event and is **not for business code**; the registries and codecs are registered in `MxtResourceKeys`.

### `DefinitionText` {#definitiontext}

Package `com.iafenvoy.mxt.util`. Turns a definition into a display name; the key is `<category>.<registry namespace>.<definition namespace>.<path>`, where `category` is the registry id's path.

| Method | Purpose | Notes |
| --- | --- | --- |
| `name(Holder<?> holder, String category)` | Gets the display name | **The entry point recommended inside the mod**: when the definition implements `NamedDefinition` its own `name` is read first, otherwise the key is derived from the holder's key |
| `name(Holder<?> holder)` / `name(ResourceKey<?> key)` | Same as above | category is derived from the registry / the key is used directly |
| `name(Identifier id, String category)` | For when all you have is a bare id | **Hard-assumes the `mxt` namespace**; do not use this overload for a non-`mxt` definition |
| `category(Identifier registry)` | Gets the category of a registry | It is its path |
| `key(ResourceKey<?>)` / `key(Identifier registry, Identifier id)` | Builds a text key from the entry / registry+definition | |
| `key(String category, String registryNamespace, Identifier id)` | The low-level concatenation | **The only exit for building a definition key**; `ContextNameCodec`'s default value goes through it too |
| `defaultText(String category, ResourceKey<?> entry, String suffix)` | The fallback text when a definition writes no `name` / `description` | **The only exit for fallback text**; `suffix` of `""` is the name, `".description"` is the description |
| `resolved(Component text)` | Whether this text is "real text" or "an untranslated bare key" | Reads the client language file; a display-layer judgement |
| `rarity(String rarity)` | Displays free text (the `rarity` of `spirit_root` / `physique`) | Looks up `mxt.rarity.<value>` first, using the translation when there is one and the literal otherwise |

Key points: **do not assemble a second set of name keys anywhere else**; an untranslated key renders as the key itself (not an empty string), and `resolved(...)` is there to decide exactly that.

### `TooltipText` {#tooltiptext}

Package `com.iafenvoy.mxt.util`. How numbers and a single line are assembled in a tooltip; pure computation, no state.

| Method | Purpose | Notes |
| --- | --- | --- |
| `number(double value)` | At most two decimals, trailing zeros dropped | Uses `Locale.ROOT`, unaffected by the language environment: `3.0` → `3`, `3.50` → `3.5`, `3.456` → `3.46` |
| `signed(double value)` | A signed number | Anything non-negative gets a `+` (`0` → `+0`) |
| `join(List<? extends Component> parts)` / `join(Component... parts)` | Joins several parts into **one line** | What is inserted between parts is the translation key `TooltipText.SEPARATOR` (`tooltip.mxt.separator`), not a literal punctuation mark |

Key points: list punctuation differs per language, so **do not hard-code the ideographic comma or ", " anywhere else** — every joined line must go through here.

### `NumberProvider` {#numberprovider}

Package `com.iafenvoy.mxt.util.formula`. The abstraction of a "number": a constant in JSON, an exp4j expression string, or one of the structured providers in `mxt:number_provider_type`.

| Member | Purpose | Notes |
| --- | --- | --- |
| `double evaluate(FormulaContext context)` | Evaluates it | An implementation must guard non-finite results itself with `assertFinite` |
| `MapCodec<? extends NumberProvider> codec()` | This implementation's `MapCodec` | A new implementation must also be registered in `mxt:number_provider_type`, otherwise the typed codec cannot recognise it |
| `default boolean assertFinite(double value)` | Checks whether a runtime result is finite | On a non-finite value it logs one diagnostic containing `using 0` and returns `false`; **it does not change the number itself**, the caller owns the fallback |
| `NumberProvider.CODEC` | The uniform datapack entry point | Tries `double` → expression string → `{type:...}` in that order; the encoding side always writes `{type:...}` back |
| `NumberProvider.TYPED_CODEC` | Dispatches on `"type"` | |
| `NumberProvider.FINITE_DOUBLE_CODEC` | Rejects a non-finite double | Used for load-time validation |

Built-in types (`mxt:number_provider_type`): `constant` (the default), `expression`, `context_variable`, `sum`, `uniform`, `binomial`, `weighted_list`, `conditional`, plus the `js` one handed to scripts.

Key points: a field only needs one shape (a number / an expression string / `{type:...}`), **do not invent another number format for one field** — every number outside `Cost` goes through it.

### `ItemMatcher` {#itemmatcher}

Package `com.iafenvoy.mxt.util.matcher`. The matcher behind "which definition applies to this item": **any entry** in `entries()` matching is a match (an or, not an and).

| Member | Purpose | Notes |
| --- | --- | --- |
| `List<Entry> entries()` | The list of match entries | An implementation must supply them all |
| `int priority()` | Sort weight | **No default implementation** — every implementation returns the `priority` it decoded from JSON; a matcher without that field returns `DEFAULT_PRIORITY` |
| `DEFAULT_PRIORITY` | The value used when a definition writes no `priority` (`0`) | The three item conditions, the `mxt:item` cost and the two framework hold declarations have no such field and use it too; **the rank is not split by Entry kind** |
| `ORDER` | The single sort comparator (`priority` descending) | Callers that need the holder and cannot use `findAll` (`HoldLookup`, `ItemAuraService`) sort by it themselves instead of each writing one |
| `find(Registry<T> registry, ItemStack stack)` / `find(Stream<T> matchers, ItemStack stack)` | The first match | No match gives `Optional.empty()` |
| `findAll(...)` (registry and stream forms) | Every match | Sorted by `priority` **descending** |
| `ENTRIES_CODEC` | The codec for the entry list | Accepts both a single object and an array |

`ItemMatcher.Entry` members: `matches(ItemStack)`, `default boolean itemLevel()`, `codec()`, plus the two codec constants `SHORTCUT_CODEC` (the shorthand: a bare item id → `item`, an item tag → `tag`) and `CODEC` (tries the shorthand first, then an object with `type`). **An Entry carries no priority**: who wins is decided by the definition's own `priority`.

Entry kinds (`mxt:item_matcher_entry_type`, default `item`): `item`, `tag`, `wildcard`, `regex`; runtime modules additionally register `spirit_storage`, `herb_tag`, `technique`.

Key points:

- The "first" in `find` is the definition with the **largest `priority` number** — not registration order, and not the "most specific" match; it is the same direction as `aura_zone` and `element_reaction`. Only equal `priority` values depend on the order of the stream passed in.
- `priority` is **a field of ten definition tables themselves** (`artifact`, the `item`/`weapon`/`pill`/`tool`/`blueprint`/`technique` bindings, `spirit_herb`, `item_aura` and `currency`; default `0`, with no range validation at load time), so when a general definition and one that names items both exist the pack writes down which wins; naming an item **does not** move it up. `ArtifactHold` reads the field of the artifact it wraps; the `mxt:item` cost, the three item conditions and the two framework-owned hold declarations (technique reading and pouring) have no such field and always answer `DEFAULT_PRIORITY`.
- **`itemLevel()` is the cache-safety dividing line**: returning `true` means "whether it matches depends only on the item itself", and a caller caching per item **may only** cache such entries; an entry that reads components / NBT on the stack — or whose answer comes from another definition, like `mxt:herb_tag`, which asks which `spirit_herb` claims the item — has to be asked once per stack.
- The shorthand covers only `item` and `tag`; another implementation encoded through the shorthand throws `IllegalArgumentException`.

## The item catalogue and creative tabs {#picker}

### `CreativeTabHelper` {#creativetabhelper}

Package `com.iafenvoy.mxt.data`. The **read** side of the "registry → selectable rows" catalogue: `/picker` and other mods both go through it. Each entry is one `PickerItem(stack, names)` row: `stack` is what is drawn, `names` are the names that row can be searched by. It is read-only — it writes nothing onto items and decides nothing about who may take them.

Every query takes the registry access from you (`HolderLookup.Provider`; `BuildCreativeModeTabContentsEvent.getParameters().holders()` is one), so the client reads the tables it has synced and the server reads its own — there is no "reading the other side" case.

| Method | What it does | Notes |
| --- | --- | --- |
| `itemsOf(Provider, key)` | Every row of one table | `key` is the registry key; **a table that was never registered as a category gives an empty list**, never a throw |
| `itemsOf(Provider, key, Predicate<Holder<?>>)` | Filter rows by definition | The predicate receives the definition's holder, so filtering by id and by the definition itself are the same door — which is why "a mod id" means reading the holder's namespace |
| `itemsOfMod(Provider, key, String)` | The rows of one table that live in one namespace | `mxt:aura` entries belong to `mxt`, `mymod:aura/…` to `mymod`; in the item and block tables the definition *is* the item, so the namespace is the item's |
| `itemsOfMod(Provider, String)` | Across every category, the rows of one namespace | What a "everything from my mod" creative tab uses |
| `stacksOf(...)` / `stacksOfMod(...)` | The stack view of the four above | See below |

Key points:

- **What a creative tab takes is `stacksOf` / `stacksOfMod`**: they drop duplicates by **vanilla's own creative tab rule** (`ItemStackLinkedSet`, where the same item with the same components is one entry) and **every stack is a copy** — editing one cannot reach the row inside the picker. The de-duplication is not decoration: every `mxt:aura` row is the same spirit stone standing in for a definition, and handing those rows to a tab as they are makes vanilla's `accept` throw "this stack already exists in the tab". The row view (`itemsOf*`) keeps one row per definition and does not de-duplicate.
- **Vanilla's `accept` also requires `count == 1`**, which every row the mod itself registers is; write 1 in your own rows too.
- The queries have no side effects and work on both sides: they read only the access you pass in, touch no server singleton and write no attachment.
- To draw the same rows as a picker page instead of feeding a tab, use `ItemPickerScreen.over(title, stacks)`, see [The Item Picker](screens.md#the-item-picker-itempickerscreen).

**The catalogue itself lives elsewhere**: which registry maps to which rows, and how each row is built, is `com.iafenvoy.mxt.screen.picker.ItemPickerManager` — `categories()` / `category(Identifier)` list the categories and `registerSingle` / `register` add one (the `mxt:` definitions are registered by the mod). `CreativeTabHelper` only reads it, so the two classes stay apart. One limit to know: **one registry honours only the first category registered for it** — registering a second one for a key already taken is **silently inert** (the category list also lists it once).

```java
// Your own creative tab: everything this mod contributed (plus its own items)
@Override
public void buildContents(BuildCreativeModeTabContentsEvent event) {
    if (event.getTabKey() != MY_TAB) return;
    for (ItemStack stack : CreativeTabHelper.stacksOfMod(event.getParameters().holders(), "mymod"))
        event.accept(stack);
}
```

## Aura and resources {#aura}

These two are covered together because they are the easiest to confuse: **aura (`aura`) is identity, a resource (`resource`) is a number**. How the fields are written is in [aura](../datapack/json/aura.md) and [resource](../datapack/json/resource.md); how "the aura at a position" is actually computed is in [Aura Calculation](../technical/aura.md).

### `AuraService` {#auraservice}

Package `com.iafenvoy.mxt.runtime.world`. The **only resolver** of "how much aura is at this position": biome → dimension → custom region → formation override are solved in those four layers, then the environment pool and the chunk's mutable stock are combined into the final answer.

Queries (callable on both sides):

| Method | Purpose | Notes |
| --- | --- | --- |
| `getPositionAura(Level level, BlockPos pos)` | **The final aura at a position**: the environment pool + that chunk's stock + the distance-falloff contribution of nearby blocks + the formation's `max_bonus` ceiling bonus | This is the reading `/mxt aura query` uses; internally it fetches / initialises that chunk's aura attachment |
| `getSensedAura(Level level, BlockPos pos)` | **The environment concentration**: environment only, **deliberately without the chunk stock** | The resource bar's `mxt:environment_concentration` is this reading; when no region definition is found it gives an empty pool with the other fields still present |

Writing chunk stock:

| Method | Purpose | Notes |
| --- | --- | --- |
| `consume(Level level, BlockPos pos, Map<Holder<Aura>, Double> costs)` | Deducts one payment of aura from that chunk's stock and returns whether it succeeded | **All or nothing**: any non-finite entry, a negative entry or insufficient stock returns `false` and deducts nothing at all |
| `change(Level level, BlockPos pos, Map<Holder<Aura>, Double> amounts)` | Directly increases or decreases that chunk's stock (may be negative) | Returns `void`, **a failure carries no signal at all** (any non-finite value silently drops the whole payment); **a missing aura is never implicitly created** |
| `initialize(AuraChunkAttachment chunk, Resolved resolved, BlockPos pos)` | Writes one layer of environment pool into the chunk stock and marks it as a template | The server-side write path |

Result types: `AuraResult` (a table of `Holder<Aura>` → `AuraPool(amount, maximum, regenPerTick, supplied)`, plus the rule, the source and a `SourceKind`) and `Resolved(holder, definition, kind, maxBonus)` (one layer's resolution result; `id()` gives `mxt:empty` when there is no holder).

Key points:

- **"The final aura at a position" and "the environment concentration" are two entry points**: the former includes the chunk stock, the latter does not. Both pools are **separated by `Holder<Aura>`**, and `aura` and `resource` are one to one, so **there is no "give me the pool of a certain `resource`" entry point**.
- **The account you can actually spend is the chunk stock**, and only `consume` / `change` can change it; `getPositionAura` gives a composite view (with the block contributions mixed in).
- **A query is a snapshot of the current tick**: results are memoised by `(position, game tick)` and the whole table is dropped at the end of every tick (`AuraQueryCache`), so a `consume` / `change` is **not** visible to a query made in the same tick (a newly activated formation is the same story, visible only from the next tick) — if you need the new value right away, keep your own bookkeeping from the call's result. See [Aura Calculation](../technical/aura.md).
- `supplied` separately records "how much of this amount comes from the block emitters underfoot", because a consumer allowed to spend the terrain underfoot (a formation that draws on the environment, say) has to deduct its own share first, or it would double-count.
- **The later layer wins**: biome < dimension < custom region < formation override. A dimension binding **replaces** the biome rather than being overridden by it — reading the order of that English comment directly is easy to get backwards.
- A formation override only posts `AuraZoneEvent.Override` when there is a region holder and it is the server; if it is cancelled the lower-priority layer is kept; an override without a holder passes through silently.
- Both client queries can be called, but **dimension tag matching may differ from the server** (a dimension stem is a registry not synchronised to the client), so do not treat a client result as authoritative.

### `ResourceService` {#resourceservice}

Package `com.iafenvoy.mxt.runtime.resource`. Applies the bounds of a `resource` definition (`min` / `max`) consistently across the three paths of **initialisation, change and passive regeneration**.

| Method | Purpose | Notes |
| --- | --- | --- |
| `initialize(ResourceHolderAttachment holder, Holder<Resource> resource, FormulaContext context)` | Lands the value from `default_value` and clamps it to the bounds | **An existing value is left alone** (`changed = false`); bounds that cannot be resolved or a non-finite default → `invalid` |
| `change(ResourceHolderAttachment holder, Holder<Resource> resource, double amount, FormulaContext context)` | Increases or decreases this value | Out of bounds is **clamped**, not refused; internally it calls `initialize` first (first access lands the value automatically); a result equal to the current value returns `unchanged` |
| `regenerate(ResourceHolderAttachment holder, Holder<Resource> resource, NumberProvider regen, long elapsedTicks, FormulaContext context)` | Passive regeneration: `regen × elapsedTicks`, then goes through `change` | **`elapsedTicks < 0` throws `IllegalArgumentException`** — the only place in this class that throws |
| `formulaContext(CultivationAttachment spirit, Holder<Resource> resource, FormulaContext base)` | Attaches this value's context to a formula | **Read-friendly**: the cultivation attachment is passed in by the caller (read it with `getExistingData`) |
| `formulaContext(LivingEntity entity, Holder<Resource> resource, FormulaContext base)` | Takes the cultivation state from the entity and attaches it | **Creates an attachment** (internally `getData(MxtAttachments.CULTIVATION)`), so do not use this overload in a read-only place |
| `resolveBounds(Resource definition, FormulaContext context)` | Resolves `min` / `max` | Any non-finite value or `min > max` → `Optional.empty()`; use it when you want a read-only check of your own instead of writing another clamping routine |
| `realmRank(CultivationAttachment spirit, Holder<Aura> aura)` | This entity's realm index **on this aura chain** | A mortal gets that chain's first realm index; no first realm on the chain, or a current stage not on it, gives `-1` |

Result types: `Result(valid, changed, value)` — **on failure `value` is `NaN`, so read `valid()` before the number**; and `Bounds(min, max)`.

Key points:

- The three write methods **only change the attachment passed in**; they neither fetch nor create one themselves; the only thing that implicitly creates an attachment is `formulaContext(...)` taking a `LivingEntity`.
- The by-id overloads (`initialize(holder, id, context)`, `change(holder, id, amount, context)` and the `formulaContext(..., id, base)` pair) **resolve the definition from the registry by id themselves** on every call, so an entry the current pack does not provide (its file was deleted, or a `neoforge:conditions` block keeps it out) is skipped; when the id does not resolve they **fail silently** (a write gives `invalid`, and the two `formulaContext` calls return `base` unchanged).
- Neither this class nor `AuraService` **has a server check of its own**; whether they are only called on the server is left to the call site's self-discipline.

## Cultivation and realms {#cultivation}

### `CultivationService` {#cultivationservice}

Package `com.iafenvoy.mxt.runtime.cultivation`. A pure static utility class; all the arithmetic of the cultivation line lives here.

**Breakthrough (the only entry point)**:

| Method | Purpose | Notes |
| --- | --- | --- |
| `attempt(LivingEntity entity, CultivationAttachment spirit, ResourceHolderAttachment resources, Holder<Aura> aura, FormulaContext context, BooleanSupplier conditionsMet)` | Attempts a breakthrough to the next realm | This is the **only server-gated method** in the class: the client gets `Failure.SERVER_ONLY` directly, with no log line |
| `attempt(..., Identifier auraId, ...)` | Same as above, with the aura given by id | Gives `NO_NEXT_REALM` when the aura cannot be resolved |

**Progress and minor stages**:

| Method | Purpose | Notes |
| --- | --- | --- |
| `addProgress(LivingEntity, Holder<Aura>, double amount, FormulaContext)` | Adds cultivation progress | Returns the **amount actually accepted**; an invalid amount or no next realm gives `0.0` |
| `addProgressForChain(...)` | Same as above, taking an entity or a `CultivationAttachment` | Two overloads |
| `remainingProgressForChain(CultivationAttachment, Holder<Aura>, FormulaContext)` | How much is still missing to the next realm | |
| `minorStage(Holder<Aura>, CultivationAttachment, FormulaContext)` / `minorStage(RealmStage, double progress, FormulaContext)` | The current minor stage (**0-based**) | The piecewise arithmetic exists only here and has a reentrancy guard; no `minor_stages` or an invalid value gives `NaN` |

**Read-only and management**:

| Method | Purpose | Notes |
| --- | --- | --- |
| `breakthroughStatusForChain(LivingEntity, Holder<Aura>, FormulaContext)` | Breakthrough status (reached or not, conditions met or not, automatic or not, the progress interval) | The automatic breakthrough tick and the information panel share one answer |
| `pendingConditionsForChain(LivingEntity, Holder<Aura>)` | Which conditions are still missing | |
| `setRealm(CultivationAttachment spirit, Identifier target)` | Sets the realm directly (for administrators) | Returns whether it actually changed; **it has no entity parameter and therefore no server check** |

Result types: `BreakthroughResult(advanced, failure, failedResource, costs)`, `BreakthroughStatus(reached, conditionsMet, automatic, minimumExperience, maximumExperience)`, `enum Failure {DISABLED, WRONG_AURA, NO_NEXT_REALM, INSUFFICIENT_PROGRESS, CONDITIONS, INSUFFICIENT_RESOURCE, INVALID_FORMULA, CANCELLED, SERVER_ONLY}`.

Key points:

- **The boundary is inconsistent**: only `attempt` blocks the client; `addProgress*` / `setRealm` / `minorStage` do not check, and calling them on the client really writes the attachment.
- Conditions declared by the content are evaluated **before the cost is paid**, so unmet conditions do not waste resources.
- `INVALID_FORMULA` doubles as the normalised exit for "every cost failure that is not insufficient resources"; `failedResource` is only non-empty when resources were short during the payment stage.
- `Failure.DISABLED` is produced only by the script bridge (`MxtKubeJsApi.tryBreakthrough`, when the aura id does not resolve) — `attempt` itself never produces it.
- `Failure.MAX_PROGRESS` was **removed** on 2026-09-25 (it was provably unreachable): the progress ceiling can never be the reason a breakthrough is refused — `threshold()` requires a stage's `max_experience ≥ breakthrough_exp`, so progress being pinned at `max_experience` already satisfies `progress ≥ breakthrough_exp`, and the attempt can then only fail on conditions, cost or cancellation. An inline `Failure` branch that still writes it fails to compile.

### `LifeSpanService` {#lifespanservice}

Package `com.iafenvoy.mxt.runtime.cultivation`. The lifespan ledger (**the ticks left** and **the ceiling** this life was granted) and the one exit through which a life runs out. The numbers come from data packs (`realm_stage.lifespan`, `mxt:modify_lifespan`, `mxt:reincarnate`) while the server config owns the pace and what running out does.

| Method | What it does | Notes |
| --- | --- | --- |
| `remaining(Entity)` / `total(Entity)` | Reads the two numbers | **Read-only, it does not create the attachment**; a body with no ledger answers `-1` (`UNACCOUNTED`) |
| `set(LivingEntity entity, long ticks)` | Rewrites both numbers | `ticks < 0` is refused; answers `Result(changed, failure)` |
| `add(LivingEntity entity, long ticks)` | A positive amount extends the life (both numbers grow), a negative one takes life away (only what is left drops) | Same result; a body nobody ever granted life to is measured from the configured **Base lifespan**; `0` does nothing at all |
| `seed(LivingEntity entity)` | Seeds the ledger from the configured **Base lifespan** | Answers `false` with the master switch off, with a base of `0`, or when a ledger already exists (login and settlement share it) |
| `settle(Entity entity)` | One settlement, which is also the expiry verdict | Answers `false` outright with the master switch off, for creative / spectator players, for anything that is not a living body and for a body with no ledger; **the only entry point that can end a life** |
| `reincarnate(LivingEntity entity)` | Runs the rebirth reset list on the spot (the switches on the Reincarnation tab) | Answers `Result`: when `Pre` is cancelled the `failure` is `CANCELLED` and nothing at all happens. The data pack action `mxt:reincarnate`, `/mxt lifespan reincarnate`, KubeJS `MxtLifespan.reincarnate` and an addon all call this one method; it runs with the master switch off too |
| `display(long remaining, long total, int ticksPerYear)` | The display component the character panel and the action-bar warning share | A negative remainder reads as "Unlimited" |

`Result.failure` takes `SERVER_ONLY`, `INVALID_VALUE`, and `CANCELLED` — the last one only ever comes from `reincarnate`.

**Two events** (both in the `event` package):

- `LifeSpanEndEvent.Pre` / `Post`: fired once at the moment a lifespan runs out. `Pre` is cancellable — writing a positive lifespan inside it has extended the life, while writing nothing closes the account (`remaining = -1`, `total = 0`); `Post` carries `outcome()` (`NONE` / `DEATH` / `REINCARNATE`).
- `LifeSpanRebirthEvent.Pre` / `Post`: fired before and after an **explicit rebirth**, and only by that public entry point. A cancelled `Pre` means the whole thing did not happen and the body is untouched.

Key points:

- **A write never kills**: `set` / `add` only record, and expiry is judged by `settle` alone, so nobody dies halfway through a cost transaction or an ability.
- Server-only: a client-side write answers `Failure.SERVER_ONLY` and writes no log.
- A player whose lifespan runs out under **On expiry → Death** is turned into a spectator (nothing drops, no death event fires and the ledger keeps its `0`); a non-player creature dies of the `mxt:lifespan` damage type, and if another mod blocks that kill the account is closed instead of retried.
- An explicit rebirth fires **no** `lifespanEnd` — that event only answers "did a lifespan run out".

## Abilities {#ability}

### `AbilityService` {#abilityservice}

Package `com.iafenvoy.mxt.runtime.ability`. A pure static utility class. **There is only one road to executing an ability**, and every entry point is here.

| Method | Purpose | Notes |
| --- | --- | --- |
| `use(Holder<Ability> ability, Entity actor, AbilityAttachment attachment, ResourceHolderAttachment resources, long gameTime, FormulaContext context)` | Casts an already granted ability | With `cast_time > 0` it only records the deadline, and the result has `casting = true` |
| `useCarried(..., @Nullable Vec3 origin)` | An ability carried by an item | Does not require a grant (the item is the permission); a non-instant ability gives `CARRIED_NOT_INSTANT` |
| `finishCast(Holder<Ability>, Entity, AbilityAttachment, ResourceHolderAttachment, long gameTime, FormulaContext)` | Lands the ability once the channel is due | If it is not yet due it returns the in-progress result unchanged |
| `gate(ToggleContext context)` | The shared gate: grant / cooldown / conditions / cost | **Executes no effect**; called by `AbilityActivationService.activate` when `Togglable#gated` is true |
| `tickChannel(Holder<Ability>, Entity, AbilityAttachment, ResourceHolderAttachment, long gameTime, FormulaContext)` | Settles a channel every tick | Only the server-side entity tick bridge calls it; any failure stops the channel |
| `stopChannel(AbilityAttachment)` | Stops a channel | |
| `cancelCast(Holder<Ability>, AbilityAttachment, long gameTime)` | Interrupts a charge | **No refund** |
| `executeTargetAction(Ability definition, Entity actor, Entity target, FormulaContext context)` | Runs an ability's target action | Reused by the event bridge, with an empty `origin` |

Return types: `UseResult(committed, casting, failure, failedResource, amounts)` (**three states**: committed / casting / failed), `GateResult(approved, failure, failedResource)`, `PrepareResult` (`approved()` is `use != null`), `PreparedUse`, `CommitResult`, `ChannelResult(state, failure, nextTick, amounts)`, `enum State {INACTIVE, WAITING, PULSED, STOPPED}`, `enum Failure {DISABLED, NOT_GRANTED, COOLDOWN, INSUFFICIENT_RESOURCE, INSUFFICIENT_COST, INVALID_FORMULA, CONDITION_FAILED, NO_CHARGES, CANCELLED, PERMISSION_DENIED, ELEMENT_AFFINITY, SERVER_ONLY, CARRIED_NOT_INSTANT, NO_TARGET, NOT_APPLICABLE}` (fifteen).

Key points:

- Whenever something is "pressing a switch", the server always goes through `runtime/ability/AbilityActivationService` first — the wheel, commands, KubeJS and talismans all use it, **so do not write another "pressing a switch" dispatch anywhere else**. Only when an implementation is `Togglable` and `gated(ctx)` is true does it come back and call `gate` here.
- **Cooldown and cost are entirely this road's job**: the `cooldown` field writes the `mxt:cooldown` state itself, and content does not need to declare a cooldown a second time.
- **What an ability does when it takes effect is the type's answer**: the four action fields (`entity_action` / `target_selector` / `target_condition` / `bi_entity_action`) are **declared and run by each type that runs actions**, so the step this road takes to "what should happen" is `AbilityEffect.run(definition.type(), actor, context, origin)` — one static entry that only asks whether the type implements the `AbilityEffect` **capability interface** rather than dispatching on the concrete class, with the shared execution of the four fields on `ActionCarrier`. When each of the four fields runs is on [Ability · The Four Action Fields](/en/datapack/json/ability#action-fields-by-type).
- **A targeted cast (`mxt:targeted`) takes this same road**: it implements the `AbilityApplier` capability interface (`reach` for the entities this cast lands on plus `payload` for the ability run on each of them), the runtime asks `reach` once **before anything is paid** - picking nobody is `NO_TARGET` and a payload with no one-target half is `NOT_APPLICABLE` (both are values of `Failure` above) - and its own price, cooldown and element affinity are still taken once by this road. See [Targeted Casts](/en/datapack/json/ability#targeted).
- World actions never roll back, so a composite ability validates with `prepare` first and then `commit`s as one.
- This class **does not check the client itself** and never produces `Failure.SERVER_ONLY` — the client-side `SERVER_ONLY` is returned by the caller (the KubeJS bridge `MxtKubeJsApi`, for instance). Calling `use` directly on the client really acts.
- The `amounts` / `costs` in any result are for display and records only; **do not use them as a basis for rollback**.

## Damage {#damage}

### `DamageCalculationService` {#damagecalculationservice}

Package `com.iafenvoy.mxt.runtime.damage`. **The one settlement pipeline for a strike**: shaping happens on the attacker's side (`outgoing`), reduction on the target's side (`incoming`). For why the two layers have to be apart and how elements are written in a datapack, see the [Damage System](../technical/damage.md).

**The only dealing entry point**:

| Method | Purpose | Notes |
| --- | --- | --- |
| `deal(@Nullable Entity attacker, Entity target, double amount, Optional<Holder<DamageType>> damageType, @Nullable FormulaContext context)` | **The only method to call** when this mod deals damage itself: it builds the `DamageSource`, checks the `mxt:no_bonus` pass-through, runs layer one, and then hands it to vanilla `hurtServer` | The client (target not in a `ServerLevel`) and any non-finite / non-positive amount return `0.0D`; the `damageType` parameter may not be `null`, pass `Optional.empty()` when there is no type; what it returns is the **shaped value**, before vanilla mitigation (armour, invulnerability frames), not "how much health was actually lost" |

**Layer one: attacker-side shaping (pure computation, dealing no damage)**:

| Method | Purpose |
| --- | --- |
| `outgoing(@Nullable Entity attacker, Entity target, double amount, @Nullable FormulaContext context, Set<Holder<Element>> elements)` | Base value × `damage_multiplier` × `element_modifier` × self-conflict × (the attacker's `damage_dealt_multiplier` × this strike's `overcomes` against the target's spirit roots) |
| `outgoing(...)` (the shorthand without `elements`) | With no declared damage type, this strike's element is the attacker's own spirit-root element |
| `selfConflictMultiplier(@Nullable Entity attacker)` | The multiplier when the main-hand item's element conflicts with an active spirit root's `conflicting_elements`; each element is **multiplied only once** (however many roots conflict) |
| `physiqueMultiplier(@Nullable Entity entity, boolean dealt)` | An active physique's `damage_dealt_multiplier` (`dealt=true`) / `damage_taken_multiplier` (`dealt=false`), multiplied together; always in the **holder's own** formula context |
| `masteryMultiplier(@Nullable FormulaContext context)` / `elementMultiplier(@Nullable FormulaContext context)` | Reads `damage_multiplier` / `element_modifier`; a missing or invalid value reads `1.0`, and **writing `0` is respected** (it is not "unset") |

**Layer two: target-side reduction (pure computation) and helpers**:

| Method | Purpose | Notes |
| --- | --- | --- |
| `incoming(LivingEntity target, Set<Holder<Element>> attacking, double amount)` | × the target's `adapted_to` × the target's `damage_taken_multiplier` | The main overload; **only `DamageEventBridge` calls it once in `LivingIncomingDamageEvent`**, so do not call it yourself as well (that is a second reduction) |
| `incoming(LivingEntity target, DamageSource source, double amount)` / `incoming(LivingEntity target, @Nullable Entity attacker, double amount)` | Derives the element from the damage source or the attacker and then reduces | Two shorthands for the main overload above |
| `adaptationMultiplier(LivingEntity target, Set<Holder<Element>> attacking)` | The target's `adapted_to` | Being overcome is the attacker's advantage, so the target side does not add it a second time |
| `overcomeMultiplier(Set<Holder<Element>> attacking, Entity target)` | The attacker's elements' `overcomes` against the target's spirit roots | Every matching pair is multiplied (two elements both overcoming means both count) |
| `attachmentMultiplier(LivingEntity target)` | The product of the `attachment_multiplier` of the **artifacts** the target carries | It only scales the **element buildup** this strike leaves, and does not affect what an element reaction does |
| `bypasses(DamageSource source)` | Whether this damage type is in `mxt:no_bonus` | Pass-through means no factor is multiplied and no element is left, but **vanilla's own mitigation still applies** — it is "not governed by this mod's bonus arithmetic", not immunity |
| `source(Level level, @Nullable Entity attacker, Optional<Holder<DamageType>> damageType)` | Builds this strike's `DamageSource` | **Attribution is decided here** (a player → `playerAttack`, a mob → `mobAttack`, neither → `generic`); a caller building its own source loses the kill credit |

Public constants: `DAMAGE_MULTIPLIER` and `ELEMENT_MODIFIER` (the two variable names in the formula context), `NO_BONUS` (a `TagKey<DamageType>`, which is `mxt:no_bonus`).

### `DamageElements` {#damageelements}

Package `com.iafenvoy.mxt.runtime.damage`. Answers "**what element is this strike**", and gives both layers **the same** reading.

| Method | Purpose | Notes |
| --- | --- | --- |
| `strike(Level level, Optional<Holder<DamageType>> type, @Nullable Entity attacker)` / `strike(DamageSource source)` | This strike's element set | **The one rule shared by the pipeline and the damage condition**: a damage type claimed by elements means those elements, and with no claimant it falls back to the attacker's spirit roots |
| `reading(Level level, ...)` / `reading(DamageSource source)` | The elements + the origin + how much buildup each element will leave | The three fields come from **the same** registry query; reduction and element buildup must share this one reading, or the two numbers go out of step |
| `of(RegistryAccess access, Holder<DamageType> type)` / `of(DamageSource source)` | **Who claimed this damage type** (without the fallback) | No claimant gives an **empty set**; the index is built from the `damage_types` each element definition declares |
| `typeOf(RegistryAccess access, Holder<Element> element)` | Takes the first resolvable type in that element's `damage_types` | A tag form expands to the first matching element |
| `resolveType(RegistryAccess access, List<Either<Holder<Element>, TagKey<Element>>> elements, Optional<Holder<DamageType>> damageType)` | Decides what type a declarative strike should go out as | An empty result means keeping its original reading (the attacker's spirit roots); a failed declaration only warns and **never fails the load** |
| `checkDeclaration(RegistryAccess access, ...)` | Checks that the declared elements really claim this type | Checked **on first use**, not at load time (registries are decoded in parallel, and a load-time check would make the same pack pass sometimes and fail other times) |

Types: `Strike(elements, attachment, origin)`, `Claim(element, attachment)`, and `enum Origin {TYPE, ROOTS}` — `attaches()` says whether this strike leaves buildup on the target, and **an element reaction is only started by TYPE**.

Key points:

- A strike's element **must be readable from the `DamageSource`**: that is all the reduction layer has in hand.
- The cache is keyed by the **damage type `Registry` instance** (the element registry and the damage type registry reload in the same step, so one key notices both); `/reload` does not replace the instance, so the cache neither goes stale nor should it, and the cap is 4 registries.
- When several elements claim one damage type, **every claim is multiplied**, and a warning is logged while the index is built.

## Formations {#formation}

### `FormationActionType` and `MxtFormationActionTypes` {#formationactiontype}

A formation's framework (structure, radius, costs) is on `Formation`; "what this formation does" is decided by its `actions` list, and every item in that list is a **functional module**.

- `FormationActionType` (`com.iafenvoy.mxt.data.formation`) is the shape of a module: a `codec()`, plus a `CODEC` dispatching on the JSON `"type"` field (it must be a `Codec` rather than a `MapCodec`, because a formation holds a **list** of modules).
- The dispatch registry `mxt:formation_action_type` is a **built-in registry** (default entry `none`), registered statically in code through `NewRegistryEvent`, and **not one of the 39 datapack registries in `MxtDatapackRegistries`**.
- So: **a datapack can freely add `mxt:formation` entries (module combinations and parameters), but it cannot add a module type**. One more module kind = one record + one `DeferredRegister` registration, and the runtime dispatches on the record type, which is why the `data` package never touches the world.
- There are currently only 5 legal `type`s, all registered in `MxtFormationActionTypes`: `mxt:none` (`NONE`, also the dispatch registry's default), `mxt:attack` (`ATTACK`), `mxt:buff` (`BUFF`), `mxt:protection` (`PROTECTION`), `mxt:range_display` (`RANGE_DISPLAY`).
- Registration happens only once through `MxtFormationActionTypes.REGISTRY`; **do not register it again elsewhere, and do not build a second formation module registry**.

### `FormationProtection` {#formationprotection}

Package `com.iafenvoy.mxt.runtime.formation`. The **only decision point** for "does the ward in a formation forbid this action": breaking, placing, using, interacting, attacking, explosions and mob griefing all ask the same question and get the same answer.

| Method | Purpose | Notes |
| --- | --- | --- |
| `prevented(ServerLevel level, Action action, @Nullable BlockPos target, @Nullable UUID actorId)` | Whether this action is stopped at this position / for this actor | `true` = forbidden. It takes a **UUID** rather than a player or entity, because a server-side audit has to be able to run the rules with no player online; `actorId == null` is legal (explosions, mob griefing) |
| `covers(ProtectionFormationAction ward, Action action)` | Which switch of this ward governs this action | One to one with the datapack fields (`block_break` → `BREAK`, and so on) |
| `hasProtection(Formation definition)` | Whether this definition has a ward module | A pure definition query that does not look at the world |
| `delegationHandsOver()` | Whether "delegate to the claim plugin" really yields right now | **Server Config → Compatibility → Delegate Needs Claims** is off, or the claim plugin really is protecting |
| `claimsOnlyRefuses(ServerLevel level, BlockPos controller)` | Whether this spot is refused under `claims_only` for "no claim here" | With no claim plugin installed it is **inert** (one warning) rather than an error — a formation must not become unplaceable for a reason the operator cannot satisfy |
| `foreignClaimRefuses(ServerLevel level, BlockPos controller, @Nullable UUID actorId)` | Whether a ward refuses to stand on land someone else has claimed | It needs **Server Config → Compatibility → Wards Need Permission** on and the claim plugin installed, and otherwise allows; the permission itself goes to the claim plugin, and **its rules are not replicated** (a second implementation would drift) |
| `warnIfDelegationFallsBack(Identifier id, Formation definition)` | Warns on activation that "the declaration says this delegates to the claim plugin, but there is no claim protection, so the mod's own flags still apply" | Warns once per definition |

`FormationProtection.Action` is the **only vocabulary** between callers and the decision point: `BREAK`, `PLACE`, `INTERACT`, `EXPLOSION`, `MOB_GRIEFING`, `ENTITY_INTERACT`, `ATTACK_ENTITY`, `ITEM_USE`. A new action kind = a value here + a branch in `covers` + a datapack flag, and all three must change together.

Key points:

- **The decision looks at both ends of the action**: the actor's position **or** the target's position inside the radius makes this ward apply; with no target it can still refuse on the actor's position.
- **The exemption order**: an empty actor is not exempt; a ward **with no owner exempts nobody**; an actor **on the ownership list** → exempt (every listed owner counts); only when the ward declares `spare_friends` **and** **Server Config → Formations → Friend or Foe** is on does it ask `FriendService.identify(...) == TRUE` (asked of every owner in turn); an entity no friend source recognises is always stopped.
- When delegation holds, this ward **does not apply at all** (skipped, not downgraded), and two independent paths trigger it: the module declaring `delegate_to_claims` itself, or `claim_linkage == claims_precedence` with the controller's chunk already claimed.
- Claims are only asked about **the chunk the controller is in**, so a ward spanning a border is not governed by two rule sets at once.
- **Do not write another ward decision inside an event subscriber**.

## Foe identification {#friends}

### `FriendService` {#friendservice}

Package `com.iafenvoy.mxt.runtime.friend`. The only place to ask "**is this one of mine**": friendly fire, ward exemptions and AI decisions all go through it. The mechanics and the list commands are in [Foe Identification](../technical/identification.md).

| Method | Purpose | Notes |
| --- | --- | --- |
| `isFriend(Entity judge, Entity candidate)` | The boolean answer | Only `TRUE` counts as "yes"; both `DEFAULT` and `FALSE` count as no |
| `identify(Entity judge, Entity candidate)` | The three-state decision | Forwards to the one below |
| `identify(UUID judgeId, @Nullable Entity judge, Entity candidate)` | The three-state decision, **the judge may be offline** | Posts `FriendEvent.Relation` first, and only falls back to the built-in friend list when nobody answers |
| `builtin(Entity judge, Entity candidate)` / `builtin(UUID judgeId, @Nullable Entity judge, Entity candidate)` | Asks the built-in friend list directly, **posting no event** | Safe to call inside a `Relation` listener — which is exactly why "the list plus my own additions" is expressible |

Key points:

- **No memoisation**: every call posts an event, and a listener is entitled to query the world. A caller asking repeatedly within one tick has to store the answer itself.
- The built-in decision order is: yourself is always your own → an unloaded judge falls back to `FriendCache` (the offline mirror) → a judge that is not a player is `FALSE` (only a player can have a list) → otherwise read the friend attachment (with `getExistingData`, **read-only, creating no empty attachment**).
- This class **has no side check of its own** and posts its event anyway; do not expect it to give an authoritative answer on the client.

### `FriendEvent` {#friendevent}

Package `com.iafenvoy.mxt.event`. The identification hook of the friend system, **posted on `NeoForge.EVENT_BUS`** (not the mod bus), and what is actually posted is the nested `FriendEvent.Relation` — a subscriber has to name that.

| Member | Purpose | Notes |
| --- | --- | --- |
| `Relation(UUID judgeId, @Nullable Entity judge, Entity candidate)` / `Relation(Entity judge, Entity candidate)` | Construction | Public constructors, so the outside can post one itself |
| `judgeId()` | The judge's UUID | **Always present** — a friend source whose data lives in a server manager (a team, a faction) can therefore answer while the player is offline |
| `judge()` | The judge entity | **Empty while offline**, which is a design requirement rather than a bug |
| `candidate()` | The one being judged | |
| `setResult(TriState)` | Writes down this listener's verdict | `TRUE` = treat as one of mine; `FALSE` = not one, **whatever the list says** (it overrides every source, including the player's own list); `DEFAULT` = hand it back to the list |
| `result()` / `answered()` | Reads the current verdict / whether anyone has answered yet | `FriendService` only trusts the event when `answered()` is true |

Key points:

- **It is not a cancellable event**: to veto, call `setResult(FALSE)`.
- `result` is **a single mutable field**: a later answer overwrites an earlier one, with no aggregation and no "ask once" guard. To express "add on top of the list", call `FriendService.builtin(...)` in the listener yourself and merge.
- Do not post another `Relation` from inside a listener (it would loop back into `identify`).

## Currency {#currency}

### `CurrencyValueService` {#currencyvalueservice}

Package `com.iafenvoy.mxt.runtime.economy`. The **server-side read API** for item-standard currency definitions: it only computes value and gives exchange quotes, and **never charges** — currency is not a cost. The format is in [currency](../datapack/json/currency.md).

| Method | Purpose | Notes |
| --- | --- | --- |
| `unitValue(Item item)` / `unitValue(ItemStack stack)` | The unit price of one | Needs a current server; when it cannot be obtained it gives `OptionalLong.empty()` without throwing or logging |
| `unitValue(Provider access, ...)` (including the overloads with a holder and a `FormulaContext`) | The explicit-registry / holder-carrying forms | **An empty stack gives `of(0L)`**; only the overload with a `FormulaContext` threads the context all the way into the `unavailable_when` check and the quality multiplier |
| `value(ItemStack stack)` / `value(@Nullable Entity holder, ItemStack stack)` | The whole-stack value = unit price × count | A unit price that cannot be found, or a multiplication past `Long.MAX_VALUE`, always gives empty and **never truncates or clamps** |
| `totalValue(Collection<ItemStack> stacks)` | The total value of a pile of stacks | Any stack that is not currency, or an overflowing sum → empty |
| `exchangeOffers(ItemStack input)` (plus the registry and holder-carrying forms) | Which quotes this input can be exchanged for | Only takes the `exchanges` of the definition that **claims this item** (the highest `priority` one) and flattens them; empty when that winner is unavailable, and with no server it gives an empty list |
| `isExchangeInput(RegistryAccess registryAccess, ItemStack input)` | Whether this stack can go into the exchange input slot (**without yet looking at whether the count suffices**) | Requires the winner claiming this item to be available and to have a non-empty `exchanges` |
| `definition(Provider access, ItemStack stack)` | Finds a currency definition by matcher only | **Does not judge availability** — do not treat `isPresent()` as "usable" |
| `unavailableReason(Provider access, @Nullable Entity holder, ItemStack stack)` | Why it is unavailable | With `holder == null` it is **always empty** (there is no holder, so no reason can be asked for); it takes the first entry in `unavailable_when` whose condition is true |

`ExchangeOffer(output, cost)` is one quote: `output()` returns a **copy**, so it can be modified without polluting another quote.

`CurrencyValue.UnavailableWhen(ItemCondition condition, Component reason)` **is not an enum** but a record — "which values exist" is decided by the datapack's `unavailable_when` list, and `reason` is translatable text meant for the player rather than an error code.

Key points:

- **`empty` and `0L` are two different conclusions**: `empty` = not currency / no server / overflow / no definition found; `0L` = it is currency, but the stack is empty or it is currently unavailable; on the exchange side "no quotes" shows up as an **empty list**.
- **A query without a holder treats any definition that writes `unavailable_when` as unavailable** (internally it requires that list to be empty); pass a holder to judge by conditions.
- The quality multiplier is the **only** place where "item currency value meets quality": it multiplies the `value_multiplier` of the quality the priced stack resolves for itself; when the product is below 1, past the long ceiling, or no longer finite, the **declared denomination is kept** rather than clamped.

## Alchemy {#alchemy}

### `AlchemyWorkstationService` {#alchemyworkstationservice}

Package `com.iafenvoy.mxt.runtime.alchemy`. The furnace's **one intake point**: previewing, lighting, aborting and the per-tick advance all live here, and the block entity only answers state (see [AlchemyWorkstation](interfaces/alchemy/alchemy-workstation.md)).

| Method | Purpose | Notes |
| --- | --- | --- |
| `start(ServerPlayer player, AlchemyWorkstation station)` | Lights the furnace | Returns `StartResult(started, failure, qualityFailure)`. The materials are consumed only once the whole judgement chain has passed: structure, furnace spec, quality, where the inputs sit and how many there are, whether the temperature can be reached, the ambient aura, and whether the output bin can take the result; a cancellation from `alchemyCraft`'s `Pre`, or a listener that moved the real inventory, gives `CANCELLED` and **does not restore the inventory**. |
| `preview(ServerPlayer player, AlchemyWorkstation station)` | Previews the same judgement and **takes no chosen recipe** | Returns `AlchemyPreview(mixture, candidates, resolvedRecipe, blocker, parameters, qualityFailure, successOutputs, failureOutputs)`; lighting uses that same `parameters`, so a preview and a real run never give two different answers. |
| `abort(ServerLevel level, BlockPos pos, AlchemyWorkstation station)` / `abort(..., AlchemyFailure reason)` | Aborts the active batch | Settles it as a failure once, and the materials already consumed are not returned; a batch that is already `READY`, or already settled, is not settled a second time. |
| `furnaceDefinition(Provider access, ItemStack stack)` | Resolves a furnace spec from a furnace item | An empty stack, no component, an empty id inside the component, or a definition that is not in the registry all give empty. |
| `tick(ServerLevel level, BlockPos pos, AlchemyWorkstation station)` | Advances one tick | Called by the core block entity's own server tick; the temperature advance, the phase changes, the pending output and the settlement all happen here. |

Result types: `StartResult`, `AlchemyPreview`, `Parameters` (the recipe vector evaluated once at lighting and frozen into the batch), and `enum AlchemyFailure {FURNACE_QUALITY, QUALITY_CONDITIONS, BINDING_CONDITIONS, UNBOUND, MAX_USES, COOLDOWN, NO_FURNACE, STRUCTURE, ACTIVE, CAPACITY, SLOTS, ZERO_POWER, NOT_HERB, INSUFFICIENT, CONFLICT, IMBALANCE, AMBIGUOUS, TEMPERATURE, ENVIRONMENT, INVALID_FORMULA, OUTPUT_CAPACITY, CANCELLED, DISABLED}` (23 values).

Key points:

- **The temperature and the outputs are not written in from outside**: `Parameters` is evaluated once at the moment of lighting and frozen, the active batch reads that frozen copy, and only a batch started after a `/reload` reads a new recipe.
- **`start` and `preview` share one judgement**: temperature and output capacity only take part in accepting or rejecting the entry that has already been chosen, and never make the judgement pick a weaker recipe.
- **A heat block answers only two numbers**, see [AlchemyHeatSource](interfaces/alchemy/alchemy-heat-source.md).

## The server and client boundary {#boundary}

This section gathers into one place the boundary scattered around the rest — every entry point above only tells its own exceptions.

- **Only the server settles**: costs, cultivation progress, breakthroughs, abilities, damage, formations and currency value are all server-side facts. A client call gets at best a return value of "nothing happened".
- **But "client-safe" is not a default property of a service class**: the mod's own KubeJS bridge (`MxtKubeJsApi`) writes an `isClientSide()` check at every entry point and returns `SERVER_ONLY` / `false` / `0` without logging; `AbilityService` and `CultivationService` (apart from `attempt`) **have no such check of their own**. When writing a new entry point for another mod to call, block it once at the **boundary** the way the KubeJS bridge does.
- **Do not query server registries on the render thread**: in `MxtDatapackRegistries`, every overload without a `Provider` / `RegistryAccess` reads the current server, so either switch to an accessor-carrying overload or cache the result.
- **Failures use result records, not exceptions**: every `*Result` record (`UseResult`, `GateResult`, `BreakthroughResult` …) carries a `Failure` enum and an optional `failedResource`, and a normal refusal throws nothing.
- **The client only sends intent**: a new interaction passes only an id and a choice, and the server re-resolves the definition and decides for itself, see [Network Protocol and Server Authority](network.md).
