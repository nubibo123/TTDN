import type { ReactNode } from 'react';
import { Inbox } from 'lucide-react';

interface AdminEmptyStateProps {
  title?: string;
  description?: string;
  action?: ReactNode;
}

export function AdminEmptyState({
  title = 'Không có dữ liệu',
  description = 'Không tìm thấy bản ghi nào phù hợp. Hãy thử thay đổi bộ lọc hoặc thêm mới.',
  action,
}: AdminEmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center px-6 py-16 text-center">
      <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-cream-200 text-navy-400">
        <Inbox className="h-8 w-8" />
      </div>
      <h3 className="font-display text-lg font-semibold text-navy-800">{title}</h3>
      <p className="mt-1 max-w-sm text-sm text-slate-500">{description}</p>
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}
