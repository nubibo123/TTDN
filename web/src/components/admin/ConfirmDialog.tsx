import { AlertTriangle, LoaderCircle } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { AdminModal } from './AdminModal';

interface ConfirmDialogProps {
  open: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  busy?: boolean;
  onConfirm: () => void;
  onClose: () => void;
}

export function ConfirmDialog({
  open,
  title = 'Xác nhận xóa',
  message,
  confirmLabel = 'Xóa',
  busy = false,
  onConfirm,
  onClose,
}: ConfirmDialogProps) {
  return (
    <AdminModal
      open={open}
      onClose={onClose}
      title={title}
      size="sm"
      footer={
        <>
          <Button type="button" variant="outline" onClick={onClose} disabled={busy}>
            Hủy
          </Button>
          <Button type="button" variant="danger" onClick={onConfirm} disabled={busy} className="min-w-[7.5rem] gap-2">
            {busy ? (
              <>
                <LoaderCircle className="h-4 w-4 animate-spin" />
                Đang xóa...
              </>
            ) : (
              confirmLabel
            )}
          </Button>
        </>
      }
    >
      <div className="flex items-start gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-red-100 text-red-600">
          <AlertTriangle className="h-5 w-5" />
        </div>
        <p className="text-sm text-slate-600 leading-relaxed">{message}</p>
      </div>
    </AdminModal>
  );
}
