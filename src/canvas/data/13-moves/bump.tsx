import { countAt, delay, focusRing, Frame, Header, note, Point, Series, TOP, useReading, XAxis, YAxis } from "@/canvas/kit"
import { cn } from "@/lib/utils"

import { ICONS } from "../08-ranks/icons"
import { BUMP, BUMP_COL, BUMP_LEAD, BUMP_MONTHS, bumpSay, bumpX, bumpY } from "./data"

// A bump chart: six months 184 apart from 176 to 1096, six rank slots 104 apart from 264 (first) to 784 (sixth), so
// the lines fill the data area down to the month ticks, which end at 820. Ranks are ticks right-aligned before 144,
// with a gridline at each. Each type is a 4px bump curve through its 16px points; its icon and name sit 24 right of
// May's point, from 1120 to 1368. Coding agents, the title's subject, is the lead and draws last, over the rest.
const PLOT_L = 144
const PAD = 12
const LAST = BUMP_MONTHS.length - 1
const BASE = 792
const LABEL_X = bumpX(LAST) + 24

// The entrance is the race: every line draws from December to May at once, so the swaps happen on screen, and each
// name fades in as the lines reach May. Axes, ticks and gridlines are read, so they don't move.
const AT = 100
const DRAW = 700
const reached = AT + countAt(LAST * BUMP_COL + PAD, LAST * BUMP_COL + 2 * PAD, DRAW)

// Quieter lines first, so the lead draws over them where they cross.
const DRAWN = [...BUMP].sort((a, b) => Number(a.name === BUMP_LEAD) - Number(b.name === BUMP_LEAD))
const color = (name: string) => (name === BUMP_LEAD ? "var(--viz-lead)" : "var(--viz-label)")

export default function Bump() {
  const { active, bind, dim } = useReading<string>()
  const on = BUMP.find((t) => t.name === active)

  return (
    <Frame>
      <Header
        title="Coding agents led from March"
        description="Agent types ranked by their agent reads each month, December to May."
        hint={on ? bumpSay(on) : "Hover or focus an agent type"}
        on={!!on}
      />

      <YAxis
        name="Rank"
        ticks={[1, 2, 3, 4, 5, 6].map((r) => ({ at: bumpY(r), label: String(r) }))}
        from={PLOT_L}
        to={bumpX(LAST) + PAD}
      />
      <XAxis y={BASE} ticks={BUMP_MONTHS.map((m, i) => ({ at: bumpX(i), label: m }))} />

      <Series x={bumpX(0) - PAD} y={TOP} w={LAST * BUMP_COL + 2 * PAD} h={bumpY(6) + PAD - TOP} at={AT} duration={DRAW}>
        {/* The read line moves to the top, so it crosses over the faded ones; keyed, so nothing remounts. */}
        {[...DRAWN].sort((a, b) => Number(a.name === active) - Number(b.name === active)).map((t) => (
          <g key={t.name}>
            <path
              d={t.d}
              fill="none"
              strokeWidth={4}
              shapeRendering="geometricPrecision"
              className={cn(
                "transition-opacity",
                t.name === BUMP_LEAD ? "stroke-viz-lead" : "stroke-viz-label",
                dim(t.name) && "opacity-30"
              )}
            />
            {t.pts.map(([x, y]) => (
              <Point key={x} x={x} y={y} color={color(t.name)} dim={dim(t.name)} />
            ))}
          </g>
        ))}
      </Series>

      {/* Each type reads from its end label: its icon and name, centred on May's point, 32 tall so its box is on 4. */}
      <ul aria-label="Agent types by rank in agent reads, December and May">
        {BUMP.map((t) => {
          const Icon = ICONS[t.name]
          return (
            <li
              key={t.name}
              tabIndex={0}
              aria-label={bumpSay(t)}
              className={cn(
                "viz-fade absolute flex h-8 items-center gap-3 transition-colors",
                focusRing,
                "focus-visible:outline-offset-2",
                dim(t.name) && "text-muted-foreground"
              )}
              style={{ left: LABEL_X, top: bumpY(t.ranks[LAST]) - 16, width: 1368 - LABEL_X, ...delay(reached) }}
              {...bind(t.name)}
            >
              <Icon size={24} aria-hidden="true" className="shrink-0" />
              <span aria-hidden="true" className={cn(note, "leading-8 font-medium")}>
                {t.name}
              </span>
            </li>
          )
        })}
      </ul>
    </Frame>
  )
}
