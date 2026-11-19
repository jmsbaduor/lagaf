import { band, CountUp, Fill, focusRing, Frame, Header, Label, note, row, Rule, TOP, useReading } from "@/canvas/kit"
import { cn } from "@/lib/utils"

import { AGENT_READS, LEAD_TRACK, LEADERS, share } from "./data"
import { ICONS } from "./icons"

// The top three are cards across the content width (3 of 416, 24 apart), 332 tall from TOP to 564. The rest are a
// ruled table 48 under them, three rows of 72 that end on 828. Every bar's track is 368 wide for all agent reads: a
// card's width inside its 24px padding, and in the table the same column as the third card's bar.
const CARD_H = 332
const TABLE_TOP = TOP + CARD_H + 48

// The entrance is the ranking: each bar grows from its left edge while its share counts, in rank order and in
// shrinking steps, so the podium and the table land as one wave. Ranks, icons and names are read, so they don't move.
const GROW = 600
const AT = [100, 160, 200, 230, 250, 260]

const rank = (n: number) => String(n).padStart(2, "0")
const reading = (t: (typeof LEADERS)[number]) => `${t.name}: ${share(t.share)} of agent reads`

export default function Leaderboard() {
  const { active, bind, dim } = useReading<string>()
  const on = LEADERS.find((t) => t.name === active)

  return (
    <Frame>
      <Header
        title="Coding agents lead agent reads"
        description={`Agent types ranked by their share of May’s ${AGENT_READS}M agent reads.`}
        hint={on ? reading(on) : "Hover or focus an agent type"}
        on={!!on}
      />

      {/* The leader is the lead colour; second and third are the track. A card that isn't read turns to the track
          with the muted ink, which reads on it (4.5:1), and fades its bar. */}
      <ol aria-label="Top three agent types" className="absolute left-[72px] flex gap-6" style={{ top: TOP }}>
        {LEADERS.slice(0, 3).map((t, i) => {
          const Icon = ICONS[t.name]
          // The leader keeps the lead colour unless another card or row is read.
          const lead = i === 0 && !dim(t.name)
          return (
            <li
              key={t.name}
              tabIndex={0}
              aria-label={reading(t)}
              className={cn(
                "flex w-[416px] flex-col p-6 transition-colors",
                focusRing,
                lead ? "bg-viz-lead text-viz-lead-ink" : "bg-viz-track",
                !lead && (dim(t.name) ? "text-muted-foreground" : "text-foreground")
              )}
              style={{ height: CARD_H }}
              {...bind(t.name)}
            >
              <div aria-hidden="true" className="flex items-center justify-between">
                <Label className="text-current">{rank(t.rank)}</Label>
                <Icon size={32} />
              </div>
              <p aria-hidden="true" className={cn(note, "mt-4 font-medium")}>
                {t.name}
              </p>
              {/* Pulled 4px left by its indent (the digits' side bearing), so the ink starts on the bar's edge. */}
              <p aria-hidden="true" className="mt-auto -indent-1 text-[96px] leading-24 font-medium tracking-[-0.04em]">
                <CountUp value={t.share} delay={AT[i]} duration={GROW} format={share} />
              </p>
              {/* On the lead, the bar is its ink on a 20% track; on the track, the row's grey on the paper. */}
              <div
                aria-hidden="true"
                className={cn("relative mt-6 h-4 transition-colors", lead ? "bg-current/20" : "bg-background")}
                style={{ width: LEAD_TRACK }}
              >
                <Fill
                  size={t.w}
                  at={AT[i]}
                  duration={GROW}
                  className={cn(
                    "transition-[background-color,opacity]",
                    lead ? "bg-current" : "bg-viz-label",
                    dim(t.name) && "opacity-30"
                  )}
                />
              </div>
            </li>
          )
        })}
      </ol>

      {/* Rank, icon and name from the left; the share right-aligned on the second card's right edge (928); the bar
          under the third card's, from 976 to 1344. */}
      <ol
        start={4}
        aria-label="The other agent types"
        className="absolute left-[72px] w-[1296px]"
        style={{ top: TABLE_TOP }}
      >
        {LEADERS.slice(3).map((t, j) => {
          const i = j + 3
          const Icon = ICONS[t.name]
          return (
            <li
              key={t.name}
              tabIndex={0}
              aria-label={reading(t)}
              className={cn(row, "flex h-18 items-center pr-6 transition-colors", dim(t.name) && "text-muted-foreground")}
              {...bind(t.name)}
            >
              <span aria-hidden="true" className={band} />
              {j === 0 && <Rule at={AT[i]} duration={GROW} className="top-0 bottom-auto" />}
              <Rule at={AT[i]} duration={GROW} />
              <Label aria-hidden="true" className={cn("w-12 transition-colors", dim(t.name) && "text-current")}>
                {rank(t.rank)}
              </Label>
              <Icon size={24} className="shrink-0" />
              <p aria-hidden="true" className={cn(note, "ml-4 flex-1 leading-8 font-medium")}>
                {t.name}
              </p>
              <p aria-hidden="true" className="w-28 text-right text-[32px] leading-10 tracking-[-0.02em]">
                <CountUp value={t.share} delay={AT[i]} duration={GROW} format={share} />
              </p>
              <div aria-hidden="true" className="relative ml-12 h-4 bg-viz-track" style={{ width: LEAD_TRACK }}>
                <Fill
                  size={t.w}
                  at={AT[i]}
                  duration={GROW}
                  className={cn("bg-viz-label transition-opacity", dim(t.name) && "opacity-30")}
                />
              </div>
            </li>
          )
        })}
      </ol>
    </Frame>
  )
}
