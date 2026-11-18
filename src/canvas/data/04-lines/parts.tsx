// Row 04's month layout, shared by its three charts; the axes, Series and Point are the kit's (docs/charts.md,
// "SVG and plots").
// - Six month columns of 192 from 144 to 1296. Months centre at 240 + 192i, on the 8px grid, so a point's edges land
//   on 4. Values rise from BASE (792) to PLOT_TOP (264), under the y axis's name on TOP; month ticks sit 12 under
//   BASE, ending at 820.
// - Lines are 4px strokes (one grid unit), butt caps, miter joins. Sloped lines anti-alias (geometricPrecision);
//   steps are crispEdges, since all their edges are whole pixels.
// - Entrance: the Series wipe reveals the lines and points left to right; the last point's label fades in as the
//   reveal reaches it.
import type { ReactNode } from "react"

import { cn } from "@/lib/utils"
import { countAt, delay, focusRing, Point, Series as Draw, TOP, useReading, XAxis, YAxis } from "@/canvas/kit"

export const COL = 192
const PLOT_L = 144
const PLOT_R = PLOT_L + 6 * COL
/** The plot's top: 32 under the y axis's name, so the highest tick label clears it by 8. */
export const PLOT_TOP = TOP + 32
export const BASE = 792
/** The Series' box runs 12 past the first and last points' centres, so it holds their 2px rings. */
const PAD = 12

export const monthX = (i: number) => PLOT_L + COL / 2 + i * COL
const y = (h: number) => BASE - h

/** When a Series' reveal reaches month i's point, in ms after the Series starts. */
export const litAt = (i: number, count: number, duration: number) =>
  countAt(i * COL, (count - 1) * COL + 2 * PAD, duration)

/** The value axis: its name on TOP, a tick and gridline at each height (zero included). */
export function Ticks({ name, ticks }: { name: string; ticks: readonly { h: number; label: string }[] }) {
  return <YAxis name={name} ticks={ticks.map((t) => ({ at: y(t.h), label: t.label }))} from={PLOT_L} to={PLOT_R} />
}

/**
 * The months as reading columns: each is a focusable column of the plot, its tick at the foot. Read, its tick turns
 * to the ink and the other months' points fade; there's no tint, so the lines stay the loudest thing. `say(i)` is
 * the reading.
 */
export function Months({
  name,
  months,
  say,
  reading: { active, bind },
}: {
  name: string
  months: readonly string[]
  say: (i: number) => string
  reading: ReturnType<typeof useReading<number>>
}) {
  return (
    <>
      <XAxis y={BASE} ticks={months.map((m, i) => ({ at: monthX(i), label: m, on: active === i }))} />
      <ul aria-label={name}>
        {months.map((m, i) => (
          <li
            key={m}
            tabIndex={0}
            aria-label={say(i)}
            className={cn("absolute", focusRing, "focus-visible:-outline-offset-2")}
            style={{ left: monthX(i) - COL / 2, top: PLOT_TOP, width: COL, height: BASE + 28 - PLOT_TOP }}
            {...bind(i)}
          />
        ))}
      </ul>
    </>
  )
}

/** The Series for `count` months: put every line and point of the chart in it. */
export function Series({ count, at, duration, children }: { count: number; at: number; duration: number; children: ReactNode }) {
  const x = monthX(0) - PAD
  return (
    <Draw x={x} y={TOP} w={(count - 1) * COL + 2 * PAD} h={BASE + PAD - TOP} at={at} duration={duration}>
      {children}
    </Draw>
  )
}

/** A line through each month's height; `step` holds each month flat across its column (a monthly figure). */
export function Line({ heights, step = false, className }: { heights: readonly number[]; step?: boolean; className: string }) {
  const d = heights
    .map((h, i) =>
      i === 0 ? `M${monthX(0)} ${y(h)}` : step ? `H${monthX(i) - COL / 2}V${y(h)}H${monthX(i)}` : `L${monthX(i)} ${y(h)}`
    )
    .join("")
  return (
    <path
      d={d}
      fill="none"
      strokeWidth={4}
      strokeLinejoin="miter"
      shapeRendering={step ? "crispEdges" : "geometricPrecision"}
      className={className}
    />
  )
}

/** A point on each month's height, in `color` (a role: var(--viz-lead)). */
export function Points({ heights, color, dim }: { heights: readonly number[]; color: string; dim: (i: number) => boolean }) {
  return heights.map((h, i) => <Point key={i} x={monthX(i)} y={y(h)} color={color} dim={dim(i)} />)
}

/** The last point's value, 32/40, centred on it and 24 to its right; it fades in as the Series reaches the point. */
export function EndLabel({
  h,
  count,
  at,
  duration,
  dim,
  children,
}: {
  h: number
  count: number
  at: number
  duration: number
  dim: boolean
  children: ReactNode
}) {
  return (
    <p
      aria-hidden="true"
      className={cn(
        "viz-fade absolute text-[32px] leading-10 tracking-[-0.02em] whitespace-nowrap transition-colors",
        dim && "text-muted-foreground"
      )}
      style={{ left: monthX(count - 1) + 24, top: y(h) - 20, ...delay(at + litAt(count - 1, count, duration)) }}
    >
      {children}
    </p>
  )
}
