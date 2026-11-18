import type { ComponentProps } from "react"

import { CountUp, delay, Fill, focusRing, Frame, Header, Label, TOP, useReading } from "@/canvas/kit"
import { cn } from "@/lib/utils"

import { LAG, LAG_PX } from "../facts"

const STYLE = [
  { fill: "bg-viz-lead", ink: "text-viz-lead-ink" },
  { fill: "bg-viz-warn ring-1 ring-inset ring-viz-warn-edge", ink: "text-viz-warn-ink" },
  { fill: "bg-viz-alert", ink: "text-viz-alert-ink" },
]
// The hatched column holds 56.4% on the shared scale (10px a point), so the tallest bar keeps a sliver of headroom.
const COLUMN_H = 564

// The entrance is the bars: each grows from its baseline while its number counts, in shrinking steps left to
// right. Labels and the hatch are structure, so they don't move.
const GROW = 600
const AT = [100, 180, 240]

export default function UpdateLag() {
  const { active, bind, dim } = useReading<number>()
  const on = active === null ? null : LAG[active]

  return (
    <Frame>
      <Header
        title="Docs update lag"
        description="How long docs take to catch up with a product change."
        hint={on ? `${on.label}: ${on.value}%` : "Hover or focus a column"}
        on={!!on}
      />

      <ul
        aria-label="Docs update lag"
        className="absolute left-[72px] grid w-[1296px] grid-cols-3 gap-6"
        style={{ top: TOP }}
      >
        {LAG.map((d, i) => (
          <Column
            key={d.label}
            {...d}
            {...STYLE[i]}
            at={AT[i]}
            dim={dim(i)}
            tabIndex={0}
            {...bind(i)}
          />
        ))}
      </ul>
    </Frame>
  )
}

/**
 * A column that isn't read fades its bar to 30% over the paper (so the hatch doesn't show through and read as
 * headroom); its number turns to the ink, which reads on the faded bar.
 */
function Column({
  label,
  value,
  fill,
  ink,
  at,
  dim,
  ...props
}: (typeof LAG)[number] & (typeof STYLE)[number] & { at: number; dim: boolean } & ComponentProps<"li">) {
  return (
    <li aria-label={`${label}: ${value}%`} className={cn("flex flex-col gap-4", focusRing)} {...props}>
      <Label>{label}</Label>
      <div aria-hidden="true" className="viz-hatch relative" style={{ height: COLUMN_H }}>
        <Fill axis="y" size={value * LAG_PX} at={at} duration={GROW} className="bg-background">
          <div className={cn("size-full transition-opacity", fill, dim && "opacity-30")} />
        </Fill>
        {/* Fades in once its bar is behind it, so the ink never sits on the hatch. Its indent takes up the digits'
            side bearing and its box sits 12 up, so the ink is about 24 from the bar's left and bottom alike. */}
        <p
          className={cn(
            "viz-fade absolute inset-x-6 bottom-3 -indent-1 font-heading text-[72px] leading-20 font-medium tracking-[-0.03em] transition-colors",
            dim ? "text-foreground" : ink
          )}
          style={delay(at + 100)}
        >
          <CountUp value={value} delay={at} duration={GROW} format={(n) => `${Math.round(n)}%`} />
        </p>
      </div>
    </li>
  )
}
