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
| `color` | Color | none | The tier's colour, either `"#RRGGBB"` or an integer. |
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

At settlement, `alchemy_modifier` decides the brewing duration as `duration = declared duration ÷ modifier` (> 1 brews faster). The value comes from the ingredient stacks in the cauldron **at the moment it is lit**, again the lowest tier, skipping the ones without a quality, and the result is written into the session snapshot.

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
- **A ladder is a straight line.** A tier writes one `next`, so every tier has at most one tier above it; **two tiers naming the same `next`** (a fork) is reported, naming the tier and both tiers it follows — after a fork there is no single answer to "what is below this tier", so it belongs to the line that was walked first. The tier above and the tier below are both looked up in the walked order, so the two directions are symmetric.
- **One name per ladder.** A tier that receives two different names (its own plus one from the tier above it) is reported, and so is a cycle, a pointer at an entry that does not exist, or a chain that cannot be reached from its start (`/reload` runs the check again).
- **A tier on no ladder still works**: one tier with neither `next` nor `quality` stands alone, shows its name, and is read by a `mxt:quality` component as well as the three modifiers, but it has no order and cannot be climbed.

::: tip Two things share the name
`quality` is the **field on a tier** (the ladder's name, a plain string); `mxt:quality` is the **component on an item** (a whole quality object). The two names look alike, but they are not the same thing.
:::

## Which tier an item is {#resolution}

A stack's quality is taken as the **first one it can get**, in a fixed order:

1. the `mxt:quality` **component** on the stack (a whole quality object) - what [`/quality set`](/en/player-guide/commands/quality) and [MxtQuality](/en/kubejs/api/quality) write, and what a successful `upgrade` writes too;
2. the tier recorded by the forge result `mxt:forging_result` on the stack;
3. the **definition default**, asked in order: `quality` on an [artifact](./artifact.md), the tier the inscriptions on a talisman carrier declare, `quality` on a [technique](./technique.md), and `quality` on an [alchemy furnace](./alchemy_furnace.md);
4. the `quality` a matching [spirit herb](./spirit_herb.md) declares.

The ladder follows the tier the stack resolves to: a ladder is named on the tier itself, so neither a binding table nor a component has to declare one. When none of the four answers, the stack simply **has no quality**; no ladder's entry tier is supplied for it.

To gate on a tier, use the item condition `mxt:item_quality` (**that is the condition; the component is `mxt:quality`**): its `quality` accepts entries, `#tags` or an array (at least one; an empty list is refused at load), and it reads the result of the four steps above. An item that resolves to no tier at all answers no rather than falling back to the lowest one.

Vanilla tags take no part in quality resolution: the `group/<name>` tag is not read and neither is `tooltip_order`, and nothing in the interface sorts by quality order, so it is not an ordering input. `color` only affects the places that draw a tier's name.

## Names and translation {#translation}

The category is the registry's own path: `example:refined` looks up `quality.mxt.example.refined`, and its description adds `.description` (**the registry namespace is still `mxt`**). Among the registries that carry their own `name` / `description`, quality is the one that has its `description` drawn (under the name); the others are only stored and read, and nothing draws them. There is no `translation_key` field in the JSON; a `/` in the path stays in the key like every other registry.
