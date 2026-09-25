---
title: Quality Chain (quality_chain)
description: "Chains several item qualities into a low-to-high ladder and declares the default tier and the cost and condition of each upgrade step, through the mxt:quality_chain datapack registry."
aside: false
---

# Quality Chain (quality_chain)

A quality chain orders several [item qualities](./quality.md) from low to high and answers three questions in one place: which chain an item belongs to, which tier it falls back to when nothing else decides, and what one step up the ladder costs. A binding table points at a chain with `quality_chain`, and the chain also decides **membership** - a tier an item resolves to has to be on the chain, or the item cannot be used.

::: warning Marked for possible removal

`QualityChain` carries a `//TODO::May be removed`. It lifted ordering, the default tier, membership and the cost of each step out of a set of vanilla tags and into a registry of its own; if that ladder ever moves back into `quality` itself (or into the binding tables), it goes away together with `QualityChainService`, the `quality_chain` field of the four binding tables, the per-step settlement of `/quality upgrade` and the script-side `MxtQuality.upgrade`. **Declaring one is fully supported today** — just do not treat it as a foundation that cannot move.

:::

## File Location

Quality chain JSON files go in `data/<namespace>/mxt/quality_chain/` within your data pack.

**Purpose**: A low-to-high ladder of qualities with its default tier and the cost and condition of every upgrade step. **Marked as possibly removable.**

The filename corresponds to its ID. For example, `data/example/mxt/quality_chain/pellet.json` has the ID `example:pellet`.

## Fields

| Field | Type | Default | Description |
|-------|------|---------|-------------|
| `name` | Text Component | `quality_chain.mxt.<namespace>.<path>` | The chain's display name. When omitted it is the default key in the previous column. |
| `description` | Text Component | `quality_chain.mxt.<namespace>.<path>.description` | The chain's description. When omitted it is the default key in the previous column. |
| `tiers` | `Holder<quality>[]` | **required** | The tiers, low to high. **The array order is the chain order** (data pack merge order does not affect it); it must not be empty and must not repeat a tier. |
| `default` | `Holder<quality>` | the lowest tier | The tier an item falls to when there is neither an override component nor a settled result. It must be one of `tiers`; a tier disabled by `mxt:disabled` cannot be the default - in that case the family has no default tier rather than silently sliding down. |
| `upgrades` | `List<Step>` | `[]` | The cost and condition of each step: `upgrades[i]` describes `tiers[i]` to `tiers[i+1]`. |

A `Step` has exactly two fields:

| Field | Type | Default | Description |
|-------|------|---------|-------------|
| `costs` | `Cost[]` | `[]` | What this step costs, paid through the same transaction abilities use: `plan` then `commit`, **atomic as a whole**, so a step that cannot be paid moves nothing and writes no tier. A failed decode is never silently dropped. |
| `condition` | `EntityCondition` | `mxt:always_true` | Whether this step may be taken; checked before anything is paid. |

## Conventions

- **An undeclared step cannot be taken.** When `upgrades` is shorter than the ladder (or omitted entirely), those later steps are refused rather than treated as free. A chain used purely for ordering needs no `upgrades` at all.
- **One step at a time.** [`/quality upgrade`](/en/player-guide/commands/quality) and the script-side [MxtQuality](/en/kubejs/api/quality) both move an item exactly one tier up, paying that step's own declared cost; skipping tiers means taking several steps.
- **Validated while loading**: `tiers` must be non-empty without duplicates, `default` must be one of them, and `upgrades` may hold at most `tiers.size() - 1` entries. A mistake is refused while the data pack loads instead of quietly doing nothing later.

## Example

```json
{
  "tiers": ["example:common", "example:refined", "example:flawless"],
  "default": "example:common",
  "upgrades": [
    { "costs": [{ "id": "example:qi", "amount": 20 }] },
    { "costs": [{ "id": "example:qi", "amount": 60 }], "condition": { "type": "mxt:always_true" } }
  ]
}
```

## How a Quality Is Resolved {#resolution}

A stack's quality is the first of these that answers:

1. An `mxt:item_quality` **override component** on the stack, which [`/quality set`](/en/player-guide/commands/quality) and `MxtQuality.set` write;
2. the tier recorded by a forge result (`mxt:forging_result`) on the stack;
3. a **definition default**: `quality` on an [artifact](./artifact.md) or on a [technique](./technique.md);
4. the **chain's `default`** for the chain this stack belongs to;
5. the `quality` a matching [spirit herb](./spirit_herb.md) declares.

The chain itself comes from the binding table's `quality_chain` (see [Item Binding](./item_binding.md), [Weapon Binding](./weapon_binding.md), [Pill Binding](./pill_binding.md) and [Technique Binding](./technique_binding.md)). When no binding declares one, the chain is the single one holding that tier; if several chains hold it, an upgrade is refused instead of guessing.

## Related Formats

- The tiers themselves are [quality](./quality.md) entries.
- Upgrading: [`/quality`](/en/player-guide/commands/quality) and [MxtQuality](/en/kubejs/api/quality).
- Forging keeps its own ladder on the blueprint ([`quality_by_extra_steps`](./forging_blueprint.md)), which reads extra steps rather than a chain.
