import type { ComponentProps, CSSProperties, ReactNode } from "react"

import { cn } from "@/lib/utils"
import "./pixels.css"

/** The kit's Label look for text inside a control (Label itself is a <p>). */
export const labelText = "font-mono text-[14px] leading-4 font-medium uppercase"

/** Sets the colour a `.px-cell` paints. */
export const px = (color: string) => ({ "--px": color }) as CSSProperties

/** A group of choices: a fieldset with a legend for screen readers. */
export function Choices({ legend, className, children }: { legend: string; className?: string; children: ReactNode }) {
  return (
    <fieldset className={className}>
      <legend className="sr-only">{legend}</legend>
      {children}
    </fieldset>
  )
}

/**
 * One choice, a native radio: Tab enters and leaves the group, arrow keys move through it, click or tap focuses
 * one. Spread the kit's `bind` on it to read what is hovered or focused. Pass `checked` and `onPick` only where a
 * pick outlasts the reading (the dot matrix keeps its share).
 */
export function Choice({
  name,
  value,
  checked,
  onPick,
  className,
  children,
  ...props
}: Omit<ComponentProps<"label">, "onChange"> & {
  name: string
  value: string
  checked?: boolean
  onPick?: (value: string) => void
}) {
  return (
    <label
      className={cn("relative cursor-pointer outline-offset-4 outline-ring has-[:focus-visible]:outline-2", className)}
      {...props}
    >
      <input
        type="radio"
        name={name}
        value={value}
        checked={checked}
        onChange={() => onPick?.(value)}
        className="sr-only"
      />
      {children}
    </label>
  )
}
