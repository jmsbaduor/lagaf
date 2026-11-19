// Row 07's numbers: three time series made up to agree with DEMO, each with the part that matters called out.
// data.check.mjs proves the agreement and every claim the copy makes. Plain TypeScript that names facts.ts in full,
// so Node runs it as is.
import { DEMO, demoAgentShare } from "../facts.ts"

/** Every plot in the row is 528px tall, from its zero at 792 up to 264 (32 under the y axis's name on TOP). */
export const AXIS = 528
export const round4 = (px: number) => Math.round(px / 4) * 4
export const millions = (n: number) => `${n.toFixed(2)}M`

// ── trajectory ──────────────────────────────────────────────────────────────────────────────────────────────────

/**
 * Agent page views a week, in millions, for the 26 weeks from Monday 1 December 2025 to Sunday 31 May 2026: 182
 * days, DEMO's six months exactly. Steady growth, a dip for the holidays (the weeks of December 22 and 29), a soft
 * week in March and in April, and a flatter May. Split by day into calendar months, they make DEMO.agents.
 */
// prettier-ignore
const WEEKLY = [
  0.69, 0.77, 0.81, 0.71, 0.75, 1.09, 1.16, 1.22, 1.4, 1.76, 1.98, 2.06, 2.34,
  2.49, 2.41, 2.94, 3.18, 3.67, 4.17, 4.69, 4.58, 5.49, 6.35, 6.67, 7.01, 7.42,
]
export const FIRST_MONDAY = Date.UTC(2025, 11, 1)
const DAY_MS = 86_400_000

/** 66px a million, so 8M is the axis's top and the 2M lines fall 132 apart. */
export const WEEK_PX = AXIS / 8
export const WEEK_TICKS = [0, 2, 4, 6, 8]

/** Each week with the DEMO month it starts in (0 is December, 5 is May) and its column's height. */
export const WEEKS = WEEKLY.map((views, i) => {
  const start = new Date(FIRST_MONDAY + i * 7 * DAY_MS)
  const month = (start.getUTCMonth() + 1) % 12
  return { start: `${DEMO.months[month]} ${start.getUTCDate()}`, month, views, h: round4(views * WEEK_PX) }
})
export const LAST_MONTH = DEMO.months.length - 1

// ── daily-requests ──────────────────────────────────────────────────────────────────────────────────────────────

/**
 * Agent requests a day, in thousands, for May 18 to 31 (Monday to Sunday, twice). Every agent page view is one
 * request, so each week sums to its WEEKLY figure: 7.01M and 7.42M. Weekends run about a fifth lower, as the agents'
 * week does in rhythm.
 */
const REQUESTS = [1049, 1043, 1094, 1063, 1028, 876, 857, 1098, 1142, 1119, 1131, 1098, 935, 897]
/** Of those, served from the cache: 70% on May 18, rising every day to 85% on May 31. */
const CACHED = [736, 735, 795, 778, 772, 673, 664, 853, 908, 894, 924, 918, 788, 763]
export const FIRST_DAY = 18
export const WEEKDAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"]

/** Count: 0.44px a thousand, so 1.2M is the axis's top and the 0.3M lines fall 132 apart. */
export const REQUEST_PX = AXIS / 1200
/** Share: 5.28px a percentage point, so the quarter lines fall 132 apart too and the ticks stay put. */
export const SHARE_PX = AXIS / 100
export const COUNT_TICKS = [0, 0.3, 0.6, 0.9, 1.2]
export const SHARE_TICKS = [0, 25, 50, 75, 100]

/**
 * Each day with its two heights per measure: the cached part from the baseline, and the column's top. The cached
 * part's top and the column's top are each the nearest 4px to exact; the uncached part fills between them, less the
 * 4px gap it gives up to part them.
 */
export const DAYS = REQUESTS.map((total, i) => {
  const cached = CACHED[i]
  const share = (cached / total) * 100
  return {
    tick: `${WEEKDAYS[i % 7]} ${FIRST_DAY + i}`,
    date: `${WEEKDAYS[i % 7]} May ${FIRST_DAY + i}`,
    total,
    cached,
    share,
    count: { cached: round4(cached * REQUEST_PX), total: round4(total * REQUEST_PX) },
    shareH: { cached: round4(share * SHARE_PX), total: AXIS },
  }
})
export const GAP = 4

// ── milestones ──────────────────────────────────────────────────────────────────────────────────────────────────

/**
 * Agents' share of docs page views, in percent, June to November 2025: flat until llms.txt is published in August,
 * then a steadier climb, all under December's 15%. December to May is DEMO's, exactly.
 */
const EARLIER = [5.1, 5.8, 6.4, 8.6, 10.7, 12.9]
export const YEAR_MONTHS = ["Jun", "Jul", "Aug", "Sep", "Oct", "Nov", ...DEMO.months]

/** 0 to 80% over the axis: 6.6px a point, so the 20% lines fall 132 apart and May's 62% sits under the top. */
export const YEAR_PX = AXIS / 80
export const YEAR_TICKS = [0, 20, 40, 60, 80]
export const YEAR = YEAR_MONTHS.map((month, i) => {
  const share = i < EARLIER.length ? EARLIER[i] : demoAgentShare(i - EARLIER.length)
  return { month, share, h: round4(share * YEAR_PX) }
})

/** The two launches, at the months where the line steepens. */
export const EVENTS = [
  { at: 2, name: "llms.txt published", date: "Aug 2025" },
  { at: 6, name: "MCP server live", date: "Dec 2025" },
]
