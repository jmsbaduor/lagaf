// Row 11's numbers: the state of a docs platform's sections week by week, made up to agree with DEMO and update lag
// (LAG); data.check.mjs proves it. Node runs this file as is.
import { LAG } from "../facts.ts"

// ── freshness ───────────────────────────────────────────────────────────────────────────────────────────────────

/**
 * A section's state at the end of a week, by the oldest product change its docs have not caught up with. The
 * stale threshold is update lag's last bucket, "One month or longer" (22% of updates take that long).
 */
export const STATES = [
  { id: "fresh", name: "Fresh", note: "Within a week of the product" },
  { id: "aging", name: "Aging", note: "One week to a month behind" },
  { id: "stale", name: "Stale", note: "A month or longer behind" },
] as const
export type State = (typeof STATES)[number]["id"]
export const staleLag = LAG[LAG.length - 1]

/** The twelve weeks before the readouts' 26 May, by the Monday each starts on: 2 March to 18 May 2026. */
export const WEEKS = Array.from({ length: 12 }, (_, i) => new Date(Date.UTC(2026, 2, 2 + i * 7)))
export const weekName = (d: Date) =>
  d.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    timeZone: "UTC",
  })

/**
 * Each section's twelve weeks: F fresh, A aging, S stale. Most stay fresh. The v2 API launch in the week of 16 March
 * leaves the API reference, Webhooks and the Python SDK behind: aging from late March, stale in April once a change
 * is a month old, caught up in May. The JavaScript SDK falls behind for two weeks and catches up. Smaller lags
 * elsewhere: Themes carried over from February, Billing after a pricing change, Search after a ranking change in May.
 */
// prettier-ignore
const GRID = {
  "Quickstart":      "FFFFFFFFFFFF",
  "Installation":    "FFFFFFFFFFFF",
  "Authentication":  "FFFFFFFFFFFF",
  "API keys":        "FFFFFFFFFFFF",
  "API reference":   "FFFAAASSSFFF",
  "Webhooks":        "FFFAAASSSSFF",
  "JavaScript SDK":  "FFFAAFFFFFFF",
  "Python SDK":      "FFFFAAASSAFF",
  "CLI":             "FFFFFFFFFFFF",
  "MCP server":      "FFFFFFAFFFFF",
  "llms.txt":        "FFFFFFFFFFFF",
  "Search":          "FFFFFFFFFFAA",
  "Analytics":       "FFFFFFFFAFFF",
  "Billing":         "FAAFFFFFFFFF",
  "Teams and roles": "FFFFFFFFFFFF",
  "SSO":             "FAFFFFFFFFFF",
  "Themes":          "AAAFFFFFFFFF",
  "Components":      "FFFFFFFFFAAF",
  "Deployments":     "FFFFFFFFFFFF",
  "Changelog":       "FFFFFFFFFFFF",
}
const LETTER: Record<string, State> = { F: "fresh", A: "aging", S: "stale" }

/** The chart draws 12 to 24 sections (rowPitch); 20 here. */
export const SECTIONS = Object.entries(GRID).map(([name, weeks]) => ({
  name,
  weeks: [...weeks].map((l) => LETTER[l]),
}))

export const countOf = (weeks: readonly State[], state: State) => weeks.filter((w) => w === state).length
export const TOTALS = Object.fromEntries(
  STATES.map((s) => [s.id, SECTIONS.reduce((n, x) => n + countOf(x.weeks, s.id), 0)])
) as Record<State, number>
export const CELLS = SECTIONS.length * WEEKS.length

/** A section's reading, as the hint writes it. */
export const sectionReading = (s: (typeof SECTIONS)[number]) =>
  `${s.name}: ${STATES.map((t) => `${countOf(s.weeks, t.id)} ${t.id}`).join(", ")}`

/**
 * The row pitch for `n` sections: the tallest of 36, 28 and 20 whose rows end by 800 from TOP, so the week ticks
 * under them end by 828. Each leaves the stale mark (8px) centred on the 4px grid in a cell 4px shorter.
 */
export const rowPitch = (n: number) => [36, 28, 20].find((r) => n * r - 4 <= 568) ?? 20
