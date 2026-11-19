// Row 10: what is drawn equals the numbers, and the copy's claims hold. Run: node src/canvas/data/10-changes/data.check.mjs
import assert from "node:assert/strict"
import * as f from "../facts.ts"
import * as d from "./data.ts"

const near = (a, b, tol) => Math.abs(a - b) <= tol
const sum = (xs) => xs.reduce((s, x) => s + x, 0)

// ── Bridge ──────────────────────────────────────────────────────────────────────────────────────────────────────
// Every bar comes from DEMO, the steps add up to the totals, and every edge sits on the 4px grid within 2px of exact.

{
  const f = await import("../facts.ts")
  const D = f.DEMO
  const near = (a, b, tol) => Math.abs(a - b) <= tol
  const B = d.BRIDGE
  const last = D.months.length - 1

  // Eight bars: December's total, five agent months, people's net, May's total.
  assert.deepEqual(B.map((b) => b.kind), ["total", "agents", "agents", "agents", "agents", "agents", "people", "total"])
  assert.ok(near(B[0].value, D.agents[0] + D.people[0], 1e-9), "Dec total is not DEMO's")
  assert.equal(B[0].value, 21.7)
  assert.ok(near(B.at(-1).value, D.agents[last] + D.people[last], 1e-9), "May total is not DEMO's")
  assert.equal(B.at(-1).value, 48)
  assert.equal(f.TRAFFIC.pageViews.format(B.at(-1).value), "48M", "May total disagrees with the readout's 48M")

  // Each agent step is that month's agents less the month before's; people's step is May's people less December's.
  for (let i = 1; i <= last; i++) assert.ok(near(B[i].value, D.agents[i] - D.agents[i - 1], 1e-9), `${D.months[i]} step`)
  assert.deepEqual(B.slice(1, 6).map((b) => b.value), [1.8, 2.9, 4.4, 6.8, 10.6])
  assert.deepEqual(B.slice(1, 6).map((b) => b.tick), D.months.slice(1))
  assert.ok(near(B[6].value, D.people[last] - D.people[0], 1e-9), "people step")
  assert.equal(B[6].value, -0.2)

  // Running totals: each step starts where the bar before it ends, and the last step lands on May's total.
  assert.deepEqual(B.slice(1, 7).map((b) => b.to), [23.5, 26.4, 30.8, 37.6, 48.2, 48])
  for (let i = 1; i < B.length - 1; i++) {
    assert.equal(B[i].from, B[i - 1].to, `${B[i].name} does not start on the running total`)
    assert.equal(B[i].fromPx, B[i - 1].toPx, `${B[i].name}'s connector would jog`)
  }
  assert.equal(B[6].to, B.at(-1).value, "the steps do not reach May's total")
  assert.equal(B[6].toPx, B.at(-1).toPx, "people's step does not end on May's total")

  // Px: every edge on the grid and within 2px of exact, on the 0 to 50M axis. A step under 4px exact (people's 2px)
  // draws at 4, the grid's least.
  for (const b of B) {
    for (const [px, v] of [
      [b.fromPx, b.from],
      [b.toPx, b.to],
    ]) {
      assert.equal(px % 4, 0, `${b.name}: ${px}px is off the grid`)
      assert.ok(near(px, v * d.BRIDGE_PX, 2), `${b.name}: ${px}px is ${(px - v * d.BRIDGE_PX).toFixed(2)}px from exact`)
      assert.ok(px >= 0 && px <= d.BRIDGE_TICKS.at(-1) * d.BRIDGE_PX, `${b.name} is off the axis`)
    }
    const h = Math.abs(b.toPx - b.fromPx)
    const exact = Math.abs(b.value) * d.BRIDGE_PX
    if (exact < 4) assert.equal(h, 4, `${b.name}: a ${exact}px step draws at 4`)
    else assert.ok(near(h, exact, 4), `${b.name}: ${h}px tall for ${exact}px`)
    assert.equal(Math.sign(b.toPx - b.fromPx), Math.sign(b.value), `${b.name} runs the wrong way`)
  }
  assert.ok(Math.abs(B[6].value) * d.BRIDGE_PX < 4, "people's step is no longer under 4px")
  for (const [i, v] of d.BRIDGE_TICKS.entries()) assert.equal(v * d.BRIDGE_PX, i * 100, "gridlines are 100 apart")

  // Labels and readings say the values as the bars draw them.
  assert.deepEqual(
    B.map((b) => d.signed(b.value, b.kind)),
    ["21.7M", "+1.8M", "+2.9M", "+4.4M", "+6.8M", "+10.6M", "−0.2M", "48.0M"]
  )

  // Title, "Agents added all the growth": people's net is a fall, and agents added more than the whole rise.
  const rise = B.at(-1).value - B[0].value
  const agents = B.filter((b) => b.kind === "agents").reduce((s, b) => s + b.value, 0)
  assert.ok(B[6].value < 0, "people grew")
  assert.ok(agents > rise, `agents added ${agents.toFixed(1)}M of ${rise.toFixed(1)}M`)
  assert.ok(near(agents, 26.5, 1e-9) && near(rise, 26.3, 1e-9))
  // Description, "from 21.7M in December to 48.0M in May"; the people step's tick spans the same months.
  assert.deepEqual([D.months[0], D.months[last]], ["Dec", "May"])
  assert.equal(B[6].tick, `${D.months[0]}–${D.months[last]}`)

  console.log("bridge ok", B.map((b) => `${d.signed(b.value, b.kind)} ${b.fromPx}–${b.toPx}px`).join(", "))
}

// ── Shift ───────────────────────────────────────────────────────────────────────────────────────────────────────

const S = d.SHIFT
const by = Object.fromEntries(S.map((s) => [s.name, s]))
const TOP = 232 // the kit's TOP

// December, source by source, and it makes DEMO's December: 3.3M agents and 18.4M people, 21.7M.
assert.deepEqual(
  S.map((s) => [s.name, s.dec]),
  [
    ["Docs pages", 15.2],
    ["API reference", 2.3],
    ["llms.txt", 0.9],
    ["MCP tools", 0.1],
    ["Changelog", 3.2],
  ]
)
assert.ok(near(sum(S.map((s) => s.dec)), f.demoTotal(0), 1e-9), `December makes ${sum(S.map((s) => s.dec))}M`)
assert.equal(d.shiftViews(sum(S.map((s) => s.dec))), "21.7M")
// May is DEMO.sources exactly, and makes the readouts' 48M.
S.forEach((s, i) => assert.equal(s.may, f.DEMO.sources[i].views))
assert.equal(Math.round(sum(S.map((s) => s.may))), f.TRAFFIC.pageViews.value)
assert.ok(near(sum(S.map((s) => s.may)), f.demoTotal(f.DEMO.months.length - 1), 0.05))
// People read mostly docs pages, and held level: December's Docs pages hold at least May's people on them.
assert.ok(by["Docs pages"].dec / f.demoTotal(0) > 0.6, "Docs pages is not most of December")
const mayPeople = (name) => (by[name].may * (100 - f.READERS.find((r) => r.name === name).agents)) / 100
assert.ok(by["Docs pages"].dec > mayPeople("Docs pages"), "December's docs pages hold fewer views than May's people alone")
// The MCP server went live in December, so MCP tools is December's least; llms.txt (published August) is small but there.
assert.equal(S.reduce((a, b) => (b.dec < a.dec ? b : a)).name, "MCP tools")
assert.ok(by["MCP tools"].dec <= 0.2)
assert.ok(by["llms.txt"].dec > by["MCP tools"].dec && by["llms.txt"].dec < 1)

// "Every source grew"; the title's "Docs pages gained the most views"; the idea's "MCP tools grow fastest".
for (const s of S) assert.ok(s.may > s.dec, `${s.name} fell`)
assert.equal(S.reduce((a, b) => (b.may - b.dec > a.may - a.dec ? b : a)).name, "Docs pages")
assert.equal(S.reduce((a, b) => (b.may / b.dec > a.may / a.dec ? b : a)).name, "MCP tools")
// The description: "21.7M in December, 48M in May".
assert.equal(`${d.shiftViews(sum(S.map((s) => s.dec)))} in December, ${Math.round(sum(S.map((s) => s.may)))}M in May`, "21.7M in December, 48M in May")

// Points: each on the 4px grid and within 2px of exact, on the one scale; inside the plot, which starts 32 under TOP.
for (const s of S) {
  for (const [y, v, m] of [
    [s.decY, s.dec, "Dec"],
    [s.mayY, s.may, "May"],
  ]) {
    assert.equal(y % 4, 0, `${s.name} ${m}: y ${y} is off the grid`)
    assert.ok(near(y, d.shiftY(v), 2), `${s.name} ${m}: y ${y} is ${(y - d.shiftY(v)).toFixed(2)} from exact`)
    assert.ok(y - 8 >= TOP + 32 && y + 8 <= d.SHIFT_BASE + 8, `${s.name} ${m}: point leaves the plot`)
  }
  // The line runs from December's point to May's, in frame px.
  assert.equal(s.d, `M${d.DEC_X} ${s.decY}L${d.MAY_X} ${s.mayY}`)
}
for (const x of [d.DEC_X, d.MAY_X]) assert.equal((x - 8) % 4, 0)
for (const t of d.SHIFT_TICKS) assert.equal(d.shiftY(t) % 4, 0)
// On each axis, no two points overlap: 16 apart at least, edge to edge, so the paper ring parts them.
for (const key of ["decY", "mayY"]) {
  const ys = S.map((s) => s[key]).sort((a, b) => a - b)
  ys.slice(1).forEach((y, i) => assert.ok(y - ys[i] >= 16, `${key}: points at ${ys[i]} and ${y} overlap`))
}

// Labels: on the grid, a pitch apart at least, in their points' order, close to their points, clear of every
// gridline, and inside the data area (TOP to 828).
const gridlines = d.SHIFT_TICKS.map(d.shiftY)
for (const [point, label] of [
  ["decY", "decLabel"],
  ["mayY", "mayLabel"],
]) {
  const sorted = [...S].sort((a, b) => a[point] - b[point])
  sorted.slice(1).forEach((s, i) => {
    const gap = s[label] - sorted[i][label]
    assert.ok(gap >= d.LABEL_PITCH, `${label}: ${sorted[i].name} and ${s.name} are ${gap} apart`)
  })
  for (const s of S) {
    const top = s[label] - d.LABEL_H / 2
    assert.equal(top % 4, 0, `${s.name} ${label} is off the grid`)
    assert.ok(Math.abs(s[label] - s[point]) <= 12, `${s.name} ${label} is ${s[label] - s[point]} from its point`)
    for (const g of gridlines) assert.ok(g < top - 2 || g > top + d.LABEL_H + 2, `${s.name} ${label} crosses the line at ${g}`)
    assert.ok(top >= TOP + 32 && top + d.LABEL_H <= 828, `${s.name} ${label} leaves the data area`)
  }
}
// The crowded foot is the one the spacing solves: December's four smallest sit within 52px.
const low = S.filter((s) => s.name !== "Docs pages").map((s) => s.decY)
assert.ok(Math.max(...low) - Math.min(...low) <= 52)
// December's labels end 24 before its axis, from 160 (clear of the ticks at 136); May's start 24 after it and end on 1368.
assert.equal(d.DEC_X - d.LABEL_GAP - d.LABEL_W, 160)
assert.equal(d.MAY_X + d.LABEL_GAP + d.LABEL_W, 1368)

console.log("shift ok", S.map((s) => `${s.name} ${s.dec}→${s.may} (${s.decLabel}/${s.mayLabel})`))

// ── Funnel ──────────────────────────────────────────────────────────────────────────────────────────────────────

const F = d.FUNNEL
// Four stages, from time saved's 1,425 questions to the 969 its docs answered (68%, its DOCS_SHARE).
assert.ok(F.length >= 4 && F.length <= 5, `${F.length} stages`)
assert.equal(F[0].n, 1425)
assert.equal(F.at(-1).n, 969)
assert.equal(F.at(-1).name, "Answered by docs")
assert.equal(Math.round((F.at(-1).n / F[0].n) * 100), 68)
// Every count is a whole number of questions, and each stage holds fewer than the one before.
F.forEach((s) => assert.ok(Number.isInteger(s.n), `${s.name}: ${s.n}`))
F.slice(1).forEach((s, i) => assert.ok(s.n < F[i].n, `${s.name} (${s.n}) is not under ${F[i].name} (${F[i].n})`))
// Drops are uneven, so the steps read as real ones, and together they are every question the team answered.
const drops = F.slice(1).map((s) => s.drop)
assert.equal(new Set(drops).size, drops.length)
assert.equal(drops.reduce((a, b) => a + b, 0), F[0].n - F.at(-1).n)
// Each drop is drawn as "−n · −x%": n questions fewer than the stage before, x its share of that stage.
F.slice(1).forEach((s, i) => {
  assert.equal(s.drop, F[i].n - s.n)
  assert.equal(s.dropPct, Math.round(((F[i].n - s.n) / F[i].n) * 100))
  assert.equal(s.dropLabel, `−${d.count(s.drop)} · −${s.dropPct}%`)
})
assert.deepEqual(
  F.map((s) => s.dropLabel),
  ["", "−114 · −8%", "−209 · −16%", "−133 · −12%"]
)
// Lengths: on the 4px grid, within 2px of exact, from one baseline; the first fits the content width.
for (const s of F) {
  assert.equal(s.w % 4, 0, `${s.name}: ${s.w}px is off the grid`)
  assert.ok(near(s.w, s.n * d.FUNNEL_PX, 2), `${s.name}: ${s.w}px against ${s.n * d.FUNNEL_PX}px`)
}
F.slice(1).forEach((s, i) => assert.equal(s.prevW, F[i].w))
assert.ok(F[0].w <= 1296)
// In funnel.tsx the bars start 288 into the content box, and a drop label sits 16 after its hatch: at 8.4px a mono
// character, it ends inside the content box.
F.forEach((s) => assert.ok(288 + s.prevW + 16 + s.dropLabel.length * 8.4 <= 1296, `${s.name}'s drop label runs past`))
// Copy: "Docs answered 969 of 1,425 questions".
assert.equal(`Docs answered ${d.count(F.at(-1).n)} of ${d.count(F[0].n)} questions`, "Docs answered 969 of 1,425 questions")

console.log("10-changes ok", { funnel: F.map((s) => `${s.name} ${s.n} ${s.w}px ${s.dropLabel}`) })
