import { useSyncExternalStore } from 'react'

export const HUES = [
  'lumina',
  'lime', 'red', 'orange', 'amber', 'yellow', 'green', 'emerald', 'teal', 'cyan',
  'sky', 'blue', 'indigo', 'violet', 'purple', 'fuchsia', 'pink', 'rose',
] as const
export type Hue = (typeof HUES)[number]

export type Knob =
  | { type: 'slider'; label: string; value: number; min: number; max: number; step?: number; unit?: string }
  | { type: 'choice'; label: string; value: string; options: readonly string[] }
  | { type: 'toggle'; label: string; value: boolean }
export type Knobs = Record<string, Knob>
export type Values<K extends Knobs> = {
  -readonly [P in keyof K]: K[P] extends { options: readonly (infer O)[] } ? O
    : K[P]['value'] extends number ? number : boolean
}
export type Stage = { accent?: Hue; keys?: false }

export type Speed = 0.25 | 0.5 | 1
type State = { speed: Speed; motion: boolean; hidden: boolean; shortcuts: boolean; status: string }

const SERVER: State = { speed: 1, motion: false, hidden: false, shortcuts: true, status: '' }
let state = SERVER
if (typeof document !== 'undefined') {
  let shortcuts = true
  try { shortcuts = localStorage.getItem('shortcuts') !== 'off' } catch { /* storage blocked: shortcuts stay on */ }
  state = { ...SERVER, shortcuts, hidden: document.documentElement.dataset.chrome === 'off' }
}

const subscribers = new Set<() => void>()
const subscribe = (fn: () => void) => {
  subscribers.add(fn)
  return () => { subscribers.delete(fn) }
}

let frame = 0
// getAnimations() flushes style, so a transition is caught in the frame it starts. Chrome and the grid are left alone.
function pace() {
  const root = document.documentElement
  for (const animation of document.getAnimations()) {
    const target = (animation.effect as KeyframeEffect | null)?.target
    if (!target || target === root || target === document.body || target.closest('[data-stage-chrome], [data-stage-controls]')) continue
    if (animation.playbackRate !== state.speed) animation.playbackRate = state.speed
  }
  frame = state.speed === 1 ? 0 : requestAnimationFrame(pace)
}

function flag(name: string, value: string | null) {
  if (value) document.documentElement.setAttribute(name, value)
  else document.documentElement.removeAttribute(name)
}

export function setStage(patch: Partial<State>) {
  state = { ...state, ...patch }
  if ('motion' in patch) flag('data-motion', state.motion ? 'reduce' : null)
  if ('hidden' in patch) flag('data-chrome', state.hidden ? 'off' : null)
  if ('shortcuts' in patch) {
    try { localStorage.setItem('shortcuts', state.shortcuts ? 'on' : 'off') } catch { /* storage blocked */ }
  }
  if ('speed' in patch && !frame) pace()
  subscribers.forEach((fn) => fn())
}

export function toggleChrome() {
  const hidden = !state.hidden
  setStage({ hidden, status: hidden ? 'Controls hidden, press H to show them' : 'Controls shown' })
}

export const useStageState = () => useSyncExternalStore(subscribe, () => state, () => SERVER)

const QUERY = '(prefers-reduced-motion: reduce)'
const watchSystem = (fn: () => void) => {
  const media = matchMedia(QUERY)
  media.addEventListener('change', fn)
  return () => media.removeEventListener('change', fn)
}
export const useSystemReducedMotion = () =>
  useSyncExternalStore(watchSystem, () => matchMedia(QUERY).matches, () => false)

/** For widgets that advance time in JS: multiply dt by `speed`; under `reducedMotion` draw the settled frame. */
export function useStage() {
  const { speed, motion } = useStageState()
  const system = useSystemReducedMotion()
  return { speed, reducedMotion: motion || system }
}

/** The lowercase key when a single-key shortcut may fire for this event, else null. */
export function shortcut(event: KeyboardEvent) {
  if (!state.shortcuts || event.defaultPrevented || event.metaKey || event.ctrlKey || event.altKey || event.shiftKey) return null
  const target = event.target as Element | null
  if (target?.closest?.('input, textarea, select, [contenteditable], [role="listbox"], [role="combobox"], [data-stage-frame][data-keys="off"]')) return null
  return event.key.toLowerCase()
}
