import { IconAgentNetwork } from "central-icons/IconAgentNetwork"

import { band, CountUp, Fill, Frame, Header, Label, note, row, Rule, TOP, useReading } from "@/canvas/kit"
import { cn } from "@/lib/utils"

import { TRAFFIC } from "../facts"
import { ALL_AGENTS, ALL_TRACK, READ_BY, share } from "./data"
import { ICONS } from "./icons"

// Seven ranked rows of 72 from TOP (to 736), then the agents together in one more row on 828, 20 under them, ruled
// in the ink as a total. Across: rank 48, icon 24, 16, name 248, 24, track 800 (8px a point of all reads), 24, share
// 112 right-aligned on the content's right edge.
const ROW_H = 72
const TOTAL_TOP = 828 - ROW_H

// The entrance is the ranking: each bar grows from its left edge while its share counts, in rank order and in
// shrinking steps; the agents' bar grows last, as their sum. Ranks, icons and names are read, so they don't move.
const GROW = 600
const AT = [100, 160, 200, 230, 250, 260, 270]
const TOTAL_AT = 330

const rank = (n: number) => String(n).padStart(2, "0")
const reading = (r: { name: string; share: number }) => `${r.name}: ${share(r.share)} of all reads`

export default function AllReaders() {
  const { active, bind } = useReading<string>()
  // Reading the agents together keeps every agent row and fades only people.
  const dim = (name: string) =>
    active !== null && active !== name && !(active === ALL_AGENTS.name && name !== "People")
  const on = active === ALL_AGENTS.name ? ALL_AGENTS : READ_BY.find((r) => r.name === active)

  return (
    <Frame>
      <Header
        title="People are the top reader type"
        description={`Agents make ${TRAFFIC.agentShare.format(ALL_AGENTS.share)} of May’s reads, yet no one agent type reads as much as people.`}
        hint={on ? reading(on) : "Hover or focus a reader type"}
        on={!!on}
      />

      {/* People are the lead colour; every agent type is the neutral label grey. */}
      <ol aria-label="Reader types by share of all reads" className="absolute left-[72px] w-[1296px]" style={{ top: TOP }}>
        {READ_BY.map((r, i) => (
          <Reader
            key={r.name}
            name={r.name}
            rank={rank(r.rank)}
            Icon={ICONS[r.name]}
            share={r.share}
            w={r.w}
            fill={r.people ? "bg-viz-lead" : "bg-viz-label"}
            at={AT[i]}
            first={i === 0}
            dim={dim(r.name)}
            bind={bind(r.name)}
          />
        ))}
      </ol>

      <div className="absolute left-[72px] w-[1296px]" style={{ top: TOTAL_TOP }}>
        <Reader
          name={ALL_AGENTS.name}
          Icon={IconAgentNetwork}
          share={ALL_AGENTS.share}
          w={ALL_AGENTS.w}
          fill="bg-viz-label"
          at={TOTAL_AT}
          total
          dim={dim(ALL_AGENTS.name)}
          bind={bind(ALL_AGENTS.name)}
        />
      </div>
    </Frame>
  )
}

/** One ruled row: rank, icon and name, the bar in its track, and the share. A total is ruled in the ink above. */
function Reader({
  name,
  rank,
  Icon,
  share: value,
  w,
  fill,
  at,
  first = false,
  total = false,
  dim,
  bind,
}: {
  name: string
  rank?: string
  Icon: typeof IconAgentNetwork
  share: number
  w: number
  fill: string
  at: number
  first?: boolean
  total?: boolean
  dim: boolean
  bind: object
}) {
  const Item = total ? "div" : "li"
  return (
    <Item
      tabIndex={0}
      aria-label={reading({ name, share: value })}
      className={cn(row, "flex h-18 items-center transition-colors", dim && "text-muted-foreground")}
      {...bind}
    >
      <span aria-hidden="true" className={band} />
      {(first || total) && (
        <Rule at={at} duration={GROW} className={cn("top-0 bottom-auto", total && "bg-foreground")} />
      )}
      <Rule at={at} duration={GROW} />
      <Label aria-hidden="true" className={cn("w-12 transition-colors", dim && "text-current")}>
        {rank}
      </Label>
      <Icon size={24} className="shrink-0" />
      <p aria-hidden="true" className={cn(note, "ml-4 flex-1 leading-8 font-medium")}>
        {name}
      </p>
      <div aria-hidden="true" className="relative ml-6 h-4 bg-viz-track" style={{ width: ALL_TRACK }}>
        <Fill size={w} at={at} duration={GROW} className={cn(fill, "transition-opacity", dim && "opacity-30")} />
      </div>
      <p aria-hidden="true" className="ml-6 w-28 text-right text-[32px] leading-10 tracking-[-0.02em]">
        <CountUp value={value} delay={at} duration={GROW} format={share} />
      </p>
    </Item>
  )
}
