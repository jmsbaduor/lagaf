import { CountUp, delay, Fill, focusRing, Frame, Header, Label, TOP, useReading } from "@/canvas/kit"
import { cn } from "@/lib/utils"

import { pct } from "../facts"
import { DRAFT, SEGMENTS } from "./data"

// Roles: reviewing first is what the chart is about; publishing unreviewed needs attention, as in the dot matrix;
// teams without agents are the empty track.
const FILL = ["bg-viz-lead", "bg-viz-alert", null]

// The bracket (a 16 label, 8, a 16 bracket) sits on TOP and the bar 24 under it, at 296. The bar is 404 tall so
// each part's number (24 under, 64) and two-line name (8 under, 32) end on 828. Segment edges are in data.ts.
const BAR_TOP = TOP + 64
const BAR_H = 404

// The entrance is the bar: every part's track is there, then the two that draft with agents grow from their left
// edges while their numbers count, a beat apart; the bracket then draws across both and its label fades in.
const GROW = 600
const AT = [100, 200]
const BRACKET_AT = 500

type Key = number | "draft"

export default function TeamReview() {
  const { active, bind } = useReading<Key>()
  // The bracket reads both parts under it.
  const dim = (i: number) => active !== null && active !== i && !(active === "draft" && FILL[i])
  const on = active === "draft" ? { name: "Draft with agents", share: DRAFT.share } : active === null ? null : SEGMENTS[active]

  return (
    <Frame>
      <Header
        title="Most teams review agent drafts"
        description={`${DRAFT.share}% of teams draft docs with agents; ${SEGMENTS[1].share}% publish without review.`}
        hint={on ? `${on.name}: ${on.share}%` : "Hover or focus a share"}
        on={!!on}
      />

      <ul aria-label="Teams by how they use agents on docs">
        <li
          tabIndex={0}
          aria-label={`Draft with agents: ${DRAFT.share}%`}
          className={cn("absolute left-[72px] flex flex-col items-center gap-2", focusRing)}
          style={{ top: TOP, width: DRAFT.w }}
          {...bind("draft")}
        >
          <Label
            aria-hidden="true"
            className={cn(
              "self-stretch text-center transition-colors",
              dim(0) && dim(1) ? "text-muted-foreground" : "text-foreground"
            )}
          >
            <span className="viz-fade block" style={delay(BRACKET_AT + 200)}>
              Draft with agents: {DRAFT.share}%
            </span>
          </Label>
          {/* 15px ticks with the rule on their middle pixel, so the bracket is symmetric (as the token bar's). */}
          <div aria-hidden="true" className="viz-grow-x relative h-4 w-full" style={delay(BRACKET_AT, 400)}>
            <span className="absolute inset-x-0 top-[7px] h-px bg-viz-label" />
            <span className="absolute top-0 left-0 h-[15px] w-px bg-viz-label" />
            <span className="absolute top-0 right-0 h-[15px] w-px bg-viz-label" />
          </div>
        </li>

        {SEGMENTS.map((s, i) => (
          <li
            key={s.name}
            tabIndex={0}
            aria-label={`${s.name}: ${s.share}%`}
            className={cn("absolute", focusRing)}
            style={{ left: 72 + s.x, top: BAR_TOP, width: s.w }}
            {...bind(i)}
          >
            {/* A part that isn't read fades to 30% over the paper, track and fill together; its words mute. */}
            <div
              aria-hidden="true"
              className={cn("relative bg-viz-track transition-opacity", dim(i) && "opacity-30")}
              style={{ height: BAR_H }}
            >
              {FILL[i] && <Fill at={AT[i]} duration={GROW} className={cn("inset-0", FILL[i])} />}
            </div>
            <div aria-hidden="true" className={cn("transition-colors", dim(i) && "text-muted-foreground")}>
              <p className="mt-6 -indent-1 font-data text-[64px] leading-16 font-medium tracking-[-0.04em]">
                {FILL[i] ? <CountUp value={s.share} delay={AT[i]} duration={GROW} format={pct} /> : pct(s.share)}
              </p>
              <Label className={cn("mt-2", dim(i) && "text-current")}>{s.short}</Label>
            </div>
          </li>
        ))}
      </ul>
    </Frame>
  )
}
