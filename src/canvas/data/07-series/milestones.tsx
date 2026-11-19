import { cn } from "@/lib/utils"
import { countAt, delay, focusRing, Frame, Header, Label, Point, Series, tickText, TOP, useReading, XAxis, YAxis } from "@/canvas/kit"

import { pct } from "../facts"
import { EVENTS, YEAR, YEAR_MONTHS, YEAR_PX, YEAR_TICKS } from "./data"

// Twelve month columns of 96 from 144 to 1296; months centre at 192 + 96i, on the 8px grid, so a point's edges land
// on 4. Values rise from the baseline at 792, 6.6px a point; May's 62% is labelled 24 right of its point, by 1368.
// An event is a 4px stem in the ink from its month's point up 160, with its name and date beside the stem's top, as
// answer-spread marks its median. The stems sit under the points, whose paper ring parts the two.
const COL = 96
const PLOT_L = 144
const PLOT_R = PLOT_L + 12 * COL
const PLOT_TOP = TOP + 32
const BASE = 792
const PAD = 12
const STEM = 160
const LAST = YEAR.length - 1
const monthX = (i: number) => PLOT_L + COL / 2 + i * COL
const y = (h: number) => BASE - h

// The entrance is the line: it draws from June to May with its light fill and the stems, and each event's name, then
// May's share, fades in as the line reaches it. The axes are structure, so they don't move.
const AT = 100
const DRAW = 700
const litAt = (i: number) => AT + countAt(i * COL, LAST * COL + 2 * PAD, DRAW)

const line = YEAR.map((m, i) => `${i ? "L" : "M"}${monthX(i)} ${y(m.h)}`).join("")
const say = (i: number) => {
  const event = EVENTS.find((e) => e.at === i)
  return `${YEAR[i].month}: ${pct(YEAR[i].share)}${event ? `, ${event.name}` : ""}`
}

export default function Milestones() {
  const { active, bind, dim } = useReading<number>()

  return (
    <Frame>
      <Header
        title="Each launch steepened the climb"
        description="Agents’ share of docs page views by month, June 2025 to May 2026."
        hint={active === null ? "Hover or focus a month" : say(active)}
        on={active !== null}
      />

      <YAxis
        name="Agents’ share of views"
        ticks={YEAR_TICKS.map((v) => ({ at: y(v * YEAR_PX), label: `${v}%` }))}
        from={PLOT_L}
        to={PLOT_R}
      />
      <Series x={monthX(0) - PAD} y={TOP} w={LAST * COL + 2 * PAD} h={BASE + PAD - TOP} at={AT} duration={DRAW}>
        <path d={`${line}V${BASE}H${monthX(0)}Z`} className="fill-viz-lead" fillOpacity={0.16} />
        {EVENTS.map((e) => (
          <path
            key={e.name}
            d={`M${monthX(e.at)} ${y(YEAR[e.at].h)}v${-STEM}`}
            strokeWidth={4}
            shapeRendering="crispEdges"
            className="stroke-foreground"
          />
        ))}
        <path
          d={line}
          fill="none"
          strokeWidth={4}
          strokeLinejoin="miter"
          shapeRendering="geometricPrecision"
          className="stroke-viz-lead"
        />
        {YEAR.map((m, i) => (
          <Point key={m.month} x={monthX(i)} y={y(m.h)} color="var(--viz-lead)" dim={dim(i)} />
        ))}
      </Series>

      {/* 160 wide, so the box ends on the grid; each name fits it in the label face. */}
      {EVENTS.map((e) => (
        <div
          key={e.name}
          aria-hidden="true"
          className={cn("viz-fade absolute w-40 transition-colors", dim(e.at) ? "text-muted-foreground" : "text-foreground")}
          style={{ left: monthX(e.at) + 12, top: y(YEAR[e.at].h) - STEM, ...delay(litAt(e.at)) }}
        >
          <Label className="text-current">{e.name}</Label>
          <p className={tickText}>{e.date}</p>
        </div>
      ))}
      <p
        aria-hidden="true"
        className={cn(
          "viz-fade absolute text-[32px] leading-10 tracking-[-0.02em] whitespace-nowrap transition-colors",
          dim(LAST) && "text-muted-foreground"
        )}
        style={{ left: monthX(LAST) + 24, top: y(YEAR[LAST].h) - 20, ...delay(litAt(LAST)) }}
      >
        {pct(YEAR[LAST].share)}
      </p>

      <XAxis y={BASE} ticks={YEAR_MONTHS.map((m, i) => ({ at: monthX(i), label: m, on: active === i }))} />
      <ul aria-label="Agents’ share of page views by month">
        {YEAR_MONTHS.map((m, i) => (
          <li
            key={m}
            tabIndex={0}
            aria-label={say(i)}
            className={cn("absolute", focusRing, "focus-visible:-outline-offset-2")}
            style={{ left: monthX(i) - COL / 2, top: PLOT_TOP, width: COL, height: BASE + 28 - PLOT_TOP }}
            {...bind(i)}
          />
        ))}
      </ul>
    </Frame>
  )
}
