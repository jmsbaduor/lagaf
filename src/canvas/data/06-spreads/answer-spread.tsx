import { useId } from "react"

import { Choice, Choices, delay, Fill, Frame, Header, Label, TOP, useReading, XAxis, YAxis } from "@/canvas/kit"
import { cn } from "@/lib/utils"

import { ANSWER_BINS, ANSWER_PX, ANSWER_TICKS, answerMedian, BIN_S, barHeight, binName } from "./data"

// 20 bars of 56px, 4 apart, from the 24px tick column and 8; each 4px gap is a bin edge, and the median's 4px stem
// stands in the gap at 0.8s. The open "4s and over" bin has no right edge, so it stands 12 apart under its own
// "4s+", ending on 1368. The baseline sits 512 under the plot's top: the tallest bar.
const PLOT_X = 104
const PLOT_Y = TOP + 32 // under the y axis's name
const BASE = 776
const PITCH = 60
const OPEN = ANSWER_BINS.length - 1
const barX = (i: number) => PLOT_X + i * PITCH + (i === OPEN ? 8 : 0)
const edgeX = (k: number) => PLOT_X + k * PITCH - 4 // the gap before bin k
const MEDIAN_K = answerMedian / BIN_S

const share = (tenths: number) => `${(tenths / 10).toFixed(1)}%`

// Seconds under every other closed edge, centred in its gap, the median's in the ink; then the open bin's own tick.
const SECONDS = [
  ...Array.from({ length: OPEN / 2 }, (_, j) => ({
    at: edgeX(j * 2) + 2,
    label: `${+(j * 2 * BIN_S).toFixed(1)}s`,
    on: j * 2 === MEDIAN_K,
  })),
  { at: barX(OPEN) + 28, label: `${+(OPEN * BIN_S).toFixed(1)}s+` },
]

// The entrance is the distribution building: bars grow from the baseline in a wave from fast to slow, then the
// median's stem draws up through the gap and its label fades in. Axes are there from the start.
const GROW = 500
const STAGGER = 16
const STEM_AT = 500
const STEM = 400

export default function AnswerSpread() {
  const name = useId()
  const { active: on, bind, dim } = useReading<number>()

  return (
    <Frame>
      <Header
        title="Half the answers took under 0.8s"
        description="How long agents took to reach an answer in May, in bins of 0.2 seconds."
        hint={on !== null ? `${binName(on)}: ${share(ANSWER_BINS[on])} of answers` : "Hover or focus a bar"}
        on={on !== null}
      />

      <YAxis
        name="Share of answers"
        ticks={ANSWER_TICKS.map((t) => ({ at: BASE - t * ANSWER_PX, label: `${t}%` }))}
        from={PLOT_X}
        to={1368}
      />

      <Choices legend="Read a bin">
        {ANSWER_BINS.map((n, i) => (
          <Choice
            key={i}
            name={name}
            value={String(i)}
            // The bar's column is its hit area, 2px into each gap, so moving along the bars never drops a reading.
            className="absolute w-14 before:absolute before:-inset-x-0.5 before:inset-y-0 has-[:focus-visible]:outline-offset-1"
            style={{ left: barX(i), top: PLOT_Y, height: BASE - PLOT_Y }}
            {...bind(i)}
          >
            <span className="sr-only">
              {binName(i)}: {share(n)} of answers
            </span>
            {/* A bar that isn't read fades over the paper, so the gridlines don't show through it. */}
            <Fill axis="y" size={barHeight(n)} at={100 + i * STAGGER} duration={GROW} className="bg-background">
              <div className={cn("size-full bg-viz-lead transition-opacity", dim(i) && "opacity-30")} />
            </Fill>
          </Choice>
        ))}
      </Choices>

      {/* The median on the axis: a stem in the 0.8s gap from the axis up past the bars, named at its top. */}
      <span
        aria-hidden="true"
        className="viz-grow-y absolute w-1 bg-foreground"
        style={{ left: edgeX(MEDIAN_K), top: TOP, height: BASE + 8 - TOP, ...delay(STEM_AT, STEM) }}
      />
      {/* 96 wide, so the box ends on the grid now that the value is a span (seconds keep their lower-case s). */}
      <Label
        className="viz-fade absolute w-24 text-foreground"
        style={{ left: edgeX(MEDIAN_K) + 12, top: TOP, ...delay(STEM_AT + 300) }}
      >
        Median <span className="normal-case">{answerMedian}s</span>
      </Label>

      <XAxis name="Time to answer" ticks={SECONDS} y={BASE} />
    </Frame>
  )
}
