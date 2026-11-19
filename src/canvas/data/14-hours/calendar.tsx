import { useId, type CSSProperties } from "react"

import { Choice, Choices, Fill, Frame, Header, Label, tickText, TOP, useReading, wipe, XAxis, YAxis } from "@/canvas/kit"
import { cn } from "@/lib/utils"

import { millions } from "../07-series/data"
import { DEMO } from "../facts"
import { CALENDAR, CALENDAR_STEPS, CALENDAR_WEEKDAYS, CALENDAR_WEEKS, calendarStep } from "./data"
import "../06-spreads/spreads.css"

// 26 weeks of 44 by 48px cells, 4 apart, from the weekday column: 124 to 1368 across, TOP to 592 down. Months tick
// under the grid, at the first week that starts in each. Below, each week's total stands as a bar under its column
// on the content's foot at 828; the ramp's key holds the empty corner over December's short bars.
const GRID_X = 124
const PITCH = 48
const CELL_W = 44
const ROW = 52
const GRID_B = TOP + 7 * ROW - 4 // 592
const FOOT = 828
const KEY_Y = GRID_B + 60 // 652
const colX = (i: number) => GRID_X + i * PITCH
const FIRST = DEMO.months.map((_, m) => CALENDAR_WEEKS.findIndex((w) => w.month === m))
const ENDS = [0, CALENDAR_WEEKS.length - 1]

// The entrance is the half year passing: one stepped wipe reveals the grid a week at a time, left to right, and each
// week's bar grows as the wipe reaches it. It leaves no clip behind, so focus rings on the edge cells show whole.
// Axes, the key and the end values are there from the start.
const WIPE = 700
const SWEEP = { ...wipe(100, WIPE, CALENDAR_WEEKS.length), animationFillMode: "backwards" } as CSSProperties
const GROW = 300
const barAt = (i: number) => 100 + Math.round((i * WIPE) / CALENDAR_WEEKS.length)

const say = (c: (typeof CALENDAR)[number]) =>
  `${c.date}: ${millions(c.views / 1000)}, week ${millions(CALENDAR_WEEKS[c.week].views)}`

export default function Calendar() {
  const name = useId()
  const { active, bind, dim } = useReading<number>()
  const on = active === null ? null : CALENDAR[active]

  return (
    <Frame>
      <Header
        title="Agents passed a million a day"
        description="Agent page views each day of the 26 weeks from December to May."
        hint={on ? say(on) : "Hover or focus a day"}
        on={!!on}
      />

      <YAxis
        ticks={CALENDAR_WEEKDAYS.map((d, i) => ({ at: TOP + i * ROW, label: d, on: on?.day === i }))}
        from={GRID_X}
        band={ROW - 4}
      />
      <XAxis
        y={GRID_B}
        ticks={FIRST.map((i, m) => ({ at: colX(i) + CELL_W / 2, label: DEMO.months[m], on: on?.month === m }))}
      />

      <div className="viz-wipe absolute" style={{ left: GRID_X, top: TOP, ...SWEEP }}>
        <Choices
          legend="Read a day"
          className="grid grid-flow-col grid-cols-[repeat(26,44px)] grid-rows-[repeat(7,48px)] gap-1"
        >
          {CALENDAR.map((c, i) => (
            <Choice
              key={c.date}
              name={name}
              value={String(i)}
              // The cell's hit area runs 2px into each gap, so moving across the grid never drops a reading.
              className={cn(
                "spread-cell before:absolute before:-inset-0.5 has-[:focus-visible]:outline-offset-1",
                `spread-step-${calendarStep(c.views)}`,
                dim(i) && "opacity-30"
              )}
              {...bind(i)}
            >
              <span className="sr-only">{say(c)}</span>
            </Choice>
          ))}
        </Choices>
      </div>

      {/* The steps as a bar of swatches, each edge's value under the gap it sits on. */}
      <div aria-hidden="true" className="absolute left-[72px]" style={{ top: KEY_Y }}>
        <Label>Agent views a day</Label>
        <div className="mt-2 flex gap-1">
          {CALENDAR_STEPS.map((_, k) => (
            <span key={k} className={cn("spread-cell h-4 w-11", `spread-step-${k}`)} />
          ))}
        </div>
        <div className="relative mt-2 h-4">
          {CALENDAR_STEPS.slice(1).map((t, k) => (
            <p key={t} className={cn(tickText, "absolute top-0 w-11 text-center")} style={{ left: (k + 1) * PITCH - 24 }}>
              {t < 1000 ? `${t}K` : `${t / 1000}M`}
            </p>
          ))}
        </div>
      </div>

      {/* Each week's total, the sum of the column above it; the read day's week keeps its colour. */}
      <div aria-hidden="true">
        {CALENDAR_WEEKS.map((w, i) => (
          <div key={w.start} className="absolute" style={{ left: colX(i), top: FOOT - w.h, width: CELL_W, height: w.h }}>
            <Fill axis="y" size={w.h} at={barAt(i)} duration={GROW} className="bg-background">
              <div className={cn("size-full bg-viz-lead transition-opacity", on && on.week !== i && "opacity-30")} />
            </Fill>
          </div>
        ))}
        {ENDS.map((i) => (
          <p
            key={i}
            className={cn(tickText, "absolute text-center")}
            style={{ left: colX(i), top: FOOT - CALENDAR_WEEKS[i].h - 24, width: CELL_W }}
          >
            {millions(CALENDAR_WEEKS[i].views)}
          </p>
        ))}
        <Label className="absolute left-[72px]" style={{ top: KEY_Y + 96 }}>
          Agent views a week
        </Label>
      </div>
    </Frame>
  )
}
