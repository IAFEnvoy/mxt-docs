---
title: Quality (quality)
description: One tier of quality — its name, colour and three modifiers, plus where it sits on the ladder, what names that ladder, and what one step up costs.
aside: false
---

# Quality (quality) {#quality}

File location: `data/<namespace>/mxt/quality/<path>.json`

One `quality` is one tier. What it is called is for the interface to show; `value_multiplier` / `forging_modifier` / `alchemy_modifier` are what the economy, forging and alchemy settlements read. A tier is also one link of a quality ladder: `next` points at the tier above it, and `quality` is that ladder's name, written on the entry tier.

| Field | Type | Default | Description |
| --- | --- | --- | --- |
| `name` | Text Component | `quality.mxt.<namespace>.<path>` | The tier's name. |
| `description` | Text Component | `quality.mxt.<namespace>.<path>.description` | The tier's description, drawn under its name. |
| `color` | Color | none | The tier's colour, written as `#RRGGBB` (an integer or an `[r,g,b]` float array is accepted too); always treated as opaque. |
| `value_multiplier` | `Modifier` | `1` | Currency value modifier. |
| `forging_modifier` | `Modifier` | `1` | Forging modifier. |
| `alchemy_modifier` | `Modifier` | `1` | Alchemy modifier. |
| `condition` | `EntityCondition` | `mxt:always` | The condition for using this tier. |
| `next` | `quality` id | none | The tier above this one, that is the tier one step up targets; omitted on the highest tier. |
| `upgrade_costs` | `Cost` array | `[]` | What it costs **to reach this tier** (written on the target tier), through the same transaction abilities use: `plan` → `commit`, **the whole group atomically**, so a refused payment moves nothing and writes no tier. |
| `upgrade_condition` | `EntityCondition` | `mxt:always` | Whether the step **into this tier** may be taken, asked before anything is paid. |
| `quality` | Identifier | none | The ladder's name, **written on the entry tier** (the entry tier is the one nothing writes as its `next`). The name is read from the entry tier alone, so writing it on another tier does not name the ladder. |

Both `name` and `description` may be omitted: omitting one uses the key generated from the entry id in the table above, writing one uses your own text (a bare string is a translation key, an object is a full component).

A `condition` that does not pass makes the item unusable: use, attack, the main-hand weapon's periodic behaviour and the vanilla attribute modifiers it grants all stop.

`color` does not follow the two text fields: **when it is written it wins** (it even overrides a colour inside a `name` component), and **when it is omitted nothing changes at all**. It is not "white by default", so a tier without a colour still draws in the vanilla rarity colour. Only four places are tinted: the item-name line of the tooltip, the `Quality: <name>` line inside it, the entries of the quality category in `/picker`, and the tier table of a forging blueprint's tooltip. A player can still turn the name line off in the client config ("Tooltip → tint the item name with its quality", on by default); the other three are unaffected. The description line is always grey.

`Modifier` is three optional objects, and inside each one both `description` and `modifier` may be omitted: an omitted `modifier` means `1`, an omitted `description` means **that line is simply not drawn** (the modifier still applies). Its text is entirely the pack's own, nothing is generated:

```json
{
  "value_multiplier": {
    "description": "quality.mxt.example.refined.value_multiplier",
    "modifier": 1.25
  },
  "forging_modifier": {
    "modifier": "1 + level * 0.01"
  }
}
```

The entry above omits `name`, `description` and `forging_modifier.description`.

At settlement, `value_multiplier` multiplies the item's currency denomination by `modifier` and rounds to a whole number, so **what you see is what you pay** (the tooltip shows the settled value too). A `modifier` that is missing, non-finite or ≤ 0 counts as 1; a product that is non-finite, below 1 or beyond `long` falls back to the declared denomination rather than inventing a number the pack never wrote.

At settlement, `forging_modifier` looks the quality tier up with `effective extra steps = actual extra steps ÷ modifier`, so > 1 means the same technique reaches a better tier. The value comes from the materials **locked in by that session**: with several materials the lowest tier among them is used, and materials with no resolved quality are skipped. A `modifier` of 1 changes nothing.

At settlement, `alchemy_modifier` decides the brewing duration as `duration = declared duration ÷ (material-side modifier × core-side modifier)`, so > 1 brews faster, and the result is written into the session snapshot. It is taken twice: **as a material** it is the lowest tier among the ingredient stacks **at the moment the batch is lit** (again the lowest, skipping the ones without a quality); **as the furnace core's own tier** it shortens every recipe that furnace brews (counting as `1.0` when the core has no tier). It takes no part in the temperature ceiling, and no `alchemy_modifier` formula can read `furnace_rank`.

## The quality ladder {#ladder}

Where a tier sits is not written anywhere else: each tier points at the tier above with `next`, and the order, the entry and the ladder's identity are all walked out of those links at runtime. The ladder's name is the `quality` field, **written on the entry tier**:

```json
// data/example/mxt/quality/common.json
{
  "quality": "example:pill",
  "next": "example:refined"
}

// data/example/mxt/quality/refined.json
{
  "next": "example:flawless",
  "upgrade_costs": [{ "id": "example:qi", "amount": 20 }]
}

// data/example/mxt/quality/flawless.json
{}
```

- All three tiers belong to one ladder, `example:pill`: the name is written on the entry tier `common`, and the runtime carries it along `next` to `refined` and `flawless`. Renaming the ladder means editing that one place.
- **The entry tier is automatically the one nothing points at** (here `common`). It decides the ladder's order only and **supplies no default tier to an item that has none**; a ladder therefore needs no `default`, and its lowest tier needs no `next`.
- **The name is read from the entry tier alone.** Write `quality` on a middle tier instead and the entry tier has no name, so **the whole ladder has no name** (`/quality chain` shows `null`). This is **not an error**: the copy on the middle tier only takes part in the "one tier receives two different names" check below.
- **A step's price and condition belong to the tier it steps into.** `common → refined` reads `refined`'s `upgrade_costs` and `upgrade_condition`. Written on the source tier they mean "step into itself", and nothing can step into the entry tier, so that price is never charged — the step is in fact free, and again **no error is reported**.
- **To make a tier the top, leave `next` out.** A tier that writes `next` without `upgrade_costs` still has that step; its cost is simply an empty array. The other way round, a tier with no `next` that still writes `upgrade_costs` or an `upgrade_condition` other than `mxt:always` is reported, because that data could never be read.
- **A ladder is a straight line.** A tier writes one `next`, so every tier has at most one tier above it; **two tiers naming the same `next`** (a fork) is reported, naming the tier and both tiers it follows — after a fork there is no single answer to "what is below this tier", so **every line running into the fork point is left out of the index whole** (no line is picked by registry order), the same way a cycle is treated. **A `next` pointing at a tier the pack does not provide is not "the ladder is left out" but a failed data pack load** (the world refuses to load), so that path never reaches runtime. The tier above and the tier below are both looked up in the walked order, so the two directions are symmetric.
- **One name per ladder.** A tier that receives two different names (its own plus one from the tier above it) is reported, and so is a cycle or a chain that cannot be reached from its start (`/reload` runs the check again).
- **A tier on no ladder still works**: one tier with neither `next` nor `quality` stands alone, shows its name, and is read by a `mxt:quality` component as well as the three modifiers, but it has no order and cannot be climbed.

::: tip Two things share the name
`quality` is the **field on a tier** (the ladder's name, a plain string); `mxt:quality` is the **component on an item** (a whole quality object). The two names look alike, but they are not the same thing.
:::

## Which tier an item is {#resolution}

A stack's tier is the **first answer it can get**, in a fixed order. There are **three layers**, first hit wins.

**Layer one, the `mxt:quality` component on the stack** (a whole quality object). Every writer stamps it: [`/quality set`](/en/player-guide/commands/quality) and [MxtQuality](/en/kubejs/api/quality), a successful `upgrade`, and both a **Forge Table settlement** and a **talisman inscription**. It is read back through the registry, so an id the current pack no longer provides answers nothing and the stack falls through instead of keeping a dead tier.

**Layer two, the definition the stack itself carries**, declaring its own tier in an optional `quality` field. Several definitions of one type share a single built-in item — every technique manual is `mxt:cultivation_jade_slip`, every pill is `mxt:pill`, every furnace specification is the block item `mxt:alchemy_furnace`, the spirit-root stone is `mxt:spirit_root`, the physique stone is `mxt:physique` — so the item cannot say which tier applies; only the definition on the stack can. To read that field off a stack the definition type needs a registered carrier component (the mod registers its own when the class loads; an addon registering one of its own belongs to another page). Nine definitions declare `quality`, each read through a registered carrier:

| Definition | Carrier component |
| --- | --- |
| `technique` | `mxt:technique`, the value being the definition itself |
| `alchemy_furnace` | `mxt:alchemy_furnace`, the value being the definition itself |
| `alchemy_wall_material` | `mxt:alchemy_wall_material` |
| `spirit_root` | `mxt:spirit_root` |
| `physique` | `mxt:physique` |
| `pill` | `mxt:pill`, the component is a record and the definition sits inside it under `pill` |
| `formation` | `mxt:formation_plate`, the definition under `formation` |
| `secret_realm` | `mxt:secret_realm_token`, the definition under `realm` |
| `contract_type` | `mxt:contract_scroll`, the definition under `contract_type` |

When the current pack no longer provides that tier (the definition was deleted, or the reference is unbound) this layer answers nothing and resolution falls through.

`spirit_root` and `physique` have no free-text tier field: their tier is this optional `quality` reference, and there is no `mxt.rarity.<value>` key to look a tier up by text. A tier is listed under its own name.

**Layer three, the [default_quality](./default_quality.md) registry** (its entries claim items through `items` and name the tier in `quality`). It is the **third and last layer**, and it is the answer exactly when the stack **has no definition to ask**: a bare creative or `/give` item, and the definitions claimed **by item** — `artifact` and `spirit_herb` are in force as soon as an item matches, and the stack carries no identity component to ask.

Three definitions deliberately have no `quality` field:

- `artifact` and `spirit_herb` are claimed **by item** (one item matches one definition) and the stack carries no identity component, so there is nothing on it to ask. Their tier is written in `default_quality`, which is exact while one item means one definition.
- A `talisman`'s carrier component `mxt:talisman` holds a **list** of inscriptions, so one stack may carry several talismans and there is no single definition to ask. Its tier is settled by the drawing recipe's `grades[].quality` and stamped into the `mxt:quality` component at inscription; only when that writes nothing does it fall back to `default_quality`.

**List-valued carriers are not registered at all**: `mxt:forging_methods`, `mxt:forging_blueprints`, `mxt:element` and `mxt:talisman` — a list cannot answer which tier a stack is.

The ladder follows the tier the stack resolves to: a ladder is named on the tier itself, so neither a binding table nor a component has to declare one. When all three layers answer nothing, the stack simply **has no quality**; no ladder's entry tier is supplied for it.

After `/quality clear` removes the component the stack falls back to the tier of **the definition it carries**, and only then to the registry. The effect fields on the `mxt:pill` component (`on_consume`, `toxicity_gain` and the rest) only rewrite what that stack does when it is taken and never change which tier it is: the tier comes from the `quality` of the definition inside it under `pill`.

**Three things that look like a default tier but are not:**

- `forging_blueprint.quality_by_extra_steps[].quality` — the **target tier** on the forging curve, looked up by extra steps;
- `grades[].quality` in a drawing recipe — the **target tier** hit by completion, written into the component at inscription;
- the `quality` field of a `quality` entry itself — that one is the **ladder's name**, written on the entry tier.

None of the three takes part in which tier a stack is.

## Filtering items by tier {#gating}

Three entry points share one requirement, and two slots are still hard checks: `quality` (a membership test over entries, `#tags` or an array) and `min_quality` (**at least this tier**). `min_quality` compares positions on **the chain that tier is on** (the same implementation as upgrading and `/quality chain`), and **answers no across chains** — positions on different chains mean nothing to each other; giving both means both have to hold; giving only `min_quality` means **an item with no tier answers no**. A requirement that gives neither is **refused at load** (an empty requirement would silently always pass). The check has one implementation; the three entry points only differ in how the requirement is attached:

1. **The item condition `mxt:item_quality`** (`quality`, plus the new optional `min_quality`): works anywhere an item condition runs, such as `unavailable_when` of a currency entry or `conditions` of a binding; see [Item Conditions](/en/datapack/types/condition/item_condition_types).
2. **The matcher entry `mxt:quality`** (`items` is required, plus the two fields above): works anywhere an [ItemMatcher](/en/datapack/types/other/item-matcher) is accepted — `mxt:item` inside a `Cost`, the `items` of `artifact` / `pill_binding` / `technique_binding` / `spirit_herb`, the `mxt:item_matcher` / `mxt:item_id` / `mxt:item_tag` conditions, the seeds of a spirit herb, and the picker.
3. **The custom ingredient `mxt:quality`** (`neoforge:ingredient_type`, plus `items` and the two fields above): **works anywhere a vanilla `Ingredient` does** — vanilla and other mods' recipes, spirit crafting, talisman drawing, the `mxt:ingredient` condition, the `input` of a [forging blueprint](./forging_blueprint.md) (that entry is a sized ingredient), and the `paper` of a [drawing recipe](./talisman_drawing.md) (that one is an ingredient); see [Spirit Crafting Recipes](./spirit_crafting.md).

One narrow path exists for "material entries" only: the matcher entry [**`mxt:ingredient`**](/en/datapack/types/other/item-matcher#mxtingredient) puts a whole vanilla ingredient — `mxt:quality` included — anywhere an `ItemMatcher` is accepted, which is how the drawing's paper cost carries an ingredient at all.

An alchemy formula also carries two fields on the machine side, not in an item's own matcher entries: [`furnace_quality`](./alchemy_recipe.md) requires a tier of the **furnace core**, and [`input_quality`](./alchemy_recipe.md) requires one of **every non-empty item** in the input stores, slot by slot (main, auxiliary and catalyst materials all count; walls and the multiblock structure never look at quality). The two share one shape, both need at least one field written, an empty object is refused, and falling short refuses the start without spending materials or touching the heat block. The core's tier is also readable inside the recipe's own formula fields as **`furnace_rank`** (the potency formulas and any `alchemy_modifier` formula cannot read it), and the core tier's own `alchemy_modifier` enters that batch's duration, so a better furnace brews faster.

**Two slots' own predicates still cannot read a tier**: the **alchemy furnace input** (it recognises "claimed by a `spirit_herb` plus that herb's potency"; to filter the materials put in by tier, write the recipe's `input_quality`, which is judged slot by slot when a batch starts rather than being a slot predicate) and the **brush pigment** (`mxt:brush_pigment` tag plus a server option). The **drawing paper slot** was relaxed from a hard item id to the `mxt:talisman_paper` tag (a pack adds its own paper by adding it to the tag), and a rule like "at least this tier" is now written on the **formula's own `paper` field** — that slot answers "is this paper at all" (which the client can answer too), while "does this formula accept it" is decided when a drawing opens.

**The client can answer `min_quality`**: once it is connected to a server it holds the same synchronized quality registry and tags, and the ladder order is walked out of those on its own, so filtering items by tier works on the client too. Only with **no level at all** (in the main menu, say) does the membership half remain the only answer — there is no registry then, so there is no position to compare. Matching that happens on the server (recipes, costs, slots) is unaffected.

The `mxt:component` condition cannot read quality either — it wants `nbt` to be a compound tag compared partially, while quality serializes to a string.

Vanilla tags take no part in quality resolution: the `group/<name>` tag is not read. `tooltip_order` only decides **the order tiers are listed in** — the picker's quality category follows it, with the tiers the tag names first in the tag's own order and every other tier after them; it takes no part in quality resolution and does not change a ladder. `color` only affects the places that draw a tier's name, and takes no part either.

## Names and translation {#translation}

The category is the registry's own path: `example:refined` looks up `quality.mxt.example.refined`, and its description adds `.description` (**the registry namespace is still `mxt`**). Among the registries that carry their own `name` / `description`, quality is the one that has its `description` drawn (under the name); the others are only stored and read, and nothing draws them. There is no `translation_key` field in the JSON; a `/` in the path stays in the key like every other registry.
