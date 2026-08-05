import React from 'react'
import { cn } from '@/lib/utils'

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger'
  size?: 'sm' | 'md' | 'lg'
  children: React.ReactNode
}

export function Button({
  variant = 'primary',
  size = 'md',
  className,
  children,
  ...props
}: ButtonProps) {
  const base = 'inline-flex items-center justify-center font-semibold rounded-xl transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-500 focus-visible:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer btn-animate'

  const variants = {
    primary: 'bg-gold-500 text-white hover:bg-gold-600 active:scale-[0.98] shadow-sm',
    secondary: 'bg-navy-800 text-cream-100 hover:bg-navy-700 active:scale-[0.98]',
    outline: 'border-2 border-navy-800 text-navy-800 hover:bg-navy-800 hover:text-cream-100',
    ghost: 'text-navy-800 hover:bg-cream-200',
    danger: 'bg-red-500 text-white hover:bg-red-600',
  }

  const sizes = {
    sm: 'text-sm px-4 py-2 h-9',
    md: 'text-sm px-5 py-2.5 h-11',
    lg: 'text-base px-7 py-3.5 h-13',
  }

  return (
    <button
      className={cn(base, variants[variant], sizes[size], className)}
      {...props}
    >
      {children}
    </button>
  )
}