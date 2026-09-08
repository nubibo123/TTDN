import { useState, useEffect } from 'react';
import { BookOpen, Plus, Pencil, Trash2, Hash, LoaderCircle } from 'lucide-react';
import { majorService, type Major } from '@/lib/majorService';
import { universityService, type University } from '@/lib/universityService';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Input, Select } from '@/components/ui/Input';
import { AdminPageHeader } from '@/components/admin/AdminPageHeader';
import { AdminModal } from '@/components/admin/AdminModal';
import { ConfirmDialog } from '@/components/admin/ConfirmDialog';
import { Pagination } from '@/components/admin/Pagination';
import { AdminEmptyState } from '@/components/admin/AdminEmptyState';
import { AdminSearchInput } from '@/components/admin/AdminSearchInput';
import { IconButton } from '@/components/admin/IconButton';
import { useToast } from '@/components/ui/Toast';

export default function MajorAdminPage() {
  const [majors, setMajors] = useState<Major[]>([]);
  const [universities, setUniversities] = useState<University[]>([]);
  const [loading, setLoading] = useState(false);
  const [totalElements, setTotalElements] = useState(0);
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [searchInput, setSearchInput] = useState('');
  const [keyword, setKeyword] = useState('');
  const [universityFilter, setUniversityFilter] = useState('');

  const [modalOpen, setModalOpen] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Major | null>(null);
  const [currentMajor, setCurrentMajor] = useState<Partial<Major>>({});

  const toast = useToast();

  useEffect(() => { fetchMajors(); }, []); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => { fetchUniversities(); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const fetchMajors = async (p = page, q = keyword, uni = universityFilter) => {
    setLoading(true);
    try {
      const res = await majorService.getAllMajors(p, 10, q, uni ? uni : undefined);
      setMajors(res.content);
      setTotalPages(res.totalPages);
      setTotalElements(res.totalElements);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const fetchUniversities = async () => {
    try {
      const res = await universityService.getAllUniversities(0, 200, '');
      setUniversities(res.content);
    } catch (error) {
      console.error(error);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setKeyword(searchInput);
    setPage(0);
    fetchMajors(0, searchInput);
  };

  const handleUniversityFilter = (value: string) => {
    setUniversityFilter(value);
    setPage(0);
    fetchMajors(0, keyword, value);
  };

  const openCreate = () => {
    setCurrentMajor({ code: '', name: '', universityId: universities[0]?.id || '' });
    setModalOpen(true);
  };
  const openEdit = (major: Major) => { setCurrentMajor({ ...major }); setModalOpen(true); };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    try {
      if (currentMajor.id) {
        await majorService.updateMajor(currentMajor.id, currentMajor as Major);
      } else {
        await majorService.createMajor(currentMajor as Major);
      }
      setModalOpen(false);
      fetchMajors();
      toast.success(currentMajor.id ? 'Ngành đã cập nhật' : 'Ngành đã thêm thành công');
    } catch (error) {
      toast.error(
        'Lưu thất bại',
        error instanceof Error ? error.message : 'Vui lòng điền đầy đủ mã & tên ngành và chọn trường hợp lệ.'
      );
    } finally {
      setBusy(false);
    }
  };

  const requestDelete = (major: Major) => { setDeleteTarget(major); setConfirmOpen(true); };
  const handleDelete = async () => {
    if (!deleteTarget?.id) return;
    setBusy(true);
    try {
      await majorService.deleteMajor(deleteTarget.id);
      setConfirmOpen(false);
      fetchMajors();
      toast.success('Ngành đã xóa', deleteTarget.name);
    } catch (error) {
      toast.error(
        'Xóa thất bại',
        error instanceof Error ? error.message : 'Ngành này có thể đang chứa dữ liệu liên quan.'
      );
    } finally {
      setBusy(false);
      setDeleteTarget(null);
    }
  };

  const field = (label: string, value: string | undefined, onChange: (v: string) => void, required = false) => (
    <Input label={label} value={value || ''} required={required} onChange={(e) => onChange(e.target.value)} />
  );
  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="Quản lý Ngành học"
        description={`Đang quản lý ${totalElements.toLocaleString('vi-VN')} ngành học`}
        icon={<BookOpen className="h-6 w-6" />}
      >
        <form onSubmit={handleSearch} className="flex w-full gap-2 sm:max-w-md">
          <AdminSearchInput
            value={searchInput}
            onChange={setSearchInput}
            placeholder="Tìm theo mã hoặc tên ngành..."
          />
          <Button type="submit" className="bg-gold-500 text-white hover:bg-gold-600">Tìm</Button>
        </form>
        <Button onClick={openCreate} className="bg-gold-500 text-white hover:bg-gold-600">
          <Plus className="h-4 w-4" /> Thêm ngành
        </Button>
      </AdminPageHeader>

      {/* Filters */}
      <div className="flex flex-wrap items-end gap-3">
        <div className="w-full sm:w-72">
          <Select
            label="Trường đại học"
            value={universityFilter}
            onChange={(e) => handleUniversityFilter(e.target.value)}
            options={[
              { value: '', label: 'Tất cả trường đại học' },
              ...universities.map((u) => ({ value: String(u.id), label: u.name })),
            ]}
          />
        </div>
      </div>

      <div className="overflow-hidden rounded-2xl border border-cream-200 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-cream-200 bg-cream-50 text-xs font-semibold uppercase tracking-wide text-slate-500">
                <th className="px-6 py-3.5">Ngành</th>
                <th className="px-4 py-3.5">Mã ngành</th>
                <th className="px-4 py-3.5">Trường</th>
                <th className="px-4 py-3.5">Tổ hợp môn</th>
                <th className="px-4 py-3.5 text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                Array.from({ length: 6 }).map((_, i) => (
                  <tr key={i} className="border-b border-cream-100">
                    {Array.from({ length: 5 }).map((__, j) => (
                      <td key={j} className="px-4 py-4"><div className="skeleton h-4 w-24" /></td>
                    ))}
                  </tr>
                ))
              ) : majors.length === 0 ? (
                <tr>
                  <td colSpan={5}>
                    <AdminEmptyState
                      description={keyword ? 'Không tìm thấy ngành phù hợp với bộ lọc.' : 'Chưa có ngành nào trong hệ thống.'}
                      action={
                        <Button onClick={openCreate} className="bg-navy-800 text-cream-50 hover:bg-navy-700">
                          <Plus className="h-4 w-4" /> Thêm ngành đầu tiên
                        </Button>
                      }
                    />
                  </td>
                </tr>
              ) : (

                majors.map((major) => (
                  <tr key={major.id} className="border-b border-cream-100 transition-colors hover:bg-cream-50">
                    <td className="px-6 py-4">
                      <div className="min-w-0">
                        <p className="font-semibold text-navy-800">{major.name}</p>
                        <div className="mt-1 flex items-center gap-1.5">
                          <Hash className="h-3 w-3 text-slate-400" />
                          <code className="text-xs text-slate-500">{major.universityName || '-'}</code>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-4"><Badge variant="navy" size="sm">{major.code}</Badge></td>
                    <td className="px-4 py-4 text-slate-600">{major.universityName || <span className="text-slate-300">—</span>}</td>
                    <td className="px-4 py-4 text-slate-500">{major.subjectGroup || <span className="text-slate-300">—</span>}</td>
                    <td className="px-4 py-4">
                      <div className="flex justify-end gap-1.5">
                        <IconButton
                          variant="edit"
                          label="Sửa ngành"
                          onClick={() => openEdit(major)}
                        >
                          <Pencil className="h-4 w-4" />
                        </IconButton>
                        <IconButton
                          variant="delete"
                          label="Xóa ngành"
                          onClick={() => requestDelete(major)}
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

      <Pagination
        page={page}
        totalPages={totalPages}
        totalElements={totalElements}
        pageSize={10}
        onPageChange={(p) => { setPage(p); fetchMajors(p); }}
      />

      <AdminModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={currentMajor.id ? 'Cập nhật ngành' : 'Thêm ngành mới'}
        subtitle="Điền đầy đủ thông tin ngành học"
        footer={
          <>
            <Button type="button" variant="outline" onClick={() => setModalOpen(false)} disabled={busy}>
              Hủy
            </Button>
            <Button form="major-form" type="submit" disabled={busy} className="min-w-[8.5rem] gap-2">
              {busy ? (
                <>
                  <LoaderCircle className="h-4 w-4 animate-spin" />
                  Đang lưu...
                </>
              ) : (
                'Lưu dữ liệu'
              )}
            </Button>
          </>
        }
      >
        <form id="major-form" onSubmit={handleSave} className="space-y-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {field('Mã ngành (*)', currentMajor.code, (v) => setCurrentMajor({ ...currentMajor, code: v }), true)}
            {field('Tên ngành (*)', currentMajor.name, (v) => setCurrentMajor({ ...currentMajor, name: v }), true)}
          </div>
          <Select
            label="Trường Đại học (*)"
            value={currentMajor.universityId?.toString() || ''}
            onChange={(e) => setCurrentMajor({ ...currentMajor, universityId: e.target.value })}
            options={universities.map((u) => ({ value: String(u.id), label: u.name }))}
          />
          {field('Tổ hợp môn', currentMajor.subjectGroup, (v) => setCurrentMajor({ ...currentMajor, subjectGroup: v }))}
          {field('Mô tả', currentMajor.description, (v) => setCurrentMajor({ ...currentMajor, description: v }))}
        </form>
      </AdminModal>

      <ConfirmDialog
        open={confirmOpen}
        title="Xóa ngành học"
        message={`Bạn có chắc chắn muốn xóa ngành "${deleteTarget?.name}"? Hành động này không thể hoàn tác.`}
        busy={busy}
        onConfirm={handleDelete}
        onClose={() => { setConfirmOpen(false); setDeleteTarget(null); }}
      />
    </div>
  );
}
