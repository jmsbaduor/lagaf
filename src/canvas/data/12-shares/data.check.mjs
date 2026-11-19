// Row 12: what is drawn equals the numbers, and the copy's claims hold. Run: node src/canvas/data/12-shares/data.check.mjs
import assert from "node:assert/strict"
import * as f from "../facts.ts"
import * as d from "./data.ts"

// ── Ribbons ──

const ribbonsLength = (drawn, exact, what) =>
  assert.ok(drawn % 4 === 0 && Math.abs(drawn - exact) <= 2, `${what}: drawn ${drawn}, exact ${exact.toFixed(2)}`)

const [ribbonsDec, ribbonsMay] = d.RIBBONS_COLS

// The columns are DEMO's December and May: 3.3 of 21.7M, then 29.8 of 48.0M (TRAFFIC's 62% of 48M).
assert.equal(ribbonsDec.month, "Dec")
assert.equal(ribbonsMay.month, "May")
assert.deepEqual([ribbonsDec.agents, ribbonsDec.people], [3.3, 18.4])
assert.deepEqual([ribbonsMay.agents, ribbonsMay.people], [29.8, 18.2])
assert.equal(ribbonsDec.total.toFixed(1), "21.7")
assert.equal(ribbonsMay.total.toFixed(1), "48.0")
assert.equal(Math.round(ribbonsMay.total), f.TRAFFIC.pageViews.value)
assert.equal(ribbonsDec.share.agents.toFixed(1), "15.2")
assert.equal(ribbonsDec.share.people.toFixed(1), "84.8")
assert.equal(ribbonsMay.share.agents.toFixed(1), "62.1")
assert.equal(ribbonsMay.share.people.toFixed(1), "37.9")
assert.equal(Math.round(ribbonsMay.share.agents), f.TRAFFIC.agentShare.value)
assert.equal(ribbonsDec.share.agents, f.demoAgentShare(0))
assert.equal(ribbonsMay.share.agents, f.demoAgentShare(5))
// The numbers drawn, as the chart writes them; each column's two make 100.
assert.deepEqual(
  d.RIBBONS_COLS.map((c) => [f.pct(c.share.agents), f.pct(c.share.people)]),
  [
    ["15%", "85%"],
    ["62%", "38%"],
  ]
)
assert.deepEqual(
  d.RIBBONS_COLS.map((c) => [d.ribbonsMillions(c.agents), d.ribbonsMillions(c.people), d.ribbonsMillions(c.total)]),
  [
    ["3.3M", "18.4M", "21.7M"],
    ["29.8M", "18.2M", "48.0M"],
  ]
)

// The title says agents went from 15% to 62%; the agents' reading says the same.
assert.equal(f.pct(ribbonsDec.share.agents), "15%")
assert.equal(f.pct(ribbonsMay.share.agents), "62%")
assert.ok(ribbonsMay.share.agents > ribbonsMay.share.people, "agents are most of May")

// The columns stand on 828, and their full height starts at TOP (232) + 32, under the column names. They sit at the
// content box's far left and right edges, the ribbons spanning the 784 between.
assert.equal(d.RIBBONS_BASE, 828)
assert.equal(d.RIBBONS_BASE - d.RIBBONS_H, 232 + 32)
assert.equal(d.RIBBONS_X0, 328)
assert.equal(d.RIBBONS_X1, 1112)
assert.equal(d.RIBBONS_PX_POINT, 5.64)
assert.equal(d.RIBBONS_PX_M, 11.75)

// Every height on the grid and within 2px of exact, in both measures; each column whole.
for (const c of d.RIBBONS_COLS) {
  for (const m of ["Share", "Count"]) {
    const h = c.h[m]
    const share = m === "Share"
    ribbonsLength(h.total, share ? d.RIBBONS_H : c.total * d.RIBBONS_PX_M, `${c.name} ${m} column`)
    ribbonsLength(h.agents, share ? c.share.agents * d.RIBBONS_PX_POINT : c.agents * d.RIBBONS_PX_M, `${c.name} ${m} agents`)
    ribbonsLength(h.total - h.agents, share ? c.share.people * d.RIBBONS_PX_POINT : c.people * d.RIBBONS_PX_M, `${c.name} ${m} people`)
    const a = d.ribbonsPart(c, m, "agents")
    const p = d.ribbonsPart(c, m, "people")
    assert.equal(a.bottom, p.top, `${c.name} ${m}: the parts meet`)
    assert.equal(p.bottom, 828)
    assert.ok(a.top >= 264, `${c.name} ${m} starts under the names`)
  }
}
// The px drawn: Share 84 + 480 against 352 + 212; Count 40 + 216 against 352 + 212 (May is full height in both).
assert.deepEqual(
  d.RIBBONS_COLS.map((c) => c.h.Share),
  [
    { total: 564, agents: 84 },
    { total: 564, agents: 352 },
  ]
)
assert.deepEqual(
  d.RIBBONS_COLS.map((c) => c.h.Count),
  [
    { total: 256, agents: 40 },
    { total: 564, agents: 352 },
  ]
)

// The ribbons' ends are the parts' edges: December's right edge to May's left edge, at each part's top and bottom.
const ribbonsNums = (s) => s.match(/-?\d+(\.\d+)?/g).map(Number)
for (const m of ["Share", "Count"]) {
  for (const r of d.RIBBONS_READERS) {
    const [x0, t0, , , , , x1, t1, x1b, b1, , , , , x0b, b0] = ribbonsNums(d.ribbonsPath(m, r))
    const a = d.ribbonsPart(ribbonsDec, m, r)
    const b = d.ribbonsPart(ribbonsMay, m, r)
    assert.deepEqual([x0, x0b, x1, x1b], [328, 328, 1112, 1112], `${m} ${r} ribbon spans the columns`)
    assert.deepEqual([t0, b0, t1, b1], [a.top, a.bottom, b.top, b.bottom], `${m} ${r} ribbon ends on its parts`)
  }
  // The two ribbons share their seam, so they tile the space between the columns.
  const [ag, pe] = d.RIBBONS_READERS.map((r) => ribbonsNums(d.ribbonsPath(m, r)))
  assert.deepEqual([ag[14], ag[15], ag[8], ag[9]], [pe[0], pe[1], pe[6], pe[7]], `${m} ribbons share a seam`)
}
// The agents' ribbon widens: in Share it is 84 at December and 352 at May.
const ribbonsDecA = d.ribbonsPart(ribbonsDec, "Share", "agents")
const ribbonsMayA = d.ribbonsPart(ribbonsMay, "Share", "agents")
assert.ok(ribbonsMayA.bottom - ribbonsMayA.top > 4 * (ribbonsDecA.bottom - ribbonsDecA.top))

// ── Rings ──
// Every ring is a READERS share with its DEMO.sources views, five of them, highest first.
assert.equal(d.RINGS.length, 5)
for (const r of d.RINGS) {
  assert.equal(r.share, f.READERS.find((x) => x.name === r.name).agents, r.name)
  assert.equal(r.views, f.DEMO.sources.find((x) => x.name === r.name).views, r.name)
}
assert.deepEqual(
  d.RINGS.map((r) => r.name),
  ["MCP tools", "llms.txt", "API reference", "Docs pages", "Changelog"]
)
d.RINGS.forEach((r, i) => i && assert.ok(r.share < d.RINGS[i - 1].share, `${r.name} is out of order`))

// The summary: 48M views in all, weighting to TRAFFIC's 62% agents.
assert.equal(d.RINGS_TOTAL, "48M")
assert.equal(d.RINGS_ALL, f.TRAFFIC.agentShare.value)

// The title: agents lead four of five sources, and the one they don't is last.
assert.equal(d.RINGS_LED, 4)
assert.ok(d.RINGS.at(-1).share < 50)

// Readings, as the hint writes them.
assert.equal(d.ringsReading("API reference", 76), "API reference: 76% agents")
assert.equal(d.ringsViews(d.RINGS[0].views), "1.8M May views")

// Layout: the rings fill 72 to 1368 on the 4px grid, and the band leaves a hole the share fits in.
for (let i = 0; i < 5; i++) assert.equal(d.ringsX(i) % 4, 0)
assert.equal(d.ringsX(0), 72)
assert.equal(d.ringsX(4) + d.RINGS_D, 1368)
assert.equal(d.RINGS_D % 4, 0)
assert.equal(d.RINGS_THICK % 4, 0)
assert.ok(d.RINGS_D - 2 * d.RINGS_THICK >= 176)
// The bar's agent part: on the grid and within 2px of 62% of 1296.
const exact = (d.RINGS_BAR * d.RINGS_ALL) / 100
assert.ok(d.RINGS_BAR_LEAD % 4 === 0 && Math.abs(d.RINGS_BAR_LEAD - exact) <= 2, `bar ${d.RINGS_BAR_LEAD}, exact ${exact}`)
assert.equal(d.RINGS_BAR_LEAD, 804)

console.log("12-shares ok", d.RINGS.map((r) => `${r.name} ${r.share}%`).join(", "))

const iconCountMay = f.DEMO.months.length - 1
const [iconCountAgents, iconCountPeople] = d.ICON_COUNT
// May's views from DEMO, agents first: 29.8M and 18.2M, 48M in all, as the description says.
assert.equal(f.DEMO.months[iconCountMay], "May")
assert.deepEqual(
  d.ICON_COUNT.map((g) => [g.id, g.views]),
  [
    ["agents", f.DEMO.agents[iconCountMay]],
    ["people", f.DEMO.people[iconCountMay]],
  ]
)
assert.equal(f.demoTotal(iconCountMay), 48)
// One icon per million: 30 and 18, each within half an icon of exact, and the rounding keeps the whole at 48.
assert.deepEqual(
  d.ICON_COUNT.map((g) => g.icons),
  [30, 18]
)
for (const g of d.ICON_COUNT) assert.ok(Math.abs(g.icons - g.views) <= 0.5, `${g.label} rounds too far`)
assert.equal(d.ICON_COUNT_TOTAL, 48)
assert.equal(d.ICON_COUNT_TOTAL, Math.round(f.demoTotal(iconCountMay)))
assert.equal(d.ICON_COUNT_ICONS.length, d.ICON_COUNT_TOTAL)
assert.ok(d.ICON_COUNT_ICONS.slice(0, 30).every((c) => c.id === "agents"))
assert.ok(d.ICON_COUNT_ICONS.slice(30).every((c) => c.id === "people"))
// The title: agents outnumber people, 30 to 18. Their 30 of 48 icons (62.5%) is DEMO's 62.1% to within half an icon.
assert.ok(iconCountAgents.icons > iconCountPeople.icons)
assert.ok(
  Math.abs((iconCountAgents.icons / d.ICON_COUNT_TOTAL) * 100 - f.demoAgentShare(iconCountMay)) <=
    (0.5 / d.ICON_COUNT_TOTAL) * 100
)
// Readings, as the hint writes them.
assert.equal(d.iconCountReading(iconCountAgents), "Agents: 30M of 48M")
assert.equal(d.iconCountReading(iconCountPeople), "People: 18M of 48M")

// Layout: twelve boxes edge to edge span 72 to 1368; four rows run TOP to 664, and the readout under them (48 clear,
// a 16 key, 8, an 80 number) ends at 816, by 828. Every edge is on the 4px grid; the glyph sits 6 in, centred.
const iconCountRows = Math.ceil(d.ICON_COUNT_TOTAL / d.ICON_COUNT_COLS)
assert.equal(iconCountRows, 4)
assert.equal(iconCountRows * d.ICON_COUNT_COLS, d.ICON_COUNT_TOTAL)
assert.equal(d.ICON_COUNT_COLS * d.ICON_COUNT_BOX, 1296)
assert.equal(d.ICON_COUNT_BOX % 4, 0)
const iconCountBottom = 232 + iconCountRows * d.ICON_COUNT_BOX
assert.equal(iconCountBottom, 664)
assert.equal(iconCountBottom + 48 + 16 + 8 + 80, 816)
assert.equal((d.ICON_COUNT_BOX - d.ICON_COUNT_GLYPH) / 2, 6)
// The people's first icon is column six of the third row, where their readout starts.
assert.equal(iconCountAgents.icons % d.ICON_COUNT_COLS, 6)

console.log("12-shares ok", d.ICON_COUNT.map((g) => `${g.label} ${g.icons}`).join(", "))
