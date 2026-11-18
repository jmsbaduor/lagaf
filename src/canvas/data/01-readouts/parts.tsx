import { cn } from "@/lib/utils"

/** A row that can be read (focusable, marked `data-active` while read): the band below positions against it. */
export const row = "group relative isolate outline-none"

/**
 * The row's hover and focus band: a pale panel tint bleeding 16px past the text,
 * carrying the keyboard focus ring too. Place it as an empty span inside the row.
 */
export const band = cn(
  "pointer-events-none absolute -inset-x-4 inset-y-0 -z-10 bg-viz-panel/40 opacity-0",
  "transition-opacity group-data-active:opacity-100",
  "outline-ring group-focus-visible:outline-2 group-focus-visible:-outline-offset-2"
)

/** A note under or beside a number: the deck's words, 22/28. */
export const note = "text-[22px] leading-7 font-medium tracking-[-0.01em]"

/**
 * Geist Mono draws "s" and "M" inside their cells, so a right-aligned reading ending in one stops short of the
 * rule's end. This moves it out by the gap, so every reading's ink ends where a "%" and the stamps do.
 */
const INK_END: Record<string, string> = { s: "relative left-[0.07em]", M: "relative left-[0.04em]" }
export const inkEnd = (reading: string) => INK_END[reading.at(-1) ?? ""]
