import type { CSSProperties } from "react"

import { CountUp, delay, focusRing, Frame, Header, Key, Label, TOP, useReading } from "@/canvas/kit"
import type { Knobs, Values } from "@/components/stage"
import { cn } from "@/lib/utils"

import { pct } from "../facts"
import {
  RIBBONS_BASE,
  RIBBONS_COL_W,
  RIBBONS_COLS,
  RIBBONS_H,
  RIBBONS_READERS,
  RIBBONS_X0,
  RIBBONS_X1,
  ribbonsMillions,
  ribbonsPart,
  ribbonsPath,
  type RibbonsReader,
} from "./data"

// Share sets both columns full height, so the split reads against one whole; Count stands each column at its total,
// so December's whole is less than half of May's. Parts and ribbons answer in 200ms on the same elements.
export const knobs = {
  measure: { type: "choice", label: "Measure", value: "Share", options: ["Share", "Count"] },
} as const satisfies Knobs

// Agents are what the chart is about; people are the compared series, as everywhere else. A number on a part is in
// that part's ink; the paper reads on the compared series at the 3:1 a large number needs.
const NAME = { agents: "Agents", people: "People" }
const FILL = { agents: "bg-viz-lead", people: "bg-viz-contrast" }
const INK = { agents: "text-viz-lead-ink", people: "text-[var(--viz-paper)]" }
const RIBBON = { agents: "fill-viz-lead/35", people: "fill-viz-contrast/35" }

// A part's number (64/64, in a 224 box 16 in from the column's outer edge, so both its edges are on the grid) sits
// 12 inside its top. A part shorter than 84 can't hold it, so its number stands 12
// above the column instead, on the paper (December's agents in Count, a column 40 tall).
const NUMBER = 64
const fits = (h: number) => h >= NUMBER + 20

// The entrance is the reading from December to May: December's column fills up from its foot while its numbers
// count, the ribbons sweep across left to right, then May's column fills and counts. Names and the key are read,
// so they're there from the start.
const COL_AT = [100, 600]
const FILL_DUR = 400
const DRAW_AT = 300
const DRAW = 500

type Col = (typeof RIBBONS_COLS)[number]
const SAY = {
  Share: (c: Col, r: RibbonsReader) => pct(c.share[r]),
  Count: (c: Col, r: RibbonsReader) => ribbonsMillions(c[r]),
}

export default function Ribbons({ measure = "Share" }: Partial<Values<typeof knobs>>) {
  const { active, bind, dim } = useReading<RibbonsReader>()
  const share = measure === "Share"
  const [dec, may] = RIBBONS_COLS

  return (
    <Frame>
      <Header
        title={`Agents went from ${pct(dec.share.agents)} to ${pct(may.share.agents)}`}
        description="Monthly docs page views by reader, December against May."
        hint={active ? `${NAME[active]}: ${SAY[measure](dec, active)} → ${SAY[measure](may, active)}` : "Hover or focus a reader"}
        on={!!active}
      />

      {/* Column names on TOP over each column's outer edge; the key centred between them in 80 + 32 + 80. */}
      <Label className="absolute left-[72px]" style={{ top: TOP }}>
        {dec.name} · {ribbonsMillions(dec.total)} views
      </Label>
      <div
        aria-hidden="true"
        className="pointer-events-none absolute left-[624px] grid grid-cols-[80px_80px] gap-8"
        style={{ top: TOP }}
      >
        <Key color="var(--viz-lead)">{NAME.agents}</Key>
        <Key color="var(--viz-contrast)">{NAME.people}</Key>
      </div>
      <Label className="absolute right-[72px] text-right" style={{ top: TOP }}>
        {may.name} · {ribbonsMillions(may.total)} views
      </Label>

      {/* The ribbons, in frame px across the 784 between the columns. Their shapes are CSS `d`, so a measure change
          is a 200ms transition on the same paths. A ribbon reads its reader on hover; focus goes to the parts. */}
      <svg
        aria-hidden="true"
        className="viz-draw pointer-events-none absolute"
        style={{
          left: RIBBONS_X0,
          top: RIBBONS_BASE - RIBBONS_H,
          width: RIBBONS_X1 - RIBBONS_X0,
          height: RIBBONS_H,
          ...delay(DRAW_AT, DRAW),
        }}
        viewBox={`${RIBBONS_X0} ${RIBBONS_BASE - RIBBONS_H} ${RIBBONS_X1 - RIBBONS_X0} ${RIBBONS_H}`}
      >
        {RIBBONS_READERS.map((r) => {
          const d = ribbonsPath(measure, r)
          return (
            <path
              key={r}
              d={d}
              shapeRendering="geometricPrecision"
              className={cn("pointer-events-auto", RIBBON[r], dim(r) && "opacity-30")}
              style={
                {
                  d: `path("${d}")`,
                  transition: "d 200ms var(--viz-ease), opacity 150ms var(--viz-ease)",
                } as CSSProperties
              }
              {...bind(r)}
            />
          )
        })}
      </svg>

      <ul aria-label="Monthly docs page views by reader, December and May">
        {RIBBONS_COLS.map((c, ci) =>
          RIBBONS_READERS.map((r) => {
            const part = ribbonsPart(c, measure, r)
            const h = part.bottom - part.top
            const inside = fits(h)
            return (
              <li
                key={`${c.month}-${r}`}
                tabIndex={0}
                aria-label={`${c.name}, ${r}: ${pct(c.share[r])}, ${ribbonsMillions(c[r])}`}
                className={cn("absolute transition-[top,height] duration-200", focusRing)}
                style={{ left: ci ? RIBBONS_X1 : 72, top: part.top, width: RIBBONS_COL_W, height: h }}
                {...bind(r)}
              >
                {/* Both parts of a column grow from its foot as one, so their origin is the column's baseline. */}
                <span
                  aria-hidden="true"
                  className={cn("viz-grow-y absolute inset-0 transition-opacity", FILL[r], dim(r) && "opacity-30")}
                  style={{ ...delay(COL_AT[ci], FILL_DUR), transformOrigin: `center ${RIBBONS_BASE - part.top}px` }}
                />
                <span aria-hidden="true" className="viz-fade" style={delay(COL_AT[ci])}>
                  <span
                    className={cn(
                      "absolute w-56 font-data text-[64px] leading-16 font-medium tracking-[-0.04em] whitespace-nowrap",
                      "transition-[top,color] duration-200",
                      ci ? "right-4 text-right" : "left-4 -indent-1",
                      inside ? (dim(r) ? "text-foreground" : INK[r]) : dim(r) ? "text-muted-foreground" : "text-foreground"
                    )}
                    style={{ top: inside ? 12 : -NUMBER - 12 }}
                  >
                    <CountUp
                      value={share ? c.share[r] : c[r]}
                      delay={COL_AT[ci]}
                      duration={FILL_DUR}
                      format={share ? pct : ribbonsMillions}
                    />
                  </span>
                </span>
              </li>
            )
          })
        )}
      </ul>
    </Frame>
  )
}
