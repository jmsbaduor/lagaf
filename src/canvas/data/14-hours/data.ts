// Row 14's numbers: when reading happens, made up to agree with DEMO and row 07; data.check.mjs proves it. Plain
// TypeScript that names its imports in full, so Node runs it as is.
import { DAYS as REQUEST_DAYS, FIRST_MONDAY, round4, WEEKS as TRAJECTORY_WEEKS } from "../07-series/data.ts"
import { DEMO, seeded } from "../facts.ts"
import { hourName, HOURS } from "../06-spreads/data.ts"

// ── Calendar ──

export const CALENDAR_WEEKDAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"]
const CALENDAR_DAY_MS = 86_400_000

/** Each weekday's weight in its week: busy Monday to Thursday, a softer Friday, weekends about a fifth lower. */
const CALENDAR_RHYTHM = [1.02, 1.04, 1.03, 1.01, 0.98, 0.83, 0.8]
/** The holidays read less: Christmas Eve to Boxing Day, and New Year's Eve and Day. Keys are UTC month-date. */
const CALENDAR_HOLIDAYS: Record<string, number> = { "11-24": 0.74, "11-25": 0.56, "11-26": 0.7, "11-31": 0.76, "0-1": 0.6 }

/** Round `raw` to whole numbers that sum to `total`: floor each, then give what is left to the largest remainders. */
function calendarApportion(raw: number[], total: number) {
  const k = total / raw.reduce((s, x) => s + x, 0)
  const scaled = raw.map((x) => x * k)
  const out = scaled.map(Math.floor)
  const left = total - out.reduce((s, x) => s + x, 0)
  scaled
    .map((x, i) => [x - Math.floor(x), i])
    .sort((a, b) => b[0] - a[0])
    .slice(0, left)
    .forEach(([, i]) => out[i]++)
  return out
}

/**
 * Agent page views each day, in thousands, for the 182 days of trajectory's 26 weeks (1 December to 31 May). Each
 * week's days sum to its weekly figure to the thousand, and the last two weeks are daily requests' days exactly
 * (every agent page view is one request). `month` is the calendar month the day falls in (0 is December).
 */
export const CALENDAR = (() => {
  const rand = seeded(14)
  return TRAJECTORY_WEEKS.flatMap((w, week) => {
    const dates = CALENDAR_WEEKDAYS.map((_, day) => new Date(FIRST_MONDAY + (week * 7 + day) * CALENDAR_DAY_MS))
    const raw = dates.map(
      (d, day) =>
        CALENDAR_RHYTHM[day] * (CALENDAR_HOLIDAYS[`${d.getUTCMonth()}-${d.getUTCDate()}`] ?? 1) * (0.97 + rand() * 0.06)
    )
    const known = REQUEST_DAYS.slice((week - 24) * 7, (week - 23) * 7)
    const views = week >= 24 ? known.map((d) => d.total) : calendarApportion(raw, Math.round(w.views * 1000))
    return dates.map((d, day) => {
      const month = (d.getUTCMonth() + 1) % 12
      return {
        week,
        day,
        month,
        date: `${CALENDAR_WEEKDAYS[day]} ${DEMO.months[month]} ${d.getUTCDate()}`,
        views: views[day],
      }
    })
  })
})()

/**
 * The colour steps, low to high, in thousands a day: near doubling, so December's quiet days and May's millions both
 * show. A day takes the step of the highest threshold it reaches.
 */
export const CALENDAR_STEPS = [0, 100, 200, 400, 700, 1000]
export const calendarStep = (k: number) => CALENDAR_STEPS.findLastIndex((t) => k >= t)

/** Each week's total under its column, 22px a million, so the busiest week (7.42M) stands 164 tall. */
export const CALENDAR_WEEK_PX = 22
export const CALENDAR_WEEKS = TRAJECTORY_WEEKS.map((w) => ({
  start: w.start,
  month: w.month,
  views: w.views,
  h: round4(w.views * CALENDAR_WEEK_PX),
}))

// ── Butterfly ──

/** One shared scale for both sides: 3K reads a px, so a 600px side holds 1.8M, past the busiest hour. */
export const BUTTERFLY_K_PX = 3
export const BUTTERFLY_SIDE = 600
/** A bar's length, rounded to the 4px grid (within 2px of exact). */
export const butterflyW = (k: number) => Math.round(k / BUTTERFLY_K_PX / 4) * 4

/** May's reads in each hour of the day, in thousands: rhythm's seven weekdays summed per hour. */
export const BUTTERFLY = Array.from({ length: 24 }, (_, hour) => {
  const cells = HOURS.filter((c) => c.hour === hour)
  const people = cells.reduce((s, c) => s + c.people, 0)
  const agents = cells.reduce((s, c) => s + c.agents, 0)
  return { hour, name: hourName(hour), people, agents, peopleW: butterflyW(people), agentsW: butterflyW(agents) }
})

export const BUTTERFLY_TOTAL = {
  people: BUTTERFLY.reduce((s, h) => s + h.people, 0),
  agents: BUTTERFLY.reduce((s, h) => s + h.agents, 0),
}

/** The hours in which agents read more than people: all but six office hours. */
export const BUTTERFLY_AGENT_HOURS = BUTTERFLY.filter((h) => h.agents > h.people).length

/** Thousands as millions: two places for an hour (so 1.40M and 1.42M part), one for the month. */
export const butterflyHour = (k: number) => `${(k / 1000).toFixed(2)}M`
export const butterflyMonth = (k: number) => `${(k / 1000).toFixed(1)}M`
export const butterflyReading = (h: (typeof BUTTERFLY)[number]) =>
  `${h.name}: ${butterflyHour(h.people)} people, ${butterflyHour(h.agents)} agents`

export const BUTTERFLY_TITLE = `Agents lead ${BUTTERFLY_AGENT_HOURS} of 24 hours`
export const BUTTERFLY_DESCRIPTION = "May’s reads by hour of day, people on the left and agents on the right."
