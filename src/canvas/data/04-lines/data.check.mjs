// Row 04: what the line charts draw equals DEMO, and what their copy says is true of it.
// Run: node src/canvas/data/04-lines/data.check.mjs (Node 24 reads the .ts files as is).
import assert from "node:assert/strict"

import * as f from "../facts.ts"
import * as d from "./data.ts"

const near = (a, b, tol) => Math.abs(a - b) <= tol
const last = d.LAST

// Every height is on the 4px grid, within 2px of exact, and on the axis; every tick lands on the grid exactly.
const onGrid = (h, exact, what) => {
  assert.equal(h % 4, 0, `${what}: ${h}px is off the grid`)
  assert.ok(near(h, exact, 2), `${what}: ${h}px is ${(h - exact).toFixed(2)}px from ${exact.toFixed(2)}px`)
  assert.ok(h >= 0 && h <= d.AXIS, `${what}: ${h}px is off the axis`)
}
for (const m of d.SHARE) onGrid(m.h, m.share * d.SHARE_PX, `share ${m.month}`)
for (const m of d.VIEWS) {
  onGrid(m.agentsH, m.agents * d.VIEWS_PX, `agents ${m.month}`)
  onGrid(m.peopleH, m.people * d.VIEWS_PX, `people ${m.month}`)
}
for (const m of d.ANSWER) onGrid(m.h, m.time * d.ANSWER_PX, `answer ${m.month}`)
for (const t of [...d.SHARE_TICKS, ...d.VIEWS_TICKS, ...d.ANSWER_TICKS]) assert.ok(Number.isInteger(t.h) && t.h % 4 === 0, `tick ${t.label}`)

// agent-share: "Agents went from 15% to 62%", rising every month; 62% is the readouts' share; May's two counts make 48M.
assert.equal(f.pct(d.SHARE[0].share), "15%")
assert.equal(f.pct(d.SHARE[last].share), f.TRAFFIC.agentShare.format(f.TRAFFIC.agentShare.value))
for (let i = 1; i <= last; i++) assert.ok(d.SHARE[i].h > d.SHARE[i - 1].h, `share falls in ${d.MONTHS[i]}`)
assert.equal(Math.round(d.SHARE[last].agents + d.SHARE[last].people), f.TRAFFIC.pageViews.value)

// crossover: "Agents passed people in April", once, and the drawn heights cross where the numbers do.
assert.equal(d.MONTHS[d.PASSED], "Apr")
d.VIEWS.forEach((m, i) => {
  assert.equal(m.agents > m.people, i >= d.PASSED, `${m.month}: agents ${m.agents}M, people ${m.people}M`)
  assert.equal(m.agentsH > m.peopleH, i >= d.PASSED, `${m.month}: the drawn lines cross in the wrong month`)
})
// April's two points sit 16 apart, edge to edge, so the agents' paper ring is what parts them.
assert.equal(d.VIEWS[d.PASSED].agentsH - d.VIEWS[d.PASSED].peopleH, 16)
// The share line passes 50% in the same month, so the two charts tell one story.
assert.ok(d.SHARE[d.PASSED - 1].share < 50 && d.SHARE[d.PASSED].share > 50)
// "agents grew 9× while people held level": the growth chart's 9× and 1×; people stay within 2% of their mean.
assert.equal(Math.round(d.VIEWS[last].agents / d.VIEWS[0].agents), f.GROWTH[0].value)
const mean = d.VIEWS.reduce((s, m) => s + m.people, 0) / d.VIEWS.length
for (const m of d.VIEWS) assert.ok(Math.abs(m.people / mean - 1) < 0.02, `people move ${m.people}M in ${m.month}`)
// May's end labels add up to the readouts' 48M.
assert.ok(near(d.VIEWS[last].agents + d.VIEWS[last].people, f.TRAFFIC.pageViews.value, 0.05))

// answer-time: "Answer time fell to 0.8s", every month, landing on the readouts' 0.8s; heights are exact.
assert.equal(f.sec(d.ANSWER[last].time), f.TRAFFIC.answerTime.format(f.TRAFFIC.answerTime.value))
for (let i = 1; i <= last; i++) assert.ok(d.ANSWER[i].time < d.ANSWER[i - 1].time, `answer time rises in ${d.MONTHS[i]}`)
for (const m of d.ANSWER) assert.ok(near(m.h, m.time * d.ANSWER_PX, 1e-9), `answer ${m.month} is rounded`)

console.log("04-lines ok", { share: d.SHARE.map((m) => f.pct(m.share)), passed: d.MONTHS[d.PASSED] })
