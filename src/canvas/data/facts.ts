// The numbers the charts draw, and the rules that turn them into cells, bars and fills, in one place so
// facts.check.mjs can test that what is drawn matches what is said. Plain TypeScript with no imports: Node runs it.
// Every number is from the deck.

export const pct = (n: number) => `${Math.round(n)}%`
export const sec = (n: number) => `${n.toFixed(1)}s`

/**
 * Row 01. Readout, dashboard and numbers repeat these; they read from here so they always agree, words included.
 * A note keeps the deck's line break.
 */
export const TRAFFIC = {
  agentShare: { value: 62, format: pct, tag: "Agent share", note: ["Share of docs traffic", "from AI agents"] },
  answerTime: { value: 0.8, format: sec, tag: "Answer time", note: ["Median time for an agent", "to reach an answer"] },
  pageViews: {
    value: 48,
    format: (n: number) => `${Math.round(n)}M`,
    tag: "Page views",
    note: ["Monthly page views", "across docs"],
  },
  teams: {
    value: 10000,
    format: (n: number) => `${new Intl.NumberFormat("en-US").format(Math.round(n))}+`,
    tag: "Teams",
    note: ["Teams publishing docs", "and knowledge bases"],
  },
}

/** Waffle: 10 by 10, one cell per percent. As in the deck, full columns first, then the rest at the foot of the next. */
export const MARKDOWN_SHARE = 83
export const WAFFLE = Array.from({ length: 100 }, (_, i) => {
  const row = Math.floor(i / 10)
  const col = i % 10
  const full = Math.floor(MARKDOWN_SHARE / 10)
  return col < full || (col === full && row >= 10 - (MARKDOWN_SHARE % 10))
})

/** Dot matrix: each share lights its share of 24 dots, rounded (83% is 20 dots, 9% is 2). */
export const DOTS = 24
export const litDots = (share: number) => Math.round((share / 100) * DOTS)
export const TEAM_SHARES = { draft: 83, publish: 9 }

/** Who reads: every bar has the same 50 columns, one column for 2% of a source's readers, so shares compare. */
export const READER_COLS = 50
export const READERS = [
  { name: "Docs pages", agents: 56 },
  { name: "API reference", agents: 76 },
  { name: "llms.txt", agents: 96 },
  { name: "MCP tools", agents: 98 },
  { name: "Changelog", agents: 40 },
]
export const agentCols = (share: number) => (share * READER_COLS) / 100

/** Update lag: one scale for every column, 10px per percentage point. */
export const LAG = [
  { label: "Same-day updates", value: 24 },
  { label: "One-week lag", value: 54 },
  { label: "One month or longer", value: 22 },
]
export const LAG_PX = 10

/**
 * Token bar: Markdown with llms.txt uses up to 60% fewer tokens than HTML, so its bar is 40% of HTML's. The HTML
 * whole is the content width; 40% of it (518.4px) rounds to the 4px grid (520px), and the saving is the rest.
 */
export const TOKENS_SAVED = 60
export const TOKEN_W = 1296
export const TOKEN_USED = Math.round((TOKEN_W * (1 - TOKENS_SAVED / 100)) / 4) * 4

/** Growth: the agent fill runs the full width; the human fill is a ninth of it. */
export const GROWTH = [
  { label: "Agent readership growth", value: 9 },
  { label: "Human readership growth", value: 1 },
]

/** Eval rows: each headline follows from its before and after. */
export const EVALS = [
  { stat: 67, kind: "fewer", before: 0.079, after: 0.026 },
  { stat: 99.6, kind: "accuracy", before: 97.6, after: 99.6 },
  { stat: 18.9, kind: "faster", before: 25.9, after: 21.0 },
] as const

/** Seeded random numbers (mulberry32): the same pattern on every render. */
export function seeded(seed: number) {
  return () => {
    seed = (seed + 0x6d2b79f5) | 0
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

/**
 * Timeline: a field of 72 columns by 20 rows on a 20px pitch, full bleed, split at the four stages' stems.
 * Sparse and pale on the left, dense and deep on the right; each stage is denser and deeper than the last.
 */
export const FIELD_COLS = 72
export const FIELD_ROWS = 20
export const STAGE_X = [72, 396, 720, 1044] // the content box in quarters
export const stageCol = (x: number) => Math.floor((x + 10) / 20) // the column under a stage's 20px marker
export const FIELD = (() => {
  const rand = seeded(12)
  const bounds = STAGE_X.slice(1).map(stageCol)
  const cells: { col: number; row: number; level: number; stage: number }[] = []
  for (let col = 0; col < FIELD_COLS; col++) {
    const t = col / (FIELD_COLS - 1)
    for (let row = 0; row < FIELD_ROWS; row++) {
      const keep = rand() < 0.3 + 0.62 * t
      const level = Math.min(5, Math.max(0, Math.floor(t * 5.6 + (rand() - 0.5) * 1.8)))
      if (keep)
        cells.push({
          col,
          row,
          level,
          stage: bounds.filter((b) => col >= b).length,
        })
    }
  }
  return STAGE_X.map((_, i) => cells.filter((c) => c.stage === i))
})()
