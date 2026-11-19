// Row 13's numbers, made up to agree with rows 01 to 06; data.check.mjs proves it. Node runs this file as is.
import { ANSWER_BINS, BIN_S } from "../06-spreads/data.ts"
import { DEMO, READERS } from "../facts.ts"
import { SHIFT } from "../10-changes/data.ts"
import { AGENT_READS, AGENT_SHARE, AGENT_TYPES } from "../08-ranks/data.ts"

// ── Ranges ──────────────────────────────────────────────────────────────────────────────────────────────────────

/**
 * The time by which a share `q` of May's answers had landed, interpolated within its bin, by the rule the answer
 * spread uses for its median.
 */
export function rangesQuantile(q: number, bins: readonly number[] = ANSWER_BINS) {
  const total = bins.reduce((s, x) => s + x, 0)
  let below = 0
  for (const [i, n] of bins.entries()) {
    if (below + n >= total * q) return (i + (total * q - below) / n) * BIN_S
    below += n
  }
  return NaN
}

const tenths = (s: number) => Math.round(s * 10) / 10

/**
 * The fastest and slowest tenth of agent answers a month (p10 and p90), in seconds. December to April are made up:
 * wider and slower, narrowing unevenly. May's are read off May's distribution in row 06.
 */
const P10 = [1.1, 0.9, 0.8, 0.6, 0.5, tenths(rangesQuantile(0.1))]
const P90 = [5.8, 4.8, 3.7, 2.9, 2.1, tenths(rangesQuantile(0.9))]

/** One scale: 88px a second, so the second lines fall on the grid; heights round to 4, within 2px of exact. */
export const RANGES_PX = 88
export const RANGES_TICKS = [0, 1, 2, 3, 4, 5, 6]
const rangesPx = (s: number) => Math.round((s * RANGES_PX) / 4) * 4

export const RANGES = DEMO.months.map((month, i) => ({
  month,
  p10: P10[i],
  median: DEMO.answerTime[i],
  p90: P90[i],
  h10: rangesPx(P10[i]),
  hMedian: rangesPx(DEMO.answerTime[i]),
  h90: rangesPx(P90[i]),
}))

export const rangesSay = (r: (typeof RANGES)[number]) =>
  `${r.month}: ${r.p10.toFixed(1)}–${r.p90.toFixed(1)}s, median ${r.median.toFixed(1)}s`

// ── Dumbbell ──
/**
 * December agent page views by source, in millions, in READERS' order. They make December's 3.3M agents, and each
 * fits inside that source's December views (row 10's shift). Agents read llms.txt and MCP tools from the start, but
 * barely touched docs pages, where people were most of the reads.
 */
const DUMBBELL_DEC_AGENTS = [1.18, 0.71, 0.78, 0.09, 0.54]

/** 10px a point: 0% at 344, 100% at 1344, so every tick and every May share lands on the 4px grid. */
export const DUMBBELL_PX = 10
export const DUMBBELL_X0 = 344
export const DUMBBELL_DOT = 24
export const dumbbellX = (share: number) => DUMBBELL_X0 + share * DUMBBELL_PX
const round4 = (px: number) => Math.round(px / 4) * 4

export const dumbbellChange = (n: number) => `+${Math.round(n)} pts`

/**
 * Each source: its December views and agent views, December's agent share (exact and as read), May's share
 * (READERS), the change in points, and each dot's centre in frame px, the nearest 4px to exact.
 */
export const DUMBBELL = READERS.map((r, i) => {
  const views = SHIFT.find((s) => s.name === r.name)!.dec
  const agents = DUMBBELL_DEC_AGENTS[i]
  const exact = (agents / views) * 100
  const dec = Math.round(exact)
  return {
    name: r.name,
    views,
    agents,
    exact,
    dec,
    may: r.agents,
    change: r.agents - dec,
    decX: round4(dumbbellX(exact)),
    mayX: round4(dumbbellX(r.agents)),
  }
})

export const dumbbellReading = (s: (typeof DUMBBELL)[number]) => `${s.name}: ${s.dec}% → ${s.may}%`

// ── Bump ────────────────────────────────────────────────────────────────────────────────────────────────────────

/**
 * Agent reads by agent type, December to April, in millions. Each month makes DEMO's agent reads for it. Coding
 * agents start fourth and climb a place a month, taking the lead from chat assistants in March.
 */
const BUMP_EARLY: Record<(typeof AGENT_TYPES)[number]["name"], number[]> = {
  "Coding agents": [0.47, 1.02, 2.31, 4.38, 8.21],
  "Chat assistants": [1.12, 1.71, 2.64, 4.12, 6.37],
  "AI search": [0.76, 1.14, 1.66, 2.08, 2.61],
  "Support bots": [0.58, 0.71, 0.83, 1.03, 1.16],
  Evaluators: [0.21, 0.3, 0.31, 0.45, 0.48],
  "Other agents": [0.16, 0.22, 0.25, 0.34, 0.37],
}

export const BUMP_MONTHS = DEMO.months
/** The type the title names, drawn in the lead colour. */
export const BUMP_LEAD = "Coding agents"

/** Months 184 apart from 176 to 1096, on the 8px grid so a point's edges land on 4. */
export const BUMP_COL = 184
export const bumpX = (i: number) => 176 + i * BUMP_COL
/** Rank slots 104 apart: first at 264 (TOP + 32, under the axis's name), sixth at 784, over the month ticks. */
export const BUMP_PITCH = 104
export const bumpY = (rank: number) => 264 + (rank - 1) * BUMP_PITCH

const bumpReads = AGENT_TYPES.map((t) => ({
  name: t.name,
  // May is the type's share of May's agent reads, as row 08 ranks it.
  reads: [...BUMP_EARLY[t.name], (t.share / AGENT_SHARE) * AGENT_READS],
}))

/** Each type's reads a month, its rank each month, its points and its line. */
export const BUMP = bumpReads.map((t) => {
  const ranks = t.reads.map((v, i) => 1 + bumpReads.filter((o) => o.reads[i] > v).length)
  const pts = ranks.map((r, i) => [bumpX(i), bumpY(r)] as const)
  // A bump curve: each step leaves and lands level, turning midway between the months.
  const d = pts
    .map(([x, y], i) => {
      if (!i) return `M${x} ${y}`
      const [px, py] = pts[i - 1]
      const mx = (px + x) / 2
      return `C${mx} ${py} ${mx} ${y} ${x} ${y}`
    })
    .join("")
  return { ...t, ranks, pts, d }
})

export const bumpOrdinal = (n: number) => `${n}${["st", "nd", "rd"][n - 1] ?? "th"}`
export const bumpSay = (t: (typeof BUMP)[number]) =>
  `${t.name}: ${bumpOrdinal(t.ranks[0])} → ${bumpOrdinal(t.ranks[t.ranks.length - 1])}`
