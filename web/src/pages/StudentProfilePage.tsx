import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import {
  User,
  Lock,
  Globe,
  Bell,
  LogOut,
  Shield,
  Loader2,
  MapPin,
  GraduationCap,
  Heart,
  ChevronRight,
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Avatar } from '@/components/ui/Avatar'
import BlurReveal from '@/components/BlurReveal'
import { useAuth } from '@/lib/authContext'
import { getMyTranscripts, type TranscriptDto } from '@/lib/transcripts'
import { getSavedUniversities, toggleSaveUniversity, type University } from '@/lib/universities'
import {
  getMyStudentProfile,
  updateMyStudentProfile,
  type StudentProfileDto,
} from '@/lib/studentProfile'

type PrivacyKey = 'showGrades' | 'isProfilePublic' | 'allowContact' | 'showInForum'

const PRIVACY_ITEMS: { key: PrivacyKey; label: string; desc: string }[] = [
  { key: 'showGrades', label: 'Hiển thị điểm học bạ', desc: 'Cho phép tư vấn viên xem điểm của bạn' },
  { key: 'isProfilePublic', label: 'Hiển thị hồ sơ công khai', desc: 'Hồ sơ hiển thị với tư vấn viên và trường' },
  { key: 'allowContact', label: 'Cho phép liên hệ', desc: 'Tư vấn viên có thể chủ động liên hệ bạn' },
  { key: 'showInForum', label: 'Hiển thị trong forum', desc: 'Cho phép hiển thị tên khi tham gia thảo luận' },
]

type NotificationKey = 'emailNewConsult' | 'emailNewReply' | 'pushSchoolUpdate' | 'pushNews'

const NOTIFICATION_ITEMS: { key: NotificationKey; label: string; desc: string }[] = [
  { key: 'emailNewConsult', label: 'Email khi có tư vấn viên phản hồi', desc: 'Nhận email khi tư vấn viên trả lời câu hỏi' },
  { key: 'emailNewReply', label: 'Email khi có người reply', desc: 'Nhận thông báo khi có reply mới trên bài viết' },
  { key: 'pushSchoolUpdate', label: 'Thông báo cập nhật trường', desc: 'Nhận thông báo khi trường bạn quan tâm cập nhật thông tin' },
  { key: 'pushNews', label: 'Tin tức tuyển sinh', desc: 'Nhận tin tức và bài viết mới nhất' },
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

const DEFAULT_TRANSCRIPT_ITEMS = [
  { semester: 'HK1_L12', label: 'Học kỳ 1 Lớp 12' },
  { semester: 'HK2_L12', label: 'Học kỳ 2 Lớp 12' },
  { semester: 'GRADUATION_EXAM', label: 'Điểm thi TN THPT' },
]

function Toggle({
  checked,
  onChange,
  disabled,
}: {
  checked: boolean
  onChange: () => void
  disabled?: boolean
}) {
  return (
    <button
      type="button"
      onClick={onChange}
      disabled={disabled}
      aria-pressed={checked}
      className={`
        relative w-12 h-7 rounded-full transition-colors duration-200 flex-shrink-0
        ${checked ? 'bg-gold-500' : 'bg-slate-300'}
        ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
      `}
    >
      <span
        className={`
          absolute top-1 left-1 w-5 h-5 bg-white rounded-full shadow transition-transform duration-200
          ${checked ? 'translate-x-5' : 'translate-x-0'}
        `}
      />
    </button>
  )
}

export default function StudentProfilePage() {
  const { user, logout } = useAuth()

  const [profile, setProfile] = useState<StudentProfileDto | null>(null)
  const [loadingProfile, setLoadingProfile] = useState(true)
  const [savingPrivacy, setSavingPrivacy] = useState(false)
  const [privacySaveMsg, setPrivacySaveMsg] = useState('')

  const [savedUnis, setSavedUnis] = useState<University[]>([])
  const [loadingSavedUnis, setLoadingSavedUnis] = useState(false)

  const [transcriptsList, setTranscriptsList] = useState<TranscriptDto[]>([])
  const [loadingTranscripts, setLoadingTranscripts] = useState(false)

  useEffect(() => {
    let active = true
    setLoadingSavedUnis(true)
    getSavedUniversities()
      .then((data) => {
        if (active && data) setSavedUnis(data)
      })
      .catch((err) => console.warn('Could not fetch saved universities:', err))
      .finally(() => {
        if (active) setLoadingSavedUnis(false)
      })
    return () => {
      active = false
    }
  }, [user])

  const [notifications, setNotifications] = useState<Record<NotificationKey, boolean>>({
    emailNewConsult: true,
    emailNewReply: true,
    pushSchoolUpdate: false,
    pushNews: true,
  })

  useEffect(() => {
    if (!user) return
    let active = true
    setLoadingProfile(true)
    getMyStudentProfile()
      .then((data) => {
        if (active) setProfile(data)
      })
      .catch((err) => console.warn('Could not fetch student profile:', err))
      .finally(() => {
        if (active) setLoadingProfile(false)
      })
    return () => {
      active = false
    }
  }, [user])

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

  const togglePrivacy = async (key: PrivacyKey) => {
    if (!profile) return
    const next = { ...profile, [key]: !profile[key] }
    setSavingPrivacy(true)
    setPrivacySaveMsg('')
    try {
      const updated = await updateMyStudentProfile({
        graduationYear: next.graduationYear,
        province: next.province,
        isProfilePublic: next.isProfilePublic,
        showGrades: next.showGrades,
        allowContact: next.allowContact,
        showInForum: next.showInForum,
      })
      setProfile(updated)
      setPrivacySaveMsg('Đã lưu')
      setTimeout(() => setPrivacySaveMsg(''), 2000)
    } catch {
      setPrivacySaveMsg('Lỗi khi lưu, vui lòng thử lại')
    } finally {
      setSavingPrivacy(false)
    }
  }

  const toggleNotification = (key: NotificationKey) => {
    setNotifications((prev) => ({ ...prev, [key]: !prev[key] }))
  }

  const displayTranscripts = DEFAULT_TRANSCRIPT_ITEMS.map((item) => {
    const found = transcriptsList.find((t) => t.semester === item.semester)
    return {
      label: item.label,
      avg: found?.avgScore ?? null,
      status: found ? (found.isDraft ? 'draft' : 'saved') : 'empty',
    }
  })

  const displayName = user?.name || 'Học sinh'
  const displayEmail = user?.email || 'Chưa đăng nhập'

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
              <Avatar src={profile?.avatarUrl || undefined} name={displayName} size="lg" className="w-20 h-20 text-xl" />
              <div className="flex-1 min-w-0">
                <h2 className="font-display text-2xl font-bold text-cream-50">{displayName}</h2>
                <p className="text-cream-200 text-sm mt-1">{displayEmail}</p>
                <div className="flex flex-wrap items-center justify-center sm:justify-start gap-3 mt-3">
                  <Badge variant="gold">Học sinh lớp 12</Badge>
                  {profile?.province && (
                    <span className="flex items-center gap-1 text-xs text-cream-200">
                      <MapPin className="w-3 h-3" />
                      {profile.province}
                    </span>
                  )}
                  {profile?.graduationYear && (
                    <span className="flex items-center gap-1 text-xs text-cream-200">
                      <GraduationCap className="w-3 h-3" />
                      TN {profile.graduationYear}
                    </span>
                  )}
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
        {/* My transcripts */}
        <BlurReveal duration={600} delay={340}>
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <GraduationCap className="w-5 h-5 text-gold-600" />
                  <CardTitle>Học bạ của tôi</CardTitle>
                </div>
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

        {/* Saved Universities */}
        <BlurReveal duration={600} delay={400} className="md:col-span-2">
          <Card>
            <CardHeader>
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <Heart className="w-5 h-5 text-red-500 fill-current" />
                  <CardTitle>Trường đại học đã lưu ({savedUnis.length})</CardTitle>
                </div>
                <div className="flex items-center gap-2">
                  <Link to="/so-sanh">
                    <Button variant="outline" size="sm" className="border-gold-400 text-gold-600 hover:bg-gold-50 text-xs">
                      So sánh ngay
                    </Button>
                  </Link>
                  <Link to="/truong" className="text-sm text-gold-600 font-medium hover:text-gold-500">
                    Khám phá thêm
                  </Link>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-6">
              {loadingSavedUnis ? (
                <div className="py-6 text-center text-slate-400">
                  <Loader2 className="w-5 h-5 animate-spin mx-auto mb-1 text-gold-500" />
                  <p className="text-xs">Đang tải danh sách trường đã lưu...</p>
                </div>
              ) : savedUnis.length === 0 ? (
                <div className="text-center py-6 text-slate-500">
                  <p className="text-sm mb-2">Bạn chưa lưu trường đại học nào.</p>
                  <Link to="/truong">
                    <Button variant="outline" size="sm">
                      Xem danh sách trường
                    </Button>
                  </Link>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {savedUnis.map((uni) => (
                    <div key={uni.id} className="p-4 rounded-xl border border-cream-200 bg-white hover:border-gold-400/40 transition-all flex items-center justify-between gap-3">
                      <div className="min-w-0">
                        <Link to={`/truong/${uni.id}`} className="font-semibold text-navy-800 text-sm hover:text-gold-600 block truncate">
                          {uni.name}
                        </Link>
                        <p className="text-xs text-slate-500 mt-0.5 font-mono">
                          Mã: {uni.code} • {uni.region === 'NORTH' ? 'Miền Bắc' : uni.region === 'CENTRAL' ? 'Miền Trung' : 'Miền Nam'}
                        </p>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <button
                          onClick={async () => {
                            await toggleSaveUniversity(uni.id, Boolean(user))
                            setSavedUnis((prev) => prev.filter((u) => u.id !== uni.id))
                          }}
                          className="p-1.5 rounded-full text-red-500 bg-red-50 hover:bg-red-100 transition-colors"
                          title="Bỏ lưu trường"
                        >
                          <Heart className="w-4 h-4 fill-current" />
                        </button>
                        <Link to={`/truong/${uni.id}`}>
                          <ChevronRight className="w-4 h-4 text-slate-400 hover:text-navy-800" />
                        </Link>
                      </div>
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
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Shield className="w-5 h-5 text-gold-600" />
                  <CardTitle>Quyền riêng tư</CardTitle>
                </div>
                {privacySaveMsg && (
                  <span className="text-xs text-green-600 font-medium">{privacySaveMsg}</span>
                )}
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {loadingProfile ? (
                <div className="py-4 text-center text-slate-400">
                  <Loader2 className="w-5 h-5 animate-spin mx-auto text-gold-500" />
                </div>
              ) : profile ? (
                PRIVACY_ITEMS.map((item) => (
                  <div key={item.key} className="flex items-start justify-between gap-4">
                    <div>
                      <p className="font-medium text-navy-800 text-sm">{item.label}</p>
                      <p className="text-xs text-slate-500 mt-0.5">{item.desc}</p>
                    </div>
                    <Toggle
                      checked={!!profile[item.key]}
                      onChange={() => togglePrivacy(item.key)}
                      disabled={savingPrivacy}
                    />
                  </div>
                ))
              ) : (
                <p className="text-sm text-slate-400">Không thể tải cài đặt quyền riêng tư</p>
              )}
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
              {NOTIFICATION_ITEMS.map((item) => (
                <div key={item.key} className="flex items-start justify-between gap-4">
                  <div>
                    <p className="font-medium text-navy-800 text-sm">{item.label}</p>
                    <p className="text-xs text-slate-500 mt-0.5">{item.desc}</p>
                  </div>
                  <Toggle
                    checked={notifications[item.key]}
                    onChange={() => toggleNotification(item.key)}
                  />
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
                  <Lock className="w-6 h-6 text-slate-500" />
                </div>
                <div>
                  <p className="font-semibold text-navy-800">{displayName}</p>
                  <p className="text-sm text-slate-500">{displayEmail}</p>
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
