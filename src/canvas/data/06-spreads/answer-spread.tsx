import { useId } from "react"

import { Choice, Choices, delay, Fill, Frame, Header, Label, smallLabelText, TOP, useReading } from "@/canvas/kit"
import { cn } from "@/lib/utils"

import { ANSWER_BINS, ANSWER_PX, ANSWER_TICKS, answerMedian, BIN_S, barHeight, binName } from "./data"

// 21 bars of 56px, 4 apart, from the 32px tick column and 8, so the last ends on 1368. Each 4px gap is a bin edge,
// and the median's 4px stem stands in the gap at 0.8s. The baseline sits 512 under the plot's top: the tallest bar.
const PLOT_X = 112
const PLOT_Y = TOP + 32 // under the median's label
const BASE = 776
const PITCH = 60
const edgeX = (k: number) => PLOT_X + k * PITCH - 4 // the gap before bin k
const MEDIAN_K = answerMedian / BIN_S

const share = (tenths: number) => `${(tenths / 10).toFixed(1)}%`

// The entrance is the distribution building: bars grow from the baseline in a wave from fast to slow, then the
// median's stem draws up through the gap and its label fades in. Gridlines and labels are there from the start.
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

      <Label className="absolute left-[72px]" style={{ top: TOP }}>
        Share of answers
      </Label>
      {/* Gridlines every 5 points; each tick label is centred on its line. */}
      {ANSWER_TICKS.map((t) => (
        <div key={t} aria-hidden="true">
          <span className="absolute right-[72px] h-px bg-border" style={{ left: PLOT_X, top: BASE - t * ANSWER_PX }} />
          <p
            className={cn(smallLabelText, "absolute left-[72px] w-8 text-right text-viz-label")}
            style={{ top: BASE - t * ANSWER_PX - 8 }}
          >
            {t}%
          </p>
        </div>
      ))}

      <Choices legend="Read a bin">
        {ANSWER_BINS.map((n, i) => (
          <Choice
            key={i}
            name={name}
            value={String(i)}
            // The bar's column is its hit area, 2px into each gap, so moving along the bars never drops a reading.
            className="absolute w-14 outline-offset-4 before:absolute before:-inset-x-0.5 before:inset-y-0"
            style={{
              left: PLOT_X + i * PITCH,
              top: PLOT_Y,
              height: BASE - PLOT_Y,
            }}
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
        style={{
          left: edgeX(MEDIAN_K),
          top: TOP,
          height: BASE + 8 - TOP,
          ...delay(STEM_AT, STEM),
        }}
      />
      <Label
        className="viz-fade absolute text-foreground"
        style={{
          left: edgeX(MEDIAN_K) + 12,
          top: TOP,
          ...delay(STEM_AT + 300),
        }}
      >
        Median {answerMedian}s
      </Label>

      {/* Seconds under every other edge, the median's in the ink. */}
      {Array.from({ length: 11 }, (_, j) => (
        <p
          key={j}
          aria-hidden="true"
          className={cn(
            smallLabelText,
            "absolute w-11 text-center",
            j * 2 === MEDIAN_K ? "text-foreground" : "text-viz-label"
          )}
          style={{ left: edgeX(j * 2) + 2 - 22, top: BASE + 12 }}
        >
          {+(j * 2 * BIN_S).toFixed(1)}s
        </p>
      ))}
      <Label className="absolute right-[72px]" style={{ top: BASE + 36 }}>
        Time to answer
      </Label>
    </Frame>
  )
}
