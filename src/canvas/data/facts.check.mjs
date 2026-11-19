// What is drawn equals what is said. Run: node src/canvas/data/facts.check.mjs (Node 24 reads facts.ts as is).
import assert from "node:assert/strict"
import { existsSync, readdirSync } from "node:fs"

import * as f from "./facts.ts"

const near = (a, b, tol = 0.05) => Math.abs(a - b) <= tol

// Waffle: 83 of 100 cells lit.
assert.equal(f.WAFFLE.filter(Boolean).length, f.MARKDOWN_SHARE)

// Dot matrix: 83% and 9% of 24 dots, rounded.
assert.equal(f.litDots(f.TEAM_SHARES.draft), 20)
assert.equal(f.litDots(f.TEAM_SHARES.publish), 2)

// Who reads: whole columns, and agent columns over all columns is the stated share.
for (const r of f.READERS) {
  assert.ok(Number.isInteger(f.agentCols(r.agents)), `${r.name}: ${r.agents}% is not a whole number of columns`)
  assert.equal((f.agentCols(r.agents) * 100) / f.READER_COLS, r.agents)
}

// Update lag: the shares make 100, and every bar is on the shared scale and the 4px grid.
assert.equal(f.LAG.reduce((s, d) => s + d.value, 0), 100)
for (const d of f.LAG) assert.equal((d.value * f.LAG_PX) % 4, 0)

// Token bar: Markdown's bar is 40% of the HTML whole, on the 4px grid and within 2px of exact; the bracket is the rest.
assert.equal(100 - f.TOKENS_SAVED, 40)
assert.equal(f.TOKEN_USED % 4, 0)
assert.ok(Math.abs(f.TOKEN_USED - f.TOKEN_W * 0.4) <= 2, `Markdown's bar is ${f.TOKEN_USED}px of ${f.TOKEN_W}px`)
assert.equal((f.TOKEN_W - f.TOKEN_USED) % 4, 0)

// Growth: 9x fills the track, 1x a ninth of it.
const top = Math.max(...f.GROWTH.map((d) => d.value))
assert.equal(f.GROWTH[0].value / top, 1)
assert.ok(near(f.GROWTH[1].value / top, 1 / 9, 1e-9))

// Eval rows: each headline follows from its before and after.
for (const e of f.EVALS) {
  const got = e.kind === "accuracy" ? e.after : ((e.before - e.after) / e.before) * 100
  // Rounded to the headline's own precision: 67.09 reads as 67, 18.92 as 18.9.
  const places = String(e.stat).split(".")[1]?.length ?? 0
  assert.equal(got.toFixed(places), String(e.stat), `${e.kind}: ${e.before} to ${e.after} gives ${got.toFixed(2)}`)
}

// Readouts: the same figures wherever they repeat (they share TRAFFIC), in one format.
assert.equal(f.TRAFFIC.agentShare.format(f.TRAFFIC.agentShare.value), "62%")
assert.equal(f.TRAFFIC.answerTime.format(f.TRAFFIC.answerTime.value), "0.8s")
assert.equal(f.TRAFFIC.pageViews.format(f.TRAFFIC.pageViews.value), "48M")

// Timeline: each stage is denser and deeper than the one before it.
const widths = f.STAGE_X.map((x, i) => (f.STAGE_X[i + 1] !== undefined ? f.stageCol(f.STAGE_X[i + 1]) : f.FIELD_COLS) - (i ? f.stageCol(x) : 0))
const density = f.FIELD.map((cells, i) => cells.length / (widths[i] * f.FIELD_ROWS))
const depth = f.FIELD.map((cells) => cells.reduce((s, c) => s + c.level, 0) / cells.length)
for (let i = 1; i < 4; i++) {
  assert.ok(density[i] > density[i - 1], `stage ${i} is not denser: ${density.map((d) => d.toFixed(2))}`)
  assert.ok(depth[i] > depth[i - 1], `stage ${i} is not deeper: ${depth.map((d) => d.toFixed(2))}`)
}

// DEMO agrees with the numbers rows 01 to 03 draw.
const D = f.DEMO
const last = D.months.length - 1
assert.equal(D.agents.length, D.months.length)
assert.equal(D.people.length, D.months.length)
assert.equal(D.answerTime.length, D.months.length)
// May: 48M in all, 62% of it agents, answers in 0.8s.
assert.ok(near(f.demoTotal(last), f.TRAFFIC.pageViews.value, 0.05), `May is ${f.demoTotal(last)}M, not 48M`)
assert.equal(Math.round(f.demoAgentShare(last)), f.TRAFFIC.agentShare.value)
assert.equal(D.answerTime[last], f.TRAFFIC.answerTime.value)
// Six months: agents 9x (within rounding), people about 1x, answer time only ever falls.
assert.ok(Math.abs(D.agents[last] / D.agents[0] - f.GROWTH[0].value) < 0.1, `agents grew ${(D.agents[last] / D.agents[0]).toFixed(2)}x`)
assert.ok(Math.abs(D.people[last] / D.people[0] - f.GROWTH[1].value) < 0.05)
for (let i = 1; i <= last; i++) assert.ok(D.answerTime[i] < D.answerTime[i - 1], "answer time rises")
// Agents grow by about the same factor every month.
const steps = D.agents.slice(1).map((a, i) => a / D.agents[i])
for (const s of steps) assert.ok(Math.abs(s - 9 ** (1 / last)) < 0.08, `monthly growth ${steps.map((x) => x.toFixed(2))}`)
// Sources: 48M in all, and READERS' agent shares weight to 62%.
const views = D.sources.reduce((s, x) => s + x.views, 0)
assert.ok(near(views, f.TRAFFIC.pageViews.value, 0.05), `sources make ${views}M`)
const sourceAgents = D.sources.reduce((s, x) => s + (x.views * f.READERS.find((r) => r.name === x.name).agents) / 100, 0)
assert.equal(Math.round((sourceAgents / views) * 100), f.TRAFFIC.agentShare.value)
assert.ok(near(sourceAgents, D.agents[last], 0.1), `sources give ${sourceAgents.toFixed(2)}M agent views, months give ${D.agents[last]}M`)
// Formats: 100% of agent traffic; Markdown and llms.txt make the waffle's 83; llms.txt's slice matches its source.
assert.equal(D.formats.reduce((s, x) => s + x.share, 0), 100)
assert.equal(D.formats[0].share + D.formats[1].share, f.MARKDOWN_SHARE)
const llmsAgents = (D.sources.find((x) => x.name === "llms.txt").views * f.READERS.find((r) => r.name === "llms.txt").agents) / 100
assert.ok(near((D.formats[1].share / 100) * D.agents[last], llmsAgents, 0.1), "llms.txt slice and source disagree")
// Teams: 100% of teams; the two that draft with agents make the dot matrix's 83, and unreviewed is its 9.
assert.equal(D.teams.reduce((s, x) => s + x.share, 0), 100)
assert.equal(D.teams[0].share + D.teams[1].share, f.TEAM_SHARES.draft)
assert.equal(D.teams[1].share, f.TEAM_SHARES.publish)

console.log("facts ok", { density: density.map((d) => +d.toFixed(2)), depth: depth.map((d) => +d.toFixed(2)) })

// Each row's own derived numbers: <NN-row>/data.check.mjs, if it has one.
for (const dir of readdirSync(new URL(".", import.meta.url)).filter((d) => /^\d\d-/.test(d)).sort()) {
  const check = new URL(`./${dir}/data.check.mjs`, import.meta.url)
  if (existsSync(check)) {
    await import(check.href)
    console.log(`${dir} data ok`)
  }
}
