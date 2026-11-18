import { useEffect, useState } from "react"

import { delay, Frame, Header, Label, TOP } from "@/canvas/kit"
import { useStage, type Knobs, type Values } from "@/components/stage"
import { cn } from "@/lib/utils"

import { LAG, labelText, Live, Spec, Status } from "./parts"

export const knobs = {
  quarter: {
    type: "choice",
    label: "Quarter",
    value: "Q2",
    options: ["Q1", "Q2", "Q3"],
  },
} as const satisfies Knobs
type Quarter = Values<typeof knobs>["quarter"]

// Q2 is the bars row's numbers; Q1 and Q3 are stand-ins so the knob has something to change.
const DATA: Record<Quarter, number[]> = {
  Q1: [18, 52, 30],
  Q2: LAG.map((d) => d.value),
  Q3: [31, 50, 19],
}
const MAX = 60
// The chart runs the full 1296: each track, 32, then a 128 number column.
const TRACK = 1136
// A bar's scale, so its end lands on the 4 px grid of the track.
const snap = (v: number) => (Math.round((TRACK * v) / MAX / 4) * 4) / TRACK

// The update's timing. A real refetch decides when the data arrives; here it takes 1.4s, so the wait shows.
const QUIET = 300 // before this, nothing changes: most updates land inside it
const LATENCY = 1400
const MOVE = 300

type Phase = "settled" | "pending" | "waiting" | "moving"

const SPEC: { phase: Phase; at: string; text: string }[] = [
  { phase: "pending", at: "0 to 0.3s", text: "Nothing moves. Most land here." },
  { phase: "waiting", at: "From 0.3s", text: "Bars and numbers fade to 40%." },
  { phase: "moving", at: "Data arrives", text: "Bars ease to their new length." },
  { phase: "settled", at: "Settled", text: "Labels, rules and hatch stay." },
]

export default function DataUpdate({ quarter = "Q2" }: Partial<Values<typeof knobs>>) {
  const { speed } = useStage()
  const [shown, setShown] = useState<Quarter>(quarter)
  const [waitingFor, setWaitingFor] = useState<Quarter | null>(null)
  const [moving, setMoving] = useState(false)

  // The chart keeps showing what it has until the new data arrives. `waitingFor` names the data gone stale, so a
  // second change mid-wait keeps the chart faded while the fetch starts over.
  useEffect(() => {
    if (quarter === shown) return
    const wait = setTimeout(() => setWaitingFor(shown), QUIET / speed)
    const arrive = setTimeout(() => {
      setWaitingFor(null)
      setShown(quarter)
      setMoving(true)
    }, LATENCY / speed)
    return () => {
      clearTimeout(wait)
      clearTimeout(arrive)
    }
  }, [quarter, shown, speed])

  useEffect(() => {
    if (!moving) return
    const t = setTimeout(() => setMoving(false), MOVE / speed)
    return () => clearTimeout(t)
  }, [moving, speed])

  const phase: Phase = moving ? "moving" : quarter !== shown ? (waitingFor === shown ? "waiting" : "pending") : "settled"
  const busy = phase === "waiting" || phase === "moving"
  const values = DATA[shown]

  return (
    <Frame>
      <Header
        title="When the data changes"
        description="The chart holds still, then moves only the bars and numbers that changed."
        hint={<Status busy={busy}>{busy ? "Updating" : "Up to date"}</Status>}
        on={busy}
      />

      {/* The chart's label, 32, then three rows of label, 16, an 80 bar, 40 apart: 464, then the rules 48 under it. */}
      <div
        role="group"
        aria-label="Docs update lag chart"
        aria-busy={phase !== "settled"}
        className="absolute left-[72px] w-[1296px]"
        style={{ top: TOP }}
      >
        <Label className="text-foreground">Docs update lag, {shown}</Label>
        <ul className="mt-8 flex flex-col gap-10">
          {LAG.map((d, i) => (
            <li key={d.label} aria-label={`${d.label}: ${values[i]}%`} className="flex flex-col gap-4">
              <span aria-hidden="true" className={cn(labelText, "text-viz-label")}>
                {d.label}
              </span>
              <div aria-hidden="true" className="flex items-center gap-8">
                <div className="viz-hatch relative h-20 flex-1">
                  <div
                    className={cn("absolute inset-0 transition-opacity duration-200", phase === "waiting" && "opacity-40")}
                  >
                    <div className="viz-grow-x h-full" style={delay(i * 60)}>
                      <div
                        className={cn("h-full origin-left transition-transform duration-300", d.fill)}
                        style={{ transform: `scaleX(${snap(values[i])})` }}
                      />
                    </div>
                  </div>
                </div>
                <p
                  className={cn(
                    "w-32 text-right font-heading text-[56px] leading-16 font-medium tracking-[-0.03em] transition-opacity duration-200",
                    phase === "waiting" && "opacity-40"
                  )}
                >
                  <span key={values[i]} className="viz-fade inline-block" style={delay(0, 150)}>
                    {values[i]}%
                  </span>
                </p>
              </div>
            </li>
          ))}
        </ul>
        <Spec rows={SPEC} active={SPEC.findIndex((s) => s.phase === phase)} across className="mt-12" />
      </div>

      <Live>{`${shown}. ${LAG.map((d, i) => `${d.label}: ${values[i]}%`).join(", ")}.`}</Live>
    </Frame>
  )
}
