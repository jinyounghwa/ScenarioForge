'use client'

import { useConfirmStore } from '@/store/confirmStore'
import Icon from './Icon'

export default function ConfirmModal() {
  const options = useConfirmStore((s) => s.options)
  const handleConfirm = useConfirmStore((s) => s.handleConfirm)
  const handleCancel = useConfirmStore((s) => s.handleCancel)

  if (!options) return null

  const variant = options.variant || 'danger'
  const confirmClass =
    variant === 'danger'
      ? 'bg-red-600 hover:bg-red-700'
      : variant === 'warning'
        ? 'bg-amber-600 hover:bg-amber-700'
        : 'bg-indigo-600 hover:bg-indigo-700'

  return (
    <div className="fixed inset-0 z-[90] flex items-center justify-center">
      {/* overlay */}
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={handleCancel} />
      {/* dialog */}
      <div className="relative bg-white dark:bg-slate-800 rounded-2xl shadow-2xl p-6 w-full max-w-md mx-4 animate-[popIn_0.2s_ease-out]">
        <div className="flex items-start gap-4">
          <div
            className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${
              variant === 'danger'
                ? 'bg-red-100 text-red-600 dark:bg-red-900 dark:text-red-300'
                : variant === 'warning'
                  ? 'bg-amber-100 text-amber-600 dark:bg-amber-900 dark:text-amber-300'
                  : 'bg-indigo-100 text-indigo-600 dark:bg-indigo-900 dark:text-indigo-300'
            }`}
          >
            <Icon
              name={
                variant === 'danger'
                  ? 'ri-delete-bin-6-line'
                  : variant === 'warning'
                    ? 'ri-alert-line'
                    : 'ri-question-line'
              }
              size={20}
            />
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100">
              {options.title || '확인'}
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1 leading-relaxed">
              {options.message}
            </p>
          </div>
        </div>
        <div className="flex justify-end gap-3 mt-6">
          <button
            onClick={handleCancel}
            className="px-4 py-2 rounded-xl text-sm font-medium
              bg-gray-100 text-gray-700 hover:bg-gray-200
              dark:bg-slate-700 dark:text-gray-300 dark:hover:bg-slate-600 transition"
          >
            {options.cancelText || '취소'}
          </button>
          <button
            onClick={handleConfirm}
            className={`px-4 py-2 rounded-xl text-sm font-medium text-white transition ${confirmClass}`}
          >
            {options.confirmText || '확인'}
          </button>
        </div>
      </div>
    </div>
  )
}
