---
name: new-chart
description: Adds a chart to lagaf from a request like "a chart of X" or "add a chart showing Y". Picks the closest existing chart and kit parts, copies the template into a row, puts the numbers in facts.ts with a check, writes the header copy, picks colour roles, then runs pnpm check, pnpm check:browser and light and dark captures. Use for any new chart or new row of charts in src/canvas/data.
---

# New chart

Walk every step, in order. `docs/charts.md` has the full rules; this is the procedure.

## 1. One idea

Write the chart's `ideas.ts` line first: what it shows and how it is read. If it needs "and", make two charts. Why: the stage shows one chart a screen, and a chart that says two things says neither.

## 2. Closest chart and parts

| The data | Start from | Parts |
| --- | --- | --- |
| 1 to 4 headline numbers | `readout`, `dashboard`, `numbers` | `Panel`, `Rule`, `CountUp`, `note` |
| Rows of words compared | `comparison` | `row`, `band`, `Rule` |
| A share of 100 | `waffle` | `Cell`, `Key`, `Choice`, `countAt` |
| A share of a small count | `dot-matrix` | `Cell`, `Choice`, `countAt` |
| Several splits side by side | `who-reads` | `Key`, `Choice`, `wipe` |
| Stages in time | `timeline` | `Choice`, `wipe` |
| Shares that make 100 | `update-lag` | `Fill` (y), `viz-hatch` |
| A part of its whole | `token-bar` | `Fill`, `viz-hatch` |
| Values on one scale | `growth`, or the template | `Fill`, `CountUp` |
| Before and after | `eval-rows` | `CountUp`, `--viz-from` |
| A line over time | `agent-share` | `Series`, `Point`, `YAxis`, `XAxis`; row 04's `Months`, `Line`, `EndLabel` |
| Two series that cross | `crossover` | as a line over time, with `Key` |
| A value held for each period (steps) | `answer-time` | row 04's `Line` with `step`, `Series`, `Point` |
| Parts of a whole, as a ring | `formats` | d3's `arc`, `viz-sweep`, `Key`, `band`, `CountUp` |
| Many parts sized by value (treemap) | `sources` | `squarify` in `05-parts/data.ts`, `wipe`, `Key`, `focusRing` |
| One whole split in segments (100% bar) | `team-review` | `Fill`, `CountUp`, `focusRing` |
| Each item on two measures (scatter) | `eval-sites` | `YAxis` and `XAxis` with `band`, `Choice`, `px-cell` |
| A value by two categories (heatmap) | `rhythm` | `YAxis` and `XAxis` with `band`, `Choice`, `wipe`, a stepped ramp |
| A distribution (histogram) | `answer-spread` | `YAxis`, `XAxis`, `Fill` (y), `Choice` |
| Columns over time, the part that matters drawn deeper | `trajectory` | `Fill` (y), `YAxis`, `XAxis`, `Choice`, `Key` |
| Two parts stacked over time | `daily-requests` | `Fill` (y), `YAxis`, `XAxis`, `Choice`, `Key`, a count or share knob |
| A line with events marked on it | `milestones` | `Series`, `Point`, `YAxis`, `XAxis`, `countAt` |
| Items ranked, the top few as cards | `leaderboard` | `row`, `band`, `Fill`, `CountUp`, `Rule`, row 08's icons |
| Items ranked above one bar for their total | `all-readers` | `row`, `band`, `Fill`, `CountUp`, `Rule` |
| Flow between steps (Sankey) | `journeys` | `XAxis`, `delay`, `focusRing`, the band paths in `09-flows/data.ts` |
| One value against a reference on a dial | `gauge` | d3's `arc`, `viz-sweep`, `CountUp`, `Rule` |
| A value beside a split on a clock face | `time-saved` | d3's `arc`, `viz-sweep`, `Key`, `band` |
| A start, the steps between and an end (waterfall) | `bridge` | `YAxis`, `XAxis`, `Key`, `CountUp`, a top-origin grow for a fall |
| Each item's change between two points (slope) | `shift` | `Series`, `Point`, `YAxis`, `countAt`, `spread` in `10-changes/data.ts` for end labels |
| Stages that narrow, with the drop between (funnel) | `funnel` | `Fill`, `CountUp`, `focusRing`, `viz-hatch` for the drop |
| The state of many items over time (status grid) | `freshness` | `YAxis` and `XAxis` with `band`, `Choice`, `wipe`, `CountUp`, warn and alert roles |
| A share at two points, joined (ribbons) | `ribbons` | `Key`, `CountUp`, SVG ribbon paths, a share or count knob |
| Each item's share of its own whole (ring row) | `rings` | d3's `arc`, `viz-sweep`, `CountUp`, `Fill` for the overall share |
| A count as icons, one per unit (isotype) | `icon-count` | `Choice`, `Key`, `countAt`, `CountUp`, Central Icons as in row 08 |
| A spread per period with its median (range) | `ranges` | `YAxis`, `XAxis`, `Key`, `CountUp`, spans that grow from the median |
| Each item at two points on one scale (dumbbell) | `dumbbell` | `XAxis`, `Key`, `CountUp`, a bar that grows from the first dot |
| Ranks over time (bump) | `bump` | `Series`, `Point`, `YAxis`, `XAxis`, `countAt`, row 08's icons |
| A value for every day (calendar) | `calendar` | `YAxis` and `XAxis`, `Choice`, `wipe`, `Fill` for weekly totals, a stepped ramp |
| Two groups back to back by category (butterfly) | `butterfly` | `row`, `band`, `Key`, `CountUp` |
| Numbers against goals (bullet) | `bullets` | `row`, `band`, `Fill`, `Key`, `CountUp`, band tones and a goal tick |
| Several numbers, each with its trend (sparkline tiles) | `sparklines` | `Series`, `Point`, `Rule`, `CountUp` |

If no row fits the data, say so and ask before forcing it into the nearest chart. Why: a chart built for another shape misreads the data.

Read that chart's file before writing. Why: its measures already sit on the grid and its motion is tuned; reuse them rather than invent new ones. Never add a kit part for one chart. Why: a part earns its place when a second chart needs it.

## 3. Copy the template

- Row by what the marks are: `01-readouts` numbers, `02-pixels` counted cells, `03-bars` lengths, `04-lines` lines over time, `05-parts` parts of a whole, `06-spreads` spreads (scatters, heatmaps, histograms), `07-series` time with the part that matters called out, `08-ranks` ranked items, `09-flows` flows and dials, `10-changes` how a number changed, `11-status` the state of many items, `12-shares` shares as ribbons, rings and icons, `13-moves` ranges, pairs and ranks that move, `14-hours` when reading happens, `15-goals` goals and trends. Anything else gets a new `NN-<row>/` with the next number and a copy of `_template/ideas.ts`, its `row` set to NN. Why: the registry orders rows by that number.
- Copy `_template/chart.tsx` to `<NN-row>/<slug>.tsx`. The slug is the URL: lowercase, hyphens, unique across rows (the registry throws on a duplicate).
- Add `[slug, idea]` to the row's `ideas.ts`. Why: only listed files show.

## 4. Numbers in facts.ts

- Put the data and the rule that sizes it (px a point, cells a percent) in `facts.ts`, and assert it in `facts.check.mjs`: totals, counts, lengths on 4px and within 2px of exact.
- Real data: draw only numbers the request gives; if one is missing, ask. Why: these charts state facts, and an invented number makes the chart false.
- Demo data, only when the request asks for a demo or example: draw from `DEMO` in `facts.ts`, derive from it, or add numbers that contradict none of it, and assert each. Make it feel real (uneven, a few outliers, not suspiciously round). Why: the demo charts tell one story, and one chart that disagrees with another breaks it.
- Every claim in the title, description or hint gets an assert that the data bears it out. Why: a statement is a number in words.

## 5. Layout

- Data from `TOP` to no lower than 828, across 72 to 1368.
- Choose sizes that land on 4px by construction (an 800 track is 8px a point). Why: `check:browser` fails any box off the 4px grid, and a fractional edge blurs.
- A chart with axes follows "SVG and plots" in `docs/charts.md`, through `YAxis`, `XAxis`, `Series` and `Point`: names at the axes' far ends, `tickText` ticks, `viz-hatch` gridlines, 4px strokes, 16px points, and readings that fade the rest rather than tint. Why: one convention, so a new plot reads as one with the others.

## 6. Copy

- Title: 3 to 6 words, sentence case, no full stop. The finding or the subject, never "Chart of X".
- Description: one sentence, 50 to 80 characters, with a full stop. Count them.
- Hint "Hover or focus a <item>"; reading "<Label>: <value>".
Why: every header has the same rhythm, so the set reads as one system.

## 7. Roles, not colours

- What the chart is about is `viz-lead`; a compared series `viz-contrast`; `viz-warn` and `viz-alert` only when the data means a warning; empty is `viz-track`.
- Never hex, never a palette class like `bg-green-600`. Why: roles follow the accent and `contrast.mjs` measures them; anything else fails in some accent or mode.

## 8. Motion and knobs

- One entrance that explains the data, through the kit's parts and classes, done within about 1s, in shrinking steps. Nothing that is only read moves. Why: motion that doesn't explain the data is noise, and only CSS animations can be finished and paced by the stage.
- Every readable item takes focus and is bound to `useReading`; unread items `dim`.
- Add a knob only for a real switch of what the chart says (a measure, a format, a register). Answer it with a 200ms transition on the same elements; never reorder or remount marks. Why: moved or remounted nodes replay their entrance.

## 9. Check and look

1. `pnpm check` passes.
2. `pnpm check:browser` passes, with the new slug at 0 off.
3. `node scripts/shoot.mjs <dir> <slug>`, then open both captures: data starts on `TOP`, nothing overlaps or clips, the last mark ends by 828, the hint fits the title's line, dark reads as well as light.
4. Hover an item and flip each knob in the dev server, and look again.

Why: the scripts catch the grid, contrast and facts; only looking catches a bad layout. Fix and repeat until all four pass, then report the slug, the row and what you checked.
