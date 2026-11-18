import { useState } from "react"
import { scaleLinear } from "d3-scale"
import { format } from "d3-format"

export type Datum = { label: string; value: number }

const share = format(".0%")

// Horizontal bars as HTML, so radius, colour and type all come from theme tokens.
export function BarBreakdown({ data, unit }: { data: Datum[]; unit: string }) {
  const [active, setActive] = useState<number | null>(null)
  const total = data.reduce((sum, d) => sum + d.value, 0)
  const width = scaleLinear()
    .domain([0, Math.max(...data.map((d) => d.value))])
    .range([0, 100])
  const focused = active === null ? null : data[active]

  return (
    <div className="flex flex-col gap-5">
      <p aria-live="polite" className="min-h-5 text-sm text-muted-foreground">
        {focused ? (
          <>
            <span className="font-medium text-foreground">{focused.label}</span>
            {`: ${focused.value} ${unit}, ${share(focused.value / total)} of the day's total`}
          </>
        ) : (
          `${total} ${unit} in total. Point at or tap a bar to see its share.`
        )}
      </p>
      <ul className="flex flex-col gap-3" onMouseLeave={() => setActive(null)}>
        {data.map((d, i) => (
          <li key={d.label}>
            <button
              type="button"
              className="flex w-full flex-col gap-1.5 rounded-sm text-left outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
              aria-label={`${d.label}: ${d.value} ${unit}`}
              onMouseEnter={() => setActive(i)}
              onFocus={() => setActive(i)}
              onClick={() => setActive(i)}
            >
              <span className="flex items-baseline justify-between gap-4 text-sm">
                <span>{d.label}</span>
                <span className="font-data text-muted-foreground tabular-nums">
                  {d.value}
                </span>
              </span>
              <span className="block h-3 w-full rounded-sm bg-muted">
                <span
                  className="block h-full rounded-[inherit] transition-[width,background-color,opacity] duration-300 ease-out motion-reduce:transition-none"
                  style={{
                    width: `${width(d.value)}%`,
                    backgroundColor: `var(--chart-${(i % 5) + 1})`,
                    opacity: active === null || active === i ? 1 : 0.35,
                  }}
                />
              </span>
            </button>
          </li>
        ))}
      </ul>
    </div>
  )
}
