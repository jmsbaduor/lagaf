// Row 04's numbers: DEMO's six months, and the rules that turn them into heights above the value axis's zero.
// Everything here derives from facts.ts; data.check.mjs asserts the heights and every claim the copy makes.
// Plain TypeScript that names facts.ts in full, so Node runs it as is.
import { DEMO, demoAgentShare } from "../facts.ts"

export const MONTHS = DEMO.months
export const LAST = MONTHS.length - 1
export const millions = (n: number) => `${n.toFixed(1)}M`

/** The value axis is 544px tall (TOP to its zero, in parts.tsx). Every height is rounded to 4, so within 2px of exact. */
export const AXIS = 544
const grid = (px: number) => Math.round(px / 4) * 4

/** Agent share: 0 to 100% over the axis, so the quarter lines fall 136px apart, on the grid, and 100% is on TOP. */
export const SHARE_PX = AXIS / 100
export const SHARE = MONTHS.map((month, i) => ({
  month,
  share: demoAgentShare(i),
  agents: DEMO.agents[i],
  people: DEMO.people[i],
  h: grid(demoAgentShare(i) * SHARE_PX),
}))
export const SHARE_TICKS = [0, 25, 50, 75, 100].map((v) => ({ h: (v * AXIS) / 100, label: `${v}%` }))

/** Monthly views: 16px a million, so the 10M lines are 160px apart. No 30M line: May's 29.8M is labelled there. */
export const VIEWS_PX = 16
export const VIEWS = MONTHS.map((month, i) => ({
  month,
  agents: DEMO.agents[i],
  people: DEMO.people[i],
  agentsH: grid(DEMO.agents[i] * VIEWS_PX),
  peopleH: grid(DEMO.people[i] * VIEWS_PX),
}))
export const VIEWS_TICKS = [0, 10, 20].map((v) => ({ h: v * VIEWS_PX, label: v ? `${v}M` : "0" }))
/** The first month agents outnumber people (the crossover's title says April). */
export const PASSED = VIEWS.findIndex((m) => m.agents > m.people)

/** Answer time: 200px a second, so every tenth is 20px and lands on the grid exactly. */
export const ANSWER_PX = 200
export const ANSWER = MONTHS.map((month, i) => ({ month, time: DEMO.answerTime[i], h: grid(DEMO.answerTime[i] * ANSWER_PX) }))
export const ANSWER_TICKS = [0, 1, 2].map((v) => ({ h: v * ANSWER_PX, label: `${v}s` }))
