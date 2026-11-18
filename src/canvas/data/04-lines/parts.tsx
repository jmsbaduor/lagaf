// Row 04's shared parts: month columns to read, a value axis, and a series that draws in. They move to the kit once
// another row uses them. The conventions they set:
// - Layout: six month columns of 192 from 144 to 1296. Months centre at 240 + 192i, on the 8px grid, so a point's
//   edges land on 4. Values rise from BASE (776) to TOP; month names sit at 800 to 816; nothing goes below 828.
//   Tick labels are right-aligned at 72 to 120; the last point's label starts 24 right of its centre.
// - Hairlines: 1px in viz-hatch, crispEdges, filling the pixel row under their grid line.
// - Lines: 4px strokes (one grid unit), butt caps, miter joins. Sloped lines anti-alias (geometricPrecision); steps
//   and points are crispEdges, since all their edges are whole pixels.
// - Points: 16px squares (the Key's swatch), one a month. The read one stays solid; the rest fade toward the paper.
// - Entrance: one clip-path animation (viz-draw) reveals a series' lines and points left to right, so x is time and
//   two lines cross on screen when they cross in the data. The last point's label fades in as the reveal reaches it.
// - Text is HTML (mono Labels), so check:browser holds every label to the grid.
import type { CSSProperties, ReactNode } from "react"

import { band, countAt, delay, Label, row, TOP, useReading } from "@/canvas/kit"
import { cn } from "@/lib/utils"

import "./lines.css"

export const COL = 192
const PLOT_L = 144
const PLOT_R = PLOT_L + 6 * COL
export const BASE = 776
const POINT = 16
const NAMES_BOTTOM = 816

export const monthX = (i: number) => PLOT_L + COL / 2 + i * COL
const y = (h: number) => BASE - h

/** When a Series' reveal reaches month i's point (its left edge), in ms after the Series starts. */
export const litAt = (i: number, count: number, duration: number) =>
  countAt(i * COL, (count - 1) * COL + POINT, duration)

/**
 * The months as reading columns: each is a focusable column of the plot with its name at the foot. Read, it tints
 * as a row's band does and its name turns to the ink; the others mute. `say(i)` is the reading.
 */
export function Months({
  name,
  months,
  say,
  reading: { active, bind, dim },
}: {
  name: string
  months: readonly string[]
  say: (i: number) => string
  reading: ReturnType<typeof useReading<number>>
}) {
  return (
    <ul aria-label={name}>
      {months.map((m, i) => (
        <li
          key={m}
          tabIndex={0}
          aria-label={say(i)}
          className={cn(row, "absolute")}
          style={{ left: monthX(i) - COL / 2, top: TOP, width: COL, height: NAMES_BOTTOM - TOP }}
          {...bind(i)}
        >
          <span className={cn(band, "inset-x-0")} />
          <Label
            aria-hidden="true"
            className={cn(
              "absolute inset-x-0 bottom-0 text-center transition-colors",
              active === i && "text-foreground",
              dim(i) && "text-muted-foreground"
            )}
          >
            {m}
          </Label>
        </li>
      ))}
    </ul>
  )
}

/** The value axis: a hairline per tick across the plot, zero included, each labelled at the left. Structure: it doesn't move. */
export function Ticks({ ticks }: { ticks: readonly { h: number; label: string }[] }) {
  return (
    <div aria-hidden="true">
      <svg className="pointer-events-none absolute inset-0" width={1440} height={900}>
        {ticks.map((t) => (
          <line
            key={t.label}
            x1={PLOT_L}
            x2={PLOT_R}
            y1={y(t.h) + 0.5}
            y2={y(t.h) + 0.5}
            stroke="var(--viz-hatch)"
            shapeRendering="crispEdges"
          />
        ))}
      </svg>
      {ticks.map((t) => (
        <Label key={t.label} className="absolute left-[72px] w-12 text-right normal-case" style={{ top: y(t.h) - 8 }}>
          {t.label}
        </Label>
      ))}
    </div>
  )
}

/**
 * The SVG a series draws in, spanning its first point's left edge to its last point's right edge, so the reveal
 * runs month by month. Its user units are the frame's px. Put every line and point of the chart in one Series.
 */
export function Series({ count, at, duration, children }: { count: number; at: number; duration: number; children: ReactNode }) {
  const left = monthX(0) - POINT / 2
  const width = (count - 1) * COL + POINT
  const height = BASE + POINT / 2 - TOP
  return (
    <svg
      aria-hidden="true"
      className="viz-draw pointer-events-none absolute"
      style={{ left, top: TOP, width, height, ...delay(at, duration) }}
      viewBox={`${left} ${TOP} ${width} ${height}`}
    >
      {children}
    </svg>
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

/** A 16px square on each month's height, in `color` (a role: var(--viz-lead)). */
export function Points({ heights, color, dim }: { heights: readonly number[]; color: string; dim: (i: number) => boolean }) {
  return heights.map((h, i) => (
    <rect
      key={i}
      x={monthX(i) - POINT / 2}
      y={y(h) - POINT / 2}
      width={POINT}
      height={POINT}
      shapeRendering="crispEdges"
      data-dim={dim(i) || undefined}
      className="viz-point"
      style={{ "--px": color } as CSSProperties}
    />
  ))
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
