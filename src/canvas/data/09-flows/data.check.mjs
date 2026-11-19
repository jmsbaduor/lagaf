// Row 09: what is drawn equals the numbers, and the copy's claims hold. Run: node src/canvas/data/09-flows/data.check.mjs
import assert from "node:assert/strict"

import * as f from "../facts.ts"
import * as d from "./data.ts"

const near = (a, b, tol) => Math.abs(a - b) <= tol
const sum = (xs) => xs.reduce((s, x) => s + x, 0)
const onGrid = (n) => n % 4 === 0
// A drawn length is on the 4px grid and within 2px of exact.
const length = (drawn, exact, what) =>
  assert.ok(onGrid(drawn) && near(drawn, exact, 2), `${what}: drawn ${drawn}, exact ${exact.toFixed(2)}`)

// ── Journeys ────────────────────────────────────────────────────────────────────────────────────────────────────

const blocks = d.BLOCKS.flat()
const byKey = new Map(blocks.map((b) => [b.key, b]))

// Sessions are conserved: what reaches a page leaves it at the next step; only the first and last columns are ends.
for (const b of blocks) {
  if (b.step > 0 && b.step < 3) assert.equal(b.inK, b.outK, `${b.key} takes in ${b.inK}K and gives out ${b.outK}K`)
  // Its bands stack edge to edge on both sides, so a middle block's drawn in and out are the same height.
  if (b.step > 0 && b.step < 3) assert.equal(b.inH, b.outH, `${b.key} draws ${b.inH} in and ${b.outH} out`)
  length(b.h, b.k * d.PX_PER_K, `${b.key} height`)
  assert.ok(onGrid(b.x) && onGrid(b.y), `${b.key} is off the grid at ${b.x},${b.y}`)
  // Every block is tall enough for its label row (12 + 20 + 12, so 48 on the grid).
  assert.ok(b.h >= 48, `${b.key} is ${b.h} tall, too short for its label`)
}
const columnK = d.BLOCKS.map((col) => sum(col.map((b) => b.k)))
columnK.forEach((k) => assert.equal(k, d.SESSIONS, "every column holds every session"))

// Every band: on the grid, within 2px of exact, from the right edge of its page to the left edge of the next.
for (const band of d.BANDS) {
  length(band.h, band.k * d.PX_PER_K, `${band.key} thickness`)
  const a = byKey.get(band.from)
  const b = byKey.get(band.to)
  assert.equal(b.step, a.step + 1, `${band.key} skips a step`)
  assert.equal(band.x0, a.x + d.BLOCK_W)
  assert.equal(band.x1, b.x)
  assert.ok(band.y0 >= a.y && band.y0 + band.h <= a.y + a.h, `${band.key} leaves off its page`)
  assert.ok(band.y1 >= b.y && band.y1 + band.h <= b.y + b.h, `${band.key} lands off its page`)
}
// Bands tile each block's sides exactly: no gap, no overlap.
for (const b of blocks) {
  for (const [side, bands, y] of [
    ["out", d.BANDS.filter((x) => x.from === b.key), "y0"],
    ["in", d.BANDS.filter((x) => x.to === b.key), "y1"],
  ]) {
    if (!bands.length) continue
    let at = b.y
    for (const x of [...bands].sort((p, q) => p[y] - q[y])) {
      assert.equal(x[y], at, `${b.key}'s ${side} bands don't meet at ${at}`)
      at += x.h
    }
    assert.equal(at, b.y + b.h, `${b.key}'s ${side} bands don't fill it`)
  }
}
// Every column spans the same height from the plot's top, its blocks spread by whole 4px gaps, ending above the
// step names (12 under the foot, 16 tall), which end by 828 when the plot starts on TOP (232).
for (const col of d.BLOCKS) {
  assert.equal(col[0].y, 0)
  assert.equal(col.at(-1).y + col.at(-1).h, d.PLOT_H)
  col.slice(1).forEach((b, i) => assert.ok(onGrid(b.y - col[i].y - col[i].h), `${b.key} gap is off the grid`))
}
assert.ok(232 + d.PLOT_H + 12 + 16 <= 828, `the plot runs to ${232 + d.PLOT_H}`)
// Columns fill the content width.
assert.equal(d.BLOCKS[3][0].x + d.BLOCK_W, 1296)

// Copy: "May's 1.2M four-page API reference sessions": four pages each fit in May's API reference views (7.8M).
assert.equal(d.thousands(d.SESSIONS), "1.2M")
const apiViews = f.DEMO.sources.find((s) => s.name === "API reference").views * 1000
assert.ok(4 * d.SESSIONS <= apiViews, `${4 * d.SESSIONS}K page views in four-page sessions, ${apiViews}K in all`)
// "API readers head for deploys": deploys is the last page of more sessions than any other, ahead by a clear margin.
assert.equal(d.TOP_EXIT.page, "deploys")
const exits = d.BLOCKS[3].map((b) => b.k).sort((a, b) => b - a)
assert.ok(exits[0] > 1.5 * exits[1], `deploys ${exits[0]}K against ${exits[1]}K`)

// ── Gauge ───────────────────────────────────────────────────────────────────────────────────────────────────────

// The dial draws eval-rows' accuracy: "Accuracy rose to 99.6%", "up 2 points from 97.6%".
const accuracy = f.EVALS.find((e) => e.kind === "accuracy")
assert.equal(d.DIAL.before, accuracy.before)
assert.equal(d.DIAL.after, accuracy.after)
assert.equal(d.DIAL.after, accuracy.stat)
assert.ok(d.DIAL.after > d.DIAL.before)
assert.equal(+(d.DIAL.after - d.DIAL.before).toFixed(1), 2)
// Both readings sit on the dial, which ends at 100%.
for (const v of [d.DIAL.before, d.DIAL.after]) assert.ok(d.dialAt(v) > 0 && d.dialAt(v) < 1, `${v} is off the dial`)
assert.equal(d.DIAL.to, 100)

// ── Time saved ──────────────────────────────────────────────────────────────────────────────────────────────────

// Docs answered a whole number of questions, and the hours follow from them at the stated minutes each:
// "Docs saved 178 hours in May", "1,425 questions", "68%", "saving 11 minutes each".
assert.ok(Number.isInteger(d.ANSWERED), `docs answered ${d.ANSWERED} questions`)
assert.equal(d.ANSWERED, 969)
assert.equal(d.HOURS, Math.round((d.ANSWERED * d.MINUTES_EACH) / 60))
assert.equal(d.HOURS, 178)
// The split makes 100% of questions, a whole percent a tick on the ring's 100.
assert.equal(sum(d.SPLIT.map((s) => s.share)), 100)
d.SPLIT.forEach((s) => assert.ok(Number.isInteger(s.share)))
assert.equal(d.SPLIT.filter((s) => s.lead).length, 1)
// Even if every one of the 10,000+ teams were the median one, its docs' answers fit in May's 48M page views.
assert.ok((f.TRAFFIC.teams.value * d.ANSWERED) / 1e6 <= f.TRAFFIC.pageViews.value)

console.log("09-flows ok", {
  sessions: d.SESSIONS,
  columns: d.BLOCKS.map((col) => col.map((b) => `${b.page} ${b.k}K ${b.h}px`).join(", ")),
  hours: d.HOURS,
})
