import { CountUp, delay, Frame, Header, TOP, useReading } from "@/canvas/kit"
import { cn } from "@/lib/utils"

import { TRAFFIC } from "../facts"
import { band, note, row } from "./parts"

const ROWS = [TRAFFIC.pageViews, TRAFFIC.teams, TRAFFIC.agentShare, TRAFFIC.answerTime]

// The entrance is the four numbers: each counts while the rule under its row draws, in shrinking steps from the
// top so the list lands as one wave. Notes are read, so they don't move.
const COUNT = 700
const AT = [100, 160, 200, 230]

export default function Numbers() {
  const { active, bind } = useReading<number>()
  const on = active === null ? null : ROWS[active]

  return (
    <Frame>
      <Header
        title="What changes when docs become infrastructure"
        description="Four numbers: reach, teams, agent share and answer speed."
        hint={on ? `${on.tag}: ${on.format(on.value)}` : "Hover or focus a row"}
        on={!!on}
      />

      <ul className="absolute right-[72px] left-[72px]" style={{ top: TOP }}>
        {ROWS.map((r, i) => (
          <li
            key={r.tag}
            tabIndex={0}
            data-active={active === i || undefined}
            className={cn(row, "grid grid-cols-[648px_1fr] py-6")}
            {...bind(i)}
          >
            <span aria-hidden="true" className={band} />
            <span
              aria-hidden="true"
              className="viz-grow-x absolute inset-x-0 bottom-0 h-px bg-border"
              style={delay(AT[i], COUNT)}
            />
            {/* Pulled 4px left by its indent (the digits' side bearing), so the ink starts on the rule's edge. */}
            <p className="-indent-1 text-[96px] leading-[96px] font-medium tracking-[-0.04em] text-muted-foreground transition-colors group-data-active:text-foreground">
              <CountUp value={r.value} delay={AT[i]} duration={COUNT} format={r.format} />
            </p>
            <p className={cn(note, "pt-2 text-muted-foreground transition-colors group-data-active:text-foreground")}>
              {r.note.join(" ")}
            </p>
          </li>
        ))}
      </ul>
    </Frame>
  )
}
