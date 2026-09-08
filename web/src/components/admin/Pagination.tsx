import { ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';

interface PaginationProps {
  page: number; // 0-based
  totalPages: number;
  totalElements?: number;
  pageSize?: number;
  onPageChange: (page: number) => void;
}

export function pageNumbers(page: number, totalPages: number): (number | '…')[] {
  const pages: (number | '…')[] = [];
  for (let i = 0; i < totalPages; i++) {
    if (
      i === 0 ||
      i === totalPages - 1 ||
      Math.abs(i - page) <= 1
    ) {
      pages.push(i);
    } else if (pages[pages.length - 1] !== '…') {
      pages.push('…');
    }
  }
  return pages;
}

export function Pagination({ page, totalPages, totalElements, pageSize = 10, onPageChange }: PaginationProps) {
  if (totalPages <= 1 && totalElements === undefined) return null;

  const nums = pageNumbers(page, totalPages);
  const first = totalElements ? page * pageSize + 1 : 0;
  const last = totalElements ? Math.min((page + 1) * pageSize, totalElements) : 0;

  return (
    <div className="flex flex-col items-center justify-between gap-3 sm:flex-row">
      <p className="text-sm text-slate-500">
        {totalElements !== undefined ? (
          <>
            Hiển thị{' '}
            <span className="font-semibold text-navy-800">
              {first}–{last}
            </span>{' '}
            trong{' '}
            <span className="font-semibold text-navy-800">{totalElements.toLocaleString('vi-VN')}</span>
          </>
        ) : (
          <>
            Trang <span className="font-semibold text-navy-800">{page + 1}</span> / {totalPages}
          </>
        )}
      </p>
      <div className="flex items-center gap-1">
        <button
          onClick={() => onPageChange(page - 1)}
          disabled={page === 0}
          className="flex h-9 w-9 items-center justify-center rounded-lg text-navy-700 transition-colors hover:bg-cream-200 disabled:cursor-not-allowed disabled:opacity-40"
          aria-label="Trước"
        >
          <ChevronLeft className="h-4 w-4" />
        </button>

        {nums.map((n, idx) =>
          n === '…' ? (
            <span key={`e-${idx}`} className="px-1.5 text-slate-400">
              …
            </span>
          ) : (
            <button
              key={n}
              onClick={() => onPageChange(n)}
              className={cn(
                'min-w-9 h-9 rounded-lg px-2 text-sm font-semibold transition-colors',
                n === page
                  ? 'bg-navy-800 text-cream-50 shadow-md'
                  : 'text-navy-700 hover:bg-cream-200'
              )}
            >
              {n + 1}
            </button>
          )
        )}

        <button
          onClick={() => onPageChange(page + 1)}
          disabled={page >= totalPages - 1}
          className="flex h-9 w-9 items-center justify-center rounded-lg text-navy-700 transition-colors hover:bg-cream-200 disabled:cursor-not-allowed disabled:opacity-40"
          aria-label="Sau"
        >
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
