import { useId, useState } from "react"

import { countAt, CountUp, delay, Frame, Header, TOP, useReading } from "@/canvas/kit"
import { cn } from "@/lib/utils"

import { DOTS, litDots, TEAM_SHARES } from "../facts"
import { Choice, Choices, px } from "./parts"

const STATS = [
  {
    id: "draft",
    value: TEAM_SHARES.draft,
    line: "of teams use agents to draft docs",
    text: "text-viz-lead",
    color: "var(--viz-lead)",
  },
  {
    id: "publish",
    value: TEAM_SHARES.publish,
    line: "allow publishing without human review",
    text: "text-viz-alert",
    color: "var(--viz-alert)",
  },
]

// Six by four dots of 116 on a 160 pitch fill the data area, TOP to 828, on the right. Each share's number sits on
// a dot row (the first and the third), its 112px line centred on the row's dots.
const COLS = 6
const DOT = 116
const PITCH = 160
const GRID_W = COLS * PITCH - (PITCH - DOT) // 916

// The entrance is the fill: the empty dots are there, then the lit ones fill in reading order as both numbers count,
// each dot starting as the first count passes it. Picking or hovering a share relights the dots in 150ms, a 2ms
// ripple across the grid.
const FILL_AT = 100
const COUNT = 700
const FILL = 160
const FIRST_LIT = litDots(TEAM_SHARES.draft) // fixed, so a later pick never retimes the entrance

export default function DotMatrix() {
  const name = useId()
  const [picked, setPicked] = useState("draft")
  const { active, bind } = useReading<string>()
  const stat = STATS.find((s) => s.id === (active ?? picked)) ?? STATS[0]
  const lit = litDots(stat.value)
  const exact = (lit / DOTS) * 100 === stat.value
  const said = `${stat.value}% ${stat.line}: ${lit} of ${DOTS} dots${exact ? "" : ", rounded"}.`

  return (
    <Frame>
      <Header
        title="How teams use agents on docs"
        description="Teams that draft docs with agents, and that publish without review."
        hint={active ? `${stat.value}%: ${lit} of ${DOTS} dots` : "Hover or focus a share"}
        on={!!active}
      />

      {/* The shown share in its colour, the other muted (4.5:1 on the paper, so it still reads). */}
      <Choices legend="Show a share on the dots">
        {STATS.map((s, i) => {
          const on = stat.id === s.id
          return (
            <Choice
              key={s.id}
              name={name}
              value={s.id}
              checked={picked === s.id}
              onPick={setPicked}
              // At its dot row less the choice's 12px padding, 72 to 404, 48 clear of the dots.
              className="absolute left-[60px] block w-[356px] p-3"
              style={{ top: TOP - 12 + i * 2 * PITCH }}
              {...bind(s.id)}
            >
              <span
                className={cn(
                  "-ml-1 block font-data text-[112px] leading-[112px] font-medium tracking-[-0.04em] transition-colors",
                  on ? s.text : "text-muted-foreground"
                )}
              >
                <CountUp value={s.value} delay={FILL_AT} duration={COUNT} format={(n) => `${Math.round(n)}%`} />
              </span>
              {/* 220 wide, about the number's width, so each line breaks at its phrase: "of teams use agents / to
                  draft docs" (226 would keep "to" up), "allow publishing / without human review" (218 fits). */}
              <span
                className={cn(
                  "mt-3 block w-[220px] text-[22px] leading-7 tracking-[-0.01em] transition-colors",
                  on ? "text-foreground" : "text-muted-foreground"
                )}
              >
                {s.line}
              </span>
            </Choice>
          )
        })}
      </Choices>

      <div
        role="img"
        aria-label={`Dot matrix of ${DOTS} dots. ${said}`}
        className="absolute right-[72px] grid"
        style={{ top: TOP, width: GRID_W, gridTemplateColumns: `repeat(${COLS}, ${DOT}px)`, gap: PITCH - DOT }}
      >
        {Array.from({ length: DOTS }, (_, i) => (
          // An empty dot with its fill fading in on top; the fill's colour is what a pick changes.
          <span key={i} className="rounded-full bg-viz-track" style={{ width: DOT, height: DOT }}>
            <span
              className="px-cell viz-fade block size-full rounded-full"
              style={{
                ...px(i < lit ? stat.color : "var(--viz-track)"),
                ...delay(FILL_AT + countAt(i, FIRST_LIT, COUNT), FILL),
                transitionDelay: `${i * 2}ms`,
              }}
            />
          </span>
        ))}
      </div>
    </Frame>
  )
}
