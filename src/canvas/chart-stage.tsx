import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import { Button } from '@ui-sdk/react/button'
import { Collapsible, CollapsiblePanel, CollapsibleTrigger } from '@ui-sdk/react/collapsible'
import {
  Menu, MenuContent, MenuGroupLabel, MenuItem, MenuItemIndicator, MenuRadioGroup, MenuRadioItem, MenuSeparator, MenuTrigger,
} from '@ui-sdk/react/menu'
import { SegmentedControl, SegmentedControlIndicator, SegmentedControlItem } from '@ui-sdk/react/segmented-control'
import {
  Select, SelectContent, SelectItem, SelectItemIcon, SelectItemIndicator, SelectTrigger, SelectValue, SelectValueIcon,
} from '@ui-sdk/react/select'
import { Slider, SliderControl, SliderIndicator, SliderThumb, SliderTrack, SliderValue } from '@ui-sdk/react/slider'

import { FRAME_H, FRAME_W } from '@/canvas/kit'
import { sets, type Chart, type FrameSet, type SetName } from '@/canvas/registry'
import { Icon } from '@/components/Icon'
import Measure from '@/components/Measure'
import {
  HUES, setStage, shortcut, toggleChrome, useStageState, useSystemReducedMotion,
  type Hue, type Knob, type Knobs, type Speed,
} from '@/components/stage'

type KnobValue = string | number | boolean
type Theme = 'light' | 'dark'
type GridMode = 'off' | 'grid' | 'boxes'

// The safe area is 1440 by 900 chart px with 72 px of padding. The zoom keeps the whole safe area on screen and the
// content (inside the padding) `clear` px from the top and bottom: the bars' band (16 + 32, or 16 + 40 on touch) and
// 16 px of air. It snaps down so the chart's 4 px grid lands on whole device pixels at the screen's density
// (quarters at 1x, eighths at 2x), and so its 16 px majors land on whole CSS pixels. The 16 px of slack on the content's height leaves room to start the safe area on a
// multiple of 8 (a whole CSS pixel) without giving up any air. At 1440 by 900 the zoom is 1.
const PAD = 72
function fit(width: number, height: number, clear: number, dpr: number) {
  const k = Math.min(width / FRAME_W, height / FRAME_H, (height - 2 * clear) / (FRAME_H - 2 * PAD + 16))
  // 4 chart px = 4k CSS px = 4k * dpr device px, a whole number when k is a multiple of 1 / (4 * dpr), and never
  // coarser than quarters, so 16 chart px stay whole CSS pixels.
  const step = Math.max(4, Math.round(4 * dpr))
  return Math.max(1 / step, Math.floor(k * step + 1e-6) / step)
}
/** Nearest 16 to `centre`, held to multiples of 8 between `lo` and `hi`. */
const place = (centre: number, lo: number, hi: number) =>
  Math.min(Math.floor(hi / 8 + 1e-6) * 8, Math.max(Math.ceil(lo / 8 - 1e-6) * 8, Math.round(centre / 16) * 16))

const REPO = 'https://github.com/jmsbaduor/lagaf'

// Elements whose arrow keys are their own, so ← and → don't change chart while focus is in them.
const ARROW_OWNERS = [
  'input', 'textarea', 'select', '[contenteditable]',
  '[role="slider"]', '[role="radiogroup"]', '[role="tablist"]', '[role="toolbar"]', '[role="menu"]', '[role="listbox"]',
  '[data-slot="segmented-control"]', '[data-slot="slider"]',
].join(',')

function useViewport() {
  const [size, setSize] = useState(() => [innerWidth, innerHeight])
  useEffect(() => {
    const on = () => setSize([innerWidth, innerHeight])
    addEventListener('resize', on)
    return () => removeEventListener('resize', on)
  }, [])
  return size
}

const defaults = (knobs: Knobs) =>
  Object.fromEntries(Object.entries(knobs).map(([key, knob]) => [key, knob.value])) as Record<string, KnobValue>

const BARS = '[data-stage-chrome], [data-stage-controls]'

/**
 * Text is a fraction of a pixel wide, which would put every box after it in a bar between pixels. Round each piece of
 * text in the bars and the Motion panel up to a whole pixel: when it changes, when the panel opens, on resize and once
 * the fonts are in. The menus are set widths in CSS, so their text never moves a box.
 * ponytail: one layout read per change; calc-size(max-content, round(up, size, 1px)) replaces it once every browser has it.
 */
function useWholePixels() {
  useLayoutEffect(() => {
    const bars = [...document.querySelectorAll(BARS)]
    const snap = () => {
      const boxes = bars
        .flatMap((bar) => [...bar.querySelectorAll<HTMLElement>('*')])
        .filter((el) => [...el.childNodes].some((n) => n.nodeType === Node.TEXT_NODE && n.nodeValue?.trim()))
      for (const el of boxes) el.style.minWidth = ''
      // The used width, not the box on screen: a pressed button is scaled down.
      const widths = boxes.map((el) => parseFloat(getComputedStyle(el).width) || 0)
      boxes.forEach((el, i) => {
        if (widths[i] % 1 > 0.01) el.style.minWidth = `${Math.ceil(widths[i])}px`
      })
    }
    snap()
    const watch = new MutationObserver(snap)
    for (const bar of bars) watch.observe(bar, { childList: true, characterData: true, subtree: true, attributeFilter: ['hidden'] })
    watch.observe(document.documentElement, { attributeFilter: ['data-chrome'] })
    document.fonts.addEventListener('loadingdone', snap)
    addEventListener('resize', snap)
    return () => {
      watch.disconnect()
      document.fonts.removeEventListener('loadingdone', snap)
      removeEventListener('resize', snap)
    }
  }, [])
}

/** One chart fills the screen; three floating bars hold everything else. */
export function ChartStage({ set: name = 'data', initial }: { set?: SetName; initial: string }) {
  const set = sets[name]
  const charts = set.items
  const [slug, setSlug] = useState(initial)
  const index = Math.max(0, charts.findIndex((c) => c.slug === slug))
  const chart = charts[index]
  const [values, setValues] = useState(() => defaults(chart.knobs))
  const [replay, setReplay] = useState(0)
  const [width, height] = useViewport()
  // Focused mode (H, or ?clean) hides the bars, so the chart needs no band for them and fills the screen.
  const { hidden } = useStageState()
  const clear = hidden ? 0 : matchMedia('(pointer: coarse)').matches ? 72 : 64
  const k = fit(width, height, clear, devicePixelRatio || 1)
  const bare = new URLSearchParams(location.search).has('bare')
  useWholePixels()

  // The chart's px, as the grid and the Boxes readout see them.
  useLayoutEffect(() => {
    const s = document.documentElement.style
    s.setProperty('--chart-zoom', String(k))
    s.setProperty('--grid-step', `${4 * k}px`)
    s.setProperty('--grid-step-major', `${16 * k}px`)
  }, [k])

  function go(next: Chart, how: 'push' | 'pop' = 'push') {
    setSlug(next.slug)
    setValues(defaults(next.knobs))
    setReplay(0)
    document.title = `${next.title} · lagaf`
    if (how === 'push') history.pushState(null, '', `${set.base}/${next.slug}${location.search}`)
    setStage({ status: `Chart: ${next.title}, ${charts.indexOf(next) + 1} of ${charts.length}` })
  }
  const step = (by: number) => go(charts[(index + by + charts.length) % charts.length])

  useEffect(() => {
    const onPop = () => {
      const path = location.pathname.replace(/\/$/, '') // Caddy serves /slug/ as well as /slug
      const next = charts.find((c) => `${set.base}/${c.slug}` === path) ?? charts[0]
      go(next, 'pop')
    }
    addEventListener('popstate', onPop)
    return () => removeEventListener('popstate', onPop)
  })

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'ArrowLeft' || event.key === 'ArrowRight') {
        // Left and right change chart from anywhere, except where the arrows already mean something: a chart that
        // handles them (it calls preventDefault), a field, or a control that moves its own selection.
        if (event.defaultPrevented || event.metaKey || event.ctrlKey || event.altKey || event.shiftKey) return
        if ((event.target as Element | null)?.closest?.(ARROW_OWNERS)) return
        event.preventDefault()
        step(event.key === 'ArrowLeft' ? -1 : 1)
        return
      }
      if (shortcut(event) === 'r') setReplay((n) => n + 1)
    }
    addEventListener('keydown', onKey)
    return () => removeEventListener('keydown', onKey)
  })

  const C = chart.Component
  const live = <C key={`${slug}-${replay}`} {...values} />

  // ?bare: the chart alone at 1:1, top left, for captures.
  if (bare)
    return (
      <main>
        <h1 className="sr-only">{chart.title}</h1>
        {live}
      </main>
    )

  // Design-px size of the screen, and the safe area centred in it: on screen, its content `clear` px from the top and
  // bottom, and on a whole CSS pixel.
  const w = width / k
  const h = height / k
  const x = place((w - FRAME_W) / 2, 0, w - FRAME_W)
  const y = place((h - FRAME_H) / 2, Math.max(0, clear / k - PAD), Math.min(h - FRAME_H, (height - clear) / k - FRAME_H + PAD))

  return (
    <>
      <main data-chart-stage="" data-stage-frame="">
        <h1 className="sr-only">{chart.title}</h1>
        <div style={{ zoom: k, width: w, height: h, position: 'relative' }}>
          <div data-grid-origin="" style={{ position: 'absolute', left: x, top: y, width: FRAME_W, height: FRAME_H }}>
            {live}
          </div>
        </div>
      </main>
      {/* In reading order, so Tab goes top left, top right, bottom left, bottom right. */}
      <ChartNav set={set} chart={chart} index={index} onGo={go} />
      <StageControls />
      <ChartBar chart={chart} values={values} onChange={(key, v) => setValues((cur) => ({ ...cur, [key]: v }))} onReplay={() => setReplay((n) => n + 1)} />
      <Arrows onStep={step} />
    </>
  )
}

/** Top left: every frame of the set in a menu, and a way to the other set. */
function ChartNav({ set, chart, index, onGo }: { set: FrameSet; chart: Chart; index: number; onGo: (c: Chart) => void }) {
  const { items: charts, rows } = set
  const other = set.name === 'data' ? sets.brand : sets.data
  return (
    <nav aria-label="Charts" data-stage-chrome="" className="fixed inset-s-4 top-4 z-50 flex items-center gap-2">
      <Button render={<a href={REPO} />} aria-label="lagaf on GitHub" title="lagaf on GitHub">
        <Icon name="github" size={16} />
      </Button>
      <Menu>
        <MenuTrigger title="Charts" render={<Button />}>
          <Icon name="chart" size={16} />
          <span>{chart.title}</span>
          <span aria-hidden="true" className="text-fg-subtle tabular-nums max-sm:hidden">
            {index + 1}/{charts.length}
          </span>
          <span className="sr-only">, {index + 1} of {charts.length}</span>
          <Icon name="chevron-down" size={16} />
        </MenuTrigger>
        {/* A mega menu: one column per row of charts, up to four, fewer on narrow screens. */}
        <MenuContent
          align="start"
          className="chart-menu max-h-[calc(100dvh-72px)] overflow-y-auto"
          style={{ '--cols': Math.min(4, rows.length) } as React.CSSProperties}
        >
          {rows.map((row, i) => (
            <MenuRadioGroup
              key={row.number}
              className="chart-menu-col"
              // Where this column sits at four, two and one columns across, so CSS draws dividers only between columns.
              data-col4={i % Math.min(4, rows.length)}
              data-row4={Math.floor(i / Math.min(4, rows.length))}
              data-col2={i % Math.min(2, rows.length)}
              data-row2={Math.floor(i / Math.min(2, rows.length))}
              data-row1={i}
              value={chart.row.number === row.number ? chart.slug : ''}
              onValueChange={(slug) => {
                const next = charts.find((c) => c.slug === slug)
                if (next) onGo(next)
              }}
            >
              <MenuGroupLabel>
                <span className="tabular-nums">{String(row.number).padStart(2, '0')}</span> {row.title}
              </MenuGroupLabel>
              {charts
                .filter((c) => c.row.number === row.number)
                .map((c) => (
                  <MenuRadioItem key={c.slug} value={c.slug} closeOnSelect>
                    <MenuItemIndicator />
                    <span className="truncate">{c.title}</span>
                  </MenuRadioItem>
                ))}
            </MenuRadioGroup>
          ))}
          {other.items.length > 0 && (
            <>
              <MenuSeparator className="col-span-full" />
              {/* Text in line with the chart names above it, past their check column. */}
              <MenuItem className="col-span-full ps-8" onSelect={() => location.assign(`${other.base}/${other.items[0].slug}`)}>
                {other.title}
              </MenuItem>
            </>
          )}
        </MenuContent>
      </Menu>
    </nav>
  )
}

/** Bottom right: previous and next, two white icon buttons on their own. Also ← and →. */
function Arrows({ onStep }: { onStep: (by: number) => void }) {
  return (
    <nav aria-label="Previous and next chart" data-stage-chrome="" className="fixed inset-e-4 bottom-4 z-50 flex items-center gap-2">
      <Button aria-label="Previous chart" aria-keyshortcuts="ArrowLeft" title="Previous chart (←)" onClick={() => onStep(-1)}>
        <Icon name="chevron-left" size={16} />
      </Button>
      <Button aria-label="Next chart" aria-keyshortcuts="ArrowRight" title="Next chart (→)" onClick={() => onStep(1)}>
        <Icon name="chevron-right" size={16} />
      </Button>
    </nav>
  )
}

/**
 * The tab's icon in the chosen colour: the mark's ink and lead, resolved for the browser's own light or dark
 * (the tab strip follows the system, not the page).
 */
function paintFavicon() {
  const link = document.querySelector<HTMLLinkElement>('link[rel="icon"][type="image/svg+xml"]')
  if (!link) return
  const probe = document.createElement('span')
  probe.style.colorScheme = matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
  document.body.append(probe)
  const colour = (role: string) => ((probe.style.color = `var(${role})`), getComputedStyle(probe).color)
  const [ink, lead] = [colour('--viz-ink'), colour('--viz-lead')]
  probe.remove()
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" shape-rendering="crispEdges"><rect fill="${ink}" x="0" y="9" width="7" height="7"/><rect fill="${lead}" x="9" y="0" width="7" height="7"/></svg>`
  link.href = `data:image/svg+xml,${encodeURIComponent(svg)}`
}

function applyTheme(theme: Theme) {
  const root = document.documentElement
  root.classList.remove('light', 'dark')
  root.classList.add(theme)
  root.setAttribute('data-theme', theme)
  root.style.colorScheme = theme
}
function applyGrid(mode: GridMode) {
  if (mode === 'off') document.documentElement.removeAttribute('data-grid')
  else document.documentElement.setAttribute('data-grid', mode)
}
function remember(key: string, value: string) {
  try {
    localStorage.setItem(key, value)
  } catch {
    // storage blocked: the choice lasts for this page
  }
}

const item = 'w-7 px-0'
const GRIDS = [['off', 'No grid', 'frame'], ['grid', 'Grid', 'grid'], ['boxes', 'Boxes', 'boxes']] as const
const THEMES = [['light', 'Light', 'sun'], ['dark', 'Dark', 'moon']] as const
const capital = (word: string) => word[0].toUpperCase() + word.slice(1)

/** Top right: accent colour, the layout grid and light or dark. Frantic's StageControls plus the accent. */
function StageControls() {
  const root = document.documentElement
  const [theme, setTheme] = useState<Theme>(() => (root.classList.contains('dark') ? 'dark' : 'light'))
  const [grid, setGrid] = useState<GridMode>(() => (root.getAttribute('data-grid') as GridMode | null) ?? 'off')
  const [accent, setAccent] = useState<Hue>(() => (HUES.find((h) => h === root.dataset.accent) ?? 'lumina'))
  const { hidden, status } = useStageState()

  const changeTheme = (next: Theme) => (setTheme(next), applyTheme(next), remember('theme', next))
  const changeGrid = (next: GridMode) => (setGrid(next), applyGrid(next), remember('grid', next))
  const changeAccent = (next: Hue) => {
    setAccent(next)
    root.dataset.accent = next
    remember('accent', next)
    paintFavicon()
  }
  useEffect(paintFavicon, [])

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      // ↑ and ↓ step through the colours, unless the arrows already mean something where focus is.
      if (event.key === 'ArrowUp' || event.key === 'ArrowDown') {
        if (event.defaultPrevented || event.metaKey || event.ctrlKey || event.altKey || event.shiftKey) return
        if ((event.target as Element | null)?.closest?.(ARROW_OWNERS)) return
        event.preventDefault()
        const next = HUES[(HUES.indexOf(accent) + (event.key === 'ArrowDown' ? 1 : -1) + HUES.length) % HUES.length]
        changeAccent(next)
        setStage({ status: `Colour: ${capital(next)}` })
        return
      }
      const key = shortcut(event)
      if (key === 'g') changeGrid(grid === 'off' ? 'grid' : grid === 'grid' ? 'boxes' : 'off')
      else if (key === 'd') {
        const next = theme === 'dark' ? 'light' : 'dark'
        changeTheme(next)
        setStage({ status: `Theme: ${capital(next)}` })
      } else if (key === 'h') toggleChrome()
    }
    addEventListener('keydown', onKey)
    return () => removeEventListener('keydown', onKey)
  })

  return (
    <>
      <Measure mode={hidden ? 'off' : grid} />
      <p role="status" className="sr-only">{status}</p>
      <div role="group" aria-label="Display" data-stage-controls="" className="fixed inset-e-4 top-4 z-50 flex items-center gap-2">
        <Select value={accent} onValueChange={(next) => next && changeAccent(next as Hue)}>
          <SelectTrigger aria-label="Colour" aria-keyshortcuts="ArrowUp ArrowDown" title="Colour (↑ ↓)" className="justify-start capitalize">
            <SelectValueIcon />
            <SelectValue className="max-sm:hidden" />
            <Icon name="chevron-down" size={16} />
          </SelectTrigger>
          <SelectContent align="end">
            {HUES.map((hue) => (
              <SelectItem key={hue} value={hue} className="capitalize">
                <SelectItemIndicator />
                <SelectItemIcon>
                  <span data-accent={hue} className="block size-3 rounded-full bg-accent" />
                </SelectItemIcon>
                {hue}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {/* A phone has no room for both groups beside the chart menu, so they fold into one menu, as in frantic. */}
        <Menu>
          <MenuTrigger aria-label="Display" aria-keyshortcuts="G D" title="Display (G D)" className="sm:hidden" render={<Button />}>
            <Icon name="cog" size={16} />
          </MenuTrigger>
          <MenuContent align="end">
            <MenuRadioGroup value={grid} onValueChange={(next) => changeGrid(next as GridMode)}>
              <MenuGroupLabel>Grid</MenuGroupLabel>
              {GRIDS.map(([value, label]) => (
                <MenuRadioItem key={value} value={value}>
                  <MenuItemIndicator />
                  {label}
                </MenuRadioItem>
              ))}
            </MenuRadioGroup>
            <MenuSeparator />
            <MenuRadioGroup value={theme} onValueChange={(next) => changeTheme(next as Theme)}>
              <MenuGroupLabel>Theme</MenuGroupLabel>
              {THEMES.map(([value, label]) => (
                <MenuRadioItem key={value} value={value}>
                  <MenuItemIndicator />
                  {label}
                </MenuRadioItem>
              ))}
            </MenuRadioGroup>
          </MenuContent>
        </Menu>
        <SegmentedControl className="max-sm:hidden" aria-label="Grid" aria-keyshortcuts="G" value={grid} onValueChange={(next) => next && changeGrid(next as GridMode)}>
          <SegmentedControlIndicator />
          {GRIDS.map(([value, label, icon]) => (
            <SegmentedControlItem key={value} value={value} aria-label={label} title={`${label} (G)`} className={item}>
              <Icon name={icon} size={16} />
            </SegmentedControlItem>
          ))}
        </SegmentedControl>
        <SegmentedControl className="max-sm:hidden" aria-label="Theme" aria-keyshortcuts="D" value={theme} onValueChange={(next) => next && changeTheme(next as Theme)}>
          <SegmentedControlIndicator />
          {THEMES.map(([value, label, icon]) => (
            <SegmentedControlItem key={value} value={value} aria-label={label} title={`${label} (D)`} className={item}>
              <Icon name={icon} size={16} />
            </SegmentedControlItem>
          ))}
        </SegmentedControl>
      </div>
    </>
  )
}

const SPEEDS = [['0.25', '¼×', 'Quarter speed'], ['0.5', '½×', 'Half speed'], ['1', '1×', 'Full speed']] as const

/** A toggle as DialKit draws one: an Off / On pair inside the row. */
function OnOff({ label, checked, onChange, disabled }: { label: string; checked: boolean; onChange: (next: boolean) => void; disabled?: boolean }) {
  return (
    <SegmentedControl aria-label={label} value={checked ? 'on' : 'off'} disabled={disabled} onValueChange={(next) => next && onChange(next === 'on')}>
      <SegmentedControlIndicator />
      <SegmentedControlItem value="off">Off</SegmentedControlItem>
      <SegmentedControlItem value="on">On</SegmentedControlItem>
    </SegmentedControl>
  )
}

/** One chart knob as a dial row, from frantic's StageBar. */
function KnobRow({ knob, value, onChange }: { knob: Knob; value: KnobValue; onChange: (value: KnobValue) => void }) {
  if (knob.type === 'slider')
    return (
      <Slider
        data-variant="dial"
        className="w-48 max-sm:w-auto"
        value={value as number}
        onValueChange={(next) => onChange(next as number)}
        min={knob.min}
        max={knob.max}
        step={knob.step}
        format={knob.unit ? (n: number) => `${n} ${knob.unit}` : undefined}
      >
        <div className="flex justify-between">
          <span>{knob.label}</span>
          <SliderValue className="tabular-nums" />
        </div>
        <SliderControl>
          <SliderTrack>
            <SliderIndicator />
            <SliderThumb aria-label={knob.label} />
          </SliderTrack>
        </SliderControl>
      </Slider>
    )
  return (
    <div className="dial-row">
      <span aria-hidden="true">{knob.label}</span>
      {knob.type === 'toggle' ? (
        <OnOff label={knob.label} checked={value as boolean} onChange={onChange} />
      ) : (
        <SegmentedControl aria-label={knob.label} value={value as string} onValueChange={(next) => next && onChange(next as string)}>
          <SegmentedControlIndicator />
          {knob.options.map((option) => (
            <SegmentedControlItem key={option} value={option}>{option}</SegmentedControlItem>
          ))}
        </SegmentedControl>
      )}
    </div>
  )
}

/** Bottom left: Replay, the chart's own controls in a row, and the stage's speed and motion behind Controls. */
function ChartBar({ chart, values, onChange, onReplay }: {
  chart: Chart
  values: Record<string, KnobValue>
  onChange: (key: string, value: KnobValue) => void
  onReplay: () => void
}) {
  const { speed, motion, hidden } = useStageState()
  const system = useSystemReducedMotion()
  const [open, setOpen] = useState(false)
  const trigger = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    // Escape closes the panel wherever focus is, and C toggles it; focus inside goes back to the trigger.
    const onKey = (event: KeyboardEvent) => {
      const close = open && event.key === 'Escape' && !event.defaultPrevented
      if (!close && (shortcut(event) !== 'c' || hidden)) return
      if (open && document.activeElement?.closest('[data-slot="collapsible-panel"]')) trigger.current?.focus()
      setOpen(!open)
    }
    addEventListener('keydown', onKey)
    return () => removeEventListener('keydown', onKey)
  }, [hidden, open])

  const knobs = Object.entries(chart.knobs).map(([key, knob]) => (
    <KnobRow key={`${chart.slug}-${key}`} knob={knob} value={values[key]} onChange={(v) => onChange(key, v)} />
  ))

  return (
    <aside aria-label="Chart controls" data-stage-chrome="" className="fixed inset-s-4 bottom-4 z-50 flex items-center gap-2">
      <Button aria-keyshortcuts="R" title="Replay (R)" onClick={onReplay}>
        <Icon name="replay" size={16} />
        <span className="max-sm:sr-only">Replay</span>
      </Button>
      {/* On a phone the chart's own controls move into the panel, so this bar never meets the arrows. */}
      {knobs.length > 0 && <div className="contents max-sm:hidden">{knobs}</div>}
      <Collapsible open={open} onOpenChange={setOpen} className="relative">
        <CollapsibleTrigger ref={trigger} aria-label="Motion" aria-keyshortcuts="C" title="Motion (C)" render={<Button />}>
          <Icon name="sliders" size={16} />
        </CollapsibleTrigger>
        {/* A popup like the menus: 4px from its trigger, 4px inset, 32px rows, corner 10 and rows 6 inside it. */}
        <CollapsiblePanel
          render={<section aria-label="Motion" />}
          className="absolute inset-s-0 bottom-full mb-1 flex w-72 flex-col gap-1 rounded-group bg-surface-3 p-1 shadow-strong [--row-radius:var(--radius-chip)]"
        >
          {knobs.length > 0 && (
            <div className="contents sm:hidden">
              {knobs}
              <div className="h-px bg-line" />
            </div>
          )}
          <div className="dial-row">
            <span aria-hidden="true">Speed</span>
            <SegmentedControl aria-label="Speed" value={String(speed)} onValueChange={(next) => next && setStage({ speed: Number(next) as Speed })}>
              <SegmentedControlIndicator />
              {SPEEDS.map(([value, text, name]) => (
                <SegmentedControlItem key={value} value={value} aria-label={name}>{text}</SegmentedControlItem>
              ))}
            </SegmentedControl>
          </div>
          <div className="dial-row">
            <span aria-hidden="true">
              Reduced motion
              {system && <span className="text-fg-subtle"> · system</span>}
            </span>
            <OnOff label="Reduced motion" checked={motion || system} disabled={system} onChange={(next) => setStage({ motion: next })} />
          </div>
        </CollapsiblePanel>
      </Collapsible>
    </aside>
  )
}
