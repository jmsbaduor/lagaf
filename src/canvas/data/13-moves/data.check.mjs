// Row 13: what is drawn equals the numbers, and the copy's claims hold. Run: node src/canvas/data/13-moves/data.check.mjs
import assert from "node:assert/strict"
import * as d from "./data.ts"

// ── Ranges ──
{
  const f = await import("../facts.ts")
  const s = await import("../06-spreads/data.ts")
  const R = d.RANGES

  // Six months, DEMO's, with DEMO's medians; the quantile rule gives row 06's median back.
  assert.deepEqual(R.map((r) => r.month), [...f.DEMO.months])
  assert.deepEqual(R.map((r) => r.median), [...f.DEMO.answerTime])
  assert.equal(R.at(-1).median, f.TRAFFIC.answerTime.value)
  assert.ok(Math.abs(d.rangesQuantile(0.5) - s.medianSeconds()) < 1e-9)

  // May's tenths come from May's bins: 10% of answers land by 0.38s and 90% by exactly 1.6s.
  assert.ok(Math.abs(d.rangesQuantile(0.1) - (1 + 78 / 86) * s.BIN_S) < 1e-9)
  assert.ok(Math.abs(d.rangesQuantile(0.9) - 1.6) < 1e-9)
  assert.equal(R.at(-1).p10, 0.4)
  assert.equal(R.at(-1).p90, 1.6)

  // Each month the median sits inside its span.
  for (const r of R) assert.ok(r.p10 < r.median && r.median < r.p90, `${r.month}: median outside its span`)

  // The title: faster (the median and both ends fall each month) and steadier (the span narrows each month).
  const spread = R.map((r) => r.p90 - r.p10)
  for (let i = 1; i < R.length; i++) {
    assert.ok(R[i].median < R[i - 1].median, `${R[i].month}: median did not fall`)
    assert.ok(R[i].p10 < R[i - 1].p10 && R[i].p90 < R[i - 1].p90, `${R[i].month}: span did not fall`)
    assert.ok(spread[i] < spread[i - 1], `${R[i].month}: span did not narrow`)
  }
  // Unevenly: no two months narrow by the same amount.
  const steps = spread.slice(1).map((x, i) => +(spread[i] - x).toFixed(1))
  assert.equal(new Set(steps).size, steps.length, `even steps ${steps}`)
  // The hint's own example.
  assert.equal(d.rangesSay(R[3]), "Mar: 0.6–2.9s, median 1.3s")

  // Heights on the 4px grid, within 2px of exact; second lines on the grid. The axis tops out at the whole second
  // over December's p90, which fills most of the height.
  for (const r of R)
    for (const [v, h] of [
      [r.p10, r.h10],
      [r.median, r.hMedian],
      [r.p90, r.h90],
    ]) {
      assert.equal(h % 4, 0)
      assert.ok(Math.abs(h - v * d.RANGES_PX) <= 2, `${v}s is ${h}px`)
    }
  assert.ok(d.RANGES_TICKS.every((t) => (t * d.RANGES_PX) % 4 === 0))
  const top = d.RANGES_TICKS.at(-1)
  assert.equal(top, Math.ceil(Math.max(...R.map((r) => r.p90))))
  assert.ok(R[0].p90 / top > 0.9)
  // The plot runs from 264 (TOP + 32) to the baseline at 792; the month ticks under it end at 820, by 828.
  assert.equal(264 + top * d.RANGES_PX, 792)
  assert.ok(792 + 12 + 16 <= 828)
}

// ── Dumbbell ──

{
  const f = await import("../facts.ts")
  const { SHIFT } = await import("../10-changes/data.ts")
  const dumbbellNear = (a, b, tol) => Math.abs(a - b) <= tol
  const dumbbellSum = (xs) => xs.reduce((s, x) => s + x, 0)
  const D = d.DUMBBELL
  const TOP = 232 // the kit's TOP

  // Five sources, in READERS' order; May's shares are READERS' exactly.
  assert.deepEqual(D.map((s) => s.name), f.READERS.map((r) => r.name))
  D.forEach((s, i) => assert.equal(s.may, f.READERS[i].agents))
  assert.deepEqual(D.map((s) => s.may), [56, 76, 96, 98, 40])

  // December's agent views make DEMO's December agents, 3.3M; what's left of each source's December views is
  // people, and they make DEMO's December people, 18.4M.
  assert.ok(dumbbellNear(dumbbellSum(D.map((s) => s.agents)), f.DEMO.agents[0], 1e-9), "December agents are not 3.3M")
  assert.ok(dumbbellNear(dumbbellSum(D.map((s) => s.views - s.agents)), f.DEMO.people[0], 1e-9), "December people are not 18.4M")
  // Each source's agents fit inside its December views, as row 10's shift draws them.
  for (const s of D) {
    assert.equal(s.views, SHIFT.find((x) => x.name === s.name).dec)
    assert.ok(s.agents > 0 && s.agents < s.views, `${s.name}: ${s.agents}M agents of ${s.views}M views`)
  }
  // People held level: each source's December people are within 1M of its May people.
  for (const s of D) {
    const mayViews = f.DEMO.sources.find((x) => x.name === s.name).views
    const mayPeople = (mayViews * (100 - s.may)) / 100
    assert.ok(Math.abs(s.views - s.agents - mayPeople) < 1, `${s.name}: people moved ${(s.views - s.agents - mayPeople).toFixed(2)}M`)
  }

  // Shares as read, and the change in points between them.
  for (const s of D) {
    assert.ok(dumbbellNear(s.exact, (s.agents / s.views) * 100, 1e-9))
    assert.equal(s.dec, Math.round(s.exact))
    assert.equal(s.change, s.may - s.dec)
  }
  assert.deepEqual(D.map((s) => s.dec), [8, 31, 87, 90, 17])
  assert.deepEqual(D.map((s) => d.dumbbellChange(s.change)), ["+48 pts", "+45 pts", "+9 pts", "+8 pts", "+23 pts"])

  // Title, "Every source's agent share rose": each December share is under May's, exact and as read.
  for (const s of D) assert.ok(s.exact < s.may && s.dec < s.may, `${s.name} did not rise`)
  // A reading says both shares as drawn, "API reference: 31% → 76%".
  assert.equal(d.dumbbellReading(D[1]), "API reference: 31% → 76%")
  // Description: one sentence of 50 to 80 characters, naming the two months the dots are.
  assert.deepEqual([f.DEMO.months[0], f.DEMO.months.at(-1)], ["Dec", "May"])
  const description = "Agents’ share of each source’s reads, in December and in May."
  assert.ok(description.length >= 50 && description.length <= 80, `description is ${description.length}`)

  // Px: each dot's centre within 2px of exact on the 0 to 100% axis, on the grid, so a 24px dot's edges are too.
  for (const s of D) {
    for (const [x, v, m] of [
      [s.decX, s.exact, "Dec"],
      [s.mayX, s.may, "May"],
    ]) {
      assert.equal(x % 4, 0, `${s.name} ${m}: x ${x} is off the grid`)
      assert.ok(dumbbellNear(x, d.dumbbellX(v), 2), `${s.name} ${m}: x ${x} is ${(x - d.dumbbellX(v)).toFixed(2)} from exact`)
      assert.ok(x >= d.dumbbellX(0) && x <= d.dumbbellX(100), `${s.name} ${m} is off the axis`)
    }
    // The bar runs between the dots and always shows: 32px at least.
    assert.ok(s.mayX - s.decX - d.DUMBBELL_DOT >= 32, `${s.name}: the bar is ${s.mayX - s.decX - d.DUMBBELL_DOT}px`)
  }
  assert.equal(d.DUMBBELL_DOT % 8, 0, "a dot centred on the grid needs a width of whole 8s")
  for (let v = 0; v <= 100; v += 10) assert.equal(d.dumbbellX(v) % 4, 0, `the ${v}% gridline is off the grid`)
  // The 100% tick, 48 wide, ends on the content's right edge; the 0% tick starts 24 after the 224 name column.
  assert.equal(d.dumbbellX(100) + 24, 1368)
  assert.equal(d.dumbbellX(0) - 24, 72 + 224 + 24)
  // A change label is a 160 box right-aligned to its May dot's right edge: its text (at 40px Geist, about 22px a
  // character) fits it, and the box starts past the 0% tick and ends inside the content box.
  for (const s of D) {
    const right = s.mayX + d.DUMBBELL_DOT / 2
    assert.ok(d.dumbbellChange(s.change).length * 22 <= 160, `${s.name}'s change label overflows its box`)
    assert.ok(right <= 1368 && right - 160 > d.dumbbellX(0), `${s.name}'s change label leaves the plot`)
  }
  // dumbbell.tsx: five rows of 108 from TOP, the last dot ending on 740; the baseline 4 under the rows at 776 puts
  // the axis name, under the ticks, on 828.
  assert.equal(TOP + 4 * 108 + 76, 740)
  assert.equal(TOP + 5 * 108 + 4 + 36 + 16, 828)

  console.log("dumbbell ok", D.map((s) => `${s.name} ${s.dec}→${s.may} (${s.decX}→${s.mayX})`).join(", "))
}

// ── Bump ────────────────────────────────────────────────────────────────────────────────────────────────────────
{
  const f = await import("../facts.ts")
  const r = await import("../08-ranks/data.ts")
  const bumpNear = (a, b, tol) => Math.abs(a - b) <= tol
  const B = d.BUMP
  const by = Object.fromEntries(B.map((t) => [t.name, t]))
  const TOP = 232 // the kit's TOP

  // Six types, row 08's, each with a value and a rank for each of DEMO's six months.
  assert.equal(B.length, 6)
  assert.deepEqual(B.map((t) => t.name), r.AGENT_TYPES.map((t) => t.name))
  for (const t of B) assert.equal(t.reads.length, f.DEMO.months.length)

  // Each month's reads make DEMO's agent reads for it: 3.3, 5.1, 8.0, 12.4, 19.2 and 29.8M.
  f.DEMO.agents.forEach((total, i) => {
    const s = B.reduce((a, t) => a + t.reads[i], 0)
    assert.ok(bumpNear(s, total, 1e-9), `${f.DEMO.months[i]}: ${s}M against ${total}M`)
  })
  // May is row 08's: each type's share of May's agent reads, ranked as the leaderboard ranks them.
  for (const t of B) {
    const l = r.LEADERS.find((x) => x.name === t.name)
    assert.ok(bumpNear((t.reads[5] / f.DEMO.agents[5]) * 100, l.exact, 1e-9), `${t.name}'s May share`)
    assert.equal(t.ranks[5], l.rank, `${t.name}'s May rank`)
  }
  // Every type grew every month (agents grew ninefold), with no ties, so every month's ranks are 1 to 6 once each.
  for (const t of B) t.reads.slice(1).forEach((v, i) => assert.ok(v > t.reads[i], `${t.name} fell in ${f.DEMO.months[i + 1]}`))
  f.DEMO.months.forEach((m, i) => assert.deepEqual(B.map((t) => t.ranks[i]).sort(), [1, 2, 3, 4, 5, 6], `${m} ranks`))

  // The ranks drawn, month by month: coding agents climb a place a month; each type they pass slips one.
  assert.deepEqual(Object.fromEntries(B.map((t) => [t.name, t.ranks.join("")])), {
    "Coding agents": "432111",
    "Chat assistants": "111222",
    "AI search": "223333",
    "Support bots": "344444",
    Evaluators: "555555",
    "Other agents": "666666",
  })
  // Title, "Coding agents led from March": first in March, April and May, and never before.
  const lead = by[d.BUMP_LEAD]
  assert.equal(lead.ranks.indexOf(1), f.DEMO.months.indexOf("Mar"))
  assert.ok(lead.ranks.slice(3).every((x) => x === 1))
  // Readings, as the hint writes them: "Coding agents: 4th → 1st".
  assert.equal(d.bumpSay(lead), "Coding agents: 4th → 1st")
  assert.equal(d.bumpSay(by["Support bots"]), "Support bots: 3rd → 4th")

  // Points: on the 8px grid (so a 16px point's edges are on 4), months from 176 to 1096, ranks from 264 to 784.
  for (const t of B) {
    t.pts.forEach(([x, y], i) => {
      assert.equal(x % 8, 0)
      assert.equal(y % 8, 0)
      assert.equal(x, d.bumpX(i))
      assert.equal(y, d.bumpY(t.ranks[i]))
    })
    assert.ok(t.d.startsWith(`M${t.pts[0][0]} ${t.pts[0][1]}C`))
    assert.ok(t.d.endsWith(` ${t.pts[5][0]} ${t.pts[5][1]}`))
    // Five curves, one between each pair of months.
    assert.equal(t.d.split("C").length, 6)
  }
  assert.equal(d.bumpX(0), 176)
  assert.equal(d.bumpX(5), 1096)
  assert.equal(d.bumpY(1), TOP + 32, "rank 1 is not 32 under the axis's name")
  // The sixth rank's point and its paper ring end above the month ticks (12 under 792, to 820), inside 828.
  assert.ok(d.bumpY(6) + 8 + 2 < 792 + 12)
  assert.ok(792 + 12 + 16 <= 828)
  // End labels: 32 tall, centred on the May point, from 1120 (24 after it) to 1368.
  for (let k = 1; k <= 6; k++) assert.equal((d.bumpY(k) - 16) % 4, 0)
  assert.equal(d.bumpX(5) + 24, 1120)

  console.log("bump ok", B.map((t) => `${t.name} ${t.ranks.join("")}`).join(", "))
}
