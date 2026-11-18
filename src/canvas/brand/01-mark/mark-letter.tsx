import { Frame, Header } from "@/canvas/kit"
import type { Values } from "@/components/stage"

import { knobs, MarkLetter, Sheet } from "./parts"

export { knobs }

export default function MarkLetterFrame({ mark = "Static" }: Partial<Values<typeof knobs>>) {
  return (
    <Frame>
      <Header
        title="A lowercase l"
        description="Five cells as a letter l and a full stop, with the stop in the accent."
        hint="Alternative"
      />
      <Sheet Mark={MarkLetter} name="lagaf mark: a lowercase l of four cells and a full stop" loading={mark === "Loading"} />
    </Frame>
  )
}
