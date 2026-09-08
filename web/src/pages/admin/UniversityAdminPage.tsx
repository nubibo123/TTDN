import { useState, useEffect } from 'react';
import { GraduationCap, Plus, LoaderCircle, Globe, MapPin, CheckCircle2, Pencil, Trash2 } from 'lucide-react';
import { universityService, type University } from '@/lib/universityService';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Input, Select } from '@/components/ui/Input';
import { Avatar } from '@/components/ui/Avatar';
import { AdminPageHeader } from '@/components/admin/AdminPageHeader';
import { AdminModal } from '@/components/admin/AdminModal';
import { ConfirmDialog } from '@/components/admin/ConfirmDialog';
import { Pagination } from '@/components/admin/Pagination';
import { AdminEmptyState } from '@/components/admin/AdminEmptyState';
import { AdminSearchInput } from '@/components/admin/AdminSearchInput';
import { IconButton } from '@/components/admin/IconButton';
import { useToast } from '@/components/ui/Toast';

const regionLabel: Record<string, string> = { NORTH: 'Miền Bắc', CENTRAL: 'Miền Trung', SOUTH: 'Miền Nam' };
const typeLabel: Record<string, string> = {
  PUBLIC: 'Công lập',
  PRIVATE: 'Tư thục',
  NATIONAL: 'Quốc gia',
  INTERNATIONAL: 'Quốc tế',
};

function RegionBadge({ region }: { region?: string }) {
  const map: Record<string, { label: string; variant: 'default' | 'gold' | 'navy' }> = {
    NORTH: { label: 'Miền Bắc', variant: 'navy' },
    CENTRAL: { label: 'Miền Trung', variant: 'gold' },
    SOUTH: { label: 'Miền Nam', variant: 'default' },
  };
  const v = map[region || ''] || { label: region || '-', variant: 'default' as const };
  return <Badge variant={v.variant}>{v.label}</Badge>;
}

function TypeBadge({ type }: { type?: string }) {
  const map: Record<string, { label: string; variant: 'success' | 'warning' | 'navy' | 'gold' }> = {
    PUBLIC: { label: 'Công lập', variant: 'success' },
    PRIVATE: { label: 'Tư thục', variant: 'warning' },
    NATIONAL: { label: 'Quốc gia', variant: 'navy' },
    INTERNATIONAL: { label: 'Quốc tế', variant: 'gold' },
  };
  const v = map[type || ''] || { label: type || '-', variant: 'success' as const };
  return <Badge variant={v.variant}>{v.label}</Badge>;
}

export default function UniversityAdminPage() {
  const [universities, setUniversities] = useState<University[]>([]);
  const [loading, setLoading] = useState(false);
  const [totalElements, setTotalElements] = useState(0);
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [searchInput, setSearchInput] = useState('');
  const [keyword, setKeyword] = useState('');
  const [regionFilter, setRegionFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState('');

  const [modalOpen, setModalOpen] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<University | null>(null);
  const [currentUni, setCurrentUni] = useState<Partial<University>>({});

  const toast = useToast();

  useEffect(() => {
    fetchUniversities();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchUniversities = async (p = page, q = keyword, region = regionFilter, type = typeFilter) => {
    setLoading(true);
    try {
      const res = await universityService.getAllUniversities(p, 10, q, region || undefined, type || undefined);
      setUniversities(res.content);
      setTotalPages(res.totalPages);
      setTotalElements(res.totalElements);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setKeyword(searchInput);
    setPage(0);
    fetchUniversities(0, searchInput);
  };

  const handleRegionFilter = (value: string) => {
    setRegionFilter(value);
    setPage(0);
    fetchUniversities(0, keyword, value, typeFilter);
  };

  const handleTypeFilter = (value: string) => {
    setTypeFilter(value);
    setPage(0);
    fetchUniversities(0, keyword, regionFilter, value);
  };

  const openCreate = () => {
    setCurrentUni({ code: '', name: '', region: 'NORTH', type: 'PUBLIC', address: '' });
    setModalOpen(true);
  };

  const openEdit = (uni: University) => {
    setCurrentUni({ ...uni });
    setModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    try {
      if (currentUni.id) {
        await universityService.updateUniversity(currentUni.id, currentUni as University);
      } else {
        await universityService.createUniversity(currentUni as University);
      }
      setModalOpen(false);
      fetchUniversities();
      toast.success(currentUni.id ? 'Trường đã cập nhật' : 'Trường đã thêm thành công');
    } catch (error) {
      toast.error(
        'Lưu thất bại',
        error instanceof Error ? error.message : 'Kiểm tra lại mã trường bị trùng hoặc thiếu trường bắt buộc.'
      );
    } finally {
      setBusy(false);
    }
  };

  const requestDelete = (uni: University) => {
    setDeleteTarget(uni);
    setConfirmOpen(true);
  };

  const handleDelete = async () => {
    if (!deleteTarget?.id) return;
    setBusy(true);
    try {
      await universityService.deleteUniversity(deleteTarget.id);
      setConfirmOpen(false);
      fetchUniversities();
      toast.success('Trường đã xóa', deleteTarget.name);
    } catch (error) {
      toast.error(
        'Xóa thất bại',
        error instanceof Error ? error.message : 'Trường này có thể đang chứa dữ liệu ngành học.'
      );
    } finally {
      setBusy(false);
      setDeleteTarget(null);
    }
  };

  const field = (label: string, value: string | undefined, onChange: (v: string) => void, required = false) => (
    <Input
      label={label}
      value={value || ''}
      required={required}
      onChange={(e) => onChange(e.target.value)}
    />
  );

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="Quản lý Trường Đại học"
        description={`Đang quản lý ${totalElements.toLocaleString('vi-VN')} trường trong hệ thống`}
        icon={<GraduationCap className="h-6 w-6" />}
      >
        <form onSubmit={handleSearch} className="flex w-full gap-2 sm:max-w-md">
          <AdminSearchInput
            value={searchInput}
            onChange={setSearchInput}
            placeholder="Tìm theo mã hoặc tên trường..."
          />
          <Button type="submit" className="bg-gold-500 text-white hover:bg-gold-600">
            Tìm
          </Button>
        </form>
        <Button onClick={openCreate} className="bg-gold-500 text-white hover:bg-gold-600">
          <Plus className="h-4 w-4" /> Thêm trường
        </Button>
      </AdminPageHeader>

      {/* Filters */}
      <div className="flex flex-wrap items-end gap-3">
        <div className="w-full sm:w-48">
          <Select
            label="Khu vực"
            value={regionFilter}
            onChange={(e) => handleRegionFilter(e.target.value)}
            options={[
              { value: '', label: 'Tất cả khu vực' },
              { value: 'NORTH', label: 'Miền Bắc' },
              { value: 'CENTRAL', label: 'Miền Trung' },
              { value: 'SOUTH', label: 'Miền Nam' },
            ]}
          />
        </div>
        <div className="w-full sm:w-48">
          <Select
            label="Loại hình"
            value={typeFilter}
            onChange={(e) => handleTypeFilter(e.target.value)}
            options={[
              { value: '', label: 'Tất cả loại hình' },
              { value: 'PUBLIC', label: 'Công lập' },
              { value: 'PRIVATE', label: 'Tư thục' },
              { value: 'NATIONAL', label: 'Quốc gia' },
              { value: 'INTERNATIONAL', label: 'Quốc tế' },
            ]}
          />
        </div>
      </div>

      <div className="overflow-hidden rounded-2xl border border-cream-200 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-cream-200 bg-cream-50 text-xs font-semibold uppercase tracking-wide text-slate-500">
                <th className="px-6 py-3.5">Trường</th>
                <th className="px-4 py-3.5">Mã</th>
                <th className="px-4 py-3.5">Khu vực</th>
                <th className="px-4 py-3.5">Loại hình</th>
                <th className="px-4 py-3.5">Trạng thái</th>
                <th className="px-4 py-3.5">Website</th>
                <th className="px-4 py-3.5 text-right">Thao tác</th>
              </tr>
            </thead>


            <tbody>
              {loading ? (
                Array.from({ length: 6 }).map((_, i) => (
                  <tr key={i} className="border-b border-cream-100">
                    {Array.from({ length: 7 }).map((__, j) => (
                      <td key={j} className="px-4 py-4">
                        <div className="skeleton h-4 w-24" />
                      </td>
                    ))}
                  </tr>
                ))
              ) : universities.length === 0 ? (
                <tr>
                  <td colSpan={7}>
                    <AdminEmptyState
                      description={keyword ? 'Không tìm thấy trường phù hợp với bộ lọc.' : 'Chưa có trường nào trong hệ thống.'}
                      action={
                        <Button onClick={openCreate} className="bg-navy-800 text-cream-50 hover:bg-navy-700">
                          <Plus className="h-4 w-4" /> Thêm trường đầu tiên
                        </Button>
                      }
                    />
                  </td>
                </tr>
              ) : (
                universities.map((uni) => (
                  <tr key={uni.id} className="border-b border-cream-100 transition-colors hover:bg-cream-50">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <Avatar name={uni.name || 'T'} size="md" />
                        <div className="min-w-0">
                          <p className="font-semibold text-navy-800">{uni.name}</p>
                          {uni.address && (
                            <p className="flex items-center gap-1 text-xs text-slate-500">
                              <MapPin className="h-3 w-3" /> {uni.address}
                            </p>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <span className="font-mono text-sm text-navy-700">{uni.code}</span>
                    </td>
                    <td className="px-4 py-4"><RegionBadge region={uni.region} /></td>
                    <td className="px-4 py-4"><TypeBadge type={uni.type} /></td>
                    <td className="px-4 py-4">
                      {uni.isVerified ? (
                        <Badge variant="success"><CheckCircle2 className="h-3 w-3" /> Đã xác minh</Badge>
                      ) : (
                        <Badge variant="warning">Chưa xác minh</Badge>
                      )}
                    </td>
                    <td className="px-4 py-4">
                      {uni.websiteUrl ? (
                        <a
                          href={uni.websiteUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-1 text-sm text-navy-600 hover:text-gold-600"
                        >
                          <Globe className="h-3.5 w-3.5" /> Truy cập
                        </a>
                      ) : (
                        <span className="text-sm text-slate-300">—</span>
                      )}
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex justify-end gap-1.5">
                        <IconButton
                          variant="edit"
                          label="Sửa trường"
                          onClick={() => openEdit(uni)}
                        >
                          <Pencil className="h-4 w-4" />
                        </IconButton>
                        <IconButton
                          variant="delete"
                          label="Xóa trường"
                          onClick={() => requestDelete(uni)}
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
        onPageChange={(p) => { setPage(p); fetchUniversities(p); }}
      />

      <AdminModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={currentUni.id ? 'Cập nhật trường' : 'Thêm trường mới'}
        subtitle="Thông tin cơ bản về trường đại học"
        footer={
          <>
            <Button type="button" variant="outline" onClick={() => setModalOpen(false)} disabled={busy}>
              Hủy
            </Button>
            <Button form="uni-form" type="submit" disabled={busy} className="min-w-[8.5rem] gap-2">
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
        <form id="uni-form" onSubmit={handleSave} className="space-y-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {field('Mã trường (*)', currentUni.code, (v) => setCurrentUni({ ...currentUni, code: v }), true)}
            {field('Tên trường (*)', currentUni.name, (v) => setCurrentUni({ ...currentUni, name: v }), true)}
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Select
              label="Khu vực"
              value={currentUni.region || 'NORTH'}
              onChange={(e) => setCurrentUni({ ...currentUni, region: e.target.value as University['region'] })}
              options={[
                { value: 'NORTH', label: 'Miền Bắc' },
                { value: 'CENTRAL', label: 'Miền Trung' },
                { value: 'SOUTH', label: 'Miền Nam' },
              ]}
            />
            <Select
              label="Loại hình"
              value={currentUni.type || 'PUBLIC'}
              onChange={(e) => setCurrentUni({ ...currentUni, type: e.target.value as University['type'] })}
              options={[
                { value: 'PUBLIC', label: 'Công lập' },
                { value: 'PRIVATE', label: 'Tư thục' },
                { value: 'NATIONAL', label: 'Quốc gia' },
                { value: 'INTERNATIONAL', label: 'Quốc tế' },
              ]}
            />
          </div>
          {field('Địa chỉ', currentUni.address, (v) => setCurrentUni({ ...currentUni, address: v }))}
          {field('Website', currentUni.websiteUrl, (v) => setCurrentUni({ ...currentUni, websiteUrl: v }))}
        </form>
      </AdminModal>

      <ConfirmDialog
        open={confirmOpen}
        title="Xóa trường đại học"
        message={`Bạn có chắc chắn muốn xóa trường "${deleteTarget?.name}"? Hành động này không thể hoàn tác.`}
        busy={busy}
        onConfirm={handleDelete}
        onClose={() => { setConfirmOpen(false); setDeleteTarget(null); }}
      />
    </div>
  );
}
