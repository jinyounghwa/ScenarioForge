import { create } from 'zustand'

interface ThemeState {
  isDark: boolean
  toggle: () => void
  init: () => void
}

export const useThemeStore = create<ThemeState>((set, get) => ({
  isDark: false,

  toggle: () => {
    const next = !get().isDark
    set({ isDark: next })
    if (typeof document !== 'undefined') {
      document.documentElement.classList.toggle('dark', next)
    }
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem('theme', next ? 'dark' : 'light')
    }
  },

  init: () => {
    if (typeof window === 'undefined') return
    const saved = localStorage.getItem('theme')
    const isDark =
      saved === 'dark' ||
      (!saved && window.matchMedia('(prefers-color-scheme: dark)').matches)
    set({ isDark })
    document.documentElement.classList.toggle('dark', isDark)
  },
}))
