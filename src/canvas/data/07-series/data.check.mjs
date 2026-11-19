// Row 07: what the series charts draw agrees with DEMO, and what their copy says is true of it.
// Run: node src/canvas/data/07-series/data.check.mjs (Node 24 reads the .ts files as is).
import assert from "node:assert/strict"

import * as f from "../facts.ts"
import * as d from "./data.ts"

const near = (a, b, tol) => Math.abs(a - b) <= tol
const D = f.DEMO
const DAY_MS = 86_400_000

// Every height is on the 4px grid, within 2px of exact, and on the axis.
const onGrid = (h, exact, what) => {
  assert.equal(h % 4, 0, `${what}: ${h}px is off the grid`)
  assert.ok(near(h, exact, 2), `${what}: ${h}px is ${(h - exact).toFixed(2)}px from ${exact.toFixed(2)}px`)
  assert.ok(h >= 0 && h <= d.AXIS, `${what}: ${h}px is off the axis`)
}
for (const px of [d.WEEK_PX * 2, d.REQUEST_PX * 300, d.SHARE_PX * 25, d.YEAR_PX * 20]) assert.equal(px, 132, "gridlines are 132 apart")

// ── trajectory ──────────────────────────────────────────────────────────────────────────────────────────────────
// "the 26 weeks from December to May": Monday 1 December to Sunday 31 May, nothing missed or doubled.
const W = d.WEEKS
assert.equal(W.length, 26)
assert.equal(new Date(d.FIRST_MONDAY).getUTCDay(), 1, "the first week starts on a Monday")
const lastDay = new Date(d.FIRST_MONDAY + (26 * 7 - 1) * DAY_MS)
assert.deepEqual([lastDay.getUTCMonth(), lastDay.getUTCDate()], [4, 31], "the last week ends on May 31")
// Split by day into calendar months, the weeks make DEMO's monthly agent views, each within 1%.
const months = D.months.map(() => 0)
for (let day = 0; day < 26 * 7; day++) months[(new Date(d.FIRST_MONDAY + day * DAY_MS).getUTCMonth() + 1) % 12] += W[Math.floor(day / 7)].views / 7
months.forEach((m, i) => assert.ok(Math.abs(m / D.agents[i] - 1) < 0.01, `${D.months[i]}: weeks make ${m.toFixed(2)}M, DEMO says ${D.agents[i]}M`))
for (const w of W) onGrid(w.h, w.views * d.WEEK_PX, `week of ${w.start}`)
// The holidays dip: the weeks of December 22 and 29 are under the week before them.
assert.ok(W[3].views < W[2].views && W[4].views < W[2].views, "no holiday dip")
// The deep columns and the "May" key are the weeks that start in May: the last four.
const may = W.filter((w) => w.month === d.LAST_MONTH)
assert.deepEqual(may.map((w) => w.start), ["May 4", "May 11", "May 18", "May 25"])
// Title, "May's weeks beat every week before": May's lowest week beats every earlier week, on screen too.
const before = W.filter((w) => w.month < d.LAST_MONTH)
assert.ok(Math.min(...may.map((w) => w.views)) > Math.max(...before.map((w) => w.views)))
assert.ok(Math.min(...may.map((w) => w.h)) > Math.max(...before.map((w) => w.h)))
assert.ok(Math.max(...W.map((w) => w.views)) <= 8, "a week is over the axis")

// ── daily-requests ──────────────────────────────────────────────────────────────────────────────────────────────
// "May's last two weeks": May 18, a Monday, to May 31.
const days = d.DAYS
assert.equal(days.length, 14)
assert.equal(new Date(Date.UTC(2026, 4, d.FIRST_DAY)).getUTCDay(), 1, "May 18 is a Monday")
assert.equal(d.FIRST_DAY + days.length - 1, 31)
// Each week of requests is that week's page views in trajectory, to the thousand.
const sum = (xs) => xs.reduce((s, x) => s + x, 0)
assert.equal(sum(days.slice(0, 7).map((x) => x.total)), Math.round(W[24].views * 1000), "May 18 to 24 disagrees with its week")
assert.equal(sum(days.slice(7).map((x) => x.total)), Math.round(W[25].views * 1000), "May 25 to 31 disagrees with its week")
// Within reason of May: the days average within 10% of May's daily 0.96M (late May runs above the month's mean),
// and the 14 days are under half of May's 29.8M.
const mayDaily = (D.agents.at(-1) * 1000) / 31
const mean = sum(days.map((x) => x.total)) / days.length
assert.ok(Math.abs(mean / mayDaily - 1) < 0.1, `the days average ${mean.toFixed(0)}K, May ${mayDaily.toFixed(0)}K`)
assert.ok(sum(days.map((x) => x.total)) < (D.agents.at(-1) * 1000) / 2)
// Weekends run lower: each Saturday and Sunday is under every weekday of its week.
for (let w = 0; w < 2; w++) {
  const week = days.slice(w * 7, w * 7 + 7).map((x) => x.total)
  assert.ok(Math.max(...week.slice(5)) < Math.min(...week.slice(0, 5)), `week ${w + 1}: a weekend day beats a weekday`)
}
// Title, "Cache share rose to 85%": 70% on the first day, up every day, 85% on the last.
assert.equal(f.pct(days[0].share), "70%")
assert.equal(f.pct(days.at(-1).share), "85%")
for (let i = 1; i < days.length; i++) assert.ok(days[i].share > days[i - 1].share, `cache share falls on ${days[i].date}`)
// Each column's parts make its total: the cached part, the 4px gap and the uncached part stack to the column's top,
// both edges within 2px of exact, in either measure.
for (const x of days) {
  assert.ok(x.cached > 0 && x.cached < x.total)
  onGrid(x.count.total, x.total * d.REQUEST_PX, `${x.date} total`)
  onGrid(x.count.cached, x.cached * d.REQUEST_PX, `${x.date} cached`)
  onGrid(x.shareH.cached, x.share * d.SHARE_PX, `${x.date} cached share`)
  for (const h of [x.count, x.shareH]) assert.ok(h.total - h.cached - d.GAP >= 4, `${x.date}: no uncached part to draw`)
}

// ── milestones ──────────────────────────────────────────────────────────────────────────────────────────────────
// "June 2025 to May 2026": twelve months, December to May DEMO's shares exactly, the six before them under 15%.
const Y = d.YEAR
assert.equal(Y.length, 12)
assert.deepEqual([Y[0].month, Y.at(-1).month], ["Jun", "May"])
D.months.forEach((_, i) => assert.equal(Y[6 + i].share, f.demoAgentShare(i), `${D.months[i]} is not DEMO's share`))
assert.equal(f.pct(Y[6].share), "15%")
assert.equal(f.pct(Y.at(-1).share), f.TRAFFIC.agentShare.format(f.TRAFFIC.agentShare.value), "the end label is not 62%")
for (let i = 0; i < 6; i++) assert.ok(Y[i].share < 15, `${Y[i].month} is not under 15%`)
for (let i = 1; i < Y.length; i++) {
  assert.ok(Y[i].share > Y[i - 1].share, `share falls in ${Y[i].month}`)
  assert.ok(Y[i].h > Y[i - 1].h, `the line is flat into ${Y[i].month} on screen`)
}
for (const m of Y) onGrid(m.h, m.share * d.YEAR_PX, `share ${m.month}`)
// Title, "Each launch steepened the climb": at each event the month after climbs more than twice the month before.
for (const e of d.EVENTS) {
  const was = Y[e.at].share - Y[e.at - 1].share
  const then = Y[e.at + 1].share - Y[e.at].share
  assert.ok(then > 2 * was, `${e.name}: ${was.toFixed(2)} then ${then.toFixed(2)} points a month`)
  assert.equal(e.date, `${Y[e.at].month} 2025`, `${e.name} is not dated at its month`)
}

console.log("07-series ok", {
  months: months.map((m) => +m.toFixed(2)),
  daily: `${mean.toFixed(0)}K`,
  cache: `${f.pct(days[0].share)} to ${f.pct(days.at(-1).share)}`,
})
