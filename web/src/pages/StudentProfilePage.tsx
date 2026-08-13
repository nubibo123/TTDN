import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { User, Lock, Eye, EyeOff, Globe, Bell, Heart, ChevronRight, LogOut, Shield, Loader2 } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Avatar } from '@/components/ui/Avatar'
import BlurReveal from '@/components/BlurReveal'
import { useAuth } from '@/lib/authContext'
import { getMyTranscripts, type TranscriptDto } from '@/lib/transcripts'

export default function StudentProfilePage() {
  const { user, logout } = useAuth()
  const [privacy, setPrivacy] = useState({
    showGrades: false,
    showProfile: false,
    allowContact: false,
    showInForum: true,
  })
  const [notifications, setNotifications] = useState({
    emailNewConsult: true,
    emailNewReply: true,
    pushSchoolUpdate: false,
    pushNews: true,
  })

  const [transcriptsList, setTranscriptsList] = useState<TranscriptDto[]>([])
  const [loadingTranscripts, setLoadingTranscripts] = useState(false)

  useEffect(() => {
    if (!user) return
    let active = true
    setLoadingTranscripts(true)
    getMyTranscripts()
      .then((data) => {
        if (active && data) {
          setTranscriptsList(data)
        }
      })
      .catch((err) => console.warn('Could not fetch transcripts for profile:', err))
      .finally(() => {
        if (active) setLoadingTranscripts(false)
      })
    return () => {
      active = false
    }
  }, [user])

  const savedSchools = [
    { id: 'KHA', name: 'Đại học Kinh tế Quốc dân', reason: 'Điểm chuẩn phù hợp', matchScore: 85 },
    { id: 'UIT', name: 'Đại học CNTT - ĐHQG TP.HCM', reason: 'Ngành CNTT top đầu', matchScore: 72 },
    { id: 'FTU', name: 'Đại học Ngoại thương', reason: 'Ngành Kinh doanh quốc tế', matchScore: 65 },
  ]

  const SEMESTER_LABELS: Record<string, string> = {
    HK1_L10: 'Học kỳ 1 Lớp 10',
    HK2_L10: 'Học kỳ 2 Lớp 10',
    HK1_L11: 'Học kỳ 1 Lớp 11',
    HK2_L11: 'Học kỳ 2 Lớp 11',
    HK1_L12: 'Học kỳ 1 Lớp 12',
    HK2_L12: 'Học kỳ 2 Lớp 12',
    GRADUATION_EXAM: 'Điểm thi TN THPT',
  }

  const DEFAULT_ITEMS = [
    { semester: 'HK1_L12', label: 'Học kỳ 1 Lớp 12' },
    { semester: 'HK2_L12', label: 'Học kỳ 2 Lớp 12' },
    { semester: 'GRADUATION_EXAM', label: 'Điểm thi TN THPT' },
  ]

  const displayTranscripts = DEFAULT_ITEMS.map((item) => {
    const found = transcriptsList.find((t) => t.semester === item.semester)
    return {
      label: item.label,
      avg: found?.avgScore ?? null,
      status: found ? (found.isDraft ? 'draft' : 'saved') : 'empty',
    }
  })

  const togglePrivacy = (key: keyof typeof privacy) => {
    setPrivacy({ ...privacy, [key]: !privacy[key] })
  }

  const toggleNotification = (key: keyof typeof notifications) => {
    setNotifications({ ...notifications, [key]: !notifications[key] })
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <BlurReveal as="div" className="mb-8" duration={700}>
        <h1 className="font-display text-4xl font-bold text-navy-800 mb-2">Hồ sơ của tôi</h1>
        <p className="text-slate-600">Quản lý thông tin cá nhân và cài đặt quyền riêng tư</p>
      </BlurReveal>

      {/* Profile header */}
      <BlurReveal duration={600} delay={120}>
        <Card className="mb-6 bg-navy-800 border-navy-800">
          <CardContent className="p-6">
            <div className="flex flex-col sm:flex-row items-center gap-5 text-center sm:text-left">
              <Avatar name={user?.name || 'Học sinh'} size="lg" className="w-20 h-20 text-xl" />
              <div className="flex-1">
                <h2 className="font-display text-2xl font-bold text-cream-50">{user?.name || 'Học sinh'}</h2>
                <p className="text-cream-200 text-sm mt-1">{user?.email || 'Chưa đăng nhập'}</p>
                <div className="flex flex-wrap items-center justify-center sm:justify-start gap-3 mt-3">
                  <Badge variant="gold">Học sinh lớp 12</Badge>
                  <Badge variant="navy">Việt Nam</Badge>
                </div>
              </div>
              <Link to="/diem-hoc-ky">
                <Button variant="outline" className="border-cream-100/30 text-cream-100 hover:bg-cream-100/10">
                  Cập nhật học bạ
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </BlurReveal>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Saved schools */}
        <BlurReveal duration={600} delay={220}>
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Trường đã lưu</CardTitle>
                <Link to="/truong" className="text-sm text-gold-600 font-medium hover:text-gold-500">
                  + Thêm trường
                </Link>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <div className="divide-y divide-cream-200">
                {savedSchools.map((school) => (
                  <Link
                    key={school.id}
                    to={`/truong/${school.id}`}
                    className="flex items-center justify-between p-4 hover:bg-cream-50 transition-colors"
                  >
                    <div className="flex-1">
                      <p className="font-semibold text-navy-800">{school.name}</p>
                      <p className="text-xs text-slate-500 mt-0.5">{school.reason}</p>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="text-right">
                        <p className="text-sm font-bold text-gold-600">{school.matchScore}%</p>
                        <p className="text-xs text-slate-400">phù hợp</p>
                      </div>
                      <ChevronRight className="w-4 h-4 text-slate-300" />
                    </div>
                  </Link>
                ))}
              </div>
            </CardContent>
          </Card>
        </BlurReveal>

        {/* My transcripts */}
        <BlurReveal duration={600} delay={340}>
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Học bạ của tôi</CardTitle>
                <Link to="/diem-hoc-ky" className="text-sm text-gold-600 font-medium hover:text-gold-500">
                  Chỉnh sửa
                </Link>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              {loadingTranscripts ? (
                <div className="py-8 text-center text-slate-400">
                  <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2 text-gold-500" />
                  <p className="text-xs">Đang tải học bạ...</p>
                </div>
              ) : (
                <div className="divide-y divide-cream-200">
                  {displayTranscripts.map((t) => (
                    <div key={t.label} className="flex items-center justify-between p-4">
                      <div>
                        <p className="font-medium text-navy-800">{t.label}</p>
                        {t.status === 'saved' && (
                          <Badge variant="success" size="sm" className="mt-1">
                            Đã lưu
                          </Badge>
                        )}
                        {t.status === 'draft' && (
                          <Badge variant="warning" size="sm" className="mt-1">
                            Bản nháp
                          </Badge>
                        )}
                        {t.status === 'empty' && (
                          <Badge variant="default" size="sm" className="mt-1 text-slate-400">
                            Chưa nhập
                          </Badge>
                        )}
                      </div>
                      {t.avg !== null ? (
                        <span className="font-display text-2xl font-bold text-navy-800">{t.avg.toFixed(2)}</span>
                      ) : (
                        <Link to="/diem-hoc-ky">
                          <Button variant="outline" size="sm">
                            Nhập điểm
                          </Button>
                        </Link>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </BlurReveal>

        {/* Privacy settings */}
        <BlurReveal duration={600} delay={460}>
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Shield className="w-5 h-5 text-gold-600" />
                <CardTitle>Quyền riêng tư</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {[
                {
                  key: 'showGrades' as const,
                  label: 'Hiển thị điểm học bạ',
                  desc: 'Cho phép tư vấn viên xem điểm của bạn',
                },
                {
                  key: 'showProfile' as const,
                  label: 'Hiển thị hồ sơ công khai',
                  desc: 'Hồ sơ hiển thị với tư vấn viên và trường',
                },
                {
                  key: 'allowContact' as const,
                  label: 'Cho phép liên hệ',
                  desc: 'Tư vấn viên có thể chủ động liên hệ bạn',
                },
                {
                  key: 'showInForum' as const,
                  label: 'Hiển thị trong forum',
                  desc: 'Cho phép hiển thị tên khi tham gia thảo luận',
                },
              ].map((item) => (
                <div key={item.key} className="flex items-start justify-between gap-4">
                  <div>
                    <p className="font-medium text-navy-800 text-sm">{item.label}</p>
                    <p className="text-xs text-slate-500 mt-0.5">{item.desc}</p>
                  </div>
                  <button
                    onClick={() => togglePrivacy(item.key)}
                    className={`relative w-12 h-7 rounded-full transition-colors flex-shrink-0 mt-0.5 ${
                      privacy[item.key] ? 'bg-gold-500' : 'bg-slate-300'
                    }`}
                  >
                    <span
                      className={`absolute top-1 w-5 h-5 bg-white rounded-full shadow transition-transform ${
                        privacy[item.key] ? 'translate-x-6' : 'translate-x-1'
                      }`}
                    />
                  </button>
                </div>
              ))}
            </CardContent>
          </Card>
        </BlurReveal>

        {/* Notifications */}
        <BlurReveal duration={600} delay={560}>
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Bell className="w-5 h-5 text-gold-600" />
                <CardTitle>Thông báo</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {[
                {
                  key: 'emailNewConsult' as const,
                  label: 'Email khi có tư vấn viên phản hồi',
                  desc: 'Nhận email khi tư vấn viên trả lời câu hỏi',
                },
                {
                  key: 'emailNewReply' as const,
                  label: 'Email khi có người reply',
                  desc: 'Nhận thông báo khi có reply mới trên bài viết',
                },
                {
                  key: 'pushSchoolUpdate' as const,
                  label: 'Thông báo cập nhật trường',
                  desc: 'Nhận thông báo khi trường bạn quan tâm cập nhật thông tin',
                },
                { key: 'pushNews' as const, label: 'Tin tức tuyển sinh', desc: 'Nhận tin tức và bài viết mới nhất' },
              ].map((item) => (
                <div key={item.key} className="flex items-start justify-between gap-4">
                  <div>
                    <p className="font-medium text-navy-800 text-sm">{item.label}</p>
                    <p className="text-xs text-slate-500 mt-0.5">{item.desc}</p>
                  </div>
                  <button
                    onClick={() => toggleNotification(item.key)}
                    className={`relative w-12 h-7 rounded-full transition-colors flex-shrink-0 mt-0.5 ${
                      notifications[item.key] ? 'bg-gold-500' : 'bg-slate-300'
                    }`}
                  >
                    <span
                      className={`absolute top-1 w-5 h-5 bg-white rounded-full shadow transition-transform ${
                        notifications[item.key] ? 'translate-x-6' : 'translate-x-1'
                      }`}
                    />
                  </button>
                </div>
              ))}
            </CardContent>
          </Card>
        </BlurReveal>
      </div>

      {/* Account actions */}
      <BlurReveal duration={600} delay={660}>
        <Card className="mt-6">
          <CardContent className="p-6">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-cream-100 rounded-xl flex items-center justify-center">
                  <User className="w-6 h-6 text-slate-500" />
                </div>
                <div>
                  <p className="font-semibold text-navy-800">{user?.name || 'Tài khoản'}</p>
                  <p className="text-sm text-slate-500">{user?.email || 'Chưa đăng nhập'}</p>
                </div>
              </div>
              <div className="flex gap-3">
                {user ? (
                  <Button variant="danger" size="sm" onClick={() => logout()}>
                    <LogOut className="w-4 h-4" /> Đăng xuất
                  </Button>
                ) : (
                  <Link to="/dang-nhap">
                    <Button variant="primary" size="sm">
                      Đăng nhập
                    </Button>
                  </Link>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </BlurReveal>
    </div>
  )
}