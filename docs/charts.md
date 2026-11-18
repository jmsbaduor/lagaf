# Making a chart

A chart is one idea on one screen. Start from `src/canvas/data/_template/chart.tsx`, build it from the parts in `src/canvas/kit.tsx`, and run the checks at the end of this page before you call it done. To add one with an agent, the `new-chart` skill in `.claude/skills/` walks the same steps.

## Safe area and grid

- Every chart is drawn at 1440 by 900 chart px, with 72px of padding, so the content box runs from 72 to 1368 across and 72 to 828 down. The stage zooms it to the screen.
- The header fills 72 to 168. Data starts at `TOP` (232) and ends by 828, so the data area is 1296 by 596.
- Every box sits on the 4px grid: its left, right, top and bottom edges are whole multiples of 4. A text box sized by its words needs only one side edge on the grid. Press G twice on the stage to see Boxes; the readout bottom left must say no box is off.
- Rules and fields may run past the safe area to the screen's edge (the readout's crosshair does). Nothing else leaves the content box.
- Pick sizes that land on the grid by construction: a track of 800 is 8px a point, so every share is a whole bar. Where a length must be rounded, round to 4 and keep it within 2px of exact.

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
- Use the kit's CSS classes (`viz-grow-x`, `viz-grow-y`, `viz-fade`, `viz-wipe`) timed by `delay()` or `wipe()`, or the parts that wrap them (`Rule`, `Fill`, `Cell`). They are CSS animations so the frame can finish them on the first click or key and the stage can slow them. A number is a `CountUp` with its mark's delay and duration; `countAt` starts each cell of a cascade as the count passes it.
- One curve, `--viz-ease`. No springs, no bounce, no loops.
- Reduced motion lands on the end state at once. The kit handles it; don't add motion outside the kit's classes and `CountUp`.
- Answers are transitions: 150ms for a reading, 200ms for a knob. Never reorder or remount a mark to answer a knob: that replays its entrance.

## Readings and knobs

- A reading points at a part. Hover or focus an item; the header's hint shows it as "Label: value"; every other item fades its marks to about 30% and mutes its words, which still read at 4.5:1. Use `useReading`: spread `bind(key)` on each item, test `dim(key)`, and show `active` in the hint.
- Every read item takes focus: an `<li tabIndex={0}>` with `focusRing`, a `row` with a `band`, or a `Choice` radio when a pick should outlast the reading.
- A knob changes what the chart says: a format, a register, which measure. Export `knobs` from the chart file and take its values as props; the stage puts it in the bottom bar. Add one only for a real switch.

## Copy

- Titles: 3 to 6 words, sentence case, no full stop. "Docs update lag", "Where agent traffic goes".
- Descriptions: one sentence, 50 to 80 characters, ending in a full stop.
- Hints: "Hover or focus a row" (or a column, a share, a source, a stage).
- Readings: "Label: value", as the chart writes the value.
- Each row's `ideas.ts` line says what the chart shows and how to read it, in one line.

## Facts

What is drawn equals the numbers. Every number a chart draws lives in `src/canvas/data/facts.ts`, with the rule that turns it into marks (cells per percent, px per point). `facts.check.mjs` asserts the marks match what is said: counts, sums to 100, lengths on the grid and within 2px, headlines that follow from their before and after. `facts.ts` has no imports, so Node runs it as is.

## The kit

| Part | For | Used by |
| --- | --- | --- |
| `Frame`, `Header`, `TOP` | Every chart | All |
| `useReading`, `focusRing` | Hover and focus readings | All that read |
| `row`, `band` | A ruled row that tints while read | Numbers, comparison |
| `Choices`, `Choice` | Items that are radios | Waffle, dot matrix, who reads, timeline |
| `Rule` | A hairline that draws from the left | Readout, dashboard, numbers, comparison |
| `Fill` | A bar growing from its baseline | Update lag, token bar, growth |
| `Cell` | A pixel or dot that fills | Waffle, dot matrix |
| `Key` | A legend entry | Waffle, who reads |
| `Panel` | A readout panel with its tag, soft or solid | Readout, dashboard |
| `CountUp`, `countAt`, `delay`, `wipe` | Timing | Most |

Add a part to the kit only when two charts use it, with the fewest props that cover both.

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
