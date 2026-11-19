import { arc } from "d3-shape"
import { useId, type CSSProperties } from "react"

import { band, delay, Frame, Header, Key, Label, row, TOP, useReading } from "@/canvas/kit"
import { cn } from "@/lib/utils"

import { DOCS_SHARE, HOURS, MINUTES_EACH, QUESTIONS, SPLIT } from "./data"
// The formats ring's sweep: a mask's stroke grows round the ring to --sweep on the kit's curve.
import "./flows.css"

// A clock face 576 across at the right of the content box (792 to 1368, TOP to 808, level with the rows): 100
// ticks round its edge, a whole percent each, every tenth twice as long; inside them the split as two arcs 72 thick,
// with square ends and a constant 4px gap; and a hand from the centre to where the docs' share ends.
const R = 288
const ARC_OUT = 248
const ARC_IN = 176
const HAND = 160
const GAP = 4
const ring = arc<{ start: number; end: number }>()
  .innerRadius(ARC_IN)
  .outerRadius(ARC_OUT)
  .startAngle((d) => d.start * 2 * Math.PI)
  .endAngle((d) => d.end * 2 * Math.PI)
  .padRadius(ARC_OUT)
  .padAngle(2 * Math.asin(GAP / 2 / ARC_OUT))
const RING_X = 1368 - 2 * R

const ARCS = SPLIT.map((s, i) => {
  const start = SPLIT.slice(0, i).reduce((n, x) => n + x.share, 0) / 100
  return { ...s, start, end: start + s.share / 100 }
})
const TICKS = Array.from({ length: 100 }, (_, i) => {
  const a = (i / 100) * 2 * Math.PI
  const long = i % 10 === 0
  const r = R - (long ? 24 : 12)
  return { i, long, x1: r * Math.sin(a), y1: -r * Math.cos(a), x2: R * Math.sin(a), y2: -R * Math.cos(a) }
})

// The entrance is the sweep: the team's arc and the docs' track are there, then the docs' arc fills clockwise from
// 12 o'clock while the hand turns with its front, so the hand stops where the share does. Rows and ticks are read.
const SWEEP_AT = 100
const SWEEP = 800

type Reading = "hours" | "docs" | "team"
const ROWS: { key: Reading; value: string; name: string; reading: string; swatch?: string }[] = [
  { key: "hours", value: `${HOURS}`, name: "Hours saved", reading: `Hours saved: ${HOURS}` },
  ...SPLIT.map((s) => ({
    key: (s.lead ? "docs" : "team") as Reading,
    value: `${s.share}%`,
    name: s.name,
    reading: `${s.name}: ${s.share}%`,
    swatch: s.lead ? "var(--viz-lead)" : "var(--viz-label)",
  })),
]

export default function TimeSaved() {
  const mask = `sweep-${useId().replace(/[^\w-]/g, "")}`
  const { active, bind, dim } = useReading<Reading>()
  const on = ROWS.find((r) => r.key === active)
  // Hours come from the docs' share, so reading them keeps the docs' arc.
  const arcDim = (lead: boolean) => active !== null && (lead ? active === "team" : active !== "team")

  return (
    <Frame>
      <Header
        title={`Docs saved ${HOURS} hours in May`}
        description={`Docs answered ${DOCS_SHARE}% of a median team’s ${new Intl.NumberFormat("en-US").format(QUESTIONS)} questions, saving ${MINUTES_EACH} minutes each.`}
        hint={on ? on.reading : "Hover or focus a row"}
        on={!!on}
      />

      {/* Rows of 192, each a 96 number and its name, ruled below: three end at 808, level with the face's foot. The
          hours have no arc, so no swatch; their name lines up with the others'. */}
      <ul aria-label="A median team’s May" className="absolute left-[72px] w-[560px]" style={{ top: TOP }}>
        {ROWS.map((r) => (
          <li
            key={r.key}
            tabIndex={0}
            aria-label={r.reading}
            className={cn(row, "grid h-48 grid-cols-[216px_1fr] items-center transition-colors", dim(r.key) && "text-muted-foreground")}
            {...bind(r.key)}
          >
            <span aria-hidden="true" className={band} />
            <span aria-hidden="true" className="absolute inset-x-0 bottom-0 h-px bg-border" />
            <p aria-hidden="true" className="-indent-1 font-data text-[96px] leading-[96px] font-medium tracking-[-0.04em]">
              {r.value}
            </p>
            <span aria-hidden="true">
              {r.swatch ? <Key color={r.swatch}>{r.name}</Key> : <Label className="pl-7 text-current">{r.name}</Label>}
            </span>
          </li>
        ))}
      </ul>

      <svg
        role="img"
        aria-label={`Clock face of a median team’s May questions: ${SPLIT.map((s) => `${s.name.toLowerCase()} ${s.share}%`).join(", ")}.`}
        className="absolute"
        style={{ left: RING_X, top: TOP, width: 2 * R, height: 2 * R }}
        viewBox={`${-R} ${-R} ${2 * R} ${2 * R}`}
      >
        <defs>
          {/* The sweep's stroke covers the arcs' band; rotated so it starts at 12 o'clock. */}
          <mask id={mask}>
            <circle
              r={(ARC_IN + ARC_OUT) / 2}
              fill="none"
              stroke="white"
              strokeWidth={ARC_OUT - ARC_IN + 8}
              pathLength={100}
              transform="rotate(-90)"
              className="viz-sweep"
              style={{ ...delay(SWEEP_AT, SWEEP), "--sweep": DOCS_SHARE } as CSSProperties}
            />
          </mask>
        </defs>
        {TICKS.map((t) => (
          <line
            key={t.i}
            x1={t.x1}
            y1={t.y1}
            x2={t.x2}
            y2={t.y2}
            strokeWidth={4}
            shapeRendering="geometricPrecision"
            className={t.long ? "stroke-viz-label" : "stroke-viz-hatch"}
          />
        ))}
        {ARCS.map((a) => (
          <g key={a.name} className={cn("transition-opacity", arcDim(a.lead) && "opacity-30")}>
            <path d={ring(a) ?? undefined} className={a.lead ? "fill-viz-track" : "fill-viz-label"} />
            {a.lead && <path d={ring(a) ?? undefined} mask={`url(#${mask})`} className="fill-viz-lead" />}
          </g>
        ))}
        {/* The hand: 4px from the centre to 16 short of the arcs, on a 16px square hub, in the ink. */}
        <g
          className="flows-turn"
          style={{ rotate: `${(DOCS_SHARE / 100) * 360}deg`, ...delay(SWEEP_AT, SWEEP) } as CSSProperties}
        >
          <line y2={-HAND} strokeWidth={4} className="stroke-foreground" />
        </g>
        <rect x={-8} y={-8} width={16} height={16} shapeRendering="crispEdges" className="fill-foreground" />
      </svg>
    </Frame>
  )
}
