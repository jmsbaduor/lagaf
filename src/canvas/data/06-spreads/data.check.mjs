// Row 06 draws what its data says, and its data agrees with the deck. Run: node src/canvas/data/06-spreads/data.check.mjs
import assert from "node:assert/strict"

import * as f from "../facts.ts"
import * as d from "./data.ts"

const sum = (xs) => xs.reduce((s, x) => s + x, 0)

// ── eval-sites ──
// 20 sites of 100 questions (the eval in EVALS), whole answers, and none falls.
assert.equal(d.SITES.length, 20)
for (const s of d.SITES) {
  for (const v of [s.before, s.after])
    assert.ok(Number.isInteger(v) && v >= d.AXIS_MIN && v <= d.AXIS_MAX, `${s.name}: ${v}`)
  assert.ok(s.after >= s.before, `${s.name} falls`)
}
// They average exactly to the eval's 97.6% and 99.6% (1952 and 1992 correct of 2000), and the panel says so.
assert.equal(sum(d.SITES.map((s) => s.before)), 1952)
assert.equal(sum(d.SITES.map((s) => s.after)), 1992)
assert.equal(d.mean("before").toFixed(1), String(d.evalAccuracy.before))
assert.equal(d.mean("after").toFixed(1), String(d.evalAccuracy.after))
// What the panel states: 17 gained, 3 held, none fell; two already perfect; three gained five points or more.
assert.deepEqual(d.siteCounts, { gained: 17, held: 3, fell: 0 })
assert.equal(d.SITES.filter((s) => s.before === 100).length, 2)
assert.equal(d.SITES.filter((s) => s.after - s.before >= 5).length, 3)
// The lowest site starts the axis. Every cell fits its sites, and no two sites share a slot.
assert.equal(Math.min(...d.SITES.map((s) => s.before)), d.AXIS_MIN)
const slots = new Set(d.SITES.map((s, i) => `${s.before},${s.after},${d.SITE_SLOT[i]}`))
assert.equal(slots.size, d.SITES.length)
assert.ok(d.SITE_SLOT.every((x) => x !== undefined && x < d.SITE_SLOTS))
// A cell is 3 squares of 12 with 4 between and around them, on the 4px grid.
assert.equal(d.SITE_CELL, 3 * 12 + 4 * 4)
assert.equal(d.SITE_CELL % 4, 0)

// ── rhythm ──
// May 2026 by weekday: 31 days, starting on a Friday.
assert.equal(sum(d.MAY_DAYS), 31)
assert.equal(new Date(Date.UTC(2026, 4, 1)).getUTCDay(), 5)
const count = Array(7).fill(0)
for (let day = 1; day <= 31; day++) count[(new Date(Date.UTC(2026, 4, day)).getUTCDay() + 6) % 7]++
assert.deepEqual(count, d.MAY_DAYS)
// 7 by 24 cells, whole thousands, that sum to May: 29.8M agents and 18.2M people, so 48M at 62% agents.
assert.equal(d.HOURS.length, 7 * 24)
for (const c of d.HOURS)
  assert.ok(Number.isInteger(c.people) && Number.isInteger(c.agents) && c.people > 0 && c.agents > 0)
const agents = sum(d.HOURS.map((c) => c.agents))
const people = sum(d.HOURS.map((c) => c.people))
assert.equal(agents, f.DEMO.agents.at(-1) * 1000)
assert.equal(people, f.DEMO.people.at(-1) * 1000)
assert.equal(Math.round((agents + people) / 1000), f.TRAFFIC.pageViews.value)
assert.equal(Math.round((agents / (agents + people)) * 100), f.TRAFFIC.agentShare.value)
// Each hour's reads an hour, times its days, gives May back.
assert.ok(Math.abs(sum(d.HOURS.map((c) => c.perHour * d.MAY_DAYS[c.day])) - (agents + people)) < 1e-6)
// The story the colours tell. Agents make most reads at night (the title), nights and weekends more than working hours.
const at = (day, hour) => d.HOURS[day * 24 + hour]
const avgShare = (cells) => {
  const a = sum(cells.map((c) => c.agents))
  return (a / (a + sum(cells.map((c) => c.people)))) * 100
}
const nights = d.HOURS.filter((c) => c.hour < 6)
const work = d.HOURS.filter((c) => c.day < 5 && c.hour >= 9 && c.hour < 17)
const weekend = d.HOURS.filter((c) => c.day >= 5)
for (const c of nights) assert.ok(c.share > 50, `${d.WEEKDAYS[c.day]} ${c.hour}: ${c.share.toFixed(1)}% at night`)
assert.ok(avgShare(nights) > 80 && avgShare(work) < 55 && avgShare(weekend) > 65, "nights, working hours, weekends")
// People: weekday working hours busiest, a lunch dip, quiet weekends.
for (let day = 0; day < 5; day++)
  assert.ok(at(day, 12).people < at(day, 11).people && at(day, 12).people < at(day, 13).people, "lunch dip")
assert.ok(
  sum(weekend.map((c) => c.people / d.MAY_DAYS[c.day])) < sum(work.map((c) => c.people / d.MAY_DAYS[c.day])) / 2
)
// Agents: never under half their busiest hour (steady), and lifted in working hours.
const agentRate = d.HOURS.map((c) => c.agents / d.MAY_DAYS[c.day])
assert.ok(Math.min(...agentRate) > Math.max(...agentRate) / 2)
assert.ok(
  avgShare(work) < avgShare(nights) &&
    sum(work.map((c) => c.agents / d.MAY_DAYS[c.day])) / work.length >
      sum(nights.map((c) => c.agents / d.MAY_DAYS[c.day])) / nights.length
)
// The steps: every cell's value, as the reading writes it, has one, and every step in the legend is drawn at least once.
for (const [measure, steps] of Object.entries(d.STEPS)) {
  assert.equal(steps.length, 6)
  const used = new Set(d.HOURS.map((c) => d.stepOf(d.cellValue(c, measure), steps)))
  assert.deepEqual(
    [...used].sort(),
    steps.map((_, i) => i),
    `${measure}: steps ${[...used].sort()}`
  )
}
// The lunch dip shows: at 12:00 Monday to Thursday the share is a step above 11:00 and 13:00 (on Friday, people
// read less all day, so 13:00 is already up there).
for (let day = 0; day < 4; day++) {
  const step = (h) => d.stepOf(d.cellValue(at(day, h), "share"), d.STEPS.share)
  assert.ok(step(12) > step(11) && step(12) > step(13), `${d.WEEKDAYS[day]}: no lunch step`)
}
assert.equal(d.hourName(9), "09:00")

// ── answer-spread ──
// Every answer, in 0.2s bins to 4s plus one open bin; half land under 0.8s, so the interpolated median is the 0.8s readout.
assert.equal(sum(d.ANSWER_BINS), 1000)
assert.equal(d.ANSWER_BINS.length, 4 / d.BIN_S + 1)
assert.equal(sum(d.ANSWER_BINS.slice(0, d.answerMedian / d.BIN_S)), 500)
assert.equal(d.medianSeconds(), f.TRAFFIC.answerTime.value)
assert.equal(d.medianSeconds(), f.DEMO.answerTime.at(-1))
// One peak, just under the median, then a tail that never rises.
const peak = d.ANSWER_BINS.indexOf(Math.max(...d.ANSWER_BINS))
assert.equal(peak, d.answerMedian / d.BIN_S - 1)
for (let i = 1; i <= peak; i++) assert.ok(d.ANSWER_BINS[i] > d.ANSWER_BINS[i - 1], "rise")
for (let i = peak + 1; i < d.ANSWER_BINS.length; i++) assert.ok(d.ANSWER_BINS[i] <= d.ANSWER_BINS[i - 1], "tail")
// Bars on the 4px grid, within 2px of exact, at least one step tall, and under the tallest gridline's room.
for (const n of d.ANSWER_BINS) {
  const h = d.barHeight(n)
  assert.equal(h % 4, 0)
  assert.ok(h >= 4 && Math.abs(h - (n / 10) * d.ANSWER_PX) <= 2, `${n / 10}% is ${h}px`)
}
assert.ok(d.ANSWER_TICKS.every((t) => (t * d.ANSWER_PX) % 4 === 0))
assert.equal(d.binName(3), "0.6–0.8s")
assert.equal(d.binName(20), "4s and over")

console.log("06-spreads ok", {
  means: [d.mean("before"), d.mean("after")],
  shares: {
    nights: +avgShare(nights).toFixed(1),
    work: +avgShare(work).toFixed(1),
    weekend: +avgShare(weekend).toFixed(1),
  },
  perHour: [Math.min(...d.HOURS.map((c) => c.perHour)), Math.max(...d.HOURS.map((c) => c.perHour))].map(
    (x) => +x.toFixed(1)
  ),
  median: d.medianSeconds(),
})
