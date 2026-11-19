import { CountUp, Fill, focusRing, Frame, Header, Label, labelText, TOP, useReading } from "@/canvas/kit"
import { cn } from "@/lib/utils"

import { count, FUNNEL } from "./data"

// Four rows of 92 from TOP, 76 apart, so the last ends on 828. Across: the stage's number (64/64) and its name 12
// under it in a 256 column, 32, then the bar from one shared baseline at 288 into the content box, 0.6px a question
// (lengths in data.ts). Each later bar wears a hatch out to the bar above's end, the questions it lost, and the loss
// 16 after the hatch.
const ROW_H = 92
const ROW_GAP = 76
const BAR_X = 288
const LAST = FUNNEL.length - 1

// The entrance is the funnel narrowing: each bar grows from the baseline while its number counts, top to bottom in
// shrinking steps. Names, hatches and losses are read, so they're there from the start.
const GROW = 600
const AT = [100, 180, 240, 280]

const reading = (s: (typeof FUNNEL)[number]) => `${s.name}: ${count(s.n)}`

export default function Funnel() {
  const { active, bind, dim } = useReading<number>()
  const on = active === null ? null : FUNNEL[active]

  return (
    <Frame>
      <Header
        title={`Docs answered ${count(FUNNEL[LAST].n)} of ${count(FUNNEL[0].n)} questions`}
        description="A median team’s May questions, from asked to answered with no human."
        hint={on ? reading(on) : "Hover or focus a stage"}
        on={!!on}
      />

      <ol aria-label="A median team’s May questions by stage">
        {FUNNEL.map((s, i) => (
          <li
            key={s.name}
            tabIndex={0}
            aria-label={i ? `${reading(s)}, ${count(s.drop)} fewer than the stage before` : reading(s)}
            className={cn("absolute left-[72px] w-[1296px] transition-colors", focusRing, dim(i) && "text-muted-foreground")}
            style={{ top: TOP + i * (ROW_H + ROW_GAP), height: ROW_H }}
            {...bind(i)}
          >
            <div aria-hidden="true">
              <p className="-indent-1 font-data text-[64px] leading-16 font-medium tracking-[-0.04em]">
                <CountUp value={s.n} delay={AT[i]} duration={GROW} format={count} />
              </p>
              <Label className={cn("mt-3 transition-colors", dim(i) && "text-current")}>{s.name}</Label>
            </div>

            {/* The last stage is what the chart is about; the stages before it are the quiet track. A stage that
                isn't read fades its bar and hatch to 30%. */}
            <div aria-hidden="true" className={cn("transition-opacity", dim(i) && "opacity-30")}>
              {i > 0 && (
                <span
                  className="viz-hatch absolute inset-y-0"
                  style={{ left: BAR_X + s.w, width: s.prevW - s.w }}
                />
              )}
              <div className="absolute inset-y-0" style={{ left: BAR_X, width: s.w }}>
                <Fill
                  size={s.w}
                  at={AT[i]}
                  duration={GROW}
                  className={i === LAST ? "bg-viz-lead" : "bg-viz-track"}
                />
              </div>
            </div>
            {i > 0 && (
              <p
                aria-hidden="true"
                className={cn(labelText, "absolute top-9 leading-5 whitespace-nowrap text-viz-label transition-colors", dim(i) && "text-muted-foreground")}
                style={{ left: BAR_X + s.prevW + 16 }}
              >
                {s.dropLabel}
              </p>
            )}
          </li>
        ))}
      </ol>
    </Frame>
  )
}
