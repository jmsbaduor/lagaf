import { CountUp, Frame, Header, inkEnd, Label, note, Panel, panelNumber, Rule, TOP } from "@/canvas/kit"
import type { Knobs, Values } from "@/components/stage"
import { cn } from "@/lib/utils"

import { TRAFFIC } from "../facts"

const CARDS = [TRAFFIC.agentShare, TRAFFIC.answerTime, TRAFFIC.pageViews]

// The deck's two registers (lime and green panels), named by weight so they hold for any accent. Each swaps the
// panel and its tag, so the tag always reads against the panel. The switch is a knob in the stage's bottom bar.
export const knobs = {
  panel: { type: "choice", label: "Panel", value: "Soft", options: ["Soft", "Solid"] },
} as const satisfies Knobs

// The entrance is the three readings: each number counts while its rule draws, left to right, in shrinking steps
// so the row reads as one wave. A register change swaps every panel at once in 200ms.
const COUNT = 700
const AT = [100, 160, 200]

export default function Dashboard({ panel = "Soft" }: Partial<Values<typeof knobs>>) {
  return (
    <Frame>
      <Header title="Docs traffic this quarter" description="Agent share, answer time and page views for Q2 2026." />

      <ul className="absolute left-[72px] flex gap-6" style={{ top: TOP }}>
        {CARDS.map((card, i) => (
          <li key={card.tag}>
            <Panel tag={card.tag} solid={panel === "Solid"} className="h-[596px] w-[416px]">
              <p className={cn(note, "mt-4 font-medium")}>
                {card.note[0]}
                <br />
                {card.note[1]}
              </p>

              {/* Number, rule and stamps as in the readout: 12px either side of the rule. */}
              <p className={cn(panelNumber, "mt-auto")}>
                <CountUp
                  value={card.value}
                  delay={AT[i]}
                  duration={COUNT}
                  format={card.format}
                  className={inkEnd(card.format(card.value))}
                />
              </p>
              <div className="relative mt-3 flex justify-between pt-3">
                <Rule at={AT[i]} duration={COUNT} className="top-0 bottom-auto bg-current" />
                <Label className="text-current">Q2 2026</Label>
                <Label className="text-current">Live</Label>
              </div>
            </Panel>
          </li>
        ))}
      </ul>
    </Frame>
  )
}
