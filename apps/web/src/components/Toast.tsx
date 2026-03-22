import React, { useEffect, useState } from 'react'
import { create } from 'zustand'
import { CheckCircle, AlertCircle, AlertTriangle, Info, X } from 'lucide-react'
import clsx from 'clsx'

export type ToastType = 'success' | 'error' | 'warning' | 'info'

export interface Toast {
  id: string
  type: ToastType
  message: string
  duration?: number
}

interface ToastStore {
  toasts: Toast[]
  add: (toast: Omit<Toast, 'id'>) => void
  remove: (id: string) => void
}

export const useToastStore = create<ToastStore>((set) => ({
  toasts: [],
  add: (toast) => {
    const id = `toast-${Date.now()}-${Math.random()}`
    set(s => ({ toasts: [...s.toasts.slice(-4), { ...toast, id }] }))
    setTimeout(() => {
      set(s => ({ toasts: s.toasts.filter(t => t.id !== id) }))
    }, toast.duration ?? 3000)
  },
  remove: (id) => set(s => ({ toasts: s.toasts.filter(t => t.id !== id) })),
}))

// ─── Helper functions ─────────────────────────────────────────────────
export const toast = {
  success: (message: string, duration?: number) =>
    useToastStore.getState().add({ type: 'success', message, duration }),
  error: (message: string, duration?: number) =>
    useToastStore.getState().add({ type: 'error', message, duration: duration ?? 5000 }),
  warning: (message: string, duration?: number) =>
    useToastStore.getState().add({ type: 'warning', message, duration }),
  info: (message: string, duration?: number) =>
    useToastStore.getState().add({ type: 'info', message, duration }),
}

// ─── Toast UI ─────────────────────────────────────────────────────────
const TOAST_STYLES: Record<ToastType, { bg: string; border: string; icon: React.ReactNode; text: string }> = {
  success: { bg: 'bg-green-50',  border: 'border-green-200', icon: <CheckCircle  size={14} className="text-green-500 flex-shrink-0" />, text: 'text-green-800' },
  error:   { bg: 'bg-red-50',    border: 'border-red-200',   icon: <AlertCircle  size={14} className="text-red-500 flex-shrink-0" />,   text: 'text-red-800' },
  warning: { bg: 'bg-amber-50',  border: 'border-amber-200', icon: <AlertTriangle size={14} className="text-amber-500 flex-shrink-0" />, text: 'text-amber-800' },
  info:    { bg: 'bg-blue-50',   border: 'border-blue-200',  icon: <Info          size={14} className="text-blue-500 flex-shrink-0" />,  text: 'text-blue-800' },
}

function ToastItem({ t }: { t: Toast }) {
  const [visible, setVisible] = useState(false)
  const remove = useToastStore(s => s.remove)
  const s = TOAST_STYLES[t.type]

  useEffect(() => {
    requestAnimationFrame(() => setVisible(true))
  }, [])

  return (
    <div
      className={clsx(
        'flex items-center gap-2.5 px-4 py-3 rounded-xl border shadow-lg max-w-sm w-full transition-all duration-200',
        s.bg, s.border,
        visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2'
      )}
    >
      {s.icon}
      <p className={clsx('text-sm flex-1 font-medium', s.text)}>{t.message}</p>
      <button
        onClick={() => remove(t.id)}
        className="text-gray-400 hover:text-gray-600 transition-colors flex-shrink-0"
      >
        <X size={13} />
      </button>
    </div>
  )
}

export function ToastContainer() {
  const toasts = useToastStore(s => s.toasts)
  return (
    <div
      className="fixed bottom-4 right-4 z-[100] flex flex-col gap-2 pointer-events-none"
      style={{ maxWidth: 380 }}
    >
      {toasts.map(t => (
        <div key={t.id} className="pointer-events-auto">
          <ToastItem t={t} />
        </div>
      ))}
    </div>
  )
}
