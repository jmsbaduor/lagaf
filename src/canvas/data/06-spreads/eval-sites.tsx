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
} from "@/canvas/kit"
import { cn } from "@/lib/utils"

import { AXIS_MAX, AXIS_MIN, mean, SITE_CELL, SITE_SLOT, siteCounts, SITES } from "./data"
import "./spreads.css"

// One cell a percentage point both ways, 91 to 100, so the no-change line is the diagonal of hatched cells and a
// square's height above it is its gain. A cell holds up to 9 sites as 12px squares, 4px from each other and the edges.
const N = AXIS_MAX - AXIS_MIN + 1
const PLOT = N * SITE_CELL // 520
const PLOT_X = 128 // after the 48px tick column and 8
const PLOT_Y = TOP + 32 // under the y axis's name
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

      {/* Each axis is named at its far end: after at the top of the y axis, before at the end of the x axis. */}
      <Label className="absolute left-[72px]" style={{ top: TOP }}>
        After llms.txt, % correct
      </Label>
      <div aria-hidden="true" className="absolute left-[72px] w-12" style={{ top: PLOT_Y }}>
        {VALUES.toReversed().map((v) => (
          <p key={v} className={cn(smallLabelText, "text-right leading-[52px] text-viz-label")}>
            {v}
          </p>
        ))}
      </div>
      <div aria-hidden="true" className="absolute flex" style={{ left: PLOT_X, top: PLOT_Y + PLOT + 8 }}>
        {VALUES.map((v) => (
          <p key={v} className={cn(smallLabelText, "w-[52px] text-center text-viz-label")}>
            {v}
          </p>
        ))}
      </div>
      <Label className="absolute" style={{ left: PLOT_X + PLOT + 16, top: PLOT_Y + PLOT + 8 }}>
        Before llms.txt, % correct
      </Label>

      <div className="absolute" style={{ left: PLOT_X, top: PLOT_Y, width: PLOT, height: PLOT }}>
        {/* Hairlines on every cell's top and left edge, and the plot's right and bottom edges. */}
        <div
          aria-hidden="true"
          className="absolute inset-0"
          style={{
            backgroundImage:
              "linear-gradient(to right, var(--color-border) 1px, transparent 1px), linear-gradient(to bottom, var(--color-border) 1px, transparent 1px)",
            backgroundSize: `${SITE_CELL}px ${SITE_CELL}px`,
            boxShadow: "inset -1px -1px 0 var(--color-border)",
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
              className="viz-fade absolute size-3 before:absolute before:-inset-0.5"
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
              <span
                aria-hidden="true"
                // A site that isn't read mixes toward the paper rather than turning see-through, so the hatch
                // under a square on the line doesn't show through it.
                className={cn(
                  "spread-rise block size-full bg-viz-lead transition-colors",
                  dim(s.name) && "bg-[color-mix(in_oklch,var(--viz-lead)_30%,var(--viz-paper))]"
                )}
                style={
                  {
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
