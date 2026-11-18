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

## Check

```bash
pnpm typecheck && pnpm lint && pnpm build
```

With the dev server running:

```bash
node scripts/contrast.mjs
```

```bash
node scripts/shoot.mjs /tmp/shots readout waffle
```

`contrast.mjs` tests every colour pair in every accent and mode against WCAG. `shoot.mjs` captures charts in light and dark.

## Deploy

```bash
fly deploy --build-secret CENTRAL_LICENSE_KEY="$CENTRAL_LICENSE_KEY"
```

Live at https://lagaf.fly.dev.
