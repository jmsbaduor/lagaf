// Renders the share cards and app icons from the running site.
//   node scripts/images.mjs            (BASE defaults to http://localhost:4321)
// Writes public/og/<slug>.png (1200 by 630, from /og/<slug>) and the favicon PNGs (from public/favicon.svg, light).
import { mkdirSync, readFileSync, readdirSync } from "node:fs"
import { chromium } from "playwright"

const base = process.env.BASE ?? "http://localhost:4321"
const slugs = ["home"]
for (const dir of readdirSync("src/canvas/data").filter((d) => /^\d\d-/.test(d))) {
  const ideas = readFileSync(`src/canvas/data/${dir}/ideas.ts`, "utf8")
  for (const [, slug] of ideas.matchAll(/\[\s*"([a-z0-9-]+)",\s*"/g)) slugs.push(slug)
}

mkdirSync("public/og", { recursive: true })
const browser = await chromium.launch()
const page = await browser.newPage({ viewport: { width: 1200, height: 630 } })
for (const slug of slugs) {
  await page.goto(`${base}/og/${slug}`, { waitUntil: "networkidle" })
  await page.screenshot({ path: `public/og/${slug}.png` })
}

// Icons: the mark on its own (32) and on a paper tile with room around it (180, 512).
const svg = readFileSync("public/favicon.svg", "utf8")
const icons = [["favicon-32.png", 32, 32], ["apple-touch-icon.png", 180, 112], ["icon-512.png", 512, 320]]
for (const [file, size, mark] of icons) {
  await page.setViewportSize({ width: size, height: size })
  const tile = size === 32 ? "transparent" : "#fbfbf9"
  await page.setContent(`<body style="margin:0;display:grid;place-items:center;width:${size}px;height:${size}px;background:${tile}">${svg.replace("<svg ", `<svg width="${mark}" height="${mark}" `)}</body>`)
  await page.screenshot({ path: `public/${file}`, omitBackground: size === 32 })
}
await browser.close()
console.log(`${slugs.length} cards and ${icons.length} icons written`)
