// The checks that need a browser: contrast.mjs, then the stage's Boxes count (G twice) on every chart.
//   pnpm check:browser        (uses BASE, else the running dev server, else starts one and stops it after)
// Exits 1 if a colour pair fails or any box in any chart is off the 4px grid.
import { spawnSync } from "node:child_process"
import { readdirSync, readFileSync } from "node:fs"
import { chromium } from "playwright"

const astro = (...args) => {
  const r = spawnSync("pnpm", ["exec", "astro", "dev", ...args], { encoding: "utf8" })
  return r.stdout + r.stderr
}
const url = (text) => text.match(/http:\/\/localhost:\d+/)?.[0]
let base = process.env.BASE ?? url(astro("status"))
const started = !base
if (started) base = url(astro("--background"))
if (!base) throw new Error("No dev server: start one with pnpm dev, or set BASE")

let failed = spawnSync("node", ["scripts/contrast.mjs"], { stdio: "inherit", env: { ...process.env, BASE: base } }).status !== 0

// Every chart, from the rows' ideas.ts, as images.mjs reads them.
const slugs = readdirSync("src/canvas/data")
  .filter((d) => /^\d\d-/.test(d))
  .flatMap((d) => [...readFileSync(`src/canvas/data/${d}/ideas.ts`, "utf8").matchAll(/\[\s*"([a-z0-9-]+)",\s*"/g)].map((m) => m[1]))

// Reduced motion lands every chart on its end state, so the boxes are read where they settle.
const browser = await chromium.launch()
const page = await browser.newPage({ viewport: { width: 1440, height: 900 }, reducedMotion: "reduce" })
await page.addInitScript(() => localStorage.setItem("grid", "boxes"))
console.log("")
for (const slug of slugs) {
  await page.goto(`${base}/${slug}`, { waitUntil: "networkidle" })
  await page.evaluate(() => document.fonts.ready)
  await page.waitForTimeout(500)
  const text = await page.getByText("boxes on the 4px grid").innerText()
  const off = Number(text.match(/(\d+) off/)?.[1] ?? 0)
  failed ||= off > 0
  console.log(`${off ? "FAIL" : "pass"}  ${slug.padEnd(12)} ${text.split(" · origin")[0]}`)
}
await browser.close()
if (started) astro("stop")
process.exit(failed ? 1 : 0)
