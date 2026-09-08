import { useState, useEffect } from 'react';
import { Users, UserPlus, Pencil, Lock, Unlock } from 'lucide-react';
import {
  getAdminUsers,
  updateAdminUserRoles,
  updateAdminUserStatus,
  createAdminUser,
  type AdminUser,
} from '@/lib/admin';
import { universityService, type University } from '@/lib/universityService';
import { useAuth } from '@/lib/authContext';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Input, Select } from '@/components/ui/Input';
import { Avatar } from '@/components/ui/Avatar';
import { AdminPageHeader } from '@/components/admin/AdminPageHeader';
import { AdminModal } from '@/components/admin/AdminModal';
import { AdminEmptyState } from '@/components/admin/AdminEmptyState';
import { AdminSearchInput } from '@/components/admin/AdminSearchInput';
import { IconButton } from '@/components/admin/IconButton';
import { useToast } from '@/components/ui/Toast';

const ALL_ROLES = ['STUDENT', 'ADVISOR', 'ADMIN'];

const roleLabel: Record<string, string> = {
  STUDENT: 'Học sinh',
  ADVISOR: 'Tư vấn viên',
  ADMIN: 'Quản trị viên',
};

const roleVariant: Record<string, 'default' | 'gold' | 'navy'> = {
  STUDENT: 'default',
  ADVISOR: 'gold',
  ADMIN: 'navy',
};

export default function UserAdminPage() {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [universities, setUniversities] = useState<University[]>([]);
  const [loading, setLoading] = useState(false);
  const [busy, setBusy] = useState(false);

  const [searchInput, setSearchInput] = useState('');
  const [keyword, setKeyword] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  const [createOpen, setCreateOpen] = useState(false);
  const [form, setForm] = useState({
    name: '',
    email: '',
    password: '',
    role: 'ADVISOR',
    universityId: '',
    title: '',
  });

  const [rolesOpen, setRolesOpen] = useState(false);
  const [rolesTarget, setRolesTarget] = useState<AdminUser | null>(null);
  const [selectedRoles, setSelectedRoles] = useState<string[]>([]);

  const toast = useToast();
  const { user: currentUser } = useAuth();

  useEffect(() => { fetchUsers(); }, []); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => {
    universityService.getAllUniversities(0, 200)
      .then((res) => setUniversities(res.content))
      .catch(() => {});
  }, []);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      setUsers(await getAdminUsers());
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  // Filtering is done client-side: the user list is small enough.
  const kw = keyword.trim().toLowerCase();
  const filteredUsers = users.filter((u) => {
    const matchKeyword =
      !kw ||
      u.name?.toLowerCase().includes(kw) ||
      u.email?.toLowerCase().includes(kw);
    const matchRole = !roleFilter || u.roles.includes(roleFilter);
    const matchStatus =
      !statusFilter || (statusFilter === 'active' ? u.isActive : !u.isActive);
    return Boolean(matchKeyword) && matchRole && matchStatus;
  });

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setKeyword(searchInput);
  };

  const openCreate = () => {
    setForm({ name: '', email: '', password: '', role: 'ADVISOR', universityId: '', title: '' });
    setCreateOpen(true);
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (form.role === 'ADVISOR' && !form.universityId) {
      toast.error('Thiếu thông tin', 'Vui lòng chọn trường đại học cho tư vấn viên.');
      return;
    }
    setBusy(true);
    try {
      await createAdminUser({
        name: form.name,
        email: form.email,
        password: form.password,
        role: form.role as 'ADVISOR' | 'ADMIN',
        universityId: form.universityId ? form.universityId : null,
        title: form.title || undefined,
      });
      setCreateOpen(false);
      fetchUsers();
      toast.success('Tạo tài khoản thành công', `${form.name} • ${form.email}`);
    } catch (error) {
      toast.error(
        'Tạo tài khoản thất bại',
        error instanceof Error ? error.message : 'Email có thể đã tồn tại trong hệ thống.',
      );
    } finally {
      setBusy(false);
    }
  };

  const openRoles = (u: AdminUser) => {
    setRolesTarget(u);
    setSelectedRoles(u.roles.filter((r) => ALL_ROLES.includes(r)));
    setRolesOpen(true);
  };

  const toggleRole = (role: string) => {
    setSelectedRoles((prev) =>
      prev.includes(role) ? prev.filter((r) => r !== role) : [...prev, role],
    );
  };

  const handleSaveRoles = async () => {
    if (!rolesTarget) return;
    if (selectedRoles.length === 0) {
      toast.error('Thiếu thông tin', 'Tài khoản cần ít nhất một vai trò.');
      return;
    }
    setBusy(true);
    try {
      await updateAdminUserRoles(rolesTarget.id, selectedRoles);
      setRolesOpen(false);
      fetchUsers();
      toast.success('Đã cập nhật vai trò', rolesTarget.email);
    } catch (error) {
      toast.error(
        'Cập nhật vai trò thất bại',
        error instanceof Error ? error.message : 'Vui lòng thử lại.',
      );
    } finally {
      setBusy(false);
    }
  };

  const handleToggleActive = async (u: AdminUser) => {
    if (u.isActive && currentUser?.email && u.email === currentUser.email) {
      toast.error('Không thể khóa', 'Bạn không thể khóa chính tài khoản đang đăng nhập.');
      return;
    }
    try {
      await updateAdminUserStatus(u.id, !u.isActive);
      await fetchUsers();
      toast.success(u.isActive ? 'Đã khóa tài khoản' : 'Đã mở khóa tài khoản', u.email);
    } catch (error) {
      toast.error(
        'Thao tác thất bại',
        error instanceof Error ? error.message : 'Vui lòng thử lại.',
      );
    }
  };

  const formatDate = (value?: string) => {
    if (!value) return '-';
    return new Date(value).toLocaleDateString('vi-VN');
  };

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="Quản lý Người dùng"
        description={`Đang quản lý ${filteredUsers.length}/${users.length} tài khoản trong hệ thống`}
        icon={<Users className="h-6 w-6" />}
      >
        <form onSubmit={handleSearch} className="flex w-full gap-2 sm:max-w-md">
          <AdminSearchInput
            value={searchInput}
            onChange={setSearchInput}
            placeholder="Tìm theo tên hoặc email..."
          />
          <Button type="submit" className="bg-gold-500 text-white hover:bg-gold-600">Tìm</Button>
        </form>
        <Button onClick={openCreate} className="bg-gold-500 text-white hover:bg-gold-600">
          <UserPlus className="h-4 w-4" /> Thêm tài khoản
        </Button>
      </AdminPageHeader>

      {/* Filters */}
      <div className="flex flex-wrap items-end gap-3">
        <div className="w-full sm:w-48">
          <Select
            label="Vai trò"
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            options={[
              { value: '', label: 'Tất cả vai trò' },
              ...ALL_ROLES.map((r) => ({ value: r, label: roleLabel[r] })),
            ]}
          />
        </div>
        <div className="w-full sm:w-44">
          <Select
            label="Trạng thái"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            options={[
              { value: '', label: 'Tất cả trạng thái' },
              { value: 'active', label: 'Đang hoạt động' },
              { value: 'inactive', label: 'Đã khóa' },
            ]}
          />
        </div>
      </div>

      <div className="overflow-hidden rounded-2xl border border-cream-200 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-cream-200 bg-cream-50 text-xs font-semibold uppercase tracking-wide text-slate-500">
                <th className="px-6 py-3.5">Người dùng</th>
                <th className="px-4 py-3.5">Vai trò</th>
                <th className="px-4 py-3.5">Trạng thái</th>
                <th className="px-4 py-3.5">Ngày tạo</th>
                <th className="px-4 py-3.5 text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                Array.from({ length: 6 }).map((_, i) => (
                  <tr key={i} className="border-b border-cream-100">
                    {Array.from({ length: 5 }).map((__, j) => (
                      <td key={j} className="px-4 py-4">
                        <div className="skeleton h-4 w-24" />
                      </td>
                    ))}
                  </tr>
                ))
              ) : filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={5}>
                    <AdminEmptyState
                      description={
                        users.length === 0
                          ? 'Chưa có người dùng nào trong hệ thống.'
                          : 'Không tìm thấy người dùng phù hợp.'
                      }
                    />
                  </td>
                </tr>
              ) : (
                filteredUsers.map((u) => {
                  const isSelf = Boolean(currentUser?.email && u.email === currentUser.email);
                  return (
                    <tr key={u.id} className="border-b border-cream-100 transition-colors hover:bg-cream-50">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <Avatar name={u.name || u.email || '?'} size="sm" />
                          <div className="min-w-0">
                            <p className="font-semibold text-navy-800">{u.name || 'Chưa có tên'}</p>
                            <p className="text-xs text-slate-500">{u.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-4">
                        <div className="flex flex-wrap gap-1">
                          {u.roles.length === 0 && <span className="text-slate-300">—</span>}
                          {u.roles.map((r) => (
                            <Badge key={r} variant={roleVariant[r] || 'default'} size="sm">
                              {roleLabel[r] || r}
                            </Badge>
                          ))}
                        </div>
                      </td>
                      <td className="px-4 py-4">
                        {u.isActive
                          ? <Badge variant="success" size="sm">Hoạt động</Badge>
                          : <Badge variant="danger" size="sm">Bị khóa</Badge>}
                      </td>
                      <td className="px-4 py-4 text-slate-600">{formatDate(u.createdAt)}</td>
                      <td className="px-4 py-4">
                        <div className="flex items-center justify-end gap-1.5">
                          <IconButton variant="edit" label="Sửa vai trò" onClick={() => openRoles(u)}>
                            <Pencil className="h-4 w-4" />
                          </IconButton>
                          <Button
                            size="sm"
                            variant={u.isActive ? 'outline' : 'secondary'}
                            disabled={isSelf && u.isActive}
                            title={isSelf ? 'Không thể khóa tài khoản đang đăng nhập' : undefined}
                            onClick={() => handleToggleActive(u)}
                          >
                            {u.isActive ? <Lock className="h-3.5 w-3.5" /> : <Unlock className="h-3.5 w-3.5" />}
                            {u.isActive ? 'Khóa' : 'Mở khóa'}
                          </Button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create account */}
      <AdminModal
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        title="Thêm tài khoản mới"
        subtitle="Tạo tài khoản tư vấn viên hoặc quản trị viên"
        footer={
          <>
            <Button type="button" variant="outline" onClick={() => setCreateOpen(false)} disabled={busy}>
              Hủy
            </Button>
            <Button form="user-create-form" type="submit" disabled={busy} className="min-w-[8.5rem]">
              Tạo tài khoản
            </Button>
          </>
        }
      >
        <form id="user-create-form" onSubmit={handleCreate} className="space-y-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Input
              label="Họ và tên (*)"
              value={form.name}
              required
              onChange={(e) => setForm({ ...form, name: e.target.value })}
            />
            <Input
              label="Email (*)"
              type="email"
              value={form.email}
              required
              onChange={(e) => setForm({ ...form, email: e.target.value })}
            />
          </div>
          <Input
            label="Mật khẩu (*)"
            type="password"
            value={form.password}
            required
            minLength={6}
            hint="Tối thiểu 6 ký tự."
            onChange={(e) => setForm({ ...form, password: e.target.value })}
          />
          <Select
            label="Vai trò (*)"
            value={form.role}
            onChange={(e) => setForm({ ...form, role: e.target.value })}
            options={[
              { value: 'ADVISOR', label: 'Tư vấn viên' },
              { value: 'ADMIN', label: 'Quản trị viên' },
            ]}
          />
          {form.role === 'ADVISOR' && (
            <>
              <Select
                label="Trường đại học (*)"
                value={form.universityId}
                required
                onChange={(e) => setForm({ ...form, universityId: e.target.value })}
                options={[
                  { value: '', label: '-- Chọn trường --' },
                  ...universities.map((uni) => ({ value: String(uni.id), label: uni.name })),
                ]}
              />
              <Input
                label="Chức danh"
                value={form.title}
                placeholder="VD: TS., ThS., PGS.TS..."
                onChange={(e) => setForm({ ...form, title: e.target.value })}
              />
            </>
          )}
        </form>
      </AdminModal>

      {/* Edit roles */}
      <AdminModal
        open={rolesOpen}
        onClose={() => setRolesOpen(false)}
        title="Sửa vai trò"
        subtitle={rolesTarget?.email || undefined}
        footer={
          <>
            <Button type="button" variant="outline" onClick={() => setRolesOpen(false)} disabled={busy}>
              Hủy
            </Button>
            <Button onClick={handleSaveRoles} disabled={busy} className="min-w-[8.5rem]">
              Lưu thay đổi
            </Button>
          </>
        }
      >
        <div className="space-y-2">
          {ALL_ROLES.map((role) => (
            <label
              key={role}
              className="flex cursor-pointer items-center gap-3 rounded-xl border border-cream-200 p-3 transition-colors hover:bg-cream-50"
            >
              <input
                type="checkbox"
                className="h-4 w-4 accent-gold-500"
                checked={selectedRoles.includes(role)}
                onChange={() => toggleRole(role)}
              />
              <span className="text-sm font-medium text-navy-800">{roleLabel[role]}</span>
              <span className="text-xs text-slate-400">({role})</span>
            </label>
          ))}
        </div>
      </AdminModal>
    </div>
  );
}
