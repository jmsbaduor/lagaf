import type { ReactNode } from "react"

import { delay, Frame, Header, Label, TOP } from "@/canvas/kit"
import { Mark } from "@/components/Mark"
import { cn } from "@/lib/utils"

import { Bars, labelText, rule } from "./parts"

// One chart at four moments of a slow load. The thresholds are the row's timing rules. Every moment keeps the foot
// row, so the skeleton never changes size when the line or the error arrives. Four columns of 288, 48 apart: a
// label, 16, a 480 picture, 16, a two-line note, so the strip ends on 824.
const MOMENTS: { at: string; note: string; bars?: "wait" | "still"; foot?: ReactNode }[] = [
  { at: "0 to 0.4s", note: "Paper only, so a fast load never flashes a loader." },
  { at: "From 0.4s", note: "The skeleton fades in and breathes while it waits.", bars: "wait" },
  {
    at: "From 3s",
    note: "A line under the chart says it is still loading.",
    bars: "wait",
    foot: (
      // Fixed widths: a status with an icon is a box with two edges, and both stay on the grid.
      <p className={cn(labelText, "flex w-36 items-center gap-2 text-foreground")}>
        <Mark loading />
        Still loading
      </p>
    ),
  },
  {
    at: "At 10s",
    note: "The wait ends with an error and a way to retry.",
    bars: "still",
    foot: (
      <>
        <p className={cn(labelText, "flex w-36 items-center gap-2 text-danger")}>
          <span className="size-2 bg-danger" />
          Didn’t load
        </p>
        {/* A picture of the button: this strip shows moments, it doesn't run them. */}
        <span className="inline-flex h-8 items-center rounded-control bg-primary px-3 text-[14px] leading-5 font-medium text-primary-fg">
          Try again
        </span>
      </>
    ),
  },
]

export default function SlowLoad() {
  return (
    <Frame>
      <Header
        title="When the data is slow"
        description="The chart shows a skeleton at 0.4s, a note at 3s and an error at 10s."
      />

      <ol className="absolute left-[72px] grid w-[1296px] grid-cols-4 gap-x-12" style={{ top: TOP }}>
        {MOMENTS.map((m, i) => (
          <li key={m.at} className={cn("viz-fade flex flex-col gap-4 pt-4", rule)} style={delay(i * 60)}>
            <Label className="text-foreground">{m.at}</Label>
            <div aria-hidden="true" className="flex h-[480px] flex-col gap-4 p-4 ring-1 ring-viz-hatch ring-inset">
              {m.bars && (
                <>
                  {/* Three 80 columns, 8 apart. */}
                  <Bars mode={m.bars} className={cn("flex-1 gap-x-2", m.bars === "still" && "opacity-50")} />
                  <div className="flex h-8 items-center justify-between">{m.foot}</div>
                </>
              )}
            </div>
            <p className="text-[18px] leading-6 text-balance text-muted-foreground">{m.note}</p>
          </li>
        ))}
      </ol>
    </Frame>
  )
}
