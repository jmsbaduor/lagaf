import type { ReactNode } from "react"

import { CountUp, Frame, Header, inkEnd, Label, note, Panel, panelNumber, Rule, TOP } from "@/canvas/kit"
import { Icon } from "@/components/Icon"
import { cn } from "@/lib/utils"

import { TRAFFIC } from "../facts"

// Crosshair: two vertical and two horizontal hairlines frame the panel (the right half of the data area) and run on
// to the screen's edges. They are structure, so they don't move.
const BLEED = 4000
const X = [720, 1368]
const Y = [TOP, 828]

// The entrance is the two readings: each number counts while the rule under it draws, the second a beat later.
const COUNT = 700
const AT = [100, 180]

export default function Readout() {
  const { agentShare, answerTime } = TRAFFIC
  return (
    <Frame>
      <Header
        title="Agents read your docs first"
        description="Agent share of docs traffic and median time to answer."
      />

      {X.map((x) => (
        <span
          key={x}
          aria-hidden="true"
          className="absolute w-px bg-border"
          style={{ left: x, top: -BLEED, height: 900 + 2 * BLEED }}
        />
      ))}
      {Y.map((y) => (
        <span
          key={y}
          aria-hidden="true"
          className="absolute h-px bg-border"
          style={{ top: y, left: -BLEED, width: 1440 + 2 * BLEED }}
        />
      ))}

      <Panel
        tag="Agent traffic"
        className="absolute"
        style={{ left: X[0], top: Y[0], width: X[1] - X[0], height: Y[1] - Y[0] }}
      >

        <dl className="mt-auto flex flex-col">
          <Metric icon="arrow-up-right" label={agentShare.note} at={AT[0]}>
            <CountUp
              value={agentShare.value}
              delay={AT[0]}
              duration={COUNT}
              format={agentShare.format}
              className={inkEnd(agentShare.format(agentShare.value))}
            />
          </Metric>
          <Metric icon="clock" label={answerTime.note} at={AT[1]}>
            <CountUp
              value={answerTime.value}
              delay={AT[1]}
              duration={COUNT}
              format={answerTime.format}
              className={inkEnd(answerTime.format(answerTime.value))}
            />
          </Metric>
        </dl>

        {/* Three equal columns, so each stamp's box is a column, on the grid. 12px under the rule, as in the dashboard. */}
        <div className="grid grid-cols-3 pt-3">
          <Label className="text-current">May 26</Label>
          <Label className="text-center text-current">Q2 2026</Label>
          <Label className="text-right text-current">09:11</Label>
        </div>
      </Panel>
    </Frame>
  )
}

/**
 * One reading as a row across the frame: its label on the paper in the left column, its icon and number on the
 * panel, one rule under both (a hairline on the paper, the panel's ink on the panel), so the label and the number
 * share the row's edges.
 */
function Metric({
  icon,
  label,
  at,
  children,
}: {
  icon: "arrow-up-right" | "clock"
  label: string[]
  at: number
  children: ReactNode
}) {
  return (
    <div className="relative flex items-center justify-between py-3">
      <dt className="flex">
        <Icon name={icon} size={40} />
        {/* The left column, 72 to 696. On a 32px line its last baseline meets the number's, with its box on the grid. */}
        <span className={cn(note, "absolute bottom-5 left-[-672px] w-[624px] leading-8 font-medium text-foreground")}>
          {label[0]}
          <br />
          {label[1]}
        </span>
      </dt>
      <dd className={cn(panelNumber, "flex-1")}>{children}</dd>
      <Rule at={at} duration={COUNT} className="left-[-672px] w-[648px]" />
      <Rule at={at} duration={COUNT} className="bg-current" />
    </div>
  )
}
