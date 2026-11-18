// A starter chart: copy it, never import it. This folder is outside the registry's NN-row glob, so it never shows.
//   1. Copy this file to src/canvas/data/<NN-row>/<slug>.tsx and add [slug, idea] to that row's ideas.ts.
//   2. Put the numbers in ../facts.ts, with a check in facts.check.mjs. This one draws READERS.
//   3. Replace the copy, the marks and the knob. Keep the frame, header, TOP, reading and motion as they are.
// docs/charts.md has the rules the comments below point to.
import { CountUp, Fill, focusRing, Frame, Header, labelText, Rule, TOP, useReading } from "@/canvas/kit"
import type { Knobs, Values } from "@/components/stage"
import { cn } from "@/lib/utils"

import { pct, READERS } from "../facts"

// Knobs: a real switch the reader flips, in the stage's bottom bar; here, which readers the bars measure. It answers
// in 200ms on the marks that change. Never reorder or remount marks for a knob: that replays their entrance.
export const knobs = {
  readers: { type: "choice", label: "Readers", value: "Agents", options: ["Agents", "People"] },
} as const satisfies Knobs

// Motion: one entrance that explains the data. Each bar grows from its baseline while its number counts and its
// rule draws, in shrinking steps down the list. Names are read, so they don't move.
const GROW = 600
const AT = [100, 160, 200, 230, 250]

export default function Template({ readers = "Agents" }: Partial<Values<typeof knobs>>) {
  const { active, bind, dim } = useReading<string>()
  const agents = readers === "Agents"
  const share = (r: (typeof READERS)[number]) => (agents ? r.agents : 100 - r.agents)
  const on = READERS.find((r) => r.name === active)

  return (
    <Frame>
      {/* Copy: a title of 3 to 6 words, a one-sentence description of 50 to 80 characters, a "Hover or focus" hint. */}
      <Header
        title="Who reads each source"
        description="The share of each source’s readers that are agents or people."
        hint={on ? `${on.name}: ${share(on)}% ${readers.toLowerCase()}` : "Hover or focus a source"}
        on={!!on}
      />

      {/* Layout, on the 4px grid: rows of 96 from TOP (five end at 712, above the content's foot at 828); columns of
          352 (name), 800 (track) and 96 (value), 24 apart, fill the 1296 content width. The track is 8px a point,
          so every bar ends on the grid. */}
      <ul aria-label={`${readers} by source`} className="absolute left-[72px] w-[1296px]" style={{ top: TOP }}>
        {READERS.map((r, i) => (
          <li
            key={r.name}
            tabIndex={0}
            aria-label={`${r.name}: ${share(r)}% ${readers.toLowerCase()}`}
            className={cn("relative flex h-24 items-center gap-6", focusRing)}
            {...bind(r.name)}
          >
            {/* A row that isn't read fades its bar and mutes its words, which still read (4.5:1). */}
            <span
              aria-hidden="true"
              className={cn(labelText, "w-[352px] transition-colors", dim(r.name) && "text-muted-foreground")}
            >
              {r.name}
            </span>
            {/* The track is the whole; the fill grows across it on entrance, and its scale is the share, so a
                knob change is a 200ms scale on the same element. Colours are roles, never hex. */}
            <div aria-hidden="true" className="relative h-4 w-[800px] bg-viz-track">
              <Fill at={AT[i]} duration={GROW} className="inset-0">
                <div
                  className={cn(
                    "h-full origin-left transition-[scale,background-color,opacity] duration-200",
                    agents ? "bg-viz-lead" : "bg-viz-label",
                    dim(r.name) && "opacity-30"
                  )}
                  style={{ scale: `${share(r) / 100} 1` }}
                />
              </Fill>
            </div>
            <span
              aria-hidden="true"
              className={cn(
                "w-24 text-right text-[32px] leading-10 tracking-[-0.02em] transition-colors",
                dim(r.name) && "text-muted-foreground"
              )}
            >
              <CountUp value={share(r)} delay={AT[i]} duration={GROW} format={pct} />
            </span>
            <Rule at={AT[i]} duration={GROW} />
          </li>
        ))}
      </ul>
    </Frame>
  )
}
