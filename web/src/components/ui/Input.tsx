import React from 'react'
import { cn } from '@/lib/utils'

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
  hint?: string
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, hint, className, id, ...props }, ref) => {
    const inputId = id || label?.toLowerCase().replace(/\s+/g, '-')
    return (
      <div className="flex flex-col gap-1.5">
        {label && (
          <label htmlFor={inputId} className="text-sm font-semibold text-navy-800">
            {label}
          </label>
        )}
        <div className={cn(
          'rounded-xl border bg-white overflow-hidden',
          error ? 'border-red-400' : 'border-cream-200'
        )}>
          <div className="input-focus">
            <input
              ref={ref}
              id={inputId}
              className={cn(
                'w-full px-4 py-2.5 text-navy-800 text-sm bg-transparent',
                'placeholder:text-slate-400',
                'focus:outline-none',
                className
              )}
              {...props}
            />
          </div>
        </div>
        {hint && !error && <p className="text-xs text-slate-400">{hint}</p>}
        {error && <p className="text-xs text-red-500">{error}</p>}
      </div>
    )
  }
)
Input.displayName = 'Input'

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string
  options: { value: string; label: string }[]
}

export const Select = React.forwardRef<HTMLSelectElement, SelectProps>(
  ({ label, options, className, id, ...props }, ref) => {
    const selectId = id || label?.toLowerCase().replace(/\s+/g, '-')
    return (
      <div className="flex flex-col gap-1.5">
        {label && (
          <label htmlFor={selectId} className="text-sm font-medium text-navy-800">
            {label}
          </label>
        )}
        <select
          ref={ref}
          id={selectId}
          className={cn(
            'w-full px-4 py-2.5 rounded-xl border bg-white text-navy-800 text-sm appearance-none cursor-pointer',
            'focus:outline-none focus:ring-2 focus:ring-gold-400 focus:border-gold-400',
            'border-cream-200 hover:border-navy-600 transition-colors duration-200',
            className
          )}
          {...props}
        >
          {options.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      </div>
    )
  }
)
Select.displayName = 'Select'