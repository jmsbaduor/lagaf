// Row 05's numbers: DEMO's parts of a whole, and the rules that turn them into arcs, tiles and segments.
// It imports only facts.ts, so Node runs it as is; data.check.mjs proves that what is drawn matches DEMO.
import { DEMO, READERS } from "../facts.ts"

/** Parts are split by a 4px gap: each part gives its right and bottom 4px to it, so a whole of W lays out on W + 4. */
export const GAP = 4
export const round4 = (n: number) => Math.round(n / 4) * 4
const sum = (xs: readonly number[]) => xs.reduce((s, x) => s + x, 0)

// ── Formats: a ring ─────────────────────────────────────────────────────────────────────────────────────────────

/** Arcs clockwise from 12 o'clock, as fractions of the ring. Markdown and llms.txt are the lead, as in the waffle. */
export const FORMATS = DEMO.formats.map((f, i) => {
  const start = sum(DEMO.formats.slice(0, i).map((x) => x.share)) / 100
  return { ...f, start, end: start + f.share / 100, lead: f.name !== "Rendered HTML" }
})
/** What the ring's centre reads until a slice is read: the lead arcs' share, the waffle's 83. */
export const FORMAT_LEAD = sum(FORMATS.filter((f) => f.lead).map((f) => f.share))

// ── Sources: a treemap ──────────────────────────────────────────────────────────────────────────────────────────

/** The tiles fill 1296 by 556, so their cells lay out on 1300 by 560. */
export const MAP = { w: 1296 + GAP, h: 556 + GAP }
type Rect = { x: number; y: number; w: number; h: number }

/** Squarified treemap (Bruls, Huizing and van Wijk): lay a row along the short side while it keeps tiles squarer. */
export function squarify(values: number[], { x, y, w, h }: Rect): Rect[] {
  const k = (w * h) / sum(values)
  const areas = values.map((v) => v * k)
  // The worst aspect ratio in a row of areas laid along a side: the row is sum / side thick.
  const worst = (row: number[], side: number) => {
    const t = sum(row) / side
    return Math.max(...row.map((a) => Math.max((t * t) / a, a / (t * t))))
  }
  const out: Rect[] = []
  for (let i = 0; i < areas.length; ) {
    const side = Math.min(w, h)
    let n = 1
    while (i + n < areas.length && worst(areas.slice(i, i + n + 1), side) <= worst(areas.slice(i, i + n), side)) n++
    const row = areas.slice(i, i + n)
    const t = sum(row) / side
    let at = 0
    for (const a of row) {
      out.push(w >= h ? { x, y: y + at, w: t, h: a / t } : { x: x + at, y, w: a / t, h: t })
      at += a / t
    }
    if (w >= h) [x, w] = [x + t, w - t]
    else [y, h] = [y + t, h - t]
    i += n
  }
  return out
}

export const VIEWS = sum(DEMO.sources.map((s) => s.views))
/** May's agent share over every source: READERS' shares weighted by views (62, TRAFFIC.agentShare). */
export const AGENT_SHARE = Math.round(sum(DEMO.sources.map((s) => s.views * agentsOf(s.name))) / VIEWS)
function agentsOf(name: string) {
  return READERS.find((r) => r.name === name)?.agents ?? NaN
}

/** A tile's label: 20 in, a 16 name and a 40 number 4 apart, so its ink ends 80 down. It shows where it fits. */
export const TILE_LABEL = { w: 160, h: 80, pad: 20 }

/**
 * Tiles, largest first. Cells are exact; a tile's edges are its cell's rounded to the 4px grid, less the gap. Its
 * agent part runs from its top, as tall as its agent share, rounded to 4, so the label always sits on it. The
 * rounding shows most in MCP tools: its people are 2% of a 104px tile, 2.1px, drawn as the grid's least, 4px.
 */
export const TILES = (() => {
  const byViews = [...DEMO.sources].sort((a, b) => b.views - a.views)
  return squarify(
    byViews.map((s) => s.views),
    { x: 0, y: 0, ...MAP }
  ).map((exact, i) => {
    const s = byViews[i]
    const x = round4(exact.x)
    const y = round4(exact.y)
    const w = round4(exact.x + exact.w) - x - GAP
    const h = round4(exact.y + exact.h) - y - GAP
    const agents = agentsOf(s.name)
    const labelled = w >= TILE_LABEL.w && h >= TILE_LABEL.h + TILE_LABEL.pad
    return { name: s.name, views: s.views, agents, exact, x, y, w, h, agentH: round4((h * agents) / 100), labelled }
  })
})()

// ── Teams: one segmented bar ────────────────────────────────────────────────────────────────────────────────────

/** The bar spans the content width (1296), so its segments lay out on 1300: each edge its running share, rounded. */
export const BAR_W = 1296 + GAP
export const SEGMENTS = DEMO.teams.map((t, i) => {
  const before = sum(DEMO.teams.slice(0, i).map((x) => x.share))
  const x = round4((BAR_W * before) / 100)
  // Under the bracket for drafting with agents, a segment is named by what follows "Draft with agents, ".
  const short = t.name.split(", ").at(-1) ?? t.name
  return { ...t, short, x, w: round4((BAR_W * (before + t.share)) / 100) - x - GAP }
})
/** The bracket spans the teams that draft with agents: the dot matrix's 83. */
const drafting = SEGMENTS.filter((s) => s.name.startsWith("Draft with agents"))
export const DRAFT = { share: sum(drafting.map((s) => s.share)), w: Math.max(...drafting.map((s) => s.x + s.w)) }
