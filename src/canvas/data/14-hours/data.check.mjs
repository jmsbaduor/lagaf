// Row 14 draws what its data says, and its data agrees with DEMO and row 07.
// Run: node src/canvas/data/14-hours/data.check.mjs (Node 24 reads the .ts files as is).
import assert from "node:assert/strict"
import * as s from "../07-series/data.ts"
import * as f from "../facts.ts"
import * as d from "./data.ts"
import * as r from "../06-spreads/data.ts"

// ── Calendar ──
const calendarSum = (xs) => xs.reduce((t, x) => t + x, 0)
const C = d.CALENDAR
const calendarDay = 86_400_000

// "the 26 weeks from December to May": 182 days, Monday 1 December to Sunday 31 May, a week a column, Monday first.
assert.equal(C.length, 182)
assert.equal(d.CALENDAR_WEEKS.length, 26)
C.forEach((c, i) => {
  assert.equal(c.week, Math.floor(i / 7))
  assert.equal(c.day, i % 7)
  const date = new Date(s.FIRST_MONDAY + i * calendarDay)
  assert.equal(c.date, `${d.CALENDAR_WEEKDAYS[date.getUTCDay() === 0 ? 6 : date.getUTCDay() - 1]} ${f.DEMO.months[c.month]} ${date.getUTCDate()}`)
  assert.ok(Number.isInteger(c.views) && c.views > 0, c.date)
})
assert.equal(C[0].date, "Mon Dec 1")
assert.equal(C.at(-1).date, "Sun May 31")

// Each week's days sum to trajectory's week, to the thousand; its bar is that week on the 4px grid, within 2px.
d.CALENDAR_WEEKS.forEach((w, i) => {
  assert.equal(calendarSum(C.slice(i * 7, i * 7 + 7).map((c) => c.views)), Math.round(s.WEEKS[i].views * 1000), w.start)
  assert.equal(w.views, s.WEEKS[i].views)
  assert.equal(w.h % 4, 0, `week of ${w.start}: ${w.h}px is off the grid`)
  assert.ok(Math.abs(w.h - w.views * d.CALENDAR_WEEK_PX) <= 2, `week of ${w.start}: ${w.h}px is off its value`)
})
// The bars fit under the month ticks: the tallest leaves room for its value (24) above it, below the ticks at 620.
assert.ok(828 - Math.max(...d.CALENDAR_WEEKS.map((w) => w.h)) - 24 >= 620 + 16)

// The last two weeks are daily requests' days exactly, since every agent page view is one request.
assert.deepEqual(
  C.slice(-14).map((c) => c.views),
  s.DAYS.map((x) => x.total)
)

// Split into calendar months, the days stay within 1% of DEMO's monthly agent views, as trajectory's weeks do.
f.DEMO.months.forEach((m, i) => {
  const views = calendarSum(C.filter((c) => c.month === i).map((c) => c.views)) / 1000
  assert.ok(Math.abs(views / f.DEMO.agents[i] - 1) < 0.01, `${m}: days make ${views.toFixed(2)}M, DEMO says ${f.DEMO.agents[i]}M`)
})

// The rhythm: outside the holidays, each Saturday and Sunday is under every weekday of its week.
const calendarHolidays = ["Wed Dec 24", "Thu Dec 25", "Fri Dec 26", "Wed Dec 31", "Thu Jan 1"]
for (let w = 0; w < 26; w++) {
  const week = C.slice(w * 7, w * 7 + 7)
  if (week.some((c) => calendarHolidays.includes(c.date))) continue
  const views = week.map((c) => c.views)
  assert.ok(Math.max(...views.slice(5)) < Math.min(...views.slice(0, 5)), `week of ${week[0].date}: a weekend day beats a weekday`)
}
// The holiday dip: Christmas Day and New Year's Day are the quietest days of their weeks.
for (const day of ["Thu Dec 25", "Thu Jan 1"]) {
  const c = C.find((x) => x.date === day)
  const week = C.filter((x) => x.week === c.week)
  assert.equal(Math.min(...week.map((x) => x.views)), c.views, `${day} is not its week's quietest day`)
}

// The ramp: six steps from 0, each day takes the highest it reaches, and every step has days in it.
assert.equal(d.CALENDAR_STEPS[0], 0)
const calendarCounts = d.CALENDAR_STEPS.map((_, k) => C.filter((c) => d.calendarStep(c.views) === k).length)
assert.ok(calendarCounts.every((n) => n > 0), `an empty step: ${calendarCounts}`)

// Title, "Agents passed a million a day": the top step is a million and over; days reach it, and only in May.
assert.equal(d.CALENDAR_STEPS.at(-1), 1000)
const calendarMillion = C.filter((c) => c.views >= 1000)
assert.ok(calendarMillion.length > 0)
assert.ok(calendarMillion.every((c) => c.month === f.DEMO.months.length - 1))
assert.equal(calendarMillion[0].date, "Mon May 11")

// Copy: the title is 3 to 6 words, the description 50 to 80 characters ending in a full stop.
const calendarTitle = "Agents passed a million a day"
const calendarDescription = "Agent page views each day of the 26 weeks from December to May."
assert.ok(calendarTitle.split(" ").length >= 3 && calendarTitle.split(" ").length <= 6)
assert.ok(calendarDescription.length >= 50 && calendarDescription.length <= 80 && calendarDescription.endsWith("."))

// ── Butterfly ──
const butterflySum = (xs) => xs.reduce((s, x) => s + x, 0)

// 24 hours, 00:00 to 23:00, each the sum of rhythm's seven cells for that hour.
assert.equal(d.BUTTERFLY.length, 24)
d.BUTTERFLY.forEach((h, i) => {
  assert.equal(h.hour, i)
  assert.equal(h.name, `${String(i).padStart(2, "0")}:00`)
  const cells = r.HOURS.filter((c) => c.hour === i)
  assert.equal(cells.length, 7)
  assert.equal(h.people, butterflySum(cells.map((c) => c.people)))
  assert.equal(h.agents, butterflySum(cells.map((c) => c.agents)))
})

// The totals are the week's, which are DEMO's May: 18.2M people and 29.8M agents, 48M at 62% agents.
assert.equal(d.BUTTERFLY_TOTAL.people, butterflySum(r.HOURS.map((c) => c.people)))
assert.equal(d.BUTTERFLY_TOTAL.agents, butterflySum(r.HOURS.map((c) => c.agents)))
assert.equal(d.BUTTERFLY_TOTAL.people, Math.round(f.DEMO.people.at(-1) * 1000))
assert.equal(d.BUTTERFLY_TOTAL.agents, Math.round(f.DEMO.agents.at(-1) * 1000))
assert.equal(d.butterflyMonth(d.BUTTERFLY_TOTAL.people), "18.2M")
assert.equal(d.butterflyMonth(d.BUTTERFLY_TOTAL.agents), "29.8M")
assert.equal(
  Math.round((d.BUTTERFLY_TOTAL.agents / (d.BUTTERFLY_TOTAL.people + d.BUTTERFLY_TOTAL.agents)) * 100),
  f.TRAFFIC.agentShare.value
)

// Bars: one scale both sides, whole 4px, within 2px of exact, inside the 600px side.
for (const h of d.BUTTERFLY) {
  for (const [k, w] of [
    [h.people, h.peopleW],
    [h.agents, h.agentsW],
  ]) {
    assert.equal(w % 4, 0, `${h.name}: ${w}`)
    assert.ok(Math.abs(w - k / d.BUTTERFLY_K_PX) <= 2, `${h.name}: ${w} for ${k}K`)
    assert.ok(w >= 4 && w <= d.BUTTERFLY_SIDE, `${h.name}: ${w}`)
  }
}

// The title: agents read more than people in 18 of the 24 hours. People lead only from 09:00 to 15:00, lunch aside,
// and the agents' quietest hour (02:00) still out-reads people in every hour from 18:00 to 08:00.
assert.equal(d.BUTTERFLY_AGENT_HOURS, 18)
assert.equal(d.BUTTERFLY_TITLE, "Agents lead 18 of 24 hours")
assert.deepEqual(
  d.BUTTERFLY.filter((h) => h.people > h.agents).map((h) => h.hour),
  [9, 10, 11, 13, 14, 15]
)
const butterflyQuiet = Math.min(...d.BUTTERFLY.map((h) => h.agents))
assert.equal(d.BUTTERFLY.find((h) => h.agents === butterflyQuiet).hour, 2)
for (const h of d.BUTTERFLY.filter((h) => h.hour >= 18 || h.hour <= 8)) assert.ok(butterflyQuiet > h.people, h.name)

// Copy: a 3 to 6 word title, a 50 to 80 character description ending in a full stop, and a reading's form.
const butterflyWords = d.BUTTERFLY_TITLE.split(" ").length
assert.ok(butterflyWords >= 3 && butterflyWords <= 6)
assert.ok(d.BUTTERFLY_DESCRIPTION.length >= 50 && d.BUTTERFLY_DESCRIPTION.length <= 80, d.BUTTERFLY_DESCRIPTION)
assert.ok(d.BUTTERFLY_DESCRIPTION.endsWith("."))
assert.equal(d.butterflyReading(d.BUTTERFLY[14]), "14:00: 1.75M people, 1.50M agents")
