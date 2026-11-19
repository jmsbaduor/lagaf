import { arc } from "d3-shape"
import { useId, type CSSProperties } from "react"

import { CountUp, delay, Fill, focusRing, Frame, Header, Label, labelText, note, TOP, useReading } from "@/canvas/kit"
import { cn } from "@/lib/utils"

import { pct } from "../facts"
import {
  RINGS,
  RINGS_ALL,
  RINGS_BAR,
  RINGS_BAR_LEAD,
  RINGS_D,
  RINGS_THICK,
  RINGS_TOTAL,
  ringsReading,
  ringsViews,
  ringsX,
} from "./data"

// Five rings 240 across on TOP, filling the content width (ringsX in data.ts), each a track ring with its agent
// share as a lead arc from 12 o'clock and the share at 64px in its hole. Each source's name sits 24 under its ring and
// its May views 8 under that, ending at 548. The all-sources share closes the chart, 56 under them: its 128px
// number from 604 and a 64px bar across the content width, 32 under it, ending on 828. No gap in the data is over 56.
const R = RINGS_D / 2
const ring = arc<{ end: number }>()
  .innerRadius(R - RINGS_THICK)
  .outerRadius(R)
  .startAngle(0)
  .endAngle((d) => d.end * 2 * Math.PI)
const TRACK = ring({ end: 1 }) ?? undefined
const SUM_Y = 604

// The entrance is the rings filling: left to right in shrinking steps, each lead arc sweeps clockwise from
// 12 o'clock while its share counts, then the all-sources bar grows with its count. Names and views are read.
const SWEEP = 700
const AT = [100, 160, 200, 230, 250]
const BAR_AT = 280
const BAR = 600

const ALL = "All sources"

export default function Rings() {
  const id = `sweep-${useId().replace(/[^\w-]/g, "")}`
  const { active, bind, dim } = useReading<string>()
  const on = RINGS.find((r) => r.name === active)

  return (
    <Frame>
      <Header
        title="Agents lead four of five sources"
        description={`The agent share of each source’s May page views, and of all ${RINGS_TOTAL}.`}
        hint={
          on ? ringsReading(on.name, on.share) : active === ALL ? ringsReading(ALL, RINGS_ALL) : "Hover or focus a source"
        }
        on={!!active}
      />

      <ul aria-label="Agent share of May page views by source">
        {RINGS.map((r, i) => (
          <li
            key={r.name}
            tabIndex={0}
            aria-label={`${ringsReading(r.name, r.share)}, of ${ringsViews(r.views)}`}
            className={cn("absolute h-[316px] text-center", focusRing)}
            style={{ left: ringsX(i), top: TOP, width: RINGS_D }}
            {...bind(r.name)}
          >
            <svg
              aria-hidden="true"
              className={cn("block size-[240px] transition-opacity", dim(r.name) && "opacity-30")}
              viewBox={`${-R} ${-R} ${RINGS_D} ${RINGS_D}`}
            >
              <defs>
                {/* The sweep's stroke covers the band; rotated so it starts at 12 o'clock. */}
                <mask id={`${id}-${i}`}>
                  <circle
                    r={R - RINGS_THICK / 2}
                    fill="none"
                    stroke="white"
                    strokeWidth={RINGS_THICK + 8}
                    pathLength={100}
                    transform="rotate(-90)"
                    className="viz-sweep"
                    style={{ ...delay(AT[i], SWEEP), "--sweep": r.share } as CSSProperties}
                  />
                </mask>
              </defs>
              <path d={TRACK} className="fill-viz-track" />
              <path d={ring({ end: r.share / 100 }) ?? undefined} mask={`url(#${id}-${i})`} className="fill-viz-lead" />
            </svg>
            <p
              aria-hidden="true"
              className={cn(
                "absolute top-[88px] left-8 w-[176px] font-data text-[64px] leading-16 font-medium tracking-[-0.04em] transition-colors",
                dim(r.name) && "text-muted-foreground"
              )}
            >
              <CountUp value={r.share} delay={AT[i]} duration={SWEEP} format={pct} />
            </p>
            <p aria-hidden="true" className={cn(labelText, "mt-6 transition-colors", dim(r.name) && "text-muted-foreground")}>
              {r.name}
            </p>
            <p aria-hidden="true" className={cn(note, "mt-2 text-muted-foreground")}>
              {ringsViews(r.views)}
            </p>
          </li>
        ))}

        {/* The sixth reading: every source together, its number and words over a bar of the whole. */}
        <li
          tabIndex={0}
          aria-label={`${ringsReading(ALL, RINGS_ALL)}, of ${RINGS_TOTAL} May page views`}
          className={cn("absolute left-[72px] h-[224px] transition-colors", focusRing, dim(ALL) && "text-muted-foreground")}
          style={{ top: SUM_Y, width: RINGS_BAR }}
          {...bind(ALL)}
        >
          <div aria-hidden="true" className="flex h-32 items-end gap-6">
            <p className="w-[256px] -indent-2 font-data text-[128px] leading-[128px] font-medium tracking-[-0.04em]">
              <CountUp value={RINGS_ALL} delay={BAR_AT} duration={BAR} format={pct} />
            </p>
            <div className="flex-1">
              <Label className={cn("transition-colors", active === ALL && "text-foreground")}>{ALL}</Label>
              <p className={cn(note, "mt-2 text-muted-foreground")}>Agent share of {RINGS_TOTAL} May page views</p>
            </div>
          </div>
          <div
            aria-hidden="true"
            className={cn("relative mt-8 h-16 bg-viz-track transition-opacity", dim(ALL) && "opacity-30")}
          >
            <Fill size={RINGS_BAR_LEAD} at={BAR_AT} duration={BAR} className="bg-viz-lead" />
          </div>
        </li>
      </ul>
    </Frame>
  )
}
