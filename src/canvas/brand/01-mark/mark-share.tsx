import { Frame, Header } from "@/canvas/kit"
import type { Values } from "@/components/stage"

import { knobs, MarkShare, Sheet } from "./parts"

export { knobs }

export default function MarkShareFrame({ mark = "Static" }: Partial<Values<typeof knobs>>) {
  return (
    <Frame>
      <Header
        title="A waffle chart"
        description="Four cells as a waffle chart, with three of them filled in the accent."
        hint="Alternative"
      />
      <Sheet Mark={MarkShare} name="lagaf mark: a square of four cells, three filled" loading={mark === "Loading"} />
    </Frame>
  )
}
