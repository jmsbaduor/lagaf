import { IconExclamationTriangle } from "central-icons/IconExclamationTriangle"
import { IconKey1 } from "central-icons/IconKey1"
import { IconLock } from "central-icons/IconLock"
import { IconMagnifyingGlass } from "central-icons/IconMagnifyingGlass"
import { IconPageText } from "central-icons/IconPageText"
import { IconRocket } from "central-icons/IconRocket"
import { IconWebhooks } from "central-icons/IconWebhooks"

import { delay, focusRing, Frame, Header, smallLabelText, TOP, useReading, XAxis } from "@/canvas/kit"
import { cn } from "@/lib/utils"

import { BANDS, BLOCK_W, BLOCKS, path, type Page, PLOT_H, SESSIONS, STEPS, STUB, thousands, TOP_EXIT } from "./data"

// Each page wears an icon for what its endpoint does, drawn in chart px beside its path and sessions, in the small
// label face so the three fit a 180 block.
const ICONS = {
  auth: IconLock,
  keys: IconKey1,
  pages: IconPageText,
  search: IconMagnifyingGlass,
  deploys: IconRocket,
  webhooks: IconWebhooks,
  errors: IconExclamationTriangle,
} satisfies Record<Page, unknown>

// The plot fills the content width from TOP, four columns of pages (boxes in data.ts), the step names 12 under it.
const PLOT_W = 1296

// Bands are straight: level out of a page for 16, one straight run, level into the next. The row's marks are squares
// and straight edges, and a band that meets its pages level keeps each page's stack of bands a clean bar; a curve
// would be the one round thing here, and right-angle steps would pile the bands' vertical runs on one another.
type Band = (typeof BANDS)[number]
const edge = (b: Band, dy: number) => [
  [b.x0, b.y0 + dy],
  [b.x0 + STUB, b.y0 + dy],
  [b.x1 - STUB, b.y1 + dy],
  [b.x1, b.y1 + dy],
]
const bandPoints = (b: Band) => [...edge(b, 0), ...edge(b, b.h).reverse()].join(" ")
// Each band's top and bottom edges, as a 2px seam in the paper over every fill: it parts bands that leave or reach a
// page side by side, and rings one band where it crosses another (the 2px ring a point wears).
const seams = (b: Band) => [0, b.h].map((dy) => `M${edge(b, dy).join("L")}`).join("")

// The entrance is the sessions travelling: pages and bands draw in left to right, first page to last, as one wipe.
// Step names are read, so they don't move.
const DRAW_AT = 100
const DRAW = 900

const blocks = BLOCKS.flat()
const outOf = (key: string) => BANDS.filter((b) => b.from === key)
const named = (key: string) => blocks.find((b) => b.key === key)!

export default function Journeys() {
  const { active, bind, dim } = useReading<string>()
  const on = blocks.find((b) => b.key === active)

  return (
    <Frame>
      <Header
        title={`API readers head for ${TOP_EXIT.page}`}
        description={`May’s ${thousands(SESSIONS)} four-page API reference sessions, first page to last.`}
        hint={
          on ? (
            <>
              <span className="normal-case">{path(on.page)}</span>, {STEPS[on.step]}: {thousands(on.k)} sessions
            </>
          ) : (
            "Hover or focus a page"
          )
        }
        on={!!on}
      />

      {/* Pages and bands: one layer, so one wipe draws them in. A page that isn't read fades to 30% and its words
          turn to the ink; bands fade unless they join the read page. */}
      <div
        aria-hidden="true"
        className="viz-draw pointer-events-none absolute left-[72px]"
        style={{ top: TOP, width: PLOT_W, height: PLOT_H, ...delay(DRAW_AT, DRAW) }}
      >
        <svg className="absolute inset-0 size-full" viewBox={`0 0 ${PLOT_W} ${PLOT_H}`}>
          {BANDS.map((b) => (
            <polygon
              key={b.key}
              points={bandPoints(b)}
              shapeRendering="geometricPrecision"
              className={cn(
                "fill-viz-lead/35 transition-opacity",
                active !== null && b.from !== active && b.to !== active && "opacity-30"
              )}
            />
          ))}
          {BANDS.map((b) => (
            <path
              key={b.key}
              d={seams(b)}
              fill="none"
              strokeWidth={2}
              shapeRendering="geometricPrecision"
              style={{ stroke: "var(--viz-paper)" }}
            />
          ))}
        </svg>
        {blocks.map((b) => {
          const Icon = ICONS[b.page]
          return (
            <div key={b.key} className="absolute" style={{ left: b.x, top: b.y, width: BLOCK_W, height: b.h }}>
              <span className={cn("absolute inset-0 bg-viz-lead transition-opacity", dim(b.key) && "opacity-30")} />
              <div
                className={cn(
                  smallLabelText,
                  "relative mt-3 flex h-4 items-center gap-2 px-3 normal-case transition-colors",
                  dim(b.key) ? "text-foreground" : "text-viz-lead-ink"
                )}
              >
                <Icon size={16} className="shrink-0" />
                <p>{path(b.page)}</p>
                <p className="ml-auto">{thousands(b.k)}</p>
              </div>
            </div>
          )
        })}
      </div>

      <ul aria-label="May’s API reference sessions by page and step" className="absolute left-[72px]" style={{ top: TOP }}>
        {blocks.map((b) => (
          <li
            key={b.key}
            tabIndex={0}
            aria-label={`${path(b.page)}, ${STEPS[b.step].toLowerCase()}: ${thousands(b.k)} sessions${
              b.step < 3
                ? `, then ${outOf(b.key)
                    .map((x) => `${path(named(x.to).page)} ${thousands(x.k)}`)
                    .join(", ")}`
                : ""
            }`}
            className={cn("absolute", focusRing)}
            style={{ left: b.x, top: b.y, width: BLOCK_W, height: b.h }}
            {...bind(b.key)}
          />
        ))}
      </ul>

      <XAxis
        ticks={STEPS.map((s, c) => ({ at: 72 + BLOCKS[c][0].x, label: s, on: on?.step === c }))}
        y={TOP + PLOT_H}
        band={BLOCK_W}
      />
    </Frame>
  )
}
