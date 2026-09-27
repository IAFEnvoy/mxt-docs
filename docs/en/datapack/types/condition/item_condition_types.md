---
title: Item Condition Types
description: Every built-in item condition type registered by the mod, and the JSON fields each type accepts.
---

# Item Condition Types

An **item condition** checks a single item stack and returns `true` or `false`. The holder entity and the stack come from whichever data table declares the condition, so a condition only describes what the stack it is handed has to satisfy.

Item conditions are built-in types with fixed `type` ids, and a data pack can neither add nor remove entries. Every value is listed on this page, all of them in the `mxt` namespace. Custom types take Java or the KubeJS bridge — see the [KubeJS API](../../../kubejs/api-reference.md).

A condition is a JSON object: `type` picks the type, and every other key is a field of that type:

```json
{
  "type": "mxt:item_tag",
  "tag": "minecraft:swords"
}
```

Elsewhere a condition is used as a value, so it usually sits nested under a field such as `item_condition`:

```json
"item_condition": {
  "type": "mxt:relative_durability",
  "comparison": "<=",
  "compare_to": 0.25
}
```

Anywhere an item condition is accepted, an array of conditions is accepted too. The array is shorthand for `mxt:and` and passes only when every entry passes:

```json
"item_condition": [
  { "type": "mxt:item_tag", "tag": "minecraft:swords" },
  { "type": "mxt:relative_durability", "comparison": ">", "compare_to": 0.5 }
]
```

::: info Where It Is Checked
The stack usually comes from the table that declares the condition, for example the `mxt:equipped_item` entity condition or an item action field. Every type that compares numbers uses the same operators: `==`, `!=`, `<`, `<=`, `>`, `>=`.
:::

::: tip Datapack Visual Editor
The [Datapack Visual Editor](https://datapack.mcdev.tech/) lists each type's fields interactively, handy for confirming a field name without digging through the tables here.
:::

## Meta Conditions

Meta conditions do not check the stack itself; they decide how other conditions are evaluated. Their fields are just one `conditions` array or one `condition`.

| Type | Fields | Description |
| --- | --- | --- |
| `mxt:always` | — | Always passes. |
| `mxt:never` | — | Always fails. |
| `mxt:js` | `id`, `params?` | Calls an item condition handler registered through the KubeJS bridge. |
| `mxt:and` | `conditions` | Passes when every nested item condition passes. |
| `mxt:or` | `conditions` | Passes when at least one nested item condition passes. |
| `mxt:not` | `condition` | Negates the nested item condition. |
| `mxt:chance` | `chance` | Passes randomly with the given probability. |

| Field | Type | Default | Description |
| --- | --- | --- | --- |
| `id` | String | **required** | The handler id of `mxt:js`, the one written to `MxtConditions.item(id, callback)`. |
| `params` | JSON object | `{}` | Arguments handed to the handler, which receives them unchanged. |
| `conditions` | Item condition array | **required** | The nested conditions of `mxt:and` / `mxt:or`. |
| `condition` | Item condition | **required** | The nested condition of `mxt:not`. |
| `chance` | Double | **required** | Probability of passing, from `0` to `1`; out of range is a load error. |

An unregistered handler for `mxt:js`, or a callback that throws, counts as failing. `mxt:chance` at `0` never passes and at `1` always passes. The array shorthand is the same thing as `mxt:and`, and it nests to any depth.

`mxt:always` and `mxt:never` have no fields, and `{"type": "mxt:always"}` is the whole condition. An optional condition field left out means `mxt:always`.

## Condition Types

### `mxt:item_id`

Matches the stack's item id.

| Field | Type | Default | Description |
| --- | --- | --- | --- |
| `item` | Item id | **required** | Item registry id. |

```json
{ "type": "mxt:item_id", "item": "minecraft:diamond_sword" }
```

### `mxt:owned_by`

Passes when the stack's artifact owner (the `owner_uuid` of `mxt:artifact_state`) is the current holder. A stack with no owner does not pass.

No fields.

```json
{ "type": "mxt:owned_by" }
```

### `mxt:energy_range`

Checks whether the stored amount of **one named aura** on the stack lies between `min` and `max`, inclusive. One artifact can hold several auras, so this names the one to ask about.

| Field | Type | Default | Description |
| --- | --- | --- | --- |
| `aura` | Aura id or `#` tag | **required** | The one aura to ask about. |
| `min` | Number or formula | **required** | Lower bound, inclusive. |
| `max` | Number or formula | **required** | Upper bound, inclusive. |

```json
{ "type": "mxt:energy_range", "aura": "example:fire_qi", "min": 10, "max": 100 }
```

`min` and `max` are evaluated in the current formula context. If either side fails to produce a finite number, or `min > max`, the condition does not pass.

### `mxt:item_tag`

Matches the stack against a vanilla or data pack item tag.

| Field | Type | Default | Description |
| --- | --- | --- | --- |
| `tag` | Item tag | **required** | Item tag reference. |

```json
{ "type": "mxt:item_tag", "tag": "minecraft:swords" }
```

### `mxt:item_matcher`

Matches the stack against any single matcher entry listed in `items`.

| Field | Type | Default | Description |
| --- | --- | --- | --- |
| `items` | Entry or array of entries | **required** | An item id, an item tag or a typed matcher entry, freely mixed. |

```json
{
  "type": "mxt:item_matcher",
  "items": ["minecraft:apple", "#minecraft:swords", { "type": "mxt:wildcard", "pattern": "*_gem" }]
}
```

`items` accepts a single value or an array, and the array may freely mix item ids, item tags and typed matcher entries. The typed entries are `mxt:item`, `mxt:tag`, `mxt:wildcard`, `mxt:regex`, `mxt:technique` (a technique manual carrying that component), the fieldless `mxt:spirit_storage` (matches every item that can store aura) and `mxt:herb_tag` (a spirit herb carrying the given element or material tag); see [Item Matcher](/en/datapack/types/other/item-matcher#item-matcher-entry-type). It is the most compact way to take in a set of items that no existing tag covers yet. An empty list is refused at load.

### `mxt:amount`

Compares the stack's count.

| Field | Type | Default | Description |
| --- | --- | --- | --- |
| `comparison` | String | **required** | Comparison operator. |
| `compare_to` | Double | **required** | The count to compare against. |

```json
{ "type": "mxt:amount", "comparison": ">=", "compare_to": 16 }
```

### `mxt:fuel`

Compares the stack's furnace burn time.

| Field | Type | Default | Description |
| --- | --- | --- | --- |
| `comparison` | String | **required** | Comparison operator. |
| `compare_to` | Double | **required** | Burn time to compare against, in ticks. |

```json
{ "type": "mxt:fuel", "comparison": ">=", "compare_to": 200 }
```

An item that is not a fuel has a burn time of `0`, so `== 0` still gets an answer.

### `mxt:is_equipable`

Checks whether the stack carries an equippable component.

| Field | Type | Default | Description |
| --- | --- | --- | --- |
| `slot` | Equipment slot name | omitted | Only checks whether the stack's equipment slot is exactly this slot. |

```json
{ "type": "mxt:is_equipable", "slot": "head" }
```

With `slot` omitted it only asks "can this be equipped"; with it, the equipment slot has to equal that slot exactly, and a stack with no equippable component never passes.

### `mxt:relative_durability`

Compares the stack's remaining durability divided by its maximum durability.

| Field | Type | Default | Description |
| --- | --- | --- | --- |
| `comparison` | String | **required** | Comparison operator. |
| `compare_to` | Double | **required** | The ratio to compare against. |

```json
{ "type": "mxt:relative_durability", "comparison": "<=", "compare_to": 0.25 }
```

The ratio lies between `0` and `1`. Only damageable items pass.

### `mxt:armor_value`

Compares the armor value the stack provides in its equippable slot.

| Field | Type | Default | Description |
| --- | --- | --- | --- |
| `comparison` | String | **required** | Comparison operator. |
| `compare_to` | Double | **required** | The armor value to compare against. |

```json
{ "type": "mxt:armor_value", "comparison": ">", "compare_to": 3 }
```

The armor value is worked out from the stack's own attribute modifiers on that equipment slot. A stack with no equippable component does not pass.

### `mxt:durability`

Compares the stack's remaining durability.

| Field | Type | Default | Description |
| --- | --- | --- | --- |
| `comparison` | String | **required** | Comparison operator. |
| `compare_to` | Double | **required** | Remaining durability to compare against. |

```json
{ "type": "mxt:durability", "comparison": "<=", "compare_to": 100 }
```

Only damageable items pass.

This one and `mxt:relative_durability` split the job: it compares the raw remaining durability, so the same value means different things on items with different maximum durability, while that one compares a ratio between `0` and `1` and is the better fit for a generic rule.

### `mxt:on_cooldown`

Passes when the stack is on the holder's vanilla item cooldown. It does not pass when the holder is not a player.

No fields.

```json
{ "type": "mxt:on_cooldown" }
```

### `mxt:ingredient`

Matches the stack against a vanilla ingredient.

| Field | Type | Default | Description |
| --- | --- | --- | --- |
| `ingredient` | Vanilla Ingredient | **required** | An item, a tag, or a list of them. |

```json
{ "type": "mxt:ingredient", "ingredient": { "tag": "minecraft:wool" } }
```

### `mxt:tool_ability`

Checks whether the stack can perform a NeoForge item ability.

| Field | Type | Default | Description |
| --- | --- | --- | --- |
| `ability` | Item ability id | **required** | The NeoForge item ability to check. |

```json
{ "type": "mxt:tool_ability", "ability": "minecraft:axe_strip" }
```

### `mxt:base_enchantment`

Compares the level of one enchantment stored on the stack. It reads the level the stack itself carries, untouched by abilities that play with enchantment levels.

| Field | Type | Default | Description |
| --- | --- | --- | --- |
| `enchantment` | Enchantment id | **required** | The enchantment to inspect. |
| `comparison` | String | **required** | Comparison operator. |
| `compare_to` | Double | **required** | The level to compare against. |

```json
{ "type": "mxt:base_enchantment", "enchantment": "minecraft:sharpness", "comparison": ">=", "compare_to": 3 }
```

A stack without that enchantment counts as level `0`, so `!= 0` is the same question as "has this enchantment".

### `mxt:has_component`

Checks whether the stack carries the given data component.

| Field | Type | Default | Description |
| --- | --- | --- | --- |
| `component` | Data component id | **required** | The component to check. |

```json
{ "type": "mxt:has_component", "component": "minecraft:damage" }
```

### `mxt:component`

Matches the serialized value of a data component with a partial NBT comparison.

| Field | Type | Default | Description |
| --- | --- | --- | --- |
| `component` | Data component id | **required** | The component to compare. |
| `nbt` | NBT compound tag | **required** | The expected value, compared partially. |

```json
{ "type": "mxt:component", "component": "minecraft:custom_name", "nbt": { "text": "Sword" } }
```

A stack without that component does not pass. The comparison is partial: every key written in `nbt` has to match, and keys left out are ignored.

### `mxt:spirit_storage_not_full`

Matches chargeable items whose stored spirit power is below their capacity.

No fields.

```json
{ "type": "mxt:spirit_storage_not_full" }
```

Capacity comes from the definition this stack currently resolves to. A stack that resolves to no spirit storage ability does not pass.

### `mxt:item_element`

Passes when the item carries one of the listed elements.

| Field | Type | Default | Description |
| --- | --- | --- | --- |
| `elements` | Element id, `#` tag or array of them | **required** | At least one entry. |

```json
{ "type": "mxt:item_element", "elements": ["example:fire", "#example:hot"] }
```

It reads "the element of an item": the `mxt:element` component on the stack plus the `element` declared by `weapon_binding` / `item_binding` / `artifact` (all of them unioned), and only when none of those declares one does it fall back to the `aura_type` of the aura the item carries. Both elements and element tags are accepted, and an empty list is refused at load. See [weapon_binding](../../json/weapon_binding.md).

### `mxt:curse_container`

Checks which [curses](../../json/curse.md) are sealed in the stack's `mxt:curse_container` component.

| Field | Type | Default | Description |
| --- | --- | --- | --- |
| `curse` | Curse id, `#` tag or array of them | omitted means any curse | The curse entries to ask about. |
| `stacks` | `{min?, max?}` | omitted means any stack count | The inclusive window of the stack count that entry **would apply**. |

```json
{ "type": "mxt:curse_container", "curse": "#example:curses", "stacks": { "min": 2 } }
```

`stacks` compares the stack count the entry **would apply**, and its formula is evaluated in the current context; a non-finite bound makes that entry fail. A stack without this component does not pass.

It asks **what the item has sealed inside**, which is a different question from the `mxt:has_curse` entity condition (which asks what the holder already carries), so unequipped armor still answers.

### `mxt:item_quality`

Checks the [quality](../../json/quality.md) tier the stack resolves to.

| Field | Type | Default | Description |
| --- | --- | --- | --- |
| `quality` | Quality id, `#` tag or array of them | **required** | At least one entry. |

```json
{ "type": "mxt:item_quality", "quality": ["example:fine", "#example:high_tier"] }
```

It follows the same resolution order as the quality gate and the tooltip, so a definition's default tier and a ladder's entry tier both count. **This is the condition, not the component**: the component is `mxt:quality` (which writes a whole quality object), so the two names differ. An empty list is refused at load, and an item that resolves to no tier at all answers false rather than falling back to the lowest tier.

### `mxt:item_abilities`

Checks the mxt [abilities](../../json/ability.md) the stack grants.

| Field | Type | Default | Description |
| --- | --- | --- | --- |
| `abilities` | Ability id, `#` tag or array of them | **required** | At least one entry. |

```json
{ "type": "mxt:item_abilities", "abilities": ["example:sword_focus"] }
```

It reads the union the runtime uses: the `abilities` the definition declares plus the ids written in the `mxt:item_abilities` component. An empty list is refused at load.
