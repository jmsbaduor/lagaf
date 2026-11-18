// Theme ids must match the :root[data-theme="..."] blocks in src/styles/themes.css.
export const themes = [
  { id: "default", label: "Neutral" },
  { id: "harbour", label: "Harbour" },
  { id: "signal", label: "Signal" },
] as const

export type ThemeId = (typeof themes)[number]["id"]
