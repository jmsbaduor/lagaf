import type { CSSProperties } from "react"

import { Label, TOP } from "@/canvas/kit"
import type { Knobs } from "@/components/stage"
import { cn } from "@/lib/utils"
import "./mark.css"

/*
 * Each mark is a few square cells on a 2, 3 or 4 cell grid inside a 16-unit box. At 16 px a unit is one pixel and
 * every cell lands on whole pixels, so the same component draws the favicon, the loader, the lockup and the card.
 */
type Tone = "lead" | "ink" | "deep" | "panel" | "track" | "r2" | "r4"
type Cell = {
  c: number
  r: number
  tone: Tone
  /** Its turn in the loader. */
  at?: number
  /** False: the cell shows only while the loader runs. */
  rest?: boolean
  /** The cell the scrub loop moves. */
  move?: boolean
}
type Loop = { kind: "sweep" | "fill" | "glow" | "scrub"; dur: number; step: number }
/** grid: columns and rows; cell and gap in units. A grid narrower than 16 units is centred where that lands on whole px. */
type Spec = { grid: [cols: number, rows: number]; cell: number; gap: number; cells: Cell[]; base?: Tone; loop: Loop }

export type MarkProps = {
  /** Px; a multiple of 16 keeps every cell on whole pixels. */
  size?: number
  /** Run the loader. */
  animate?: boolean
  /** A real mark gets a label (role="img"); without one it is decorative. */
  label?: string
  /** Draw the empty cell slots: the construction drawing. */
  slots?: boolean
  x?: number
  y?: number
  className?: string
  style?: CSSProperties
}

function Mark({ spec, size = 16, animate, label, slots, x, y, className, style }: MarkProps & { spec: Spec }) {
  const { cell, gap, grid: [cols, rows] } = spec
  const pitch = cell + gap
  const centre = (n: number) => {
    const pad = (16 - (n * pitch - gap)) / 2
    return Number.isInteger((pad * size) / 16) ? pad : 0
  }
  const at = (c: Pick<Cell, "c" | "r">) => ({ x: c.c * pitch, y: c.r * pitch, width: cell, height: cell })
  const grid = Array.from({ length: cols * rows }, (_, i) => ({ c: i % cols, r: Math.floor(i / cols) }))

  return (
    <svg
      viewBox={`${-centre(cols)} ${-centre(rows)} 16 16`}
      width={size}
      height={size}
      x={x}
      y={y}
      shapeRendering="crispEdges"
      data-loop={spec.loop.kind}
      className={cn("shrink-0 overflow-visible", animate && "mk-on", className)}
      style={{ "--mk-dur": `${spec.loop.dur}ms`, "--mk-pitch": `${pitch}px`, ...style } as CSSProperties}
      {...(label ? { role: "img", "aria-label": label } : { "aria-hidden": true })}
    >
      {slots &&
        grid.map((s) => (
          <rect key={`s${s.c}${s.r}`} className="mk-slot" vectorEffect="non-scaling-stroke" {...at(s)} />
        ))}
      {spec.base && spec.cells.map((c) => <rect key={`b${c.c}${c.r}`} className={`mk-${spec.base}`} {...at(c)} />)}
      {spec.cells.map((c) => (
        <rect
          key={`c${c.c}${c.r}`}
          className={`mk-cell mk-${c.tone}`}
          data-rest={c.rest === false ? "off" : undefined}
          data-move={c.move || undefined}
          style={{ "--mk-at": `${(c.at ?? 0) * spec.loop.step}ms` } as CSSProperties}
          {...at(c)}
        />
      ))}
    </svg>
  )
}

/** A mark component that carries its spec, so the sheet's captions read the grid and the loop from it. */
const withSpec = (spec: Spec) => Object.assign((props: MarkProps) => <Mark spec={spec} {...props} />, { spec })
type MarkComponent = ReturnType<typeof withSpec>

/** The Timeline's pixel field cut down to five cells, sparse and pale at the left, dense and deep at the right. */
export const MarkField = withSpec({
  grid: [4, 4], cell: 3, gap: 1,
  cells: [
    { c: 0, r: 3, tone: "panel", at: 0 },
    { c: 1, r: 1, tone: "r2", at: 1 },
    { c: 2, r: 2, tone: "lead", at: 2 },
    { c: 3, r: 2, tone: "r4", at: 3 },
    { c: 3, r: 0, tone: "deep", at: 3 },
  ],
  loop: { kind: "sweep", dur: 1600, step: 120 },
})

/** A waffle of four cells, three filled. The loader fills them in turn, so the empty cell travels round. */
export const MarkShare = withSpec({
  grid: [2, 2], cell: 7, gap: 2,
  base: "track",
  cells: [
    { c: 0, r: 1, tone: "lead", at: 0 },
    { c: 0, r: 0, tone: "lead", at: 1 },
    { c: 1, r: 0, tone: "lead", at: 2, rest: false },
    { c: 1, r: 1, tone: "lead", at: 3 },
  ],
  loop: { kind: "fill", dur: 1600, step: 400 },
})

/** A line chart, one cell per point: history in ink, the latest value in the accent. */
export const MarkSparkline = withSpec({
  grid: [4, 4], cell: 3, gap: 1,
  cells: [
    { c: 0, r: 3, tone: "ink", at: 0 },
    { c: 1, r: 1, tone: "ink", at: 1 },
    { c: 2, r: 2, tone: "ink", at: 2 },
    { c: 3, r: 0, tone: "lead", at: 3 },
  ],
  loop: { kind: "sweep", dur: 1400, step: 140 },
})

/** One lit cell over a baseline of three. The loader moves it along the axis. */
export const MarkAxis = withSpec({
  grid: [3, 3], cell: 4, gap: 2,
  cells: [
    { c: 0, r: 2, tone: "ink" },
    { c: 1, r: 2, tone: "ink" },
    { c: 2, r: 2, tone: "ink" },
    { c: 1, r: 0, tone: "lead", move: true },
  ],
  loop: { kind: "scrub", dur: 1600, step: 0 },
})

/**
 * The l of lagaf as a bar of four cells, closed by a full stop in the accent. No gap, so the bar reads as one stroke
 * (with gaps it read as a menu's dots). The loader builds it from the foot.
 */
export const MarkLetter = withSpec({
  grid: [3, 4], cell: 4, gap: 0,
  cells: [
    { c: 0, r: 3, tone: "ink", at: 0 },
    { c: 0, r: 2, tone: "ink", at: 1 },
    { c: 0, r: 1, tone: "ink", at: 2 },
    { c: 0, r: 0, tone: "ink", at: 3 },
    { c: 2, r: 3, tone: "lead", at: 4 },
  ],
  loop: { kind: "sweep", dur: 1400, step: 160 },
})

/** Two cells: the ink stays, the accent follows the theme. The loader passes the accent between them. */
export const MarkPair = withSpec({
  grid: [2, 2], cell: 7, gap: 2,
  base: "ink",
  cells: [
    { c: 0, r: 1, tone: "lead", at: 0, rest: false },
    { c: 1, r: 0, tone: "lead", at: 1 },
  ],
  loop: { kind: "glow", dur: 1200, step: 600 },
})

/** The word set beside the mark. Geist's l is 0.71 em tall, so the size puts its top level with the mark's. */
export function Lockup({ Mark, size = 48, className }: { Mark: MarkComponent; size?: number; className?: string }) {
  return (
    <p
      className={cn("font-medium leading-none tracking-[-0.035em] whitespace-nowrap", className)}
      style={{ fontSize: Math.round(size / 0.71) }}
    >
      <Mark size={size} className="inline align-baseline" style={{ marginRight: size / 4 }} />
      lagaf
    </p>
  )
}

/** The 1200 by 630 card, as SVG so it can later be rendered to an image as is. */
export function OgCard({ Mark, title, className }: { Mark: MarkComponent; title: [string, string]; className?: string }) {
  return (
    <svg
      viewBox="0 0 1200 630"
      role="img"
      aria-label={`Card: lagaf, ${title.join(" ")}`}
      className={cn("font-sans", className)}
    >
      <rect width="1200" height="630" className="fill-background" />
      <Mark size={64} x={80} y={80} />
      <text x={160} y={144} className="fill-foreground" fontSize={90} fontWeight={500} letterSpacing="-0.035em">
        lagaf
      </text>
      {title.map((line, i) => (
        <text key={line} x={76} y={470 + i * 80} className="fill-foreground" fontSize={72} letterSpacing="-0.03em">
          {line}
        </text>
      ))}
      <Mark size={320} x={800} y={230} />
    </svg>
  )
}

/** The stage's bottom bar: the large mark at rest or running its loader. */
export const knobs = {
  mark: { type: "choice", label: "Mark", value: "Static", options: ["Static", "Loading"] },
} as const satisfies Knobs

/** A tile in a fixed scheme, so light and dark show side by side in either theme. */
const scheme = (s: "light" | "dark") => ({ colorScheme: s })

/**
 * One mark's sheet, the same for all six marks so they compare at a glance. Columns of 336, 160 and 640, 80 apart,
 * in two bands: the construction, the touch icons and the card (336 tall), then the lockup, the favicons and the
 * loader (160 tall). Every caption sits 16 under its tile and the bands are 32 apart, so the sheet ends on 824.
 */
export function Sheet({ Mark, name, loading }: { Mark: MarkComponent; name: string; loading: boolean }) {
  const { grid, loop } = Mark.spec
  return (
    <div
      className="viz-fade absolute left-[72px] grid w-[1296px] grid-cols-[336px_160px_640px] gap-x-20 gap-y-8"
      style={{ top: TOP }}
    >
      {/* The construction: the mark on its cell grid, at 320 so a half-unit centring lands on whole pixels. */}
      <div>
        <div className="grid size-[336px] place-items-center ring-1 ring-line">
          <Mark size={320} slots animate={loading} label={name} />
        </div>
        <Label className="mt-4">
          Grid, {grid[0]} by {grid[1]}
        </Label>
      </div>

      <div>
        <div className="flex flex-col gap-4">
          {(["light", "dark"] as const).map((s) => (
            <div key={s} className="grid size-40 place-items-center bg-background ring-1 ring-line" style={scheme(s)}>
              <Mark size={96} />
            </div>
          ))}
        </div>
        <Label className="mt-4">Touch icon, 180</Label>
      </div>

      <div>
        <OgCard Mark={Mark} title={["From pilot", "to every team"]} className="block h-[336px] w-[640px] ring-1 ring-line" />
        <Label className="mt-4">Card, 1200 by 630</Label>
      </div>

      <div>
        <div className="grid h-40 place-items-center bg-well">
          {/* A fixed box on the grid; the mark and the word centre inside it. */}
          <Lockup Mark={Mark} size={48} className="h-20 w-[224px] text-center leading-20" />
        </div>
        <Label className="mt-4">Lockup, Geist Medium</Label>
      </div>

      {/* Favicons at 1:1, light row over dark row. */}
      <div>
        <div className="grid grid-cols-2 gap-4">
          {(["light", "dark"] as const).flatMap((s) =>
            [16, 32].map((size) => (
              <div
                key={`${s}${size}`}
                className="grid size-[72px] place-items-center bg-surface-1 ring-1 ring-line"
                style={scheme(s)}
              >
                <Mark size={size} />
              </div>
            ))
          )}
        </div>
        <Label className="mt-4">Favicon, 16 and 32</Label>
      </div>

      {/* The loader at three sizes, the smallest as an inline loading state, then on dark. */}
      <div>
        <div aria-hidden="true" className="flex h-40 items-center gap-12 bg-well pl-12">
          <Mark size={64} animate />
          <Mark size={32} animate />
          <p className="flex w-32 items-center gap-2 text-[16px] leading-6 text-muted-foreground">
            <Mark size={16} animate />
            Loading chart
          </p>
          {/* Inset, so the dark tile keeps an edge on a dark page and ends flush with the strip. */}
          <div className="ml-auto grid size-40 place-items-center bg-background ring-1 ring-line ring-inset" style={scheme("dark")}>
            <Mark size={64} animate />
          </div>
        </div>
        <Label className="mt-4">Loader, {loop.dur / 1000}s loop</Label>
      </div>
    </div>
  )
}
