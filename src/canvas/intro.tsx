import { useEffect } from 'react'

import { Icon, type IconName } from '@/components/Icon'

/**
 * Only on a first visit with a keyboard. Not on touch (no arrow keys), and not when a browser is automated, so captures
 * and checks see the chart. If storage is blocked it never shows, rather than on every visit.
 */
export function firstVisit() {
  if (navigator.webdriver || matchMedia('(pointer: coarse)').matches) return false
  try {
    return !localStorage.getItem('intro')
  } catch {
    return false
  }
}

// Three beats in one spot, each fading up in and out (global.css, section 7): the loader, then ← →, then ↑ ↓.
const BEATS = [
  { at: 0, beat: 2400 },
  { at: 2500, beat: 1600, keys: ['arrow-left', 'arrow-right'], text: 'to change chart' },
  { at: 4200, beat: 1600, keys: ['arrow-up', 'arrow-down'], text: 'to change colour' },
] satisfies { at: number; beat: number; keys?: IconName[]; text?: string }[]

/** The first visit's intro over the stage. Any key or click skips it; `onLeave` starts the paper fading off the chart. */
export function Intro({ leaving, onLeave, onDone }: { leaving: boolean; onLeave: () => void; onDone: () => void }) {
  useEffect(() => {
    try { localStorage.setItem('intro', 'seen') } catch { /* storage blocked */ }
  }, [])

  useEffect(() => {
    // Capture, so a key that skips the intro doesn't also change the chart or colour underneath.
    const skip = (event: Event) => {
      event.stopPropagation()
      event.preventDefault()
      onLeave()
    }
    addEventListener('keydown', skip, true)
    return () => removeEventListener('keydown', skip, true)
  }, [onLeave])

  return (
    <div
      data-intro=""
      className={`fixed inset-0 z-[60] bg-canvas ${leaving ? 'intro-leave' : ''}`}
      onPointerDown={onLeave}
      onAnimationEnd={(event) => leaving && event.target === event.currentTarget && onDone()}
    >
      <div className="intro-stage">
        <span aria-hidden="true" className="intro-grid" />
        {BEATS.map(({ at, beat, keys, text }, i) => (
          <div
            key={i}
            className="intro-beat col-start-1 row-start-1 flex flex-col items-center gap-4"
            style={{ '--at': `${at}ms`, '--beat': `${beat}ms` } as React.CSSProperties}
            onAnimationEnd={(event) => i === BEATS.length - 1 && event.target === event.currentTarget && onLeave()}
          >
            {keys ? (
              // The keys sit in the sentence: Press, the two keys, then what they do. Each presses once, the first
              // then the second, so the beat shows what to do.
              <p className="flex items-center gap-3 text-[20px] leading-7 text-fg-muted">
                Press
                <span className="flex gap-2">
                  {keys.map((name, k) => (
                    <kbd key={name} className="intro-key" style={{ '--press': `${at + 500 + k * 350}ms` } as React.CSSProperties}>
                      <Icon name={name} size={16} />
                      <span className="sr-only">{k > 0 && 'or '}{name.slice(6)}</span>
                    </kbd>
                  ))}
                </span>
                {text}
              </p>
            ) : (
              <IntroMark />
            )}
          </div>
        ))}
      </div>
    </div>
  )
}

/**
 * The mark loader (src/components/Mark.tsx) at 64px, a unit to 4px, on the intro's grid, so the cells' edges sit on
 * its lines. Each cell, its ink and accent together, slides in from its own corner; then the two move opposite ways,
 * up and down, then left and right, two grid steps and back, as the keys that follow do.
 */
function IntroMark() {
  return (
    <div className="size-16">
      <svg viewBox="0 0 16 16" width={64} height={64} shapeRendering="crispEdges" className="mark mark-loading relative" role="img" aria-label="lagaf">
        <g className="intro-cell" style={{ '--from': '-6px 6px', '--v': '0 -2px', '--h': '2px 0' } as React.CSSProperties}>
          <rect className="mark-ink" x="0" y="9" width="7" height="7" />
          <rect className="mark-accent mark-a" x="0" y="9" width="7" height="7" />
        </g>
        <g className="intro-cell" style={{ '--from': '6px -6px', '--v': '0 2px', '--h': '-2px 0', '--lag': '80ms' } as React.CSSProperties}>
          <rect className="mark-ink" x="9" y="0" width="7" height="7" />
          <rect className="mark-accent mark-b" x="9" y="0" width="7" height="7" />
        </g>
      </svg>
    </div>
  )
}
