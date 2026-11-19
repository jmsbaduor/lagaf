// Row 11 draws what its data says, and its data agrees with DEMO and update lag.
// Run: node src/canvas/data/11-status/data.check.mjs (Node 24 reads the .ts files as is).
import assert from "node:assert/strict"

import * as f from "../facts.ts"
import * as d from "./data.ts"

// ── freshness ──
// Twenty sections by twelve weeks (the description says so), one state a cell.
assert.equal(d.SECTIONS.length, 20)
assert.equal(d.WEEKS.length, 12)
assert.equal(d.CELLS, 240)
for (const s of d.SECTIONS) {
  assert.equal(s.weeks.length, d.WEEKS.length, s.name)
  assert.ok(
    s.weeks.every((w) => d.STATES.some((t) => t.id === w)),
    `${s.name}: unknown state`
  )
}
assert.equal(new Set(d.SECTIONS.map((s) => s.name)).size, d.SECTIONS.length)

// The weeks: consecutive Mondays from 2 March 2026, inside DEMO's months, the last ending before the readouts' 26 May.
const DAY = 86_400_000
d.WEEKS.forEach((w, i) => {
  assert.equal(w.getUTCDay(), 1, `${w.toISOString()} is not a Monday`)
  if (i) assert.equal(w - d.WEEKS[i - 1], 7 * DAY)
  assert.ok(f.DEMO.months.includes(d.weekName(w).slice(0, 3)), `${d.weekName(w)} is outside DEMO`)
})
assert.equal(d.weekName(d.WEEKS[0]), "Mar 2")
assert.ok(+d.WEEKS.at(-1) + 6 * DAY < Date.UTC(2026, 4, 26))

// Counts per state, as the key draws them, and they make every cell.
assert.deepEqual(d.TOTALS, { fresh: 207, aging: 24, stale: 9 })
assert.equal(d.TOTALS.fresh + d.TOTALS.aging + d.TOTALS.stale, d.CELLS)
// Mostly fresh: over 85% of section weeks.
assert.ok(d.TOTALS.fresh / d.CELLS > 0.85)

// The title: three sections went stale in April. Exactly three sections are ever stale, none before April, and each
// one's first stale week starts in April.
const april = d.WEEKS.flatMap((w, i) => (w.getUTCMonth() === 3 ? [i] : []))
assert.deepEqual(april, [5, 6, 7, 8])
const stale = d.SECTIONS.filter((s) => s.weeks.includes("stale"))
assert.deepEqual(
  stale.map((s) => s.name),
  ["API reference", "Webhooks", "Python SDK"]
)
for (const s of stale) assert.ok(april.includes(s.weeks.indexOf("stale")), `${s.name} went stale outside April`)
// Stale means a change a month old, so every stale run follows at least three aging weeks.
for (const s of d.SECTIONS)
  s.weeks.forEach((w, i) => {
    if (w === "stale" && s.weeks[i - 1] !== "stale")
      assert.deepEqual(s.weeks.slice(i - 3, i), ["aging", "aging", "aging"], `${s.name} went stale without aging`)
  })
// And they recover: each is fresh by the last week.
for (const s of stale) assert.equal(s.weeks.at(-1), "fresh", `${s.name} never caught up`)

// The stale threshold is update lag's longest bucket, which a share of updates reaches, so stale weeks exist.
assert.equal(d.staleLag.label, "One month or longer")
assert.ok(d.staleLag.value > 0 && d.TOTALS.stale > 0)

// Readings, as the hint writes them.
assert.equal(d.sectionReading(stale[0]), "API reference: 6 fresh, 3 aging, 3 stale")

// Layout: 12 to 24 sections fit TOP to 800 (the week ticks end by 828), on the 4px grid, the 8px stale mark centred
// on it; 20 sections take a 28px pitch.
for (let n = 12; n <= 24; n++) {
  const r = d.rowPitch(n)
  assert.ok(232 + n * r - 4 <= 800, `${n} sections overflow`)
  assert.equal(r % 4, 0)
  assert.equal(((r - 4 - 8) / 2) % 4, 0, `${n} sections: the stale mark is off the grid`)
}
assert.equal(d.rowPitch(d.SECTIONS.length), 28)

console.log("11-status ok", d.TOTALS)
