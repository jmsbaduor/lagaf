import { CountUp, delay, focusRing, Frame, Header, Key, TOP, useReading, XAxis, YAxis } from "@/canvas/kit"
import { cn } from "@/lib/utils"

import { BRIDGE, BRIDGE_PX, BRIDGE_TICKS, signed } from "./data"

// Eight columns of 152 from the 72px tick column and 8 to 1368, each a 112 bar with 20 either side, so every edge is
// a whole 4. Zero is at 764, 500 under 50M on TOP + 32, 10px a million.
const PLOT_X = 152
const PITCH = 152
const BAR_W = 112
const BASE = TOP + 32 + Math.max(...BRIDGE_TICKS) * BRIDGE_PX
const barX = (i: number) => PLOT_X + 20 + i * PITCH

// Totals are the neutral mark, agents' months the lead, people the compared series as everywhere else.
const COLOR = { total: "var(--viz-label)", agents: "var(--viz-lead)", people: "var(--viz-contrast)" }

// The entrance is the walk from December to May: each bar grows out of the running total the bar before it left,
// rises up and the fall down, left to right in one wave, while its number counts. The connector to it draws as it
// starts. Axes, ticks and the key are there from the start.
const GROW = 500
const AT = [100, 180, 250, 310, 360, 400, 430, 450]

export default function Bridge() {
  const { active, bind, dim } = useReading<number>()
  const on = active === null ? null : BRIDGE[active]

  return (
    <Frame>
      <Header
        title="Agents added all the growth"
        description="How monthly page views went from 21.7M in December to 48.0M in May."
        hint={on ? `${on.name}: ${signed(on.value, on.kind)}` : "Hover or focus a step"}
        on={!!on}
      />

      <YAxis
        name="Monthly page views"
        ticks={BRIDGE_TICKS.map((v) => ({ at: BASE - v * BRIDGE_PX, label: v ? `${v}M` : "0" }))}
        from={PLOT_X}
        to={1368}
      />
      {/* The key follows the axis name on its line, clear of the tall bars on the right; 72 and 80 hold each swatch
          and name. */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute left-[280px] grid grid-cols-[72px_80px_80px] gap-8"
        style={{ top: TOP }}
      >
        <Key color={COLOR.total}>Total</Key>
        <Key color={COLOR.agents}>Agents</Key>
        <Key color={COLOR.people}>People</Key>
      </div>

      {/* Hairlines carry each running total across the gap to the next bar. */}
      {BRIDGE.slice(0, -1).map((b, i) => (
        <span
          key={b.name}
          aria-hidden="true"
          className="viz-grow-x absolute h-px w-10 bg-viz-label"
          style={{ left: barX(i) + BAR_W, top: BASE - b.toPx, ...delay(AT[i + 1], 200) }}
        />
      ))}

      <ul aria-label="Monthly page views, December to May">
        {BRIDGE.map((b, i) => {
          const fall = b.toPx < b.fromPx
          const hi = Math.max(b.fromPx, b.toPx)
          const lo = Math.min(b.fromPx, b.toPx)
          // The item runs from its value (or the fall's top) to the baseline.
          const top = fall ? BASE - hi : BASE - hi - 40
          return (
            <li
              key={b.name}
              tabIndex={0}
              aria-label={`${b.name}: ${signed(b.value, b.kind)}`}
              // The column, value to baseline, is the item; its hit area runs 20px into each gap, so moving along
              // the bars never drops a reading.
              className={cn("absolute before:absolute before:-inset-x-5 before:inset-y-0", focusRing)}
              style={{ left: barX(i), top, width: BAR_W, height: BASE - top }}
              {...bind(i)}
            >
              {/* A rise grows up from the running total before it and the fall grows down from it. A bar that isn't
                  read fades over the paper, so the gridlines don't show through it. */}
              <div
                aria-hidden="true"
                className="viz-grow-y absolute inset-x-0 bg-background"
                style={{
                  top: BASE - hi - top,
                  height: hi - lo,
                  ...delay(AT[i], GROW),
                  transformOrigin: fall ? "center top" : undefined,
                }}
              >
                <div
                  className={cn("size-full transition-opacity", dim(i) && "opacity-30")}
                  style={{ backgroundColor: COLOR[b.kind] }}
                />
              </div>
              {/* The value, 8 above the bar or under the fall, on the paper so a gridline never runs through it. */}
              <p
                aria-hidden="true"
                className={cn(
                  "viz-fade absolute inset-x-0 bg-background text-center font-heading text-[28px] leading-8 font-medium tracking-[-0.02em] transition-colors",
                  dim(i) && "text-muted-foreground"
                )}
                style={{ top: fall ? hi - lo + 8 : 0, ...delay(AT[i] + 100) }}
              >
                <CountUp
                  value={Math.abs(b.value)}
                  delay={AT[i]}
                  duration={GROW}
                  format={(n) => signed(n, b.kind, b.value < 0)}
                />
              </p>
            </li>
          )
        })}
      </ul>

      <XAxis
        y={BASE}
        band={PITCH}
        ticks={BRIDGE.map((b, i) => ({ at: PLOT_X + i * PITCH, label: b.tick, on: active === i }))}
      />
    </Frame>
  )
}
