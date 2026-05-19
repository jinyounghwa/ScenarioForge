import { create } from 'zustand'

export interface ConfirmOptions {
  title?: string
  message: string
  confirmText?: string
  cancelText?: string
  variant?: 'danger' | 'warning' | 'info'
}

interface ConfirmState {
  options: ConfirmOptions | null
  _resolve: ((v: boolean) => void) | null
  confirm: (opts: ConfirmOptions) => Promise<boolean>
  handleConfirm: () => void
  handleCancel: () => void
}

export const useConfirmStore = create<ConfirmState>((set, get) => ({
  options: null,
  _resolve: null,

  confirm: (opts: ConfirmOptions) =>
    new Promise<boolean>((resolve) => {
      set({ options: opts, _resolve: resolve })
    }),

  handleConfirm: () => {
    get()._resolve?.(true)
    set({ options: null, _resolve: null })
  },

  handleCancel: () => {
    get()._resolve?.(false)
    set({ options: null, _resolve: null })
  },
}))
