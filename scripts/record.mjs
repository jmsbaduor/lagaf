// Records the showcase video: every chart in focused mode (?clean) and dark, at 3840 by 2160 and 60 fps, with
// colour changes and hovered readings.
//   node scripts/record.mjs [out.mp4]          (BASE defaults to http://localhost:4322; FRAMES=n stops early;
//                                               FROM=<slug> starts at that chart in the plan and runs to the end)
// Frame-exact: the page's clock is Playwright's fake clock, and every CSS animation and transition is paused and set
// to the clock's time each frame, so the video is smooth however long each 4K capture takes. Frames go straight into
// ffmpeg (H.264 High, CRF 12), never to disk.
import { spawn } from "node:child_process"
import { mkdirSync } from "node:fs"
import { dirname } from "node:path"
import { chromium } from "playwright"

const BASE = process.env.BASE ?? "http://localhost:4322"
const OUT = process.argv[2] ?? "recordings/lagaf-showcase-4k.mp4"
const FPS = 60
const W = 1280
const H = 720
const SCALE = 3 // 1280 by 720 at 3x: 3840 by 2160, text at triple density
const LIMIT = Number(process.env.FRAMES ?? Infinity)

// The run, mixed so neighbours differ in kind and the newer rows sit among the first ones; the stage jumps between
// charts through its history (popstate), as Back and Forward do. Seconds of hold, then optional hovers over n
// readable items, and colour steps (↓ through the accents) before moving on.
const PLAN = {
  readout: { hold: 1.7 },
  bridge: { hold: 1.5, hover: 4 },
  waffle: { hold: 1.3, hover: 2 },
  ribbons: { hold: 1.3, hover: 3 },
  trajectory: { hold: 1.2, hover: 5 },
  funnel: { hold: 1.2, hover: 4, colours: 3 }, // lumina to orange
  "dot-matrix": { hold: 1.5 },
  rings: { hold: 1.4 },
  crossover: { hold: 1.5 },
  freshness: { hold: 1.6 },
  numbers: { hold: 1.1, hover: 4 },
  bump: { hold: 1.3, hover: 3 },
  "token-bar": { hold: 1.5 },
  calendar: { hold: 1.5 },
  formats: { hold: 1.2, hover: 3, colours: 5 }, // orange to teal
  dumbbell: { hold: 1.4 },
  "who-reads": { hold: 1.1, hover: 4 },
  shift: { hold: 1.4 },
  leaderboard: { hold: 1.5 },
  butterfly: { hold: 1.2, hover: 4 },
  "eval-rows": { hold: 1.4, colours: 5 }, // teal to violet
  "icon-count": { hold: 1.5 },
  rhythm: { hold: 1.2, hover: 4 },
  ranges: { hold: 1.2, hover: 4 },
  "agent-share": { hold: 1.1, hover: 5 },
  bullets: { hold: 1.4, hover: 4, colours: 4 }, // violet to rose
  journeys: { hold: 1.3, hover: 4 },
  dashboard: { hold: 1.5 },
  growth: { hold: 1.2, hover: 2 },
  sparklines: { hold: 1.6 },
  timeline: { hold: 1.4 },
  "answer-spread": { hold: 1.3 },
  gauge: { hold: 1.5, colours: 1 }, // rose wraps round to lumina
  comparison: { hold: 1.5 },
  "daily-requests": { hold: 1.5 },
  "update-lag": { hold: 1.2, hover: 3 },
  "eval-sites": { hold: 1.2, hover: 4 },
  sources: { hold: 1.5 },
  milestones: { hold: 1.6 },
  "all-readers": { hold: 1.1, hover: 4 },
  "team-review": { hold: 1.4 },
  "answer-time": { hold: 1.4 },
  "time-saved": { hold: 2.2 },
}
const ALL = Object.keys(PLAN)
const slugs = ALL.slice(Math.max(0, ALL.indexOf(process.env.FROM ?? ALL[0])))

mkdirSync(dirname(OUT), { recursive: true })
const ffmpeg = spawn("ffmpeg", [
  "-y", "-loglevel", "error",
  "-f", "image2pipe", "-framerate", String(FPS), "-c:v", "mjpeg", "-i", "pipe:0",
  // JPEG frames are full range; players expect TV range, so convert and tag it, or the video looks washed out.
  "-vf", "scale=in_range=pc:out_range=tv,format=yuv420p",
  "-color_range", "tv", "-colorspace", "bt709", "-color_primaries", "bt709", "-color_trc", "bt709",
  "-c:v", "libx264", "-preset", "slow", "-crf", "12", "-profile:v", "high", "-level:v", "5.2",
  "-x264-params", "colorprim=bt709:transfer=bt709:colormatrix=bt709:range=tv",
  "-r", String(FPS), "-movflags", "+faststart", OUT,
], { stdio: ["pipe", "inherit", "inherit"] })
const encoded = new Promise((resolve, reject) => ffmpeg.on("close", (code) => (code === 0 ? resolve() : reject(new Error(`ffmpeg exited ${code}`)))))

const browser = await chromium.launch()
const page = await browser.newPage({ viewport: { width: W, height: H }, deviceScaleFactor: SCALE, reducedMotion: "no-preference" })
await page.addInitScript(() => {
  try {
    localStorage.setItem("theme", "dark")
    localStorage.setItem("accent", "lumina")
    localStorage.setItem("grid", "off")
  } catch {}
  // Step every animation to the page clock: paused, and played from its start on the frame it is first seen, so
  // real time spent capturing never leaks in. One the page moved itself (finish(), a replay) carries on from there.
  const base = new WeakMap()
  const last = new WeakMap()
  window.__step = () => {
    const now = performance.now()
    for (const a of document.getAnimations()) {
      const t = Number(a.currentTime ?? 0)
      if (!base.has(a)) base.set(a, now)
      else if (a.playState === "running" || t !== last.get(a)) base.set(a, now - t)
      a.pause()
      const next = now - base.get(a)
      a.currentTime = next
      last.set(a, next)
    }
  }
  // A drawn pointer, since a headless page shows none.
  window.__cursor = (x, y, o) => {
    let c = document.getElementById("rec-cursor")
    if (!c) {
      c = document.createElement("div")
      c.id = "rec-cursor"
      c.style.cssText = "position:fixed;left:0;top:0;z-index:2147483647;pointer-events:none;width:20px;height:28px"
      c.innerHTML = '<svg viewBox="0 0 20 28" width="20" height="28"><path d="M2 2v21l5.5-5.2 3.6 8.3 3.4-1.5-3.6-8.1H18z" fill="#0a0a0a" stroke="#fff" stroke-width="1.6" stroke-linejoin="round"/></svg>'
      document.body.append(c)
    }
    c.style.transform = `translate(${x - 2}px, ${y - 2}px)`
    c.style.opacity = String(o)
  }
})
await page.clock.install({ time: new Date("2026-05-26T09:11:00") })
await page.goto(`${BASE}/${slugs[0]}?clean`, { waitUntil: "domcontentloaded" })
for (let i = 0; i < 100 && !(await page.$("[data-frame]")); i++) await page.clock.runFor(100)
await page.evaluate(() => document.fonts.ready)
// Installed, the fake clock still follows real time; paused, it moves only by runFor, one frame at a time.
await page.clock.pauseAt((await page.evaluate(() => Date.now())) + 500)

let frames = 0
let cursor = { x: W - 40, y: H - 40, o: 0 }
await page.mouse.move(cursor.x, cursor.y)

async function frame() {
  if (frames >= LIMIT) return
  await page.mouse.move(cursor.x, cursor.y)
  await page.clock.runFor(1000 / FPS)
  await page.evaluate(({ x, y, o }) => (window.__step(), window.__cursor(x, y, o)), cursor)
  const jpg = await page.screenshot({ type: "jpeg", quality: 100 })
  if (!ffmpeg.stdin.write(jpg)) await new Promise((r) => ffmpeg.stdin.once("drain", r))
  frames++
}
const hold = async (s) => { for (let i = 0; i < Math.round(s * FPS); i++) await frame() }
const ease = (t) => (t < 0.5 ? 4 * t ** 3 : 1 - (-2 * t + 2) ** 3 / 2)
async function glide(to, s, o = 1) {
  const from = { ...cursor }
  const n = Math.max(1, Math.round(s * FPS))
  for (let i = 1; i <= n; i++) {
    const t = ease(i / n)
    cursor = { x: from.x + (to.x - from.x) * t, y: from.y + (to.y - from.y) * t, o: from.o + (o - from.o) * t }
    await frame()
  }
}
async function key(k, after = 0.12) {
  await page.keyboard.press(k)
  await hold(after)
}

// Hover n readable items, spread across the chart, then leave.
async function hover(n) {
  const items = await page.evaluate(() =>
    [...document.querySelectorAll('[data-frame] [tabindex="0"], [data-frame] label:has(input)')]
      .map((e) => e.getBoundingClientRect())
      .filter((r) => r.width > 2 && r.height > 2)
      .map((r) => ({ x: r.left + r.width / 2, y: r.top + r.height / 2 })),
  )
  if (!items.length) return
  const picks = Array.from({ length: Math.min(n, items.length) }, (_, i) => items[Math.round((i * (items.length - 1)) / Math.max(1, Math.min(n, items.length) - 1))])
  cursor = { ...cursor, x: picks[0].x + 120, y: picks[0].y + 160, o: 0 }
  await glide(picks[0], 0.28, 1)
  await hold(0.26)
  for (const p of picks.slice(1)) {
    await glide(p, 0.2)
    await hold(0.24)
  }
  await glide({ x: W - 40, y: H - 40 }, 0.24, 0)
}

// Start the first chart's entrance under the stepped clock.
await key("r", 0)
for (const [i, slug] of slugs.entries()) {
  const step = PLAN[slug]
  await hold(step.hold)
  if (step.hover) await hover(step.hover)
  for (let c = 0; c < (step.colours ?? 0); c++) await key("ArrowDown", 0.16)
  if (step.colours) await hold(0.35)
  if (i < slugs.length - 1)
    await page.evaluate((next) => {
      history.pushState(null, "", `/${next}${location.search}`)
      dispatchEvent(new PopStateEvent("popstate"))
    }, slugs[i + 1])
  if (frames >= LIMIT) break
}
await hold(0.5)

ffmpeg.stdin.end()
await encoded
await browser.close()
console.log(`${frames} frames, ${(frames / FPS).toFixed(1)}s at ${W * SCALE} by ${H * SCALE}, ${FPS} fps: ${OUT}`)
