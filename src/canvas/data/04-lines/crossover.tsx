import { Frame, Header, Key, TOP, useReading } from "@/canvas/kit"

import { LAST, millions, MONTHS, VIEWS, VIEWS_TICKS } from "./data"
import { EndLabel, Line, Months, Points, Series, Ticks } from "./parts"

// Two lines, not a stack: stacked, agents would ride on people's band and the overtake would hide in a thickness.
// On one scale, people hold flat and agents climb through them between March and April.
// The entrance draws both lines together, month by month, so agents pass people on screen in April. People go
// first, so agents (the lead) draw over them where they cross.
const AT = 100
const DRAW = 700

const SERIES = [
  { name: "Agents", color: "var(--viz-lead)", stroke: "stroke-viz-lead", heights: VIEWS.map((m) => m.agentsH), key: "agents" },
  { name: "People", color: "var(--viz-contrast)", stroke: "stroke-viz-contrast", heights: VIEWS.map((m) => m.peopleH), key: "people" },
] as const

const say = (i: number) => `${VIEWS[i].month}: ${millions(VIEWS[i].agents)} agents, ${millions(VIEWS[i].people)} people`

export default function Crossover() {
  const reading = useReading<number>()
  const { active, dim } = reading

  return (
    <Frame>
      <Header
        title="Agents passed people in April"
        description="Monthly page views: agents grew 9× while people held level."
        hint={active === null ? "Hover or focus a month" : say(active)}
        on={active !== null}
      />

      <Months name="Page views by month, agents and people" months={MONTHS} say={say} reading={reading} />
      <Ticks ticks={VIEWS_TICKS} />
      <div aria-hidden="true" className="pointer-events-none absolute left-[144px] grid grid-cols-[repeat(2,96px)] gap-8" style={{ top: TOP }}>
        {SERIES.map((s) => (
          <Key key={s.name} color={s.color}>
            {s.name}
          </Key>
        ))}
      </div>
      <Series count={MONTHS.length} at={AT} duration={DRAW}>
        {[...SERIES].reverse().map((s) => (
          <g key={s.name}>
            <Line heights={s.heights} className={s.stroke} />
            <Points heights={s.heights} color={s.color} dim={dim} />
          </g>
        ))}
      </Series>
      {SERIES.map((s) => (
        <EndLabel key={s.name} h={s.heights[LAST]} count={MONTHS.length} at={AT} duration={DRAW} dim={dim(LAST)}>
          {millions(VIEWS[LAST][s.key])}
        </EndLabel>
      ))}
    </Frame>
  )
}
