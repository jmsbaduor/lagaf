import { CountUp, delay, Frame, Header, Label, Tag, TOP } from "@/canvas/kit"
import type { Knobs, Values } from "@/components/stage"
import { cn } from "@/lib/utils"

import { TRAFFIC } from "../facts"
import { inkEnd, note } from "./parts"

const CARDS = [TRAFFIC.agentShare, TRAFFIC.answerTime, TRAFFIC.pageViews]

// The deck's two registers (lime and green panels), named by weight so they hold for any accent. Each swaps the
// panel and its tag, so the tag always reads against the panel. The switch is a knob in the stage's bottom bar.
export const knobs = {
  panel: { type: "choice", label: "Panel", value: "Soft", options: ["Soft", "Solid"] },
} as const satisfies Knobs

const REGISTERS = {
  Soft: { panel: "bg-viz-panel text-viz-panel-ink", tag: "bg-viz-lead text-viz-lead-ink" },
  Solid: { panel: "bg-viz-lead text-viz-lead-ink", tag: "bg-viz-panel text-viz-panel-ink" },
}

// The entrance is the three readings: each number counts while its rule draws, left to right, in shrinking steps
// so the row reads as one wave. A register change swaps every panel at once in 200ms.
const COUNT = 700
const AT = [100, 160, 200]
const swap = "transition-colors duration-200"

export default function Dashboard({ panel = "Soft" }: Partial<Values<typeof knobs>>) {
  const r = REGISTERS[panel]

  return (
    <Frame>
      <Header title="Docs traffic this quarter" description="Agent share, answer time and page views for Q2 2026." />

      <ul className="absolute left-[72px] flex gap-6" style={{ top: TOP }}>
        {CARDS.map((card, i) => (
          <li key={card.tag} className={cn("flex h-[596px] w-[416px] flex-col p-6", r.panel, swap)}>
            <Tag className={cn(r.tag, swap)}>{card.tag}</Tag>
            <p className={cn(note, "mt-4")}>
              {card.note[0]}
              <br />
              {card.note[1]}
            </p>

            {/* Number, rule and stamps as in the readout: 12px either side of the rule. */}
            <p className="mt-auto text-right font-mono text-[102px] leading-[104px] tracking-[-0.02em]">
              <CountUp
                value={card.value}
                delay={AT[i]}
                duration={COUNT}
                format={card.format}
                className={inkEnd(card.format(card.value))}
              />
            </p>
            <div className="relative mt-3 flex justify-between pt-3">
              <span
                aria-hidden="true"
                className="viz-grow-x absolute inset-x-0 top-0 h-px bg-current"
                style={delay(AT[i], COUNT)}
              />
              <Label className="text-current">Q2 2026</Label>
              <Label className="text-current">Live</Label>
            </div>
          </li>
        ))}
      </ul>
    </Frame>
  )
}
