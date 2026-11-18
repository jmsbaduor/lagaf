# ui-sdk

Before using ui-sdk, follow the `ui-sdk` skill if it's installed, and read `node_modules/@ui-sdk/react/docs/llms.txt`.

To build a new component, also search `node_modules/@ui-sdk/react/docs/core.md` by heading, and read `rendering.md` next to it.

# lagaf

Themable, animated infographic charts, built with ui-sdk.

- Charts use only the tokens in `src/styles/global.css` (surfaces and ink, and the chart roles in section 6). No raw hex values.
- Icons are Central Icons through `src/components/Icon.tsx`; add a name there before using it.
- Use Node 24 (`.node-version`) and pnpm. Installing needs `CENTRAL_LICENSE_KEY` in `.env`.
- Gate: `pnpm check`, then `pnpm check:browser`. New charts follow `docs/charts.md` (the `new-chart` skill).
