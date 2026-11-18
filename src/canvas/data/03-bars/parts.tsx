// Shared by the row's frames. Controls that switch a chart live in the stage's bottom bar as knobs; the live
// readout is the Header's hint, from the kit's useReading. An item that isn't read fades its marks and mutes its
// words, so they still read (4.5:1, or 3:1 for large numbers).

/** Visible focus for chart items that take focus. */
export const focusRing =
  "outline-none focus-visible:outline-2 focus-visible:outline-offset-8 focus-visible:outline-ring"

/** A series colour for large text, pulled 20% toward the ink so it holds 3:1 in every brand. */
export const seriesText = (token: string) => ({ color: `color-mix(in oklch, var(${token}) 80%, var(--viz-ink))` })
