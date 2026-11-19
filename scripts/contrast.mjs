// WCAG contrast of every chart colour pair, in light and dark, for every accent.
//   BASE=http://localhost:4321 node scripts/contrast.mjs        (needs the dev server or a preview running)
// Colours are resolved by the browser from the real stylesheet, then measured in sRGB.
// Text needs 4.5:1; large numbers and chart marks against the page need 3:1 (WCAG 1.4.3, 1.4.11).
// Exits 1 if any pair fails, so it can gate a change.
import { chromium } from "playwright"

const base = process.env.BASE ?? "http://localhost:4321"

// [label, foreground variable, background variable, minimum]
const PAIRS = [
  ["Text on the page", "--color-fg", "--viz-paper", 4.5],
  ["Muted text on the page", "--color-fg-muted", "--viz-paper", 4.5],
  ["Mono labels on the page", "--viz-label", "--viz-paper", 4.5],
  ["Muted text on a track", "--color-fg-muted", "--viz-track", 4.5],
  ["Text on a panel", "--viz-panel-ink", "--viz-panel", 4.5],
  ["Text on the inverse panel", "--viz-deep-ink", "--viz-deep", 4.5],
  ["Text on the lead colour", "--viz-lead-ink", "--viz-lead", 4.5],
  ["Text on yellow", "--viz-warn-ink", "--viz-warn", 4.5],
  ["Text on orange", "--viz-alert-ink", "--viz-alert", 4.5],
  ["Lead marks on the page", "--viz-lead", "--viz-paper", 3],
  ["Compared series on the page", "--viz-contrast", "--viz-paper", 3],
  ["Large numbers on the compared series", "--viz-paper", "--viz-contrast", 3],
  ["Orange marks on the page", "--viz-alert", "--viz-paper", 3],
  ["Yellow mark edges on the page", "--viz-warn-edge", "--viz-paper", 3],
]

const browser = await chromium.launch()
const page = await browser.newPage()
await page.goto(`${base}/readout?bare`, { waitUntil: "domcontentloaded" })
await page.waitForTimeout(1500)

const results = await page.evaluate((pairs) => {
  const root = document.documentElement
  const hues = ["lumina", "lime", "red", "orange", "amber", "yellow", "green", "emerald", "teal", "cyan", "sky", "blue", "indigo", "violet", "purple", "fuchsia", "pink", "rose"]
  const ctx = document.createElement("canvas").getContext("2d", { willReadFrequently: true })
  const probe = document.createElement("span")
  document.body.append(probe)
  const rgb = (variable) => {
    probe.style.color = `var(${variable})`
    ctx.clearRect(0, 0, 1, 1)
    ctx.fillStyle = getComputedStyle(probe).color
    ctx.fillRect(0, 0, 1, 1)
    return [...ctx.getImageData(0, 0, 1, 1).data.slice(0, 3)]
  }
  const lum = ([r, g, b]) => {
    const lin = (c) => ((c /= 255) <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4)
    return 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b)
  }
  const ratio = (a, b) => {
    const [x, y] = [lum(a), lum(b)].sort((p, q) => q - p)
    return (x + 0.05) / (y + 0.05)
  }
  const out = []
  for (const mode of ["light", "dark"]) {
    root.classList.remove("light", "dark")
    root.classList.add(mode)
    root.style.colorScheme = mode
    for (const hue of hues) {
      root.dataset.accent = hue
      for (const [label, fg, bg, min] of pairs) out.push({ mode, hue, label, min, ratio: ratio(rgb(fg), rgb(bg)) })
    }
  }
  return out
}, PAIRS)
await browser.close()

let failed = 0
for (const [label, , , min] of PAIRS) {
  const rows = results.filter((r) => r.label === label)
  const worst = rows.reduce((a, b) => (b.ratio < a.ratio ? b : a))
  const lumina = rows.filter((r) => r.hue === "lumina").map((r) => `${r.mode} ${r.ratio.toFixed(2)}`).join(", ")
  const fails = rows.filter((r) => r.ratio < min)
  failed += fails.length
  const mark = fails.length ? "FAIL" : "pass"
  console.log(`${mark}  ${label.padEnd(28)} needs ${min}:1  lumina: ${lumina}  worst: ${worst.ratio.toFixed(2)} (${worst.hue} ${worst.mode})`)
  if (fails.length) console.log(`      fails: ${fails.map((r) => `${r.hue} ${r.mode} ${r.ratio.toFixed(2)}`).join(", ")}`)
}
console.log(failed ? `\n${failed} pair(s) under their minimum.` : "\nEvery pair passes in every accent and mode.")
process.exit(failed ? 1 : 0)
