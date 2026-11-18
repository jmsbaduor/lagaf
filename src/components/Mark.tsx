import { cn } from '@/lib/utils'

/**
 * The lagaf mark, Pair: two cells on a 16-unit box, ink below left and the accent above right.
 * At 16 px a unit is a pixel. Colours are the chart roles, so it follows the accent and the theme.
 * `loading` passes the accent between the cells (1.2 s); reduced motion holds it at rest. Styles: global.css, section 8.
 */
export function Mark({ size = 16, loading, label, className }: { size?: number; loading?: boolean; label?: string; className?: string }) {
  return (
    <svg
      viewBox="0 0 16 16"
      width={size}
      height={size}
      shapeRendering="crispEdges"
      className={cn('mark shrink-0', loading && 'mark-loading', className)}
      {...(label ? { role: 'img', 'aria-label': label } : { 'aria-hidden': true })}
    >
      <rect className="mark-ink" x="0" y="9" width="7" height="7" />
      <rect className="mark-ink" x="9" y="0" width="7" height="7" />
      <rect className="mark-accent mark-a" x="0" y="9" width="7" height="7" />
      <rect className="mark-accent mark-b" x="9" y="0" width="7" height="7" />
    </svg>
  )
}

/** The mark and the word, the word's x-height top level with the mark's top. */
export function Lockup({ size = 24, className }: { size?: number; className?: string }) {
  return (
    <span className={cn('inline-flex items-end font-medium leading-none tracking-[-0.035em]', className)} style={{ fontSize: Math.round(size / 0.71), gap: size / 4 }}>
      <Mark size={size} />
      <span className="translate-y-[0.06em]">lagaf</span>
    </span>
  )
}
