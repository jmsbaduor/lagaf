import { useId } from "react"

import { countAt, CountUp, delay, Frame, Header, TOP, useReading } from "@/canvas/kit"
import { cn } from "@/lib/utils"

import { MARKDOWN_SHARE, WAFFLE } from "../facts"
import { Choice, Choices, labelText, px } from "./parts"

const KEYS = [
  { id: "on", label: "Markdown or llms.txt", share: MARKDOWN_SHARE, color: "var(--viz-lead)" },
  { id: "off", label: "Rendered HTML", share: 100 - MARKDOWN_SHARE, color: "var(--viz-track)" },
]

// The entrance is the fill: the empty grid is there, then the 83 cells fill in reading order as the number counts
// to 83, each cell starting as the count passes it, so the fill and the count settle together. Text and the key are
// read, so they don't move.
const FILL_AT = 100
const COUNT = 900
const CELL = 160
const ORDER = WAFFLE.map((on, i) => (on ? WAFFLE.slice(0, i).filter(Boolean).length : -1))

export default function Waffle() {
  const name = useId()
  const { active, bind } = useReading<string>()
  const key = KEYS.find((k) => k.id === active)
  const dim = (id: string) => (active && active !== id ? "" : undefined)

  return (
    <Frame>
      <Header
        title="Where agent traffic goes"
        description="Each cell is one percent of agent traffic, by the format it reads."
        hint={key ? `${key.label}: ${key.share}%` : "Hover or focus a share"}
        on={!!key}
      />

      <div className="absolute left-[72px] w-[560px]" style={{ top: TOP }}>
        {/* A 128px line puts the digits' tops on TOP, level with the grid's; the statement keeps its 56px gap. */}
        <p className="-ml-2 font-data text-[180px] leading-[128px] font-medium tracking-[-0.05em]">
          <CountUp value={MARKDOWN_SHARE} delay={FILL_AT} duration={COUNT} format={(n) => `${Math.round(n)}%`} />
        </p>
        <p className="mt-12 w-[504px] text-[36px] leading-10 tracking-[-0.025em] text-pretty">
          of agent traffic goes straight to Markdown or llms.txt
        </p>
      </div>

      <Choices legend="Highlight a share" className="absolute top-[764px] left-[60px] flex w-[400px] flex-col">
        {KEYS.map((k) => (
          <Choice
            key={k.id}
            name={name}
            value={k.id}
            className="group flex items-center gap-3 px-3 py-2"
            {...bind(k.id)}
          >
            <span aria-hidden="true" className="px-cell size-4 shrink-0" style={px(k.color)} />
            <span
              className={cn(
                labelText,
                "text-muted-foreground transition-colors group-hover:text-foreground",
                active === k.id && "text-foreground"
              )}
            >
              {k.label}
            </span>
            <span className={cn(labelText, "ml-auto")}>{k.share}%</span>
          </Choice>
        ))}
      </Choices>

      <div
        role="img"
        aria-label={`Waffle chart of 100 cells: ${MARKDOWN_SHARE} are Markdown or llms.txt, ${100 - MARKDOWN_SHARE} are rendered HTML.`}
        className="absolute left-[772px] grid grid-cols-[repeat(10,56px)] gap-1"
        style={{ top: TOP }}
      >
        {WAFFLE.map((on, i) =>
          on ? (
            // A lit cell is an empty one with its fill fading in on top.
            <span key={i} className="size-14 bg-viz-track">
              <span
                data-dim={dim("on")}
                className="px-cell viz-fade block size-full"
                style={{ ...px(KEYS[0].color), ...delay(FILL_AT + countAt(ORDER[i], MARKDOWN_SHARE, COUNT), CELL) }}
              />
            </span>
          ) : (
            <span key={i} data-dim={dim("off")} className="px-cell size-14" style={px(KEYS[1].color)} />
          )
        )}
      </div>
    </Frame>
  )
}
