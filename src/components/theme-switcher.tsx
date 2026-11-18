import { useState } from "react"

import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"
import { themes, type ThemeId } from "@/lib/themes"

export function ThemeSwitcher({ initial = "default" }: { initial?: ThemeId }) {
  const [theme, setTheme] = useState<ThemeId>(initial)

  return (
    <ToggleGroup
      aria-label="Brand"
      variant="outline"
      size="sm"
      spacing={0}
      value={[theme]}
      onValueChange={(value) => {
        const next = value[0] as ThemeId | undefined
        if (!next) return // clicking the active item would clear it; keep one brand selected
        setTheme(next)
        document.documentElement.dataset.theme = next
      }}
    >
      {themes.map((t) => (
        <ToggleGroupItem key={t.id} value={t.id}>
          {t.label}
        </ToggleGroupItem>
      ))}
    </ToggleGroup>
  )
}
