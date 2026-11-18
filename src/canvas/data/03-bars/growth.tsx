import { CountUp, Fill, focusRing, Frame, Header, TOP, useReading } from "@/canvas/kit"
import { cn } from "@/lib/utils"

import { GROWTH } from "../facts"

/** A series colour for large text, pulled 20% toward the ink so it holds 3:1 in every brand. */
const seriesText = (token: string) => ({ color: `color-mix(in oklch, var(${token}) 80%, var(--viz-ink))` })

const STYLE = [
  { fill: "bg-viz-lead", token: "--viz-lead" },
  { fill: "bg-viz-contrast", token: "--viz-contrast" },
]
const MAX = Math.max(...GROWTH.map((d) => d.value))
// The track is the content width; 1× is a ninth of it, 144px, on the grid.
const TRACK = 1296

// Each row is its number (a 196 line), 24, then its 12px track: 232. The two rows sit at TOP and on 828, 132 apart.
const ROW = 232
const GAP = 828 - TOP - 2 * ROW

// The entrance is the fills: each grows from the left edge of its track while its number counts, a beat apart.
// Tracks and labels are structure, so they don't move.
const GROW = 700
const AT = [100, 200]

export default function Growth() {
  const { active, bind, dim } = useReading<number>()
  const on = active === null ? null : GROWTH[active]

  return (
    <Frame>
      <Header
        title="Agent vs human readership growth"
        description="Readership growth across the sites in the sample over the last six months."
        hint={on ? `${on.label}: ${on.value}×` : "Hover or focus a row"}
        on={!!on}
      />

      <ul
        aria-label="Readership growth"
        className="absolute left-[72px] flex flex-col"
        style={{ top: TOP, width: TRACK, gap: GAP }}
      >
        {GROWTH.map((d, i) => (
          <li key={d.label} tabIndex={0} aria-label={`${d.label}: ${d.value}×`} className={focusRing} {...bind(i)}>
            <div aria-hidden="true" className="flex items-center">
              <p
                className={cn(
                  // The indent takes up the digits' 8px side bearing, so the ink starts on the track's edge.
                  "w-[648px] -indent-2 font-heading text-[192px] leading-[196px] font-medium tracking-[-0.05em] transition-colors",
                  dim(i) && "text-muted-foreground"
                )}
                style={dim(i) ? undefined : seriesText(STYLE[i].token)}
              >
                <CountUp value={d.value} delay={AT[i]} duration={GROW} format={(n) => `${Math.round(n)}×`} />
              </p>
              {/* A 44px line, so centred on the number's 196 it sits on the grid (76 down), cap centres level. */}
              <p
                className={cn(
                  "text-[32px] leading-11 tracking-[-0.02em] transition-colors",
                  dim(i) && "text-muted-foreground"
                )}
              >
                {d.label}
              </p>
            </div>
            <div aria-hidden="true" className="relative mt-6 h-3 bg-viz-track">
              <Fill
                size={(d.value / MAX) * TRACK}
                at={AT[i]}
                duration={GROW}
                className={cn("transition-opacity", STYLE[i].fill, dim(i) && "opacity-30")}
              />
            </div>
          </li>
        ))}
      </ul>
    </Frame>
  )
}
