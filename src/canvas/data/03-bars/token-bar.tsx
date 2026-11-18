import { delay, Fill, Frame, Header, Label, TOP } from "@/canvas/kit"
import type { Knobs, Values } from "@/components/stage"
import { cn } from "@/lib/utils"

import { TOKEN_USED, TOKEN_W, TOKENS_SAVED } from "../facts"

// The format switch is a knob in the stage's bottom bar.
export const knobs = {
  format: { type: "choice", label: "Format", value: "Markdown", options: ["HTML", "Markdown"] },
} as const satisfies Knobs

// The HTML whole spans the content width (1296). Markdown's 40% is 520px: 518.4 rounded to the 4px grid (facts.ts),
// so both its edge and the bracket's 776 land on whole pixels. The bar is 468 tall, so its label below ends on 828.
const BAR_H = 468

// The entrance: the picked format's usage fills the HTML whole from the left, then the bracket draws across what
// Markdown saves and its label fades in. The whole and the bar labels are structure, so they don't move.
// A format change answers in 200ms on every part that changes.
const FILL_AT = 100
const FILL = 600
const BRACKET_AT = 500
const answer = "duration-200"

export default function TokenBar({ format = "Markdown" }: Partial<Values<typeof knobs>>) {
  const md = format === "Markdown"

  return (
    <Frame>
      <Header
        title="Cut tokens by up to 60%"
        description="The same docs, as an agent reads them in HTML or in Markdown with llms.txt."
      />
      <p aria-live="polite" className="sr-only">
        {md ? "Markdown + llms.txt: up to 60% fewer tokens than HTML." : "HTML: the full token count."}
      </p>

      <div
        role="img"
        aria-label="Token usage. Markdown + llms.txt uses up to 60% fewer tokens than HTML for the same docs."
        className="absolute left-[72px]"
        style={{ top: TOP, width: TOKEN_W }}
      >
        {/* The bracket spans what Markdown saves. It folds into the bar's end when HTML is picked. */}
        <div className="flex flex-col items-center gap-2" style={{ marginLeft: TOKEN_USED }}>
          <Label
            className={cn("self-stretch text-center text-foreground transition-opacity", answer, !md && "opacity-0")}
          >
            <span className="viz-fade block" style={delay(BRACKET_AT + 200)}>
              Up to {TOKENS_SAVED}% fewer tokens
            </span>
          </Label>
          <div
            className={cn("h-4 w-full origin-right transition-[scale,opacity]", answer, !md && "scale-x-0 opacity-0")}
          >
            {/* 15px ticks with the rule on their middle pixel, so the bracket is symmetric. */}
            <div className="viz-grow-x relative h-full" style={delay(BRACKET_AT, 400)}>
              <span className="absolute inset-x-0 top-[7px] h-px bg-viz-label" />
              <span className="absolute top-0 left-0 h-[15px] w-px bg-viz-label" />
              <span className="absolute top-0 right-0 h-[15px] w-px bg-viz-label" />
            </div>
          </div>
        </div>

        <Label className="mt-6">{md ? "Markdown + llms.txt" : "HTML"} · token usage</Label>
        {/* The whole's edge is a 1px inset ring, so it takes no room and the fill covers it. */}
        <div className="viz-hatch relative mt-4 ring-1 ring-viz-label/70 ring-inset" style={{ height: BAR_H }}>
          <Fill at={FILL_AT} duration={FILL} className="inset-0">
            <div
              className={cn(
                "h-full origin-left transition-[scale,background-color]",
                answer,
                md ? "bg-viz-lead" : "bg-viz-label"
              )}
              style={{ scale: md ? `${TOKEN_USED / TOKEN_W} 1` : "1 1" }}
            />
          </Fill>
        </div>
        <Label className={cn("mt-4 text-right transition-opacity", answer, !md && "opacity-0")}>
          HTML · token usage
        </Label>
      </div>
    </Frame>
  )
}
