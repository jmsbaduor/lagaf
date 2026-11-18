import { focusRing, Frame, Header, Key, Label, TOP, useReading, wipe } from "@/canvas/kit"
import type { Knobs, Values } from "@/components/stage"
import { cn } from "@/lib/utils"

import { AGENT_SHARE, GAP, MAP, TILES, TILE_LABEL, VIEWS } from "./data"

// The measure is a real switch: the tiles' views, or how much of each source agents read.
export const knobs = {
  measure: { type: "choice", label: "Measure", value: "Views", options: ["Views", "Agent share"] },
} as const satisfies Knobs

// The key sits on TOP; the tiles fill 1296 by 556 under it, from 272 to 828 (cells and edges in data.ts).
const MAP_TOP = TOP + 40

// The entrance is the tiles: each empty cell is there, then each fills, a 4px column at a time, largest first in
// shrinking steps, its label uncovered with it. A measure change answers in 200ms: each tile's agent part draws
// up from its foot to its share, uncovering the people below.
const WIPE = 500
const AT = [100, 200, 260, 300, 330]

const views = (n: number) => `${n.toFixed(1)}M`

export default function Sources({ measure = "Views" }: Partial<Values<typeof knobs>>) {
  const { active, bind, dim } = useReading<string>()
  const agents = measure === "Agent share"
  const value = (t: (typeof TILES)[number]) => (agents ? `${t.agents}%` : views(t.views))
  const on = TILES.find((t) => t.name === active)

  return (
    <Frame>
      <Header
        title="Docs pages draw most views"
        description={`May page views by source: ${Math.round(VIEWS)}M in all, ${AGENT_SHARE}% of them by agents.`}
        hint={on ? `${on.name}: ${agents ? `${on.agents}% agents` : `${views(on.views)} views`}` : "Hover or focus a source"}
        on={!!on}
      />

      {/* One key per measure, in the same place; the measure crossfades them. Entries are 164 and 128 wide, so their
          edges land on the grid whatever the words; each value sits at its entry's end. */}
      <div aria-hidden="true" className="absolute left-[72px] grid *:col-start-1 *:row-start-1" style={{ top: TOP }}>
        <div className={cn("grid grid-cols-[164px] transition-opacity duration-200", agents && "opacity-0")}>
          <Key color="var(--viz-lead)">
            Page views <span className="ml-auto text-viz-label">{Math.round(VIEWS)}M</span>
          </Key>
        </div>
        <div className={cn("grid grid-cols-[repeat(2,128px)] gap-12 transition-opacity duration-200", !agents && "opacity-0")}>
          <Key color="var(--viz-lead)">
            Agents <span className="ml-auto text-viz-label">{AGENT_SHARE}%</span>
          </Key>
          <Key color="var(--viz-label)">
            People <span className="ml-auto text-viz-label">{100 - AGENT_SHARE}%</span>
          </Key>
        </div>
      </div>

      <ul
        aria-label={`May page views by source, ${measure.toLowerCase()}`}
        className="absolute left-[72px]"
        style={{ top: MAP_TOP, width: MAP.w - GAP, height: MAP.h - GAP }}
      >
        {TILES.map((t, i) => (
          <li
            key={t.name}
            tabIndex={0}
            aria-label={`${t.name}: ${views(t.views)} views, ${t.agents}% agents`}
            className={cn("absolute", focusRing, "focus-visible:outline-offset-2")}
            style={{ left: t.x, top: t.y, width: t.w, height: t.h }}
            {...bind(t.name)}
          >
            {/* A tile that isn't read fades to 30% over the paper; its words turn to the ink, which reads on it. */}
            <div aria-hidden="true" className={cn("absolute inset-0 transition-opacity", dim(t.name) && "opacity-30")}>
              <div className="absolute inset-0 bg-viz-track" />
              <div className="viz-wipe absolute inset-0" style={wipe(AT[i], WIPE, t.w / 4)}>
                <div className="absolute inset-0 bg-viz-label" />
                {/* The agent part from the top: the whole tile, or its share (a height on the 4px grid). */}
                <div
                  className="absolute inset-0 origin-top bg-viz-lead transition-[scale] duration-200"
                  style={{ scale: `1 ${agents ? t.agentH / t.h : 1}` }}
                />
              </div>
            </div>
            {t.labelled && (
              <div
                aria-hidden="true"
                className={cn(
                  "viz-wipe absolute inset-0 transition-colors",
                  dim(t.name) ? "text-foreground" : "text-viz-lead-ink"
                )}
                style={{ ...wipe(AT[i], WIPE, t.w / 4), padding: TILE_LABEL.pad }}
              >
                <Label className="text-current">{t.name}</Label>
                <p className="mt-1 font-data text-[40px] leading-10 font-medium tracking-[-0.02em]">{value(t)}</p>
              </div>
            )}
          </li>
        ))}
      </ul>
    </Frame>
  )
}
