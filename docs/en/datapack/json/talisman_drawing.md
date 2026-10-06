---
title: Talisman Drawing (talisman_drawing)
description: "A drawing recipe is judged inside the talisman workstation from the strokes the player draws: it declares the shape, how tracing is scored, what each grade yields and what else it costs."
aside: false
---

# Talisman Drawing (talisman_drawing)

A drawing recipe is the **vanilla recipe type `mxt:talisman_drawing`** and it only runs inside the **talisman workstation**: the player traces a shape over the guide layer, the judge scores the strokes into a completion value, and the recipe's own grades decide the result. It is **not in the recipe book** and **never matches in a vanilla crafting grid**.

It is a **vanilla recipe type** registered by this mod, not a data pack registry entry.

## File Location

Drawing recipes go in `data/<namespace>/recipe/` inside a data pack, the same tree as crafting recipes and pill recipes. The file name is its ID: `data/example/recipe/fire_talisman.json` has the ID `example:fire_talisman`.

Every file declares `"type": "mxt:talisman_drawing"`.

## One Answer Each

A drawing recipe has several blocks: `talisman` is what comes out, `paper` is what it is drawn on, `costs` is what else is spent, `pattern` is what is drawn, `judgement` is how it is scored and `result` is what a score yields; two more fields change only how the paper looks (`background_color` for the ground, `foreground_color` for the strokes). **The smallest recipe needs only `talisman`, `pattern.strokes` and one grade in `result.grades`**; everything else has a default.

| Field | Type | Default | Description |
| --- | --- | --- | --- |
| `type` | String | **required** | Must be `mxt:talisman_drawing`. |
| `unlock_condition` | [Entity condition](../types/condition/entity_condition_types.md) | `mxt:always` | Whether this player may pick this recipe at this workstation right now; resolved when the screen opens. |
| `talisman` | Talisman id | **required** | The talisman this recipe draws, see [talisman](./talisman.md). **Every grade produces it**; one recipe is one talisman, so "inferior / common / perfect" as three definitions means three recipes. A wrong id fails the load of the whole file. |
| `paper` | `Ingredient` | the `#mxt:talisman_paper` tag | What this recipe is drawn on: one sheet is taken from the screen's slot when a drawing opens. Written like any recipe ingredient — `"mxt:blank_talisman"`, `["a", "b"]`, `"#tag"`, or a custom ingredient `{"neoforge:ingredient_type": "mxt:quality", "items": …, "min_quality": …}` (see [Filtering items by tier](./quality.md#gating)). Left out, it is the `mxt:talisman_paper` tag, which is what this recipe type always took. **The slot itself only accepts that tag** (the client has to be able to answer "is this paper at all"), so this field narrows within it: paper outside the tag can never start a drawing. |
| `costs` | Array, entries as in [`Cost`](../types/shared_data_types.md#cost) | `[]` | **Extra costs only**: the recipe type itself always takes `1 × paper` from the screen's slot, whether or not `costs` is written. That slot belongs to the menu, the way a crafting table's grid does (closing the screen hands what is left in it back to you), an `mxt:item` entry comes out of it, and every other type is paid by the player. Paper is the `mxt:talisman_paper` tag (this mod puts `mxt:blank_talisman` in it; a pack may add its own paper). |
| `pattern` | Object | **required** | What is drawn, see below. |
| `background_color` | `RGBColor` | `#FFFE85` | The colour of the paper's ground (a pale yellow). |
| `foreground_color` | `RGBColor` | `#FF0000` | The colour of **the line the player draws** (pure red). The guide layer (the `pattern.guide` tracing) does not take it — that one stays faded brown, or it could not be told apart from the strokes. |
| `judgement` | Object | see below | Scoring parameters, the whole block is optional. **No field in it changes the output**; it only moves the completion value. |
| `result` | Object | **required** | Grades, outputs and actions, see below. |

### `pattern`

| Field | Type | Default | Description |
| --- | --- | --- | --- |
| `guide` | `always` / `fade` / `none` | `fade` | How the guide layer behaves while tracing: always visible / fades once the first stroke starts / not drawn. |
| `show_order` | Boolean | `false` | `true` draws a dot and the stroke number at the start of every stroke, which helps the player remember the order. |
| `tolerance` | double | `0.06` | The scoring tolerance, which has to be positive. It is a **fraction of the canvas height** and also decides the stroke simplification threshold and what counts as a closed stroke. |
| `strokes` | `double[2][][]` | **required** | The shape itself: one polyline per stroke, each point an `[u, v]` that has to be finite and inside `[0,1]²`, at least one stroke with at least two points each. **The canvas size is not configurable**: it is fixed at 90 × 210 and `[u, v]` are read against it. |

### `judgement`

| Field | Type | Default | Description |
| --- | --- | --- | --- |
| `sigma` | double | `1.0` | How forgiving the completion mapping is; it has to be positive. |
| `direction_weight` / `topology_weight` / `order_weight` | double | `0.25` / `0.25` / `0.25` | The weights of the direction, topology and stroke-order terms, none of them below `0`. The shape term is fixed at `1.0` and has no field. With all three at `0` only the shape is scored (allowed, and a warning is logged at load). |
| `stroke_count_strict` | Boolean | `false` | `true` makes a stroke count that differs from the reference score the order term at full marks. |
| `min_stroke_length` | double | `0.02` | The short-stroke threshold, at least `0`, again as a fraction of the canvas height; a whole stroke below it is dropped before scoring. |
| `preview` | Boolean | `true` | `false` stops the client from computing a local completion preview. |

Not one field here can change the product — this block only moves the completion. How the completion is computed, and where each term's weight lands, is in [Talisman Scoring](/en/technical/talisman-scoring).

### `result`

| Field | Type | Default | Description |
| --- | --- | --- | --- |
| `grades` | Object array | **required**, non-empty | `1`–`64` grades. `min_completion` has to be **unique and ascending**; a duplicate or an out-of-order entry is refused at load. The lowest grade is the recipe's pass mark, so one grade at `min_completion: 0` always succeeds. |
| `grades[].min_completion` | double | **required** | That grade's threshold, inside `[0,1]`. |
| `grades[].quality` | Quality id | none | The tier written to the output when this grade is hit (into the `mxt:quality` component); left out, no component is written and the output's tier drops to the last layer of resolution, the [default_quality](./default_quality.md) registry. |
| `grades[].max_damage` | [Number provider](../types/number_provider_types.md) | none | Overrides the carrier's wear ceiling, in the same shape the talisman definition uses. |
| `grades[].charge_ratio` | [Number provider](../types/number_provider_types.md) | `0` | How much of the capacity is poured into the output, `0` by default meaning none; a value of `0` or less pours nothing. |
| `grades[].outputs` | `ItemStackTemplate[]` | `[]` | Extra outputs of this grade. |
| `failure_outputs` | `ItemStackTemplate[]` | `[]` | What a failure yields; empty by default, which burns the materials and nothing else. |
| `success_action` / `failure_action` | [Entity action](../types/action/entity_action_types.md) | `mxt:no_op` | Run once on success and once on failure. |

A formula inside `result` gets two extra variables: `percentage`, the completion of this attempt (0 to 1), and `paper_rank`, **where the tier written on the sheet actually taken sits on its own ladder** (counted from the entry tier, so `0` is the entry tier and also the only number a sheet with no tier — or a tier no ladder holds — can give; a formula cannot tell those apart). `max_damage`, `charge_ratio` and the number providers of both actions can read them, written as ordinary formulas (`"0.5 + 0.5 * percentage"`, `"percentage * percentage + paper_rank * 50"`). The names have to be `percentage` / `paper_rank` or a formula variable the registry provides, and **anything else is refused at load** rather than silently read as 0. `paper_rank` reads the sheet the drawing **actually took**, so "good paper, better talisman" is written right there in the formula. `outputs` cannot read them — an `ItemStackTemplate` count is fixed, so different counts per completion means different grades.

A drawing recipe **declares no `name` / `description`**: the entry in the recipe list and the talisman name in the output's tooltip both come from the definition the top-level `talisman` names.

## Load-Time Checks

`pattern.strokes` is non-empty (1–256 strokes), every stroke has 2–4096 points, the points are finite and inside `[0,1]²`, and the whole shape's point cloud has an RMS radius above `0` (a shape whose points all coincide means nothing); `tolerance > 0`; `sigma > 0`; the three weights and `min_stroke_length` are at least `0`; `result.grades` holds 1–64 grades with a unique ascending `min_completion`. `paper` is checked by the vanilla ingredient codec itself (the item set may not be empty or hold air, and each custom ingredient checks its own fields).

The resampling step and the stroke simplification coefficient are constants inside the judge, not fields: writing `resample_step` / `simplify_epsilon` in `judgement` is **silently ignored**, exactly like any unknown key.

## Materials and Pigment

The screen's slot accepts paper only (the `mxt:talisman_paper` tag, which this mod fills with `mxt:blank_talisman`; a pack may add its own paper), and once a sheet is in it **the recipe's `paper` decides whether this formula accepts it and which sheet is taken**: left out, any sheet in the tag does; written as a graded ingredient, only paper of that tier does (and with paper that is not good enough the formula stays unpickable in the list forever). That one sheet is taken by the recipe type itself and cannot be removed. An extra `mxt:item` entry in `costs` therefore can only mean "one more sheet of paper". Every other entry (`mxt:resource` / `mxt:aura` / `mxt:js`) is paid by the player under the ordinary cost rules. **Closing the screen mid-drawing judges that attempt failed** (the sheet is not returned and the recipe's `failure_action` runs); closing with no stroke at all hands the whole slot back.

**Pigment is not part of `costs`**: drawing takes it from the **brush's own store**, by the length of each stroke, and that store is the item component `mxt:brush_pigment`. Refilling is the vanilla bundle's click: with the brush on the cursor, **click a stack of pigment** and it takes one portion per click — your inventory, a chest and the station all work, and no slot matters (the station has no pigment slot of its own); which items count is the `#mxt:brush_pigment` item tag (cinnabar `mxt:cinnabar` in the base pack). What one portion is worth is **Server Config → Talisman → Pigment Per Portion**, and how much pigment one brush can hold is capped by **Server Config → Talisman → Brush Capacity**.

## Example

```json
{
  "type": "mxt:talisman_drawing",
  "unlock_condition": { "type": "mxt:realm", "realm": "example:foundation", "comparison": "at_least" },
  "talisman": "example:fire_talisman",
  "paper": {
    "neoforge:ingredient_type": "mxt:quality",
    "items": "#mxt:talisman_paper",
    "min_quality": "example:common"
  },
  "pattern": {
    "guide": "fade",
    "show_order": false,
    "tolerance": 0.06,
    "strokes": [
      [[0.50, 0.06], [0.50, 0.94]],
      [[0.22, 0.28], [0.50, 0.10], [0.78, 0.28]],
      [[0.30, 0.72], [0.70, 0.72]]
    ]
  },
  "result": {
    "grades": [
      { "min_completion": 0.35, "quality": "example:inferior" },
      { "min_completion": 0.65, "quality": "example:common" },
      { "min_completion": 0.88, "quality": "example:perfect",
        "charge_ratio": "0.5 + 0.5 * percentage",
        "max_damage": "100 + paper_rank * 50",
        "outputs": [{ "id": "mxt:cinnabar" }] }
    ],
    "failure_outputs": [],
    "success_action": { "type": "mxt:no_op" },
    "failure_action": { "type": "mxt:no_op" }
  }
}
```

This recipe draws `example:fire_talisman`, whose name and description come from that definition too: it only accepts **paper of at least `example:common`** (paper in the tag with no tier can never start it, because `min_quality` answers no for an item with no tier); a completion of at least `0.35` yields `example:inferior`, `0.65` yields `example:common`, and `0.88` yields `example:perfect` poured to `0.5 + 0.5 × completion` with its wear ceiling raised by the paper's tier (`100 + paper_rank × 50`) and one extra `mxt:cinnabar`; below `0.35` the attempt fails, and with `failure_outputs` empty that only burns the materials. All three strokes keep their `[u, v]` inside `[0,1]²`, which against the 90 × 210 canvas is one vertical line and two horizontal ones.
