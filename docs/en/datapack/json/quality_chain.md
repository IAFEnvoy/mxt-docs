---
title: Quality Chain (quality_chain)
description: Orders several qualities into a low-to-high ladder and declares what each upgrade step costs and requires, plus the tier an item falls back to.
aside: false
---

# Quality Chain (quality_chain) {#quality_chain}

File location: `data/<namespace>/mxt/quality_chain/<path>.json`

A chain is a **low-to-high** ladder of qualities. A binding table points at it with `quality_chain`, so three questions are answered in one place: which chain an item belongs to, which tier it falls back to when no component decides, and what one step up costs. The chain also decides **membership** - the tier an item resolves to has to be on the chain, or the item cannot be used.

| Field | Type | Default | Description |
| --- | --- | --- | --- |
| `name` | Text Component | `quality_chain.mxt.<namespace>.<path>` | The chain's display name. When omitted, the default key in the left column is used. |
| `description` | Text Component | `quality_chain.mxt.<namespace>.<path>.description` | The chain's description. When omitted, the default key in the left column is used. |
| `tiers` | Quality id array | **required** | The tiers, low to high. **The array order is the chain order**, unaffected by data pack merge order. |
| `default` | Quality id | the lowest tier | The tier an item falls to when there is neither an override component nor a settled result. |
| `upgrades` | `Step` array | `[]` | The cost and condition of each step: `upgrades[i]` describes the step `tiers[i] → tiers[i+1]`. |

A `Step` has exactly two fields:

| Field | Type | Default | Description |
| --- | --- | --- | --- |
| `costs` | `Cost` array | `[]` | What this step costs, paid through the same transaction ability costs use: `plan` → `commit`, **atomic as a whole**, so a step that cannot be paid moves nothing and writes no tier. |
| `condition` | `EntityCondition` | `mxt:always` | Whether this step may be taken. Checked before anything is paid. |

`tiers` and `default` are both entry references: when a definition they name is not in the registry (its file was deleted, or `neoforge:conditions` keeps it out), the chain file itself fails to decode. That is not "this family has no default tier" - the whole chain cannot be read at all.

A `Step.costs` entry that fails to decode is never silently dropped.

```json
{
  "tiers": ["example:common", "example:refined", "example:flawless"],
  "default": "example:common",
  "upgrades": [
    { "costs": [{ "id": "example:qi", "amount": 20 }] },
    { "costs": [{ "id": "example:qi", "amount": 60 }], "condition": { "type": "mxt:always" } }
  ]
}
```

## Conventions {#rules}

- **An undeclared step cannot be taken.** When `upgrades` is shorter than `tiers` (or omitted entirely), an upgrade along those later steps is refused (`NO_STEP`) instead of being treated as free. A chain used only for ordering needs no `upgrades` at all.
- **One step at a time.** [`/quality upgrade`](/en/player-guide/commands/quality) and the script-side [MxtQuality](/en/kubejs/api/quality) both push an item exactly one tier up, paying that step's own declared cost; skipping tiers means taking the steps one by one.
- **Validated while loading**: `tiers` must be non-empty without duplicates, `default` has to be one of `tiers`, and `upgrades` may hold at most `tiers.size() - 1` entries. A mistake is refused while the pack loads instead of quietly doing nothing later.

## How a Quality Is Resolved {#resolution}

A stack's quality is the first of these that answers, in this order:

1. An `mxt:item_quality` **override component** on the stack - what [`/quality set`](/en/player-guide/commands/quality) and `MxtQuality.set` write;
2. the tier recorded by the stack's forge result `mxt:forging_result`;
3. a **definition default**: `quality` on an [artifact](./artifact.md) or a [technique](./technique.md);
4. the **chain's `default`** for the chain this stack belongs to;
5. the `quality` a matching [spirit herb](./spirit_herb.md) declares.

The chain itself comes from a binding table's `quality_chain` (see [Item Binding](./item_binding.md), [Weapon Binding](./weapon_binding.md), [Pill Binding](./pill_binding.md) and [Technique Binding](./technique_binding.md)). When no binding declares one, the chain is looked up as the single chain holding that tier; when several chains hold it, an upgrade is refused rather than guessed for you. An item whose resolved tier is not on the chain cannot be used (`QUALITY_CHAIN`).

## Related

- The tiers themselves: [quality](./quality.md).
- Upgrading: [`/quality`](/en/player-guide/commands/quality) and [MxtQuality](/en/kubejs/api/quality).
- Forging keeps a ladder of its own on the blueprint, [`quality_by_extra_steps`](./forging_blueprint.md), which has nothing to do with chains: that curve reads extra steps.
