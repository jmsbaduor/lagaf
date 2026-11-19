import { band, CountUp, delay, Frame, Header, inkEnd, Key, row, tickText, TOP, useReading } from "@/canvas/kit"
import { cn } from "@/lib/utils"

import {
  BUTTERFLY,
  BUTTERFLY_DESCRIPTION,
  BUTTERFLY_SIDE,
  BUTTERFLY_TITLE,
  BUTTERFLY_TOTAL,
  butterflyMonth,
  butterflyReading,
} from "./data"

// Across: people's side 600 (72 to 672), the hour column 96 (672 to 768), agents' side 600 (768 to 1368), one scale
// both ways. Down: each side's key on TOP and its May total under it (256 to 328), then 24 rows of 16px bars on a
// 20px pitch from 352, so the last bar ends on 824.
const ROWS_Y = 352
const NUMBER_Y = TOP + 24

// People are the compared series, agents the lead, as everywhere else.
const COLOR = { people: "bg-viz-contrast", agents: "bg-viz-lead" }

// The entrance is the day: each hour's bars grow out from the hour column, top to bottom in one wave whose steps
// shrink, while the totals count. Keys and hours are read, so they don't move.
const GROW = 600
const at = (i: number) => 100 + Math.round(300 * (1 - (1 - i / (BUTTERFLY.length - 1)) ** 2))
const COUNT = 900

export default function Butterfly() {
  const { active, bind, dim } = useReading<number>()
  const on = active === null ? null : BUTTERFLY[active]

  return (
    <Frame>
      <Header
        title={BUTTERFLY_TITLE}
        description={BUTTERFLY_DESCRIPTION}
        hint={on ? butterflyReading(on) : "Hover or focus an hour"}
        on={!!on}
      />

      <Side name="People" color="var(--viz-contrast)" total={BUTTERFLY_TOTAL.people} />
      <Side name="Agents" color="var(--viz-lead)" total={BUTTERFLY_TOTAL.agents} end />

      <ol
        aria-label="May’s reads by hour of day"
        className="absolute left-[72px] flex w-[1296px] flex-col gap-1"
        style={{ top: ROWS_Y }}
      >
        {BUTTERFLY.map((h, i) => (
          <li
            key={h.hour}
            tabIndex={0}
            aria-label={butterflyReading(h)}
            // The hit area runs on 4px into the gap below, so moving down the rows never drops a reading.
            className={cn(row, "flex h-4 before:absolute before:inset-x-0 before:top-0 before:-bottom-1")}
            {...bind(i)}
          >
            <span aria-hidden="true" className={band} />
            <div aria-hidden="true" className="relative h-4" style={{ width: BUTTERFLY_SIDE }}>
              <div
                className={cn("viz-grow-x absolute inset-y-0 right-0 transition-opacity", COLOR.people, dim(i) && "opacity-30")}
                style={{ width: h.peopleW, transformOrigin: "right center", ...delay(at(i), GROW) }}
              />
            </div>
            <p
              aria-hidden="true"
              className={cn(tickText, "w-24 text-center transition-colors", active === i && "text-foreground")}
            >
              {h.name.slice(0, 2)}
            </p>
            <div aria-hidden="true" className="relative h-4" style={{ width: BUTTERFLY_SIDE }}>
              <div
                className={cn("viz-grow-x absolute inset-y-0 left-0 transition-opacity", COLOR.agents, dim(i) && "opacity-30")}
                style={{ width: h.agentsW, ...delay(at(i), GROW) }}
              />
            </div>
          </li>
        ))}
      </ol>
    </Frame>
  )
}

/**
 * A side's key on TOP and its May total under it, as a big number, at the content's top corner. The right side
 * mirrors: swatch on the edge, number set right with its "M" ending on it; the left's ink starts on the edge.
 */
function Side({ name, color, total, end = false }: { name: string; color: string; total: number; end?: boolean }) {
  return (
    <div
      className={cn("absolute flex w-[352px] flex-col", end ? "right-[72px] text-right [&>span]:flex-row-reverse" : "left-[72px]")}
      style={{ top: TOP }}
    >
      <Key color={color}>{name}</Key>
      <p
        className={cn("font-heading text-[72px] leading-[72px] tracking-[-0.04em]", !end && "-indent-1")}
        style={{ marginTop: NUMBER_Y - TOP - 16 }}
      >
        <CountUp
          value={total}
          delay={100}
          duration={COUNT}
          format={butterflyMonth}
          className={end ? inkEnd(butterflyMonth(total)) : undefined}
        />
      </p>
    </div>
  )
}
