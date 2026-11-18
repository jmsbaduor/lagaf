import { Frame, Header } from "@/canvas/kit"
import type { Values } from "@/components/stage"

import { knobs, MarkPair, Sheet } from "./parts"

export { knobs }

export default function MarkPairFrame({ mark = "Static" }: Partial<Values<typeof knobs>>) {
  return (
    <Frame>
      <Header
        title="A diagonal pair"
        description="Two cells as a diagonal pair, with one in ink and one in the accent."
        hint="Chosen" on
      />
      <Sheet Mark={MarkPair} name="lagaf mark: two cells on a diagonal, one ink, one accent" loading={mark === "Loading"} />
    </Frame>
  )
}
