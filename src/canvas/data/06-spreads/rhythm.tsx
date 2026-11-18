import { useId, type CSSProperties } from "react"

import { Choice, Choices, Frame, Header, Label, note, tickText, TOP, useReading, wipe, XAxis, YAxis } from "@/canvas/kit"
import type { Knobs, Values } from "@/components/stage"
import { cn } from "@/lib/utils"

import { pct, TRAFFIC } from "../facts"
import { cellValue, hourName, HOURS, STEPS, stepOf, WEEKDAYS } from "./data"
import "./spreads.css"

// What the colour measures: who reads (the agents' share) or how much (reads an hour). Same cells, new colours, 200ms.
export const knobs = {
  measure: {
    type: "choice",
    label: "Measure",
    value: "Agent share",
    options: ["Agent share", "All reads"],
  },
} as const satisfies Knobs

const MEASURES = {
  "Agent share": {
    key: "share",
    legend: "Agents’ share of reads",
    edge: (t: number) => `${t}%`,
    read: (v: number) => `${v}% agents`,
  },
  "All reads": {
    key: "reads",
    legend: "Reads an hour, on average",
    edge: (t: number) => `${t}K`,
    read: (v: number) => `${v}K reads an hour`,
  },
} as const

// 24 hours by 7 days of 48 by 64px cells, 4 apart: 1244 wide from the day column, so the grid ends on 1368, and 472
// tall from TOP (both axes name time, so neither takes a name line). Hours tick under it; the legend's three lines
// end on 828.
const GRID_X = 124
const GRID_Y = TOP
const PITCH = 52
const ROW = 68
const GRID_B = GRID_Y + 7 * ROW - 4 // 704
const LEGEND_Y = GRID_B + 60 // 764

// The entrance is the day passing: one stepped wipe reveals the grid an hour at a time, left to right. It leaves no
// clip behind, so focus rings on the edge cells show whole. Axes and the legend are there from the start.
const SWEEP = {
  ...wipe(100, 600, 24),
  animationFillMode: "backwards",
} as CSSProperties

export default function Rhythm({ measure = "Agent share" }: Partial<Values<typeof knobs>>) {
  const name = useId()
  const { active, bind, dim } = useReading<number>()
  const m = MEASURES[measure]
  const steps = STEPS[m.key]
  const on = active === null ? null : HOURS[active]

  return (
    <Frame>
      <Header
        title="Agents make most reads at night"
        description="Reads by weekday and hour in May, as agents’ share or all reads."
        hint={
          on ? `${WEEKDAYS[on.day]} ${hourName(on.hour)}: ${m.read(cellValue(on, m.key))}` : "Hover or focus an hour"
        }
        on={!!on}
      />

      {/* Days on their rows and every third hour on its column; the read cell's day and hour turn to the ink. */}
      <YAxis
        ticks={WEEKDAYS.map((d, i) => ({ at: GRID_Y + i * ROW, label: d, on: on?.day === i }))}
        from={GRID_X}
        band={ROW - 4}
      />
      <XAxis
        ticks={Array.from({ length: 8 }, (_, i) => ({
          at: GRID_X + i * 3 * PITCH,
          label: hourName(i * 3),
          on: on?.hour === i * 3,
        }))}
        y={GRID_B}
        band={PITCH - 4}
      />

      <div className="viz-wipe absolute" style={{ left: GRID_X, top: GRID_Y, ...SWEEP }}>
        <Choices legend="Read an hour" className="grid grid-cols-[repeat(24,48px)] grid-rows-[repeat(7,64px)] gap-1">
          {HOURS.map((c, i) => (
            <Choice
              key={i}
              name={name}
              value={String(i)}
              // The cell's hit area runs 2px into each gap, so moving across the grid never drops a reading.
              // The read cell is ringed in the ink (spreads.css), so even a pale one stands out from the rest.
              className={cn(
                "spread-cell before:absolute before:-inset-0.5 has-[:focus-visible]:outline-offset-1",
                `spread-step-${stepOf(cellValue(c, m.key), steps)}`,
                dim(i) && "opacity-30"
              )}
              {...bind(i)}
            >
              <span className="sr-only">
                {WEEKDAYS[c.day]} {hourName(c.hour)}: {MEASURES["Agent share"].read(cellValue(c, "share"))},{" "}
                {MEASURES["All reads"].read(cellValue(c, "reads"))}
              </span>
            </Choice>
          ))}
        </Choices>
      </div>

      {/* The steps as a bar of swatches, each edge's value under the gap it sits on. */}
      <div aria-hidden="true" className="absolute left-[72px]" style={{ top: LEGEND_Y }}>
        <Label>{m.legend}</Label>
        <div className="mt-2 flex gap-1">
          {steps.map((_, k) => (
            <span key={k} className={cn("spread-cell h-4 w-12", `spread-step-${k}`)} />
          ))}
        </div>
        <div className="relative mt-2 h-4">
          {steps.slice(1).map((t, k) => (
            <p key={t} className={cn(tickText, "absolute top-0 w-11 text-center")} style={{ left: (k + 1) * PITCH - 24 }}>
              {m.edge(t)}
            </p>
          ))}
        </div>
      </div>
      <p className={cn(note, "absolute right-[72px] text-right text-muted-foreground")} style={{ top: LEGEND_Y }}>
        All of May: {TRAFFIC.pageViews.format(TRAFFIC.pageViews.value)} reads, {pct(TRAFFIC.agentShare.value)} of them
        by agents.
      </p>
    </Frame>
  )
}
