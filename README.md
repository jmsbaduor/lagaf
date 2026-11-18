# lagaf

Themable, animated infographic charts. Each chart fills the screen; small floating controls sit in the corners.

Built with [ui-sdk](https://github.com/vercel-labs/ui) (Vercel Labs) for every control, on [frantic](../frantic)'s design system, with Central Icons and Geist.

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

Add `?clean` to a URL to hide the controls, or `?bare` to show the chart alone at 1:1.

## How it's built

- **Charts** live in `src/canvas/data/<NN>-<row>/<slug>.tsx` and show at `/<slug>`. Each is drawn on a 1440 by 900 area and scaled to the screen. A chart can export `knobs`, which appear in the bottom-left bar.
- **Colour** comes from tokens only (`bg-viz-lead`, `text-viz-label` and so on), derived from the accent, so every chart re-skins with it.
- **Brand exploration** lives in `src/canvas/brand/` and shows at `/brand/<slug>`.
- **Decisions** are recorded in [docs/design/decisions.md](docs/design/decisions.md).
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

## Deploy

```bash
fly deploy --build-secret CENTRAL_LICENSE_KEY="$CENTRAL_LICENSE_KEY"
```

Live at https://lagaf.fly.dev.
