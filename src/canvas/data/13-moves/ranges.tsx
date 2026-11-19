import { CountUp, delay, focusRing, Frame, Header, Key, TOP, useReading, XAxis, YAxis } from "@/canvas/kit"
import { cn } from "@/lib/utils"

import { sec } from "../facts"
import { RANGES, RANGES_PX, RANGES_TICKS, rangesSay } from "./data"

// Six columns of 208 from the 40px tick column and 8 to 1368. In each, a 104 span 16 in, its median's 120 tick
// standing 8 past either side, and the median's value in the 72 after it, so the last ends on 1368. The baseline
// sits 528 under the plot's top (6s at 88px a second), and the month ticks under it end at 820.
const PLOT_X = 120
const PITCH = 208
const PLOT_Y = TOP + 32
const BASE = PLOT_Y + RANGES_TICKS.at(-1)! * RANGES_PX
const colX = (i: number) => PLOT_X + i * PITCH

// The entrance is each month's spread opening: its median's tick appears, then the span grows out of it, up to the
// slowest tenth and down to the fastest, while the median counts, left to right in one wave. Axes, ticks and the
// key are there from the start.
const GROW = 500
const AT = [100, 180, 250, 310, 360, 400]

export default function Ranges() {
  const { active, bind, dim } = useReading<number>()

  return (
    <Frame>
      <Header
        title="Answers got faster and steadier"
        description="The fastest to slowest tenth of agent answers each month, median marked."
        hint={active === null ? "Hover or focus a month" : rangesSay(RANGES[active])}
        on={active !== null}
      />

      <YAxis
        name="Time to answer"
        ticks={RANGES_TICKS.map((v) => ({ at: BASE - v * RANGES_PX, label: v ? `${v}s` : "0" }))}
        from={PLOT_X}
        to={1368}
      />
      {/* The key ends the axis name's line, over the short spans on the right; 136 and 80 hold each swatch and name. */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute right-[72px] grid grid-cols-[136px_80px] gap-8"
        style={{ top: TOP }}
      >
        <Key color="var(--viz-lead)">Middle 80%</Key>
        <Key color="var(--viz-ink)">Median</Key>
      </div>

      <ul aria-label="Agent answer time by month, fastest to slowest tenth">
        {RANGES.map((r, i) => {
          const x = colX(i)
          const off = dim(i)
          return (
            <li
              key={r.month}
              tabIndex={0}
              aria-label={rangesSay(r)}
              // The whole column, plot top to baseline, is the item, so moving along the months never drops a reading.
              className={cn("absolute", focusRing)}
              style={{ left: x, top: PLOT_Y, width: PITCH, height: BASE - PLOT_Y }}
              {...bind(i)}
            >
              {/* The span grows out of its median, both ways. A span that isn't read fades over the paper, so the
                  gridlines don't show through it. */}
              <div
                aria-hidden="true"
                className="viz-grow-y absolute left-4 w-[104px] bg-background"
                style={{
                  top: BASE - r.h90 - PLOT_Y,
                  height: r.h90 - r.h10,
                  ...delay(AT[i], GROW),
                  transformOrigin: `center ${r.h90 - r.hMedian}px`,
                }}
              >
                <div className={cn("size-full bg-viz-lead transition-opacity", off && "opacity-30")} />
              </div>
              {/* The median: a thick tick in the ink, ringed in the paper so it parts from the span in every accent. */}
              <span
                aria-hidden="true"
                className="viz-fade absolute left-2 h-2 w-[120px] bg-background ring-2 ring-background"
                style={{ top: BASE - r.hMedian - 4 - PLOT_Y, ...delay(AT[i]) }}
              >
                <span className={cn("block size-full bg-foreground transition-opacity", off && "opacity-30")} />
              </span>
              <p
                aria-hidden="true"
                className={cn(
                  "viz-fade absolute left-[136px] w-[72px] font-heading text-[32px] leading-10 font-medium tracking-[-0.03em] transition-colors",
                  off && "text-muted-foreground"
                )}
                style={{ top: BASE - r.hMedian - 20 - PLOT_Y, ...delay(AT[i]) }}
              >
                <CountUp value={r.median} delay={AT[i]} duration={GROW} format={sec} />
              </p>
            </li>
          )
        })}
      </ul>

      <XAxis
        y={BASE}
        ticks={RANGES.map((r, i) => ({ at: colX(i) + 68, label: r.month, on: active === i }))}
      />
    </Frame>
  )
}
