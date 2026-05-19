'use client'

import { useToastStore } from '@/store/toastStore'
import Icon from './Icon'

export default function ToastContainer() {
  const toasts = useToastStore((s) => s.toasts)
  const remove = useToastStore((s) => s.removeToast)

  if (toasts.length === 0) return null

  const iconMap = {
    success: 'ri-check-line',
    error: 'ri-error-warning-line',
    info: 'ri-information-line',
  }
  const colorMap = {
    success: 'bg-green-600',
    error: 'bg-red-600',
    info: 'bg-indigo-600',
  }

  return (
    <div className="fixed bottom-6 right-6 z-[100] flex flex-col gap-2 max-w-sm">
      {toasts.map((t) => (
        <div
          key={t.id}
          className={`${colorMap[t.type]} text-white px-4 py-3 rounded-xl shadow-lg
            flex items-center gap-3 animate-[slideIn_0.25s_ease-out]`}
        >
          <Icon name={iconMap[t.type]} size={18} />
          <span className="text-sm font-medium flex-1">{t.message}</span>
          <button onClick={() => remove(t.id)} className="opacity-70 hover:opacity-100">
            <Icon name="ri-close-line" size={16} />
          </button>
        </div>
      ))}
    </div>
  )
}
