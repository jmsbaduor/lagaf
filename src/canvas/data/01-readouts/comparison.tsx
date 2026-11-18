import { band, delay, Frame, Header, note, row, Rule, TOP, useReading } from "@/canvas/kit"
import { cn } from "@/lib/utils"

const COLUMNS = ["Dimension", "Static docs", "Knowledge infrastructure"]

const ROWS = [
  ["Who reads it", "People", "People and agents"],
  ["How it updates", "By hand, when someone remembers", "Continuously, from your code and tools"],
  ["Formats", "HTML pages", "HTML, Markdown, llms.txt and MCP"],
  ["Source of truth", "Spread across tools", "One layer every tool reads from"],
  ["Agent setup", "Guesswork", "One setup.md page"],
]

// The entrance reads the table in order: the header rule draws, then each row's rule draws as its row fades in,
// in shrinking steps down the table. Column heads are labels, so they don't move.
const RULE = 600
const AT = [160, 220, 270, 310, 340]

// Rows of 108 (28px text, 40 above and below) under a 40px head, so the table runs from TOP to 812.
const cell = cn(note, "py-10 text-left align-top font-normal")

export default function Comparison() {
  const { active, bind } = useReading<number>()
  const on = active === null ? null : ROWS[active]

  return (
    <Frame>
      <Header
        title="Static docs vs knowledge infrastructure"
        description="The same five questions, answered the old way and the new way."
        hint={on ? `${on[0]}: ${on[2]}` : "Hover or focus a row"}
        on={!!on}
      />

      <table className="absolute left-[72px] w-[1296px] table-fixed border-collapse" style={{ top: TOP }}>
        <thead>
          <tr className="relative">
            {COLUMNS.map((c, i) => (
              <th
                key={c}
                scope="col"
                className="pb-4 text-left font-mono text-[20px] leading-6 font-medium text-viz-lead uppercase"
              >
                {c}
                {i === 0 && <Rule at={100} duration={RULE} className="bg-foreground" />}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {ROWS.map(([dimension, before, after], i) => (
            <tr
              key={dimension}
              tabIndex={0}
              className={cn(row, "viz-fade")}
              style={delay(AT[i])}
              {...bind(i)}
            >
              <th scope="row" className={cell}>
                <span aria-hidden="true" className={band} />
                <Rule at={AT[i]} duration={RULE} />
                {dimension}
              </th>
              {/* Muted, and the ink on the read row's band (muted on the band is under 4.5:1 in dark), as in the numbers. */}
              <td className={cn(cell, "text-muted-foreground transition-colors group-data-active:text-foreground")}>
                {before}
              </td>
              <td className={cell}>
                <span className="flex gap-4">
                  <span aria-hidden="true" className="mt-2 size-3 shrink-0 bg-viz-lead" />
                  {after}
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </Frame>
  )
}
