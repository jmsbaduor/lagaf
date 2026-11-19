import { countAt, delay, focusRing, Frame, Header, Label, labelText, Point, Series, TOP, useReading, YAxis } from "@/canvas/kit"
import { cn } from "@/lib/utils"

import { DEC_X, LABEL_GAP, LABEL_H, LABEL_W, MAY_X, SHIFT, SHIFT_BASE, SHIFT_TICKS, shiftViews, shiftY } from "./data"

// A slope chart: December's axis at 360 and May's at 1168 share one scale (16px a million, zero at 792), and each
// source is a line between its two points. Ticks sit right-aligned before 144 with gridlines from there to May's
// points; the months head their axes on TOP, beside the value axis's name, so nothing sits under the crowded foot.
// End labels are HTML, 24 out from each axis, spread apart on a 20 pitch where the small sources crowd (data.ts).
// Docs pages, the title's subject, is the lead and draws last, over the rest.
const PLOT_L = 144
const PAD = 12
const SPAN = MAY_X - DEC_X

// The entrance is the lines: each draws from December to May, largest in May first, in shrinking steps, and its May
// label fades in as the line reaches it. Axes, ticks, December's labels and the heads are read, so they don't move.
const DRAW = 600
const AT: Record<string, number> = { "Docs pages": 100, "API reference": 160, Changelog: 200, "llms.txt": 230, "MCP tools": 250 }
const reached = (name: string) => AT[name] + countAt(SPAN + PAD, SPAN + 2 * PAD, DRAW)

const LEAD = "Docs pages"
const color = (name: string) => (name === LEAD ? "var(--viz-lead)" : "var(--viz-label)")
// Quieter lines first, so the lead draws over them where they meet.
const DRAWN = [...SHIFT].sort((a, b) => Number(a.name === LEAD) - Number(b.name === LEAD))

const say = (s: (typeof SHIFT)[number]) => `${s.name}: ${shiftViews(s.dec)} → ${shiftViews(s.may)}`

export default function Shift() {
  const { active, bind, dim } = useReading<string>()
  const on = SHIFT.find((s) => s.name === active)

  // One end label: the name in the label colour and the value in the ink, both muted while another source is read.
  // The value sits next to its point: last in December's labels, first in May's. Both are inline runs, so only the
  // label's box, set on the grid, is measured; the second run keeps 12 from the first.
  const label = (name: string, value: number, end: "dec" | "may") => {
    const muted = dim(name) && "text-muted-foreground"
    const words = [
      <span key="n" className={cn("transition-colors", muted || "text-viz-label", end === "dec" ? "" : "ml-3")}>
        {name}
      </span>,
      <span key="v" className={cn("transition-colors", muted, end === "dec" && "ml-3")}>
        {shiftViews(value)}
      </span>,
    ]
    return end === "dec" ? words : words.reverse()
  }

  return (
    <Frame>
      <Header
        title="Docs pages gained the most views"
        description="Monthly page views by source: 21.7M in December, 48M in May."
        hint={on ? say(on) : "Hover or focus a source"}
        on={!!on}
      />

      <YAxis
        name="Page views a month"
        ticks={SHIFT_TICKS.map((v) => ({ at: shiftY(v), label: v ? `${v}M` : "0" }))}
        from={PLOT_L}
        to={MAY_X + 8}
      />
      {/* The months head their axes on TOP, in 96px boxes centred on them. */}
      {(
        [
          ["Dec 2025", DEC_X],
          ["May 2026", MAY_X],
        ] as const
      ).map(([month, x]) => (
        <Label key={month} aria-hidden="true" className="absolute w-24 text-center" style={{ left: x - 48, top: TOP }}>
          {month}
        </Label>
      ))}

      {DRAWN.map((s) => (
        <Series key={s.name} x={DEC_X - PAD} y={TOP} w={SPAN + 2 * PAD} h={SHIFT_BASE + PAD - TOP} at={AT[s.name]} duration={DRAW}>
          <path
            d={s.d}
            fill="none"
            strokeWidth={4}
            shapeRendering="geometricPrecision"
            className={cn(
              "transition-opacity",
              s.name === LEAD ? "stroke-viz-lead" : "stroke-viz-label",
              dim(s.name) && "opacity-30"
            )}
          />
          <Point x={DEC_X} y={s.decY} color={color(s.name)} dim={dim(s.name)} />
          <Point x={MAY_X} y={s.mayY} color={color(s.name)} dim={dim(s.name)} />
        </Series>
      ))}

      {/* Each source reads from its December label, which takes focus; its May label reads it on hover too. */}
      <ul aria-label="Monthly page views by source, December and May">
        {SHIFT.map((s) => (
          <li
            key={s.name}
            tabIndex={0}
            aria-label={`${s.name}: ${shiftViews(s.dec)} in December, ${shiftViews(s.may)} in May`}
            className={cn(labelText, "absolute text-right whitespace-nowrap", focusRing, "focus-visible:outline-offset-2")}
            style={{ left: DEC_X - LABEL_GAP - LABEL_W, top: s.decLabel - LABEL_H / 2, width: LABEL_W }}
            {...bind(s.name)}
          >
            {label(s.name, s.dec, "dec")}
          </li>
        ))}
      </ul>
      {SHIFT.map((s) => (
        <p
          key={s.name}
          aria-hidden="true"
          className={cn(labelText, "viz-fade absolute whitespace-nowrap")}
          style={{ left: MAY_X + LABEL_GAP, top: s.mayLabel - LABEL_H / 2, width: LABEL_W, ...delay(reached(s.name)) }}
          {...bind(s.name)}
        >
          {label(s.name, s.may, "may")}
        </p>
      ))}
    </Frame>
  )
}
