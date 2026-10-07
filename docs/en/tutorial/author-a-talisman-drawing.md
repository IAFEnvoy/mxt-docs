---
title: Write a Drawing Recipe
description: "Write a drawing recipe: how the shape is traced, what the scoring block governs, what each grade yields, and the two bills — paper and pigment."
---

# Write a Drawing Recipe

A drawing recipe is one file under `data/<namespace>/recipe/`, its recipe type is **`mxt:talisman_drawing`**, and its ID is the path in the file name: `data/example/recipe/talisman/flame_sigil.json` has the ID `example:talisman/flame_sigil`. It only runs inside the **talisman workstation**: the player traces the shape over the guide layer, the server scores the strokes into a completion value, and the recipe's own grades decide success, tier and output.

**It is a vanilla recipe type, not a data pack registry**, so it goes through the vanilla `RecipeManager`: `/reload` reads it again, it never enters the recipe book, and it never matches in a vanilla crafting grid. One recipe draws **one** talisman — "inferior / common / perfect" as three definitions means three recipes, not three outcomes inside one.

::: tip How this page and Define a Talisman divide the work

[Define a Talisman](./inscribe-a-talisman.md) covers the rest of the chain: what the talisman definition says, how a carrier reaches a player, how it is poured and fired, and the two rule sets for the hand and a display stand. This page covers only **the manually drawn half**: the player traces the shape at the workstation and this file judges how well it was traced. Nothing overlaps — the talisman definition itself is not repeated here, and what comes out is named by the top-level `talisman` field.

:::

## What You Are Building

| File | Purpose |
| --- | --- |
| `data/example/recipe/talisman/flame_sigil.json` | The only file on this page: it draws `example:flame_sigil`, says which paper it takes, what shape is traced, how it is scored and what each grade yields. |

**This assumes [Define a Talisman](./inscribe-a-talisman.md) is done**: the definition `data/example/mxt/talisman/flame_sigil.json` and the ability `example:spark` it inscribes are already in the pack. A drawing recipe **declares no name and no description**; the entry in the list and the line in the product's tooltip both come from the definition the top-level `talisman` names.

A recipe has several blocks, each answering one question: `talisman` is what comes out, `pattern` is what is drawn, `judgement` is how it is scored, `result` is what a score yields, `paper` is what it is drawn on and `costs` is what else is spent; two more fields change only how the paper looks. **The smallest recipe needs only `talisman`, `pattern.strokes` and one grade in `result.grades`**; everything else has a default:

```json
{
  "type": "mxt:talisman_drawing",
  "talisman": "example:flame_sigil",
  "pattern": {
    "strokes": [[[0.50, 0.06], [0.50, 0.94]]]
  },
  "result": {
    "grades": [{"min_completion": 0}]
  }
}
```

That smallest recipe always succeeds (the lowest grade is the pass mark, so `0` means it cannot fail) and produces an `example:flame_sigil` with no extra tier and no extra outputs. The five steps below grow it into a recipe worth shipping. The full field list is in [Talisman Drawing](../datapack/json/talisman_drawing.md).

## Step 1 — The Shape: `pattern`

```json
// data/example/recipe/talisman/flame_sigil.json
{
  "type": "mxt:talisman_drawing",
  "talisman": "example:flame_sigil",
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
    "grades": [{"min_completion": 0}]
  }
}
```

| Field | Type | Default | What it does |
| --- | --- | --- | --- |
| `guide` | `always` / `fade` / `none` | `fade` | How the guide layer behaves while tracing: always visible / fades once the first stroke starts / not drawn. |
| `show_order` | Boolean | `false` | `true` draws a dot and the stroke number at the start of every stroke, which helps the player remember the order. |
| `tolerance` | double | `0.06` | The scoring tolerance, which has to be positive; it is a **fraction of the canvas height**. |
| `strokes` | `double[2][][]` | **required** | The shape itself: one polyline per stroke, each point an `[u, v]`. |

**The coordinate space `strokes` lives in is fixed.** Every point is an `[u, v]` that has to be finite and inside `[0,1]²`, with at least one stroke of at least two points each. The canvas those `[0,1]²` coordinates are read against **cannot be configured**: it is 90 × 210, so `u` times 90 is the x coordinate and `v` times 210 the y coordinate. The three strokes above are therefore one vertical line (`x = 45`) and two horizontal ones in pixels, the same shape as the reference page's example.

**How to author `strokes`.** Writing those numbers by hand is no fun, and the repository ships a single-file browser editor, `tools/talisman_strokes.html`: open it straight from disk (`file://` does fine — no build step, no server), and it draws exactly the workstation's sheet — the 90 × 210 canvas with the two defaults `#FFFE85` paper and `#FF0000` ink. It has two drawing modes (a polyline by clicking vertices, and freehand by dragging), `Ctrl+Z` / `Ctrl+Y` undo and redo, and the `Copy JSON` button copies the value of `pattern.strokes`; `Load from JSON` takes a bare `strokes` array or a whole `pattern` block back. It only draws the shape: `guide` / `show_order` / `tolerance` are recipe fields the tool does not write. It also reports the shape problems the loader refuses ahead of time (a stroke with fewer than two points, more than 256 strokes, more than 4096 points in one stroke, a point cloud with no spread).

One `tolerance` governs three things: the scoring tolerance, the stroke simplification threshold, and what counts as a closed stroke. It is a **fraction of the canvas height**, so `0.06` is 210 × 0.06 ≈ 12.6 pixels.

## Step 2 — Scoring: `judgement`

```json
// data/example/recipe/talisman/flame_sigil.json
{
  "type": "mxt:talisman_drawing",
  "talisman": "example:flame_sigil",
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
  "judgement": {
    "sigma": 0.8,
    "topology_weight": 0.35
  },
  "result": {
    "grades": [{"min_completion": 0}]
  }
}
```

The whole `judgement` block may be left out (leaving it out means every default), and **no field in it can change the output**: it only moves the completion value.

| Field | Type | Default | What it does |
| --- | --- | --- | --- |
| `sigma` | double | `1.0` | How forgiving the completion mapping is; it has to be positive. |
| `direction_weight` / `topology_weight` / `order_weight` | double | `0.25` / `0.25` / `0.25` | The weights of the direction, topology and stroke-order terms, none of them below `0`. |
| `stroke_count_strict` | Boolean | `false` | `true` makes a stroke count that differs from the reference score the order term at full marks. |
| `min_stroke_length` | double | `0.02` | The short-stroke threshold, at least `0`, again as a fraction of the canvas height. |
| `preview` | Boolean | `true` | `false` stops the client from computing a local completion preview. |

Beside the three weights there is a **shape term**, fixed at `1.0` with no field of its own. Setting all three weights to `0` is allowed (only the shape is scored) and logs a warning at load. The example above raises `topology_weight` to `0.35`, which says "crossings and closures are the easiest structure to get wrong, so charge more for them".

How the completion value is computed and where each term's weight lands is in [Talisman Scoring](../technical/talisman-scoring.md).

**`resample_step` / `simplify_epsilon` are not fields**: the resampling step and the simplification coefficient are constants inside the judge, and writing them into `judgement` is silently ignored exactly like any unknown key.

## Step 3 — Grades and Outputs: `result`

```json
// data/example/recipe/talisman/flame_sigil.json
{
  "type": "mxt:talisman_drawing",
  "talisman": "example:flame_sigil",
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
  "judgement": {
    "sigma": 0.8,
    "topology_weight": 0.35
  },
  "result": {
    "grades": [
      {"min_completion": 0.35, "quality": "example:common"},
      {"min_completion": 0.60, "quality": "example:refined"},
      {
        "min_completion": 0.85,
        "quality": "example:flawless",
        "charge_ratio": "percentage",
        "max_damage": "10 + 5 * paper_rank",
        "outputs": [{"id": "mxt:cinnabar"}]
      }
    ],
    "failure_outputs": [],
    "success_action": {"type": "mxt:no_op"},
    "failure_action": {"type": "mxt:no_op"}
  }
}
```

| Field | Type | Default | What it does |
| --- | --- | --- | --- |
| `grades` | Object array | **required**, non-empty | `1`–`64` grades with a unique ascending `min_completion`. |
| `grades[].min_completion` | double | **required** | That grade's threshold, inside `[0,1]`. |
| `grades[].quality` | Quality id | none | The tier written to the output when this grade is hit; left out, no component is written. |
| `grades[].max_damage` | Number provider | none | Overrides the carrier's wear ceiling, in the same shape the talisman definition uses. |
| `grades[].charge_ratio` | Number provider | `0` | How much of the capacity is poured in; `0` pours nothing. |
| `grades[].outputs` | `ItemStackTemplate[]` | `[]` | Extra outputs of this grade. |
| `failure_outputs` | `ItemStackTemplate[]` | `[]` | What a failure yields; empty by default, which burns the materials and nothing else. |
| `success_action` / `failure_action` | Entity action | `mxt:no_op` | Run once on success and once on failure. |

Four semantics to remember:

- **The grade depends on the completion alone**: walk the grades downwards and take the **last threshold that is not above the completion**. The lowest grade is therefore the recipe's pass mark, so `0.35` means anything below it fails and `0` means it cannot fail.
- **`min_completion` has to be unique and ascending**, with 1 to 64 grades; a duplicate or an out-of-order entry is refused at load rather than one of them being picked.
- **Completion decides success; the grade hit decides tier and output**: whether that grade writes a `quality`, pours aura or yields extra items is that grade's own business. `failure_outputs` only pays out on a failure that **reached the settlement**.
- **Formulas inside `result` get two extra variables**: `percentage` is this attempt's completion (0 to 1), and `paper_rank` is where the tier written on the sheet actually taken sits on its own ladder (counted from the entry tier, so `0` is the entry tier and also the only number "this sheet has no tier / its tier is on no ladder" can give — a formula cannot tell those apart). A name that is neither of those nor a formula variable the registry provides is refused **at load**; `outputs` cannot read them, because an `ItemStackTemplate` count is fixed, so different counts per completion means different grades.

**What comes out**: the grade produces the `mxt:talisman` carrier, inscribed with the definition the top-level `talisman` names (mode `fire`), with the tier written into its `mxt:quality` component, `max_damage` written into the vanilla wear components, `charge_ratio` poured into the carrier's capacity, and `outputs` handed over on top. "A better trace makes a better talisman" is written exactly here.

`success_action` / `failure_action` are ordinary entity actions, so this is where a message, an effect or another charge goes; leaving both out means `mxt:no_op`.

## Step 4 — Paper and Pigment

```json
// data/example/recipe/talisman/flame_sigil.json
{
  "type": "mxt:talisman_drawing",
  "talisman": "example:flame_sigil",
  "paper": "mxt:blank_talisman",
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
  "judgement": {
    "sigma": 0.8,
    "topology_weight": 0.35
  },
  "result": {
    "grades": [
      {"min_completion": 0.35, "quality": "example:common"},
      {"min_completion": 0.60, "quality": "example:refined"},
      {
        "min_completion": 0.85,
        "quality": "example:flawless",
        "charge_ratio": "percentage",
        "max_damage": "10 + 5 * paper_rank",
        "outputs": [{"id": "mxt:cinnabar"}]
      }
    ],
    "failure_outputs": [],
    "success_action": {"type": "mxt:no_op"},
    "failure_action": {"type": "mxt:no_op"}
  }
}
```

**Paper is two questions, so do not mix them up.**

| The question | What answers it |
| --- | --- |
| May this stack sit in the screen's slot at all | The item tag `#mxt:talisman_paper` (the mod fills it with `mxt:blank_talisman`, and a pack may add its own paper). **The slot reads only that tag**, because the client has to be able to answer "is this paper at all". |
| Does this recipe take it, and which sheet does it take | The recipe's own `paper` field (a vanilla `Ingredient`), which **defaults to that tag**. |

So `paper` narrows within the tag: paper outside the tag can never start a drawing. The `"mxt:blank_talisman"` above is that one sheet in the tag; to gate on tiers, write the custom ingredient `{"neoforge:ingredient_type": "mxt:quality", "items": "#mxt:talisman_paper", "min_quality": "example:common"}`, and a sheet with no tier can never start the recipe. That sheet is taken out of the screen's slot by the recipe type itself and cannot be removed, so an extra `mxt:item` in `costs` can only ever mean "one more sheet".

**Pigment is not part of `costs`.** Drawing takes it by **the length of every stroke** from **the brush's own store**, which is the item component `mxt:brush_pigment` (1 unit = 1 pixel of arc length), and how a brush is refilled, what a portion is worth and how much one holds are none of them in the data pack:

| What answers it | Default | What it governs |
| --- | --- | --- |
| The item tag `#mxt:brush_pigment` | cinnabar `mxt:cinnabar` only, in the base pack | Which items count as pigment. Refilling is the vanilla bundle's click: **with the brush on the cursor, click a stack of pigment** for one portion per click — inventory, chest or station, since the screen has no pigment slot. |
| **Server Config → Talisman → Brush Capacity** | `4000` | How much pigment one brush holds. |
| **Server Config → Talisman → Pigment Per Portion** | `1000` | What one portion of pigment feeds in. |
| **Server Config → Talisman → Pigment Rate** | `1.0` | Pigment per pixel of stroke length. |
| **Server Config → Talisman → Pigment Per Stroke Floor** / **Cap** | `1` / `0` | The least and the most one stroke takes (`0` means no cap). |

The strokes of a 90 × 210 talisman usually sum to 400–1200 pixels, so one default brush traces about three to five of them. **A stroke with too little pigment is refused**, and once the refusals pass **Server Config → Talisman → Rejected Strokes Allowed** (default `3`) that drawing fails and the materials are gone; "the brush is no longer on the cursor" is not counted. The full brush-and-pigment rules are in [Brushes and Pigment](../player-guide/items.md#brushes-and-pigment).

## Step 5 — Tracing It at the Workstation

Place a talisman workstation (`mxt:talisman_workstation`) and right-click it open: the sheet is on the left, the formula list in the middle, the canvas on the right.

1. **Put the paper in.** That slot takes only items in `#mxt:talisman_paper`. Once it is in, the list shows every formula that **can be picked right now**: its unlock condition (`unlock_condition`, `mxt:always` by default) holds, and the paper and `costs` are affordable, so that row is selectable.
2. **Pick a formula.** If none can be picked, look at `unlock_condition` first — it reads the player **at the moment the screen opens**, so a gate like "not a high enough realm" shows up as an unpickable row.
3. **Trace it.** Every stroke's length is charged to the brush's pigment. A brush that is not on the cursor, too little pigment, a stroke over the point cap and two strokes closer together than **Minimum Stroke Interval** (300 ms by default) are all refused; enough refusals (more than 3 by default) fails the drawing.
4. **Submit.** The server scores the 1–64 strokes and at most 4096 points it received against `result.grades`: a grade that is hit produces the carrier (tier, wear, pour and extra outputs all from that grade), and if no grade is hit the attempt settles as a failure, which is when `failure_outputs` and `failure_action` run.
5. **Closing the screen is also a verdict.** Closing mid-drawing (or switching away, or pressing cancel) **judges it failed** — the sheet is not returned and `failure_action` runs, because ink on paper cannot be un-drawn. **Closing with no stroke at all** hands the whole slot back and nothing happens.

Every stroke drawn at the workstation is measured again by the server, and the completion is recomputed there; the timestamps and amounts a client reports are never read.

## Verify

A drawing recipe is a **vanilla recipe**, so `/reload` is enough to read it again (no world reload needed for the JSON at the top of this page):

```text
/reload                                  → reads the drawing recipe again
/mxt registries validate                 → and confirms the registries are fine
/give @s mxt:talisman_brush
/give @s mxt:blank_talisman 8
/give @s mxt:cinnabar 2
```

1. Put the brush on the cursor and click the cinnabar in your inventory: the brush takes one portion (1000 by default) and its tooltip gains a `Pigment: stored / capacity` line. Click twice for two portions.
2. Place a talisman workstation and right-click it open, then put the paper into the left slot: `example:flame_sigil` appears in the list (under the display name of that talisman definition). While the realm gate is unmet it is **unpickable** — that is `unlock_condition` doing its job.
3. Select it and trace all three strokes over the guide layer: `guide: "fade"` shows up as the guide fading once you start, and the brush's pigment drops with the arc length as you draw.
4. Trace carefully to `0.85` or better: the carrier comes out carrying the `example:flawless` tier (the tier line in its tooltip), a wear bar, and part of its capacity already poured (`charge_ratio: "percentage"` pours in proportion to the completion), plus one extra cinnabar.
5. Draw badly on purpose so the completion lands below `0.35`: the attempt fails, the sheet and the pigment are gone, and since `failure_outputs` is empty nothing is handed back.
6. Change `tolerance` from `0.06` to `0.02`, run `/reload` and draw the **same trace** again: the tighter tolerance turns the same wobble into a lower completion, so the grade hit drops with it.
7. Delete `charge_ratio` from the top grade and `/reload`: the product is no longer poured and nothing else changes — the scoring block and the output are two independent things.

## Common Mistakes

| Symptom | Cause |
| --- | --- |
| Not one formula in the list | This recipe type never enters the recipe book and never matches in a vanilla grid; it only appears at the talisman workstation, so look there first. |
| One formula's row cannot be picked | `unlock_condition` does not hold for the player **at the moment the screen opens**, or the paper / `costs` cannot be paid; that test does not look at the brush, which every stroke checks on its own. |
| The world refuses to load with a codec error | `pattern` or `result` is missing, `grades` is empty, `min_completion` repeats or is out of order (it has to be unique and ascending), `tolerance` or `sigma` is not positive, or a point is NaN or outside `[0,1]²`. |
| The shape lands in the wrong place | `[u, v]` are **normalised** coordinates against a fixed 90 × 210 canvas; pixel values (say `45`) fall outside `[0,1]²` and are refused at load. |
| No tier line in the product | The grade that was hit writes no `quality`, so the product carries no `mxt:quality` component; the fallback tier comes from the `default_quality` registry. |
| Writing `resample_step` / `simplify_epsilon` does nothing | They are not fields and are silently ignored like any unknown key; resampling and simplification are constants inside the judge. |
| A decent trace is still judged failed | Completion is not the only route to failure: refusals past **Server Config → Talisman → Rejected Strokes Allowed**, a submitted pattern that does not match what the server received, and stroke or point counts over the caps all fail it. |
| Closing the screen mid-drawing loses the paper | **Closing mid-drawing is a failure** (the sheet is not returned and `failure_action` runs); only closing with no stroke at all hands the slot back. |
| Wanting "a better trace yields more" | An `outputs` count is fixed in the `ItemStackTemplate` and cannot read a formula; different counts per completion means different grades. |
| Wanting a bonus from the paper's tier | `paper_rank` exists for exactly that and goes into formula fields like `max_damage` / `charge_ratio`; `outputs` cannot read it. |
| Editing the file changes nothing | A drawing recipe goes through the vanilla recipe manager, so `/reload` does read it again; but if the `talisman` definition it names is wrong, the whole file is refused at load. |

## Next

- [Talisman Drawing](../datapack/json/talisman_drawing.md) — every field in full, plus the load-time checks and the example that gates on paper tiers.
- [Talisman](../datapack/json/talisman.md) — the definition the top-level `talisman` names: what it inscribes, how much it holds, what one invocation pays, and how wear and tier land on the carrier.
- [Generic Items](../player-guide/items.md) — the talisman workstation, the brush and pigment as the player meets them.
- [Define a Talisman](./inscribe-a-talisman.md) — the prerequisite and the other half: write `example:flame_sigil` and the ability it inscribes first, then come back to see what this page draws.
