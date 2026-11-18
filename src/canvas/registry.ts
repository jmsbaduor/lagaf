import type { ComponentType } from 'react'

import type { Knobs } from '@/components/stage'

/** Each row folder's ideas.ts default export. */
export type Ideas = { row: number; line: string; frames: [file: string, idea: string][] }

/** A chart file: the frame as its default export, and optional knobs for the stage's bottom bar (frantic's pattern). */
type ChartModule = { default: ComponentType<Record<string, unknown>>; knobs?: Knobs }

export type Row = { number: number; title: string; line: string }
export type Chart = {
  slug: string
  title: string
  idea: string
  row: Row
  Component: ComponentType<Record<string, unknown>>
  knobs: Knobs
}

// Row folders: src/canvas/<set>/<NN>-<topic>/ with ideas.ts and one .tsx per frame. Two sets: `data` (the charts,
// at /<slug>) and `brand` (the brand exploration, at /brand/<slug>), each shown on the same stage.
// ponytail: eager globs put every frame in one bundle, as frantic does; switch to lazy + use() when load time hurts.
const dataIdeas = import.meta.glob<Ideas>('./data/[0-9][0-9]-*/ideas.ts', { eager: true, import: 'default' })
const dataModules = import.meta.glob<ChartModule>('./data/[0-9][0-9]-*/*.tsx', { eager: true })
const brandIdeas = import.meta.glob<Ideas>('./brand/[0-9][0-9]-*/ideas.ts', { eager: true, import: 'default' })
const brandModules = import.meta.glob<ChartModule>('./brand/[0-9][0-9]-*/*.tsx', { eager: true })

const titleOf = (name: string) => (name[0].toUpperCase() + name.slice(1)).replaceAll('-', ' ')

/** A set's frames, in row order then ideas.ts order. The slug is the file name, so it must be unique in its set. */
function collect(ideas: Record<string, Ideas>, modules: Record<string, ChartModule>): Chart[] {
  const list = Object.entries(ideas)
  .sort(([, a], [, b]) => a.row - b.row)
  .flatMap(([path, idea]) => {
    const dir = path.slice(0, path.lastIndexOf('/'))
    const folder = dir.slice(dir.lastIndexOf('/') + 1)
    const row = { number: idea.row, title: titleOf(folder.slice(3)), line: idea.line }
    return idea.frames.map(([file, text]) => {
      const mod = modules[`${dir}/${file}.tsx`]
      if (!mod) throw new Error(`${folder}/ideas.ts lists "${file}" but ${file}.tsx is missing`)
      return { slug: file, title: titleOf(file), idea: text, row, Component: mod.default, knobs: mod.knobs ?? {} }
    })
  })
  const seen = new Set<string>()
  for (const c of list) {
    if (seen.has(c.slug)) throw new Error(`Two frames are called "${c.slug}"; rename one file`)
    seen.add(c.slug)
  }
  return list
}

export type SetName = 'data' | 'brand'
export type FrameSet = { name: SetName; title: string; base: string; items: Chart[]; rows: Row[] }

function frameSet(name: SetName, title: string, base: string, items: Chart[]): FrameSet {
  return { name, title, base, items, rows: [...new Map(items.map((c) => [c.row.number, c.row])).values()] }
}

export const sets: Record<SetName, FrameSet> = {
  data: frameSet('data', 'Charts', '', collect(dataIdeas, dataModules)),
  brand: frameSet('brand', 'Brand', '/brand', collect(brandIdeas, brandModules)),
}
export const charts = sets.data.items
