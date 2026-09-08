import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { ArrowLeft, GraduationCap, Lock, MapPin, Loader2, ShieldCheck } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/Card'
import { Avatar } from '@/components/ui/Avatar'
import { Badge } from '@/components/ui/Badge'
import { getPublicProfile, type PublicProfileDto } from '@/lib/publicProfile'

export default function PublicProfilePage() {
  const { userId = '' } = useParams<{ userId: string }>()
  const [profile, setProfile] = useState<PublicProfileDto | null>(null)
  const [error, setError] = useState('')

  useEffect(() => {
    getPublicProfile(userId).then(setProfile).catch((err) => setError(err instanceof Error ? err.message : 'Không thể tải hồ sơ'))
  }, [userId])

  if (!profile && !error) return <div className="py-20 text-center"><Loader2 className="w-8 h-8 animate-spin mx-auto text-gold-500" /></div>
  if (error) return <div className="max-w-2xl mx-auto py-20 text-center"><Lock className="w-12 h-12 mx-auto mb-4 text-slate-300" /><p className="text-slate-600">{error}</p><Link to="/cong-dong" className="text-gold-600 mt-4 inline-block">Quay lại cộng đồng</Link></div>

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 py-10">
      <Link to="/cong-dong" className="inline-flex items-center gap-2 text-sm text-gold-600 mb-6"><ArrowLeft className="w-4 h-4" /> Quay lại cộng đồng</Link>
      <Card className="overflow-hidden">
        <div className="bg-navy-800 p-8 text-center">
          <Avatar src={profile?.avatarUrl || undefined} name={profile?.name || 'A'} size="lg" className="mx-auto mb-4 w-20 h-20" />
          <div className="flex justify-center items-center gap-2"><h1 className="font-display text-2xl font-bold text-cream-50">{profile?.name}</h1>{profile?.role === 'ADVISOR' && <Badge variant="gold"><ShieldCheck className="w-3 h-3 mr-1" /> Tư vấn viên</Badge>}</div>
          {profile?.role === 'ADVISOR' && <p className="text-cream-200 text-sm mt-2">{profile.title || 'Tư vấn viên tuyển sinh'}</p>}
          <div className="flex justify-center gap-3 mt-3 text-sm text-cream-200">
            {profile?.graduationYear && <span className="inline-flex items-center gap-1"><GraduationCap className="w-4 h-4" /> Tốt nghiệp {profile.graduationYear}</span>}
            {profile?.role === 'ADVISOR' && profile.universityName && <span className="inline-flex items-center gap-1"><MapPin className="w-4 h-4" /> {profile.universityName}</span>}
            {profile?.role === 'STUDENT' && profile.province && <span className="inline-flex items-center gap-1"><MapPin className="w-4 h-4" /> {profile.province}</span>}
          </div>
        </div>
        <CardContent className="p-6">
          {profile?.role === 'ADVISOR' ? <><h2 className="font-semibold text-navy-800 mb-2">Thông tin tư vấn</h2><p className="text-sm text-slate-600 whitespace-pre-wrap">{profile.bio || 'Tư vấn viên chưa cập nhật giới thiệu.'}</p></> : <><div className="flex items-center justify-between mb-4"><h2 className="font-semibold text-navy-800">Điểm học tập</h2><Badge variant={profile?.gradesVisible ? 'success' : 'default'}>{profile?.gradesVisible ? 'Công khai' : 'Riêng tư'}</Badge></div>{profile?.gradesVisible && profile.transcripts.length > 0 ? profile.transcripts.map((item) => <div key={item.id} className="flex justify-between border-b border-cream-100 py-3 text-sm"><span className="text-slate-600">{item.semester}</span><strong className="text-navy-800">{item.avgScore ?? '—'}</strong></div>) : <p className="text-sm text-slate-500">Người dùng chưa công khai điểm học tập.</p>}</>}
        </CardContent>
      </Card>
    </div>
  )
}