import { useId, type CSSProperties } from "react"

import { delay, Frame, Header, TOP, useReading } from "@/canvas/kit"
import { cn } from "@/lib/utils"

import { agentCols, READER_COLS, READERS } from "../facts"
import { Choice, Choices, labelText } from "./parts"

// Columns of three 12px cells on a 16px pitch, people first, as in the deck. Every bar has the same 50 columns.
// Rows of 108 hold a 44px bar 32 from their top, so bars and names land on the 4px grid; five rows run to 804.
const ROWS = 3
const ROW_H = 108
const ROWS_TOP = TOP + 32 // under the key

// The entrance builds each bar left to right a column at a time (one stepped wipe per bar, not one animation per
// cell), bars in shrinking steps down the chart; each share fades in as its bar completes.
const WIPE = 500
const AT = [100, 180, 240, 280, 310]

export default function WhoReads() {
  const name = useId()
  const { active, bind } = useReading<string>()
  const source = READERS.find((s) => s.name === active)

  return (
    <Frame>
      <Header
        title="Who reads what"
        description="Each bar splits a source’s readers into people and agents."
        hint={
          source
            ? `${source.name}: ${source.agents}% agents, ${100 - source.agents}% people`
            : "Hover or focus a source"
        }
        on={!!source}
      />

      <div
        aria-hidden="true"
        className="absolute left-[328px] grid grid-cols-[repeat(2,96px)] gap-8"
        style={{ top: TOP }}
      >
        <Key className="bg-viz-label">People</Key>
        <Key className="bg-viz-lead">Agents</Key>
      </div>

      {/* A source that isn't read fades its bar; its words turn muted, so they still read at 4.5:1. */}
      <Choices legend="Show a source's split">
        {READERS.map((s, r) => {
          const agents = agentCols(s.agents)
          const dim = active !== null && active !== s.name
          return (
            <Choice
              key={s.name}
              name={name}
              value={s.name}
              // Rows tile the chart's height, so moving between them never drops the hover.
              className="absolute left-[60px] flex w-[1320px] items-center px-3"
              style={{ top: ROWS_TOP + r * ROW_H, height: ROW_H }}
              {...bind(s.name)}
            >
              <span
                className={cn(
                  labelText,
                  "w-[256px] shrink-0 leading-5 font-semibold transition-colors",
                  dim && "text-muted-foreground"
                )}
              >
                {s.name}
                <span className="sr-only">
                  : {100 - s.agents}% people, {s.agents}% agents
                </span>
              </span>
              <span aria-hidden="true" className={cn("transition-opacity", dim && "opacity-30")}>
                <span
                  className="viz-wipe grid auto-cols-[12px] grid-flow-col grid-rows-[repeat(3,12px)] gap-1"
                  style={{ ...delay(AT[r], WIPE), "--viz-steps": READER_COLS } as CSSProperties}
                >
                  {Array.from({ length: READER_COLS * ROWS }, (_, k) => (
                    <span
                      key={k}
                      className={Math.floor(k / ROWS) < READER_COLS - agents ? "bg-viz-label" : "bg-viz-lead"}
                    />
                  ))}
                </span>
              </span>
              {/* Two fixed columns, so the people share starts on a whole pixel. */}
              <span
                aria-hidden="true"
                className={cn(
                  "viz-fade ml-4 flex flex-1 gap-4 font-mono text-[12px] leading-5 font-medium whitespace-nowrap uppercase transition-colors",
                  dim && "text-muted-foreground"
                )}
                style={delay(AT[r] + WIPE - 100)}
              >
                <span className="w-20">{s.agents}% agents</span>
                <span
                  className={cn(
                    "text-muted-foreground transition-opacity",
                    active === s.name ? "opacity-100" : "opacity-0"
                  )}
                >
                  {100 - s.agents}% people
                </span>
              </span>
            </Choice>
          )
        })}
      </Choices>
    </Frame>
  )
}

/** A key entry: the swatch and its name, 12px apart, as in the waffle's key. */
function Key({ className, children }: { className: string; children: string }) {
  return (
    <span className={cn(labelText, "flex items-center gap-3")}>
      <span className={cn("size-4 shrink-0", className)} />
      {children}
    </span>
  )
}
