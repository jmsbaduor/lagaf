import { Frame, Header, useReading } from "@/canvas/kit"

import { sec } from "../facts"
import { ANSWER, ANSWER_TICKS, LAST, MONTHS } from "./data"
import { EndLabel, Line, Months, Points, Series, Ticks } from "./parts"

// A step line: each month's median is one figure for the whole month, so it holds flat across its column and
// drops at the month's edge. The entrance draws it from December to May; May's 0.8s fades in as it arrives.
const AT = 100
const DRAW = 700

const heights = ANSWER.map((m) => m.h)
const say = (i: number) => `${ANSWER[i].month}: ${sec(ANSWER[i].time)}`

export default function AnswerTime() {
  const reading = useReading<number>()
  const { active, dim } = reading

  return (
    <Frame>
      <Header
        title={`Answer time fell to ${sec(ANSWER[LAST].time)}`}
        description="Median time for an agent to reach an answer, by month."
        hint={active === null ? "Hover or focus a month" : say(active)}
        on={active !== null}
      />

      <Months name="Median answer time by month" months={MONTHS} say={say} reading={reading} />
      <Ticks ticks={ANSWER_TICKS} />
      <Series count={MONTHS.length} at={AT} duration={DRAW}>
        <Line heights={heights} step className="stroke-viz-lead" />
        <Points heights={heights} color="var(--viz-lead)" dim={dim} />
      </Series>
      <EndLabel h={ANSWER[LAST].h} count={MONTHS.length} at={AT} duration={DRAW} dim={dim(LAST)}>
        {sec(ANSWER[LAST].time)}
      </EndLabel>
    </Frame>
  )
}
