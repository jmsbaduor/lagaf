# lagaf

Themable, animated infographic charts. Each chart fills the screen; small floating controls sit in the corners.

Built with [ui-sdk](https://github.com/vercel-labs/ui) (Vercel Labs) for every control, with Central Icons and Geist. Live at https://lagaf.fly.dev.

## What it's for

Chart slides that are meant to be looked at:

- **Office TV screens and metrics walls.** One chart a screen, readable from across the room, cycling with the arrow keys. `?clean` hides the controls.
- **Metrics reviews and data stories.** Each chart makes one point, in a title and one sentence, with the numbers drawn exactly.
- **Your brand.** Pick any accent and every chart re-skins, in light and dark, with every colour pair passing WCAG.

Bring your own data, either way you like:

- **Prompt an AI agent with your data points.** The repo ships a `new-chart` skill (`.claude/skills/new-chart/`) that turns "a chart of X" plus your numbers into a chart page that follows the system, then checks it.
- **Connect your backend.** Charts read their numbers from one place (`src/canvas/data/facts.ts`); point that at your API to keep the slides live.

## Run it

```bash
pnpm install
```

```bash
pnpm dev
```

Open http://localhost:4321. You need Node 24 and `CENTRAL_LICENSE_KEY` in `.env`, since Central Icons checks its licence on install.

## Use it

| Key | Does |
| --- | --- |
| ← → | Previous or next chart |
| ↑ ↓ | Change the colour |
| D | Light or dark |
| G | Layout grid, then boxes |
| R | Replay the chart |
| C | Motion: speed and reduced motion |
| H | Hide the controls |

Add `?clean` to a URL to hide the controls (the chart then fills the screen), or `?bare` to show the chart alone at 1:1.

## How it's built

- **Charts** live in `src/canvas/data/<NN>-<row>/<slug>.tsx` and show at `/<slug>`. Each is drawn on a 1440 by 900 area and scaled to the screen. A chart can export `knobs`, which appear in the bottom-left bar.
- **Colour** comes from tokens only (`bg-viz-lead`, `text-viz-label` and so on), derived from the accent, so every chart re-skins with it.
- **Brand exploration** lives in `src/canvas/brand/` and shows at `/brand/<slug>`.
- **New charts** start from `src/canvas/data/_template/` and follow [docs/charts.md](docs/charts.md).

## Check

```bash
pnpm check
```

```bash
pnpm check:browser
```

```bash
node scripts/shoot.mjs /tmp/shots readout waffle
```

`check` runs the typecheck, lint, build and facts check. `check:browser` tests every colour pair in every accent and mode against WCAG, and every chart's boxes against the 4px grid; it starts a dev server if none is running. `shoot.mjs` captures charts in light and dark.

## Record

```bash
pnpm build && pnpm preview --port 4322
```

```bash
node scripts/record.mjs
```

Records every chart in focused mode and dark, with a few colour changes and readings, to `recordings/` as 3840 by 2160 at 60 fps. It steps the page clock frame by frame, so motion is smooth however slow the capture. Needs ffmpeg.

## Deploy

It's a static site, so it runs anywhere. `pnpm build` writes plain HTML, CSS and JavaScript to `dist/`, with no server to run. The one thing every host needs is `CENTRAL_LICENSE_KEY` as a build environment variable, since Central Icons checks its licence on install.

- **A static host** (Vercel, Netlify, Cloudflare Pages, GitHub Pages and the like): Node 24, build command `pnpm build`, output directory `dist`.
- **Any container host:** the `Dockerfile` builds the site and serves `dist/` with Caddy on port 8080.

```bash
docker build --secret id=CENTRAL_LICENSE_KEY,env=CENTRAL_LICENSE_KEY -t lagaf .
```

```bash
docker run -p 8080:8080 lagaf
```

The demo at https://lagaf.fly.dev runs on Fly, from the same Dockerfile:

```bash
fly deploy --build-secret CENTRAL_LICENSE_KEY="$CENTRAL_LICENSE_KEY"
```
