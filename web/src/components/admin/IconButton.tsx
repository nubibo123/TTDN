import type { ButtonHTMLAttributes } from 'react'
import { cn } from '@/lib/utils'

type IconButtonVariant = 'edit' | 'delete' | 'view' | 'ghost'

interface IconButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: IconButtonVariant
  /** Tooltip + aria-label cho nút dạng icon. */
  label: string
}

const variants: Record<IconButtonVariant, string> = {
  edit: 'border-cream-200 bg-white text-navy-600 hover:border-gold-400 hover:bg-gold-400/10 hover:text-gold-600',
  delete: 'border-cream-200 bg-white text-red-500 hover:border-red-300 hover:bg-red-50 hover:text-red-600',
  view: 'border-cream-200 bg-white text-navy-600 hover:border-navy-600/40 hover:bg-navy-600/5 hover:text-navy-800',
  ghost: 'border-transparent bg-transparent text-slate-400 hover:bg-cream-100 hover:text-navy-700',
}

export function IconButton({ variant = 'view', label, className, children, ...props }: IconButtonProps) {
  return (
    <button
      type="button"
      title={label}
      aria-label={label}
      className={cn(
        'inline-flex h-9 w-9 cursor-pointer items-center justify-center rounded-lg border transition-all duration-150',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-500 focus-visible:ring-offset-1',
        'disabled:cursor-not-allowed disabled:opacity-50',
        variants[variant],
        className
      )}
      {...props}
    >
      {children}
    </button>
  )
}