---
title: Resource (resource)
description: Defines a value stored per entity, its bounds and its inline resource bars.
aside: false
---

# Resource (resource) {#resource}

A `resource` is one number stored per entity: its bounds, and how it is shown. It does not care where the number comes from or what it is for. Everything that turns a number into a cultivation resource — the realm chain entry, natural regeneration, the aura marker, the conversions to and from cultivation progress, the gate on when it may be spent — lives in [aura](./aura.md), and an aura definition points back at this value through its `resource` field. A value with no matching aura definition is a plain counter.

## File Location

Resource files go in `data/<namespace>/mxt/resource/` inside your datapack. The filename is its ID, so `data/example/mxt/resource/qi.json` has the ID `example:qi`.

## Fields

| Field | Type | Default | Description |
| --- | --- | --- | --- |
| `name` | Text Component | `resource.mxt.<namespace>.<path>` | Display name; when omitted it is the generated key in that column, when written it is your text. |
| `description` | Text Component | `resource.mxt.<namespace>.<path>.description` | Definition description; when omitted it is the generated key in that column. Today it is only stored and read, nothing draws it yet. |
| `default_value` | `NumberProvider` | **required** | The current value when the attachment is created. |
| `min` | `NumberProvider` | `0` | Lower bound of the value. |
| `max` | `NumberProvider` | **required** | Upper bound of the value. |
| `icon` | **Icon Reference** | none | Optional icon, drawn on this value's entry on the wheel. |
| `particle_color` | `RGBColor` | `#FFFFFF` | Particle colour used by spirit power rays. May be written as `#RRGGBB` or as an integer in `0..16777215`. |
| `bars` | Resource bar list | `[]` | Inline resource bars; when empty, the value is not displayed. |

A value can be spent as the `mxt:resource` entry of a cost array (see [Shared Data Types · `Cost`](../types/shared_data_types.md#cost)), compared with `mxt:resource_compare` (it tests whether the current value is **≥** the `min` you write; there is no upper-bound comparison), read in a formula as `caster_<flattened value id>` (see [Formula Variables](../types/formula_variables.md)), raised or lowered by the `mxt:add_resource` action, and stored into an item as **the aura this value corresponds to** (its `aura` definition). What an item can hold is an aura: the access interfaces exchange aura identities, so a counter with no aura definition cannot go into an item — but it still enters the player's own pool, because a pool is keyed by the value.

`min` and `max` are evaluated again on initialisation and on every change. The write goes through only when both are finite and `min <= max`; when that does not hold the whole operation fails — nothing is written, and it does not fall back to the default value either. A change that is not finite is not written either.

An out-of-range change is **clamped to the bound** rather than rejected: clamping only alters the result that lands, it does not fail the operation.

`max` can be a formula:

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

The realm variables a formula may use (`realm_rank`, `absorbed_aura`, `level`) exist only inside the chain of the aura definition this value belongs to.

Use `mxt:conditional` when the maximum has to differ by player condition: branches are checked in order, and `fallback` takes only a number or an expression string and is used when there is no player or no branch matches; with no `fallback` it returns `0`.

## `resource.bars`

`bars` is an inline array of `resource`, not a datapack registry of its own.

`context` uses IDs from the built-in `mxt:resource_bar_context` registry. A context extracts the current value, the minimum, the maximum and the time of the last change from the entity or the client state, and builds the display name from the resource ID passed in. The five built-ins are fixed — a datapack picks one, it cannot add its own: `mxt:self_hud`, `mxt:target_overlay` and `mxt:boss_overlay` read the value stored on the entity, while `mxt:environment_concentration` and `mxt:actual_concentration` read the aura pool synced to the client instead. The two concentration contexts mean "environment template only" and "environment, stock, blocks and formations all counted"; when `resource.mxt.example.qi` reads "Spirit Qi" in your language file, for example, the two display as environment spirit qi concentration and actual spirit qi concentration.

| Field | Type | Default | Description |
| --- | --- | --- | --- |
| `context` | Context id | `mxt:self_hud` | Where the numbers come from: extracts the value, builds the name and decides the layout. |
| `anchor` | `left` / `right` | **required** | Whether it lands in the left or the right column of the self HUD. |
| `order` | Integer | `0` | Within one column, smaller is closer to the vanilla hotbar. |
| `visibility` | Visibility object | `mxt:always` | When it is shown. |
| `renderer` | Renderer object | **required** | How it is drawn. |
| `value_display` | Enum | `none` | How the numeric text is shown: `none`, `current`, `current_and_maximum`, `percentage`. |
| `maximum` | Positive Double | context maximum | Overrides the bar's **display** maximum only; it does not change the server-side or the context value. |

The three contexts that read a stored value (`mxt:self_hud`, `mxt:target_overlay`, `mxt:boss_overlay`) report nothing while this value has not been initialised, and that bar is not drawn. A `maximum` that is not a finite positive number counts as not written — the context maximum is used as before, and nothing is reported at load time.

The two concentration contexts require this value to have an aura definition: with none, or with a pool whose maximum and current value are both non-positive, they report nothing and the bar is not drawn. Their minimum is always `0`, and they record no last-changed time.

The two self HUD columns are dragged around by the player and their position is stored in the client config; a datapack only decides which of the two columns this bar lands in.

The built-in renderers are `mxt:boss_bar`, `mxt:textured_bar`, `mxt:segmented_bar`, `mxt:radial_bar` and `mxt:text_only`. Resource bars go through NeoForge's GUI Layer and are drawn in the left or right column only; they never take the centre of the screen.

### Renderers

The four columns below list which fields a renderer has. The first column is grouped by `renderer.type`, and the fields in a cell line up one-to-one with the type, default and description in that row.

| Field | Type | Default | Description |
| --- | --- | --- | --- |
| `sprite_location``<br>``bar_index``<br>``icon_index``<br>``inverted` | `SpriteIcon``<br>`Integer`<br>`Integer`<br>`Boolean | `mxt:textures/gui/resource_bar.png``<br>``0``<br>``bar_index``<br>``false` | `mxt:boss_bar`: an Origins-style 71x8 bar plus an 8x8 icon; it has to cut background, fill and icon cells out of the sheet, so `sprite_location` takes **textures only**, and writing a sprite is a load-time error. A texture counts as a `256×256` sheet by default, and `region.texture_width` / `texture_height` change that. `bar_index` and `icon_index` both range `0..24`. |
| `background_sprite``<br>``fill_sprite``<br>``width``<br>``height``<br>``fill_color``<br>``show_value` | `SpriteIcon``<br>``SpriteIcon``<br>`Integer`<br>`Integer`<br>``RGBColor``<br>`Boolean | **required**`<br>`**required**`<br>`**required**`<br>`**required**`<br>``#FFFFFF``<br>``false` | `mxt:textured_bar`: the background and the fill are each drawn once, at the bar's own width and height. `width` / `height` range `1..1024`. The fill is cut by progress, and a size written on `fill_sprite` takes no part in drawing. |
| `segments``<br>``gap``<br>``full_color``<br>``empty_color` | Integer`<br>`Integer`<br>``RGBColor``<br>``RGBColor` | **required**`<br>``1``<br>``#FFFFFF``<br>``#555555` | `mxt:segmented_bar`: a segmented bar. `segments` ranges `1..256`, `gap` ranges `0..32`. |
| `radius``<br>``thickness``<br>``start_angle``<br>``end_angle``<br>``fill_color` | Integer`<br>`Integer`<br>`Double`<br>`Double`<br>``RGBColor` | **required**`<br>`**required**`<br>``0``<br>``360``<br>``#FFFFFF` | `mxt:radial_bar`: a radial bar. `radius` ranges `1..512`, `thickness` ranges `1..128`, and both angles are in degrees. |
| `format``<br>``color``<br>``show_maximum` | String`<br>``RGBColor``<br>`Boolean | `%current%``<br>``#FFFFFF``<br>``false` | `mxt:text_only`: text only; the format may use `%current%`. |

A segmented bar is `segments * 8 + (segments - 1) * gap` pixels wide, and a radial bar occupies `radius * 2 + thickness` pixels in both directions; `mxt:textured_bar` uses the width and height it declares, and each of the other renderers works out its own size.

```json
{"type": "mxt:segmented_bar", "segments": 10, "gap": 2, "full_color": "#66CCFF"}
```

**The three bar artwork fields take a [`SpriteIcon`](../types/shared_data_types.md#spriteicon), not the icon reference that `ability.icon` / `resource.icon` use.** That one is a 16x16 texture or an item, drawn in a single cell, with no `region` / `width` / `height` and no `{"sprite": ...}`; and a `SpriteIcon` cannot be written as an item either. Two forms:

| Form | Description |
| --- | --- |
| Bare string | Keeps the field's original meaning: `sprite_location` is a **texture path**, `background_sprite` / `fill_sprite` are GUI atlas sprites. |
| Object | `{"sprite": ...}` is a GUI atlas sprite; `{"texture": ...}` is a texture and may carry a `region` (`u` / `v` / `texture_width` / `texture_height`, origin `0,0` and a full `256×256` image by default). Both may carry `width` / `height`. |

`width` / `height` is the **target** size drawn (not a crop), has to be written as a pair, and when omitted the bar is drawn at its own width and height. Three boundaries:

- `sprite_location` on `mxt:boss_bar` accepts **textures only**. A sprite has no notion of which cell of a sheet to cut.
- A sprite **cannot declare a `region`** — the atlas already knows where it is, and writing one is a load-time error.
- **`width` / `height` written on `mxt:textured_bar`'s `fill_sprite` has no effect**: the fill is cut by the bar's own progress, a fixed size means nothing, and those two keys take no part in drawing. A size belongs to `background_sprite` only (and to `mxt:boss_bar`'s sheet texture).

In the object form exactly **one** of `sprite` and `texture` has to be written; writing both or neither is a load-time error. Writing only one of `width` / `height` is a load-time error too.

### Visibility

| Field | Type | Default | Description |
| --- | --- | --- | --- |
| `type` | see the table below | **required** | Which visibility condition to use. |
| `hold_ticks` | Long | `60` | Read by `mxt:recently_changed` only: how long to keep showing after the last change; must be non-negative. |
| `min` | Double | **required** | Read by `mxt:resource_range` only: inclusive lower bound, must be finite. |
| `max` | Double | **required** | Read by `mxt:resource_range` only: inclusive upper bound, must be finite and not below `min`. |
| `values` | Visibility list | **required** | Read by `mxt:and` / `mxt:or` only: the nested conditions. |
| `value` | Visibility | **required** | Read by `mxt:not` only: the condition to invert. |

| `type` | Description |
| --- | --- |
| `mxt:always` | Shown always. |
| `mxt:non_full` | Shown while the current value is below the maximum. |
| `mxt:non_zero` | Shown only while `maximum - minimum > 0`; hidden when the difference is zero or negative. |
| `mxt:recently_changed` | Shown for `hold_ticks` after the last change. |
| `mxt:resource_range` | Shown while the current value is inside the closed interval `[min, max]`. |
| `mxt:and` / `mxt:or` / `mxt:not` | Combine the ones above. |

Visibility decides whether the bar is drawn and nothing else; it never changes how the value is settled.

```json
{
  "type": "mxt:and",
  "values": [
    {"type": "mxt:non_full"},
    {"type": "mxt:resource_range", "min": 1, "max": 50}
  ]
}
```

::: info Two kinds of concentration

The IDs `mxt:environment_concentration` and `mxt:actual_concentration` exist in two places at once: written in `bars[].context` they are resource bar contexts, reading the aura pool synced to the client as described above; written as a resource value provider they are a different type, readable only with an entity — with no entity they are `0`, and the server computes them from world state. The full list is in [Resource Bar and Aura Types](../types/other/resource-bar.md#resource-value-provider-type).

:::

::: info Display Names

Datapack definitions do not write a `translation_key`; the display name is generated from the identifier as `<category>.<registry namespace>.<definition namespace>.<path>`. The category of `resource` is `resource`, and the registry namespace is always `mxt` for MiXianTu's own registries, so `example:qi` looks up `resource.mxt.example.qi`. A `/` in the path goes into the key **as written** (`example:foo/bar` gives `resource.mxt.example.foo/bar`); sorting definitions into subdirectories per category does not add a second set of translation-key rules.

`resource` is one of the nineteen registries that may also carry an optional `name` / `description`: written, they use your text, and only when omitted does the generated key above apply (with `.description` appended for the description). Both fields are only stored and read today; nothing draws them yet.

:::
