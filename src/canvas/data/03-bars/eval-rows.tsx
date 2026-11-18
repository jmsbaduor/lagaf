import type { CSSProperties } from "react"

import { CountUp, delay, Frame, Header, TOP, useReading } from "@/canvas/kit"
import { cn } from "@/lib/utils"

import { EVALS } from "../facts"
import { focusRing } from "./parts"

const ROWS = [
  { caption: "Fewer 404s per task", what: "404 errors per task", fmt: (n: number) => n.toFixed(3) },
  { caption: "Accuracy, up from 97.6%", what: "Accuracy", fmt: (n: number) => `${n.toFixed(1)}%` },
  { caption: "Faster median task completion time", what: "Median task time", fmt: (n: number) => `${n.toFixed(1)}s` },
].map((r, i) => ({ ...r, ...EVALS[i] }))

// The entrance is each change: the before and after bars draw to the before length together, then the after bar
// moves to its own length while its number counts from before to after. Rows a beat apart; panels and stats stay.
const DRAW = 500
const CHANGE = 600
const AT = [100, 160, 200]

export default function EvalRows() {
  const { active, bind } = useReading<number>()
  const on = active === null ? null : ROWS[active]

  return (
    <Frame>
      <Header
        title="What llms.txt changed in the eval"
        description="The overall eval: 20 docs sites and 100 questions, before and after llms.txt."
        hint={on ? `${on.what}: ${on.fmt(on.before)} to ${on.fmt(on.after)}` : "Hover or focus a row"}
        on={!!on}
      />

      <ul
        aria-label="Eval results"
        className="absolute left-[72px] flex w-[1296px] flex-col gap-6"
        style={{ top: TOP }}
      >
        {ROWS.map((d, i) => {
          // A row that isn't read turns both panels to the track and its words and bars to the muted ink, which
          // reads on the track (4.5:1), so the read row is the only one in colour.
          const dim = active !== null && active !== i
          return (
            <li
              key={d.caption}
              tabIndex={0}
              aria-label={`${d.stat}% ${d.caption.toLowerCase()}: ${d.fmt(d.before)} before, ${d.fmt(d.after)} after.`}
              className={focusRing}
              {...bind(i)}
            >
              <div aria-hidden="true" className="flex h-44 gap-6">
                <div
                  className={cn(
                    "flex flex-1 flex-col justify-between p-6 transition-colors",
                    dim ? "bg-viz-track text-muted-foreground" : "bg-viz-panel text-viz-panel-ink"
                  )}
                >
                  {/* The indent takes up the digits' side bearing, so the stat's ink lines up with the caption's. */}
                  <p className="-indent-0.5 font-heading text-[72px] leading-[72px] font-medium tracking-[-0.03em]">
                    {d.stat}%
                  </p>
                  <p className="text-[22px] leading-7 tracking-[-0.01em]">{d.caption}</p>
                </div>
                <div
                  className={cn(
                    "flex flex-1 items-center justify-between gap-10 px-6 transition-colors",
                    dim ? "bg-viz-track text-muted-foreground" : "bg-viz-deep text-viz-deep-ink"
                  )}
                >
                  <BarPair before={d.before} after={d.after} at={AT[i]} />
                  <p className="w-[144px] text-right font-mono text-[18px] leading-6 font-medium whitespace-nowrap">
                    {d.fmt(d.before)} →{" "}
                    <CountUp
                      value={d.after - d.before}
                      delay={AT[i] + DRAW}
                      duration={CHANGE}
                      format={(n) => d.fmt(d.before + n)}
                    />
                  </p>
                </div>
              </div>
            </li>
          )
        })}
      </ul>
    </Frame>
  )
}

// The bars' track, after the 56px names and a 12px gap. Lengths snap to the 4px grid: within 2px (under 1%) of exact.
const TRACK = 232

/**
 * Before and after drawn from zero on one scale, in the panel's ink. The after bar first matches the before length,
 * then moves. The names take the ink whole: at 70% they fell under 4.5:1 on the dark inverse panel in some accents.
 */
function BarPair({ before, after, at }: { before: number; after: number; at: number }) {
  const length = (v: number) => Math.round(((v / Math.max(before, after)) * TRACK) / 4) * 4
  const [b, a] = [length(before), length(after)]
  const name = "font-mono text-[12px] leading-4 font-medium uppercase"
  return (
    <div className="grid w-[300px] grid-cols-[56px_1fr] items-center gap-x-3 gap-y-2">
      <span className={name}>Before</span>
      <span className="viz-grow-x block h-2 bg-current/40" style={{ width: b, ...delay(at, DRAW) }} />
      <span className={name}>After</span>
      <span className="viz-grow-x block h-2" style={{ width: a, ...delay(at, DRAW) }}>
        <span
          className="viz-grow-x block size-full bg-current"
          style={{ ...delay(at + DRAW, CHANGE), "--viz-from": b / a } as CSSProperties}
        />
      </span>
    </div>
  )
}
