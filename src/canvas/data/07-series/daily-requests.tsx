import { useId, type CSSProperties } from "react"

import { Choice, Choices, Fill, Frame, Header, Key, TOP, useReading, XAxis, YAxis } from "@/canvas/kit"
import type { Knobs, Values } from "@/components/stage"

import { pct } from "../facts"
import { AXIS, COUNT_TICKS, DAYS, GAP, millions, REQUEST_PX, SHARE_PX, SHARE_TICKS } from "./data"

// Count shows how many requests the cache took; Share shows what part of each day it took, so the climb to 85% reads
// against one height. Both scales put their ticks on the same lines, so only the labels change.
export const knobs = {
  measure: { type: "choice", label: "Measure", value: "Count", options: ["Count", "Share"] },
} as const satisfies Knobs

// 14 columns of 60, 32 apart (a 92 pitch), from the 32px tick column and 8 to 1368, so every edge is a whole 4.
// Cached requests stack from the baseline at 792, uncached on top of them, 4 apart.
const PLOT_X = 112
const PITCH = 92
const BAR_W = 60
const PLOT_Y = TOP + 32
const BASE = PLOT_Y + AXIS
const colX = (i: number) => PLOT_X + i * PITCH

// The entrance is the fortnight: each column grows from the baseline, both parts together, in a wave from May 18 to
// May 31. The measure answers in 200ms, scaling the same parts. Axes, the key and the ticks are there from the start.
const GROW = 500
const STAGGER = 30

export default function DailyRequests({ measure = "Count" }: Partial<Values<typeof knobs>>) {
  const name = useId()
  const share = measure === "Share"
  const { active, bind, dim } = useReading<number>()
  const say = (d: (typeof DAYS)[number]) => `${d.date}: ${millions(d.total / 1000)}, ${pct(d.share)} cached`
  const on = active === null ? null : DAYS[active]

  return (
    <Frame>
      <Header
        title="Cache share rose to 85%"
        description="Agent requests a day over May’s last two weeks, cached and uncached."
        hint={on ? say(on) : "Hover or focus a day"}
        on={!!on}
      />

      <YAxis
        name={share ? "Share of requests" : "Agent requests a day"}
        ticks={
          share
            ? SHARE_TICKS.map((v) => ({ at: BASE - v * SHARE_PX, label: `${v}%` }))
            : COUNT_TICKS.map((v) => ({ at: BASE - Math.round(v * 1000 * REQUEST_PX), label: v ? `${v}M` : "0" }))
        }
        from={PLOT_X}
        to={1368}
      />
      {/* The key ends the axis name's line; 80 and 96 hold each swatch and name, so it ends on 1368. */}
      <div aria-hidden="true" className="pointer-events-none absolute right-[72px] grid grid-cols-[80px_96px] gap-8" style={{ top: TOP }}>
        <Key color="var(--viz-lead)">Cached</Key>
        <Key color="var(--viz-contrast)">Uncached</Key>
      </div>

      <Choices legend="Read a day">
        {DAYS.map((d, i) => {
          const h = share ? d.shareH : d.count
          return (
            <Choice
              key={d.date}
              name={name}
              value={String(i)}
              // The column is its hit area, 16px into each gap, so moving along the columns never drops a reading.
              className="absolute w-15 before:absolute before:-inset-x-4 before:inset-y-0"
              style={{ left: colX(i), top: PLOT_Y, height: AXIS }}
              {...bind(i)}
            >
              <span className="sr-only">{say(d)}</span>
              <Fill axis="y" at={100 + i * STAGGER} duration={GROW} className="inset-0">
                <Part color="var(--viz-lead)" dim={dim(i)} style={{ scale: `1 ${h.cached / AXIS}` }} />
                <Part
                  color="var(--viz-contrast)"
                  dim={dim(i)}
                  style={{ translate: `0 ${-(h.cached + GAP)}px`, scale: `1 ${(h.total - h.cached - GAP) / AXIS}` }}
                />
              </Fill>
            </Choice>
          )
        })}
      </Choices>

      <XAxis y={BASE} ticks={DAYS.map((d, i) => ({ at: colX(i) + BAR_W / 2, label: d.tick, on: active === i }))} />
    </Frame>
  )
}

/**
 * One part of a column: the full plot height, scaled (and lifted) to its length from the baseline, so a measure
 * change is a 200ms transform on the same element. A part that isn't read fades toward the paper, as a Cell does,
 * so the gridlines don't show through it.
 */
function Part({ color, dim, style }: { color: string; dim: boolean; style: CSSProperties }) {
  return (
    <div className="absolute inset-0 origin-bottom transition-[translate,scale] duration-200" style={style}>
      <span
        data-dim={dim || undefined}
        className="px-cell block size-full"
        style={{ "--px": color } as CSSProperties}
      />
    </div>
  )
}
