// Row 10's numbers: how a figure changed, step by step (bridge), item by item (shift) and stage by stage (funnel).
// Derived from DEMO, or new demo numbers that contradict none of it; data.check.mjs proves them and every claim the
// copy makes. Plain TypeScript that names its imports in full, so Node runs it as is.
import { ANSWERED, QUESTIONS, SPLIT } from "../09-flows/data.ts"
import { DEMO } from "../facts.ts"

// ── Bridge ──────────────────────────────────────────────────────────────────────────────────────────────────────

/** 10px a million: 0 to 50M over 500px, gridlines every 10M, 100 apart. */
export const BRIDGE_PX = 10
export const BRIDGE_TICKS = [0, 10, 20, 30, 40, 50]
const round4 = (px: number) => Math.round(px / 4) * 4

// Sums in tenths of a million, whole numbers, so 21.7 + 1.8 is 23.5 exactly.
const tenths = (n: number) => Math.round(n * 10)
const A = DEMO.agents.map(tenths)
const P = DEMO.people.map(tenths)
const last = A.length - 1

type Kind = "total" | "agents" | "people"
const steps: { kind: Kind; tick: string; name: string; change: number }[] = [
  { kind: "total", tick: "Dec total", name: "Dec total", change: A[0] + P[0] },
  ...DEMO.months.slice(1).map((m, i) => ({ kind: "agents" as const, tick: m, name: `Agents, ${m}`, change: A[i + 1] - A[i] })),
  { kind: "people", tick: "Dec–May", name: "People, Dec–May", change: P[last] - P[0] },
  { kind: "total", tick: "May total", name: "May total", change: A[last] + P[last] },
]

/**
 * Each bar with its value in millions (a change for a step, the whole for a total), the running total it starts and
 * ends on, and those two edges in px above zero, each the nearest 4px to exact. A step runs from the running total
 * before it to the one after; a total runs from zero.
 */
export const BRIDGE = steps.map((s, i) => {
  const before =
    s.kind === "total" ? 0 : steps.slice(0, i).reduce((t, x) => (x.kind === "total" ? x.change : t + x.change), 0)
  const after = s.kind === "total" ? s.change : before + s.change
  return {
    ...s,
    value: s.change / 10,
    from: before / 10,
    to: after / 10,
    fromPx: round4((before / 10) * BRIDGE_PX),
    toPx: round4((after / 10) * BRIDGE_PX),
  }
})

/** "+1.8M" or "−0.2M" for a step, "21.7M" for a total. A count passes `neg`, so the fall says "−" from zero. */
export const signed = (n: number, kind: Kind, neg = n < 0) =>
  `${kind === "total" ? "" : neg ? "−" : "+"}${Math.abs(n).toFixed(1)}M`

// ── Shift ───────────────────────────────────────────────────────────────────────────────────────────────────────
/**
 * December page views by source, in millions, in DEMO.sources' order. They make December's 21.7M (3.3M agents and
 * 18.4M people). People held level and read mostly docs pages, so Docs pages is most of December. llms.txt was
 * published in August, so it is small but there; the MCP server went live in December, so MCP tools barely shows.
 */
const DECEMBER = [15.2, 2.3, 0.9, 0.1, 3.2]

export const shiftViews = (n: number) => `${n.toFixed(1)}M`

/**
 * One value scale for both months: 16px a million up from the zero line at 792, so the 10M lines fall 160 apart
 * and May's 30.6M sits under the 30M line's label. Every height is rounded to 4, so within 2px of exact.
 */
export const SHIFT_PX = 16
export const SHIFT_BASE = 792
export const SHIFT_TICKS = [0, 10, 20, 30]
export const shiftY = (v: number) => SHIFT_BASE - v * SHIFT_PX

/** December's axis and May's, on the 8px grid so a point's edges land on 4; 808 apart. */
export const DEC_X = 360
export const MAY_X = 1168
/** End labels are 176 wide and 16 tall on a 20 pitch, 24 out from each axis: December's run 160 to 336, May's 1192 to 1368. */
export const LABEL_W = 176
export const LABEL_H = 16
export const LABEL_PITCH = 20
export const LABEL_GAP = 24

const gridlines = SHIFT_TICKS.map(shiftY)

/**
 * Label centres for points at `ys`: each starts on its point; one that would cross a gridline steps 12 off it, away
 * from the line; then any that sit closer than the pitch join a group, centred on its points' mean and on the grid,
 * until none do. Order is kept, so each label stays beside its own point.
 */
export function spread(ys: readonly number[]) {
  const order = ys
    .map((y, i) => {
      const line = gridlines.find((g) => Math.abs(g - y) < LABEL_H / 2 + 4)
      return { i, y: line === undefined ? y : y >= line ? line + 12 : line - 12 }
    })
    .sort((a, b) => a.y - b.y)
  const groups = order.map((o) => ({ items: [o], top: o.y }))
  const place = (g: (typeof groups)[number]) => {
    const mean = g.items.reduce((s, o) => s + o.y, 0) / g.items.length
    g.top = round4(mean - ((g.items.length - 1) * LABEL_PITCH) / 2)
  }
  for (let k = 1; k < groups.length; ) {
    const [a, b] = [groups[k - 1], groups[k]]
    if (b.top >= a.top + a.items.length * LABEL_PITCH) k++
    else {
      a.items.push(...b.items)
      groups.splice(k, 1)
      place(a)
      k = 1
    }
  }
  const at: number[] = []
  for (const g of groups) g.items.forEach((o, j) => (at[o.i] = g.top + j * LABEL_PITCH))
  return at
}

const decY = DECEMBER.map((v) => round4(shiftY(v)))
const mayY = DEMO.sources.map((s) => round4(shiftY(s.views)))
const decLabel = spread(decY)
const mayLabel = spread(mayY)

/** Each source: its two values, its points' y, its labels' centres, and its line. */
export const SHIFT = DEMO.sources.map((s, i) => ({
  name: s.name,
  dec: DECEMBER[i],
  may: s.views,
  decY: decY[i],
  mayY: mayY[i],
  decLabel: decLabel[i],
  mayLabel: mayLabel[i],
  d: `M${DEC_X} ${decY[i]}L${MAY_X} ${mayY[i]}`,
}))

// ── Funnel ──────────────────────────────────────────────────────────────────────────────────────────────────────
/**
 * A median team's May questions (time saved's 1,425), stage by stage, to the 969 its docs answered with no one on
 * the team stepping in. Between them: questions whose search matched a docs page, and matched pages that held the
 * answer. What drops out at each step went to the team.
 */
const FUNNEL_STEPS = [
  { name: "Asked", n: QUESTIONS },
  { name: "Matched a docs page", n: 1311 },
  { name: "Page held the answer", n: 1102 },
  { name: SPLIT[0].name, n: ANSWERED },
]

/** 0.6px a question, so May's 1,425 run 856px from the shared baseline; each length rounds to the 4px grid. */
export const FUNNEL_PX = 0.6
export const count = (n: number) => new Intl.NumberFormat("en-US").format(Math.round(n))

/** Each stage: its count, its bar's length, and what it lost since the stage before, in questions and percent. */
export const FUNNEL = FUNNEL_STEPS.map((s, i) => {
  const prev = i ? FUNNEL_STEPS[i - 1].n : s.n
  const drop = prev - s.n
  const dropPct = Math.round((drop / prev) * 100)
  return {
    ...s,
    w: Math.round((s.n * FUNNEL_PX) / 4) * 4,
    prevW: Math.round((prev * FUNNEL_PX) / 4) * 4,
    drop,
    dropPct,
    dropLabel: i ? `−${count(drop)} · −${dropPct}%` : "",
  }
})
