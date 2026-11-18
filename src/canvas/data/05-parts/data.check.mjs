// Row 05: what is drawn equals DEMO. Run: node src/canvas/data/05-parts/data.check.mjs (Node 24 reads .ts as is).
import assert from "node:assert/strict"

import * as f from "../facts.ts"
import * as d from "./data.ts"

const near = (a, b, tol) => Math.abs(a - b) <= tol
const sum = (xs) => xs.reduce((s, x) => s + x, 0)
const onGrid = (n) => n % 4 === 0
// A drawn edge is on the 4px grid and within 2px of its exact place.
const edge = (drawn, exact, what) =>
  assert.ok(onGrid(drawn) && near(drawn, exact, 2), `${what}: drawn at ${drawn}, exact ${exact.toFixed(2)}`)

// Formats: the arcs close the ring in DEMO's order, and the lead (Markdown with llms.txt) is the waffle's 83.
assert.equal(d.FORMATS[0].start, 0)
assert.ok(near(d.FORMATS.at(-1).end, 1, 1e-9))
d.FORMATS.slice(1).forEach((x, i) => assert.ok(near(x.start, d.FORMATS[i].end, 1e-9), `${x.name} doesn't follow on`))
d.FORMATS.forEach((x) => assert.ok(near(x.end - x.start, x.share / 100, 1e-9)))
assert.deepEqual(
  d.FORMATS.filter((x) => x.lead).map((x) => x.name),
  ["Markdown pages", "llms.txt files"]
)
assert.equal(d.FORMAT_LEAD, f.MARKDOWN_SHARE)

// Sources: 48M; the cells tile the map, each exactly in proportion to its views.
assert.ok(near(d.VIEWS, f.TRAFFIC.pageViews.value, 0.05))
const area = d.MAP.w * d.MAP.h
assert.ok(near(sum(d.TILES.map((t) => t.exact.w * t.exact.h)), area, 1e-6))
for (const t of d.TILES) {
  assert.ok(near((t.exact.w * t.exact.h) / area, t.views / d.VIEWS, 1e-12), `${t.name}'s cell is off its share`)
  // Every drawn edge is its cell's, on the grid and within 2px (the gap is the 4px the cell gives up).
  edge(t.x, t.exact.x, `${t.name} left`)
  edge(t.y, t.exact.y, `${t.name} top`)
  edge(t.x + t.w + d.GAP, t.exact.x + t.exact.w, `${t.name} right`)
  edge(t.y + t.h + d.GAP, t.exact.y + t.exact.h, `${t.name} bottom`)
  // Its agent part: its share of the tile's height, on the grid and within 2px; the label's ink sits on it.
  edge(t.agentH, (t.h * t.agents) / 100, `${t.name} agent part`)
  assert.ok(t.labelled, `${t.name} has no room for its label`)
  assert.ok(t.agentH >= d.TILE_LABEL.h, `${t.name}'s label runs off its agent part`)
}
// The tiles fill 1296 by 556 and none overlaps or comes closer than the gap.
assert.equal(Math.max(...d.TILES.map((t) => t.x + t.w)), d.MAP.w - d.GAP)
assert.equal(Math.max(...d.TILES.map((t) => t.y + t.h)), d.MAP.h - d.GAP)
for (const a of d.TILES)
  for (const b of d.TILES)
    if (a !== b)
      assert.ok(
        a.x + a.w + d.GAP <= b.x || b.x + b.w + d.GAP <= a.x || a.y + a.h + d.GAP <= b.y || b.y + b.h + d.GAP <= a.y,
        `${a.name} and ${b.name} overlap`
      )
// The thinnest part drawn is MCP tools' people strip: 2.1px exact, drawn at 4 (within 2px, as every edge is).
const mcp = d.TILES.find((t) => t.name === "MCP tools")
assert.equal(mcp.h - mcp.agentH, 4)
assert.equal(Math.min(...d.TILES.map((t) => t.h - t.agentH)), 4)
assert.deepEqual([mcp.h, 100 - mcp.agents, ((mcp.h * (100 - mcp.agents)) / 100).toFixed(1)], [104, 2, "2.1"])
// Agent share: READERS weighted by views is 62%, and so is the drawn agent area.
assert.equal(d.AGENT_SHARE, f.TRAFFIC.agentShare.value)
const drawnShare = sum(d.TILES.map((t) => t.w * t.agentH)) / sum(d.TILES.map((t) => t.w * t.h))
assert.equal(Math.round(drawnShare * 100), f.TRAFFIC.agentShare.value)

// Teams: 100%; the segments end on the grid within 2px, run the content width, and the bracket is the dot matrix's
// 83 (drafting with agents), with the unreviewed segment its 9.
assert.equal(sum(d.SEGMENTS.map((s) => s.share)), 100)
let before = 0
for (const s of d.SEGMENTS) {
  edge(s.x, (d.BAR_W * before) / 100, `${s.short} start`)
  before += s.share
  edge(s.x + s.w + d.GAP, (d.BAR_W * before) / 100, `${s.short} end`)
}
assert.equal(d.SEGMENTS.at(-1).x + d.SEGMENTS.at(-1).w, d.BAR_W - d.GAP)
assert.equal(d.DRAFT.share, f.TEAM_SHARES.draft)
assert.equal(d.DRAFT.w, d.SEGMENTS[1].x + d.SEGMENTS[1].w)
assert.equal(d.SEGMENTS.find((s) => s.short === "publish unreviewed").share, f.TEAM_SHARES.publish)

console.log("05-parts ok", {
  tiles: d.TILES.map((t) => `${t.name} ${t.x},${t.y} ${t.w}x${t.h} agents ${t.agentH}`),
  segments: d.SEGMENTS.map((s) => `${s.short} ${s.x}+${s.w}`),
  drawnShare: +(drawnShare * 100).toFixed(2),
})
