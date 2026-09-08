import { useState, useEffect, useRef } from 'react';
import { List, RefreshCw, Eye, Pin, Lock, Pencil, Trash2 } from 'lucide-react';
import { forumThreadService, type ForumThread, type ModerationResult } from '@/lib/forumThreadService';
import { forumCategoryService, type ForumCategory } from '@/lib/forumCategoryService';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Skeleton } from '@/components/ui/Skeleton';
import { Input, Select } from '@/components/ui/Input';
import { AdminPageHeader } from '@/components/admin/AdminPageHeader';
import { AdminModal } from '@/components/admin/AdminModal';
import { AdminEmptyState } from '@/components/admin/AdminEmptyState';
import { AdminSearchInput } from '@/components/admin/AdminSearchInput';
import { IconButton } from '@/components/admin/IconButton';
import { ConfirmDialog } from '@/components/admin/ConfirmDialog';
import { useToast } from '@/components/ui/Toast';

export default function ForumThreadAdminPage() {
  const [threads, setThreads] = useState<ForumThread[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [refreshKey, setRefreshKey] = useState(0);
  const [searchInput, setSearchInput] = useState('');
  const [keyword, setKeyword] = useState('');
  const [categories, setCategories] = useState<ForumCategory[]>([]);
  const [categoryFilter, setCategoryFilter] = useState('');

  const [aiResult, setAiResult] = useState<ModerationResult | null>(null);
  const [aiBusy, setAiBusy] = useState(false);
  const aiRequest = useRef(0);
  const aiLabels = { allow: 'Hợp lệ', off_topic: 'Lạc chủ đề', spam: 'Quảng cáo / spam', abusive: 'Xúc phạm', needs_review: 'Cần kiểm tra thủ công' };

  const checkAI = async () => {
    if (!viewing?.id || aiBusy) return;
    const request = ++aiRequest.current;
    setAiBusy(true);
    setAiResult(null);
    try {
      const result = await forumThreadService.moderateThread(viewing.id);
      if (request === aiRequest.current) setAiResult(result);
    } catch (error) {
      if (request === aiRequest.current) toast.error('Không kiểm tra được AI', error instanceof Error ? error.message : 'Vui lòng thử lại.');
    } finally {
      if (request === aiRequest.current) setAiBusy(false);
    }
  };

  const [modalOpen, setModalOpen] = useState(false);
  const [viewing, setViewing] = useState<ForumThread | null>(null);

  const [busy, setBusy] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [editing, setEditing] = useState<ForumThread | null>(null);
  const [editForm, setEditForm] = useState({
    title: '',
    content: '',
    categoryId: '',
    isPinned: false,
    isLocked: false,
  });
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<ForumThread | null>(null);
  const toast = useToast();

  useEffect(() => { fetchThreads(); }, [refreshKey, keyword, categoryFilter]); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => {
    forumCategoryService.getAllCategories().then(setCategories).catch(() => {});
  }, []);

  const fetchThreads = async () => {
    setLoading(true);
    try {
      const data = await forumThreadService.getAllThreads(categoryFilter ? categoryFilter : undefined);
      const filtered = keyword
        ? data.filter((t) => t.title?.toLowerCase().includes(keyword.toLowerCase()) || t.authorName?.toLowerCase().includes(keyword.toLowerCase()))
        : data;
      setThreads(filtered);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setKeyword(searchInput);
  };

  const formatDate = (value?: string) => {
    if (!value) return '-';
    return new Date(value).toLocaleString('vi-VN');
  };

  const openView = (thread: ForumThread) => {
    aiRequest.current++;
    setAiResult(null);
    setAiBusy(false);
    setViewing(thread);
    setModalOpen(true);
  };

  const openEdit = (thread: ForumThread) => {
    if (!thread.id) return;
    setEditing(thread);
    setEditForm({
      title: thread.title || '',
      content: thread.content || '',
      categoryId: thread.categoryId ? String(thread.categoryId) : '',
      isPinned: Boolean(thread.isPinned),
      isLocked: Boolean(thread.isLocked),
    });
    setEditOpen(true);
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editing?.id) return;
    setBusy(true);
    try {
      await forumThreadService.updateThread(editing.id, {
        title: editForm.title,
        content: editForm.content,
        categoryId: editForm.categoryId ? editForm.categoryId : undefined,
        isPinned: editForm.isPinned,
        isLocked: editForm.isLocked,
      });
      setEditOpen(false);
      fetchThreads();
      toast.success('Đã cập nhật bài viết', editForm.title);
    } catch (error) {
      toast.error(
        'Cập nhật thất bại',
        error instanceof Error ? error.message : 'Vui lòng thử lại.',
      );
    } finally {
      setBusy(false);
    }
  };

  const requestDelete = (thread: ForumThread) => {
    setDeleteTarget(thread);
    setConfirmOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!deleteTarget?.id) return;
    setBusy(true);
    try {
      await forumThreadService.deleteThread(deleteTarget.id);
      setConfirmOpen(false);
      fetchThreads();
      toast.success('Đã xóa bài viết', deleteTarget.title);
    } catch (error) {
      toast.error(
        'Xóa thất bại',
        error instanceof Error ? error.message : 'Vui lòng thử lại.',
      );
    } finally {
      setBusy(false);
      setDeleteTarget(null);
    }
  };

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="Quản lý Bài viết Diễn đàn"
        description={`Tổng số bài viết: ${threads.length}`}
        icon={<List className="h-6 w-6" />}
      >
        <div className="w-full sm:w-56">
          <Select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            aria-label="Lọc theo danh mục"
            options={[
              { value: '', label: 'Tất cả danh mục' },
              ...categories.map((c) => ({ value: String(c.id), label: c.name })),
            ]}
          />
        </div>
        <form onSubmit={handleSearch} className="flex w-full gap-2 sm:max-w-md">
          <AdminSearchInput
            value={searchInput}
            onChange={setSearchInput}
            placeholder="Tìm theo tiêu đề hoặc tác giả..."
          />
          <Button type="submit" className="bg-gold-500 text-white hover:bg-gold-600">Tìm</Button>
          <Button type="button" variant="ghost" onClick={() => setRefreshKey((k) => k + 1)} aria-label="Làm mới">
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          </Button>
        </form>
      </AdminPageHeader>

      <div className="overflow-hidden rounded-2xl border border-cream-200 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-cream-200 bg-cream-50 text-xs font-semibold uppercase tracking-wide text-slate-500">
                <th className="px-6 py-3.5">Bài viết</th>
                <th className="px-4 py-3.5">Danh mục</th>
                <th className="px-4 py-3.5">Tác giả</th>
                <th className="px-4 py-3.5">Trạng thái</th>
                <th className="px-4 py-3.5">Lượt xem</th>
                <th className="px-4 py-3.5">Ngày tạo</th>
                <th className="px-4 py-3.5 text-right">Chi tiết</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                Array.from({ length: 6 }).map((_, i) => (
                  <tr key={i} className="border-b border-cream-100">
                    {Array.from({ length: 7 }).map((__, j) => (
                      <td key={j} className="px-4 py-4"><Skeleton className="h-4 w-24" /></td>
                    ))}
                  </tr>
                ))
              ) : threads.length === 0 ? (
                <tr>
                  <td colSpan={7}>
                    <AdminEmptyState
                      description={keyword ? 'Không tìm thấy bài viết phù hợp.' : 'Chưa có bài viết nào trong hệ thống.'}
                    />
                  </td>
                </tr>
              ) : (
                threads.map((thread) => (
                  <tr key={thread.id} className="border-b border-cream-100 transition-colors hover:bg-cream-50">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-navy-100 text-navy-700">
                          <span className="text-xs font-bold">#{thread.id}</span>
                        </div>
                        <div className="min-w-0">
                          <p className="font-semibold text-navy-800 line-clamp-1">{thread.title}</p>
                          {thread.replyCount != null && (
                            <p className="text-xs text-slate-500">{thread.replyCount} trả lời</p>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-4 text-slate-600">{thread.categoryName || <span className="text-slate-300">—</span>}</td>
                    <td className="px-4 py-4 text-slate-600">{thread.authorName || <span className="text-slate-300">—</span>}</td>
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-1.5">
                        {thread.isPinned && <Badge variant="gold" size="sm"><Pin className="h-3 w-3" /> Ghim</Badge>}
                        {thread.isLocked && <Badge variant="danger" size="sm"><Lock className="h-3 w-3" /> Khóa</Badge>}
                        {!thread.isPinned && !thread.isLocked && <Badge variant="default" size="sm">Mở</Badge>}
                      </div>
                    </td>
                    <td className="px-4 py-4 text-slate-600">{thread.viewsCount ?? 0}</td>
                    <td className="px-4 py-4 text-slate-600">{formatDate(thread.createdAt)}</td>
                    <td className="px-4 py-4">
                      <div className="flex justify-end gap-1.5">
                        <IconButton
                          variant="view"
                          label="Xem chi tiết"
                          onClick={() => openView(thread)}
                        >
                          <Eye className="h-4 w-4" />
                        </IconButton>
                        <IconButton
                          variant="edit"
                          label="Sửa bài viết"
                          onClick={() => openEdit(thread)}
                        >
                          <Pencil className="h-4 w-4" />
                        </IconButton>
                        <IconButton
                          variant="delete"
                          label="Xóa bài viết"
                          onClick={() => requestDelete(thread)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </IconButton>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <AdminModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={viewing?.title || 'Chi tiết bài viết'}
        subtitle={viewing?.authorName ? `Bởi ${viewing.authorName}` : undefined}
        size="lg"
        footer={
          <Button type="button" variant="outline" onClick={() => setModalOpen(false)}>
            Đóng
          </Button>
        }
      >
        {viewing && (
          <div className="space-y-4 text-sm text-slate-600">
            <div>
              <span className="font-medium text-navy-800">Nội dung:</span>
              <p className="mt-1 whitespace-pre-wrap rounded-xl bg-cream-50 p-4 text-slate-700">
                {viewing.content || <span className="text-slate-300">Không có nội dung</span>}
              </p>
            </div>
            <div className="space-y-3 rounded-xl border border-cream-200 p-4" aria-live="polite">
              <Button type="button" variant="outline" disabled={aiBusy} onClick={checkAI}>
                {aiBusy ? 'Đang kiểm tra…' : 'Kiểm tra AI'}
              </Button>
              <p className="text-xs text-slate-500">AI đưa ra gợi ý để quản trị viên xem xét. Kết quả hiển thị trong lần xem này.</p>
              {aiResult && <div>
                <Badge variant={aiResult.label === 'allow' ? 'success' : aiResult.label === 'needs_review' ? 'default' : 'danger'}>
                  {aiLabels[aiResult.label]}
                </Badge>
                <p className="mt-2 whitespace-pre-wrap">{aiResult.reason}</p>
              </div>}
            </div>
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
              <div><span className="font-medium text-navy-800">ID:</span> {viewing.id}</div>
              <div><span className="font-medium text-navy-800">Danh mục:</span> {viewing.categoryName || `ID ${viewing.categoryId}`}</div>
              <div><span className="font-medium text-navy-800">Lượt xem:</span> {viewing.viewsCount ?? 0}</div>
              <div><span className="font-medium text-navy-800">Trả lời:</span> {viewing.replyCount ?? 0}</div>
              <div><span className="font-medium text-navy-800">Ghim:</span> {viewing.isPinned ? 'Có' : 'Không'}</div>
              <div><span className="font-medium text-navy-800">Khóa:</span> {viewing.isLocked ? 'Có' : 'Không'}</div>
              <div className="sm:col-span-2"><span className="font-medium text-navy-800">Ngày tạo:</span> {formatDate(viewing.createdAt)}</div>
            </div>
          </div>
        )}
      </AdminModal>

      {/* Edit thread */}
      <AdminModal
        open={editOpen}
        onClose={() => setEditOpen(false)}
        title="Chỉnh sửa bài viết"
        subtitle={editing?.authorName ? `Bởi ${editing.authorName}` : undefined}
        size="lg"
        footer={
          <>
            <Button type="button" variant="outline" onClick={() => setEditOpen(false)} disabled={busy}>
              Hủy
            </Button>
            <Button form="thread-edit-form" type="submit" disabled={busy} className="min-w-[8.5rem]">
              Lưu thay đổi
            </Button>
          </>
        }
      >
        <form id="thread-edit-form" onSubmit={handleSaveEdit} className="space-y-4">
          <Input
            label="Tiêu đề (*)"
            value={editForm.title}
            required
            onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
          />
          <Select
            label="Danh mục (*)"
            value={editForm.categoryId}
            required
            onChange={(e) => setEditForm({ ...editForm, categoryId: e.target.value })}
            options={categories.map((c) => ({ value: String(c.id), label: c.name }))}
          />
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-semibold text-navy-800">Nội dung (*)</label>
            <textarea
              required
              rows={8}
              value={editForm.content}
              onChange={(e) => setEditForm({ ...editForm, content: e.target.value })}
              className="w-full px-4 py-2.5 rounded-xl border border-cream-200 bg-white text-navy-800 text-sm focus:outline-none focus:ring-2 focus:ring-gold-400"
            />
          </div>
          <div className="flex flex-wrap gap-2">
            <label className="flex flex-1 cursor-pointer items-center gap-2 rounded-xl border border-cream-200 p-3 text-sm text-navy-800 transition-colors hover:bg-cream-50">
              <input
                type="checkbox"
                className="h-4 w-4 accent-gold-500"
                checked={editForm.isPinned}
                onChange={(e) => setEditForm({ ...editForm, isPinned: e.target.checked })}
              />
              <Pin className="h-3.5 w-3.5" /> Ghim bài viết
            </label>
            <label className="flex flex-1 cursor-pointer items-center gap-2 rounded-xl border border-cream-200 p-3 text-sm text-navy-800 transition-colors hover:bg-cream-50">
              <input
                type="checkbox"
                className="h-4 w-4 accent-gold-500"
                checked={editForm.isLocked}
                onChange={(e) => setEditForm({ ...editForm, isLocked: e.target.checked })}
              />
              <Lock className="h-3.5 w-3.5" /> Khóa bài viết
            </label>
          </div>
        </form>
      </AdminModal>

      {/* Delete confirm */}
      <ConfirmDialog
        open={confirmOpen}
        title="Xóa bài viết"
        message={`Bạn có chắc chắn muốn xóa bài viết "${deleteTarget?.title}"? Toàn bộ trả lời trong chủ đề này cũng sẽ bị xóa vĩnh viễn.`}
        busy={busy}
        onConfirm={handleDeleteConfirm}
        onClose={() => { setConfirmOpen(false); setDeleteTarget(null); }}
      />
    </div>
  );
}
