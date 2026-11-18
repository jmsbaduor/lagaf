import { useEffect, useRef, useState } from "react"
import { Button } from "@ui-sdk/react/button"

import { delay, Frame, Header, TOP } from "@/canvas/kit"
import { useStage, type Knobs, type Values } from "@/components/stage"
import { cn } from "@/lib/utils"

import { Bars, LAG, labelText, Live, Status } from "./parts"

export const knobs = {
  state: {
    type: "choice",
    label: "State",
    value: "Error",
    options: ["Error", "Empty"],
  },
} as const satisfies Knobs

// Both messages in the same shape: a status, a title, a two-line reason, one action.
const COPY = {
  Error: {
    status: "Didn’t load",
    title: "The data didn’t arrive in time.",
    body: "The request stopped after 10 seconds. Check your connection and try again.",
    action: "Try again",
  },
  Empty: {
    status: "No data yet",
    title: "Nothing was recorded for Q3.",
    body: "The quarter has only just started. Show the last full quarter instead.",
    action: "Show Q2",
  },
}

export default function NoData({ state = "Error" }: Partial<Values<typeof knobs>>) {
  // Keyed, so flipping the knob starts the new state fresh.
  return (
    <Frame>
      <Chart key={state} state={state} />
    </Frame>
  )
}

type Phase = "message" | "loading" | "loaded"

function Chart({ state }: { state: "Error" | "Empty" }) {
  const copy = COPY[state]
  const { speed } = useStage()
  const [phase, setPhase] = useState<Phase>("message")
  const chart = useRef<HTMLDivElement>(null)

  // The action reloads: the skeleton breathes for a moment, then the bars arrive.
  useEffect(() => {
    if (phase !== "loading") return
    const t = setTimeout(() => setPhase("loaded"), 1200 / speed)
    return () => clearTimeout(t)
  }, [phase, speed])

  const act = () => {
    setPhase("loading")
    // The button is about to go: keep focus on the chart rather than losing it to the page.
    chart.current?.focus()
  }

  const mode = phase === "loaded" ? "data" : phase === "loading" ? "wait" : state === "Error" ? "still" : "empty"

  return (
    <>
      <Header
        title="When there is no data"
        description="The chart says what went wrong in plain words and offers one next step."
        hint={
          phase === "message" ? undefined : (
            <Status busy={phase === "loading"}>{phase === "loading" ? "Loading" : "Loaded"}</Status>
          )
        }
        on={phase === "loading"}
      />
      {/* The chart fills the content box to 824: labels, 16, then 560 of hatch in three 416 columns, 24 apart. */}
      <div
        ref={chart}
        tabIndex={-1}
        role="group"
        aria-label="Docs update lag chart"
        aria-busy={phase === "loading"}
        className="absolute left-[72px] h-[592px] w-[1296px] outline-none"
        style={{ top: TOP }}
      >
        <Bars
          mode={mode}
          big
          className={cn("h-full gap-x-6 transition-opacity duration-200", mode === "still" && "opacity-50")}
        />

        {phase === "message" && (
          // 640 wide and centred: 328 in. 300 tall, 160 down, so it sits on the hatch's middle.
          <div
            className="viz-fade absolute top-[160px] left-[328px] flex w-[640px] flex-col gap-6 bg-canvas p-10"
            style={delay(120)}
          >
            <p
              className={cn(
                labelText,
                "flex items-center gap-2",
                state === "Error" ? "text-danger" : "text-viz-label"
              )}
            >
              <span aria-hidden="true" className={cn("size-2", state === "Error" ? "bg-danger" : "bg-viz-label")} />
              {copy.status}
            </p>
            <div className="flex flex-col gap-3">
              <h3 className="text-[32px] leading-10 font-normal tracking-[-0.02em] text-balance">{copy.title}</h3>
              <p className="text-[20px] leading-8 text-pretty text-muted-foreground">{copy.body}</p>
            </div>
            <Button data-variant="solid" className="h-10 self-start px-4 text-[16px]" onClick={act}>
              {copy.action}
            </Button>
          </div>
        )}

        <Live>
          {phase === "message"
            ? `${copy.status}. ${copy.title}`
            : phase === "loaded"
              ? `${LAG.map((d) => `${d.label}: ${d.value}%`).join(", ")}.`
              : ""}
        </Live>
      </div>
    </>
  )
}
