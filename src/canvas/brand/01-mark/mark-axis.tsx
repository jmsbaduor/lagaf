import { Frame, Header } from "@/canvas/kit"
import type { Values } from "@/components/stage"

import { knobs, MarkAxis, Sheet } from "./parts"

export { knobs }

export default function MarkAxisFrame({ mark = "Static" }: Partial<Values<typeof knobs>>) {
  return (
    <Frame>
      <Header
        title="A plotted point"
        description="Four cells as a point over its axis, with the point lit in the accent."
        hint="Alternative"
      />
      <Sheet Mark={MarkAxis} name="lagaf mark: one lit cell above a baseline of three cells" loading={mark === "Loading"} />
    </Frame>
  )
}
