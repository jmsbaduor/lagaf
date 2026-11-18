import { Frame, Header, useReading } from "@/canvas/kit"

import { pct } from "../facts"
import { LAST, millions, MONTHS, SHARE, SHARE_TICKS } from "./data"
import { EndLabel, Line, Months, Points, Series, Ticks } from "./parts"

// The entrance is the line: it draws from December to May, lighting each month as it reaches it, and May's share
// fades in as the line arrives. The axis and month names are structure, so they don't move.
const AT = 100
const DRAW = 700

const heights = SHARE.map((m) => m.h)
const say = (i: number) => {
  const m = SHARE[i]
  return `${m.month}: ${pct(m.share)}, ${millions(m.agents)} agents, ${millions(m.people)} people`
}

export default function AgentShare() {
  const reading = useReading<number>()
  const { active, dim } = reading

  return (
    <Frame>
      <Header
        title={`Agents went from ${pct(SHARE[0].share)} to ${pct(SHARE[LAST].share)}`}
        description="Agents’ share of monthly docs page views, December to May."
        hint={active === null ? "Hover or focus a month" : say(active)}
        on={active !== null}
      />

      <Months name="Agent share of page views by month" months={MONTHS} say={say} reading={reading} />
      <Ticks ticks={SHARE_TICKS} />
      <Series count={MONTHS.length} at={AT} duration={DRAW}>
        <Line heights={heights} className="stroke-viz-lead" />
        <Points heights={heights} color="var(--viz-lead)" dim={dim} />
      </Series>
      <EndLabel h={SHARE[LAST].h} count={MONTHS.length} at={AT} duration={DRAW} dim={dim(LAST)}>
        {pct(SHARE[LAST].share)}
      </EndLabel>
    </Frame>
  )
}
