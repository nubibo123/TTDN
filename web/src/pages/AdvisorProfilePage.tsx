import { useState, useEffect, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
import {
  Shield,
  LogOut,
  Loader2,
  MapPin,
  GraduationCap,
  CheckCircle2,
  Clock,
  Save,
  Building2,
  FileText,
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Avatar } from '@/components/ui/Avatar'
import { Input } from '@/components/ui/Input'
import BlurReveal from '@/components/BlurReveal'
import { useAuth } from '@/lib/authContext'
import { getUniversities, type University } from '@/lib/universities'
import {
  getMyAdvisorProfile,
  updateMyAdvisorProfile,
  type AdvisorDto,
} from '@/lib/advisor'

export default function AdvisorProfilePage() {
  const { user, logout } = useAuth()

  const [profile, setProfile] = useState<AdvisorDto | null>(null)
  const [loading, setLoading] = useState(true)

  const [universities, setUniversities] = useState<University[]>([])
  const [universityId, setUniversityId] = useState('')
  const [title, setTitle] = useState('')
  const [bio, setBio] = useState('')
  const [saving, setSaving] = useState(false)
  const [saveMsg, setSaveMsg] = useState('')

  useEffect(() => {
    getUniversities().then((list) => setUniversities(list)).catch(() => {})
  }, [])

  useEffect(() => {
    if (!user) return
    let active = true
    setLoading(true)
    getMyAdvisorProfile()
      .then((data) => {
        if (!active) return
        setProfile(data)
        if (data) {
          setUniversityId(data.universityId || '')
          setTitle(data.title || '')
          setBio(data.bio || '')
        }
      })
      .catch((err) => console.warn('Could not fetch advisor profile:', err))
      .finally(() => {
        if (active) setLoading(false)
      })
    return () => {
      active = false
    }
  }, [user])

  const handleSave = async (e: FormEvent) => {
    e.preventDefault()
    if (!universityId) {
      setSaveMsg('Vui lòng chọn trường đại học')
      return
    }
    setSaving(true)
    setSaveMsg('')
    try {
      const updated = await updateMyAdvisorProfile({ universityId, title, bio })
      setProfile(updated)
      setSaveMsg('Đã lưu thông tin')
      setTimeout(() => setSaveMsg(''), 2000)
    } catch {
      setSaveMsg('Lỗi khi lưu, vui lòng thử lại')
    } finally {
      setSaving(false)
    }
  }

  const displayName = user?.name || profile?.name || 'Tư vấn viên'
  const displayEmail = user?.email || profile?.email || 'Chưa đăng nhập'
  const selectedUniversity = universities.find((u) => u.id === universityId)

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <BlurReveal as="div" className="mb-8" duration={700}>
        <h1 className="font-display text-4xl font-bold text-navy-800 mb-2">Hồ sơ tư vấn viên</h1>
        <p className="text-slate-600">Quản lý thông tin chuyên môn của bạn trên Hướng Nghiệp</p>
      </BlurReveal>

      {loading ? (
        <div className="py-16 text-center text-slate-400">
          <Loader2 className="w-8 h-8 animate-spin mx-auto mb-3 text-gold-500" />
          <p className="text-sm">Đang tải hồ sơ...</p>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Profile header */}
          <BlurReveal duration={600} delay={120}>
            <Card className="bg-navy-800 border-navy-800">
              <CardContent className="p-6">
                <div className="flex flex-col sm:flex-row items-center gap-5 text-center sm:text-left">
                  <Avatar name={displayName} size="lg" className="w-20 h-20 text-xl" />
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-center sm:justify-start gap-2">
                      <h2 className="font-display text-2xl font-bold text-cream-50">{displayName}</h2>
                      {profile?.verified ? (
                        <Badge variant="success">Đã xác minh</Badge>
                      ) : (
                        <Badge variant="warning">
                          <Clock className="w-3 h-3 mr-1" /> Chờ xác minh
                        </Badge>
                      )}
                    </div>
                    <p className="text-cream-200 text-sm mt-1">{displayEmail}</p>
                    <div className="flex flex-wrap items-center justify-center sm:justify-start gap-3 mt-3">
                      {profile?.title && (
                        <span className="flex items-center gap-1 text-xs text-cream-200">
                          <GraduationCap className="w-3 h-3" />
                          {profile.title}
                        </span>
                      )}
                      {(profile?.universityName || selectedUniversity?.name) && (
                        <span className="flex items-center gap-1 text-xs text-cream-200">
                          <MapPin className="w-3 h-3" />
                          {profile?.universityName || selectedUniversity?.name}
                        </span>
                      )}
                    </div>
                  </div>
                  <Link to="/cong-dong">
                    <Button variant="outline" className="border-cream-100/30 text-cream-100 hover:bg-cream-100/10">
                      Xem cộng đồng
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          </BlurReveal>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Edit info */}
            <BlurReveal duration={600} delay={280}>
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Shield className="w-5 h-5 text-gold-600" />
                      <CardTitle>Thông tin tư vấn</CardTitle>
                    </div>
                    {saveMsg && (
                      <span className={`text-xs font-medium ${saveMsg.startsWith('Lỗi') ? 'text-red-600' : 'text-green-600'}`}>
                        {saveMsg}
                      </span>
                    )}
                  </div>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleSave} className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-navy-800 mb-1.5">Trường đại học</label>
                      <div className="relative">
                        <select
                          value={universityId}
                          onChange={(e) => setUniversityId(e.target.value)}
                          required
                          className="w-full px-4 py-2.5 rounded-xl border border-cream-200 bg-white text-navy-800 focus:outline-none focus:ring-2 focus:ring-gold-400 text-sm appearance-none"
                        >
                          <option value="">Chọn trường...</option>
                          {universities.map((u) => (
                            <option key={u.id} value={u.id}>{u.name}</option>
                          ))}
                        </select>
                        <Building2 className="w-4 h-4 text-slate-400 absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none" />
                      </div>
                    </div>

                    <Input
                      label="Chức danh"
                      type="text"
                      placeholder="VD: Giảng viên Kinh tế"
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                    />

                    <div>
                      <label className="block text-sm font-medium text-navy-800 mb-1.5">Giới thiệu</label>
                      <textarea
                        value={bio}
                        onChange={(e) => setBio(e.target.value)}
                        placeholder="Kinh nghiệm, chuyên môn..."
                        rows={4}
                        className="w-full px-4 py-2.5 rounded-xl border border-cream-200 bg-white text-navy-800 focus:outline-none focus:ring-2 focus:ring-gold-400 text-sm resize-none"
                      />
                    </div>

                    <Button type="submit" variant="primary" size="lg" disabled={saving} className="w-full">
                      {saving ? (
                        <span className="inline-flex items-center gap-2">
                          <Loader2 className="w-4 h-4 animate-spin" /> Đang lưu...
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-2">
                          <Save className="w-4 h-4" /> Lưu thông tin
                        </span>
                      )}
                    </Button>
                  </form>
                </CardContent>
              </Card>
            </BlurReveal>

            {/* Verification status */}
            <BlurReveal duration={600} delay={420}>
              <Card>
                <CardHeader>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-5 h-5 text-gold-600" />
                    <CardTitle>Trạng thái tài khoản</CardTitle>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {profile?.verified ? (
                    <div className="p-4 rounded-xl bg-green-50 border border-green-200">
                      <div className="flex items-start gap-3">
                        <CheckCircle2 className="w-5 h-5 text-green-600 mt-0.5 shrink-0" />
                        <div>
                          <p className="font-medium text-green-800 text-sm">Tài khoản đã được xác minh</p>
                          <p className="text-xs text-green-700 mt-1 leading-relaxed">
                            Hồ sơ của bạn đang hiển thị cho học sinh và có thể nhận yêu cầu tư vấn.
                          </p>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="p-4 rounded-xl bg-yellow-50 border border-yellow-200">
                      <div className="flex items-start gap-3">
                        <Clock className="w-5 h-5 text-yellow-600 mt-0.5 shrink-0" />
                        <div>
                          <p className="font-medium text-yellow-800 text-sm">Đang chờ xác minh</p>
                          <p className="text-xs text-yellow-700 mt-1 leading-relaxed">
                            Ban quản trị đang kiểm duyệt hồ sơ của bạn. Khi được duyệt, hồ sơ sẽ
                            hiển thị công khai và bạn có thể nhận yêu cầu tư vấn từ học sinh.
                          </p>
                        </div>
                      </div>
                    </div>
                  )}

                  <div className="p-4 rounded-xl bg-cream-50 border border-cream-200">
                    <div className="flex items-start gap-3">
                      <FileText className="w-5 h-5 text-gold-600 mt-0.5 shrink-0" />
                      <div>
                        <p className="font-medium text-navy-800 text-sm">Thông tin chuyên môn</p>
                        <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                          Cập nhật trường, chức danh và giới thiệu để học sinh hiểu rõ hơn về
                          lĩnh vực tư vấn của bạn.
                        </p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </BlurReveal>
          </div>

          {/* Account actions */}
          <BlurReveal duration={600} delay={560}>
            <Card>
              <CardContent className="p-6">
                <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-cream-100 rounded-xl flex items-center justify-center">
                      <Shield className="w-6 h-6 text-slate-500" />
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
      )}
    </div>
  )
}
