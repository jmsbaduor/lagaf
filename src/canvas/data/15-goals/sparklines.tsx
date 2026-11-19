import { CountUp, focusRing, Frame, Header, Label, note, Point, Rule, Series, useReading } from "@/canvas/kit"
import { cn } from "@/lib/utils"

import { SPARKLINES, SPARKLINES_LINE, SPARKLINES_POINTS, SPARKLINES_TILE, sparklinesTile } from "./data"

// Six tiles, three across and two down, filling the data area (sizes in data.ts). Each tile's rule is its top edge;
// under it the name, May's value, the change since December, and the six months as a line ending in May's point.
// The five numbers that moved the right way draw in the lead; people's views, which slipped, in the contrast.
const T = SPARKLINES_TILE
const BAND = SPARKLINES_LINE.top - 16

// The entrance is the six months: each line draws from December to May while its value counts and its rule draws,
// tile by tile in shrinking steps. Names and changes are read, so they're there from the start.
const DRAW = 600
const AT = [100, 160, 200, 230, 250, 260]

const path = (pts: readonly { x: number; y: number }[]) => pts.map((p, m) => `${m ? "L" : "M"}${p.x} ${p.y}`).join("")

export default function Sparklines() {
  const { active, bind, dim } = useReading<number>()
  const on = active === null ? null : SPARKLINES[active]

  return (
    <Frame>
      <Header
        title="Five of six numbers improved"
        description="Six docs numbers in May, each over six months, against December."
        hint={on ? on.reading : "Hover or focus a tile"}
        on={!!on}
      />

      <ul aria-label="Six docs numbers in May against December">
        {SPARKLINES.map((k, i) => {
          const { x, y } = sparklinesTile(i)
          return (
            <li
              key={k.name}
              tabIndex={0}
              aria-label={k.reading}
              className={cn("absolute pt-4", focusRing)}
              style={{ left: x, top: y, width: T.w, height: T.h }}
              {...bind(i)}
            >
              <Rule at={AT[i]} duration={DRAW} className="top-0 bottom-auto" />
              <Label aria-hidden="true">{k.name}</Label>
              <p
                aria-hidden="true"
                className={cn(
                  "mt-3 -indent-1 text-[72px] leading-[72px] font-medium tracking-[-0.04em] transition-colors",
                  dim(i) && "text-muted-foreground"
                )}
              >
                <CountUp value={k.last} delay={AT[i]} duration={DRAW} format={k.format} />
              </p>
              <p aria-hidden="true" className={cn(note, "mt-2 text-muted-foreground")}>
                {k.change}
              </p>
            </li>
          )
        })}
      </ul>

      {SPARKLINES_POINTS.map((pts, i) => {
        const { x, y } = sparklinesTile(i)
        const color = SPARKLINES[i].right ? "var(--viz-lead)" : "var(--viz-contrast)"
        const last = pts[pts.length - 1]
        return (
          <Series key={i} x={x} y={y + BAND} w={T.w} h={T.h - BAND} at={AT[i]} duration={DRAW}>
            <g className={cn("transition-opacity", dim(i) && "opacity-30")}>
              {/* A pale area down to the line's zero, so a line scaled from zero reads as a height. */}
              <path
                d={`${path(pts)}V${y + SPARKLINES_LINE.base}H${x}Z`}
                style={{ fill: `color-mix(in oklab, ${color} 14%, var(--viz-paper))` }}
              />
              <path
                d={path(pts)}
                fill="none"
                strokeWidth={4}
                strokeLinejoin="miter"
                shapeRendering="geometricPrecision"
                stroke={color}
              />
            </g>
            <Point x={last.x} y={last.y} color={color} dim={dim(i)} />
          </Series>
        )
      })}
    </Frame>
  )
}
