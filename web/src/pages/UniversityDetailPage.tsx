import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { ArrowLeft, MapPin, Globe, BookOpen, Users, Award, GraduationCap, Wallet, Building2, ExternalLink, DollarSign, ChevronDown, ChevronUp, Heart } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Tabs } from '@/components/ui/Tabs'
import UniversityMap from '@/components/UniversityMap'
import { getLikelihood, cn } from '@/lib/utils'
import { getUniversityById, getSavedUniversityIds, toggleSaveUniversity, type University, type AdmissionScore, type Major } from '@/lib/universities'
import { getMajors, getAdmissionScores } from '@/lib/universities'
import { useAuth } from '@/lib/authContext'
import UniversityDetailSkeleton from './UniversityDetailSkeleton'

const INITIAL_MAJOR_COUNT = 8
const YEARS = [2023, 2024, 2025]

export default function UniversityDetailPage() {
  const { id } = useParams()
  const { user } = useAuth()
  const [uni, setUni] = useState<University | null>(null)
  const [majors, setMajors] = useState<Major[]>([])
  const [loading, setLoading] = useState(true)
  const [showAllMajors, setShowAllMajors] = useState(false)
  const [scores, setScores] = useState<Record<string, AdmissionScore[]>>({})
  const [expandedMajor, setExpandedMajor] = useState<string | null>(null)
  const [isSaved, setIsSaved] = useState(false)
  const [error, setError] = useState(false)

  useEffect(() => {
    if (!id) return
    setLoading(true)
    setError(false)
    Promise.all([
      getUniversityById(id),
      getMajors(id),
      getAdmissionScores(undefined, undefined, id),
      getSavedUniversityIds(),
    ]).then(([u, ms, allScores, savedIds]) => {
      setUni(u)
      setMajors(ms)
      setIsSaved(savedIds.includes(id))
      const grouped: Record<string, AdmissionScore[]> = {}
      for (const s of allScores) {
        if (!grouped[s.majorId]) grouped[s.majorId] = []
        grouped[s.majorId].push(s)
      }
      setScores(grouped)
    }).catch((err) => {
      console.error('UniversityDetailPage error:', err)
      setError(true)
    }).finally(() => setLoading(false))
  }, [id])

  const handleToggleSave = async () => {
    if (!id) return
    const saved = await toggleSaveUniversity(id, Boolean(user))
    setIsSaved(saved)
  }

  if (loading) return <UniversityDetailSkeleton />

  if (error || !uni) return (
    <div className="text-center py-20">
      <p className="text-slate-500">{error ? 'Không thể tải thông tin trường. Vui lòng thử lại.' : 'Không tìm thấy trường'}</p>
      <Link to="/truong" className="text-gold-600 mt-2 block">← Quay lại danh sách</Link>
    </div>
  )

  const typeLabel = uni.type === 'PUBLIC' ? 'Công lập' : uni.type === 'PRIVATE' ? 'Tư thục' : uni.type
  const hasCoords = uni.latitude != null && uni.longitude != null

  const studentScore = 27.5
  const hasMajors = majors.length > 0

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <Link to="/truong" className="inline-flex items-center gap-2 text-slate-600 hover:text-navy-800 mb-6 transition-colors">
        <ArrowLeft className="w-4 h-4" /> Quay lại danh sách
      </Link>

      <Card className="mb-8 overflow-hidden">
        <div className="bg-navy-800 px-8 py-8">
          <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-6">
            <div>
              <Badge variant="gold" className="mb-4">Top trường đại học</Badge>
              <h1 className="font-display text-4xl font-bold text-cream-50 mb-3">{uni.name}</h1>
              <div className="flex flex-wrap items-center gap-4 text-cream-200 text-sm">
                <span className="flex items-center gap-1"><MapPin className="w-4 h-4" /> {uni.region}</span>
                <span className="flex items-center gap-1"><Globe className="w-4 h-4" /> {typeLabel}</span>
                {uni.code && <span className="flex items-center gap-1"><BookOpen className="w-4 h-4" /> Mã: {uni.code}</span>}
              </div>
              {uni.address && (
                <p className="mt-3 text-cream-200 text-sm flex items-start gap-1">
                  <MapPin className="w-4 h-4 mt-0.5 flex-shrink-0" />
                  <span>{uni.address}</span>
                </p>
              )}
            </div>
            <Button
              variant="outline"
              onClick={handleToggleSave}
              className={cn(
                'border-cream-100/30 text-cream-50 hover:bg-cream-100/10 gap-2 self-start shrink-0',
                isSaved && 'bg-red-500/20 text-red-300 border-red-400/50'
              )}
            >
              <Heart className={cn('w-4 h-4', isSaved && 'fill-current text-red-400')} />
              {isSaved ? 'Đã lưu trường' : 'Lưu trường'}
            </Button>
          </div>
        </div>

        <div className="px-8 py-5 grid grid-cols-1 md:grid-cols-3 gap-6 border-b border-cream-200">
          <div className="flex items-start gap-3">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 bg-gold-500/15`}>
              <DollarSign className="w-5 h-5 text-gold-500" />
            </div>
            <div>
              <p className="text-xs text-slate-500 leading-tight">Học phí tham khảo 2026-2027</p>
              <p className="font-semibold text-navy-800 text-sm leading-tight mt-0.5 line-clamp-3">
                {uni.tuitionRange ?? 'Liên hệ trường'}
              </p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-xl bg-cream-100 flex items-center justify-center flex-shrink-0">
              <Building2 className="w-5 h-5 text-navy-700" />
            </div>
            <div>
              <p className="text-xs text-slate-500 leading-tight">Loại trường</p>
              <p className="font-semibold text-navy-800 text-sm leading-tight mt-0.5">{typeLabel}</p>
            </div>
          </div>
        </div>

        {uni.websiteUrl && (
          <div className="px-8 py-4 border-b border-cream-200 flex flex-wrap items-center gap-3">
            <Globe className="w-4 h-4 text-slate-500" />
            <span className="text-sm text-slate-600">Website chính thức:</span>
            <a
              href={uni.websiteUrl.startsWith('http') ? uni.websiteUrl : `https://${uni.websiteUrl}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-gold-600 hover:text-gold-700 font-medium text-sm inline-flex items-center gap-1"
            >
              {uni.websiteUrl}
              <ExternalLink className="w-3 h-3" />
            </a>
          </div>
        )}
        {uni.deanUrl && (
          <div className="px-8 py-4 border-b border-cream-200 flex flex-wrap items-center gap-3">
            <Award className="w-4 h-4 text-slate-500" />
            <span className="text-sm text-slate-600">Đề án tuyển sinh:</span>
            <a
              href={uni.deanUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-gold-600 hover:text-gold-700 font-medium text-sm inline-flex items-center gap-1"
            >
              Xem chi tiết tại Tuyensinh247
              <ExternalLink className="w-3 h-3" />
            </a>
          </div>
        )}
      </Card>

      {hasCoords && (
        <Card className="mb-6 overflow-hidden">
          <CardContent className="p-0">
            <UniversityMap
              latitude={uni.latitude!}
              longitude={uni.longitude!}
              name={uni.name}
              address={uni.address}
            />
          </CardContent>
        </Card>
      )}

      {hasMajors && (
        <Card>
          <CardContent className="p-6">
            <h2 className="font-display text-xl font-semibold text-navy-800 mb-1">
              Ngành đào tạo ({majors.length})
            </h2>
            <p className="text-xs text-slate-500 mb-4">
              Điểm chuẩn theo phương thức tuyển sinh các năm 2023–2025
            </p>

            <div className="space-y-2">
              {(showAllMajors ? majors : majors.slice(0, INITIAL_MAJOR_COUNT)).map((m) => {
                const majorScores = scores[m.id] ?? []
                const isExpanded = expandedMajor === m.id
                const scoresByYear = YEARS.map(y => majorScores.filter(s => s.year === y))
                const allEmpty = scoresByYear.every(s => s.length === 0)

                return (
                  <div key={m.id} className="rounded-lg border border-cream-200 overflow-hidden">
                    <button
                      onClick={() => setExpandedMajor(isExpanded ? null : m.id)}
                      className="w-full px-4 py-3 flex items-center justify-between hover:bg-cream-50 transition-colors"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="flex-1 min-w-0 text-left">
                          <p className="font-medium text-navy-800 text-sm truncate">{m.name}</p>
                          <div className="flex items-center gap-2 mt-0.5">
                            <span className="text-xs text-slate-500">Mã: {m.code}</span>
                            {m.subjectGroup && (
                              <span className="text-xs text-slate-400 hidden sm:inline">
                                {m.subjectGroup.split(';').slice(0, 2).join(', ')}
                              </span>
                            )}
                          </div>
                        </div>
                        {!allEmpty && (
                          <div className="hidden sm:flex items-center gap-2 flex-shrink-0">
                            {YEARS.map(y => (
                              scoresByYear[YEARS.indexOf(y)].length > 0 && (
                                <span key={y} className="text-xs font-mono text-navy-600 bg-cream-100 rounded px-1.5 py-0.5">
                                  {y}: {scoresByYear[YEARS.indexOf(y)].map(s => s.score).filter(Boolean).sort((a,b) => (b ?? 0) - (a ?? 0)).join(', ')}
                                </span>
                              )
                            ))}
                          </div>
                        )}
                        {allEmpty && <span className="text-xs text-slate-400">Chưa có dữ liệu</span>}
                        {isExpanded ? <ChevronUp className="w-4 h-4 text-slate-400 flex-shrink-0" /> : <ChevronDown className="w-4 h-4 text-slate-400 flex-shrink-0" />}
                      </div>
                    </button>

                    <div className={`mb-accordion border-t border-cream-200 bg-cream-50/50 ${isExpanded && !allEmpty ? 'is-open' : ''}`}>
                      <div className="mb-accordion-inner">
                        {!allEmpty && (
                          <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                              <thead>
                                <tr className="border-b border-cream-200">
                                  <th className="px-4 py-2 text-left font-medium text-slate-600">Phương thức</th>
                                  {YEARS.map(y => (
                                    <th key={y} className="px-4 py-2 text-center font-medium text-slate-600">{y}</th>
                                  ))}
                                </tr>
                              </thead>
                              <tbody>
                                {[...new Set(majorScores.map(s => s.method))].sort().map((method, rowIdx) => {
                                  const methodScores = majorScores.filter(s => s.method === method)
                                  return (
                                    <tr
                                      key={method}
                                      className="mb-row border-b border-cream-100 last:border-0 hover:bg-cream-100/50"
                                      style={{ ['--mb-row-delay' as string]: `${rowIdx * 50}ms` }}
                                    >
                                      <td className="px-4 py-2 font-medium text-navy-700 text-xs">{method}</td>
                                      {YEARS.map(y => {
                                        const score = methodScores.find(s => s.year === y)
                                        return (
                                          <td key={y} className="px-4 py-2 text-center">
                                            {score ? (
                                              <span className="font-mono font-semibold text-navy-800">
                                                {score.score}
                                              </span>
                                            ) : (
                                              <span className="text-slate-300">—</span>
                                            )}
                                          </td>
                                        )
                                      })}
                                    </tr>
                                  )
                                })}
                              </tbody>
                            </table>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>

            {majors.length > INITIAL_MAJOR_COUNT && (
              <div className="mt-6 flex justify-center">
                <Button
                  variant="outline"
                  onClick={() => setShowAllMajors(!showAllMajors)}
                  className="min-w-48"
                >
                  {showAllMajors ? (
                    <>Thu gọn</>
                  ) : (
                    <>
                      Xem thêm {majors.length - INITIAL_MAJOR_COUNT} ngành khác
                      <ChevronDown className="w-4 h-4 ml-2" />
                    </>
                  )}
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  )
}