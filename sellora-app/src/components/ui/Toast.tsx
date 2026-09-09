import React, { createContext, useContext, useState, useCallback } from 'react'
import { CheckCircle, XCircle, AlertTriangle, Info, X } from 'lucide-react'
import type { Toast, ToastType } from '@/types'

interface ToastContextType {
  toasts: Toast[]
  toast: (type: ToastType, title: string, message?: string, duration?: number) => void
  dismiss: (id: string) => void
}

const ToastContext = createContext<ToastContextType | null>(null)

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([])

  const dismiss = useCallback((id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id))
  }, [])

  const toast = useCallback(
    (type: ToastType, title: string, message?: string, duration = 4000) => {
      const id = `toast-${Date.now()}-${Math.random()}`
      const newToast: Toast = { id, type, title, message, duration }
      setToasts(prev => [...prev.slice(-4), newToast]) // max 5 toasts
      if (duration > 0) {
        setTimeout(() => dismiss(id), duration)
      }
    },
    [dismiss]
  )

  return (
    <ToastContext.Provider value={{ toasts, toast, dismiss }}>
      {children}
      <ToastContainer toasts={toasts} onDismiss={dismiss} />
    </ToastContext.Provider>
  )
}

export function useToast() {
  const ctx = useContext(ToastContext)
  if (!ctx) throw new Error('useToast must be inside ToastProvider')
  return ctx
}

// Icons per type
const icons: Record<ToastType, React.ReactNode> = {
  success: <CheckCircle size={16} className="text-green shrink-0" />,
  error:   <XCircle size={16} className="text-red shrink-0" />,
  warning: <AlertTriangle size={16} className="text-gold-deep shrink-0" />,
  info:    <Info size={16} className="text-blue shrink-0" />,
}

const borderColors: Record<ToastType, string> = {
  success: 'border-l-green',
  error:   'border-l-red',
  warning: 'border-l-gold',
  info:    'border-l-blue',
}

function ToastItem({ t, onDismiss }: { t: Toast; onDismiss: (id: string) => void }) {
  return (
    <div
      role="alert"
      aria-live="assertive"
      className={[
        'toast-enter flex items-start gap-3 bg-white border border-sand rounded-[12px]',
        'shadow-lg px-4 py-3.5 border-l-4 min-w-[280px] max-w-[360px]',
        borderColors[t.type],
      ].join(' ')}
    >
      {icons[t.type]}
      <div className="flex-1 min-w-0">
        <p className="text-[13.5px] font-semibold text-ink">{t.title}</p>
        {t.message && <p className="text-[12.5px] text-slate mt-0.5">{t.message}</p>}
      </div>
      <button
        onClick={() => onDismiss(t.id)}
        aria-label="Dismiss"
        className="text-slate hover:text-ink transition-colors shrink-0 p-0.5"
      >
        <X size={14} />
      </button>
    </div>
  )
}

function ToastContainer({ toasts, onDismiss }: { toasts: Toast[]; onDismiss: (id: string) => void }) {
  if (toasts.length === 0) return null

  return (
    <div
      aria-label="Notifications"
      className="fixed bottom-5 right-5 z-[100] flex flex-col gap-2.5 pointer-events-none"
    >
      {toasts.map(t => (
        <div key={t.id} className="pointer-events-auto">
          <ToastItem t={t} onDismiss={onDismiss} />
        </div>
      ))}
    </div>
  )
}
