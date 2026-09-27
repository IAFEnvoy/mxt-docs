---
title: NamedDefinition
---

# NamedDefinition

The two display texts a datapack definition carries: `name()` and `description()`. Both are optional fields in JSON, and an omitted one is filled in by `ContextNameCodec` while the entry loads with **that definition's own translation key**, so a pack either translates the generated key or writes the text out.

| Member | Description |
| --- | --- |
| `Component name()` | The definition's own name: what the pack wrote, or the generated key. |
| `Component description()` | The definition's own description; when the field is absent, the name key with `.description` appended. |

Display code asks the definition instead of deriving the key itself, which is what lets a written name win over the generated one. To get a display name, call `DefinitionText.name(holder, category)` (see [Public API](../../api.md)): it recognises this interface and reads the fields, and otherwise derives the key from the holder's key.

**There is one way to spell the key**: `<category>.<registry namespace>.<definition namespace>.<path>`, where the category is the registry's own path and the registry namespace is always `mxt` - `mxt:fire` in `mxt:aura` is `aura.mxt.mxt.fire`. Do not build a second set of name keys anywhere else.
