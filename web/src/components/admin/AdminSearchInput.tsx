import { Search } from 'lucide-react'
import { cn } from '@/lib/utils'

interface AdminSearchInputProps {
  value: string
  onChange: (value: string) => void
  placeholder?: string
  className?: string
}

/**
 * Search input dùng chung trên tất cả trang admin — nền kính mờ phù hợp
 * với header gradient navy, đảm bảo sự nhất quán giữa các trang.
 */
export function AdminSearchInput({ value, onChange, placeholder = 'Tìm kiếm...', className }: AdminSearchInputProps) {
  return (
    <div className={cn('relative flex-1', className)}>
      <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-cream-200/70" />
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full rounded-xl border border-white/20 bg-white/10 py-2.5 pl-10 pr-4 text-sm text-cream-50 backdrop-blur-sm transition duration-200 placeholder:text-cream-200/70 focus:border-gold-400 focus:bg-white/15 focus:outline-none focus:ring-2 focus:ring-gold-400/40"
      />
    </div>
  )
}