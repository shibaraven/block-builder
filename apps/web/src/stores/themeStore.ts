import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface ThemeStore {
  dark: boolean
  toggle: () => void
  setDark: (v: boolean) => void
}

export const useThemeStore = create<ThemeStore>()(
  persist(
    (set) => ({
      dark: false,
      toggle: () => set((s) => {
        const next = !s.dark
        document.documentElement.classList.toggle('dark', next)
        return { dark: next }
      }),
      setDark: (v) => {
        document.documentElement.classList.toggle('dark', v)
        set({ dark: v })
      },
    }),
    { name: 'bb-theme' }
  )
)

// Apply theme on init
export function initTheme() {
  const stored = JSON.parse(localStorage.getItem('bb-theme') || '{"state":{"dark":false}}')
  if (stored?.state?.dark) document.documentElement.classList.add('dark')
}
