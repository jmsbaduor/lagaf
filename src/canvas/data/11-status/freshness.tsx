import { useId, type CSSProperties } from "react"

import {
  Choice,
  Choices,
  CountUp,
  Frame,
  Header,
  labelText,
  note,
  TOP,
  useReading,
  wipe,
  XAxis,
  YAxis,
} from "@/canvas/kit"
import { cn } from "@/lib/utils"

import { CELLS, rowPitch, sectionReading, SECTIONS, STATES, TOTALS, weekName, WEEKS, type State } from "./data"

// Each state by its colour and its mark, so it reads without colour too: fresh is the plain track, aging is yellow
// with its edge ring, stale is orange with a dark square at its centre (its ink, 4.5:1 on the orange).
const STYLE: Record<State, string> = {
  fresh: "bg-viz-track",
  aging: "bg-viz-warn ring-1 ring-inset ring-viz-warn-edge",
  stale: "bg-viz-alert",
}

function Mark({ state, className }: { state: State; className?: string }) {
  return (
    <span className={cn("relative", STYLE[state], className)}>
      {state === "stale" && (
        <span className="absolute top-1/2 left-1/2 size-2 -translate-x-1/2 -translate-y-1/2 bg-viz-alert-ink" />
      )}
    </span>
  )
}

// Twelve weeks of 56px cells on a 60 pitch from the names' column: 232 to 948. Rows take the tallest pitch that fits
// the sections (28 for 20), so the week ticks under the grid end by 828. The key runs down the right, 1012 to 1368,
// three entries 196 apart from TOP, the last ending on 764.
const GRID_X = 232
const PITCH = 60
const CELL_W = PITCH - 4
const ROW = rowPitch(SECTIONS.length)
const GRID_R = GRID_X + WEEKS.length * PITCH - 4 // 948
const GRID_B = TOP + SECTIONS.length * ROW - 4 // 788
const KEY_X = 1012
const KEY_W = 1368 - KEY_X
const KEY_PITCH = 196

// The entrance is the weeks passing: one stepped wipe reveals the grid a week at a time, left to right, while each
// state's count climbs alongside. It leaves no clip behind, so focus rings on the edge cells show whole. Names,
// ticks and the key's words are there from the start.
const AT = 100
const RUN = 600
const SWEEP = {
  ...wipe(AT, RUN, WEEKS.length),
  animationFillMode: "backwards",
} as CSSProperties

const stateKey = (id: State) => `state:${id}`

export default function Freshness() {
  const sectionName = useId()
  const stateName = useId()
  const { active, bind, dim } = useReading<string>()
  const readState = STATES.find((s) => stateKey(s.id) === active)
  const readSection = SECTIONS.find((s) => s.name === active)
  // A cell stays while its section or its state is read; every other fades.
  const fades = (section: string, state: State) => active !== null && active !== section && active !== stateKey(state)

  return (
    <Frame>
      <Header
        title="Three sections went stale in April"
        description="Twenty docs sections over twelve weeks, each fresh, aging or stale."
        hint={
          readState
            ? `${readState.name}: ${TOTALS[readState.id]} of ${CELLS} weeks`
            : readSection
              ? sectionReading(readSection)
              : "Hover or focus a section"
        }
        on={!!active}
      />

      <YAxis
        ticks={SECTIONS.map((s, i) => ({
          at: TOP + i * ROW,
          label: s.name,
          on: active === s.name,
        }))}
        from={GRID_X}
        band={ROW - 4}
      />
      <XAxis
        ticks={WEEKS.flatMap((w, i) => (i % 2 ? [] : [{ at: GRID_X + i * PITCH, label: weekName(w) }]))}
        y={GRID_B}
        band={CELL_W}
      />

      <div
        aria-hidden="true"
        className="viz-wipe absolute grid gap-1"
        style={{
          left: GRID_X,
          top: TOP,
          gridTemplateColumns: `repeat(${WEEKS.length}, ${CELL_W}px)`,
          gridAutoRows: ROW - 4,
          ...SWEEP,
        }}
      >
        {SECTIONS.flatMap((s) =>
          s.weeks.map((w, i) => (
            <Mark
              key={`${s.name}-${i}`}
              state={w}
              className={cn("transition-opacity", fades(s.name, w) && "opacity-30")}
            />
          ))
        )}
      </div>

      {/* Each section's row, name and weeks, is one radio over the grid; its hit area runs 2px into each gap so moving
          down the grid never drops a reading. */}
      <Choices legend="Read a section">
        {SECTIONS.map((s, i) => (
          <Choice
            key={s.name}
            name={sectionName}
            value={s.name}
            className="absolute block before:absolute before:-inset-0.5 has-[:focus-visible]:outline-offset-1"
            style={{
              left: 72,
              top: TOP + i * ROW,
              width: GRID_R - 72,
              height: ROW - 4,
            }}
            {...bind(s.name)}
          >
            <span className="sr-only">{sectionReading(s)}</span>
          </Choice>
        ))}
      </Choices>

      <Choices legend="Read a state">
        {STATES.map((s, i) => {
          const muted = dim(stateKey(s.id)) && !readSection
          return (
            <Choice
              key={s.id}
              name={stateName}
              value={s.id}
              className="absolute block"
              style={{ left: KEY_X, top: TOP + i * KEY_PITCH, width: KEY_W }}
              {...bind(stateKey(s.id))}
            >
              <span
                className={cn(labelText, "flex items-center gap-3 transition-colors", muted && "text-muted-foreground")}
              >
                <Mark state={s.id} className="size-4 shrink-0" />
                {s.name}
              </span>
              <span
                className={cn(
                  "mt-2 block -indent-1 font-heading text-[80px] leading-20 font-medium tracking-[-0.03em] transition-colors",
                  muted && "text-muted-foreground"
                )}
              >
                <CountUp value={TOTALS[s.id]} delay={AT} duration={RUN} />
              </span>
              <span className={cn(note, "mt-2 block text-muted-foreground")}>{s.note}</span>
            </Choice>
          )
        })}
      </Choices>
    </Frame>
  )
}
