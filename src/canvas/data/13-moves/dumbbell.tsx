import type { CSSProperties } from "react"

import { CountUp, delay, focusRing, Frame, Header, Key, TOP, useReading, XAxis } from "@/canvas/kit"
import { cn } from "@/lib/utils"

import { DUMBBELL, DUMBBELL_DOT, dumbbellChange, dumbbellReading, dumbbellX } from "./data"
import "./dumbbell.css"

// Five rows of 108 from TOP, one a source, across the content width: the name in a 224 column on the left, then the
// 0 to 100% axis at 10px a point, 344 to 1344, its ticks 48 wide so the 100% tick ends on 1368. In a row, the change
// (40/40) on the row's top line, right-aligned to May's dot; the 24px dots 12 under it, centred on 64, and the 4px
// bar between them (an 8px box clipped to its middle 4, so both edges stay on the grid). The baseline sits 4 under
// the rows at 776, so the axis name, under the ticks, ends on 828.
const ROW_H = 108
const BASE = TOP + DUMBBELL.length * ROW_H + 4
const DOT_Y = 52
const HALF = DUMBBELL_DOT / 2
const TICKS = Array.from({ length: 11 }, (_, i) => i * 10)

// The entrance is each move: the bar grows out of December's dot to May's while May's dot rides its end and the
// change counts, top to bottom in shrinking steps. December's dots, names, axis and gridlines are there from the start.
const GROW = 600
const AT = [100, 160, 200, 230, 250]

export default function Dumbbell() {
  const { active, bind, dim } = useReading<string>()
  const on = DUMBBELL.find((s) => s.name === active)

  return (
    <Frame>
      <Header
        title="Every source’s agent share rose"
        description="Agents’ share of each source’s reads, in December and in May."
        hint={on ? dumbbellReading(on) : "Hover or focus a source"}
        on={!!on}
      />

      {TICKS.map((v) => (
        <span
          key={v}
          aria-hidden="true"
          className="absolute w-px bg-viz-hatch"
          style={{ left: dumbbellX(v), top: TOP, height: BASE - TOP }}
        />
      ))}
      <XAxis name="Agent share of reads" y={BASE} ticks={TICKS.map((v) => ({ at: dumbbellX(v), label: `${v}%` }))} />
      {/* The key sits in the name column on the ticks' line; 96 and 56 hold each swatch and name. */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute left-[72px] grid grid-cols-[96px_56px] gap-6"
        style={{ top: BASE + 12 }}
      >
        <Key color="var(--viz-label)">December</Key>
        <Key color="var(--viz-lead)">May</Key>
      </div>

      <ul aria-label="Agent share of each source’s reads, December and May">
        {DUMBBELL.map((s, i) => (
          <li
            key={s.name}
            tabIndex={0}
            aria-label={`${dumbbellReading(s)}, up ${s.change} points`}
            className={cn("absolute left-[72px] w-[1296px] transition-colors focus-visible:z-10", focusRing, dim(s.name) && "text-muted-foreground")}
            style={{ top: TOP + i * ROW_H, height: ROW_H }}
            {...bind(s.name)}
          >
            <p aria-hidden="true" className="absolute top-12 left-0 w-56 text-[28px] leading-8 font-medium tracking-[-0.02em]">
              {s.name}
            </p>

            {/* December is the quiet mark, May and the move the lead. A row that isn't read fades its marks toward
                the paper, so the gridlines don't show through them. */}
            <span
              aria-hidden="true"
              data-dim={dim(s.name) || undefined}
              className="px-cell absolute size-6"
              style={{ "--px": "var(--viz-label)", left: s.decX - HALF - 72, top: DOT_Y } as CSSProperties}
            />
            <span
              aria-hidden="true"
              data-dim={dim(s.name) || undefined}
              className="px-cell viz-grow-x absolute h-2 border-y-2 border-transparent bg-clip-padding"
              style={
                {
                  "--px": "var(--viz-lead)",
                  left: s.decX + HALF - 72,
                  width: s.mayX - s.decX - DUMBBELL_DOT,
                  top: DOT_Y + HALF - 4,
                  ...delay(AT[i], GROW),
                } as CSSProperties
              }
            />
            <span
              aria-hidden="true"
              data-dim={dim(s.name) || undefined}
              className="px-cell dumbbell-travel absolute size-6"
              style={
                {
                  "--px": "var(--viz-lead)",
                  "--travel": `${s.mayX - s.decX}px`,
                  left: s.mayX - HALF - 72,
                  top: DOT_Y,
                  ...delay(AT[i], GROW),
                } as CSSProperties
              }
            />

            {/* The change, on the paper so a gridline never runs through it, ending on May's dot. 160 wide, so both
                its edges are on the grid while it counts. */}
            <p
              aria-hidden="true"
              className="absolute top-0 w-40 bg-background text-right font-heading text-[40px] leading-10 font-medium tracking-[-0.03em] whitespace-nowrap"
              style={{ right: 1368 - s.mayX - HALF }}
            >
              <CountUp value={s.change} delay={AT[i]} duration={GROW} format={dumbbellChange} />
            </p>
          </li>
        ))}
      </ul>
    </Frame>
  )
}
