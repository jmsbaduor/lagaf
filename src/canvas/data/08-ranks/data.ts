// Row 08's numbers: May's reads by reader type, ranked, and the rules that turn shares into bars.
// It imports only facts.ts, so Node runs it as is; data.check.mjs proves it agrees with DEMO and the readouts.
import { DEMO, demoTotal } from "../facts.ts"

const MAY = DEMO.months.length - 1
/** One decimal, as every share in this row is written. */
export const tenth = (n: number) => Math.round(n * 10) / 10
export const share = (n: number) => `${n.toFixed(1)}%`
export const round4 = (n: number) => Math.round(n / 4) * 4
const sum = (xs: readonly number[]) => xs.reduce((s, x) => s + x, 0)

/**
 * Agent types by their share of all May reads, in percent, largest first. Made up, generic on purpose (no product
 * names), and chosen so they make DEMO's agent share and their shares of agent reads alone add to 100.0 as written.
 */
export const AGENT_TYPES = [
  { name: "Coding agents", share: 28.9 },
  { name: "Chat assistants", share: 19.6 },
  { name: "AI search", share: 7.2 },
  { name: "Support bots", share: 3.3 },
  { name: "Evaluators", share: 1.8 },
  { name: "Other agents", share: 1.3 },
] as const

export type ReaderName = (typeof AGENT_TYPES)[number]["name"] | "People"

/** Agents' share of all May reads: the agent types together, 62.1 (the readouts' 62%). */
export const AGENT_SHARE = tenth(sum(AGENT_TYPES.map((t) => t.share)))
/** People's share of all May reads, from DEMO: 18.2M of 48M. */
export const PEOPLE_SHARE = tenth((DEMO.people[MAY] / demoTotal(MAY)) * 100)
/** May's agent reads in millions, which the leaderboard ranks: DEMO's 29.8M. */
export const AGENT_READS = DEMO.agents[MAY]

// ── Leaderboard: agent types by their share of agent reads alone ────────────────────────────────────────────────

/** Every bar's track is 368 (a card's width inside its padding) for all agent reads: 3.68px a point, rounded to 4. */
export const LEAD_TRACK = 368
export const LEADERS = AGENT_TYPES.map((t, i) => {
  const exact = (t.share / AGENT_SHARE) * 100
  return { name: t.name, rank: i + 1, exact, share: tenth(exact), w: round4((exact * LEAD_TRACK) / 100) }
})

// ── All readers: every reader type by its share of all reads ────────────────────────────────────────────────────

/** Every track is 800 for all reads: 8px a point, rounded to 4. */
export const ALL_TRACK = 800
const PX = ALL_TRACK / 100
export const READ_BY = [{ name: "People" as ReaderName, share: PEOPLE_SHARE }, ...AGENT_TYPES]
  .sort((a, b) => b.share - a.share)
  .map((r, i) => ({ ...r, rank: i + 1, people: r.name === "People", w: round4(r.share * PX) }))
/** The agents' bar under the ranking: every agent type together. */
export const ALL_AGENTS = { name: "All agents", share: AGENT_SHARE, w: round4(AGENT_SHARE * PX) }
