import { useState, useEffect, useRef } from 'react'
import { Link, useLocation, Outlet, useNavigate } from 'react-router-dom'
import { BookOpen, Users, BarChart3, Compass, MessageCircle, Menu, X, ChevronDown, LogOut, UserCircle } from 'lucide-react'
import { cn } from '../lib/utils'
import { useAuth } from '../lib/authContext'

const navItems = [
  { label: 'Trang chủ', path: '/', icon: BookOpen },
  { label: 'Học bạ', path: '/diem-hoc-ky', icon: Users },
  { label: 'Trường', path: '/truong', icon: BarChart3 },
  { label: 'So sánh điểm', path: '/so-sanh', icon: Compass },
  { label: 'Tư vấn ngành', path: '/tu-van-nganh', icon: MessageCircle },
  { label: 'Cộng đồng', path: '/cong-dong', icon: Users },
]

export default function MainLayout() {
  const [mobileOpen, setMobileOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)
  const [dropdownOpen, setDropdownOpen] = useState(false)
  const location = useLocation()
  const navigate = useNavigate()
  const { user, logout } = useAuth()
  const dropdownRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const handleLogout = async () => {
    await logout()
    setDropdownOpen(false)
    navigate('/')
  }

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 10)
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  return (
    <div className="min-h-screen flex flex-col">
      <nav className={cn(
        'fixed top-0 left-0 right-0 z-50 transition-all duration-300',
        scrolled
          ? 'nav-scrolled'
          : 'bg-navy-800 shadow-lg'
      )}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <Link to="/" className="flex items-center gap-2">
              <img
                src="/logo-header.png"
                alt="Hướng Nghiệp"
                className="h-9 w-auto object-contain"
              />
              <span className="font-display text-lg font-bold text-cream-50 tracking-tight hidden sm:block">Hướng Nghiệp</span>
            </Link>

            <div className="hidden md:flex items-center gap-1">
              {navItems.map((item) => {
                const Icon = item.icon
                const isActive = location.pathname === item.path
                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    className={cn(
                      'flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors duration-200',
                      isActive
                        ? 'bg-gold-500 text-navy-900'
                        : 'text-cream-100 hover:bg-white/10 hover:text-gold-400'
                    )}
                  >
                    <Icon className="w-4 h-4" />
                    {item.label}
                  </Link>
                )
              })}
            </div>

            <div className="hidden md:flex items-center gap-3">
              {user ? (
                <div className="relative" ref={dropdownRef}>
                  <button
                    onClick={() => setDropdownOpen((o) => !o)}
                    className="flex items-center gap-2 px-3 py-1.5 rounded-xl text-sm font-medium text-cream-100 hover:bg-white/10 transition-colors"
                  >
                    <span className="w-7 h-7 rounded-full bg-gold-500 flex items-center justify-center text-navy-900 font-bold text-xs">
                      {user.name.charAt(0).toUpperCase()}
                    </span>
                    <span className="max-w-[120px] truncate">{user.name}</span>
                    <ChevronDown className={cn('w-3.5 h-3.5 transition-transform duration-200', dropdownOpen && 'rotate-180')} />
                  </button>

                  {dropdownOpen && (
                    <div className="absolute right-0 top-full mt-2 w-48 bg-white rounded-xl shadow-lg border border-cream-200 py-1 z-50"
                      style={{ animation: 'fadeInDown 150ms ease' }}>
                      <Link
                        to="/ho-so"
                        onClick={() => setDropdownOpen(false)}
                        className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-navy-800 hover:bg-cream-100 transition-colors"
                      >
                        <UserCircle className="w-4 h-4 text-slate-400" />
                        Hồ sơ của tôi
                      </Link>
                      <div className="my-1 border-t border-cream-200" />
                      <button
                        onClick={handleLogout}
                        className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 transition-colors"
                      >
                        <LogOut className="w-4 h-4" />
                        Đăng xuất
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                <>
                  <Link to="/dang-nhap" className="px-4 py-2 text-sm font-medium text-cream-100 hover:text-gold-400 transition-colors">
                    Đăng nhập
                  </Link>
                  <Link
                    to="/diem-hoc-ky"
                    className="px-4 py-2 bg-gold-500 text-navy-900 font-semibold rounded-lg hover:bg-gold-400 transition-colors text-sm btn-animate"
                  >
                    Nhập điểm ngay
                  </Link>
                </>
              )}
            </div>

            <button
              onClick={() => setMobileOpen(true)}
              className="md:hidden p-2 text-cream-100 hover:text-gold-400 transition-colors"
            >
              <Menu className="w-6 h-6" />
            </button>
          </div>
        </div>
      </nav>

      {/* Offset content below fixed nav */}
      <div className="pt-16">
        {mobileOpen && (
          <div className="fixed inset-0 z-50 md:hidden flex">
            <div
              className="mobile-nav-backdrop flex-1"
              onClick={() => setMobileOpen(false)}
            />
            <div className="fixed right-0 top-0 bottom-0 w-72 bg-navy-800 shadow-2xl p-6 flex flex-col">
              <div className="flex justify-end mb-6">
                <button
                  onClick={() => setMobileOpen(false)}
                  className="p-2 text-cream-100 hover:text-gold-400 transition-colors"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
              <nav className="flex flex-col gap-2 flex-1">
                {navItems.map((item) => {
                  const Icon = item.icon
                  const isActive = location.pathname === item.path
                  return (
                    <Link
                      key={item.path}
                      to={item.path}
                      onClick={() => setMobileOpen(false)}
                      className={cn(
                        'flex items-center gap-3 px-4 py-3 rounded-xl text-base font-medium transition-all duration-200',
                        isActive
                          ? 'bg-gold-500 text-navy-900'
                          : 'text-cream-100 hover:bg-white/10 hover:text-gold-400'
                      )}
                    >
                      <Icon className="w-5 h-5" />
                      {item.label}
                    </Link>
                  )
                })}
                <div className="mt-auto pt-6 border-t border-white/10 flex flex-col gap-3">
                  {user ? (
                    <>
                      <div className="flex items-center gap-3 px-4 py-2">
                        <span className="w-8 h-8 rounded-full bg-gold-500 flex items-center justify-center text-navy-900 font-bold text-sm">
                          {user.name.charAt(0).toUpperCase()}
                        </span>
                        <div>
                          <p className="text-sm font-semibold text-cream-50 truncate max-w-[160px]">{user.name}</p>
                          <p className="text-xs text-cream-200/60 truncate max-w-[160px]">{user.email}</p>
                        </div>
                      </div>
                      <Link
                        to="/ho-so"
                        onClick={() => setMobileOpen(false)}
                        className="flex items-center gap-2 px-4 py-2.5 text-sm text-cream-100 hover:bg-white/10 rounded-xl transition-colors"
                      >
                        <UserCircle className="w-4 h-4" /> Hồ sơ của tôi
                      </Link>
                      <button
                        onClick={() => { handleLogout(); setMobileOpen(false) }}
                        className="flex items-center gap-2 px-4 py-2.5 text-sm text-red-400 hover:bg-white/10 rounded-xl transition-colors"
                      >
                        <LogOut className="w-4 h-4" /> Đăng xuất
                      </button>
                    </>
                  ) : (
                    <>
                      <Link
                        to="/dang-nhap"
                        onClick={() => setMobileOpen(false)}
                        className="w-full px-4 py-2 text-sm font-medium text-cream-100 hover:text-gold-400 transition-colors text-left"
                      >
                        Đăng nhập
                      </Link>
                      <Link
                        to="/diem-hoc-ky"
                        onClick={() => setMobileOpen(false)}
                        className="w-full px-4 py-2.5 bg-gold-500 text-navy-900 font-bold rounded-xl hover:bg-gold-400 transition-colors text-sm text-center btn-animate"
                      >
                        Nhập điểm ngay
                      </Link>
                    </>
                  )}
                </div>
              </nav>
            </div>
          </div>
        )}

        <main className="flex-1"><Outlet /></main>

        <footer className="bg-navy-900 text-cream-100">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
              <div>
<div className="flex items-center gap-2 mb-4">
                <img src="/logo-header.png" alt="Hướng Nghiệp" className="h-6 w-auto object-contain" />
                <span className="font-display text-lg font-bold text-cream-50">Hướng Nghiệp</span>
              </div>
                <p className="text-sm text-slate-400 leading-relaxed">
                  Nền tảng tư vấn tuyển sinh đại học hàng đầu Việt Nam, giúp học sinh lựa chọn con đường học tập phù hợp.
                </p>
              </div>

              <div>
                <h4 className="font-semibold text-cream-50 mb-4">Giới thiệu</h4>
                <ul className="space-y-2 text-sm text-slate-400">
                  <li><a href="#" className="hover:text-gold-400 transition-colors">Về chúng tôi</a></li>
                  <li><a href="#" className="hover:text-gold-400 transition-colors">Đội ngũ cố vấn</a></li>
                  <li><a href="#" className="hover:text-gold-400 transition-colors">Blog chuyên gia</a></li>
                  <li><a href="#" className="hover:text-gold-400 transition-colors">Liên hệ</a></li>
                </ul>
              </div>

              <div>
                <h4 className="font-semibold text-cream-50 mb-4">Liên kết nhanh</h4>
                <ul className="space-y-2 text-sm text-slate-400">
                  <li><Link to="/truong" className="hover:text-gold-400 transition-colors">Danh sách trường</Link></li>
                  <li><Link to="/so-sanh" className="hover:text-gold-400 transition-colors">So sánh điểm</Link></li>
                  <li><Link to="/tu-van-nganh" className="hover:text-gold-400 transition-colors">Tư vấn ngành</Link></li>
                  <li><Link to="/cong-dong" className="hover:text-gold-400 transition-colors">Cộng đồng</Link></li>
                </ul>
              </div>

              <div>
                <h4 className="font-semibold text-cream-50 mb-4">Hỗ trợ</h4>
                <ul className="space-y-2 text-sm text-slate-400">
                  <li><a href="#" className="hover:text-gold-400 transition-colors">Câu hỏi thường gặp</a></li>
                  <li><a href="#" className="hover:text-gold-400 transition-colors">Hướng dẫn sử dụng</a></li>
                  <li><a href="#" className="hover:text-gold-400 transition-colors">Chính sách bảo mật</a></li>
                  <li><a href="#" className="hover:text-gold-400 transition-colors">Điều khoản dịch vụ</a></li>
                </ul>
              </div>
            </div>

            <div className="mt-12 pt-8 border-t border-navy-700 flex flex-col sm:flex-row justify-between items-center gap-4">
              <p className="text-sm text-slate-400">
                © 2026 Hướng Nghiệp. Tất cả quyền được bảo lưu.
              </p>
              <p className="text-sm text-slate-400">
                Được phát triển bởi đội ngũ Hướng Nghiệp
              </p>
            </div>
          </div>
        </footer>
      </div>
    </div>
  )
}