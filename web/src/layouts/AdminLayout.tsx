import { useEffect, useState } from 'react';
import { getAuthMe } from '@/lib/admin';
import { ToastProvider } from '@/components/ui/Toast';
import { Link, Outlet, useLocation, useNavigate, Navigate } from 'react-router-dom';
import { LayoutDashboard, School, GraduationCap, BarChart3, MessagesSquare, UserCircle, Shield, Home, LogOut, Users } from 'lucide-react';
import { useAuth } from '@/lib/authContext';
import { Avatar } from '@/components/ui/Avatar';
import { cn } from '@/lib/utils';

interface NavItem {
  to: string;
  label: string;
  icon: React.ElementType;
}

interface NavSection {
  label: string;
  items: NavItem[];
}

const navSections: NavSection[] = [
  {
    label: 'Tổng quan',
    items: [{ to: '/admin', label: 'Tổng quan', icon: LayoutDashboard }],
  },
  {
    label: 'Dữ liệu tuyển sinh',
    items: [
      { to: '/admin/universities', label: 'Trường đại học', icon: School },
      { to: '/admin/majors', label: 'Ngành học', icon: GraduationCap },
      { to: '/admin/scores', label: 'Điểm chuẩn', icon: BarChart3 },
    ],
  },
  {
    label: 'Diễn đàn',
    items: [
      { to: '/admin/forum-threads', label: 'Bài viết', icon: MessagesSquare },
    ],
  },
  {
    label: 'Hệ thống',
    items: [
      { to: '/admin/users', label: 'Người dùng', icon: Users },
    ],
  },
];

export default function AdminLayout() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, initializing, logout } = useAuth();

  const [roles, setRoles] = useState<string[]>([]);
  const [checkingRole, setCheckingRole] = useState(true);
  useEffect(() => {
    let cancelled = false;
    setCheckingRole(true);
    setRoles([]);
    if (!user) { setCheckingRole(false); return; }
    getAuthMe().then(me => { if (!cancelled) setRoles(me.roles); })
      .catch(() => { if (!cancelled) setRoles([]); })
      .finally(() => { if (!cancelled) setCheckingRole(false); });
    return () => { cancelled = true; };
  }, [user?.userId]);

  if (initializing || checkingRole) {
    return (
      <div className="flex h-screen items-center justify-center bg-slate-50 text-slate-500">
        <div className="flex items-center space-x-2">
          <div className="h-5 w-5 border-2 border-navy-700 border-t-transparent rounded-full animate-spin" />
          <span>Đang kiểm tra quyền truy cập...</span>
        </div>
      </div>
    );
  }

  if (!user) return <Navigate to="/dang-nhap" state={{ from: location }} replace />;

  const isAdmin = roles.includes('ADMIN') || roles.includes('ROLE_ADMIN');
  if (!isAdmin) {
    return (
      <div className="flex h-screen flex-col items-center justify-center gap-4 bg-slate-50">
        <h1 className="text-3xl font-bold text-red-600">403 - Cấm truy cập</h1>
        <p className="text-slate-600">Bạn không có quyền quản trị viên để vào khu vực này.</p>
        <Link
          to="/"
          className="rounded-md bg-navy-700 px-4 py-2 text-white transition hover:bg-navy-800"
        >
          Quay lại trang chủ
        </Link>
      </div>
    );
  }

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  return (
    <div className="flex h-screen bg-gradient-to-br from-navy-50 via-slate-50 to-cream-50 overflow-hidden font-sans antialiased">
      {/* Sidebar */}
      <aside className="flex w-64 shrink-0 flex-col bg-gradient-to-b from-navy-900 via-slate-900 to-navy-950 text-slate-200 shadow-2xl">
        {/* Logo / Brand */}
        <div className="p-6">
          <Link to="/admin" className="flex items-center gap-3 text-xl font-bold text-white">
            <Shield className="h-6 w-6 text-gold-400" />
            <span>Admin Panel</span>
          </Link>
        </div>

        {/* Navigation */}
        <nav className="flex-1 space-y-1 px-3">
          <p className="px-4 pb-2 text-[11px] font-semibold uppercase tracking-wider text-slate-500">
            Quản lý nội dung
          </p>
          {navSections.map((section) => (
            <div key={section.label} className="mb-5 last:mb-0">
              <p className="px-3 pb-2 text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-500">
                {section.label}
              </p>
              <div className="space-y-0.5">
                {section.items.map((item) => {
                  const Icon = item.icon;
                  const isActive =
                    location.pathname === item.to ||
                    (item.to !== '/admin' && location.pathname.startsWith(item.to + '/'));
                  return (
                    <Link
                      key={item.to}
                      to={item.to}
                      className={cn(
                        'relative group flex items-center gap-3 rounded-lg px-3 py-2.5 text-[13.5px] font-medium transition-colors duration-150',
                        isActive
                          ? 'bg-white/[0.07] text-white'
                          : 'text-slate-400 hover:bg-white/[0.04] hover:text-slate-200'
                      )}
                    >
                      <span
                        className={cn(
                          'absolute left-0 top-1/2 h-5 w-0.5 -translate-y-1/2 rounded-r-full bg-gold-400 transition-opacity duration-150',
                          isActive ? 'opacity-100' : 'opacity-0'
                        )}
                      />
                      <Icon
                        className={cn(
                          'h-4 w-4 transition-colors duration-150',
                          isActive ? 'text-gold-400' : 'text-slate-400 group-hover:text-slate-200'
                        )}
                      />
                      <span>{item.label}</span>
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>

        {/* User section */}
        <div className="p-4">
          <p className="px-2 pb-2 text-[11px] font-semibold uppercase tracking-wider text-slate-500">
            Tài khoản
          </p>
          <div className="flex items-center gap-3 rounded-xl bg-navy-800/50 p-3">
            <Avatar name={user.name || 'Admin'} size="sm" />
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium text-white">{user.name}</p>
              <p className="truncate text-xs text-slate-400">{user.email}</p>
            </div>
          </div>

          <div className="mt-4 space-y-1.5 border-t border-navy-800 pt-3">
            <Link
              to="/ho-so"
              className="flex items-center gap-2.5 rounded-xl px-3 py-2 text-sm text-slate-300 transition-colors hover:bg-navy-800/60 hover:text-white"
            >
              <UserCircle className="h-4 w-4" />
              Hồ sơ cá nhân
            </Link>
            <Link
              to="/"
              className="flex items-center gap-2.5 rounded-xl px-3 py-2 text-sm text-slate-300 transition-colors hover:bg-navy-800/60 hover:text-white"
            >
              <Home className="h-4 w-4" />
              Về trang chủ
            </Link>
            <button
              onClick={handleLogout}
              className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-sm text-red-400 transition-colors hover:bg-red-500/10 hover:text-red-300"
            >
              <LogOut className="h-4 w-4" />
              Đăng xuất
            </button>
          </div>
        </div>
      </aside>

      {/* Main content */}
      <main className="min-w-0 flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
        <ToastProvider><Outlet /></ToastProvider>
      </main>
    </div>
  );
}
