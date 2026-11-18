import { Frame, Header, TOP } from "@/canvas/kit"
import { Mark } from "@/components/Mark"
import type { Knobs, Values } from "@/components/stage"

import boot from "./boot.html?raw"
import { labelText, Spec } from "./parts"

export const knobs = {
  script: {
    type: "choice",
    label: "Script",
    value: "Loading",
    options: ["Loading", "Blocked"],
  },
} as const satisfies Knobs

// The preview is the whole 1440 by 900 page, drawn at its real size and scaled to 896 by 560, the largest size
// with both sides on the 8 px grid that fits above the frame's foot. Beside it, 48 over, a 352 column: the loader
// at twice its size, then the timing rules, whose last rule ends level with the preview.
const SCALE = 896 / 1440
const caption = `${labelText} text-viz-label`

const RULES = [
  { at: "0 to 0.4s", text: "Paper only, so nothing flashes." },
  { at: "From 0.4s", text: "The loader fades in and loops." },
  { at: "Script runs", text: "The chart replaces the loader." },
  { at: "No script", text: "One line says it needs JavaScript." },
]

export default function BootScreen({ script = "Loading" }: Partial<Values<typeof knobs>>) {
  const blocked = script === "Blocked"
  // With scripting on, a browser leaves <noscript> unparsed. Unwrapping it shows what a viewer without JavaScript sees.
  const html = blocked ? boot.replace(/<\/?noscript>/g, "") : boot

  return (
    <Frame>
      <Header
        title="Before the script runs"
        description="The page shows the mark loader in plain HTML until the chart’s code runs."
      />

      <figure className="absolute left-[72px] flex flex-col gap-4" style={{ top: TOP }}>
        {/* The snippet is the page's own status region; here it is a picture of one, so it stays out of the tree. */}
        <div
          role="img"
          aria-label={
            blocked
              ? "The page without JavaScript: one line of text on plain paper."
              : "The page before its script runs: plain paper with the mark loader at its centre."
          }
          className="relative h-[560px] w-[896px] overflow-hidden"
        >
          <div
            key={script}
            aria-hidden="true"
            className="h-[900px] w-[1440px] origin-top-left"
            style={{ transform: `scale(${SCALE})` }}
            dangerouslySetInnerHTML={{ __html: html }}
          />
          {/* The edge over the page, inset like every tile in the row (the page would cover an inset shadow). */}
          <span aria-hidden="true" className="pointer-events-none absolute inset-0 ring-1 ring-viz-hatch ring-inset" />
        </div>
        <figcaption className={caption}>Page, 1440 by 900</figcaption>
      </figure>

      <div className="absolute left-[1016px] flex w-[352px] flex-col gap-12" style={{ top: TOP }}>
        <figure className="flex flex-col gap-4">
          <div className="grid h-40 place-items-center ring-1 ring-viz-hatch ring-inset">
            <Mark loading size={64} />
          </div>
          <figcaption className={caption}>Loader, 1.2s loop</figcaption>
        </figure>
        <Spec rows={RULES} active={blocked ? 3 : 1} />
      </div>
    </Frame>
  )
}
