// Row 09's numbers: API reference journeys, the eval's accuracy on a dial, and a team's time back from its docs.
// Journeys and time saved are new demo numbers that contradict none of DEMO; the dial draws EVALS. data.check.mjs
// asserts every one, and every claim the copy makes. Plain TypeScript that names facts.ts in full, so Node runs it.
import { EVALS } from "../facts.ts"

const sum = (xs: readonly number[]) => xs.reduce((s, x) => s + x, 0)
export const round4 = (n: number) => Math.round(n / 4) * 4

// ── Journeys: four pages of an API reference session ────────────────────────────────────────────────────────────

/** Sessions in thousands; 0.4px a thousand, so a 4px grid step is 10K sessions and May's 1.2M stand 484px tall. */
export const PX_PER_K = 0.4
export const thousands = (k: number) => (k >= 1000 ? `${(k / 1000).toFixed(1)}M` : `${k}K`)

/** The pages, by what the path names. Each block wears its path in mono and an icon (in journeys.tsx). */
export type Page = "auth" | "keys" | "pages" | "search" | "deploys" | "webhooks" | "errors"
export const path = (p: Page) => `/api/${p}`

/** Four steps, left to right; each column's blocks in their order down the page. */
export const STEPS = ["First page", "Second page", "Third page", "Last page"] as const
const ORDER: Page[][] = [
  ["auth", "pages", "search"],
  ["keys", "deploys", "search", "pages"],
  ["deploys", "webhooks", "pages", "errors"],
  ["webhooks", "deploys", "errors"],
]

/**
 * May's API reference sessions that read four pages, as [from, to, thousands] for each step on. What reaches a page
 * leaves it at the next step, so only the first and last columns are ends.
 */
export const FLOWS: [Page, Page, number][][] = [
  [
    ["auth", "keys", 309],
    ["auth", "deploys", 122],
    ["auth", "pages", 37],
    ["pages", "keys", 44],
    ["pages", "deploys", 211],
    ["pages", "search", 136],
    ["search", "deploys", 59],
    ["search", "pages", 289],
  ],
  [
    ["keys", "deploys", 274],
    ["keys", "errors", 79],
    ["deploys", "webhooks", 279],
    ["deploys", "errors", 113],
    ["search", "pages", 136],
    ["pages", "deploys", 80],
    ["pages", "webhooks", 59],
    ["pages", "errors", 187],
  ],
  [
    ["deploys", "webhooks", 234],
    ["deploys", "errors", 120],
    ["webhooks", "deploys", 299],
    ["webhooks", "errors", 39],
    ["pages", "deploys", 97],
    ["pages", "errors", 39],
    ["errors", "deploys", 262],
    ["errors", "webhooks", 117],
  ],
]

/**
 * Boxes are in the plot's px, from the content box's left and the plot's top (the kit's TOP, where journeys.tsx
 * puts it). Columns are 180 wide and 192 apart, so four fill the content width (4 × 180 + 3 × 192 = 1296).
 */
export const BLOCK_W = 180
const COL_GAP = 192
const colX = (c: number) => c * (BLOCK_W + COL_GAP)
/** A band leaves a block level for 16, runs straight to 16 short of the next, and arrives level. */
export const STUB = 16
/** Blocks in a column are spread so every column spans the same height: 24 apart in four, 36 in three. */
export const COLUMN_SPAN = 72

const drawn = (k: number) => round4(k * PX_PER_K)

/** Each block: its sessions (what reaches it, or what leaves it in the first column) and its box. */
export const BLOCKS = ORDER.map((pages, c) => {
  const gap = COLUMN_SPAN / (pages.length - 1)
  let y = 0
  return pages.map((page) => {
    const into = c ? FLOWS[c - 1].filter(([, to]) => to === page) : []
    const out = c < 3 ? FLOWS[c].filter(([from]) => from === page) : []
    const k = sum((c ? into : out).map(([, , n]) => n))
    // A block is as tall as its bands, drawn: they stack on it edge to edge on both sides.
    const h = sum((c ? into : out).map(([, , n]) => drawn(n)))
    const block = {
      key: `${c}-${page}`,
      step: c,
      page,
      k,
      x: colX(c),
      y,
      h,
      inK: sum(into.map(([, , n]) => n)),
      outK: sum(out.map(([, , n]) => n)),
      inH: sum(into.map(([, , n]) => drawn(n))),
      outH: sum(out.map(([, , n]) => drawn(n))),
    }
    y += h + gap
    return block
  })
})

const blockAt = (c: number, page: Page) => {
  const b = BLOCKS[c].find((x) => x.page === page)
  if (!b) throw new Error(`No ${page} in column ${c}`)
  return b
}

/**
 * Bands, stacked edge to edge on each block in the order of the blocks they come from or go to, so they cross as
 * little as they can. Their thickness is the sessions, drawn to the 4px grid; it is the same at both ends.
 */
export const BANDS = FLOWS.flatMap((step, c) => {
  const rank = (col: number, page: Page) => ORDER[col].indexOf(page)
  return step.map(([from, to, k]) => {
    const a = blockAt(c, from)
    const b = blockAt(c + 1, to)
    const above = (xs: [Page, Page, number][]) => sum(xs.map(([, , n]) => drawn(n)))
    const y0 = a.y + above(step.filter(([f, t]) => f === from && rank(c + 1, t) < rank(c + 1, to)))
    const y1 = b.y + above(step.filter(([f, t]) => t === to && rank(c, f) < rank(c, from)))
    return { key: `${a.key}>${b.key}`, from: a.key, to: b.key, k, h: drawn(k), x0: a.x + BLOCK_W, x1: b.x, y0, y1 }
  })
})

/** May's sessions: what entered at a first page, which is what left from a last page. */
export const SESSIONS = sum(BLOCKS[0].map((b) => b.k))
/** Where most sessions end: the tallest last-page block (the title names it). */
export const TOP_EXIT = BLOCKS[3].reduce((a, b) => (b.k > a.k ? b : a))
/** The plot's height: every column ends here (the step names sit 12 under it). */
export const PLOT_H = Math.max(...BLOCKS.map((col) => col.at(-1)!.y + col.at(-1)!.h))

// ── Gauge: the eval's accuracy on a half dial ───────────────────────────────────────────────────────────────────

/** Eval accuracy, before and after llms.txt (EVALS, as eval-rows draws it), on a dial from 95% to 100%. */
const ACCURACY = EVALS.find((e) => e.kind === "accuracy")!
export const DIAL = { from: 95, to: 100, before: ACCURACY.before, after: ACCURACY.after }
/** Where a value sits along the dial, 0 at its left end to 1 at its right. */
export const dialAt = (v: number) => (v - DIAL.from) / (DIAL.to - DIAL.from)

// ── Time saved: a median team's May ─────────────────────────────────────────────────────────────────────────────

/**
 * A median team's May: the questions its users and their agents asked, and the share its docs answered with no
 * one on the team stepping in (a whole percent, so the ring's 100 ticks count it). Each answer the docs gave saves
 * the minutes a person would have spent on it.
 */
export const QUESTIONS = 1425
export const DOCS_SHARE = 68
export const MINUTES_EACH = 11
export const ANSWERED = (QUESTIONS * DOCS_SHARE) / 100
export const HOURS = Math.round((ANSWERED * MINUTES_EACH) / 60)
export const SPLIT = [
  { name: "Answered by docs", share: DOCS_SHARE, lead: true },
  { name: "Answered by the team", share: 100 - DOCS_SHARE, lead: false },
]
