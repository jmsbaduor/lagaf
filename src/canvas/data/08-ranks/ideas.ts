import type { Ideas } from "@/canvas/registry"

export default {
  row: 8,
  line: "Reader types ranked by their share of reads, each with its rank, its icon and a bar.",
  frames: [
    ["leaderboard", "Agent types ranked by share of agent reads: the top three as cards, the rest as a ruled table."],
    ["all-readers", "Every reader type ranked by share of all reads, people first, above one bar for all agents."],  ],
} satisfies Ideas
