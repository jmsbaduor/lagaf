import { useId, type CSSProperties } from "react"

import {
  Choice,
  Choices,
  CountUp,
  delay,
  Frame,
  Header,
  Label,
  note,
  smallLabelText,
  TOP,
  useReading,
  XAxis,
  YAxis,
} from "@/canvas/kit"
import { cn } from "@/lib/utils"

import { AXIS_MAX, AXIS_MIN, mean, SITE_CELL, SITE_SLOT, siteCounts, SITES } from "./data"
import "./spreads.css"

// One cell a percentage point both ways, 91 to 100, so the no-change line is the diagonal of hatched cells and a
// square's height above it is its gain. A cell holds up to 9 sites as 12px squares, 4px from each other and the edges.
// Both axes are banded: each tick labels its row or column of cells.
const N = AXIS_MAX - AXIS_MIN + 1
const PLOT = N * SITE_CELL // 520
const PLOT_X = 128 // after the 48px tick column and 8
const PLOT_Y = TOP + 24 // a banded axis's top tick sits mid-cell, so the plot can start 8 under the y axis's name
const PANEL_X = 744
const VALUES = Array.from({ length: N }, (_, i) => AXIS_MIN + i)
const x = (v: number) => (v - AXIS_MIN) * SITE_CELL
const y = (v: number) => (AXIS_MAX - v) * SITE_CELL

// Left to right, so arrow keys move across the plot.
const ORDER = SITES.map((s, i) => ({ ...s, slot: SITE_SLOT[i] })).sort(
  (a, b) => a.before - b.before || a.after - b.after
)

// The entrance is the change: every site appears on the no-change line at its before, then rises to its after, a
// column at a time, while the mean counts up. The grid, the line and the words are there from the start.
const APPEAR = 100
const RISE_AT = 300
const RISE = 600
const STAGGER = 12

const ROWS = [
  { name: "Gained", where: "above the line", n: siteCounts.gained, swatch: "" },
  {
    name: "Held",
    where: "on the line",
    n: siteCounts.held,
    swatch: "viz-hatch",
  },
  { name: "Fell", where: "below the line", n: siteCounts.fell, swatch: null },
]

export default function EvalSites() {
  const name = useId()
  const { active, bind, dim } = useReading<string>()
  const on = SITES.find((s) => s.name === active)
  const [before, after] = [mean("before"), mean("after")]

  return (
    <Frame>
      <Header
        title="No site lost accuracy"
        description="Each square is one site’s accuracy on 100 questions, before and after."
        hint={on ? `${on.name}: ${on.before}% to ${on.after}%` : "Hover or focus a site"}
        on={!!on}
      />

      {/* The read site's before and after turn to the ink on their axes. */}
      <YAxis
        name="After llms.txt, % correct"
        ticks={VALUES.map((v) => ({ at: PLOT_Y + y(v), label: String(v), on: on?.after === v }))}
        from={PLOT_X}
        band={SITE_CELL}
      />
      <XAxis
        name="Before llms.txt, % correct"
        ticks={VALUES.map((v) => ({ at: PLOT_X + x(v), label: String(v), on: on?.before === v }))}
        y={PLOT_Y + PLOT}
        to={PLOT_X + PLOT}
        band={SITE_CELL}
      />

      <div className="absolute" style={{ left: PLOT_X, top: PLOT_Y, width: PLOT, height: PLOT }}>
        {/* Hairlines on every cell's top and left edge, and the plot's right and bottom edges. */}
        <div
          aria-hidden="true"
          className="absolute inset-0"
          style={{
            backgroundImage:
              "linear-gradient(to right, var(--viz-hatch) 1px, transparent 1px), linear-gradient(to bottom, var(--viz-hatch) 1px, transparent 1px)",
            backgroundSize: `${SITE_CELL}px ${SITE_CELL}px`,
            boxShadow: "inset -1px -1px 0 var(--viz-hatch)",
          }}
        />
        {VALUES.map((v) => (
          <div
            key={v}
            aria-hidden="true"
            className="viz-hatch absolute"
            style={{
              left: x(v),
              top: y(v),
              width: SITE_CELL,
              height: SITE_CELL,
            }}
          />
        ))}
        <p
          aria-hidden="true"
          className={cn(smallLabelText, "absolute whitespace-nowrap text-viz-label")}
          style={{ left: x(AXIS_MIN + 2) + 8, top: y(AXIS_MIN + 1) + 16 }}
        >
          No change
        </p>

        <Choices legend="Read a site's accuracy">
          {ORDER.map((s) => (
            <Choice
              key={s.name}
              name={name}
              value={s.name}
              // The square is 12px; its hit area runs 2px further, so a cell's squares tile with no gaps between.
              className="viz-fade absolute size-3 before:absolute before:-inset-0.5 has-[:focus-visible]:outline-offset-1"
              style={{
                left: x(s.before) + 4 + (s.slot % 3) * 16,
                top: y(s.after) + 4 + Math.floor(s.slot / 3) * 16,
                ...delay(APPEAR),
              }}
              {...bind(s.name)}
            >
              <span className="sr-only">
                {s.name}: {s.before}% to {s.after}%
              </span>
              {/* A site that isn't read fades toward the paper rather than turning see-through, so the hatch under
                  a square on the line doesn't show through it. */}
              <span
                aria-hidden="true"
                data-dim={dim(s.name) || undefined}
                className="spread-rise px-cell block size-full"
                style={
                  {
                    "--px": "var(--viz-lead)",
                    "--rise": `${(s.after - s.before) * SITE_CELL}px`,
                    ...delay(RISE_AT + (s.before - AXIS_MIN) * STAGGER, RISE),
                  } as CSSProperties
                }
              />
            </Choice>
          ))}
        </Choices>
      </div>

      {/* The mean of the squares, as the eval states it, and what each side of the line holds. */}
      <div className="absolute w-[624px]" style={{ left: PANEL_X, top: PLOT_Y }}>
        <Label>Mean of {SITES.length} sites</Label>
        <p className="mt-4 -indent-0.5 font-heading text-[64px] leading-16 font-medium tracking-[-0.03em]">
          {before.toFixed(1)}% →{" "}
          <CountUp
            value={after - before}
            delay={RISE_AT}
            duration={RISE}
            format={(n) => `${(before + n).toFixed(1)}%`}
          />
        </p>
        {/* Rules as inset shadows, so they take no room and every row's words stay on the grid. */}
        <ul className="mt-12 shadow-[inset_0_1px_0_var(--color-border)]">
          {ROWS.map((r) => (
            <li
              key={r.name}
              className={cn(note, "flex h-15 items-center gap-4 shadow-[inset_0_-1px_0_var(--color-border)]")}
            >
              <span aria-hidden="true" className={cn("grid size-5 place-items-center", r.swatch)}>
                {r.swatch !== null && <span className="size-3 bg-viz-lead" />}
              </span>
              <span className="flex-1">
                {r.name}, <span className="text-muted-foreground">{r.where}</span>
              </span>
              <span className="w-12 text-right font-mono">{r.n}</span>
            </li>
          ))}
        </ul>
      </div>
    </Frame>
  )
}
