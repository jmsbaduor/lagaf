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

Read that chart's file before writing. Why: its measures already sit on the grid and its motion is tuned; reuse them rather than invent new ones. Never add a kit part for one chart. Why: a part earns its place when a second chart needs it.

## 3. Copy the template

- Row by what the marks are: `01-readouts` numbers, `02-pixels` counted cells, `03-bars` lengths. Anything else gets a new `NN-<row>/` with the next number and a copy of `_template/ideas.ts`, its `row` set to NN. Why: the registry orders rows by that number.
- Copy `_template/chart.tsx` to `<NN-row>/<slug>.tsx`. The slug is the URL: lowercase, hyphens, unique across rows (the registry throws on a duplicate).
- Add `[slug, idea]` to the row's `ideas.ts`. Why: only listed files show.

## 4. Numbers in facts.ts

- Put the data and the rule that sizes it (px a point, cells a percent) in `facts.ts`, and assert it in `facts.check.mjs`: totals, counts, lengths on 4px and within 2px of exact.
- Draw only numbers the request gives. Never invent, round or "illustrate" one; if one is missing, ask. Why: these charts state facts, and a drawn number that differs from the stated one makes the chart false.

## 5. Layout

- Data from `TOP` to no lower than 828, across 72 to 1368.
- Choose sizes that land on 4px by construction (an 800 track is 8px a point). Why: `check:browser` fails any box off the 4px grid, and a fractional edge blurs.

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
