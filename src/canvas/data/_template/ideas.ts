import type { Ideas } from "@/canvas/registry"

// A new row's ideas.ts: the row's number (its folder's NN), one line for the row, then its charts in the order they
// show, as [file name without .tsx, one line on what the chart shows and how it is read].
export default {
  row: 0,
  line: "What the row's charts have in common, in one line.",
  frames: [["chart", "Five sources as bars of their agent share; hover or focus one to read it."]],
} satisfies Ideas
