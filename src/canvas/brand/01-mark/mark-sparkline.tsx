import { Frame, Header } from "@/canvas/kit"
import type { Values } from "@/components/stage"

import { knobs, MarkSparkline, Sheet } from "./parts"

export { knobs }

export default function MarkSparklineFrame({ mark = "Static" }: Partial<Values<typeof knobs>>) {
  return (
    <Frame>
      <Header
        title="A line chart"
        description="Four cells as the points of a line, with the latest one in the accent."
        hint="Alternative"
      />
      <Sheet Mark={MarkSparkline} name="lagaf mark: four cells as the points of a line, the last one lit" loading={mark === "Loading"} />
    </Frame>
  )
}
