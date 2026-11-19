// Each reader type's icon (Central Icons, outlined on a 24 grid), shared by the row's two rankings so a type reads
// the same in both. Drawn in chart px at 24 or 32, in the text's colour.
import { IconBubbleSparkle } from "central-icons/IconBubbleSparkle"
import { IconChecklist } from "central-icons/IconChecklist"
import { IconCode } from "central-icons/IconCode"
import { IconPeopleGroup2 } from "central-icons/IconPeopleGroup2"
import { IconRobot } from "central-icons/IconRobot"
import { IconSearchIntelligence } from "central-icons/IconSearchIntelligence"
import { IconSupport } from "central-icons/IconSupport"

import type { ReaderName } from "./data"

export const ICONS = {
  People: IconPeopleGroup2,
  "Coding agents": IconCode,
  "Chat assistants": IconBubbleSparkle,
  "AI search": IconSearchIntelligence,
  "Support bots": IconSupport,
  Evaluators: IconChecklist,
  "Other agents": IconRobot,
} satisfies Record<ReaderName, unknown>
