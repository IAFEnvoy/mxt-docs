---
title: Development Mode
description: "Enable development mode, reproduce problems, and inspect module timings over the last 240 ticks in the profiler GUI."
---

# Development Mode

## What You Are Building

Prepare an environment for reproducing problems: trade with yourself, read full formula errors and internal trace logs, and use the module profiler GUI to find where time is spent. This tutorial does not require a datapack.

## Step 1 — Enable Development Mode

| What you run | What to do |
| --- | --- |
| A production launch | Enable the server setting **Debug → Debug Mode**, off by default. In singleplayer, use the in-game server config screen. |
| A development launch | Development mode is always enabled; no configuration change is needed. |

Self-trading and logging read the current setting, so changes take effect immediately. Automatic profiling is decided only when the server starts: if you enable Debug Mode during a session, run `/mxt debug on` to start recording.

Disabling the configuration switch only affects production launches. Profiling can also be stopped separately with `/mxt debug off`, including during development launches, until you enable it again or next start the server.

## Step 2 — Use the Debugging Features

| Door | Release jar | Development mode |
| --- | --- | --- |
| Trading with yourself | `/trade` aimed at yourself is refused | The trade screen opens with one player on both sides |
| Formula failures | One warning line per distinct message, at most 512 | The whole stack trace goes to the log, unmerged and uncapped |
| Information panel overflow report | Silent | An entry whose name or value has to wrap over several lines is logged as an error |
| Internal trace log | Not printed | Trigger dispatch, subscription rebuilds, forging actions and page art are printed one line each |
| Module profiling | Off by default; can be enabled with a command | Recording starts automatically when the server starts |

**Trading with yourself** exists so the trade screen and its settlement can be driven without a second account. It runs the same pipeline a trade between two people does, so both sides still pay from their own pockets; nothing appears out of nowhere.

**Formula failures** are the problems only a running game can find, such as a division by zero or a variable that is not there. A release jar only tells you something went wrong; development mode puts the whole stack trace in the log, so you can see which formula and which line triggered it.

**The overflow report** is a layout check: when a column of the information panel cannot fit an entry's name or value and has to wrap it over two lines or more, one error is logged. The same content is reported once, so it does not flood the log.

**The internal trace log** is the running commentary a datapack or script author wants: who a signal was dispatched to, how many subscriptions one body's rebuild produced, what a forging action picked. Normal play never needs it, which is why a release jar prints none of it; development mode prints every line, uncapped.

### Effects on Logging and Gameplay

- **It does not change the log level.** The switch does not turn on debug logging; it decides whether the lines above are printed, and how many repeats of the same message are kept. A log line every player needs, such as a datapack that failed validation, is printed in both modes.
- **It adds no commands, hands out no items and changes no numbers.** It has no effect on gameplay.
- **It is not a cheat switch.** A self-trade still settles normally, and a broken formula is not "fixed" by being reported.

### Playing on Somebody Else's Server

When you are connected to a server somebody else runs:

- Server-controlled features (self-trading, formula failure logs, internal trace logs and the startup default for profiling) follow that server's switch.
- What your own client draws (the information panel's overflow report) follows the config file on your own machine.

## Step 3 — Inspect Module Timings

Profiling commands and GUI data reception both require **operator level 3** (`admin`); opening the GUI also requires a player. Start recording, then open the screen:

```mcfunction
/mxt debug on
/mxt debug gui
```

If development mode already started recording at server startup, run only the second command. Opening the screen does not enable recording, and profiling can be used without enabling development mode as a whole.

### List and Charts

| Position | Display and Controls |
| --- | --- |
| Top status | The 240-tick window and dropped batch count, or states such as recording disabled and waiting for data. |
| Top buttons | Sort by source, minimum, average or maximum duration; toggle ascending or descending order. |
| Left of each row | Module name and `min / avg / max`, in milliseconds. |
| Right of each row | A fixed 240-column bar chart, one column per tick; its upper Y-axis value appears at the top left. |
| Right of the list | Click the scrollbar track, drag its thumb or use the mouse wheel over the list. The top buttons stay fixed. |

The window holds the last 240 ticks, about 12 seconds at 20 TPS. `min`, `avg` and `max` are the minimum, average and maximum per-tick durations in that window. Complete idle ticks count as zero; incomplete ticks are excluded. Narrow windows place module names and statistics above their charts. Rows have no hover tooltips.

Each row scales its Y-axis to its own maximum, so compare modules using their millisecond values. Green means below 10 ms, yellow means 10–50 ms and red means at least 50 ms. Parent timings include nested calls; adding rows together does not give the whole server's tick duration.

In singleplayer without LAN sharing, the GUI reads local data directly, updated every server tick without a packet interval. Multiplayer and worlds opened to LAN synchronize every 5 server ticks, only while the GUI is open. Closing it, disconnecting or losing permission stops synchronization. Recording continues after the screen closes; run `/mxt debug off` when you finish investigating.

### Query Percentiles on Demand

To compare typical timings with occasional spikes, you can query after closing the charts:

```mcfunction
/mxt debug status server/cost server/economy/change
```

Specify multiple modules separated by spaces, with completion support; omit them to query every module. Output includes `min`, `avg`, `max`, 50%, 95%, 99%, call count and valid tick count over the last 240 ticks. Percentiles are calculated only when queried; the GUI displays `min / avg / max`.

The charts help locate time spent in this mod's server modules. Use spark for more accurate analysis, client rendering or issues involving other mods.

## Verify

With the switch on, `/trade <your own name>` opens the trade screen. In a production launch, turn the switch off and try again to receive the “you cannot trade with yourself” message.

Run `/mxt debug on` and `/mxt debug gui`, then trigger cultivation, an ability or another module action. Check that the relevant row's statistics and chart change. Switch sorting and scroll the list; the top buttons should stay fixed. Close the screen, run `/mxt debug status` to inspect the same window's statistics, then finish with `/mxt debug off`.

## Common Mistakes

| Symptom | Cause |
| --- | --- |
| The switch is on and a self-trade is still refused | You are connected to somebody else's server, and that server has not turned it on. |
| There is no way to turn development mode off during a development launch | Development mode stays enabled; profiling can still be stopped separately with `/mxt debug off`. |
| Turning the switch on floods the log with Trigger signal lines | That is what it does: the internal trace is printed line by line. Turning it off stops it. |
| The switch is on and there is still no debug-level logging | The switch does not turn on the debug level; it only governs its own set of messages. |
| The charts say profiling is disabled | Opening the screen does not start recording. Run `/mxt debug on`. |
| Enabling Debug Mode during a session does not start recording | Automatic recording is decided at server startup. Run `/mxt debug on` for the current session. |
| `/mxt debug` is unavailable or chart data cannot be received | Operator level 3 is required; the GUI must be opened by a player. |
| Two bars have similar heights but very different millisecond values | Each row has its own Y-axis ceiling. Compare the numbers. |

## Next

- [Tutorials](./index.md): choose a module to build.
- [/mxt Command Reference](../player-guide/commands/mxt.md): look up profiling and other subcommands.
