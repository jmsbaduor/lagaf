import { useEffect, useLayoutEffect, useRef, useState } from 'react'

/* The grid's origin, its rulers, and the "Boxes" measuring layer.
   Origin: the top-left of [data-grid-origin] (the widget box) or, on a page without one, of main's content box,
   snapped to whole device pixels and written to --grid-x/y (+ centre, --grid-cx/cy) on <html>; the stylesheet
   draws the lines from there.
   Grid and Boxes: rulers numbered from that origin. Boxes only: a red outline on every box that is not on the
   4px grid, and on hover or focus the box's size and its distances to its parent.
   Every number is a getBoundingClientRect reading. Decorative: aria-hidden, pointer-events none, nothing focusable. */

// Self-contained, as in frantic (where it is also inlined as a pre-paint script).
// Returns the origin box [left, top, width, height] in viewport px, unsnapped.
function setOrigin() {
  let e = document.querySelector('[data-grid-origin]')
  const s = document.documentElement.style
  const p = window.devicePixelRatio || 1
  let b: number[] | null = null
  if (e) {
    const r = e.getBoundingClientRect()
    b = [r.left, r.top, r.width, r.height]
  } else if ((e = document.querySelector('main'))) {
    const m = e.getBoundingClientRect()
    const c = getComputedStyle(e)
    const l = parseFloat(c.paddingLeft)
    const t = parseFloat(c.paddingTop)
    b = [m.left + l, m.top + t, m.width - l - parseFloat(c.paddingRight), m.height - t - parseFloat(c.paddingBottom)]
  }
  const v = b ? [b[0], b[1], b[0] + b[2] / 2, b[1] + b[3] / 2] : []
  ;['x', 'y', 'cx', 'cy'].forEach(function (k, i) {
    if (b) s.setProperty('--grid-' + k, Math.round(v[i] * p) / p + 'px')
    else s.removeProperty('--grid-' + k)
  })
  return b
}

type Box = { el: Element; name: string; x: number; y: number; w: number; h: number; off: boolean }
type Model = { ox: number; oy: number; w: number; h: number; dpr: number; snap: number; boxes: Box[] }

// lagaf: a chart is drawn in its own px and zoomed to the screen; the stage writes that zoom to --chart-zoom.
// The grid, rulers and readouts work in chart px, so a box on the chart's 4px grid reads as on the grid at any size.
const zoom = () => parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--chart-zoom')) || 1
const UNIT = 4
const on = (n: number, step = UNIT * zoom()) => Math.abs(n - Math.round(n / step) * step) < 0.01
const fmt = (n: number) => String(+(n / zoom()).toFixed(2))

function measure(detail: boolean): Model | null {
  const o = setOrigin()
  if (!o) return null
  const dpr = window.devicePixelRatio || 1
  const ox = Math.round(o[0] * dpr) / dpr
  const oy = Math.round(o[1] * dpr) / dpr
  const boxes: Box[] = []
  // ponytail: every element is read on every sync; fine for one widget, scope it to the hovered subtree if a page gets heavy.
  const scope = detail ? (document.querySelector('[data-stage-frame]') ?? document.querySelector('main')) : null
  for (const el of scope?.querySelectorAll<HTMLElement>('*') ?? []) {
    if (!(el instanceof HTMLElement)) continue // not the insides of an svg
    // Skip what is not a painted box: hidden inputs, inline text runs, empty parts.
    if (!el.checkVisibility({ opacityProperty: true, visibilityProperty: true })) continue
    if (getComputedStyle(el).display === 'inline') continue
    const r = el.getBoundingClientRect()
    if (r.width <= 1 || r.height <= 1) continue
    const x = r.left - ox
    const y = r.top - oy
    // A leaf sized by its text has one free end (content, not layout): one horizontal edge on the grid is enough.
    const horizontal = el.firstElementChild ? on(x) && on(x + r.width) : on(x) || on(x + r.width)
    boxes.push({
      el,
      name: el.dataset.slot ?? el.tagName.toLowerCase(),
      x, y, w: r.width, h: r.height,
      off: !(horizontal && on(y) && on(y + r.height)),
    })
  }
  return {
    ox: ox + window.scrollX, oy: oy + window.scrollY, w: o[2], h: o[3], dpr,
    snap: Math.max(Math.abs(o[0] - ox), Math.abs(o[1] - oy)),
    boxes,
  }
}

const mono = 'font-mono text-[10px] leading-none tabular-nums whitespace-nowrap'
const chip = `absolute rounded-xs bg-surface-1 px-0.5 py-px ${mono}`
const tone = (ok: boolean) => (ok ? 'text-accent' : 'text-danger')

// `room` is the space outside the origin on the ruler's side. With less than 36px (a full-bleed page) the
// ruler shrinks to a 4px band on the edge and its numbers move into what space there is.
function Ruler({ length, room, vertical }: { length: number; room: number; vertical?: boolean }) {
  const tight = room < 36
  const band = tight ? 4 : 8
  const away = tight ? -4 : -20
  const k = zoom()
  const marks: number[] = []
  for (let n = 0; n < length - 24 * k; n += 64 * k) marks.push(n)
  const tick = vertical ? 'linear-gradient(currentColor 1px, transparent 1px) 100% 0' : 'linear-gradient(90deg, currentColor 1px, transparent 1px) 0 100%'
  const size = (step: number, len: number) => (vertical ? `${len}px ${step}px repeat-y` : `${step}px ${len}px repeat-x`)
  return (
    <div
      className={`absolute text-fg-subtle ${mono}`}
      style={{
        // Normally 8px clear of the tray; +1 so the tick at the far end is drawn. Shifted like the grid lines.
        ...(vertical
          ? { left: away, top: 'calc(0px - var(--grid-half))', width: band, height: length + 1 }
          : { top: away, left: 'calc(0px - var(--grid-half))', height: band, width: length + 1 }),
        background: `${tick} / ${size(64 * k, 8)}, ${tick} / ${size(16 * k, 4)}`,
      }}
    >
      {[...marks, length].map((n) => (
        <span
          key={n}
          className={`absolute ${n === length ? tone(on(n, 16 * k)) : ''}`}
          style={
            vertical
              ? { ...(tight ? { left: 6 } : { right: 12 }), top: n, translate: '0 -50%' }
              : { ...(!tight ? { bottom: 12 } : room >= 16 ? { bottom: 5 } : { top: 6 }), left: n, translate: '-50% 0' }
          }
        >
          {fmt(n)}
        </span>
      ))}
    </div>
  )
}

function Value({ n, ok = on(n) }: { n: number; ok?: boolean }) {
  return <span className={ok ? undefined : 'text-danger'}>{fmt(n)}</span>
}

export default function Measure({ mode }: { mode: 'off' | 'grid' | 'boxes' }) {
  const [model, setModel] = useState<Model | null>(null)
  const [active, setActive] = useState<Element | null>(null)
  const layer = useRef<HTMLDivElement>(null)

  useLayoutEffect(() => {
    if (mode === 'off') return
    let frame = 0
    const run = () => {
      frame = 0
      setModel(measure(mode === 'boxes'))
    }
    const sync = () => { frame ||= requestAnimationFrame(run) }
    run()
    const resize = new ResizeObserver(sync)
    resize.observe(document.body)
    // The widget moves without resizing anything (a thumb is dragged, a route changes): watch the DOM, not our own layer.
    const mutate = new MutationObserver((records) => {
      if (records.some((r) => !layer.current?.contains(r.target))) sync()
    })
    mutate.observe(document.body, { subtree: true, childList: true, attributes: true, characterData: true })
    const events = ['resize', 'scroll', 'transitionend', 'animationend'] as const
    events.forEach((e) => window.addEventListener(e, sync, { passive: true }))
    document.fonts.ready.then(sync)
    return () => {
      cancelAnimationFrame(frame)
      resize.disconnect()
      mutate.disconnect()
      events.forEach((e) => window.removeEventListener(e, sync))
    }
  }, [mode])

  useEffect(() => {
    if (mode !== 'boxes') return
    // Pointer and keyboard get the same readout: the box under the pointer, or the box that holds focus.
    const pick = (event: Event) => setActive(event.target as Element)
    document.addEventListener('pointerover', pick)
    document.addEventListener('focusin', pick)
    return () => {
      document.removeEventListener('pointerover', pick)
      document.removeEventListener('focusin', pick)
    }
  }, [mode])

  // lagaf renders client-only, so frantic's pre-paint origin script isn't needed; the layout effect sets it.
  if (mode === 'off' || !model) return null
  const detail = mode === 'boxes'

  const find = (el: Element | null) => model.boxes.find((b) => b.el === el)
  // Hidden inputs and inline text resolve to the nearest box around them.
  let box: Box | undefined
  for (let el = active; el && !box; el = el.parentElement) box = find(el)
  const parent = box && find(box.el.parentElement)
  const off = model.boxes.filter((b) => b.off)
  const gaps = box && parent
    ? ([
        ['left', box.x - parent.x],
        ['right', parent.x + parent.w - box.x - box.w],
        ['top', box.y - parent.y],
        ['bottom', parent.y + parent.h - box.y - box.h],
      ] as const).filter(([, n]) => n > 0.01)
    : []

  return (
    <>
      <div ref={layer} aria-hidden="true" className="pointer-events-none">
        <div className="absolute top-0 left-0 z-40" style={{ translate: `${model.ox}px ${model.oy}px` }}>
          <Ruler length={model.w} room={model.oy} />
          <Ruler length={model.h} room={model.ox} vertical />
          {off.map((b, i) => (
            <div key={i} className="absolute outline outline-danger" style={{ left: b.x, top: b.y, width: b.w, height: b.h }} />
          ))}
          {box && (
            <>
              <div
                className={`absolute outline ${box.off ? 'outline-danger' : 'outline-accent'}`}
                style={{ left: box.x, top: box.y, width: box.w, height: box.h }}
              />
              {gaps.map(([side, n]) => {
                const across = side === 'left' || side === 'right'
                const style = across
                  ? { left: side === 'left' ? box.x - n : box.x + box.w, top: box.y + box.h / 2, width: n, height: 1 }
                  : { top: side === 'top' ? box.y - n : box.y + box.h, left: box.x + box.w / 2, height: n, width: 1 }
                return (
                  <div key={side} className={`absolute bg-current ${tone(on(n))}`} style={style}>
                    <span className={chip} style={across ? { left: '50%', bottom: 3, translate: '-50% 0' } : { top: '50%', left: 4, translate: '0 -50%' }}>
                      {fmt(n)}
                    </span>
                  </div>
                )
              })}
              <span className={`${chip} ${tone(!box.off)}`} style={{ left: box.x + box.w / 2, top: box.y + box.h + 4, translate: '-50% 0' }}>
                {fmt(box.w)} × {fmt(box.h)}
              </span>
            </>
          )}
        </div>
        {detail && <p className={`fixed bottom-4 inset-s-4 z-40 text-fg-subtle ${mono}`}>
          {model.boxes.length - off.length}/{model.boxes.length} boxes on the 4px grid
          {off.length > 0 && <span className="text-danger"> · {off.length} off</span>}
          {' · '}origin {fmt(model.ox)}, {fmt(model.oy)} @ {+model.dpr.toFixed(2)}× · zoom {+zoom().toFixed(3)}
          {model.snap > 0.01 && <span className="text-danger"> · {fmt(model.snap)}px off the device pixel</span>}
          {box && (
            <>
              {' · '}{box.name} x <Value n={box.x} /> y <Value n={box.y} /> ·{' '}
              <Value n={box.w} ok={on(box.x + box.w) || !box.el.firstElementChild} /> × <Value n={box.h} ok={on(box.y + box.h)} />
            </>
          )}
        </p>}
      </div>
    </>
  )
}
