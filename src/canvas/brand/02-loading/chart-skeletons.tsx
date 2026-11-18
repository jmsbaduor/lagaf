import type { CSSProperties, ReactNode } from "react"

import { MARKDOWN_SHARE, TRAFFIC, WAFFLE } from "@/canvas/data/facts"
import { delay, Frame, Header, Label, TOP } from "@/canvas/kit"
import type { Knobs, Values } from "@/components/stage"
import { cn } from "@/lib/utils"

import { Bars, labelText, monoWidth, Slot, Status, useHandover } from "./parts"

export const knobs = {
  state: {
    type: "choice",
    label: "State",
    value: "Loaded",
    options: ["Loading", "Loaded"],
  },
} as const satisfies Knobs

// Four tiles, 624 wide and 48 apart both ways. Each is a label, 16, then 232 of chart: the waffle's 10 cells of
// 16 with gaps of 8, so every family is drawn to that height.
const CHART_H = "h-[232px]"

export default function ChartSkeletons({ state = "Loaded" }: Partial<Values<typeof knobs>>) {
  const loaded = useHandover(state === "Loaded")

  return (
    <Frame>
      <Header
        title="While the data loads"
        description="Each chart waits in its own structure, so nothing jumps when data lands."
        hint={<Status busy={!loaded}>{loaded ? "Loaded" : "Loading"}</Status>}
        on={!loaded}
      />

      <div className="absolute left-[72px] grid w-[1296px] grid-cols-2 gap-12" style={{ top: TOP }}>
        <Tile name="Bars" loaded={loaded}>
          {/* Three 192 columns, 24 apart. */}
          <Bars mode={loaded ? "data" : "wait"} className={cn(CHART_H, "gap-x-6")} />
        </Tile>
        <Tile name="Cells" loaded={loaded}>
          <Waffle loaded={loaded} />
        </Tile>
        <Tile name="Readout" loaded={loaded}>
          <Readout loaded={loaded} />
        </Tile>
        <Tile name="Table" loaded={loaded}>
          <Table loaded={loaded} />
        </Tile>
      </div>
    </Frame>
  )
}

function Tile({ name, loaded, children }: { name: string; loaded: boolean; children: ReactNode }) {
  return (
    <div role="group" aria-label={`${name} chart`} aria-busy={!loaded} className="flex flex-col gap-4">
      <Label>{name}</Label>
      {children}
    </div>
  )
}

// Cells: the waffle's 10 by 10 grid. Waiting, every cell is an empty track; on load the lead cells fill in reading
// order, as the waffle does.
const CAPTION = `${MARKDOWN_SHARE}% of agent traffic goes straight to Markdown or llms.txt.`
const KEY = [
  { label: "Markdown or llms.txt", share: MARKDOWN_SHARE, on: true },
  { label: "Rendered HTML", share: 100 - MARKDOWN_SHARE, on: false },
]

function Waffle({ loaded }: { loaded: boolean }) {
  return (
    <div className={cn("flex gap-12", CHART_H)}>
      <div
        role={loaded ? "img" : undefined}
        aria-label={
          loaded
            ? `Waffle of 100 cells: ${KEY[0].share} are Markdown or llms.txt, ${KEY[1].share} are rendered HTML.`
            : undefined
        }
        aria-hidden={loaded ? undefined : true}
        className="grid shrink-0 grid-cols-[repeat(10,16px)] content-start gap-2"
      >
        {WAFFLE.map((on, i) => (
          <span
            key={i}
            className={cn("ld-slot size-4", !loaded && "ld-wait", loaded && on && "ld-fill bg-viz-lead")}
            style={
              {
                "--wave": `${(i % 10) * 80}ms`,
                ...(loaded && on ? delay(i * 5) : {}),
              } as CSSProperties
            }
          />
        ))}
      </div>

      <div className="flex min-w-0 flex-1 flex-col justify-between">
        {/* Two lines of 24: a slot of 16 per line, 8 apart. */}
        <div className="relative">
          <div className="flex flex-col gap-2">
            {[296, 176].map((w, i) => (
              <Slot key={w} w={w} wave={i * 160} wait={!loaded} gone={loaded} />
            ))}
          </div>
          {loaded && <p className="viz-fade absolute inset-x-0 top-0 text-[18px] leading-6 text-pretty">{CAPTION}</p>}
        </div>
        <ul className="flex flex-col gap-4">
          {KEY.map((k, i) => (
            <li key={k.label} className="relative flex h-4 items-center gap-4">
              <span
                aria-hidden="true"
                className={cn(
                  "ld-slot size-4 shrink-0",
                  !loaded && "ld-wait",
                  loaded && k.on && "ld-fill bg-viz-lead"
                )}
              />
              <Slot w={monoWidth(k.label)} wave={i * 160} wait={!loaded} gone={loaded} />
              <Slot w={24} wave={480} wait={!loaded} gone={loaded} className="ml-auto" />
              {loaded && (
                <span
                  className={cn(
                    labelText,
                    "viz-fade absolute inset-y-0 right-0 left-8 flex justify-between text-muted-foreground"
                  )}
                >
                  <span>{k.label}</span>
                  <span className="text-foreground">{k.share}%</span>
                </span>
              )}
            </li>
          ))}
        </ul>
      </div>
    </div>
  )
}

// Readout: a panel of two metrics. Waiting, the panel is bare paper with hatch rules and one slot per digit, each
// on the 48 px advance of 80 px Geist Mono, so the digits land exactly where their slots were.
const METRICS = [
  { label: "Share of traffic", value: TRAFFIC.agentShare.format(TRAFFIC.agentShare.value) },
  { label: "Median time to answer", value: TRAFFIC.answerTime.format(TRAFFIC.answerTime.value) },
]

function Readout({ loaded }: { loaded: boolean }) {
  return (
    <div
      className={cn(
        "relative isolate px-6 pt-2 transition-colors duration-300",
        CHART_H,
        loaded && "text-viz-panel-ink"
      )}
    >
      <span
        aria-hidden="true"
        className={cn("absolute inset-0 -z-10 bg-viz-panel transition-opacity duration-300", !loaded && "opacity-0")}
      />
      <span aria-hidden="true" className="absolute inset-0 -z-10 ring-1 ring-viz-hatch ring-inset" />
      <dl>
        {METRICS.map((m, i) => (
          // Rows of 112: the number sits 16 down, the label on its middle, the rule an inset shadow at the foot.
          <div
            key={m.label}
            className={cn(
              "flex h-28 items-start justify-between pt-4 transition-shadow duration-300",
              loaded ? "shadow-[inset_0_-1px_0_var(--viz-panel-ink)]" : "shadow-[inset_0_-1px_0_var(--viz-hatch)]"
            )}
          >
            <dt className="relative mt-8">
              <Slot w={monoWidth(m.label)} wave={i * 160} wait={!loaded} gone={loaded} />
              {loaded && (
                <span className={cn(labelText, "viz-fade absolute inset-0 whitespace-nowrap")}>{m.label}</span>
              )}
            </dt>
            <dd className="relative h-20">
              <span className="flex h-full items-center gap-2 px-1">
                {[...m.value].map((_, j) => (
                  <Slot key={j} w={40} h={56} wave={320 + j * 80} wait={!loaded} gone={loaded} />
                ))}
              </span>
              {loaded && (
                <span className="viz-fade absolute inset-0 font-mono text-[80px] leading-20 tracking-normal">
                  {m.value}
                </span>
              )}
            </dd>
          </div>
        ))}
      </dl>
    </div>
  )
}

// Table: the comparison's ruled rows. Waiting, the rules are drawn and each cell holds a slot as wide as its text.
// A head of 32 and five rows of 40 make the 232.
const COLUMNS = ["Dimension", "Static docs", "Knowledge infrastructure"]
const ROWS = [
  ["Who reads it", "People", "People and agents"],
  ["How it updates", "By hand", "From your code"],
  ["Formats", "HTML pages", "HTML, Markdown, MCP"],
  ["Source of truth", "Spread across tools", "One shared layer"],
  ["Agent setup", "Guesswork", "One page"],
]
const textWidth = (text: string) => Math.max(24, Math.round((text.length * 8.6) / 8) * 8)

function Table({ loaded }: { loaded: boolean }) {
  return (
    <table className="w-full table-fixed border-collapse">
      <colgroup>
        <col className="w-[200px]" />
        <col className="w-[200px]" />
        <col />
      </colgroup>
      <thead>
        <tr>
          {COLUMNS.map((c, i) => (
            <th
              key={c}
              scope="col"
              className={cn(
                "relative h-8 text-left align-top font-normal transition-shadow duration-300",
                // Rules are inset shadows: they take no height, so every row stays on the grid.
                loaded ? "shadow-[inset_0_-1px_0_var(--viz-ink)]" : "shadow-[inset_0_-1px_0_var(--viz-hatch)]"
              )}
            >
              <Slot w={monoWidth(c)} wave={i * 240} wait={!loaded} gone={loaded} />
              {loaded && (
                <span className={cn(labelText, "viz-fade absolute inset-x-0 top-0 text-viz-lead")}>{c}</span>
              )}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {ROWS.map((row, r) => (
          <tr key={row[0]}>
            {row.map((text, c) => {
              const Cell = c === 0 ? "th" : "td"
              return (
                <Cell
                  key={c}
                  scope={c === 0 ? "row" : undefined}
                  className="relative h-10 text-left align-middle font-normal shadow-[inset_0_-1px_0_var(--viz-hatch)]"
                >
                  <Slot w={textWidth(text)} wave={c * 240 + r * 40} wait={!loaded} gone={loaded} />
                  {loaded && (
                    <span
                      className={cn(
                        "viz-fade absolute inset-x-0 top-2 text-[16px] leading-6 tracking-[-0.01em]",
                        c === 1 && "text-muted-foreground"
                      )}
                    >
                      {text}
                    </span>
                  )}
                </Cell>
              )
            })}
          </tr>
        ))}
      </tbody>
    </table>
  )
}
