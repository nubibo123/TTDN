import { useEffect, useMemo, useState } from 'react'
import { Settings, Users, BarChart3, Shield, Check, X, AlertTriangle, TrendingUp, MessagesSquare } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Avatar } from '@/components/ui/Avatar'
import { Tabs } from '@/components/ui/Tabs'
import BlurReveal from '@/components/BlurReveal'
import { AdminPageHeader } from '@/components/admin/AdminPageHeader'
import { useAuth } from '@/lib/authContext'
import {
  getAdminStats,
  getAdminUsers,
  getPendingAdvisors,
  verifyAdvisor,
  rejectAdminAdvisor,
  getAdminConsultations,
  getAdminForumPosts,
  deleteAdminForumPost,
  getAcademicYears,
  createAcademicYear,
  updateAcademicYear,
  deleteAcademicYear,
  getSystemSettings,
  updateSystemSetting,
  updateAdminUserStatus,
  type AdminStats,
  type AdminUser,
  type AdminAdvisor,
  type AdminConsultation,
  type AdminForumPost,
  type AcademicYear,
} from '@/lib/admin'
import { formatForumDate } from '@/lib/forum'

type ActivityType = 'success' | 'warning' | 'info'

interface ActivityItem {
  id: string
  text: string
  time: string
  at: number
  type: ActivityType
}

const OCR_API_KEY_SETTING = 'ocr_provider_api_key'
const OCR_PROVIDER_SETTING = 'ocr_provider'
const ADMISSION_METHODS_SETTING = 'admission_methods'

export default function AdminDashboardPage() {
  const [activeTab, setActiveTab] = useState('overview')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [stats, setStats] = useState<AdminStats | null>(null)
  const [users, setUsers] = useState<AdminUser[]>([])
  const [advisorList, setAdvisorList] = useState<AdminAdvisor[]>([])
  const [consultations, setConsultations] = useState<AdminConsultation[]>([])
  const [forumPosts, setForumPosts] = useState<AdminForumPost[]>([])
  const [academicYears, setAcademicYears] = useState<AcademicYear[]>([])
  const [dismissedPostIds, setDismissedPostIds] = useState<string[]>([])
  const [ocrKey, setOcrKey] = useState('')
  const [ocrProvider, setOcrProvider] = useState('PaddleOCR')
  const [admissionMethods, setAdmissionMethods] = useState('')
  const [saveMsg, setSaveMsg] = useState('')
  const [busyId, setBusyId] = useState<string | null>(null)
  const { user } = useAuth()

  // Every section of the dashboard is powered by real data from the API.
  const loadDashboard = async () => {
    setLoading(true)
    setError('')
    const results = await Promise.allSettled([
      getAdminStats(),
      getAdminUsers(),
      getPendingAdvisors(),
      getAdminConsultations(),
      getAdminForumPosts(),
      getAcademicYears(),
      getSystemSettings(),
    ])
    const [statsRes, usersRes, advisorsRes, consultationsRes, postsRes, yearsRes, settingsRes] = results

    if (statsRes.status === 'fulfilled') setStats(statsRes.value)
    if (usersRes.status === 'fulfilled') setUsers(usersRes.value)
    if (advisorsRes.status === 'fulfilled') setAdvisorList(advisorsRes.value)
    if (consultationsRes.status === 'fulfilled') setConsultations(consultationsRes.value)
    if (postsRes.status === 'fulfilled') setForumPosts(postsRes.value)
    if (yearsRes.status === 'fulfilled') setAcademicYears(yearsRes.value)
    if (settingsRes.status === 'fulfilled') {
      setOcrKey(settingsRes.value[OCR_API_KEY_SETTING] ?? '')
      setOcrProvider(settingsRes.value[OCR_PROVIDER_SETTING] ?? 'PaddleOCR')
      setAdmissionMethods(settingsRes.value[ADMISSION_METHODS_SETTING] ?? '')
    }

    const failed = results.find((r) => r.status === 'rejected')
    if (failed && failed.status === 'rejected') {
      setError(failed.reason instanceof Error ? failed.reason.message : 'Không thể tải dữ liệu tổng quan')
    }
    setLoading(false)
  }

  useEffect(() => {
    loadDashboard()
  }, []) // eslint-disable-line react-hooks/exhaustive-deps


  // Real "recent activity" feed merged from new accounts, consultations and forum posts.
  const recentActivity = useMemo<ActivityItem[]>(() => {
    const items: ActivityItem[] = []

    for (const u of users) {
      if (!u.createdAt) continue
      items.push({
        id: `user-${u.id}`,
        text: `${u.name || u.email || 'Người dùng'} vừa đăng ký tài khoản${(u.roles || []).includes('STUDENT') ? ' học sinh' : ''}`,
        time: formatForumDate(u.createdAt),
        at: new Date(u.createdAt).getTime(),
        type: 'success',
      })
    }

    for (const c of consultations) {
      if (!c.createdAt) continue
      items.push({
        id: `consultation-${c.id}`,
        text: `${c.studentName || 'Một học sinh'} đã gửi yêu cầu tư vấn chủ đề "${c.topic}"`,
        time: formatForumDate(c.createdAt),
        at: new Date(c.createdAt).getTime(),
        type: c.status === 'PENDING' ? 'warning' : 'success',
      })
    }

    for (const p of forumPosts) {
      if (!p.createdAt) continue
      items.push({
        id: `post-${p.id}`,
        text: `${p.authorName || 'Người dùng'} đã đăng bài viết${p.threadTitle ? ` trong chủ đề "${p.threadTitle}"` : ''}`,
        time: formatForumDate(p.createdAt),
        at: new Date(p.createdAt).getTime(),
        type: p.isDeleted ? 'warning' : 'info',
      })
    }

    return items.sort((a, b) => b.at - a.at).slice(0, 8)
  }, [users, consultations, forumPosts])

  // Newest posts first for the moderation tab.
  const moderationPosts = useMemo(
    () =>
      forumPosts
        .filter((p) => !dismissedPostIds.includes(String(p.id)))
        .sort((a, b) => new Date(b.createdAt ?? 0).getTime() - new Date(a.createdAt ?? 0).getTime())
        .slice(0, 10),
    [forumPosts, dismissedPostIds]
  )

  // Real statistics from GET /admin/stats.
  const statCards = [
    { label: 'Tổng người dùng', value: stats ? stats.totalUsers.toLocaleString('vi-VN') : '…', icon: Users, color: 'bg-navy-800' },
    { label: 'Trường đại học', value: stats ? stats.totalUniversities.toLocaleString('vi-VN') : '…', icon: TrendingUp, color: 'bg-gold-500' },
    { label: 'Lượt tư vấn', value: stats ? stats.totalConsultations.toLocaleString('vi-VN') : '…', icon: BarChart3, color: 'bg-green-500' },
    { label: 'Bài viết forum', value: stats ? stats.totalPosts.toLocaleString('vi-VN') : '…', icon: MessagesSquare, color: 'bg-purple-500' },
  ]

  const tabs = [
    { id: 'overview', label: 'Tổng quan', icon: <BarChart3 className="w-4 h-4" /> },
    { id: 'advisors', label: 'Tư vấn viên', icon: <Shield className="w-4 h-4" /> },
    { id: 'moderation', label: 'Kiểm duyệt', icon: <AlertTriangle className="w-4 h-4" /> },
    { id: 'settings', label: 'Cài đặt', icon: <Settings className="w-4 h-4" /> },
  ]

  const refreshStats = () => {
    getAdminStats().then(setStats).catch(() => {})
  }

  const approveAdvisor = async (id: string | number) => {
    setBusyId(`approve-${id}`)
    try {
      await verifyAdvisor(String(id), true)
      setAdvisorList((prev) => prev.filter((a) => String(a.id) !== String(id)))
      refreshStats()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Phê duyệt tư vấn viên thất bại')
    } finally {
      setBusyId(null)
    }
  }

  const rejectAdvisorHandler = async (id: string | number) => {
    setBusyId(`reject-${id}`)
    try {
      await rejectAdminAdvisor(String(id))
      setAdvisorList((prev) => prev.filter((a) => String(a.id) !== String(id)))
      refreshStats()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Từ chối tư vấn viên thất bại')
    } finally {
      setBusyId(null)
    }
  }

  const removeForumPost = async (id: string | number) => {
    if (!window.confirm('Xóa vĩnh viễn bài viết này?')) return
    setBusyId(`delete-${id}`)
    try {
      await deleteAdminForumPost(String(id))
      setForumPosts((prev) => prev.filter((p) => String(p.id) !== String(id)))
      refreshStats()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Xóa bài viết thất bại')
    } finally {
      setBusyId(null)
    }
  }

  const saveSystemSettings = async () => {
    setSaveMsg('')
    try {
      await Promise.all([
        updateSystemSetting(OCR_API_KEY_SETTING, ocrKey),
        updateSystemSetting(OCR_PROVIDER_SETTING, ocrProvider),
        updateSystemSetting(ADMISSION_METHODS_SETTING, admissionMethods),
      ])
      setSaveMsg('Đã lưu cấu hình hệ thống.')
    } catch (e) {
      setSaveMsg(e instanceof Error ? `Lưu thất bại: ${e.message}` : 'Lưu cấu hình thất bại')
    }
  }

  const banForumAuthor = async (post: AdminForumPost) => {
    if (!window.confirm(`Khóa tài khoản ${post.authorName || post.authorId} vì nội dung vi phạm?`)) return
    setBusyId(`ban-${post.authorId}`)
    try {
      await updateAdminUserStatus(post.authorId, false)
      setUsers((prev) => prev.map((item) => String(item.id) === String(post.authorId) ? { ...item, isActive: false } : item))
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Không thể khóa người dùng.')
    } finally {
      setBusyId(null)
    }
  }

  const addAcademicYear = async () => {
    const value = window.prompt('Nhập năm tuyển sinh, ví dụ 2027:')
    if (!value) return
    const year = Number(value)
    if (!Number.isInteger(year) || year < 2000 || year > 2200) {
      setSaveMsg('Năm tuyển sinh không hợp lệ.')
      return
    }
    try {
      const created = await createAcademicYear(String(year), true)
      setAcademicYears((prev) => [...prev, created].sort((a, b) => Number(b.year) - Number(a.year)))
    } catch (e) {
      setSaveMsg(e instanceof Error ? e.message : 'Không thể thêm niên khóa.')
    }
  }

  const toggleAcademicYear = async (year: AcademicYear) => {
    const updated = await updateAcademicYear(year.id, year.year, !year.isActive)
    setAcademicYears((prev) => prev.map((item) => item.id === year.id ? updated : item))
  }

  const removeAcademicYear = async (year: AcademicYear) => {
    if (!window.confirm(`Xóa niên khóa ${year.year}?`)) return
    await deleteAcademicYear(year.id)
    setAcademicYears((prev) => prev.filter((item) => item.id !== year.id))
  }

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="Tổng quan hệ thống"
        description={user?.name ? `Chào mừng trở lại, ${user.name}` : 'Bảng điều khiển quản trị'}
        icon={<BarChart3 className="h-6 w-6" />}
      />

      {error && (
        <div className="flex items-center justify-between gap-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3">
          <span className="text-sm text-red-600">Có lỗi khi tải dữ liệu: {error}</span>
          <Button size="sm" variant="outline" onClick={loadDashboard}>Thử lại</Button>
        </div>
      )}

      <Tabs tabs={tabs} activeTab={activeTab} onTabChange={setActiveTab} />

        {activeTab === 'overview' && (
          <div className="space-y-6">
            {/* Stats */}
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
                        <p className="font-display text-3xl font-bold text-navy-800">{loading && !stats ? '…' : stat.value}</p>
                        <p className="text-sm text-slate-500 mt-1">{stat.label}</p>
                      </CardContent>
                    </Card>
                  </BlurReveal>
                )
              })}
            </div>

            {/* Recent activity */}
            <BlurReveal duration={600} delay={520}>
            <Card>
              <CardHeader>
                <CardTitle>Hoạt động gần đây</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {loading && recentActivity.length === 0 && (
                    <p className="text-sm text-slate-400">Đang tải hoạt động...</p>
                  )}
                  {!loading && recentActivity.length === 0 && (
                    <p className="text-sm text-slate-400">Chưa có hoạt động nào trên hệ thống.</p>
                  )}
                  {recentActivity.map((item) => (
                    <div key={item.id} className="flex items-center gap-3 p-3 bg-cream-50 rounded-xl">
                      <div className={`w-2 h-2 rounded-full flex-shrink-0 ${
                        item.type === 'success' ? 'bg-green-500' :
                        item.type === 'warning' ? 'bg-yellow-500' : 'bg-blue-500'
                      }`} />
                      <p className="text-sm text-navy-800 flex-1">{item.text}</p>
                      <span className="text-xs text-slate-400">{item.time}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
            </BlurReveal>
          </div>
        )}

        {activeTab === 'advisors' && (
          <div className="space-y-6">
            <BlurReveal duration={600} delay={120}>
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Xác minh tư vấn viên ({advisorList.length} chờ duyệt)</CardTitle>
                  <Badge variant="warning">{advisorList.length} chờ duyệt</Badge>
                </div>
              </CardHeader>
              <CardContent className="p-0">
                <div className="divide-y divide-cream-200">
                  {!loading && advisorList.length === 0 && (
                    <p className="p-5 text-sm text-slate-400">Không có tư vấn viên nào đang chờ xác minh.</p>
                  )}
                  {advisorList.map((adv) => (
                    <div key={adv.id} className="p-5">
                      <div className="flex items-start justify-between">
                        <div className="flex items-start gap-4">
                          <Avatar name={adv.name || '?'} size="md" />
                          <div>
                            <h4 className="font-semibold text-navy-800">
                              {adv.name || 'Chưa có tên'}{adv.title ? ` — ${adv.title}` : ''}
                            </h4>
                            <p className="text-sm text-slate-500">{adv.university || 'Chưa chọn trường'}</p>
                            <p className="text-sm text-slate-400">{adv.email}</p>
                            {adv.bio && <p className="text-xs text-slate-400 mt-1 max-w-xl">{adv.bio}</p>}
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <Button size="sm" variant="primary" disabled={busyId === `approve-${adv.id}`} onClick={() => approveAdvisor(adv.id)}>
                            <Check className="w-3 h-3" /> Phê duyệt
                          </Button>
                          <Button size="sm" variant="danger" disabled={busyId === `reject-${adv.id}`} onClick={() => rejectAdvisorHandler(adv.id)}>
                            <X className="w-3 h-3" /> Từ chối
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
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
                <div className="flex items-center justify-between">
                  <CardTitle>Kiểm duyệt bài viết diễn đàn</CardTitle>
                  <Badge variant="navy">{forumPosts.length} bài viết</Badge>
                </div>
                <p className="text-xs text-slate-400 mt-1">
                  Hiển thị các bài viết mới nhất để quản trị viên kiểm duyệt.
                </p>
              </CardHeader>
              <CardContent className="p-0">
                <div className="divide-y divide-cream-200">
                  {!loading && moderationPosts.length === 0 && (
                    <p className="p-5 text-sm text-slate-400">Không có bài viết nào để kiểm duyệt.</p>
                  )}
                  {moderationPosts.map((post) => (
                    <div key={post.id} className="p-5">
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <Badge variant={post.isDeleted ? 'default' : 'danger'} size="sm" className="mb-2">
                            {post.isDeleted ? 'Đã xóa' : 'Bài viết mới'}
                          </Badge>
                          <h4 className="font-semibold text-navy-800">{post.threadTitle || 'Bài viết'}</h4>
                          <p className="text-sm text-slate-500 mt-1">{post.content}</p>
                          <p className="text-sm text-slate-400 mt-1">
                            Tác giả: {post.authorName || 'Ẩn danh'} • {post.createdAt ? formatForumDate(post.createdAt) : ''}
                          </p>
                        </div>
                        {!post.isDeleted && (
                          <div className="flex gap-2 flex-shrink-0">
                            <Button size="sm" variant="danger" disabled={busyId === `delete-${post.id}`} onClick={() => removeForumPost(post.id)}>Xóa bài</Button>
                            <Button size="sm" variant="outline" disabled={busyId === `ban-${post.authorId}`} onClick={() => banForumAuthor(post)}>Khóa tác giả</Button>
                            <Button size="sm" variant="outline" onClick={() => setDismissedPostIds((prev) => [...prev, String(post.id)])}>Bỏ qua</Button>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
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
                <CardTitle>Cấu hình hệ thống</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <h4 className="font-semibold text-navy-800 mb-3">Niên khóa & Phương thức tuyển sinh</h4>
                  <div className="space-y-3">
                    {academicYears.length === 0 && (
                      <p className="text-sm text-slate-400">Chưa có niên khóa nào trong hệ thống.</p>
                    )}
                    {academicYears.map((year) => (
                      <div key={year.id} className="flex items-center justify-between p-3 bg-cream-50 rounded-xl">
                        <span className="text-sm font-medium text-navy-800">{year.year}</span>
                        <div className="flex items-center gap-2">
                          <button onClick={() => toggleAcademicYear(year)}>
                            <Badge variant={year.isActive ? 'success' : 'default'}>
                              {year.isActive ? 'Đang hoạt động' : 'Không hoạt động'}
                            </Badge>
                          </button>
                          <Button variant="danger" size="sm" onClick={() => removeAcademicYear(year)}>Xóa</Button>
                        </div>
                      </div>
                    ))}
                    <Button variant="outline" size="sm" onClick={addAcademicYear}>+ Thêm niên khóa mới</Button>
                  </div>
                </div>

                <div className="pt-4 border-t border-cream-200">
                  <h4 className="font-semibold text-navy-800 mb-3">Phương thức tuyển sinh</h4>
                  <textarea
                    rows={5}
                    value={admissionMethods}
                    onChange={(e) => setAdmissionMethods(e.target.value)}
                    placeholder={'Thi tốt nghiệp THPT\nXét học bạ\nĐánh giá năng lực'}
                    className="w-full px-4 py-2.5 rounded-xl border border-cream-200 bg-white text-navy-800 focus:outline-none focus:ring-2 focus:ring-gold-400 resize-none"
                  />
                  <p className="text-xs text-slate-400 mt-1">Mỗi phương thức nhập trên một dòng.</p>
                </div>

                <div className="pt-4 border-t border-cream-200">
                  <h4 className="font-semibold text-navy-800 mb-3">OCR API Configuration</h4>
                  <div className="space-y-3">
                    <div>
                      <label className="text-sm text-slate-600 block mb-1.5">OCR Provider</label>
                      <select value={ocrProvider} onChange={(e) => setOcrProvider(e.target.value)}
                        className="w-full px-4 py-2.5 rounded-xl border border-cream-200 bg-white text-navy-800 focus:outline-none focus:ring-2 focus:ring-gold-400">
                        <option value="PaddleOCR">PaddleOCR</option>
                        <option value="GoogleVision">Google Cloud Vision</option>
                        <option value="AzureVision">Azure AI Vision</option>
                        <option value="Gemini">Google Gemini</option>
                      </select>
                    </div>
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
                    <Button variant="primary" size="sm" onClick={saveSystemSettings}>Lưu cấu hình hệ thống</Button>
                    {saveMsg && (
                      <p className={`text-xs ${saveMsg.startsWith('Đã lưu') ? 'text-green-600' : 'text-red-500'}`}>{saveMsg}</p>
                    )}
                  </div>
                </div>

                <div className="pt-4 border-t border-cream-200">
                  <h4 className="font-semibold text-navy-800 mb-3">Quản lý dữ liệu</h4>
                  <div className="flex gap-3">
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
    </div>
  )
}
