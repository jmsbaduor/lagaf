import { useId, type CSSProperties } from "react"

import { Choice, Choices, Frame, Header, Label, note, smallLabelText, TOP, useReading, wipe } from "@/canvas/kit"
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

// 24 hours by 7 days of 48px cells, 4 apart: 1244 wide from the 52px day column, so the grid ends on 1368.
const GRID_X = 124
const GRID_Y = TOP + 32 // under the hours
const PITCH = 52
const LEGEND_Y = GRID_Y + 7 * PITCH + 44 // 672

// The entrance is the day passing: one stepped wipe reveals the grid an hour at a time, left to right. It leaves no
// clip behind, so focus rings on the edge cells show whole. Labels and the legend are there from the start.
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

      {/* Every third hour, centred over its column. */}
      {Array.from({ length: 8 }, (_, i) => (
        <p
          key={i}
          aria-hidden="true"
          className={cn(smallLabelText, "absolute w-12 text-center text-viz-label")}
          style={{ left: GRID_X + i * 3 * PITCH, top: TOP }}
        >
          {hourName(i * 3)}
        </p>
      ))}
      <div aria-hidden="true" className="absolute left-[72px] flex w-12 flex-col gap-1" style={{ top: GRID_Y }}>
        {WEEKDAYS.map((d) => (
          <Label key={d} className="h-12 leading-12">
            {d}
          </Label>
        ))}
      </div>

      <div className="viz-wipe absolute" style={{ left: GRID_X, top: GRID_Y, ...SWEEP }}>
        <Choices legend="Read an hour" className="grid grid-cols-[repeat(24,48px)] gap-1">
          {HOURS.map((c, i) => (
            <Choice
              key={i}
              name={name}
              value={String(i)}
              // The cell is 48px; its hit area runs 2px into each gap, so moving across the grid never drops a reading.
              // The read cell is ringed in the ink (spreads.css), so even a pale one stands out from the rest.
              className={cn(
                "spread-cell size-12 before:absolute before:-inset-0.5",
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
            <p
              key={t}
              className={cn(smallLabelText, "absolute top-0 w-11 text-center text-viz-label")}
              style={{ left: (k + 1) * PITCH - 24 }}
            >
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
