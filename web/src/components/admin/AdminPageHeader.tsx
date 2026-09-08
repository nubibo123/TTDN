import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface AdminPageHeaderProps {
  title: string;
  description?: string;
  icon?: ReactNode;
  children?: ReactNode;
  className?: string;
}

/**
 * Header gradient xanh navi cho các trang admin, kèm dòng tác vụ (search + nút thêm).
 */
export function AdminPageHeader({ title, description, icon, children, className }: AdminPageHeaderProps) {
  return (
    <div
      className={cn(
        'relative overflow-hidden rounded-2xl bg-gradient-to-br from-navy-800 via-navy-700 to-navy-600',
        'text-cream-50 shadow-lg',
        className
      )}
    >
      {/* decorative glow */}
      <div className="pointer-events-none absolute -top-16 -right-16 h-56 w-56 rounded-full bg-gold-500/20 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-20 left-10 h-48 w-48 rounded-full bg-navy-400/20 blur-3xl" />

      <div className="relative z-10 px-6 pt-6 pb-5 sm:px-8">
        <div className="flex items-center gap-3">
          {icon && (
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gold-500/20 text-gold-300">
              {icon}
            </div>
          )}
          <div>
            <h1 className="font-display text-xl font-bold text-cream-50 sm:text-2xl">{title}</h1>
            {description && (
              <p className="mt-0.5 text-sm text-cream-200/90">{description}</p>
            )}
          </div>
        </div>

        {children && (
          <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            {children}
          </div>
        )}
      </div>
    </div>
  );
}
