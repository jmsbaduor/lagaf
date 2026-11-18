import { useId } from "react"

import { Cell, Choice, Choices, countAt, CountUp, Frame, Header, Key, TOP, useReading } from "@/canvas/kit"
import { cn } from "@/lib/utils"

import { MARKDOWN_SHARE, WAFFLE } from "../facts"

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
  const { active, bind, dim } = useReading<string>()
  const key = KEYS.find((k) => k.id === active)

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
            className="group block px-3 py-2"
            {...bind(k.id)}
          >
            <Key color={k.color}>
              <span
                className={cn(
                  "text-muted-foreground transition-colors group-hover:text-foreground",
                  active === k.id && "text-foreground"
                )}
              >
                {k.label}
              </span>
              <span className="ml-auto">{k.share}%</span>
            </Key>
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
            <Cell
              key={i}
              color={KEYS[0].color}
              at={FILL_AT + countAt(ORDER[i], MARKDOWN_SHARE, COUNT)}
              duration={CELL}
              dim={dim("on")}
              className="size-14"
            />
          ) : (
            <Cell key={i} color={KEYS[1].color} dim={dim("off")} className="size-14" />
          )
        )}
      </div>
    </Frame>
  )
}
