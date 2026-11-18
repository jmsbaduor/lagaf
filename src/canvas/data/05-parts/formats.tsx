import { arc } from "d3-shape"
import { useId, type CSSProperties } from "react"

import { band, CountUp, delay, Frame, Header, Key, Label, row, TOP, useReading } from "@/canvas/kit"
import { cn } from "@/lib/utils"

import { FORMAT_LEAD, FORMATS, GAP } from "./data"
import "./parts.css"

// The ring is 576 across at the right of the content box (792 to 1368, TOP to 808, level with the rows) and 96
// thick, so its hole is 384. Arcs have square ends, and d3 keeps the gap between them a constant 4px at every
// radius: 2R sin(pad / 2).
const R = 288
const THICK = 96
const ring = arc<{ start: number; end: number }>()
  .innerRadius(R - THICK)
  .outerRadius(R)
  .startAngle((d) => d.start * 2 * Math.PI)
  .endAngle((d) => d.end * 2 * Math.PI)
  .padRadius(R)
  .padAngle(2 * Math.asin(GAP / 2 / R))
const RING_X = 1368 - 2 * R

// HTML is a real share, not an empty one, so it takes the neutral that "the rest" takes elsewhere (people in who
// reads and sources), not the track, which read as a gap in the ring and an empty swatch in its row.
// The entrance is the sweep: the HTML slice and the lead slices' tracks are there, then the lead arcs (Markdown and
// llms.txt) fill clockwise from 12 o'clock while the centre counts to their 83, so the two land together. Rows are
// read, so they don't move.
const SWEEP_AT = 100
const SWEEP = 800

export default function Formats() {
  const mask = `sweep-${useId().replace(/[^\w-]/g, "")}`
  const { active, bind, dim } = useReading<number>()
  const on = active === null ? null : FORMATS[active]

  return (
    <Frame>
      <Header
        title="Most agent traffic skips HTML"
        description={`May agent traffic by format: ${FORMAT_LEAD}% went to Markdown or llms.txt.`}
        hint={on ? `${on.name}: ${on.share}%` : "Hover or focus a format"}
        on={!!on}
      />

      {/* Rows of 192, each a 96 number and its key, ruled below: three end at 808, level with the ring's foot. */}
      <ul aria-label="May agent traffic by format" className="absolute left-[72px] w-[560px]" style={{ top: TOP }}>
        {FORMATS.map((f, i) => (
          <li
            key={f.name}
            tabIndex={0}
            aria-label={`${f.name}: ${f.share}%`}
            className={cn(row, "grid h-48 grid-cols-[216px_1fr] items-center transition-colors", dim(i) && "text-muted-foreground")}
            {...bind(i)}
          >
            <span aria-hidden="true" className={band} />
            <span aria-hidden="true" className="absolute inset-x-0 bottom-0 h-px bg-border" />
            <p aria-hidden="true" className="-indent-1 font-data text-[96px] leading-[96px] font-medium tracking-[-0.04em]">
              {f.share}%
            </p>
            <span aria-hidden="true">
              <Key color={f.lead ? "var(--viz-lead)" : "var(--viz-label)"}>{f.name}</Key>
            </span>
          </li>
        ))}
      </ul>

      <div
        role="img"
        aria-label={`Ring of May agent traffic by format: ${FORMATS.map((f) => `${f.name} ${f.share}%`).join(", ")}.`}
        className="absolute"
        style={{ left: RING_X, top: TOP, width: 2 * R, height: 2 * R }}
      >
        <svg aria-hidden="true" viewBox={`${-R} ${-R} ${2 * R} ${2 * R}`} className="size-full">
          <defs>
            {/* The sweep's stroke covers the ring's band; rotated so it starts at 12 o'clock. */}
            <mask id={mask}>
              <circle
                r={R - THICK / 2}
                fill="none"
                stroke="white"
                strokeWidth={THICK + 8}
                pathLength={100}
                transform="rotate(-90)"
                className="parts-sweep"
                style={{ ...delay(SWEEP_AT, SWEEP), "--sweep": FORMAT_LEAD } as CSSProperties}
              />
            </mask>
          </defs>
          {/* A slice that isn't read fades to 30% over the paper, track and arc together. */}
          {FORMATS.map((f, i) => (
            <g key={f.name} className={cn("transition-opacity", dim(i) && "opacity-30")} {...bind(i)}>
              <path d={ring(f) ?? undefined} className={f.lead ? "fill-viz-track" : "fill-viz-label"} />
              {f.lead && <path d={ring(f) ?? undefined} mask={`url(#${mask})`} className="fill-viz-lead" />}
            </g>
          ))}
        </svg>

        {/* The centre: the lead's share until a slice is read, then that slice's. The count stays mounted, so a
            reading never restarts it. Number and label are 168 tall, centred on the ring's centre (520). */}
        <div aria-hidden="true" className="absolute top-[204px] left-[96px] w-[384px] text-center">
          <p className="font-data text-[144px] leading-[144px] font-medium tracking-[-0.05em]">
            <span className={on ? "hidden" : undefined}>
              <CountUp value={FORMAT_LEAD} delay={SWEEP_AT} duration={SWEEP} format={(n) => `${Math.round(n)}%`} />
            </span>
            {on && `${on.share}%`}
          </p>
          <Label className="mt-2">{on ? on.name : "Markdown or llms.txt"}</Label>
        </div>
      </div>
    </Frame>
  )
}
