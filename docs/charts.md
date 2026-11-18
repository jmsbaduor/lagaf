# Making a chart

A chart is one idea on one screen. Start from `src/canvas/data/_template/chart.tsx`, build it from the parts in `src/canvas/kit.tsx`, and run the checks at the end of this page before you call it done. To add one with an agent, the `new-chart` skill in `.claude/skills/` walks the same steps.

## Safe area and grid

- Every chart is drawn at 1440 by 900 chart px, with 72px of padding, so the content box runs from 72 to 1368 across and 72 to 828 down. The stage zooms it to the screen.
- The header fills 72 to 168. Data starts at `TOP` (232) and ends by 828, so the data area is 1296 by 596.
- Every box sits on the 4px grid: its left, right, top and bottom edges are whole multiples of 4. A text box sized by its words needs only one side edge on the grid. Press G twice on the stage to see Boxes; the readout bottom left must say no box is off.
- Rules and fields may run past the safe area to the screen's edge (the readout's crosshair does). Nothing else leaves the content box.
- Pick sizes that land on the grid by construction: a track of 800 is 8px a point, so every share is a whole bar. Where a length must be rounded, round to 4 and keep it within 2px of exact. A part under 4px draws at 4, the grid's least: in sources, MCP tools' people are 2.1px of their tile and draw at 4.

## Header

`<Header>` sets it; don't style a title yourself.

- Title: Geist 48/52, -0.03em, at 72, 72.
- Description: Geist 24/32 in the muted ink, 12px under the title.
- Hint: top right on the title's line, in the label face. It holds the instruction until something is read, then the reading in the ink.
- The header never moves on entrance. The data's top line is `TOP`, from the kit, never a number you type.

## Colour roles

Use roles only: `bg-viz-lead`, `text-viz-label`, `var(--viz-track)`. Never hex. The accent re-skins every role, in light and dark.

| Role | Use it for |
| --- | --- |
| `viz-lead` | The marker: the bar, cell or dot the chart is about. One per chart unless a second series is compared. |
| `viz-lead-ink` | Text on the lead colour: a tag, a number on a bar. |
| `viz-contrast` | The series compared against the lead (human growth against agent growth). |
| `viz-warn`, `viz-warn-ink` | A middling share. Yellow is 1.5:1 on the paper, so give the mark a `ring-viz-warn-edge` inset ring. |
| `viz-alert`, `viz-alert-ink` | A share that needs attention. |
| `viz-panel`, `viz-panel-ink` | A readout panel, or at 40% a read row's band. |
| `viz-deep`, `viz-deep-ink` | The inverse panel, beside a lead panel. |
| `viz-track` | An empty cell or track, and a panel that isn't read. |
| `viz-hatch` | Hairline rules and the `viz-hatch` headroom fill. |
| `viz-label` | Mono labels. |
| `foreground`, `muted-foreground`, `border` | Words, words that aren't read, rules on the paper. |

For hand-written CSS, mix toward `var(--viz-ink)` or `var(--viz-paper)`. Text needs 4.5:1 and marks and large numbers need 3:1; `contrast.mjs` measures every pair in every accent. A new pairing gets a line in its `PAIRS`.

## Type

- Geist for words and big numbers, Geist Mono for labels and readout numbers. Every number uses tabular figures; the frame sets them.
- `labelText` is the label face (mono 14/16, uppercase, 500); `Label` is that face as a `<p>` in `viz-label`. `smallLabelText` is 12/16, for a bar's name or a date.
- `note` is 22/28 for a note under a number, a table cell or a caption. Readout notes add `font-medium`.
- Big numbers are sized per chart, with a line height on the 4px grid and tracking from -0.02em to -0.05em. Pull them left by the digits' side bearing (`-indent-1`, `-indent-2`) so the ink starts on the edge below.
- `panelNumber` is a readout panel's mono number; give its `CountUp` `inkEnd(reading)` so an "s" or "M" ends on the rule.

## Motion

- One entrance, and it explains the data: a bar grows from its baseline, a rule draws, cells fill as the number counts, a pixel field wipes in a column at a time.
- Nothing that is only read moves: the header, labels, notes, tracks and hatch are there from the start.
- The whole entrance ends within about 1s. Marks start at 100ms, run 500 to 700ms, and stagger in shrinking steps (100, 160, 200, 230) so a list lands as one wave.
- Use the kit's CSS classes (`viz-grow-x`, `viz-grow-y`, `viz-fade`, `viz-wipe`, `viz-draw`) timed by `delay()` or `wipe()`, or the parts that wrap them (`Rule`, `Fill`, `Cell`). They are CSS animations so the frame can finish them on the first click or key and the stage can slow them. A number is a `CountUp` with its mark's delay and duration; `countAt` starts each cell of a cascade as the count passes it.
- One curve, `--viz-ease`. No springs, no bounce, no loops.
- Reduced motion lands on the end state at once. The kit handles it; don't add motion outside the kit's classes and `CountUp`.
- Answers are transitions: 150ms for a reading, 200ms for a knob. Never reorder or remount a mark to answer a knob: that replays its entrance.

## Readings and knobs

- A reading points at a part. Hover or focus an item; the header's hint shows it as "Label: value"; every other item fades its marks to about 30% and mutes its words, which still read at 4.5:1. Use `useReading`: spread `bind(key)` on each item, test `dim(key)`, and show `active` in the hint.
- Every read item takes focus: an `<li tabIndex={0}>` with `focusRing`, a `row` with a `band`, or a `Choice` radio when a pick should outlast the reading. Each shows a 2px ring in `ring` while focus is visible, and nothing at rest. In a grid with 4px gaps, give the `Choice` `has-[:focus-visible]:outline-offset-1` so its ring stays in the gap.
- Never put an outline class on a read item outside a `focus-visible` variant, nor `outline-none` beside the ring's: at rest the stage's Boxes layer owns every outline (0.5px, transparent until Boxes is on), so a bare `outline-ring` paints it as a 1px ring on every item, and `outline-none` sets the style `outline-2` reads, so the ring never draws.
- A knob changes what the chart says: a format, a register, which measure. Export `knobs` from the chart file and take its values as props; the stage puts it in the bottom bar. Add one only for a real switch.

## SVG and plots

A chart with axes (lines, scatters, heatmaps, histograms) follows one convention, so every plot reads as one system with the rest. `YAxis`, `XAxis`, `Series` and `Point` in the kit draw it.

- **SVG only for what HTML can't draw.** Lines and points go in a `Series`: an SVG whose user units are the frame's px (its viewBox is its own box), so they take the same coordinates as everything else. Ticks, names, bars and cells stay HTML. Why: `check:browser` holds HTML boxes to the 4px grid and can't see inside an SVG.
- **The y axis.** A value axis is named at its far end: a `Label` on `TOP` at 72. Tick labels are right-aligned 8 before the plot's left edge and centred on their value; the highest clears the name by 8, so a plot with gridlines starts at `TOP + 32`, and a banded one (its ticks sit mid-cell) at `TOP + 24`. Why: the name sits where the eye meets the axis, and each tick hugs what it measures.
- **The x axis.** Tick labels sit 12 under the baseline, centred on their value or their band. A value axis is named at its far end too, right-aligned to the plot's right edge on the line under the ticks. A time or category axis (months, hours, weekdays) takes no name: its ticks say what it is. Nothing runs past 828.
- **Ticks.** `tickText`, mono 12/16 in `viz-label`, keeping their unit's case (2s, 10M, 09:00): a tick is a value. Names (axes, keys) are `Label`, uppercase. A tick centred on a point is 48 wide, or 44 when the point is mid-grid, so its box lands on the grid.
- **Gridlines.** A 1px `viz-hatch` line at each tick, zero included, across the plot, and no other axis line. A grid of cells draws its own hairlines (eval sites) or none (rhythm). Why: rules that aren't data stay one quiet colour; rows' rules are `border`, the same value.
- **Marks.** Strokes are 4px, one grid unit, with butt caps and miter joins; straight runs are `crispEdges`, slopes `geometricPrecision`. A point is a 16px square, the Key's swatch, with a 2px ring in the paper, so it parts from a line or a point it meets (crossover's April points sit edge to edge). Where several share a cell they are 12px on a 16px pitch (eval sites). Bars and cells are whole 4px.
- **Reading.** The read item keeps its colour and its ticks turn to the ink; every other mark fades to about 30% toward the paper (`dim`, `data-dim`). Nothing tints behind the plot. Why: a column tint over the lines was heavy in dark mode, and fading the rest says the same with less ink. A heatmap's read cell also takes a 2px ring in the ink, since it can be paler than its faded neighbours.
- **Entrance.** A Series wipes in left to right (`viz-draw`), so x is time and two lines cross on screen when they cross in the data; bars grow, cells wipe, points rise. Axes, ticks and gridlines are there from the start.
- **Sequential colour.** A ramp's steps must stay apart: heatmap steps run from the track to the lead in even steps, and the top step goes on past the lead (toward `viz-deep` in light, the ink in dark), so no two neighbours read as one.

## Copy

- Titles: 3 to 6 words, sentence case, no full stop. "Docs update lag", "Where agent traffic goes".
- Descriptions: one sentence, 50 to 80 characters, ending in a full stop.
- Hints: "Hover or focus a row" (or a column, a share, a source, a stage).
- Readings: "Label: value", as the chart writes the value.
- Each row's `ideas.ts` line says what the chart shows and how to read it, in one line.

## Facts

What is drawn equals the numbers. Every number a chart draws lives in `src/canvas/data/facts.ts`, with the rule that turns it into marks (cells per percent, px per point). `facts.check.mjs` asserts the marks match what is said: counts, sums to 100, lengths on the grid and within 2px, headlines that follow from their before and after. `facts.ts` has no imports, so Node runs it as is.

### Real data and demo data

- **Real data** comes from the request. Draw only those numbers; if one is missing, ask.
- **Demo data** is made up, and only when the request asks for a demo or example chart. It still has to be true of itself and of every other chart: the demo charts tell one story (`DEMO` in `facts.ts`: a docs platform from December to May, agents growing ninefold to 62% of 48M monthly views, answers in 0.8s). Draw from `DEMO`, derive from it, or add numbers that contradict none of it, and assert each one. Make it feel real: uneven months, a few outliers, plausible magnitudes, nothing suspiciously round.
- **Statements are facts too.** A title, description or hint that says something about the data ("Agents passed people in April") gets an assert that it holds.
- A row may keep its own derived numbers in `<NN-row>/data.ts` with asserts in `data.check.mjs`, importing `../facts.ts`; `pnpm check` runs every check.

## The kit

| Part | For | Used by |
| --- | --- | --- |
| `Frame`, `Header`, `TOP` | Every chart | All |
| `useReading`, `focusRing` | Hover and focus readings | All that read |
| `row`, `band` | A ruled row that tints while read | Numbers, comparison |
| `Choices`, `Choice` | Items that are radios | Waffle, dot matrix, who reads, timeline, eval sites, rhythm, answer spread |
| `Rule` | A hairline that draws from the left | Readout, dashboard, numbers, comparison |
| `Fill` | A bar growing from its baseline | Update lag, token bar, growth, team review, answer spread |
| `Cell` | A pixel or dot that fills | Waffle, dot matrix (eval sites uses its `px-cell` fade) |
| `Key` | A legend entry | Waffle, who reads, crossover, formats, sources |
| `Panel` | A readout panel with its tag, soft or solid | Readout, dashboard |
| `CountUp`, `countAt`, `delay`, `wipe` | Timing | Most |
| `YAxis`, `XAxis`, `tickText` | A plot's axes: names, ticks and gridlines | Agent share, crossover, answer time, eval sites, rhythm, answer spread |
| `Series`, `Point` | Lines and points in frame px, drawn in left to right | Agent share, crossover, answer time |

Add a part to the kit only when two charts use it, with the fewest props that cover both. A row's own layout (row 04's month columns, `Months`, `Line`, `EndLabel`) stays in its `parts.tsx`; the formats ring's sweep stays in `05-parts/parts.css` until a second chart sweeps.

## Checks

```bash
pnpm check
```

Typecheck, lint, build and the facts check.

```bash
pnpm check:browser
```

`contrast.mjs`, then Boxes on every chart: it fails if any box is off the 4px grid. It uses `BASE`, else the running dev server, else starts one and stops it after.

```bash
node scripts/shoot.mjs /tmp/shots <slug>
```

Captures the chart in light and dark. Open both and look: the data starts on `TOP`, nothing overlaps or clips, the last mark ends by 828, and the hint fits on the title's line.
