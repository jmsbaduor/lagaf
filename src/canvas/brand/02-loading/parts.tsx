import { useEffect, useState, type CSSProperties, type ReactNode } from "react"

import { LAG as LAG_FACTS } from "@/canvas/data/facts"
import { delay, useFinished } from "@/canvas/kit"
import { Mark } from "@/components/Mark"
import { useStage } from "@/components/stage"
import { cn } from "@/lib/utils"
import "./loading.css"

// Shared by row 02. A skeleton is the chart's own structure (hatch, rules, grid) with track-tone slots where the
// data will land; on load the structure stays put, the slots fade out and the data takes their place.
// Spacing, as in row 01: a label sits 16 above its object, a caption 16 under its tile, groups 48 apart, and an
// icon 8 from its word.

/** The kit's Label look for text inside other elements (Label itself is a <p>). */
export const labelText = "font-mono text-[14px] leading-4 font-medium uppercase"

/** A hairline along the top, drawn as an inset shadow so it takes no space and every box stays on the grid. */
export const rule = "shadow-[inset_0_1px_0_var(--viz-hatch)]"
// Written out in full: Tailwind only sees whole class names.
const ruled = "shadow-[inset_0_1px_0_var(--viz-hatch),inset_0_-1px_0_var(--viz-hatch)]"
const lastRuled = "last:shadow-[inset_0_1px_0_var(--viz-hatch),inset_0_-1px_0_var(--viz-hatch)]"

/** Width of a mono label in chart px, snapped to the 8 px grid: 14 px Geist Mono advances 0.6 em a character. */
export const monoWidth = (text: string) => Math.round((text.length * 8.4) / 8) * 8

/** A placeholder block. `wait` makes it breathe (motion-safe only); `gone` fades it out once the data is in. */
export function Slot({
  w,
  h = 16,
  wave = 0,
  wait = true,
  gone = false,
  className,
  style,
}: {
  w: number | string
  h?: number
  wave?: number
  wait?: boolean
  gone?: boolean
  className?: string
  style?: CSSProperties
}) {
  return (
    <span
      aria-hidden="true"
      data-gone={gone || undefined}
      className={cn("ld-slot block max-w-full", wait && !gone && "ld-wait", className)}
      style={{ width: w, height: h, "--wave": `${wave}ms`, ...style } as CSSProperties}
    />
  )
}

/**
 * A chart's status, for the header's hint: the mark's loader and a word while busy, the word alone after.
 * A fixed 160 box, right-aligned, so its edges stay on the grid whatever the word.
 */
export function Status({ busy, children }: { busy: boolean; children: ReactNode }) {
  return (
    <span className="flex w-40 items-center justify-end gap-2">
      {busy && <Mark loading />}
      {children}
    </span>
  )
}

/** Polite live region: says when content has loaded or changed. */
export function Live({ children }: { children: ReactNode }) {
  return (
    <p aria-live="polite" className="sr-only">
      {children}
    </p>
  )
}

/**
 * True once the data should show. A frame mounted as Loaded holds its skeleton for `hold` ms first, so Replay plays
 * the handover; a first click or key skips the hold. Paced by the stage's speed.
 */
export function useHandover(ready: boolean, hold = 1200) {
  const finished = useFinished()
  const { speed } = useStage()
  const [held, setHeld] = useState(true)
  useEffect(() => {
    const t = setTimeout(() => setHeld(false), hold / speed)
    return () => clearTimeout(t)
  }, [hold, speed])
  return ready && (!held || finished)
}

/** Docs update lag, the bars row's numbers, with each column's colours. A full column holds 57.5%. */
const LAG_STYLE = [
  { fill: "bg-viz-lead", ink: "text-viz-lead-ink" },
  { fill: "bg-viz-warn ring-[1.5px] ring-inset ring-viz-warn-edge", ink: "text-viz-warn-ink" },
  { fill: "bg-viz-alert", ink: "text-viz-alert-ink" },
]
export const LAG = LAG_FACTS.map((d, i) => ({ ...d, ...LAG_STYLE[i] }))
const MAX = 57.5

/**
 * The bars family: three columns of hatched headroom. `wait` and `still` show only slots (breathing or not);
 * `empty` knows its labels but has no values; `data` grows the bars into the hatch. The column gap comes in
 * through className, so the columns land on the grid at any width.
 */
export type BarsMode = "wait" | "still" | "empty" | "data"

export function Bars({ mode, big = false, className }: { mode: BarsMode; big?: boolean; className?: string }) {
  const known = mode === "data" || mode === "empty"
  return (
    <ul
      aria-label={known ? "Docs update lag" : undefined}
      aria-hidden={known ? undefined : true}
      className={cn("grid grid-cols-3", className)}
    >
      {LAG.map((d, i) => (
        <li
          key={d.label}
          aria-label={known ? `${d.label}: ${mode === "data" ? `${d.value}%` : "no data"}` : undefined}
          className="flex min-w-0 flex-col gap-4"
        >
          <div className="relative h-4">
            <Slot w={monoWidth(d.label)} wave={i * 240} wait={mode === "wait"} gone={known} />
            {known && (
              <span className={cn(labelText, "viz-fade absolute inset-0 truncate text-viz-label")} aria-hidden="true">
                {d.label}
              </span>
            )}
          </div>
          <div className="viz-hatch relative flex-1">
            {mode === "data" && (
              <>
                <div
                  className={cn("viz-grow-y absolute inset-x-0 bottom-0", d.fill)}
                  style={{
                    // Snapped to the 4 px grid, like every other box in the frame.
                    height: `round(${(d.value / MAX) * 100}%, 4px)`,
                    ...delay(i * 60),
                  }}
                />
                <p
                  aria-hidden="true"
                  className={cn(
                    "viz-fade absolute font-heading font-medium tracking-[-0.03em]",
                    big ? "bottom-6 left-6 text-[72px] leading-20" : "bottom-4 left-4 text-[32px] leading-10",
                    d.ink
                  )}
                  style={delay(400 + i * 60)}
                >
                  {d.value}%
                </p>
              </>
            )}
          </div>
        </li>
      ))}
    </ul>
  )
}

/**
 * A ruled list of timing rules; the row that matches what the chart is doing now is lit. Down a column by default;
 * `across` lays the rows side by side in four columns, 48 apart, under a chart.
 */
export function Spec({
  rows,
  active,
  across = false,
  className,
}: {
  rows: { at: string; text: string }[]
  active: number
  across?: boolean
  className?: string
}) {
  return (
    <dl className={cn(across && "grid grid-cols-4 gap-x-12", className)}>
      {rows.map((s, i) => {
        const on = i === active
        return (
          <div key={s.at} className={cn("flex flex-col gap-2 py-4", across ? ruled : [rule, lastRuled])}>
            <dt
              className={cn(
                labelText,
                "flex items-center gap-2 transition-colors",
                on ? "text-foreground" : "text-viz-label"
              )}
            >
              <span aria-hidden="true" className={cn("size-2 transition-colors", on ? "bg-viz-lead" : "bg-viz-track")} />
              {s.at}
            </dt>
            <dd
              className={cn(
                "text-[18px] leading-6 text-pretty transition-colors",
                on ? "text-foreground" : "text-muted-foreground"
              )}
            >
              {s.text}
            </dd>
          </div>
        )
      })}
    </dl>
  )
}
