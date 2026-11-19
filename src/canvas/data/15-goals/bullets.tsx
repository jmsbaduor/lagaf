import { band, CountUp, Fill, Frame, Header, Key, Label, row, tickText, TOP, useReading } from "@/canvas/kit"
import { cn } from "@/lib/utils"

import "./bullets.css"
import { BULLETS, BULLETS_BANDS, BULLETS_TITLE, BULLETS_TRACK } from "./data"

// Across: the name and value in a 352 column, 48, then the 896 track from 472 to the content box's edge. The key sits
// on TOP over the tracks. Four rows of 116 on a 144 pitch from 280, so the last ends on 828. In a row: the name on
// its top line, the 72/72 value 24 under it; the 56 track centred on the value (32 to 88), the bar 16 tall in its
// middle, the 8 wide goal tick 8 past the track at each end and named over it, and the scale's ticks 12 under.
const TRACK_X = 472 - 72
const KEY_W = 896
const ROW0 = 280
const PITCH = 144
const ROW_H = 116
const TRACK_TOP = 32
const TRACK_H = 56
const BAR_H = 16
const GOAL_LABEL_W = 128

const BAND_COLOR = ["var(--bullets-behind)", "var(--bullets-on-track)", "var(--bullets-ahead)"]

// The entrance is the bars: each grows from its track's left end while its value counts, top to bottom in shrinking
// steps. Answer time counts down from its scale's 2.0s as its bar grows. Bands, goals and ticks are read, so they're
// there from the start.
const GROW = 600
const AT = [100, 160, 200, 230]

export default function Bullets() {
  const { active, bind, dim } = useReading<number>()
  const on = active === null ? null : BULLETS[active]

  return (
    <Frame className="bullets">
      <Header
        title={BULLETS_TITLE}
        description="Q2’s four headline numbers in May, each against its quarterly goal."
        hint={on ? on.reading : "Hover or focus a row"}
        on={!!on}
      />

      <div aria-hidden="true" className="absolute flex gap-8" style={{ top: TOP, left: 72 + TRACK_X, width: KEY_W }}>
        {/* Each entry in a 128 column, so its edges land on the grid whatever its name's width. */}
        {BULLETS_BANDS.map((name, i) => (
          <div key={name} className="w-32">
            <Key color={BAND_COLOR[i]}>{name}</Key>
          </div>
        ))}
      </div>

      <ul aria-label="Q2 goals">
        {BULLETS.map((b, i) => {
          const edges = [0, ...b.edgePx, BULLETS_TRACK]
          return (
            <li
              key={b.tag}
              tabIndex={0}
              aria-label={`${b.reading}, ${b.met ? "met" : "not met"}, ${BULLETS_BANDS[b.band].toLowerCase()}`}
              className={cn(row, "absolute left-[72px] w-[1296px]")}
              style={{ top: ROW0 + i * PITCH, height: ROW_H }}
              {...bind(i)}
            >
              <span aria-hidden="true" className={band} />
              <div aria-hidden="true" className={cn("transition-colors", dim(i) && "text-muted-foreground")}>
                <Label className={cn("transition-colors", dim(i) && "text-muted-foreground")}>
                  {b.lower ? `${b.tag}, lower is better` : b.tag}
                </Label>
                {/* Pulled 4px left by its indent (the digits' side bearing), so the ink starts on the column's edge. */}
                <p className="mt-2 -indent-1 font-data text-[72px] leading-[72px] font-medium tracking-[-0.04em]">
                  {b.lower ? (
                    <CountUp
                      value={b.scale[0] - b.value}
                      delay={AT[i]}
                      duration={GROW}
                      format={(n) => b.format(b.scale[0] - n)}
                    />
                  ) : (
                    <CountUp value={b.value} delay={AT[i]} duration={GROW} format={b.format} />
                  )}
                </p>
              </div>

              <div aria-hidden="true" className="absolute inset-y-0" style={{ left: TRACK_X, width: BULLETS_TRACK }}>
                <Label
                  className={cn(
                    "absolute top-0 text-center transition-colors",
                    active === i && "text-foreground",
                    dim(i) && "text-muted-foreground"
                  )}
                  style={{ left: b.goalPx - GOAL_LABEL_W / 2, width: GOAL_LABEL_W }}
                >
                  Goal <span className="normal-case">{b.goalLabel}</span>
                </Label>

                {/* A row that isn't read fades its bands, bar and goal to 30%. */}
                <div
                  className={cn("absolute inset-x-0 transition-opacity", dim(i) && "opacity-30")}
                  style={{ top: TRACK_TOP, height: TRACK_H }}
                >
                  {BULLETS_BANDS.map((name, j) => (
                    <span
                      key={name}
                      className="absolute inset-y-0"
                      style={{ left: edges[j], width: edges[j + 1] - edges[j], backgroundColor: BAND_COLOR[j] }}
                    />
                  ))}
                  <div className="absolute left-0" style={{ top: (TRACK_H - BAR_H) / 2, height: BAR_H, width: b.barPx }}>
                    <Fill size={b.barPx} at={AT[i]} duration={GROW} className="bg-viz-lead" />
                  </div>
                  <span className="absolute -inset-y-2 w-2 bg-foreground" style={{ left: b.goalPx - 4 }} />
                </div>

                {/* The scale: its ends at the track's ends, each band edge centred on its edge. */}
                {b.ticks.map((t, j) => (
                  <p
                    key={j}
                    className={cn(
                      tickText,
                      "absolute transition-colors",
                      active === i && "text-foreground",
                      j === 0 ? "left-0" : j === 3 ? "right-0" : "w-12 text-center"
                    )}
                    style={{ top: TRACK_TOP + TRACK_H + 12, left: j === 1 || j === 2 ? b.edgePx[j - 1] - 24 : undefined }}
                  >
                    {t}
                  </p>
                ))}
              </div>
            </li>
          )
        })}
      </ul>
    </Frame>
  )
}
