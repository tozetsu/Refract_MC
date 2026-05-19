import type { ThemeDefinition, LayoutConfig } from './theme-types'
import { DEFAULT_LAYOUT } from './theme-types'

class ThemeEngine {
  private customStyleTag: HTMLStyleElement | null = null

  apply(theme: ThemeDefinition): void {
    this.applyColors(theme.colors)
    this.applyLayout({ ...DEFAULT_LAYOUT, ...theme.layout })
    this.applyCustomCSS(theme.customCSS ?? '')
  }

  private applyColors(colors: Record<string, string> | object): void {
    const root = document.documentElement
    for (const [key, value] of Object.entries(colors)) {
      if (key === 'radius') {
        // radius is not a Tailwind color — use --radius directly
        root.style.setProperty('--radius', value)
      } else {
        // Tailwind v4 generates bg-*, text-* utilities from --color-* variables
        root.style.setProperty(`--color-${key}`, value)
      }
    }
  }

  private applyLayout(layout: LayoutConfig): void {
    const root = document.documentElement
    root.style.setProperty('--sidebar-width', layout.sidebarWidth)
    root.style.setProperty('--sidebar-collapsed-width', layout.sidebarCollapsedWidth)
    root.style.setProperty('--titlebar-height', layout.titlebarHeight)
    root.style.setProperty('--statusbar-height', layout.statusbarHeight)
  }

  private applyCustomCSS(css: string): void {
    if (!this.customStyleTag) {
      this.customStyleTag = document.createElement('style')
      this.customStyleTag.id = 'refract-theme-custom'
      document.head.appendChild(this.customStyleTag)
    }
    this.customStyleTag.textContent = css
  }
}

export const themeEngine = new ThemeEngine()
