import type { Ideas } from "@/canvas/registry"

export default {
  row: 13,
  line: "Where values moved: ranges that narrow, pairs that part, ranks that swap.",
  frames: [
    ["ranges", "Agent answer times a month as spans from the fastest to the slowest tenth, median marked; they fall and narrow."],
    ["dumbbell", "Agents’ share of each source’s reads as a dumbbell from December to May; every source rose. Hover or focus a source."],
    ["bump", "Six agent types by their rank in agent reads each month, December to May; hover or focus one to read its climb."],
  ],
} satisfies Ideas
