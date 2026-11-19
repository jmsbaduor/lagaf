import { arc } from "d3-shape"
import { useId, type CSSProperties } from "react"

import { CountUp, delay, focusRing, Frame, Header, Label, Rule, tickText, TOP, useReading } from "@/canvas/kit"
import { cn } from "@/lib/utils"

import { DIAL, dialAt } from "./data"
// The formats ring's sweep: a mask's stroke grows round the ring to --sweep on the kit's curve.

// A half dial 960 across, centred on the content box (240 to 1200), its baseline at 760, 96 thick, so its bowl is
// 768 across. Arcs have square ends, and d3 keeps the gap between lead and rest a constant 4px at every radius.
const R = 480
const THICK = 96
const GAP = 4
const CX = 720
const BASE = 760
// Room above the dial for the before tick's stub, which runs 16 past the arc.
const ROOM = 24
const STUB = 16
const half = arc<{ start: number; end: number }>()
  .innerRadius(R - THICK)
  .outerRadius(R)
  .startAngle((d) => (d.start - 0.5) * Math.PI)
  .endAngle((d) => (d.end - 0.5) * Math.PI)
  .padRadius(R)
  .padAngle(2 * Math.asin(GAP / 2 / R))

// The lead is the dial from its left end to the after reading, the rest its track. Both run on past the baseline,
// where the SVG's box cuts them flat, so the pad parts lead from rest and leaves the ends square on the baseline.
const OVER = 0.05
const AFTER = dialAt(DIAL.after)
const LEAD = { start: -OVER, end: AFTER }
const REST = { start: AFTER, end: 1 + OVER }

// The before tick: across the ring at 97.6%, on past it by its stub; its label is centred over the stub's end.
const angle = (dialAt(DIAL.before) - 0.5) * Math.PI
const at = (r: number) => [r * Math.sin(angle), -r * Math.cos(angle)] as const
const TICK_X = CX + at(R + STUB)[0]
const TICK_LABEL_W = 160
const TICK_LABEL_X = Math.round((TICK_X - TICK_LABEL_W / 2) / 4) * 4

// The entrance is the sweep: the track is there, then the lead fills clockwise from the left end while the number
// counts from 95% to 99.6% and the rule under it draws, so the three land together. Ends and the tick are read.
const SWEEP_AT = 100
const SWEEP = 800

// The after reading's box: the number's width and room, inside the bowl at every height it spans.
const AFTER_W = 528

type Reading = "after" | "before"
const pct = (n: number) => `${n.toFixed(1)}%`

export default function Gauge() {
  const mask = `sweep-${useId().replace(/[^\w-]/g, "")}`
  const { active, bind, dim } = useReading<Reading>()
  const READINGS = { after: `After llms.txt: ${pct(DIAL.after)}`, before: `Before llms.txt: ${pct(DIAL.before)}` }

  return (
    <Frame>
      <Header
        title={`Accuracy rose to ${pct(DIAL.after)}`}
        description={`Overall eval accuracy after llms.txt, up ${+(DIAL.after - DIAL.before).toFixed(1)} points from ${pct(DIAL.before)}.`}
        hint={active ? READINGS[active] : "Hover or focus a reading"}
        on={!!active}
      />

      <svg
        aria-hidden="true"
        className="absolute"
        style={{ left: CX - R, top: BASE - R - ROOM, width: 2 * R, height: R + ROOM }}
        viewBox={`${-R} ${-R - ROOM} ${2 * R} ${R + ROOM}`}
      >
        <defs>
          {/* The sweep's stroke covers the dial's band; rotated so it starts at 9 o'clock. A whole circle is 100,
              so the half dial is 50. */}
          <mask id={mask}>
            <circle
              r={R - THICK / 2}
              fill="none"
              stroke="white"
              strokeWidth={THICK + 8}
              pathLength={100}
              transform="rotate(180)"
              className="viz-sweep"
              style={{ ...delay(SWEEP_AT, SWEEP), "--sweep": AFTER * 50 } as CSSProperties}
            />
          </mask>
        </defs>
        <path d={half(REST) ?? undefined} className="fill-viz-track" />
        <g className={cn("transition-opacity", dim("after") && "opacity-30")}>
          <path d={half(LEAD) ?? undefined} className="fill-viz-track" />
          <path d={half(LEAD) ?? undefined} mask={`url(#${mask})`} className="fill-viz-lead" />
        </g>
        <line
          x1={at(R - THICK)[0]}
          y1={at(R - THICK)[1]}
          x2={at(R + STUB)[0]}
          y2={at(R + STUB)[1]}
          strokeWidth={4}
          shapeRendering="geometricPrecision"
          className={cn("stroke-foreground transition-opacity", dim("before") && "opacity-30")}
        />
      </svg>

      {/* The dial's ends, 12 under the baseline, centred under the ring's band. */}
      {[DIAL.from, DIAL.to].map((v, i) => (
        <p
          key={v}
          aria-hidden="true"
          className={cn(tickText, "absolute text-center")}
          style={{ left: i ? CX + R - THICK : CX - R, width: THICK, top: BASE + 12 }}
        >
          {v}%
        </p>
      ))}

      {/* A rule across the dial's baseline, from the bowl's one side to the other, draws under the count. */}
      <div aria-hidden="true" className="absolute h-[168px]" style={{ left: CX - R + THICK, width: 2 * (R - THICK), top: BASE - 168 }}>
        <Rule at={SWEEP_AT} duration={SWEEP} />
      </div>

      <ul aria-label="Eval accuracy, before and after llms.txt">
        {/* The after reading sits in the bowl: its number on the rule, named under it. It is 528 wide, so its focus
            ring stays inside the bowl. */}
        <li
          tabIndex={0}
          aria-label={READINGS.after}
          className={cn("absolute text-center transition-colors", focusRing, dim("after") && "text-muted-foreground")}
          style={{ left: CX - AFTER_W / 2, width: AFTER_W, top: BASE - 168 }}
          {...bind("after")}
        >
          <p aria-hidden="true" className="h-[168px] font-data text-[144px] leading-[144px] font-medium tracking-[-0.05em]">
            <CountUp value={DIAL.after - DIAL.from} delay={SWEEP_AT} duration={SWEEP} format={(n) => pct(DIAL.from + n)} />
          </p>
          <Label aria-hidden="true" className={cn("mt-3 transition-colors", active === "after" && "text-foreground")}>
            After llms.txt
          </Label>
        </li>
        {/* The before reading names its tick, over the stub's end. */}
        <li
          tabIndex={0}
          aria-label={READINGS.before}
          className={cn("absolute", focusRing)}
          style={{ left: TICK_LABEL_X, width: TICK_LABEL_W, top: TOP }}
          {...bind("before")}
        >
          <Label
            aria-hidden="true"
            className={cn("text-center transition-colors", active === "before" && "text-foreground")}
          >
            Before {pct(DIAL.before)}
          </Label>
        </li>
      </ul>
    </Frame>
  )
}
