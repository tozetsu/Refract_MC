import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface ThemeStore {
  activeTheme: string
  setTheme: (name: string) => void
}

export const useThemeStore = create<ThemeStore>()(
  persist(
    (set) => ({
      activeTheme: 'default-dark',
      setTheme: (name) => set({ activeTheme: name }),
    }),
    { name: 'refract-theme' }
  )
)
