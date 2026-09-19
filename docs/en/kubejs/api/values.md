---
title: "MxtValues: Script Providers"
---

# `MxtValues`: Script Providers

## Registering a Script Provider

| Method | Callback parameters | Return value | Purpose |
| --- | --- | --- | --- |
| `number(id, callback)` | `(context: FormulaContext, params: object)` | Finite `number` | `mxt:js` number provider. |
| `resourceValue(id, callback)` | `(holder: ResourceHolderAttachment, resource: Holder<Resource>, context: FormulaContext, params: object)` | Finite `number` | `mxt:js` resource value provider. |

### `FormulaContext`

Every callback that receives a formula context uses the same object: `MxtValues.number`, `MxtValues.resourceValue`, and the `mxt:js` action and condition callbacks. It exposes:

| Method | Description |
| --- | --- |
| `context.value(name)` | Reads a variable: an explicit context value first, then the built-in variable registry. A name the context cannot provide is reported — a development environment logs the whole error, production logs one warning line per distinct message — and returns `0`. |
| `context.explicit(name)` | The explicit value alone, or `NaN` when the context carries none. Use it to test whether the current event supplied a payload without asking the variable registry. |
| `context.contains(name)` | Whether the context can provide the name right now. This never reports anything and never throws. |
| `context.variables()` | The explicit values only: event payloads and anything a caller added. Entity and resource variables are read out of the context objects on demand and are not listed here. |
| `context.player()` | Returns the current player, or `null` when there is none. |
| `context.caster()` | Returns the acting entity, or `null` in a context built without one. |
| `context.target()` | Returns the second entity of a bi-entity formula, or `null`. |
| `context.resource()` | Returns the cultivation state bound to this evaluation, or `null` in a formula that is not tied to one resource. |
| `context.random()` | Returns the authoritative random source used by this evaluation. |

Formula variables are built in: a script can read every name listed in [Formula Variables](../../datapack/types/formula_variables.md), but it cannot register a new one.

In `resourceValue`, `holder` is the resource attachment and `resource` is the resource holder; they are normally used read-only, for example `holder.get(resource)`. Do not use this callback to write state.

## Evaluation

| Method | Parameters | Return value | Description |
| --- | --- | --- | --- |
| `evaluateNumber(entity, definition)` | `Entity`, number provider object | `number` | Evaluates any registered provider. A non-finite result returns `0`. |
| `evaluateResource(entity, resource, definition)` | `LivingEntity`, resource ID, resource value provider JSON | `number` | Evaluates the value of the given resource. An entity-aware provider reads the environment/actual aura at the current position. |

A definition is decoded once per distinct JSON text and then reused, because decoding builds the whole provider tree including its expressions. A script that evaluates the same definition every tick therefore parses it once. The decoded values are dropped when the world's registries change, and a definition a script has edited into a different JSON text is decoded again.

```js
const levelScaled = MxtValues.evaluateNumber(player, {
  type: 'mxt:expression',
  expression: 'level * 2 + 1'
})
const actualAura = MxtValues.evaluateResource(player, 'mxt:spirit_power', {
  type: 'mxt:actual_concentration'
})
```
