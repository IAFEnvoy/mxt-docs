---
title: Damage Pipeline
description: "How MiXianTu computes every hit it deals: the attacker-side shaping layer, the defender-side reduction layer, element relations and mastery multipliers."
---

# Damage Pipeline

Every hit MiXianTu itself deals goes through one path, `DamageCalculationService`. It turns "who hit whom with what" into "how much the target really loses" in two layers, each of which only reads data belonging to its own side of the exchange.

| Layer | Where it runs | What it reads |
|-------|---------------|---------------|
| Shaping (attacker side) | The moment the hit is dealt | The value the definition wrote × the `damage_multiplier` this cast carries × the attacker's spirit-root `overcomes` relation against the target's element |
| Reduction (defender side) | When the target receives the damage (`LivingIncomingDamageEvent`) | The target's spirit-root `adapted_to` relation against the attacker's element |

Shaping has to run where the hit is dealt, because only there are the caster, the target and the ability being cast known at once. Reduction has to run on the receiving side, because only there is **every** incoming hit visible — another mod's, a vanilla fall, a mob's swing — and because "what am I adapted to" is a property of the target rather than of the attack. The two never apply twice: the reduction layer hangs on an event that fires exactly once per damage sequence, whoever dealt it.

## What Goes Through It

- `mxt:damage` (entity action): damages the entity it applies to and is **unowned**, so no element relation and no attribution apply — the right shape for recoil, pill toxicity and environmental ticks. The mastery multiplier is a separate question: it says what *this cast* is worth, so it still applies to damage a scaled cast deals to its own caster. When the action lands on somebody other than the caster (nested under `mxt:target_action`, `mxt:passenger_action`, …), the caster is credited and the element edges are read.
- `mxt:damage_target` (bi-entity action): credits the actor as the attacker, so kill credit and aggro go to them, and both layers apply.
- Formation `attack` module: `attribute_to_owner` decides whether the owner is the attacker; a declared `damage_type` is used as written, otherwise the source falls back to the vanilla player/mob attack.
- `mxt:explode` (entity action): every per-entity blast damage is shaped, and the caster is recorded as the explosion's cause.

Damage that vanilla settles itself skips the shaping layer, because the amount is not computed here: `mxt:lightning` and the block form of `mxt:explode` have no attacker to attribute to at all, while a projectile spawned by `mxt:spawn_projectile` records the caster as its owner but still leaves its impact damage to vanilla. All of them still pass the reduction layer, and the projectile case even carries an element, since the attacker is known.

## Attribution and Damage Types

`DamageCalculationService.source(...)` is the one place a source is built. A declared `damage_type` is used verbatim with the attacker recorded as the cause. Without one, an attributed hit uses vanilla's `playerAttack` / `mobAttack`, which means kill credit goes to the attacker and — for a player victim only — vanilla's difficulty scaling applies. Write a `damage_type` when you want a source whose damage does not move with the difficulty.

## What Feeds the Two Layers

- **Element relations** come from the spirit roots of both sides: see [Element](./json/element.md). A relation may be worth any finite, non-negative multiplier, and every matching edge multiplies.
- **Mastery** comes from the level the caster stands on in a chain that grants the ability being cast: see [Skill Stage](./json/skill_stage.md). It is exposed to the cast as the formula value `damage_multiplier`, so a pack may read the same number in its own formulas.

## What Is Not Part of It

- There is no mapping from a damage type to an element: an element is read from the roots of the two entities, never inferred from the damage type of a hit.
- Artifacts (`item_archetype`) contribute no attack or defence numbers of their own; they reach combat through the abilities they grant and the attributes they carry.
- Damage the framework never shaped still passes the reduction layer, so adaptation is a property of the entity rather than of this mod's attacks.

::: tip Trying it in game
The test module ships `/mxt_test damage`, which drives both layers against throwaway entities with known element edges and reports whether the amounts it measured are the ones it expected.
:::
