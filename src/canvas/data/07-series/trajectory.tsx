import { useId } from "react"

import { Choice, Choices, Fill, Frame, Header, Key, TOP, useReading, XAxis, YAxis } from "@/canvas/kit"
import { cn } from "@/lib/utils"

import { DEMO } from "../facts"
import { LAST_MONTH, millions, WEEK_PX, WEEK_TICKS, WEEKS } from "./data"

// 26 columns of 44, 4 apart (a 48 pitch), from the 44px tick column and 8 to 1368, so every edge is a whole 4.
// Each grows from the baseline at 792, 66px a million. May's weeks take the deep role: in light the inverse panel,
// past the lead; in dark the deep panel would sink into the paper, so they go on past the lead toward the ink, as the
// heatmap's top step does.
const PLOT_X = 124
const PITCH = 48
const BAR_W = 44
const PLOT_Y = TOP + 32
const BASE = PLOT_Y + 8 * WEEK_PX
const colX = (i: number) => PLOT_X + i * PITCH
const DEEP = "light-dark(var(--viz-deep), color-mix(in oklch, var(--viz-lead) 50%, var(--viz-ink)))"

// A month's tick sits under the first week that starts in it.
const FIRST = DEMO.months.map((_, m) => WEEKS.findIndex((w) => w.month === m))

// The entrance is the trajectory: columns grow from the baseline in a wave from December to May. Axes, the key and
// the ticks are there from the start.
const GROW = 500
const STAGGER = 14

export default function Trajectory() {
  const name = useId()
  const { active, bind, dim } = useReading<number>()
  const on = active === null ? null : WEEKS[active]

  return (
    <Frame>
      <Header
        title="May’s weeks beat every week before"
        description="Agent page views a week across the 26 weeks from December to May."
        hint={on ? `Week of ${on.start}: ${millions(on.views)}` : "Hover or focus a week"}
        on={!!on}
      />

      <YAxis
        name="Agent views a week"
        ticks={WEEK_TICKS.map((v) => ({ at: BASE - v * WEEK_PX, label: v ? `${v}M` : "0" }))}
        from={PLOT_X}
        to={1368}
      />
      {/* The key ends the axis name's line; 88 and 56 hold each swatch and name, so it ends on 1368. */}
      <div aria-hidden="true" className="pointer-events-none absolute right-[72px] grid grid-cols-[88px_56px] gap-8" style={{ top: TOP }}>
        <Key color="var(--viz-lead)">Dec–Apr</Key>
        <Key color={DEEP}>May</Key>
      </div>

      <Choices legend="Read a week">
        {WEEKS.map((w, i) => (
          <Choice
            key={w.start}
            name={name}
            value={String(i)}
            // The column is its hit area, 2px into each gap, so moving along the columns never drops a reading.
            className="absolute w-11 before:absolute before:-inset-x-0.5 before:inset-y-0 has-[:focus-visible]:outline-offset-1"
            style={{ left: colX(i), top: PLOT_Y, height: BASE - PLOT_Y }}
            {...bind(i)}
          >
            <span className="sr-only">
              Week of {w.start}: {millions(w.views)}
            </span>
            {/* A column that isn't read fades over the paper, so the gridlines don't show through it. */}
            <Fill axis="y" size={w.h} at={100 + i * STAGGER} duration={GROW} className="bg-background">
              <div
                className={cn("size-full transition-opacity", dim(i) && "opacity-30")}
                style={{ backgroundColor: w.month === LAST_MONTH ? DEEP : "var(--viz-lead)" }}
              />
            </Fill>
          </Choice>
        ))}
      </Choices>

      <XAxis
        y={BASE}
        ticks={FIRST.map((i, m) => ({ at: colX(i) + BAR_W / 2, label: DEMO.months[m], on: on?.month === m }))}
      />
    </Frame>
  )
}
