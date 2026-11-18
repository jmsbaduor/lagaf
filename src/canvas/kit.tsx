// What every chart is built from, in five parts: the frame and header, readings, type, motion, and marks.
// Colours are the chart roles in src/styles/global.css (section 6); docs/charts.md has the rules behind each part.
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type ComponentProps,
  type CSSProperties,
  type PointerEvent,
  type ReactNode,
} from "react"

import { useStage } from "@/components/stage"
import { cn } from "@/lib/utils"
import "./kit.css"

// ── Frame and header ────────────────────────────────────────────────────────────────────────────────────────────

/** The safe area every chart is drawn in, in chart px. The stage zooms it to the screen and lets the paper run on. */
export const FRAME_W = 1440
export const FRAME_H = 900

/** True once the chart's entrance should show its end state (first click or key, or reduced motion). */
const Finished = createContext(false)
export const useFinished = () => useContext(Finished)

/** Reduced motion from the OS or the stage's switch. */
export const useReducedMotion = () => useStage().reducedMotion

/**
 * One chart, one idea, drawn on the 1440 by 900 safe area. The root is a <section>; it doesn't clip, so rules
 * and fields can run past the safe area to the screen's edge (the stage clips).
 * A first click or key finishes only this chart's own animations.
 */
export function Frame({ className, children, ...props }: ComponentProps<"section">) {
  const ref = useRef<HTMLElement>(null)
  const { reducedMotion } = useStage()
  const [finished, setFinished] = useState(false)

  const finish = useCallback(() => {
    setFinished(true)
    for (const a of ref.current?.getAnimations({ subtree: true }) ?? []) {
      // Looping animations have no end to jump to.
      if (a.effect?.getComputedTiming().endTime !== Infinity) a.finish()
    }
  }, [])

  // Any key finishes the entrance, wherever focus is (the stage's own keys too).
  useEffect(() => {
    if (finished) return
    window.addEventListener("keydown", finish)
    return () => window.removeEventListener("keydown", finish)
  }, [finished, finish])

  return (
    <Finished.Provider value={finished || reducedMotion}>
      <section
        ref={ref}
        data-frame=""
        data-finished={finished || undefined}
        onPointerDownCapture={finished ? undefined : finish}
        className={cn("relative isolate h-[900px] w-[1440px] p-[72px] font-sans text-foreground", className)}
        {...props}
      >
        {children}
      </section>
    </Finished.Provider>
  )
}

/** The chart's title (the page's sr-only h1 names the chart). Only Header sets it. */
function Heading({ className, ...props }: ComponentProps<"h2">) {
  return (
    <h2
      className={cn("font-heading text-[48px] leading-[52px] font-normal tracking-[-0.03em] text-balance", className)}
      {...props}
    />
  )
}

/** The chart's one-sentence description. Only Header sets it. */
function Lede({ className, ...props }: ComponentProps<"p">) {
  return <p className={cn("text-[24px] leading-[32px] text-pretty text-muted-foreground", className)} {...props} />
}

/** Where every chart's data starts: the header (72 + 96) plus 64. */
export const TOP = 232

/**
 * Every chart's title and description, at the content box's top left (72, 72): 48/52 over 24/32, 12px apart,
 * 96px tall, so the data starts on the shared top line (TOP). It doesn't move on entrance.
 * `hint` sits top right on the title's line: an instruction ("Hover or focus a row") or, while something is
 * read (`on`), what is being read, as "Label: value". It's a polite live region. The title keeps its own width,
 * so a long reading wraps the hint, never the title.
 */
export function Header({
  title,
  description,
  hint,
  on = false,
}: {
  title: string
  description: string
  hint?: ReactNode
  on?: boolean
}) {
  return (
    <header className="grid grid-cols-[minmax(0,max-content)_1fr] gap-x-6 gap-y-3">
      <Heading>{title}</Heading>
      {hint && (
        <Label aria-live="polite" className={cn("self-center text-right leading-5 transition-colors", on && "text-foreground")}>
          {hint}
        </Label>
      )}
      <Lede className="col-span-full">{description}</Lede>
    </header>
  )
}

// ── Readings ────────────────────────────────────────────────────────────────────────────────────────────────────

/**
 * What a chart is reading: the hovered item (mouse or pen), else the focused one. Touch goes through focus, since a
 * tap also leaves. Spread `bind(key)` on each item (it marks the read one `data-active`) and show `active` in the
 * Header's hint; when nothing is read, the hint returns to its instruction. `dim(key)` is true for every item but
 * the read one, while one is: fade its marks and mute its words, so they still read.
 */
export function useReading<K>() {
  const [hover, setHover] = useState<K | null>(null)
  const [focus, setFocus] = useState<K | null>(null)
  const active = hover ?? focus
  const bind = (key: K) => ({
    "data-active": active === key || undefined,
    onPointerEnter: (e: PointerEvent) => e.pointerType !== "touch" && setHover(key),
    onPointerLeave: (e: PointerEvent) => e.pointerType !== "touch" && setHover(null),
    onFocus: () => setFocus(key),
    onBlur: () => setFocus(null),
  })
  const dim = (key: K) => active !== null && active !== key
  return { active, bind, dim }
}

/** Visible focus for chart items that take focus (tabIndex={0}) and have no band. */
export const focusRing =
  "outline-none focus-visible:outline-2 focus-visible:outline-offset-8 focus-visible:outline-ring"

/** A row that can be read (focusable, marked `data-active` while read): the band below positions against it. */
export const row = "group relative isolate outline-none"

/**
 * The row's hover and focus band: a pale panel tint bleeding 16px past the text,
 * carrying the keyboard focus ring too. Place it as an empty span inside the row.
 */
export const band = cn(
  "pointer-events-none absolute -inset-x-4 inset-y-0 -z-10 bg-viz-panel/40 opacity-0",
  "transition-opacity group-data-active:opacity-100",
  "outline-ring group-focus-visible:outline-2 group-focus-visible:-outline-offset-2"
)

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
 * one. Spread `bind` on it to read what is hovered or focused. Pass `checked` and `onPick` only where a pick
 * outlasts the reading (the dot matrix keeps its share).
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

// ── Type ────────────────────────────────────────────────────────────────────────────────────────────────────────

/** Label's face, for text inside other elements (Label itself is a <p>): Geist Mono 14/16, uppercase. */
export const labelText = "font-mono text-[14px] leading-4 font-medium uppercase"

/** The small label: a bar's name, a stage's date, a share beside a bar. */
export const smallLabelText = "font-mono text-[12px] leading-4 font-medium uppercase"

/** A note under or beside a number, a table cell, a caption: 22/28. Readout notes add font-medium. */
export const note = "text-[22px] leading-7 tracking-[-0.01em]"

/** A panel's number: Geist Mono 102/104, set right so it ends on the panel's rule. */
export const panelNumber = "text-right font-mono text-[102px] leading-[104px] tracking-[-0.02em]"

/**
 * Geist Mono draws "s" and "M" inside their cells, so a right-aligned reading ending in one stops short of the
 * rule's end. This moves it out by the gap, so every reading's ink ends where a "%" and the stamps do.
 */
const INK_END: Record<string, string> = { s: "relative left-[0.07em]", M: "relative left-[0.04em]" }
export const inkEnd = (reading: string) => INK_END[reading.at(-1) ?? ""]

/** Mono uppercase label, Lumina's instrument voice. */
export function Label({ className, ...props }: ComponentProps<"p">) {
  return <p className={cn(labelText, "text-viz-label", className)} {...props} />
}

/**
 * A label on a fill (a panel's tag). Its width is the text's, rounded up to the 4px grid (mono, so the text is
 * `length` ch), so the fill's edges land on whole pixels; the text is centred in what the rounding adds.
 */
export function Tag({ className, children }: { className?: string; children: string }) {
  return (
    <Label
      className={cn("py-1.5 text-center", className)}
      style={{ width: `round(up, calc(${children.length}ch + 24px), 4px)` }}
    >
      {children}
    </Label>
  )
}

// ── Motion ──────────────────────────────────────────────────────────────────────────────────────────────────────

/** Inline style for the kit's entrance classes (kit.css): when it starts and how long it takes, in ms. */
export const delay = (ms: number, dur?: number) =>
  ({ "--viz-delay": `${ms}ms`, ...(dur ? { "--viz-dur": `${dur}ms` } : {}) }) as CSSProperties

/** Inline style for a `viz-wipe`: `steps` columns revealed one at a time over `dur`. */
export const wipe = (ms: number, dur: number, steps: number) =>
  ({ ...delay(ms, dur), "--viz-steps": steps }) as CSSProperties

// The kit's curve, cubic-bezier(0.22, 1, 0.36, 1), is close to an ease-out quint, so a count lands with its mark.
const easeOut = (t: number) => 1 - (1 - t) ** 5

/** When a CountUp of `duration` ms passes `i` of `n`. Start cell i of a cascade then, and the cells fill with the count. */
export const countAt = (i: number, n: number, duration: number) => Math.round(duration * (1 - (1 - Math.min(i, n) / n) ** (1 / 5)))

/**
 * A number that counts up on entrance, at the stage's speed. Give it the delay and duration of the mark it
 * measures (a bar, a rule, a fill), so the two land together. A speed change mid-count carries on from where the
 * count is, as the marks do. Screen readers get the final value only.
 */
export function CountUp({
  value,
  format = (n) => String(Math.round(n)),
  duration = 700,
  delay = 0,
  className,
}: {
  value: number
  format?: (n: number) => string
  duration?: number
  delay?: number
  className?: string
}) {
  const done = useFinished()
  const { speed } = useStage()
  const [tweened, setN] = useState(0)
  const n = done ? value : tweened
  // Chart ms since the count started (negative during its delay). It outlives a speed change.
  const elapsed = useRef(-delay)

  useEffect(() => {
    if (done) return
    let raf = 0
    let last = performance.now()
    const tick = (now: number) => {
      elapsed.current += (now - last) * speed
      last = now
      const t = Math.min(1, Math.max(0, elapsed.current / duration))
      setN(value * easeOut(t))
      if (t < 1) raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [value, done, duration, speed])

  return (
    <span className={cn("tabular-nums", className)}>
      <span aria-hidden="true">{format(n)}</span>
      <span className="sr-only">{format(value)}</span>
    </span>
  )
}

// ── Marks ───────────────────────────────────────────────────────────────────────────────────────────────────────

/**
 * A hairline that draws from the left on entrance: a row's rule, or a panel's under its number. Absolute, at the
 * foot of its `relative` box (`top-0 bottom-auto` for a head rule); bg-border on the paper, `bg-current` on a panel.
 * Give it the delay and duration of the number it rules, so the two land together.
 */
export function Rule({ at, duration, className }: { at: number; duration: number; className?: string }) {
  return (
    <span
      aria-hidden="true"
      className={cn("viz-grow-x absolute inset-x-0 bottom-0 h-px bg-border", className)}
      style={delay(at, duration)}
    />
  )
}

/**
 * A bar's fill, growing from its baseline on entrance: from the left (`x`, `size` is its width) or the bottom
 * (`y`, its height). It sits in its track, a `relative` box in bg-viz-track or viz-hatch. Lengths are whole 4px.
 * For a length a knob changes, leave out `size`, pass `inset-0` and scale a child in 200ms (the token bar).
 */
export function Fill({
  axis = "x",
  size,
  at,
  duration,
  className,
  children,
}: {
  axis?: "x" | "y"
  size?: number
  at: number
  duration: number
  className?: string
  children?: ReactNode
}) {
  const x = axis === "x"
  return (
    <div
      className={cn("absolute", x ? "viz-grow-x inset-y-0 left-0" : "viz-grow-y inset-x-0 bottom-0", className)}
      style={{ [x ? "width" : "height"]: size, ...delay(at, duration) }}
    >
      {children}
    </div>
  )
}

/**
 * A pixel that fills: an empty cell (the track) with its colour fading in on top at `at`, or there from the start
 * without `at`. `dim` fades the colour toward the paper, so it still reads; a colour change is a 150ms transition,
 * `ripple` ms late. Size and shape go on `className` (`rounded-full` for a dot). `color` is a role: var(--viz-lead).
 */
export function Cell({
  color,
  at,
  duration,
  dim,
  ripple,
  className,
  style,
}: {
  color: string
  at?: number
  duration?: number
  dim?: boolean
  ripple?: number
  className?: string
  style?: CSSProperties
}) {
  return (
    <span className={cn("bg-viz-track", className)} style={style}>
      <span
        data-dim={dim || undefined}
        className={cn("px-cell block size-full rounded-[inherit]", at !== undefined && "viz-fade")}
        style={
          {
            "--px": color,
            ...(at !== undefined && delay(at, duration)),
            transitionDelay: ripple ? `${ripple}ms` : undefined,
          } as CSSProperties
        }
      />
    </span>
  )
}

/** A key entry: a 16px swatch and its name, 12px apart, in the label face. More children follow the name. */
export function Key({ color, children }: { color: string; children: ReactNode }) {
  return (
    <span className={cn(labelText, "flex items-center gap-3")}>
      <span aria-hidden="true" className="size-4 shrink-0" style={{ backgroundColor: color }} />
      {children}
    </span>
  )
}

const SOFT = "bg-viz-panel text-viz-panel-ink"
const SOLID = "bg-viz-lead text-viz-lead-ink"

/**
 * A readout panel, 24px in, with its tag at the top left. Soft is the panel colour with a lead tag; `solid` swaps
 * the two, so the tag always reads against its panel. A register change swaps every colour in 200ms.
 */
export function Panel({
  tag,
  solid = false,
  className,
  style,
  children,
}: {
  tag: string
  solid?: boolean
  className?: string
  style?: CSSProperties
  children: ReactNode
}) {
  return (
    <div className={cn("flex flex-col p-6 transition-colors duration-200", solid ? SOLID : SOFT, className)} style={style}>
      <Tag className={cn("transition-colors duration-200", solid ? SOFT : SOLID)}>{tag}</Tag>
      {children}
    </div>
  )
}
