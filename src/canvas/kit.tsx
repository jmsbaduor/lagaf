import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type ComponentProps,
  type PointerEvent,
  type ReactNode,
} from "react"

import { useStage } from "@/components/stage"
import { cn } from "@/lib/utils"
import "./kit.css"

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

/**
 * What a chart is reading: the hovered item (mouse or pen), else the focused one. Touch goes through focus, since a
 * tap also leaves. Spread `bind(key)` on each item and show `active` in the Header's hint; when nothing is read,
 * the hint returns to its instruction.
 */
export function useReading<K>() {
  const [hover, setHover] = useState<K | null>(null)
  const [focus, setFocus] = useState<K | null>(null)
  const bind = (key: K) => ({
    onPointerEnter: (e: PointerEvent) => e.pointerType !== "touch" && setHover(key),
    onPointerLeave: (e: PointerEvent) => e.pointerType !== "touch" && setHover(null),
    onFocus: () => setFocus(key),
    onBlur: () => setFocus(null),
  })
  return { active: hover ?? focus, bind }
}

/** Mono uppercase label, Lumina's instrument voice. */
export function Label({ className, ...props }: ComponentProps<"p">) {
  return (
    <p
      className={cn("font-mono text-[14px] leading-4 font-medium uppercase text-viz-label", className)}
      {...props}
    />
  )
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

/** Inline style helper for the kit's entrance classes. */
export const delay = (ms: number, dur?: number) =>
  ({ "--viz-delay": `${ms}ms`, ...(dur ? { "--viz-dur": `${dur}ms` } : {}) }) as React.CSSProperties
