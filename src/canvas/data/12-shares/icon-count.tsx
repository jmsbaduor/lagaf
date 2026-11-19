import { IconPeople } from "central-icons/IconPeople"
import { IconRobot } from "central-icons/IconRobot"
import { useId } from "react"

import { Choice, Choices, countAt, CountUp, delay, Frame, Header, Key, TOP, useReading } from "@/canvas/kit"
import { cn } from "@/lib/utils"

import {
  ICON_COUNT,
  ICON_COUNT_BOX,
  ICON_COUNT_COLS,
  ICON_COUNT_GLYPH,
  ICON_COUNT_ICONS,
  iconCountReading,
} from "./data"

// Agents are the lead; people are the quieter mono-label grey, which still reads at 4.5:1 on the paper.
const STYLE = {
  agents: { Icon: IconRobot, text: "text-viz-lead", color: "var(--viz-lead)" },
  people: { Icon: IconPeople, text: "text-viz-label", color: "var(--viz-label)" },
} as const
const COUNTS = { agents: ICON_COUNT[0].icons, people: ICON_COUNT[1].icons }

// Four rows of twelve 108px boxes, edge to edge, fill 72 to 1368 from TOP to 664; each glyph draws at 96, 6 in. The
// readouts sit 48 under the grid, each from its first icon's column (0 and 6), and end at 816.
const INSET = (ICON_COUNT_BOX - ICON_COUNT_GLYPH) / 2
const READOUT_TOP = TOP + 4 * ICON_COUNT_BOX + 48

// The entrance is the count: the 48 empty icons are there, then each group's icons fill in reading order as its
// number counts, each icon starting as its count passes it, so the icons and the numbers settle together. Picking or
// hovering a share fades the other group's icons in 150ms.
const FILL_AT = 100
const COUNT = 800
const FILL = 160

export default function IconCount() {
  const name = useId()
  const { active, bind, dim } = useReading<string>()
  const read = ICON_COUNT.find((g) => g.id === active)

  return (
    <Frame>
      <Header
        title="Agents outnumber people 30 to 18"
        description="May’s 48M page views as 48 icons, one for each million."
        hint={read ? iconCountReading(read) : "Hover or focus a share"}
        on={!!read}
      />

      <div
        role="img"
        aria-label={`${ICON_COUNT_ICONS.length} icons, one for each million May page views: ${ICON_COUNT.map((g) => `${g.icons} ${g.label.toLowerCase()}`).join(", then ")}.`}
        className="absolute left-[72px] grid"
        style={{ top: TOP, gridTemplateColumns: `repeat(${ICON_COUNT_COLS}, ${ICON_COUNT_BOX}px)`, gridAutoRows: ICON_COUNT_BOX }}
      >
        {ICON_COUNT_ICONS.map((c, k) => {
          const { Icon, text } = STYLE[c.id]
          return (
            <span key={k} className="relative">
              <Icon size={ICON_COUNT_GLYPH} className="absolute text-viz-track" style={{ left: INSET, top: INSET }} />
              <span
                className="viz-fade absolute inset-0"
                style={delay(FILL_AT + countAt(c.i, COUNTS[c.id], COUNT), FILL)}
              >
                <Icon
                  size={ICON_COUNT_GLYPH}
                  className={cn("absolute transition-opacity", text, dim(c.id) && "opacity-30")}
                  style={{ left: INSET, top: INSET }}
                />
              </span>
            </span>
          )
        })}
      </div>

      <Choices legend="Light a share">
        {ICON_COUNT.map((g, i) => (
          <Choice
            key={g.id}
            name={name}
            value={g.id}
            // Its content from its group's first column, less the choice's 12px padding: the agents' to 672, 48 clear
            // of the people's, and the people's to the grid's right edge, 1368.
            className="group absolute block p-3"
            style={{ left: 60 + i * 6 * ICON_COUNT_BOX, top: READOUT_TOP - 12, width: i ? 672 : 624 }}
            {...bind(g.id)}
          >
            <Key color={STYLE[g.id].color}>
              <span
                className={cn(
                  "text-muted-foreground transition-colors group-hover:text-foreground",
                  active === g.id && "text-foreground"
                )}
              >
                {g.label}
              </span>
              <span className={cn("ml-auto transition-colors", dim(g.id) && "text-muted-foreground")}>
                {g.views}M views
              </span>
            </Key>
            {/* One 80px line: the word runs inline at 36 with no leading of its own, so the line stays 80 tall. */}
            <span
              className={cn(
                "mt-2 block -indent-1 font-heading text-[80px] leading-20 font-medium tracking-[-0.03em] transition-colors",
                dim(g.id) && "text-muted-foreground"
              )}
            >
              <CountUp value={g.icons} delay={FILL_AT} duration={COUNT} format={(n) => `${Math.round(n)}M`} />
              <span className="ml-4 text-[36px] leading-none font-normal tracking-[-0.025em]">
                {g.label.toLowerCase()}
              </span>
            </span>
          </Choice>
        ))}
      </Choices>
    </Frame>
  )
}
