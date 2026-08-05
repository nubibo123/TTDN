import type { CSSProperties } from 'react'
import { cn } from '@/lib/utils'

type SkeletonProps = {
  className?: string
  rounded?: 'sm' | 'md' | 'lg' | 'full'
}

export function Skeleton({ className = '', rounded = 'md' }: SkeletonProps) {
  const radius = {
    sm: 'rounded',
    md: 'rounded-lg',
    lg: 'rounded-2xl',
    full: 'rounded-full',
  }[rounded]
  return <div className={cn('mb-skel bg-cream-200/80', radius, className)} aria-hidden />
}

export function SkeletonText({
  lines = 1,
  className = '',
  lastWidth = '70%',
}: {
  lines?: number
  className?: string
  lastWidth?: string
}) {
  return (
    <div className={cn('space-y-2', className)} aria-hidden>
      {Array.from({ length: lines }, (_, i) => {
        const isLast = i === lines - 1 && lines > 1
        return (
          <Skeleton
            key={i}
            className="h-3 w-full"
            rounded="sm"
            {...(isLast ? { className: 'h-3', style: { width: lastWidth } as CSSProperties } : {})}
          />
        )
      })}
    </div>
  )
}

export function SkeletonCard({ className = '' }: { className?: string }) {
  return (
    <div className={cn('p-6 rounded-2xl border border-cream-200 bg-white shadow-sm', className)} aria-hidden>
      <div className="flex items-start gap-4 mb-4">
        <Skeleton rounded="full" className="w-10 h-10 flex-shrink-0" />
        <div className="flex-1 space-y-2">
          <Skeleton className="h-4 w-3/4" />
          <Skeleton className="h-3 w-1/2" />
        </div>
      </div>
      <SkeletonText lines={2} lastWidth="60%" />
      <div className="mt-4 pt-3 border-t border-cream-200 flex items-center justify-between">
        <Skeleton className="h-5 w-16" rounded="full" />
        <Skeleton className="h-3 w-20" />
      </div>
    </div>
  )
}
