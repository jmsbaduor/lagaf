# lagaf

Themable infographic pages. Static by default, interactive where a graphic needs it.

## Stack

| Layer | Choice | Why |
| --- | --- | --- |
| Framework | Astro 7 | Pages ship zero JS; only interactive graphics hydrate (`client:visible`). |
| Interactivity | React 19 islands | Used only inside graphics and controls. |
| Styling | Tailwind v4 + CSS variables | Every brand decision is a token, so brands are CSS, not code. |
| Components | shadcn/ui (Base UI, `base-nova`) | Source lives in `src/components/ui`; restyle freely. |
| Type | Geist + Geist Mono (Fontsource, self-hosted) | No third-party font requests. |
| Charts | `d3-scale`, `d3-shape`, `d3-format` | Maths only; rendering stays in our markup, so brands style it fully. |
| Hosting | Fly.io: static build served by Caddy | ~90 MB image, zstd/gzip, scales to zero. |

## Brands

A brand is one block in `src/styles/themes.css`:

```css
:root[data-theme="acme"] {
  --primary: oklch(0.5 0.15 30);
  --radius: 0.25rem;
  --chart-1: oklch(...); /* through --chart-5 */
  --brand-font-sans: "Your Font", sans-serif;
  --brand-font-data: var(--brand-font-mono); /* numbers in graphics */
}
```

Register the id in `src/lib/themes.ts`, then render a page with `<Layout theme="acme">`. Graphics read only tokens (`var(--chart-n)`, `rounded-sm`, `font-data`), so they re-skin without changes.

## Develop

```bash
npm install
npm run dev
```

Gate before pushing: `npm run typecheck && npm run lint && npm run build`.

## Deploy

```bash
fly launch --copy-config --no-deploy   # first time only: creates the app on Fly
fly deploy
```
