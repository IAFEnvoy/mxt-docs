---
title: TooltipAppender
---

# TooltipAppender

The registration point for item tooltips, a NeoForge extension point. Each module registers its own appender, so the resource, currency, quality and aura storage displays stay uncoupled - adding one tooltip line does not touch anybody else's.

Two shapes, both on `RegisterTooltipAppendersEvent`:

| Shape | Where it is used |
| --- | --- |
| `event.registerAppender(TooltipLocation.HEAD / POST_CUSTOM, ...)` | A section at a position: quality goes at `HEAD`, while aura storage, artifact bindings, currency value and the talisman hint follow the custom contents. |
| `event.registerComponentAppenderBeforeAll(component, TooltipAppender.createComponentAppender(component))` | A whole section driven by an **item component**: the bell, the spirit beast bag, a formation plate or a storage container each register one, because the thing itself carries its own explanation. |

**Appenders at one location run in registration order** (the order their event handlers are called in), so a block of lines that has to read in a fixed order can only come from a single appender - split across two, it cannot be ordered. A talisman carrier is the case: its inscriptions, charge and gesture hint are all written in order by `TalismanTooltipAppender`, and the aura storage line steps aside for a carrier; the quality line still comes from the quality module at `HEAD`, on top.

The rule is one appender per module: what the lines say and in which order belongs in that module's own class. How a number is spelled (at most two decimals, a sign on gains, and a translated separator between the parts of a line rather than a hard-coded punctuation mark) goes through `TooltipText`, see [Public API](../../api.md).
