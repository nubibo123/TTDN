import { useState, useEffect } from 'react';
import { BarChart3, Plus, Pencil, Trash2, Trophy, LoaderCircle } from 'lucide-react';
import { admissionScoreService, type AdmissionScore } from '@/lib/admissionScoreService';
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

const methodVariant: Record<string, 'success' | 'gold' | 'navy' | 'warning' | 'default'> = {
  'Điểm thi THPT': 'navy',
  'Điểm xét tuyển': 'gold',
  'Chuẩn đầu vào': 'success',
};

export default function AdmissionScoreAdminPage() {
  const [scores, setScores] = useState<AdmissionScore[]>([]);
  const [majors, setMajors] = useState<Major[]>([]);
  const [universities, setUniversities] = useState<University[]>([]);
  const [loading, setLoading] = useState(false);
  const [totalElements, setTotalElements] = useState(0);
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [searchInput, setSearchInput] = useState('');
  const [keyword, setKeyword] = useState('');
  const [yearFilter, setYearFilter] = useState('');
  const [methodFilter, setMethodFilter] = useState('');
  const [universityFilter, setUniversityFilter] = useState('');

  const [modalOpen, setModalOpen] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<AdmissionScore | null>(null);
  const [currentScore, setCurrentScore] = useState<Partial<AdmissionScore>>({});

  const toast = useToast();

  useEffect(() => { fetchScores(); }, []); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => { fetchMajors(); }, []); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => {
    universityService.getAllUniversities(0, 200)
      .then((res) => setUniversities(res.content))
      .catch(() => {});
  }, []);

  const fetchScores = async (p = page, q = keyword, year = yearFilter, method = methodFilter, uni = universityFilter) => {
    setLoading(true);
    try {
      const res = await admissionScoreService.getAllScores(
        p,
        10,
        q,
        year ? Number(year) : undefined,
        method || undefined,
        uni ? uni : undefined,
      );
      setScores(res.content);
      setTotalPages(res.totalPages);
      setTotalElements(res.totalElements);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const fetchMajors = async () => {
    try {
      const res = await majorService.getAllMajors(0, 500, '');
      setMajors(res.content);
    } catch (error) {
      console.error(error);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setKeyword(searchInput);
    setPage(0);
    fetchScores(0, searchInput);
  };

  const handleYearFilter = (value: string) => {
    const digits = value.replace(/[^0-9]/g, '').slice(0, 4);
    setYearFilter(digits);
    setPage(0);
    fetchScores(0, keyword, digits, methodFilter, universityFilter);
  };

  const handleMethodFilter = (value: string) => {
    setMethodFilter(value);
    setPage(0);
    fetchScores(0, keyword, yearFilter, value, universityFilter);
  };

  const handleUniversityFilter = (value: string) => {
    setUniversityFilter(value);
    setPage(0);
    fetchScores(0, keyword, yearFilter, methodFilter, value);
  };

  const openCreate = () => {
    setCurrentScore({
      year: new Date().getFullYear(),
      method: 'Điểm thi THPT',
      score: 0,
      note: '',
      majorId: majors[0]?.id || '',
    });
    setModalOpen(true);
  };
  const openEdit = (score: AdmissionScore) => { setCurrentScore({ ...score }); setModalOpen(true); };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    try {
      if (currentScore.id) {
        await admissionScoreService.updateScore(currentScore.id, currentScore as AdmissionScore);
      } else {
        await admissionScoreService.createScore(currentScore as AdmissionScore);
      }
      setModalOpen(false);
      fetchScores();
      toast.success(currentScore.id ? 'Điểm chuẩn đã cập nhật' : 'Điểm chuẩn đã thêm thành công');
    } catch (error) {
      toast.error(
        'Lưu thất bại',
        error instanceof Error ? error.message : 'Vui lòng kiểm tra lại thông tin.'
      );
    } finally {
      setBusy(false);
    }
  };

  const requestDelete = (score: AdmissionScore) => { setDeleteTarget(score); setConfirmOpen(true); };
  const handleDelete = async () => {
    if (!deleteTarget?.id) return;
    setBusy(true);
    try {
      await admissionScoreService.deleteScore(deleteTarget.id);
      setConfirmOpen(false);
      fetchScores();
      toast.success('Điểm chuẩn đã xóa', `${deleteTarget?.majorName} (${deleteTarget?.year})`);
    } catch (error) {
      toast.error(
        'Xóa thất bại',
        error instanceof Error ? error.message : 'Điểm chuẩn này có thể đang được tham chiếu.'
      );
    } finally {
      setBusy(false);
      setDeleteTarget(null);
    }
  };

  const fieldNum = (label: string, value: number | undefined, onChange: (v: number) => void, required = false) => (
    <Input
      label={label}
      type="number"
      value={value || ''}
      required={required}
      onChange={(e) => onChange(Number(e.target.value))}
    />
  );

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="Quản lý Điểm chuẩn"
        description={`Đang quản lý ${totalElements.toLocaleString('vi-VN')} bản ghi điểm chuẩn`}
        icon={<BarChart3 className="h-6 w-6" />}
      >
        <form onSubmit={handleSearch} className="flex w-full gap-2 sm:max-w-md">
          <AdminSearchInput
            value={searchInput}
            onChange={setSearchInput}
            placeholder="Tìm theo ngành, trường hoặc năm..."
          />
          <Button type="submit" className="bg-gold-500 text-white hover:bg-gold-600">Tìm</Button>
        </form>
        <Button onClick={openCreate} className="bg-gold-500 text-white hover:bg-gold-600">
          <Plus className="h-4 w-4" /> Thêm điểm
        </Button>
      </AdminPageHeader>

      {/* Filters */}
      <div className="flex flex-wrap items-end gap-3">
        <div className="w-32">
          <Input
            label="Năm"
            type="text"
            inputMode="numeric"
            placeholder="VD: 2025"
            value={yearFilter}
            onChange={(e) => handleYearFilter(e.target.value)}
          />
        </div>
        <div className="w-full sm:w-52">
          <Select
            label="Phương thức"
            value={methodFilter}
            onChange={(e) => handleMethodFilter(e.target.value)}
            options={[
              { value: '', label: 'Tất cả phương thức' },
              { value: 'Điểm thi THPT', label: 'Điểm thi THPT' },
              { value: 'Điểm xét tuyển', label: 'Điểm xét tuyển' },
              { value: 'Chuẩn đầu vào', label: 'Chuẩn đầu vào' },
            ]}
          />
        </div>
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
                <th className="px-4 py-3.5">Trường</th>
                <th className="px-4 py-3.5">Năm</th>
                <th className="px-4 py-3.5">Phương thức</th>
                <th className="px-4 py-3.5">Điểm số</th>
                <th className="px-4 py-3.5 text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                Array.from({ length: 6 }).map((_, i) => (
                  <tr key={i} className="border-b border-cream-100">
                    {Array.from({ length: 6 }).map((__, j) => (
                      <td key={j} className="px-4 py-4"><div className="skeleton h-4 w-24" /></td>
                    ))}
                  </tr>
                ))
              ) : scores.length === 0 ? (
                <tr>
                  <td colSpan={6}>
                    <AdminEmptyState
                      description={keyword ? 'Không tìm thấy điểm chuẩn phù hợp với bộ lọc.' : 'Chưa có điểm chuẩn nào trong hệ thống.'}
                      action={
                        <Button onClick={openCreate} className="bg-navy-800 text-cream-50 hover:bg-navy-700">
                          <Plus className="h-4 w-4" /> Thêm điểm đầu tiên
                        </Button>
                      }
                    />
                  </td>
                </tr>
              ) : (

                scores.map((s) => (
                  <tr key={s.id} className="border-b border-cream-100 transition-colors hover:bg-cream-50">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <Trophy className="h-4 w-4 text-gold-500" />
                        <div>
                          <p className="font-semibold text-navy-800">{s.majorName || '-'}</p>
                          <code className="text-xs text-slate-500">{s.majorCode || ''}</code>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-4 text-slate-600">{s.universityName || <span className="text-slate-300">—</span>}</td>
                    <td className="px-4 py-4"><Badge variant="navy">{s.year}</Badge></td>
                    <td className="px-4 py-4">
                      <Badge variant={methodVariant[s.method] || 'default'}>{s.method}</Badge>
                    </td>
                    <td className="px-4 py-4">
                      <span className="font-mono text-lg font-semibold text-gold-600">{s.score.toFixed(2)}</span>
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex justify-end gap-1.5">
                        <IconButton
                          variant="edit"
                          label="Sửa điểm chuẩn"
                          onClick={() => openEdit(s)}
                        >
                          <Pencil className="h-4 w-4" />
                        </IconButton>
                        <IconButton
                          variant="delete"
                          label="Xóa điểm chuẩn"
                          onClick={() => requestDelete(s)}
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
        onPageChange={(p) => { setPage(p); fetchScores(p); }}
      />

      <AdminModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={currentScore.id ? 'Cập nhật điểm chuẩn' : 'Thêm điểm chuẩn'}
        subtitle="Điền thông tin điểm chuẩn năm nhập học"
        footer={
          <>
            <Button type="button" variant="outline" onClick={() => setModalOpen(false)} disabled={busy}>
              Hủy
            </Button>
            <Button form="score-form" type="submit" disabled={busy} className="min-w-[8.5rem] gap-2">
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
        <form id="score-form" onSubmit={handleSave} className="space-y-4">
          <Select
            label="Ngành học (*)"
            value={currentScore.majorId?.toString() || ''}
            onChange={(e) => setCurrentScore({ ...currentScore, majorId: e.target.value })}
            options={majors.map((m) => ({ value: String(m.id), label: `${m.code} - ${m.name}` }))}
          />
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            {fieldNum('Năm (*)', currentScore.year, (v) => setCurrentScore({ ...currentScore, year: v }), true)}
            {fieldNum('Mức điểm (*)', currentScore.score, (v) => setCurrentScore({ ...currentScore, score: v }), true)}
            <Input
              label="Phương thức (*)"
              value={currentScore.method || ''}
              required
              onChange={(e) => setCurrentScore({ ...currentScore, method: e.target.value })}
            />
          </div>
          <Input
            label="Ghi chú / tiêu chí phụ"
            value={currentScore.note || ''}
            onChange={(e) => setCurrentScore({ ...currentScore, note: e.target.value })}
          />
        </form>
      </AdminModal>

      <ConfirmDialog
        open={confirmOpen}
        title="Xóa điểm chuẩn"
        message={`Bạn có chắc chắn muốn xóa bản ghi điểm chuẩn của "${deleteTarget?.majorName}" (năm ${deleteTarget?.year})? Hành động này không thể hoàn tác.`}
        busy={busy}
        onConfirm={handleDelete}
        onClose={() => { setConfirmOpen(false); setDeleteTarget(null); }}
      />
    </div>
  );
}
