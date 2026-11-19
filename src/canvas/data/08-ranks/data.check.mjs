// Row 08: what the rankings draw equals DEMO, and what their copy says is true of it.
// Run: node src/canvas/data/08-ranks/data.check.mjs (Node 24 reads the .ts files as is).
import assert from "node:assert/strict"

import * as f from "../facts.ts"
import * as d from "./data.ts"

const near = (a, b, tol) => Math.abs(a - b) <= tol
// Sums in tenths, so 0.1 steps add exactly.
const tenths = (xs) => xs.reduce((s, x) => s + Math.round(x * 10), 0)
const last = f.DEMO.months.length - 1
// A drawn length is on the 4px grid and within 2px of exact.
const bar = (w, exact, what) => assert.ok(w % 4 === 0 && near(w, exact, 2), `${what}: drawn ${w}, exact ${exact.toFixed(2)}`)

// Every reader type makes all of May's reads: 100.0 as written.
assert.equal(tenths([d.PEOPLE_SHARE, ...d.AGENT_TYPES.map((t) => t.share)]), 1000)
// People are DEMO's May people over the May total (18.2M of 48M).
assert.equal(d.PEOPLE_SHARE, Math.round((f.DEMO.people[last] / f.demoTotal(last)) * 1000) / 10)
assert.equal(d.PEOPLE_SHARE, 37.9)
// The agent types make DEMO's agent share (62.1) and the readouts' 62%.
assert.equal(tenths(d.AGENT_TYPES.map((t) => t.share)), Math.round(f.demoAgentShare(last) * 10))
assert.equal(Math.round(d.AGENT_SHARE), f.TRAFFIC.agentShare.value)
// Agent types are typed largest first, and none ties.
d.AGENT_TYPES.slice(1).forEach((t, i) => assert.ok(t.share < d.AGENT_TYPES[i].share, `${t.name} is out of order`))

// Leaderboard: "Agent types ranked by their share of May's 29.8M agent reads"; coding agents lead.
assert.equal(`${d.AGENT_READS}M`, "29.8M")
assert.ok(near(d.AGENT_READS, (f.TRAFFIC.pageViews.value * d.AGENT_SHARE) / 100, 0.05), "agent reads disagree with 62.1% of 48M")
assert.equal(d.LEADERS[0].name, "Coding agents")
for (const [i, t] of d.LEADERS.entries()) {
  // Each share of agent reads is computed from its share of all reads, never typed.
  assert.ok(near(t.exact, (d.AGENT_TYPES[i].share / d.AGENT_SHARE) * 100, 1e-9))
  assert.equal(t.rank, i + 1)
  if (i) assert.ok(t.share < d.LEADERS[i - 1].share && t.w <= d.LEADERS[i - 1].w, `${t.name} outranks the one above`)
  bar(t.w, (t.exact * d.LEAD_TRACK) / 100, `${t.name} bar`)
}
// As written, the leaders' shares add to 100.0, so the cards and the table add up.
assert.equal(tenths(d.LEADERS.map((t) => t.share)), 1000)
assert.deepEqual(
  d.LEADERS.map((t) => t.share),
  [46.5, 31.6, 11.6, 5.3, 2.9, 2.1]
)

// All readers: "Agents make 62% of May's reads, yet no one agent type reads as much as people."
assert.equal(d.READ_BY.length, d.AGENT_TYPES.length + 1)
assert.equal(d.READ_BY[0].name, "People")
for (const t of d.AGENT_TYPES) assert.ok(t.share < d.PEOPLE_SHARE, `${t.name} reads as much as people`)
assert.ok(d.AGENT_SHARE > d.PEOPLE_SHARE, "agents together don't outread people")
assert.equal(f.TRAFFIC.agentShare.format(d.AGENT_SHARE), "62%")
for (const [i, r] of d.READ_BY.entries()) {
  assert.equal(r.rank, i + 1)
  if (i) assert.ok(r.share < d.READ_BY[i - 1].share && r.w <= d.READ_BY[i - 1].w, `${r.name} outranks the one above`)
  bar(r.w, (r.share * d.ALL_TRACK) / 100, `${r.name} bar`)
}
bar(d.ALL_AGENTS.w, (d.AGENT_SHARE * d.ALL_TRACK) / 100, "All agents bar")
// The agents' bar is the agent rows together, and the longest bar drawn.
assert.ok(near(d.ALL_AGENTS.w, d.READ_BY.filter((r) => !r.people).reduce((s, r) => s + r.share * 8, 0), 2))
assert.ok(d.ALL_AGENTS.w > d.READ_BY[0].w)

console.log("08-ranks ok", {
  leaders: d.LEADERS.map((t) => `${t.name} ${t.share}% ${t.w}px`),
  readers: d.READ_BY.map((r) => `${r.name} ${r.share}% ${r.w}px`),
  agents: `${d.ALL_AGENTS.share}% ${d.ALL_AGENTS.w}px`,
})
