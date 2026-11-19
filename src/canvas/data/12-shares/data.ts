// Row 12's numbers. Plain TypeScript that names facts.ts in full, so Node runs it; data.check.mjs asserts each one.
import { DEMO, READERS, TRAFFIC } from "../facts.ts"

// ── Ribbons ──

const RIBBONS_LAST = DEMO.months.length - 1
const ribbonsRound4 = (n: number) => Math.round(n / 4) * 4

/**
 * Two columns at the content box's far left and right, 256 wide, standing on 828. In Share both are 564 tall,
 * 5.64px a point; in Count May is 564 and December its total at the same 11.75px a million.
 */
export const RIBBONS_COL_W = 256
export const RIBBONS_H = 564
export const RIBBONS_BASE = 828
export const RIBBONS_X0 = 72 + RIBBONS_COL_W
export const RIBBONS_X1 = 1368 - RIBBONS_COL_W
export const RIBBONS_PX_POINT = RIBBONS_H / 100
export const RIBBONS_PX_M = RIBBONS_H / (DEMO.agents[RIBBONS_LAST] + DEMO.people[RIBBONS_LAST])

export type RibbonsMeasure = "Share" | "Count"
export type RibbonsReader = "agents" | "people"
export const RIBBONS_READERS = ["agents", "people"] as const

/**
 * December and May. Agents draw on top, people under them; the agents' height rounds to the grid and people take
 * the rest, so each column is whole.
 */
export const RIBBONS_COLS = [0, RIBBONS_LAST].map((i) => {
  const agents = DEMO.agents[i]
  const people = DEMO.people[i]
  const total = agents + people
  const share = (agents / total) * 100
  return {
    month: DEMO.months[i],
    name: i ? "May" : "December",
    agents,
    people,
    total,
    share: { agents: share, people: 100 - share },
    h: {
      Share: { total: RIBBONS_H, agents: ribbonsRound4(share * RIBBONS_PX_POINT) },
      Count: { total: ribbonsRound4(total * RIBBONS_PX_M), agents: ribbonsRound4(agents * RIBBONS_PX_M) },
    },
  }
})

/** A part's top and bottom in frame px, in a measure. */
export function ribbonsPart(c: (typeof RIBBONS_COLS)[number], m: RibbonsMeasure, r: RibbonsReader) {
  const top = RIBBONS_BASE - c.h[m].total
  const mid = top + c.h[m].agents
  return r === "agents" ? { top, bottom: mid } : { top: mid, bottom: RIBBONS_BASE }
}

/**
 * A ribbon from December's part to May's, in frame px: its ends are the parts' edges, and each edge leaves and
 * arrives level, turning at the middle (a cubic with both handles at the midpoint's x).
 */
export function ribbonsPath(m: RibbonsMeasure, r: RibbonsReader) {
  const a = ribbonsPart(RIBBONS_COLS[0], m, r)
  const b = ribbonsPart(RIBBONS_COLS[1], m, r)
  const [x0, x1] = [RIBBONS_X0, RIBBONS_X1]
  const xm = (x0 + x1) / 2
  return (
    `M${x0},${a.top}C${xm},${a.top} ${xm},${b.top} ${x1},${b.top}` +
    `L${x1},${b.bottom}C${xm},${b.bottom} ${xm},${a.bottom} ${x0},${a.bottom}Z`
  )
}

export const ribbonsMillions = (n: number) => `${n.toFixed(1)}M`

// ── Rings ──

/**
 * Each source's agent share of its May page views (READERS) with those views (DEMO.sources), highest share first,
 * so the rings step down and the one source people still lead comes last.
 */
export const RINGS = READERS.map((r) => ({
  name: r.name,
  share: r.agents,
  views: DEMO.sources.find((s) => s.name === r.name)?.views ?? 0,
})).sort((a, b) => b.share - a.share)

/** Every source together: the views, and the agent share they weight to (TRAFFIC's 62%). */
export const RINGS_VIEWS = RINGS.reduce((n, r) => n + r.views, 0)
export const RINGS_ALL = Math.round((RINGS.reduce((n, r) => n + (r.views * r.share) / 100, 0) / RINGS_VIEWS) * 100)
export const RINGS_TOTAL = TRAFFIC.pageViews.format(RINGS_VIEWS)

/** Sources where agents are most of the readers (the title's count). */
export const RINGS_LED = RINGS.filter((r) => r.share > 50).length

/**
 * Five rings 240 across, 24 apart, fill the 1296 content width: ring i's box starts at 72 + 264i and the last ends
 * on 1368. Each band is 32 thick, so its hole is 176, room for the share at 64px.
 */
export const RINGS_D = 240
export const RINGS_GAP = 24
export const RINGS_THICK = 32
export const ringsX = (i: number) => 72 + i * (RINGS_D + RINGS_GAP)

/** The all-sources bar spans the content width, 1296; its agent part is the nearest 4px to its share. */
export const RINGS_BAR = 1296
export const RINGS_BAR_LEAD = Math.round((RINGS_BAR * RINGS_ALL) / 100 / 4) * 4

export const ringsViews = (v: number) => `${v}M May views`
export const ringsReading = (name: string, share: number) => `${name}: ${share}% agents`

// ── Icon count ──
// May's page views as icons, one per million, agents first. Each count is its views rounded, and the two still make
// the month's whole.
const ICON_COUNT_MAY = DEMO.months.length - 1

export const ICON_COUNT = (
  [
    { id: "agents", label: "Agents", views: DEMO.agents[ICON_COUNT_MAY] },
    { id: "people", label: "People", views: DEMO.people[ICON_COUNT_MAY] },
  ] as const
).map((g) => ({ ...g, icons: Math.round(g.views) }))

export const ICON_COUNT_TOTAL = ICON_COUNT.reduce((s, g) => s + g.icons, 0)

/** Each icon's group and its place in the group, in reading order: the agents' icons, then the people's. */
export const ICON_COUNT_ICONS = ICON_COUNT.flatMap((g) => Array.from({ length: g.icons }, (_, i) => ({ id: g.id, i })))

/** The hint while a group is read, e.g. "Agents: 30M of 48M". */
export const iconCountReading = (g: (typeof ICON_COUNT)[number]) => `${g.label}: ${g.icons}M of ${ICON_COUNT_TOTAL}M`

// Twelve 108px icon boxes edge to edge span the data area's 1296; four rows of them run from TOP to 664. Each icon
// draws at 96 in its box, so the glyphs keep a gap. Agents fill two rows and half the third, so the people's
// readout, under column six, starts under their first icon.
export const ICON_COUNT_COLS = 12
export const ICON_COUNT_BOX = 108
export const ICON_COUNT_GLYPH = 96
