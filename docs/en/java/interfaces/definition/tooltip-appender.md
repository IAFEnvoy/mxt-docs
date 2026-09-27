---
title: TooltipAppender
---

# TooltipAppender

The registration point for item tooltips, a NeoForge extension point. Each module registers its own appender, so the resource, currency, quality and aura storage displays stay uncoupled - adding one tooltip line does not touch anybody else's.

Two shapes, both on `RegisterTooltipAppendersEvent`:

| Shape | Where it is used |
| --- | --- |
| `event.registerAppender(TooltipLocation.HEAD / POST_CUSTOM, ...)` | A section at a position: quality goes at `HEAD`, while aura storage, artifact bindings, currency value and the talisman hint follow the custom contents. |
| `event.registerComponentAppenderBeforeAll(component, TooltipAppender.createComponentAppender(component))` | A whole section driven by an **item component**: the bell, the spirit beast bag, a talisman or a storage container each register one, because the thing itself carries its own explanation. |

The rule is one appender per module: what the lines say and in which order belongs in that module's own class. How a number is spelled (at most two decimals, a sign on gains, and a translated separator between the parts of a line rather than a hard-coded punctuation mark) goes through `TooltipText`, see [Public API](../../api.md).
