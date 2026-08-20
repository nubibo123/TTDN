import { useState, useEffect } from 'react'
import React from 'react'
import { Link, Navigate } from 'react-router-dom'
import {
  Settings,
  Users,
  BarChart3,
  Shield,
  AlertTriangle,
  TrendingUp,
  GraduationCap,
  Loader2,
  Menu,
  X,
  ChevronRight,
  Check,
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Avatar } from '@/components/ui/Avatar'
import BlurReveal from '@/components/BlurReveal'
import { useAuth } from '@/lib/authContext'
import {
  getAdminStats,
  getPendingAdvisors,
  verifyAdvisor,
  getAdminForumPosts,
  deleteAdminForumPost,
  getAdminConsultations,
  updateAdminConsultationStatus,
  getAuthMe,
  getAcademicYears,
  createAcademicYear,
  updateAcademicYear,
  deleteAcademicYear,
  getSystemSettings,
  updateSystemSetting,
  type AdminStats,
  type AdminAdvisor,
  type AdminForumPost,
  type AdminConsultation,
  type AcademicYear,
} from '@/lib/admin'

type AdminTab = 'overview' | 'advisors' | 'moderation' | 'consultations' | 'settings'

const NAV_ITEMS: { id: AdminTab; label: string; icon: React.ElementType }[] = [
  { id: 'overview', label: 'Tổng quan', icon: BarChart3 },
  { id: 'advisors', label: 'Tư vấn viên', icon: Shield },
  { id: 'moderation', label: 'Kiểm duyệt', icon: AlertTriangle },
  { id: 'consultations', label: 'Yêu cầu tư vấn', icon: Users },
  { id: 'settings', label: 'Cài đặt', icon: Settings },
]

export default function AdminDashboardPage() {
  const { user, logout } = useAuth()
  const [activeTab, setActiveTab] = useState<AdminTab>('overview')
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null)
  const [adminName, setAdminName] = useState('Admin')
  const [adminEmail, setAdminEmail] = useState('')
  const [mobileOpen, setMobileOpen] = useState(false)

  const [stats, setStats] = useState<AdminStats | null>(null)
  const [loadingStats, setLoadingStats] = useState(true)

  const [advisors, setAdvisors] = useState<AdminAdvisor[]>([])
  const [loadingAdvisors, setLoadingAdvisors] = useState(false)
  const [advisorActionId, setAdvisorActionId] = useState<string | null>(null)

  const [posts, setPosts] = useState<AdminForumPost[]>([])
  const [loadingPosts, setLoadingPosts] = useState(false)

  const [consultations, setConsultations] = useState<AdminConsultation[]>([])
  const [loadingConsultations, setLoadingConsultations] = useState(false)

  const [ocrKey, setOcrKey] = useState('')
  const [saveMsg, setSaveMsg] = useState('')

  const [academicYears, setAcademicYears] = useState<AcademicYear[]>([])
  const [loadingAcademicYears, setLoadingAcademicYears] = useState(false)
  const [newAcademicYear, setNewAcademicYear] = useState('')

  useEffect(() => {
    let active = true
    getAuthMe()
      .then((res) => {
        if (!active) return
        const admin = res.roles.includes('ADMIN')
        setIsAdmin(admin)
        setAdminName(res.name || 'Admin')
        setAdminEmail(res.email || '')
      })
      .catch(() => {
        if (!active) return
        setIsAdmin(false)
      })
    return () => { active = false }
  }, [])

  useEffect(() => {
    if (!user) {
      setIsAdmin(false)
    }
  }, [user])

  useEffect(() => {
    if (!isAdmin) return
    let active = true
    setLoadingStats(true)
    getAdminStats()
      .then((res) => {
        if (active) setStats(res)
      })
      .catch(() => {})
      .finally(() => {
        if (active) setLoadingStats(false)
      })
    return () => { active = false }
  }, [isAdmin])

  const loadAdvisors = () => {
    if (!isAdmin) return
    let active = true
    setLoadingAdvisors(true)
    getPendingAdvisors()
      .then((res) => {
        if (active) setAdvisors(res)
      })
      .catch(() => {})
      .finally(() => {
        if (active) setLoadingAdvisors(false)
      })
  }

  useEffect(() => {
    if (isAdmin && activeTab === 'advisors') {
      loadAdvisors()
    }
  }, [isAdmin, activeTab])

  const loadPosts = () => {
    if (!isAdmin) return
    let active = true
    setLoadingPosts(true)
    getAdminForumPosts()
      .then((res) => {
        if (active) setPosts(res)
      })
      .catch(() => {})
      .finally(() => {
        if (active) setLoadingPosts(false)
      })
  }

  useEffect(() => {
    if (isAdmin && activeTab === 'moderation') {
      loadPosts()
    }
  }, [isAdmin, activeTab])

  const loadConsultations = () => {
    if (!isAdmin) return
    let active = true
    setLoadingConsultations(true)
    getAdminConsultations()
      .then((res) => {
        if (active) setConsultations(res)
      })
      .catch(() => {})
      .finally(() => {
        if (active) setLoadingConsultations(false)
      })
  }

  useEffect(() => {
    if (isAdmin && activeTab === 'consultations') {
      loadConsultations()
    }
  }, [isAdmin, activeTab])

  const loadAcademicYears = () => {
    if (!isAdmin) return
    let active = true
    setLoadingAcademicYears(true)
    getAcademicYears()
      .then((res) => {
        if (active) setAcademicYears(res)
      })
      .catch(() => {})
      .finally(() => {
        if (active) setLoadingAcademicYears(false)
      })
  }

  useEffect(() => {
    if (isAdmin && activeTab === 'settings') {
      loadAcademicYears()
      getSystemSettings().then((res) => {
        if (res['ocr.apiKey']) setOcrKey(res['ocr.apiKey'])
      }).catch(() => {})
    }
  }, [isAdmin, activeTab])

  const handleAddAcademicYear = async () => {
    if (!newAcademicYear.trim()) return
    try {
      await createAcademicYear(newAcademicYear.trim(), true)
      setNewAcademicYear('')
      loadAcademicYears()
    } catch {
      // silent
    }
  }

  const handleToggleAcademicYear = async (id: string, currentActive: boolean) => {
    try {
      const year = academicYears.find(y => y.id === id)
      if (!year) return
      await updateAcademicYear(id, year.year, !currentActive)
      loadAcademicYears()
    } catch {
      // silent
    }
  }

  const handleDeleteAcademicYear = async (id: string) => {
    try {
      await deleteAcademicYear(id)
      setAcademicYears(prev => prev.filter(y => y.id !== id))
    } catch {
      // silent
    }
  }

  const handleSaveSettings = async () => {
    try {
      await updateSystemSetting('ocr.apiKey', ocrKey)
      setSaveMsg('Đã lưu cấu hình')
      setTimeout(() => setSaveMsg(''), 2000)
    } catch {
      setSaveMsg('Lỗi khi lưu')
    }
  }

  const handleVerifyAdvisor = async (id: string, verified: boolean) => {
    setAdvisorActionId(id)
    try {
      await verifyAdvisor(id, verified)
      setAdvisors((prev) => prev.filter((a) => a.id !== id))
    } catch {
      // silent
    } finally {
      setAdvisorActionId(null)
    }
  }

  const handleDeletePost = async (id: string) => {
    try {
      await deleteAdminForumPost(id)
      setPosts((prev) => prev.filter((p) => p.id !== id))
    } catch {
      // silent
    }
  }

  const handleUpdateConsultationStatus = async (id: string, status: string) => {
    try {
      const updated = await updateAdminConsultationStatus(id, status)
      setConsultations((prev) => prev.map((c) => (c.id === id ? updated : c)))
    } catch {
      // silent
    }
  }

  if (isAdmin === null) {
    return (
      <div className="min-h-screen bg-cream-100 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-gold-500" />
      </div>
    )
  }

  if (!isAdmin) {
    return <Navigate to="/" replace />
  }

  const statCards = [
    { label: 'Tổng học sinh', value: stats ? stats.totalStudents.toLocaleString() : '—', icon: Users, color: 'bg-navy-800' },
    { label: 'Trường đại học', value: stats ? stats.totalUniversities.toString() : '—', icon: TrendingUp, color: 'bg-gold-500' },
    { label: 'Lượt tư vấn', value: stats ? stats.totalConsultations.toLocaleString() : '—', icon: BarChart3, color: 'bg-green-500' },
    { label: 'Bài viết forum', value: stats ? stats.totalPosts.toString() : '—', icon: Users, color: 'bg-purple-500' },
  ]

  const Sidebar = (
    <div className="flex flex-col h-full">
      <div className="px-6 py-6">
        <Link to="/" className="flex items-center gap-3">
          <div className="w-9 h-9 bg-gold-500 rounded-xl flex items-center justify-center">
            <Shield className="w-5 h-5 text-navy-900" />
          </div>
          <div>
            <p className="font-display text-base font-bold text-cream-50 leading-tight">Hướng Nghiệp</p>
            <p className="text-[11px] text-cream-300">Quản trị hệ thống</p>
          </div>
        </Link>
      </div>

      <div className="px-3 mt-2">
        <p className="px-3 text-[11px] font-semibold text-cream-300 uppercase tracking-wider mb-2">Menu</p>
        <nav className="space-y-1">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon
            const isActive = activeTab === item.id
            return (
              <button
                key={item.id}
                onClick={() => {
                  setActiveTab(item.id)
                  setMobileOpen(false)
                }}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
                  isActive
                    ? 'bg-gold-500 text-navy-900 shadow-sm'
                    : 'text-cream-100 hover:bg-white/10 hover:text-gold-400'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span className="flex-1 text-left">{item.label}</span>
                {item.id === 'advisors' && advisors.length > 0 && (
                  <span className={`text-xs px-1.5 py-0.5 rounded-full ${
                    isActive ? 'bg-navy-900/20 text-navy-900' : 'bg-white/20 text-cream-50'
                  }`}>
                    {advisors.length}
                  </span>
                )}
                {isActive && <ChevronRight className="w-4 h-4" />}
              </button>
            )
          })}
        </nav>
      </div>

      <div className="mt-auto px-3 pb-4">
        <div className="border-t border-white/10 pt-4">
          <div className="flex items-center gap-3 px-3 mb-3">
            <Avatar name={adminName} size="sm" className="w-9 h-9 text-xs" />
            <div className="min-w-0">
              <p className="text-sm font-medium text-cream-50 truncate">{adminName}</p>
              <p className="text-xs text-cream-300 truncate">Quản trị viên</p>
            </div>
          </div>
          <button
            onClick={() => {
              logout()
              setMobileOpen(false)
            }}
            className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-sm text-red-300 hover:bg-white/10 transition-colors"
          >
            <X className="w-4 h-4" />
            Đăng xuất
          </button>
        </div>
      </div>
    </div>
  )

  return (
    <div className="min-h-screen bg-cream-100">
      {/* Mobile header */}
      <header className="bg-white border-b border-cream-200 px-4 py-3 md:hidden">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setMobileOpen(true)}
              className="p-2 -ml-2 text-navy-800 hover:bg-cream-100 rounded-lg transition-colors"
            >
              <Menu className="w-5 h-5" />
            </button>
            <div>
              <h1 className="font-display text-lg font-bold text-navy-800">Quản trị</h1>
              <p className="text-xs text-slate-500">Hệ thống Hướng Nghiệp</p>
            </div>
          </div>
          <Avatar name={adminName} size="sm" />
        </div>
      </header>

      {/* Mobile sidebar drawer */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 md:hidden">
          <div
            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            onClick={() => setMobileOpen(false)}
          />
          <div className="absolute left-0 top-0 bottom-0 w-72 bg-navy-900 shadow-2xl">
            {Sidebar}
          </div>
        </div>
      )}

      <div className="flex min-h-screen">
        {/* Desktop sidebar */}
        <aside className="hidden md:flex flex-col fixed left-0 top-0 bottom-0 w-60 bg-navy-900 z-30">
          {Sidebar}
        </aside>

        {/* Main content */}
        <div className="flex-1 md:ml-60">
          {/* Desktop top bar */}
          <header className="hidden md:flex items-center justify-between px-8 h-16 bg-white border-b border-cream-200">
            <div>
              <h2 className="font-display text-lg font-bold text-navy-800">Bảng điều khiển quản trị</h2>
              <p className="text-xs text-slate-500">Hệ thống quản lý Hướng Nghiệp</p>
            </div>
            <div className="flex items-center gap-3">
              <div className="text-right">
                <p className="text-sm font-medium text-navy-800">{adminName}</p>
                <p className="text-xs text-slate-500">Quản trị viên</p>
              </div>
              <Avatar name={adminName} size="sm" />
              <Button variant="ghost" size="sm" className="text-slate-600 hover:text-red-600" onClick={logout}>
                Đăng xuất
              </Button>
            </div>
          </header>

          <main className="p-4 sm:p-6 lg:p-8">
            {activeTab === 'overview' && (
              <div className="space-y-6">
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                  {statCards.map((stat, idx) => {
                    const Icon = stat.icon
                    return (
                      <BlurReveal key={stat.label} duration={500} delay={120 + idx * 100}>
                        <Card>
                          <CardContent className="p-5">
                            <div className={`w-10 h-10 ${stat.color} rounded-xl flex items-center justify-center mb-3`}>
                              <Icon className="w-5 h-5 text-white" />
                            </div>
                            {loadingStats ? (
                              <div className="h-8 w-24 bg-cream-200 rounded mb-2 animate-pulse" />
                            ) : (
                              <p className="font-display text-2xl sm:text-3xl font-bold text-navy-800">{stat.value}</p>
                            )}
                            <p className="text-sm text-slate-500 mt-1">{stat.label}</p>
                          </CardContent>
                        </Card>
                      </BlurReveal>
                    )
                  })}
                </div>

                {stats && (
                  <BlurReveal duration={600} delay={520}>
                    <Card>
                      <CardHeader>
                        <CardTitle>Tổng quan hệ thống</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                          <div className="p-4 bg-cream-50 rounded-xl">
                            <p className="text-xs text-slate-500 mb-1">Học sinh</p>
                            <p className="font-display text-xl font-bold text-navy-800">{stats.totalStudents.toLocaleString()}</p>
                          </div>
                          <div className="p-4 bg-cream-50 rounded-xl">
                            <p className="text-xs text-slate-500 mb-1">Trường</p>
                            <p className="font-display text-xl font-bold text-navy-800">{stats.totalUniversities}</p>
                          </div>
                          <div className="p-4 bg-cream-50 rounded-xl">
                            <p className="text-xs text-slate-500 mb-1">Tư vấn</p>
                            <p className="font-display text-xl font-bold text-navy-800">{stats.totalConsultations.toLocaleString()}</p>
                          </div>
                          <div className="p-4 bg-cream-50 rounded-xl">
                            <p className="text-xs text-slate-500 mb-1">Bài viết</p>
                            <p className="font-display text-xl font-bold text-navy-800">{stats.totalPosts.toLocaleString()}</p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </BlurReveal>
                )}
              </div>
            )}

            {activeTab === 'advisors' && (
              <div className="space-y-6">
                <BlurReveal duration={600} delay={120}>
                  <Card>
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <CardTitle>Tư vấn viên chờ xác minh</CardTitle>
                        <Badge variant="warning">{advisors.length} chờ duyệt</Badge>
                      </div>
                    </CardHeader>
                    <CardContent className="p-0">
                      {loadingAdvisors ? (
                        <div className="py-8 text-center text-slate-400">
                          <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2 text-gold-500" />
                          <p className="text-xs">Đang tải...</p>
                        </div>
                      ) : advisors.length === 0 ? (
                        <div className="py-8 text-center text-slate-400 text-sm">Không có tư vấn viên nào chờ duyệt</div>
                      ) : (
                        <div className="divide-y divide-cream-200">
                          {advisors.map((adv) => (
                            <div key={adv.id} className="p-4 sm:p-5">
                              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                                <div className="flex items-center gap-3 sm:gap-4">
                                  <Avatar name={adv.name || 'TV'} size="md" />
                                  <div className="min-w-0">
                                    <h4 className="font-semibold text-navy-800 truncate">{adv.name || 'Không có tên'}</h4>
                                    <p className="text-sm text-slate-500 truncate">{adv.university}</p>
                                    <p className="text-sm text-slate-400 truncate">{adv.email}</p>
                                    {adv.title && <p className="text-xs text-slate-400 mt-0.5">{adv.title}</p>}
                                  </div>
                                </div>
                                <div className="flex gap-2 flex-shrink-0">
                                  <Button
                                    size="sm"
                                    variant="primary"
                                    onClick={() => handleVerifyAdvisor(adv.id, true)}
                                    disabled={advisorActionId === adv.id}
                                  >
                                    <Check className="w-3 h-3" /> Phê duyệt
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="danger"
                                    onClick={() => handleVerifyAdvisor(adv.id, false)}
                                    disabled={advisorActionId === adv.id}
                                  >
                                    <X className="w-3 h-3" /> Từ chối
                                  </Button>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </BlurReveal>
              </div>
            )}

            {activeTab === 'moderation' && (
              <div className="space-y-6">
                <BlurReveal duration={600} delay={120}>
                  <Card>
                    <CardHeader>
                      <CardTitle>Bài viết forum</CardTitle>
                    </CardHeader>
                    <CardContent className="p-0">
                      {loadingPosts ? (
                        <div className="py-8 text-center text-slate-400">
                          <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2 text-gold-500" />
                          <p className="text-xs">Đang tải...</p>
                        </div>
                      ) : posts.length === 0 ? (
                        <div className="py-8 text-center text-slate-400 text-sm">Không có bài viết nào</div>
                      ) : (
                        <div className="divide-y divide-cream-200">
                          {posts.slice(0, 20).map((post) => (
                            <div key={post.id} className="p-4 sm:p-5">
                              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center gap-2 mb-1">
                                    <Badge variant={post.isDeleted ? 'default' : 'warning'} size="sm">
                                      {post.isDeleted ? 'Đã xóa' : 'Đang hoạt động'}
                                    </Badge>
                                  </div>
                                  <p className="text-sm font-medium text-navy-800 line-clamp-2">
                                    {post.threadTitle || 'Không có tiêu đề'}
                                  </p>
                                  <p className="text-xs text-slate-500 mt-1 line-clamp-2">{post.content}</p>
                                  <p className="text-xs text-slate-400 mt-1">
                                    Tác giả: {post.authorName || 'Ẩn danh'} • {new Date(post.createdAt).toLocaleDateString('vi-VN')}
                                  </p>
                                </div>
                                <div className="flex gap-2 flex-shrink-0">
                                  {!post.isDeleted && (
                                    <Button size="sm" variant="danger" onClick={() => handleDeletePost(post.id)}>
                                      Xóa bài
                                    </Button>
                                  )}
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </BlurReveal>
              </div>
            )}

            {activeTab === 'consultations' && (
              <div className="space-y-6">
                <BlurReveal duration={600} delay={120}>
                  <Card>
                    <CardHeader>
                      <CardTitle>Yêu cầu tư vấn</CardTitle>
                    </CardHeader>
                    <CardContent className="p-0">
                      {loadingConsultations ? (
                        <div className="py-8 text-center text-slate-400">
                          <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2 text-gold-500" />
                          <p className="text-xs">Đang tải...</p>
                        </div>
                      ) : consultations.length === 0 ? (
                        <div className="py-8 text-center text-slate-400 text-sm">Không có yêu cầu tư vấn nào</div>
                      ) : (
                        <div className="divide-y divide-cream-200">
                          {consultations.slice(0, 20).map((c) => (
                            <div key={c.id} className="p-4 sm:p-5">
                              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                                <div className="flex-1 min-w-0">
                                  <h4 className="font-semibold text-navy-800">{c.topic}</h4>
                                  <p className="text-sm text-slate-600 mt-1 line-clamp-2">{c.message || ''}</p>
                                  <p className="text-xs text-slate-400 mt-1">
                                    Học sinh: {c.studentName || 'Ẩn danh'} • {new Date(c.createdAt).toLocaleDateString('vi-VN')}
                                  </p>
                                </div>
                                <div className="flex flex-col items-end gap-2 flex-shrink-0">
                                  <Badge
                                    variant={
                                      c.status === 'PENDING' ? 'warning' :
                                      c.status === 'ACCEPTED' ? 'success' :
                                      c.status === 'REJECTED' ? 'danger' : 'default'
                                    }
                                    size="sm"
                                  >
                                    {c.status === 'PENDING' ? 'Chờ duyệt' :
                                     c.status === 'ACCEPTED' ? 'Đã nhận' :
                                     c.status === 'REJECTED' ? 'Từ chối' : c.status}
                                  </Badge>
                                  {c.status === 'PENDING' && (
                                    <div className="flex gap-2">
                                      <Button size="sm" variant="primary" onClick={() => handleUpdateConsultationStatus(c.id, 'ACCEPTED')}>
                                        <Check className="w-3 h-3" /> Duyệt
                                      </Button>
                                      <Button size="sm" variant="danger" onClick={() => handleUpdateConsultationStatus(c.id, 'REJECTED')}>
                                        <X className="w-3 h-3" /> Từ chối
                                      </Button>
                                    </div>
                                  )}
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </BlurReveal>
              </div>
            )}

            {activeTab === 'settings' && (
              <div className="space-y-6">
                <BlurReveal duration={600} delay={120}>
                  <Card>
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <CardTitle>Cấu hình hệ thống</CardTitle>
                        {saveMsg && <span className="text-xs text-green-600 font-medium">{saveMsg}</span>}
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-6">
                      <div>
                        <div className="flex items-center justify-between mb-3">
                          <h4 className="font-semibold text-navy-800">Niên khóa</h4>
                          <div className="flex gap-2">
                            <input
                              type="text"
                              value={newAcademicYear}
                              onChange={(e) => setNewAcademicYear(e.target.value)}
                              placeholder="VD: 2026-2027"
                              className="px-3 py-1.5 text-sm rounded-lg border border-cream-200 bg-white text-navy-800 focus:outline-none focus:ring-2 focus:ring-gold-400"
                            />
                            <Button size="sm" variant="primary" onClick={handleAddAcademicYear}>Thêm</Button>
                          </div>
                        </div>
                        {loadingAcademicYears ? (
                          <div className="py-4 text-center text-slate-400">
                            <Loader2 className="w-5 h-5 animate-spin mx-auto text-gold-500" />
                          </div>
                        ) : (
                          <div className="space-y-2">
                            {academicYears.map((year) => (
                              <div key={year.id} className="flex items-center justify-between p-3 bg-cream-50 rounded-xl">
                                <div>
                                  <span className="text-sm font-medium text-navy-800">{year.year}</span>
                                  {year.isActive && <Badge variant="success" size="sm" className="ml-2">Đang hoạt động</Badge>}
                                </div>
                                <div className="flex gap-2">
                                  <Button size="sm" variant="ghost" onClick={() => handleToggleAcademicYear(year.id, year.isActive)}>
                                    {year.isActive ? 'Tắt' : 'Bật'}
                                  </Button>
                                  <Button size="sm" variant="danger" onClick={() => handleDeleteAcademicYear(year.id)}>Xóa</Button>
                                </div>
                              </div>
                            ))}
                            {academicYears.length === 0 && (
                              <p className="text-sm text-slate-400 text-center py-2">Chưa có niên khóa nào</p>
                            )}
                          </div>
                        )}
                      </div>

                      <div className="pt-4 border-t border-cream-200">
                        <h4 className="font-semibold text-navy-800 mb-3">OCR API Configuration</h4>
                        <div className="space-y-3">
                          <div>
                            <label className="text-sm text-slate-600 block mb-1.5">OCR Provider API Key</label>
                            <input
                              type="password"
                              value={ocrKey}
                              onChange={(e) => setOcrKey(e.target.value)}
                              placeholder="Nhập API key..."
                              className="w-full px-4 py-2.5 rounded-xl border border-cream-200 bg-white text-navy-800 focus:outline-none focus:ring-2 focus:ring-gold-400"
                            />
                          </div>
                          <Button variant="primary" size="sm" onClick={handleSaveSettings}>Lưu cấu hình</Button>
                        </div>
                      </div>

                      <div className="pt-4 border-t border-cream-200">
                        <h4 className="font-semibold text-navy-800 mb-3">Quản lý dữ liệu</h4>
                        <div className="flex flex-wrap gap-3">
                          <Button variant="outline" size="sm">Import điểm chuẩn (CSV)</Button>
                          <Button variant="outline" size="sm">Export dữ liệu</Button>
                          <Button variant="outline" size="sm">Cập nhật tự động</Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </BlurReveal>
              </div>
            )}
          </main>
        </div>
      </div>
    </div>
  )
}
