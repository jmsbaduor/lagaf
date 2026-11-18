import type { ComponentType } from 'react'
import { IconArrowRotateCounterClockwise } from 'central-icons/IconArrowRotateCounterClockwise'
import { IconArrowUpRight } from 'central-icons/IconArrowUpRight'
import { IconChart1 } from 'central-icons/IconChart1'
import { IconChevronDownSmall } from 'central-icons/IconChevronDownSmall'
import { IconChevronLeft } from 'central-icons/IconChevronLeft'
import { IconChevronRight } from 'central-icons/IconChevronRight'
import { IconClock } from 'central-icons/IconClock'
import { IconGithub } from 'central-icons/IconGithub'
import { IconGrid } from 'central-icons/IconGrid'
import { IconLayoutAllSides } from 'central-icons/IconLayoutAllSides'
import { IconMoon } from 'central-icons/IconMoon'
import { IconSettingsGear1 } from 'central-icons/IconSettingsGear1'
import { IconSettingsSliderHor } from 'central-icons/IconSettingsSliderHor'
import { IconSquarePlaceholder } from 'central-icons/IconSquarePlaceholder'
import { IconSun } from 'central-icons/IconSun'

// UI icons are Central Icons (round, outlined, 2px radius, 1.5 stroke on a 24 grid), named by what they mean here,
// as in frantic. Add a name here before using it. Inside a chart, icons are drawn in chart px and zoom with it.
const CENTRAL = {
  replay: IconArrowRotateCounterClockwise,
  sliders: IconSettingsSliderHor,
  cog: IconSettingsGear1,
  frame: IconSquarePlaceholder,
  grid: IconGrid,
  boxes: IconLayoutAllSides,
  sun: IconSun,
  moon: IconMoon,
  chart: IconChart1,
  'chevron-down': IconChevronDownSmall,
  'chevron-left': IconChevronLeft,
  'chevron-right': IconChevronRight,
  'arrow-up-right': IconArrowUpRight,
  clock: IconClock,
  github: IconGithub,
} satisfies Record<string, ComponentType<{ size?: number; className?: string }>>

export type IconName = keyof typeof CENTRAL

export function Icon({ name, size = 18, className }: { name: IconName; size?: number; className?: string }) {
  const Central = CENTRAL[name]
  return <Central size={size} className={`shrink-0 ${className ?? ''}`} />
}
