// Row 15's numbers: the headline numbers against Q2 goals, made up to agree with TRAFFIC and DEMO; data.check.mjs
// proves it. Node runs this file as is.
import { DEMO, demoAgentShare, demoTotal, pct, sec, TRAFFIC } from "../facts.ts"

// ── Bullets ─────────────────────────────────────────────────────────────────────────────────────────────────────

/** Every bullet's track is 896 wide; positions round to the 4px grid, each within 2px of exact. */
export const BULLETS_TRACK = 896
export const bulletsGrid = (px: number) => Math.round(px / 4) * 4

export const BULLETS_BANDS = ["Behind", "On track", "Ahead"] as const
export const BULLETS_TITLE = "Three of four Q2 goals met"

/**
 * Each headline number in May against the goal set for Q2, with two band edges (behind to on track, on track to
 * ahead) and the scale it is drawn on, from its left end to its right. Answer time is lower-is-better, so its scale
 * runs from 2.0s down to 0s: a shorter time is a longer bar, and ahead still reads to the right.
 */
const KPIS = [
  { ...TRAFFIC.agentShare, goal: 58, edges: [54, 66], scale: [0, 80], lower: false },
  {
    ...TRAFFIC.answerTime,
    value: DEMO.answerTime[DEMO.answerTime.length - 1],
    goal: 1.0,
    edges: [1.3, 0.9],
    scale: [2, 0],
    lower: true,
  },
  { ...TRAFFIC.pageViews, goal: 52, edges: [46, 56], scale: [0, 64], lower: false },
  { ...TRAFFIC.teams, goal: 9200, edges: [8400, 9600], scale: [0, 12800], lower: false },
] as const

/** A value's exact place along its track, in px from the left end. */
export const bulletsAt = (scale: readonly [number, number], v: number) =>
  ((v - scale[0]) / (scale[1] - scale[0])) * BULLETS_TRACK

export const BULLETS = KPIS.map((k) => {
  const at = (v: number) => bulletsAt(k.scale, v)
  // Tick labels keep the reading's units, without the teams' "+"; seconds keep one decimal, but zero is "0s".
  const tick = k.lower
    ? (n: number) => (n ? `${n.toFixed(1)}s` : "0s")
    : (n: number) => k.format(n).replace("+", "")
  return {
    tag: k.tag,
    value: k.value,
    format: k.format,
    goal: k.goal,
    edges: k.edges,
    scale: k.scale,
    lower: k.lower,
    met: k.lower ? k.value <= k.goal : k.value >= k.goal,
    /** 0 behind, 1 on track, 2 ahead: where the value falls, by its place on the track. */
    band: at(k.value) < at(k.edges[0]) ? 0 : at(k.value) < at(k.edges[1]) ? 1 : 2,
    /** Px from the track's left end, on the grid: the bar's end, the goal tick's centre and the two band edges. */
    barPx: bulletsGrid(at(k.value)),
    goalPx: bulletsGrid(at(k.goal)),
    edgePx: k.edges.map((e) => bulletsGrid(at(e))),
    ticks: [k.scale[0], ...k.edges, k.scale[1]].map(tick),
    goalLabel: tick(k.goal),
    reading: `${k.tag}: ${k.format(k.value)}, goal ${tick(k.goal)}`,
  }
})

export const bulletsMet = BULLETS.filter((b) => b.met).length

// ── Sparklines ──────────────────────────────────────────────────────────────────────────────────────────────────

const million = (n: number) => `${n.toFixed(1)}M`
const times = (n: number) => `${n.toFixed(2)}×`
const each = (f: (i: number) => number) => DEMO.months.map((_, i) => f(i))

/** Six numbers, each with its six months and the way it should move (views and share up, answer time down). */
export const SPARKLINES = [
  { name: "Page views", values: each(demoTotal), format: million, better: "up" },
  { name: "Agent views", values: each((i) => DEMO.agents[i]), format: million, better: "up" },
  { name: "People views", values: each((i) => DEMO.people[i]), format: million, better: "up" },
  { name: "Agent share", values: each(demoAgentShare), format: pct, better: "up" },
  { name: "Answer time", values: each((i) => DEMO.answerTime[i]), format: sec, better: "down" },
  { name: "Agent views per person view", values: each((i) => DEMO.agents[i] / DEMO.people[i]), format: times, better: "up" },
].map((k) => {
  const first = k.values[0]
  const last = k.values[k.values.length - 1]
  const up = last > first
  return {
    ...k,
    first,
    last,
    up,
    right: up === (k.better === "up"),
    change: `${up ? "Up" : "Down"} from ${k.format(first)} in December`,
    reading: `${k.name}: ${k.format(last)}, ${up ? "up" : "down"} from ${k.format(first)}`,
  }
})
export const SPARKLINES_RIGHT = SPARKLINES.filter((k) => k.right).length

/**
 * Six tiles, three across the content box (400 wide, 48 apart: 72 to 1368) and two down from TOP (276 tall, 44
 * apart: 232 to 828). In a tile: its rule on the top edge, the name at 16, the May value (72/72) at 44, the change
 * (22/28) at 124, then the line. The line runs from the tile's left edge, 78 a month, so May's point and its 2px ring
 * end on the tile's right edge. Each line is scaled from zero to its own highest month over 96px, from 264 up to 168,
 * so a number that held level draws flat.
 */
export const SPARKLINES_TOP = 232
export const SPARKLINES_TILE = { w: 400, h: 276, gapX: 48, gapY: 44 }
export const SPARKLINES_STEP = 78
export const SPARKLINES_LINE = { top: 168, base: 264 }

export const sparklinesTile = (i: number) => ({
  x: 72 + (i % 3) * (SPARKLINES_TILE.w + SPARKLINES_TILE.gapX),
  y: SPARKLINES_TOP + Math.floor(i / 3) * (SPARKLINES_TILE.h + SPARKLINES_TILE.gapY),
})

/** Each month's point in frame px, rounded to whole pixels. */
export const SPARKLINES_POINTS = SPARKLINES.map((k, i) => {
  const { x, y } = sparklinesTile(i)
  const max = Math.max(...k.values)
  const range = SPARKLINES_LINE.base - SPARKLINES_LINE.top
  return k.values.map((v, m) => ({
    x: x + m * SPARKLINES_STEP,
    y: y + Math.round(SPARKLINES_LINE.base - (v / max) * range),
  }))
})
