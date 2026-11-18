import { Frame, Header } from "@/canvas/kit"
import type { Values } from "@/components/stage"

import { knobs, MarkField, Sheet } from "./parts"

export { knobs }

export default function MarkFieldFrame({ mark = "Static" }: Partial<Values<typeof knobs>>) {
  return (
    <Frame>
      <Header
        title="A pixel field"
        description="Five cells as a pixel field, in the accent’s tones from pale to deep."
        hint="Alternative"
      />
      <Sheet Mark={MarkField} name="lagaf mark: five cells, pale at the left, deep at the right" loading={mark === "Loading"} />
    </Frame>
  )
}
