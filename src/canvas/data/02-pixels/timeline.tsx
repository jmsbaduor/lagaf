import { useId, type CSSProperties } from "react"

import { delay, Frame, Header, TOP, useReading } from "@/canvas/kit"
import { cn } from "@/lib/utils"

import { FIELD, FIELD_COLS, FIELD_ROWS, STAGE_X, stageCol } from "../facts"
import { Choice, Choices } from "./parts"

const STAGES = [
  { when: "Week 1", name: "Pilot", note: "One docs site, agents set it up." },
  { when: "Month 1", name: "Team", note: "Base for internal knowledge." },
  { when: "Quarter 1", name: "Autopilot", note: "Docs follow the code." },
  { when: "Year 1", name: "Organization", note: "Every team, managed by agents." },
].map((s, i) => ({ ...s, x: STAGE_X[i] }))

// Each stage, top to bottom: its label at TOP, a 20px marker, a 4px stem through the field (12 past it at either
// end), and its note 32 under the field. The field fills what's between, so a two-line note ends on 828.
const PITCH = 20
const FIELD_TOP = 112 // from TOP
const FIELD_H = FIELD_ROWS * PITCH - 4 // 396
const NOTE_TOP = FIELD_TOP + FIELD_H + 32 // 540, ending 596 from TOP: 828
const STAGE_H = 828 - TOP

// The entrance is time passing: one stepped wipe reveals the field a column at a time, left to right, and each
// stage fades in with its stem drawing down as the sweep reaches it.
const SWEEP_AT = 100
const STEP = 10 // ms per column
const STEM = 300
const reached = (x: number) => SWEEP_AT + (stageCol(x) + 1) * STEP

export default function Timeline() {
  const name = useId()
  const { active, bind } = useReading<string>()
  const stage = STAGES.find((s) => s.name === active)

  return (
    <Frame>
      <Header
        title="From pilot to every team"
        description="Four stages, from one docs site to the whole organization."
        hint={stage ? `${stage.when}: ${stage.name}` : "Hover or focus a stage"}
        on={!!stage}
      />

      <div
        aria-hidden="true"
        className="viz-wipe absolute inset-x-0"
        style={
          {
            top: TOP + FIELD_TOP,
            height: FIELD_H,
            ...delay(SWEEP_AT, FIELD_COLS * STEP),
            "--viz-steps": FIELD_COLS,
          } as CSSProperties
        }
      >
        {FIELD.map((cells, i) => (
          <div
            key={i}
            className={cn("absolute inset-0 transition-opacity", active && active !== STAGES[i].name && "opacity-20")}
          >
            {cells.map((c) => (
              <span
                key={`${c.col}-${c.row}`}
                className={`absolute size-4 px-ramp-${c.level}`}
                style={{ left: c.col * PITCH, top: c.row * PITCH }}
              />
            ))}
          </div>
        ))}
      </div>

      <Choices legend="Choose a stage">
        {STAGES.map((s, i) => {
          const next = STAGES[i + 1]?.x ?? 1392
          const at = reached(s.x)
          const on = active === s.name
          const dim = active !== null && !on
          return (
            <Choice
              key={s.name}
              name={name}
              value={s.name}
              className="viz-fade absolute"
              style={{ top: TOP, left: s.x - 12, width: next - s.x, height: STAGE_H, ...delay(at) }}
              {...bind(s.name)}
            >
              <span className="absolute top-0 left-3 font-mono text-[12px] leading-4 font-medium text-muted-foreground uppercase">
                {s.when}
              </span>
              <span
                className={cn(
                  "absolute top-6 left-3 text-[32px] leading-10 tracking-[-0.015em] whitespace-nowrap transition-colors",
                  dim && "text-muted-foreground"
                )}
              >
                {s.name}
              </span>
              <span aria-hidden="true" className={cn("absolute top-20 left-3 transition-opacity", dim && "opacity-35")}>
                <span
                  className={cn(
                    "viz-grow-y absolute top-2 left-2 w-1 transition-colors",
                    on ? "bg-foreground" : "bg-muted-foreground"
                  )}
                  style={{ height: FIELD_H + 36, transformOrigin: "top", ...delay(at, STEM) }}
                />
                <span
                  className={cn("absolute size-5 transition-colors", on ? "bg-foreground" : "bg-muted-foreground")}
                />
              </span>
              {/* Muted, and the ink while its stage is read, as the numbers' notes do. */}
              <span
                className={cn(
                  "absolute left-3 w-[288px] text-[22px] leading-7 tracking-[-0.01em] text-pretty transition-colors",
                  on ? "text-foreground" : "text-muted-foreground"
                )}
                style={{ top: NOTE_TOP }}
              >
                {s.note}
              </span>
            </Choice>
          )
        })}
      </Choices>
    </Frame>
  )
}
