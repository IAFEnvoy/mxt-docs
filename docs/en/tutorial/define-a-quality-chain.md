---
title: Define a Quality Chain
description: "A ladder of item tiers from low to high: where the ladder's name goes, how the entry tier is found, and which tier carries the price and condition of the step up."
---

# Define a Quality Chain

A quality tier is one file at `data/<namespace>/mxt/quality/<path>.json`, in the `mxt:quality` registry. A tier says four things: what it is called and how it is drawn; which tier sits above it (`next`); what the step up costs and requires (`upgrade_costs` / `upgrade_condition`); and which ladder it belongs to (`quality`).

The order of the tiers is written nowhere else. No table holds the ladder on its own: the runtime walks `next` once and gets a straight line.

| Field | Default | What it does |
| --- | --- | --- |
| `name` | `quality.mxt.<namespace>.<path>` | The tier's display name. |
| `description` | That same key plus `.description` | The line under the name; drawn only when non-empty. |
| `color` | none | Tints the name, written as `#RRGGBB` (an integer or an `[r,g,b]` float array is accepted too); always treated as opaque. |
| `value_multiplier` | `1` | Multiplies the item's currency value. |
| `forging_modifier` | `1` | Divides the extra steps forging reads. |
| `alchemy_modifier` | `1` | Divides the brewing duration. |
| `condition` | `mxt:always` | Whether an item of this tier can be used. |
| `next` | none | The id of the tier above; the top tier leaves it out. |
| `upgrade_costs` | `[]` | What the step up costs. |
| `upgrade_condition` | `mxt:always` | What the step up requires. |
| `quality` | none | The name of the ladder, written on the entry tier. |

Every field is optional. The three modifiers share one shape, `{"description": …, "modifier": …}`: `modifier` is a number or a formula string and defaults to `1`, and `description` gets its own line in the item tooltip only when you write one — leaving it out does not stop the modifier from working. A modifier that is not a finite positive number is treated as `1`.

`condition` is the same gate a binding uses: while it fails, the item cannot be used. The full field list is in [Quality](../datapack/json/quality.md).

## What You Are Building

| File | Purpose |
| --- | --- |
| `data/example/mxt/quality/common.json` | The lowest tier, which is the entry of this ladder; the ladder's name goes here. |
| `data/example/mxt/quality/refined.json` | The middle tier; the price and the modifier of the step up from `common` go here. |
| `data/example/mxt/quality/flawless.json` | The top tier, with no `next`. |

The price is paid in `example:qi`, which already has a `resource/qi.json` in [Define Aura and Realms](./define-aura-and-realms.md); the item carrying the tiers is the KubeJS-registered `kubejs:qi_pill` from [Create Items and Bind Actions with KubeJS](./create-items-with-kubejs.md).

## Step 1 — Three Tiers

```json
// data/example/mxt/quality/common.json
{
  "quality": "example:pill",
  "next": "example:refined"
}
```

```json
// data/example/mxt/quality/refined.json
{
  "next": "example:flawless",
  "upgrade_costs": [{"id": "example:qi", "amount": 20}],
  "value_multiplier": {
    "description": "quality.mxt.example.refined.value",
    "modifier": 1.25
  }
}
```

```json
// data/example/mxt/quality/flawless.json
{}
```

- `next` points at the tier above, so walking `next` upwards reads `common` → `refined` → `flawless`.
- `flawless` is an empty object: the top tier leaves `next` out and gets neither a name nor modifiers here.
- `{"id": …, "amount": …}` inside `upgrade_costs` is the shorthand for a `mxt:resource` cost; the long form with a `type` works too.
- A modifier sits on the tier it settles with: `refined`'s `value_multiplier` multiplies the currency value of its items by `1.25`, and its own `description` decides whether that extra tooltip line is drawn. `common` and `flawless` declare no modifiers, so both behave as `1`.

## Step 2 — The Ladder's Name Goes on the Entry Tier

The entry tier is **the one nothing writes as its `next`**. Of the three above, nothing points at `common`, so `common` is the entry. The ladder's name is the `quality` field, written on the entry tier, and it follows `next` to every tier of the ladder: here all three belong to `example:pill`.

The name is read from the entry tier alone. Move `"quality": "example:pill"` from `common` to `refined` and the entry tier `common` has no name — so **the whole ladder has no name**, and `/quality chain` prints that name as `null`. The copy on the middle tier only takes part in the "one tier receives two different names" check below. Nothing is reported: no check can tell that you meant to name the ladder.

A ladder's name is just an id, and writing it once per ladder is enough. Only two things about the name are reported:

- A tier whose own name differs from the one it inherits from above reports `names quality <written> inside <inherited>` at load.
- Two entry tiers claiming one name report `starts a second ladder named <name>, which another tier already names`.

## Step 3 — The Price Sits on the Tier You Climb Into

Going from `common` to `refined` reads `refined`'s `upgrade_costs` and `upgrade_condition`: that cost is what "climbing into this tier" takes, so the 20 `example:qi` is written on `refined`, not on `common`.

On the source tier it never applies, and nothing is reported: `common`'s `upgrade_costs` would mean "climbing into `common` itself", and no tier climbs into an entry tier. That cost is never collected, so the step is in practice free.

- A tier with no `upgrade_costs` makes the step into it free; an empty array is free too.
- To make a tier the top, leave its `next` out. A tier that writes `next` without `upgrade_costs` still has that step, at an empty price.
- A tier with no `next` that writes `upgrade_costs` or an `upgrade_condition` other than `mxt:always` reports `declares upgrade_costs or upgrade_condition but no next tier`.
- Upgrading is atomic: when the condition fails or the cost cannot be paid, the stack does not move and no tier is written.

`upgrade_condition` decides whether the step may be walked, and is checked before anything is paid; `condition` decides whether an item of that tier can be used at all.

## Step 4 — Put an Item on the Ladder

A stack takes the **first tier it can get**, in this order:

| Way | How to write it |
| --- | --- |
| The `mxt:quality` component on the stack | `/give @s kubejs:qi_pill[mxt:quality="example:common"]`; `/quality set`, a successful upgrade, a Forge Table settlement and a talisman inscription write this one too. |
| The `quality` the definition the stack carries declares | Whichever component on that item names a definition identity, read for the tier that definition writes itself. |
| The [default_quality](../datapack/json/default_quality.md) data map | Whichever tier the item is given there; a bare creative or `/give` item and the by-item `artifact` / `spirit_herb` definitions take this route. |

Layer 2 answers for "several definitions of a type share one built-in item, so the item cannot say which tier applies": every technique manual defaults to `mxt:cultivation_jade_slip` (a `technique_binding` may name another `carrier_item`), every pill is `mxt:pill`, every furnace specification is the block item `mxt:alchemy_furnace`, the spirit-root stone is `mxt:spirit_root` and the physique stone is `mxt:physique`. The nine definitions declaring `quality` are `technique`, `alchemy_furnace`, `alchemy_wall_material`, `spirit_root`, `physique`, `pill`, `formation`, `secret_realm` and `contract_type`.

The component holds a **whole quality object**, so it decides both the tier and the ladder it belongs to: `example:common` puts that pill on `example:pill`. Binding tables declare no quality, so do not write a ladder into a binding. The forging record `mxt:forging_result` keeps only the blueprint id and the step counts and **never a tier**. This pill is an ordinary KubeJS-registered item with no component on it that names a definition, so only layers 1 and 3 can answer for it. When none of the three layers answers, the pill simply **has no quality** and no ladder's entry tier is supplied for it.

| Command | What it does |
| --- | --- |
| `/quality get [player]` | Shows the tier of the item in the main hand; passing a player needs gamemaster permission. |
| `/quality set <targets> <quality>` | Writes the override component onto the target's main-hand item; needs gamemaster permission. |
| `/quality clear <targets>` | Removes the override component; needs gamemaster permission. |
| `/quality upgrade <targets>` | Walks one step up the ladder; needs gamemaster permission. |
| `/quality chain <quality>` | Draws the whole ladder, with the ladder's name first; needs no permission. |

The top-level alias `/quality` can be switched off in the **Command Aliases** tab of the server configuration; `/mxt quality` keeps working when it is off.

## Step 5 — Load and Validate

Quality is a data pack registry, read once when the world loads, and `/reload` does not read it again. After editing the files, leave to the title screen and open the world again, or restart the server.

```text
(load the world again)
/mxt registries validate          → every problem in one pass
/mxt registries list              → mxt:quality=3
/quality chain example:common     → the whole ladder, named example:pill
/quality get                      → the tier of the item in your main hand
```

`/mxt registries validate` reports every problem at once, and strings only the first 12 together when there are more. The ladder's own problems show up here: a `next` that does not exist, a cycle, a fork, two entries claiming one name.

## Verify

1. Open the world again and check that `/mxt registries validate` reports nothing.
2. `/give @s kubejs:qi_pill[mxt:quality="example:common"]`, then `/quality get`: it shows `common`.
3. `/quality chain example:common`: the name is `example:pill` and all three tiers sit on that one line in order.
4. Holding the pill, run `/quality upgrade @s`: with 20 `example:qi` on you it goes up to `refined`, `/quality get` follows, and the tooltip gains the `value_multiplier` description line; with fewer than 20 it reports that the cost cannot be paid and the tier does not move.
5. `/quality set @s example:flawless` overrides the tier to the top one, and `/quality clear @s` removes the component again. The pill has no entry in `default_quality` and carries no component naming a definition, so after the clear `/quality get` reports that it currently has no quality.
6. Delete `refined`'s `upgrade_costs`, open the world again and upgrade once more: that step costs nothing.

## Common Mistakes

| Symptom | Cause |
| --- | --- |
| The ladder's name prints as `null` | The name was written on a middle tier, so the entry never receives it and the whole ladder is unnamed. **Nothing is reported.** |
| The upgrade never collects its cost | `upgrade_costs` was written on the source tier, so the cost means "climbing into itself", and nothing climbs into an entry tier. That step is in practice free. **Nothing is reported.** |
| `names quality <written> inside <inherited>` | A tier's own name differs from the one inherited from above. |
| `starts a second ladder named <name>, which another tier already names` | Two entry tiers claim one name. |
| `next <id> is not a quality`, followed by `reaches <id>, which is not an entry` | `next` points at an entry that does not exist, and that whole ladder is dropped. |
| `follows both <A> and <B>` | One tier is written as the `next` of two tiers (a fork); reported on the tier being pointed at. The other entry separately reports `joins <id>, which another chain already holds`. |
| `the chain is cyclic at <id>` | A cycle. A pure cycle whose tiers name nothing reports nothing at all — those tiers are simply on no ladder. |
| `declares upgrade_costs or upgrade_condition but no next tier` | A tier has no `next` but writes `upgrade_costs` or an `upgrade_condition` other than `mxt:always`. |
| `cannot be reached from the start of its ladder: it is cyclic, points into another, or names a quality that is already taken` | A tier names a ladder but cannot be reached from its entry. |
| Writing a `chain` field does nothing | `chain` is not a field, so it is silently ignored as an unknown key; `quality` is the only source of a ladder's name. |
| Editing the files changes nothing | Data pack registries are read when the world loads, and `/reload` does not read them again. |

## Next

- [Quality](../datapack/json/quality.md) — every field in full, plus colours, modifiers and the order quality resolves in.
- [Create Items and Bind Actions with KubeJS](./create-items-with-kubejs.md) — put your own items on this ladder.
- [Define Aura and Realms](./define-aura-and-realms.md) — where the number an upgrade spends comes from.
