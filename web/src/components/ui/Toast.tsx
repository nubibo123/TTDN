import { createContext, useCallback, useContext, useMemo, useRef, useState, type ReactNode } from 'react'
import { CircleCheck, TriangleAlert, Info, X } from 'lucide-react'
import { cn } from '@/lib/utils'

type ToastType = 'success' | 'error' | 'info'

interface ToastItem {
  id: number
  type: ToastType
  title: string
  message?: string
}

interface ToastContextValue {
  success: (title: string, message?: string) => void
  error: (title: string, message?: string) => void
  info: (title: string, message?: string) => void
}

const ToastContext = createContext<ToastContextValue | null>(null)

export function useToast(): ToastContextValue {
  const ctx = useContext(ToastContext)
  if (!ctx) throw new Error('useToast must be used within ToastProvider')
  return ctx
}

const icons: Record<ToastType, { Icon: typeof CircleCheck; className: string }> = {
  success: { Icon: CircleCheck, className: 'bg-green-100 text-green-600' },
  error: { Icon: TriangleAlert, className: 'bg-red-100 text-red-500' },
  info: { Icon: Info, className: 'bg-navy-600/10 text-navy-600' },
}

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([])
  const nextId = useRef(0)

  const dismiss = useCallback((id: number) => {
    setToasts((prev) => prev.filter((t) => t.id !== id))
  }, [])

  const push = useCallback(
    (type: ToastType, title: string, message?: string) => {
      const id = ++nextId.current
      setToasts((prev) => [...prev.slice(-4), { id, type, title, message }])
      window.setTimeout(() => dismiss(id), 4500)
    },
    [dismiss]
  )

  const value = useMemo<ToastContextValue>(
    () => ({
      success: (t, m) => push('success', t, m),
      error: (t, m) => push('error', t, m),
      info: (t, m) => push('info', t, m),
    }),
    [push]
  )

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div className="pointer-events-none fixed bottom-5 right-5 z-[120] flex w-[min(24rem,calc(100vw-2.5rem))] flex-col gap-2.5">
        {toasts.map((t) => {
          const { Icon, className } = icons[t.type]
          return (
            <div
              key={t.id}
              role="status"
              className="toast-item pointer-events-auto flex items-start gap-3 rounded-2xl border border-cream-200 bg-white p-4 shadow-xl shadow-navy-900/10"
            >
              <span className={cn('flex h-9 w-9 shrink-0 items-center justify-center rounded-full', className)}>
                <Icon className="h-5 w-5" />
              </span>
              <div className="min-w-0 flex-1 pt-0.5">
                <p className="text-sm font-semibold text-navy-800">{t.title}</p>
                {t.message && <p className="mt-0.5 text-xs leading-relaxed text-slate-500">{t.message}</p>}
              </div>
              <button
                onClick={() => dismiss(t.id)}
                className="shrink-0 cursor-pointer rounded-lg p-1 text-slate-400 transition-colors hover:bg-cream-200 hover:text-navy-800"
                aria-label="Đóng thông báo"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          )
        })}
      </div>
    </ToastContext.Provider>
  )
}