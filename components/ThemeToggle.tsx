'use client'

import { useThemeStore } from '@/store/themeStore'
import Icon from './Icon'

export default function ThemeToggle() {
  const isDark = useThemeStore((s) => s.isDark)
  const toggle = useThemeStore((s) => s.toggle)

  return (
    <button
      onClick={toggle}
      className="w-9 h-9 rounded-lg bg-white/10 hover:bg-white/20 flex items-center justify-center transition"
      title={isDark ? '라이트 모드' : '다크 모드'}
    >
      <Icon name={isDark ? 'ri-sun-line' : 'ri-moon-line'} size={18} />
    </button>
  )
}
