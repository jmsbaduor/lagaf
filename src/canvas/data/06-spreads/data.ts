// Row 06's numbers: three spreads behind figures rows 01 to 03 state as one number (the eval's accuracy, May's 62% agent
// share, the 0.8s median answer). Made up to agree with them; data.check.mjs proves it. Node runs this file as is.
import { DEMO, EVALS, seeded, TRAFFIC } from "../facts.ts"

// ── eval-sites ──────────────────────────────────────────────────────────────────────────────────────────────────

/** Questions per site in the eval (EVALS: 20 sites, 100 questions each), so a site's correct count is its percent. */
export const QUESTIONS = 100

/**
 * Correct answers per site, before and after llms.txt, in the eval's site order. Most sites gain a point or two, three
 * gain five or more, two were already perfect, none falls. They total 1952 and 1992 of 2000: EVALS' 97.6% and 99.6%.
 */
// prettier-ignore
const CORRECT = {
  before: [98, 99, 93, 99, 100, 97, 99, 98, 99, 91, 99, 96, 98, 100, 99, 94, 97, 99, 98, 99],
  after: [100, 100, 100, 100, 100, 98, 99, 99, 100, 99, 100, 99, 100, 100, 100, 99, 100, 100, 99, 100],
}
export const SITES = CORRECT.before.map((before, i) => ({
  name: `Site ${String(i + 1).padStart(2, "0")}`,
  before,
  after: CORRECT.after[i],
}))

/** The plot's axes, both ways: one cell a point, from 91% (the lowest site) to 100%. */
export const AXIS_MIN = 91
export const AXIS_MAX = 100
/** A cell is 52px, so it holds a 3 by 3 block of 12px squares on a 16px pitch, 4px from every edge. */
export const SITE_CELL = 52
export const SITE_SLOTS = 9

export const evalAccuracy = EVALS.find((e) => e.kind === "accuracy")!
export const mean = (key: "before" | "after") => SITES.reduce((s, x) => s + x[key], 0) / SITES.length
export const siteCounts = {
  gained: SITES.filter((s) => s.after > s.before).length,
  held: SITES.filter((s) => s.after === s.before).length,
  fell: SITES.filter((s) => s.after < s.before).length,
}

/**
 * Each site's place in its cell, 0 to 8 in reading order. Places are dealt per column (one "before"), the sites
 * that end highest first: a column of three or fewer takes the middle row, a fuller one fills rows from the top,
 * each row from its centre. Squares that share a column of places then start in the order they end, so as they rise
 * none crosses another (in column 99, seven rise past the one that held).
 */
export const SITE_SLOT = SITES.map((s, i) => {
  const column = SITES.filter((t) => t.before === s.before).length
  const k = SITES.filter((t, j) => t.before === s.before && (t.after > s.after || (t.after === s.after && j < i))).length
  return (column <= 3 ? 1 : Math.floor(k / 3)) * 3 + [1, 0, 2][k % 3]
})

// ── rhythm ──────────────────────────────────────────────────────────────────────────────────────────────────────

export const WEEKDAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"]
/** May 2026 starts on a Friday, so it has five Fridays, Saturdays and Sundays and four of every other day. */
export const MAY_DAYS = [4, 4, 4, 4, 5, 5, 5]

// Reads an hour on one day, before scaling, 00:00 to 23:00. People keep office hours with a dip at lunch and read a
// little at weekends; agents read all day and night, lifted in working hours because people set them going.
const PEOPLE_WEEKDAY = [6, 4, 3, 3, 3, 5, 10, 22, 48, 80, 92, 90, 70, 84, 90, 86, 74, 52, 30, 22, 18, 14, 10, 8]
const PEOPLE_WEEKEND = [8, 6, 4, 3, 3, 3, 4, 6, 10, 16, 22, 26, 27, 26, 25, 24, 22, 20, 18, 17, 16, 14, 12, 10]
const AGENTS_WEEKDAY = [42, 40, 39, 39, 40, 42, 45, 50, 56, 61, 63, 63, 61, 62, 63, 62, 58, 53, 49, 47, 46, 45, 44, 43]
const AGENTS_WEEKEND = [40, 39, 38, 38, 38, 39, 40, 41, 43, 45, 46, 47, 47, 46, 46, 45, 45, 44, 43, 42, 41, 41, 40, 40]
// Each day's own level: Monday and Tuesday busiest, Friday afternoons and Sundays quieter.
const PEOPLE_DAY = [1.05, 1.06, 1.03, 1.0, 0.94, 1.0, 0.86]
const AGENTS_DAY = [1.02, 1.03, 1.03, 1.01, 0.99, 0.97, 0.96]

/**
 * Round `raw` to whole numbers that sum to `total` exactly: floor each, then give the leftover units to the
 * largest remainders.
 */
function apportion(raw: number[], total: number) {
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

/** May's reads in each weekday and hour, in thousands, summed over that weekday's days in May. */
export const HOURS = (() => {
  const rand = seeded(6)
  const jitter = () => 0.96 + rand() * 0.08 // ±4%, so no two weekdays draw the same row
  const cells = WEEKDAYS.flatMap((_, d) =>
    Array.from({ length: 24 }, (_, h) => {
      const weekend = d >= 5
      // Friday from 15:00 people wind down.
      const friday = d === 4 && h >= 15 ? 0.8 : 1
      return {
        day: d,
        hour: h,
        people: (weekend ? PEOPLE_WEEKEND : PEOPLE_WEEKDAY)[h] * PEOPLE_DAY[d] * friday * MAY_DAYS[d] * jitter(),
        agents: (weekend ? AGENTS_WEEKEND : AGENTS_WEEKDAY)[h] * AGENTS_DAY[d] * MAY_DAYS[d] * jitter(),
      }
    })
  )
  // May's totals, DEMO's last month: 18.2M people and 29.8M agents, so 48M at 62% agents.
  const people = apportion(
    cells.map((c) => c.people),
    Math.round(DEMO.people.at(-1)! * 1000)
  )
  const agents = apportion(
    cells.map((c) => c.agents),
    Math.round(DEMO.agents.at(-1)! * 1000)
  )
  return cells.map((c, i) => {
    const all = people[i] + agents[i]
    return {
      day: c.day,
      hour: c.hour,
      people: people[i],
      agents: agents[i],
      /** The agents' share of the hour's reads, in percent. */
      share: (agents[i] / all) * 100,
      /** Reads an hour on that weekday, in thousands: the May total over its days. */
      perHour: all / MAY_DAYS[c.day],
    }
  })
})()

/** What a cell reads, as the chart writes it: the agents' share in whole percent, reads an hour in whole thousands. */
export const cellValue = (c: (typeof HOURS)[number], measure: "share" | "reads") =>
  Math.round(measure === "share" ? c.share : c.perHour)

/**
 * The colour steps, low to high: a cell takes the step of the highest threshold its value reaches. Shares run from
 * under 45% (weekday working hours, with lunch a step up) to 85% and over (the small hours); reads an hour from
 * under 40K at night to 120K and over on weekday mornings and afternoons.
 */
export const STEPS = {
  share: [0, 45, 55, 65, 75, 85],
  reads: [0, 40, 60, 80, 100, 120],
}
export const stepOf = (value: number, steps: number[]) => steps.findLastIndex((t) => value >= t)

export const hourName = (h: number) => `${String(h).padStart(2, "0")}:00`

// ── answer-spread ───────────────────────────────────────────────────────────────────────────────────────────────

/** Bins of 0.2s from 0 to 4s, and one for 4s and over. */
export const BIN_S = 0.2
/**
 * May's agent answers per bin, in tenths of a percent (1000 is every answer). A quick rise to a peak just under the
 * median, then a long tail: the first four bins hold exactly half, so the median is 0.8s (TRAFFIC.answerTime).
 */
export const ANSWER_BINS = [22, 86, 178, 214, 166, 112, 74, 48, 32, 22, 12, 9, 7, 5, 4, 3, 2, 1, 1, 1, 1]
export const binName = (i: number) =>
  i === ANSWER_BINS.length - 1 ? "4s and over" : `${(i * BIN_S).toFixed(1)}–${((i + 1) * BIN_S).toFixed(1)}s`

/** The median, interpolated within the bin where the running total passes half. */
export function medianSeconds(bins = ANSWER_BINS) {
  const total = bins.reduce((s, x) => s + x, 0)
  let below = 0
  for (const [i, n] of bins.entries()) {
    if (below + n >= total / 2) return Number(((i + (total / 2 - below) / n) * BIN_S).toFixed(6))
    below += n
  }
  return NaN
}

/** One scale for every bar: 24px a percentage point, rounded to the 4px grid (within 2px of exact). */
export const ANSWER_PX = 24
export const barHeight = (tenths: number) => Math.round(((tenths / 10) * ANSWER_PX) / 4) * 4
/** Gridlines every 5 points, up to 20%. */
export const ANSWER_TICKS = [0, 5, 10, 15, 20]

export const answerMedian = TRAFFIC.answerTime.value
