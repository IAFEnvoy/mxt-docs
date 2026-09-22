---
title: Resource (resource)
description: Defines a stored numeric value and its inline resource bars.
---

# Resource (resource)

A `resource` is a number the mod keeps per entity: its bounds, and how it is displayed. It stores nothing about where that number comes from or what it is used for — everything that turns a value into an aura (its realm chain, regeneration, element marker, conversions, use gate) lives in an [aura](./aura.md) definition that references it. A resource without an aura definition is a plain counter.

## File Location

Resource files go in `data/<namespace>/mxt/resource/` within your datapack.

**Purpose**: Entity resources such as cultivation progress, spirit power and stamina, plus inline resource bars.

The filename corresponds to its ID. For example, `data/example/mxt/resource/qi.json` has the ID `example:qi`.

## Fields

| Field | Type | Default | Description |
|-------|------|---------|-------------|
| `default_value` | `NumberProvider` | **required** | The current value when the attachment is first created. |
| `min` | `NumberProvider` | `0` | Lower bound of the value. |
| `max` | `NumberProvider` | **required** | Upper bound of the value. |
| `icon` | [Icon Reference](../types/shared_data_types.md#icon-reference) | none | Optional wheel icon for the spirit power entries. |
| `particle_color` | `RGBColor` | `#FFFFFF` | Particle colour used by spirit power rays. May be written as `#RRGGBB` or as an integer in `0..16777215`. |
| `bars` | `List<ResourceBar>` | `[]` | Inline resource bars; when empty, the value is not displayed. |

Values are always clamped to `[min, max]`, and an out-of-range change is rejected rather than silently reduced. A value can be spent as a `ResourceCost`, compared with `mxt:resource_compare`, read by formulas through `caster_<name>`, changed by the `mxt:add_resource` action, and stored in items through the aura access interfaces (`AuraAccess`/`ItemAuraAccess`) — which exchange auras, so a value needs an [aura](./aura.md) definition to have an aura identity at all. It can still enter the player's own pool without one, because a pool is keyed by the value.

### bars

`bars` is an inline array of `resource`, not a separate datapack registry.

`context` uses IDs from the built-in `mxt:resource_bar_context` registry. A context object extracts the current value, the minimum, the maximum and the time of the last change from the entity or the client state, and generates the display name from the resource ID that was passed in. Aura concentration contexts are split into `mxt:environment_concentration` (environment only) and `mxt:actual_concentration` (all sources); for example, when the language key of `example:qi` reads aura, the two contexts display environment aura concentration and actual aura concentration respectively. Built-in contexts also include `mxt:self_hud`, `mxt:target_overlay` and `mxt:boss_overlay`.

| Field | Type | Default | Description |
|-------|------|---------|-------------|
| `context` | `ResourceBarContext` | `mxt:self_hud` | Context built-in registry; extracts values, generates names and decides the layout. |
| `anchor` | `left` / `right` | **required** | Left or right column of the self HUD. |
| `order` | Integer | `0` | Within the same column, a smaller value is closer to the vanilla hotbar. |
| `visibility` | `ResourceBarVisibility` | `mxt:always` | Whether the bar is shown. |
| `renderer` | `ResourceBarRenderer` | **required** | How the bar is drawn. |
| `value_display` | `none` / `current` / `current_and_maximum` / `percentage` | `none` | How the numeric text is displayed. |
| `maximum` | Positive Double | context maximum | Overrides only the display maximum of the bar; it does not change the server or context values. |

Built-in renderers include `mxt:boss_bar`, `mxt:textured_bar`, `mxt:segmented_bar`, `mxt:radial_bar` and `mxt:text_only`. `mxt:boss_bar` accepts `sprite_location`, `bar_index`, `icon_index` and `inverted`, and uses `mxt:textures/gui/resource_bar.png` by default. Rendering is hooked in through the NeoForge GUI Layer; bars only appear in the left or right column and never occupy the centre of the screen.

Renderer parameters:

| `type` | Fields | Default | Description |
|--------|--------|---------|-------------|
| `mxt:boss_bar` | `sprite_location`, `bar_index`, `icon_index`, `inverted` | see above | Origins-style 71x8 bar and icon. |
| `mxt:textured_bar` | `background_sprite`, `fill_sprite`, `width`, `height`, `fill_color`, `show_value` | `fill_color=#ffffff,show_value=false` | Uses two separate textures. Width and height range from `1` to `1024`. |
| `mxt:segmented_bar` | `segments`, `gap`, `full_color`, `empty_color` | `gap=1,full_color=#ffffff,empty_color=#555555` | Segmented bar; `segments` ranges from `1` to `256`. |
| `mxt:radial_bar` | `radius`, `thickness`, `start_angle`, `end_angle`, `fill_color` | `start_angle=0,end_angle=360,fill_color=#ffffff` | Radial bar. |
| `mxt:text_only` | `format`, `color`, `show_maximum` | `%current%,#ffffff,false` | Text only; the format supports `%current%`. |

Visibility types: `mxt:always`, `mxt:non_full`, `mxt:non_zero`, `mxt:recently_changed` (`hold_ticks` defaults to `60`), `mxt:resource_range` (requires `min` and `max`), `mxt:and`, `mxt:or` and `mxt:not`. `mxt:non_zero` is shown only while `maximum - minimum > 0`; when the difference is zero or negative the bar is hidden.

## Example

```json
// data/example/mxt/resource/qi.json
{
  "default_value": 0,
  "max": "100 + realm_rank * 20 + absorbed_aura * 0.1",
  "particle_color": "#66CCFF",
  "bars": [
    {
      "context": "mxt:self_hud",
      "anchor": "left",
      "order": 0,
      "renderer": {"type": "mxt:boss_bar", "bar_index": 1}
    }
  ]
}
```

The `max` formula uses the cultivation variables of the value, which are available whenever the formula is evaluated for a value that has an [aura definition](./aura.md); the full list is in [Formula Variables](../types/formula_variables.md).

::: info Server-authoritative
Every stored value is server-authoritative and synchronised to the client together with the bounds that were resolved for it, so the client never evaluates a bound formula on its own. Passive regeneration and the exchange with cultivation progress belong to the aura definition and are settled on the server as well.
:::

::: info Aura concentration providers
The resource value providers `mxt:environment_concentration` and `mxt:actual_concentration` are computed on the server and synced to the client. The first returns only the environment template concentration, the second returns the final concentration including chunk stock, block and formation sources.
:::

::: info Display Names
Data-driven definitions do not fill in a `translation_key` — that field does not exist. A definition's display name is generated from its identifier as `<category>.<namespace>.<path>`, where the category is the registry's own path, so `example:qi` in `mxt:resource` is `resource.example.qi`. The one override is `mxt:item_quality`, which is translated under `quality`. A `/` in the path is **kept as written**, not turned into `.` (`example:foo/bar` gives `resource.example.foo/bar`), so avoid subdirectories in definition filenames. Registry titles use `mxt.registry.<registry path>`, for example `mxt.registry.aura`.
:::

