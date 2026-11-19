// Row 15: what is drawn equals the numbers, and the copy's claims hold. Run: node src/canvas/data/15-goals/data.check.mjs
import assert from "node:assert/strict"
import * as d from "./data.ts"

// ── Bullets ─────────────────────────────────────────────────────────────────────────────────────────────────────
// The values are the readouts', the goals are new demo numbers, and every bar, tick and edge is on the grid.

{
  const f = await import("../facts.ts")
  const B = d.BULLETS
  const T = f.TRAFFIC
  const D = f.DEMO
  const last = D.months.length - 1
  const bulletsNear = (a, b, tol) => Math.abs(a - b) <= tol

  // The four values are the readouts' four, and they agree with DEMO's May.
  assert.deepEqual(B.map((b) => b.tag), [T.agentShare.tag, T.answerTime.tag, T.pageViews.tag, T.teams.tag])
  assert.deepEqual(B.map((b) => b.value), [T.agentShare.value, T.answerTime.value, T.pageViews.value, T.teams.value])
  assert.equal(B[1].value, D.answerTime[last], "answer time is not May's")
  assert.equal(Math.round(f.demoAgentShare(last)), B[0].value, "agent share is not May's")
  assert.ok(bulletsNear(f.demoTotal(last), B[2].value, 1e-9), "page views are not May's")
  assert.deepEqual(B.map((b) => b.format(b.value)), ["62%", "0.8s", "48M", "10,000+"])

  // Goals: one per number, inside its on-track band, which sits inside its scale. Edges run behind to ahead along
  // the track, so ahead reads to the right on every row, the lower-is-better answer time included.
  assert.deepEqual(B.map((b) => b.goal), [58, 1.0, 52, 9200])
  assert.deepEqual(B.map((b) => b.goalLabel), ["58%", "1.0s", "52M", "9,200"])
  for (const b of B) {
    const at = (v) => d.bulletsAt(b.scale, v)
    assert.ok(0 < at(b.edges[0]) && at(b.edges[0]) < at(b.goal) && at(b.goal) < at(b.edges[1]), `${b.tag}: goal off track`)
    assert.ok(at(b.edges[1]) < d.BULLETS_TRACK, `${b.tag}: no room ahead`)
    assert.ok(at(b.value) > 0 && at(b.value) < d.BULLETS_TRACK, `${b.tag}: value off the scale`)
    // Lower is better exactly where the scale runs down, so a longer bar is always better.
    assert.equal(b.lower, b.scale[1] < b.scale[0], `${b.tag}: scale runs the wrong way`)
  }
  assert.deepEqual(B.map((b) => b.lower), [false, true, false, false])
  // Answer time's goal is a stretch from March's 1.3s, the time when Q2's goals were set, and May beats it.
  assert.ok(B[1].goal < D.answerTime[3] && B[1].value < B[1].goal)

  // Which goals are met, and where each value falls: agent share and teams beat theirs, answer time is ahead,
  // page views is on track but 4M short.
  assert.deepEqual(B.map((b) => b.met), [true, true, false, true])
  assert.deepEqual(B.map((b) => d.BULLETS_BANDS[b.band]), ["On track", "Ahead", "On track", "Ahead"])
  assert.equal(B[2].goal - B[2].value, 4)

  // Title: "Three of four Q2 goals met".
  assert.equal(d.bulletsMet, 3)
  assert.equal(B.length, 4)
  assert.equal(d.BULLETS_TITLE, "Three of four Q2 goals met")

  // Px: the bar's end, the goal and both edges on the 4px grid, within 2px of exact, inside the track; ticks whole.
  for (const b of B) {
    const at = (v) => d.bulletsAt(b.scale, v)
    for (const [px, v] of [
      [b.barPx, b.value],
      [b.goalPx, b.goal],
      [b.edgePx[0], b.edges[0]],
      [b.edgePx[1], b.edges[1]],
    ]) {
      assert.equal(px % 4, 0, `${b.tag}: ${px}px is off the grid`)
      assert.ok(bulletsNear(px, at(v), 2), `${b.tag}: ${px}px is ${(px - at(v)).toFixed(2)}px from exact`)
      assert.ok(px > 0 && px < d.BULLETS_TRACK)
    }
    // The goal tick (8 wide, centred) and its 128 label stay inside the track.
    assert.ok(b.goalPx - 64 >= 0 && b.goalPx + 64 <= d.BULLETS_TRACK)
    // Edge ticks (48 wide, centred) clear each other and the end ticks (up to 48 at each end).
    assert.ok(b.edgePx[0] - 24 >= 48 && b.edgePx[1] - b.edgePx[0] >= 48 && b.edgePx[1] + 24 <= d.BULLETS_TRACK - 48)
  }
  assert.equal(d.BULLETS_TRACK, 896)
  assert.deepEqual(
    B.map((b) => b.ticks),
    [
      ["0%", "54%", "66%", "80%"],
      ["2.0s", "1.3s", "0.9s", "0s"],
      ["0M", "46M", "56M", "64M"],
      ["0", "8,400", "9,600", "12,800"],
    ]
  )

  // Readings, as the hint writes them.
  assert.equal(B[1].reading, "Answer time: 0.8s, goal 1.0s")

  console.log("bullets ok", B.map((b) => `${b.tag} ${b.barPx}/${b.goalPx} [${b.edgePx}]`).join(", "))
}

// ── Sparklines ──────────────────────────────────────────────────────────────────────────────────────────────────

{
  const f = await import("../facts.ts")
  const D = f.DEMO
  const K = d.SPARKLINES
  const sparklinesNear = (a, b, tol) => Math.abs(a - b) <= tol

  // Six numbers, each of DEMO's six months.
  assert.equal(K.length, 6)
  for (const k of K) assert.equal(k.values.length, D.months.length, `${k.name} has ${k.values.length} months`)

  // May's values and December's, as drawn, agree with DEMO and the readouts.
  assert.deepEqual(
    K.map((k) => [k.name, k.format(k.last), k.format(k.first)]),
    [
      ["Page views", "48.0M", "21.7M"],
      ["Agent views", "29.8M", "3.3M"],
      ["People views", "18.2M", "18.4M"],
      ["Agent share", "62%", "15%"],
      ["Answer time", "0.8s", "2.6s"],
      ["Agent views per person view", "1.64×", "0.18×"],
    ]
  )
  assert.equal(f.TRAFFIC.pageViews.format(K[0].last), f.TRAFFIC.pageViews.format(f.TRAFFIC.pageViews.value))
  assert.equal(K[3].format(K[3].last), f.TRAFFIC.agentShare.format(f.TRAFFIC.agentShare.value))
  assert.equal(K[4].format(K[4].last), f.TRAFFIC.answerTime.format(f.TRAFFIC.answerTime.value))
  D.months.forEach((_, i) => {
    assert.ok(sparklinesNear(K[0].values[i], D.agents[i] + D.people[i], 1e-9))
    assert.ok(sparklinesNear(K[5].values[i], D.agents[i] / D.people[i], 1e-9))
    assert.ok(sparklinesNear(K[3].values[i], (K[5].values[i] / (1 + K[5].values[i])) * 100, 1e-9), "share and ratio disagree")
  })

  // The change words and readings.
  assert.deepEqual(
    K.map((k) => k.change),
    [
      "Up from 21.7M in December",
      "Up from 3.3M in December",
      "Down from 18.4M in December",
      "Up from 15% in December",
      "Down from 2.6s in December",
      "Up from 0.18× in December",
    ]
  )
  assert.equal(K[4].reading, "Answer time: 0.8s, down from 2.6s")

  // "Five of six moved the right way": views and share rose, answer time fell; people slipped 0.2M.
  assert.equal(d.SPARKLINES_RIGHT, 5)
  assert.deepEqual(
    K.filter((k) => !k.right).map((k) => k.name),
    ["People views"]
  )

  // Tiles fill the data area: three across 72 to 1368, two down TOP to 828, every edge on the 4px grid.
  const T = d.SPARKLINES_TILE
  const tiles = K.map((_, i) => d.sparklinesTile(i))
  for (const t of tiles) for (const e of [t.x, t.y, t.x + T.w, t.y + T.h]) assert.equal(e % 4, 0, `tile edge ${e}`)
  assert.equal(Math.min(...tiles.map((t) => t.x)), 72)
  assert.equal(Math.max(...tiles.map((t) => t.x + T.w)), 1368)
  assert.equal(Math.min(...tiles.map((t) => t.y)), d.SPARKLINES_TOP)
  assert.equal(Math.max(...tiles.map((t) => t.y + T.h)), 828)

  // Every point is whole pixels on its tile's line band, within half a pixel of exact; the line starts on the tile's
  // left edge and May's point with its 2px ring ends on the right edge; no point or ring meets the change line.
  const L = d.SPARKLINES_LINE
  d.SPARKLINES_POINTS.forEach((pts, i) => {
    const t = tiles[i]
    const k = K[i]
    const max = Math.max(...k.values)
    pts.forEach((p, m) => {
      assert.ok(Number.isInteger(p.x) && Number.isInteger(p.y), `${k.name} ${D.months[m]} is not whole`)
      assert.ok(p.y >= t.y + L.top && p.y <= t.y + L.base, `${k.name} ${D.months[m]} leaves its band`)
      assert.ok(sparklinesNear(p.y, t.y + L.base - (k.values[m] / max) * (L.base - L.top), 0.5))
      assert.ok(p.y - 10 >= t.y + 124 + 28 && p.y + 10 <= t.y + T.h, `${k.name} ${D.months[m]} clips`)
    })
    assert.equal(pts[0].x, t.x)
    assert.equal(pts.at(-1).x + 8 + 2, t.x + T.w)
  })

  // People held level, so their line is flat to within 4px; agents' rises every month; answer time falls every month.
  const ys = (i) => d.SPARKLINES_POINTS[i].map((p) => p.y)
  assert.ok(Math.max(...ys(2)) - Math.min(...ys(2)) <= 4, "people's line is not flat")
  for (let m = 1; m < D.months.length; m++) {
    assert.ok(ys(1)[m] < ys(1)[m - 1], "agents' line falls")
    assert.ok(ys(4)[m] > ys(4)[m - 1], "answer time's line rises")
  }
}
