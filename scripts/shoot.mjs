// Full-screen captures of charts on the stage, light and dark, at 1440 by 900, and any console errors.
//   node scripts/shoot.mjs <out dir> <slug...>      (BASE defaults to http://localhost:4321)
import { chromium } from "playwright"
const [out, ...slugs] = process.argv.slice(2)
const browser = await chromium.launch()
for (const mode of ["light", "dark"]) {
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } })
  await page.addInitScript((m) => localStorage.setItem("theme", m), mode)
  const errors = []
  page.on("pageerror", (e) => errors.push(e.message))
  page.on("console", (m) => m.type() === "error" && errors.push(m.text().slice(0, 140)))
  for (const slug of slugs) {
    await page.goto(`${process.env.BASE ?? "http://localhost:4321"}/${slug}`, { waitUntil: "domcontentloaded" })
    await page.waitForTimeout(3500)
    await page.screenshot({ path: `${out}/${slug}-${mode}.png` })
  }
  console.log(mode, errors.length ? errors.join("\n") : "no errors")
  await page.close()
}
await browser.close()
