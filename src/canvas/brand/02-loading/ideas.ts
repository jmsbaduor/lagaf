import type { Ideas } from "@/canvas/registry"

export default {
  row: 2,
  line: "How a chart loads, fails and updates, from the first paint to a live refresh.",
  frames: [
    ["boot-screen", "The page shows the mark loader in plain HTML until the chart’s code runs."],
    ["chart-skeletons", "Each chart waits in its own structure, so nothing jumps when data lands."],
    ["slow-load", "The chart shows a skeleton at 0.4s, a note at 3s and an error at 10s."],
    ["no-data", "The chart says what went wrong in plain words and offers one next step."],
    ["data-update", "The chart holds still, then moves only the bars and numbers that changed."],
  ],
} satisfies Ideas
