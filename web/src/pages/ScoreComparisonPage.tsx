import { useState, useEffect, useMemo, useRef, useCallback } from 'react'
import { Plus, X, TrendingUp, TrendingDown, Minus, ArrowRight } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Skeleton } from '@/components/ui/Skeleton'
import { getLikelihood } from '@/lib/utils'
import { getUniversities, getMajors, postMatch, type MatchResult, type Major } from '@/lib/universities'
import BlurReveal from '@/components/BlurReveal'

interface CompareItem {
  universityId: string
  universityName: string
  region: string
  type: string
  majors?: MajorLocal[]
  loading?: boolean
}

interface MajorLocal {
  id: string
  code: string
  name: string
  subjectGroup: string
  admissionScores?: { year: number; method: string; score: number }[]
}

interface UniversityLite {
  id: string
  code: string
  name: string
  region: string
  type: string
}

export default function ScoreComparisonPage() {
  const [scoreInput, setScoreInput] = useState({
    math: '8.0',
    literature: '8.0',
    english: '8.5',
    physics: '7.5',
    chemistry: '7.5',
    biology: '7.0',
  })
  const [compareList, setCompareList] = useState<CompareItem[]>([])
  const [showPicker, setShowPicker] = useState(false)
  const [pickerUniversities, setPickerUniversities] = useState<UniversityLite[]>([])
  const [pickerLoading, setPickerLoading] = useState(false)
  const [matchResults, setMatchResults] = useState<MatchResult[]>([])
  const [matchLoading, setMatchLoading] = useState(false)
  const [initialLoadDone, setInitialLoadDone] = useState(false)

  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const selectedGroup = 'A00'

  const totalScore = (() => {
    const math = parseFloat(scoreInput.math) || 0
    const lit = parseFloat(scoreInput.literature) || 0
    const eng = parseFloat(scoreInput.english) || 0
    const phy = parseFloat(scoreInput.physics) || 0
    const chem = parseFloat(scoreInput.chemistry) || 0

    if (selectedGroup === 'A00') return math + phy + chem
    if (selectedGroup === 'A01') return math + phy + eng
    if (selectedGroup === 'D01') return math + lit + eng
    return math + lit + eng
  })()

  const callMatch = useCallback(async (scores: { math: number; physics: number; chemistry: number; literature: number; english: number; biology: number }) => {
    setMatchLoading(true)
    try {
      const results = await postMatch(scores)
      setMatchResults(results)
    } catch {
      setMatchResults([])
    } finally {
      setMatchLoading(false)
    }
  }, [])

  useEffect(() => {
    if (!initialLoadDone) {
      callMatch({
        math: parseFloat(scoreInput.math) || 0,
        physics: parseFloat(scoreInput.physics) || 0,
        chemistry: parseFloat(scoreInput.chemistry) || 0,
        literature: parseFloat(scoreInput.literature) || 0,
        english: parseFloat(scoreInput.english) || 0,
        biology: parseFloat(scoreInput.biology) || 0,
      })
      setInitialLoadDone(true)
    }
  }, [initialLoadDone, callMatch, scoreInput])

  useEffect(() => {
    if (!initialLoadDone) return
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => {
      callMatch({
        math: parseFloat(scoreInput.math) || 0,
        physics: parseFloat(scoreInput.physics) || 0,
        chemistry: parseFloat(scoreInput.chemistry) || 0,
        literature: parseFloat(scoreInput.literature) || 0,
        english: parseFloat(scoreInput.english) || 0,
        biology: parseFloat(scoreInput.biology) || 0,
      })
    }, 400)
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current)
    }
  }, [initialLoadDone, callMatch, scoreInput])

  const loadPickerUniversities = useCallback(async () => {
    setPickerLoading(true)
    try {
      const list = await getUniversities()
      setPickerUniversities(list)
    } finally {
      setPickerLoading(false)
    }
  }, [])

  const addToCompare = async (uni: UniversityLite) => {
    if (compareList.find((c) => c.universityId === uni.id)) {
      setShowPicker(false)
      return
    }
    setCompareList((prev) => [...prev, { universityId: uni.id, universityName: uni.name, region: uni.region, type: uni.type, loading: true }])
    setShowPicker(false)
    try {
      const majors = await getMajors(uni.id)
      setCompareList((prev) =>
        prev.map((c) => c.universityId === uni.id ? { ...c, majors, loading: false } : c)
      )
    } catch {
      setCompareList((prev) => prev.filter((c) => c.universityId !== uni.id))
    }
  }

  const removeFromCompare = (id: string) => {
    setCompareList((prev) => prev.filter((c) => c.universityId !== id))
  }

  const universities = useMemo(() => {
    const region = totalScore >= 22 ? 'SOUTH' : totalScore >= 18 ? 'CENTRAL' : 'NORTH'
    const type = totalScore >= 20 ? 'top' : 'regular'
    const uniMap = new Map<string, UniversityLite>()
    for (const r of matchResults) {
      if (!uniMap.has(r.universityId)) {
        uniMap.set(r.universityId, { id: r.universityId, code: r.universityCode, name: r.universityName, region, type })
      }
    }
    return Array.from(uniMap.values())
  }, [matchResults])

  const LikelihoodIcon = ({ score, target }: { score: number; target: number }) => {
    if (score >= target + 2) return <TrendingUp className="w-5 h-5 text-green-600" />
    if (score >= target) return <Minus className="w-5 h-5 text-yellow-600" />
    return <TrendingDown className="w-5 h-5 text-red-500" />
  }

  if (!initialLoadDone) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="mb-8">
          <Skeleton className="h-10 w-64 mb-2" />
          <Skeleton className="h-5 w-96" />
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <BlurReveal as="div" className="mb-8" duration={700}>
        <h1 className="font-display text-4xl font-bold text-navy-800 mb-2">So sánh điểm thi</h1>
        <p className="text-slate-600">Nhập điểm thi của bạn hoặc điểm học bạ để xem khả năng đậu các trường</p>
      </BlurReveal>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left: Score input */}
        <div className="space-y-6">
          <BlurReveal duration={600} delay={100}>
          <Card>
            <CardHeader>
              <CardTitle>Điểm thi / Học bạ</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="grid grid-cols-3 gap-3">
                  {[
                    { key: 'math', label: 'Toán' },
                    { key: 'physics', label: 'Lý' },
                    { key: 'chemistry', label: 'Hóa' },
                  ].map((s) => (
                    <div key={s.key}>
                      <label className="text-xs text-slate-500 block mb-1">{s.label}</label>
                      <input
                        type="number"
                        min="0"
                        max="10"
                        step="0.1"
                        value={scoreInput[s.key as keyof typeof scoreInput]}
                        onChange={(e) => setScoreInput({ ...scoreInput, [s.key]: e.target.value })}
                        className="w-full px-3 py-2 rounded-lg border border-cream-200 bg-white text-center text-navy-800 font-semibold focus:outline-none focus:ring-2 focus:ring-gold-400"
                      />
                    </div>
                  ))}
                </div>
                <div className="flex gap-3">
                  {[
                    { key: 'literature', label: 'Văn' },
                    { key: 'english', label: 'Anh' },
                    { key: 'biology', label: 'Sinh' },
                  ].map((s) => (
                    <div key={s.key} className="flex-1">
                      <label className="text-xs text-slate-500 block mb-1">{s.label}</label>
                      <input
                        type="number"
                        min="0"
                        max="10"
                        step="0.1"
                        value={scoreInput[s.key as keyof typeof scoreInput]}
                        onChange={(e) => setScoreInput({ ...scoreInput, [s.key]: e.target.value })}
                        className="w-full px-3 py-2 rounded-lg border border-cream-200 bg-white text-center text-navy-800 font-semibold focus:outline-none focus:ring-2 focus:ring-gold-400"
                      />
                    </div>
                  ))}
                </div>

                <div className="pt-4 border-t border-cream-200">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm text-slate-500">Khối A00 (Toán + Lý + Hóa)</span>
                    <Badge variant="navy">Áp dụng</Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium text-navy-800">Tổng điểm:</span>
                    <span className="font-display text-3xl font-bold text-gold-600">{totalScore.toFixed(2)}</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
          </BlurReveal>

          <BlurReveal duration={600} delay={220}>
          <Card>
            <CardHeader>
              <CardTitle>Danh sách so sánh ({compareList.length})</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {compareList.map((item) => (
                  <div key={item.universityId} className="flex items-center justify-between p-3 bg-cream-50 rounded-xl">
                    <span className="text-sm font-medium text-navy-800">{item.universityName}</span>
                    <button
                      onClick={() => removeFromCompare(item.universityId)}
                      className="text-slate-400 hover:text-red-500 transition-colors"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ))}
                {compareList.length === 0 && (
                  <p className="text-sm text-slate-400 text-center py-4">
                    Chưa có trường nào. Thêm trường để so sánh.
                  </p>
                )}
                <Button variant="outline" className="w-full" onClick={() => { loadPickerUniversities(); setShowPicker(true) }}>
                  <Plus className="w-4 h-4" /> Thêm trường vào so sánh
                </Button>
              </div>
            </CardContent>
          </Card>
          </BlurReveal>
        </div>

        {/* Right: Results */}
        <div className="lg:col-span-2 space-y-6">
          <BlurReveal duration={600} delay={300}>
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Các trường có khả năng đậu</CardTitle>
                <Badge variant="gold">Khối A00 • {totalScore.toFixed(2)} điểm</Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {matchLoading && (
                  <div className="text-center py-8 text-slate-400">
                    <div className="inline-block w-6 h-6 border-2 border-gold-400 border-t-transparent rounded-full animate-spin mb-2" />
                    <p className="text-sm">Đang tìm trường phù hợp...</p>
                  </div>
                )}
                {!matchLoading && universities.map((uni) => {
                  const results = matchResults.filter((r) => r.universityId === uni.id)
                  if (results.length === 0) return null
                  const sorted = [...results].sort((a, b) => a.cutoffScore - b.cutoffScore)
                  const likely = sorted.filter((r) => totalScore >= r.cutoffScore)
                  const unlikely = sorted.filter((r) => totalScore < r.cutoffScore)

                  return (
                    <div key={uni.id} className="border border-cream-200 rounded-xl p-4 hover:border-gold-400/40 transition-all">
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <h4 className="font-semibold text-navy-800">{uni.name}</h4>
                          <p className="text-xs text-slate-500">{sorted.length} ngành có điểm chuẩn</p>
                        </div>
                        <div className="flex items-center gap-2">
                          {likely.length > 0 && (
                            <Badge variant="success">{likely.length} ngành có thể đậu</Badge>
                          )}
                          {unlikely.length > 0 && (
                            <Badge variant="danger">{unlikely.length} ngành khó đậu</Badge>
                          )}
                        </div>
                      </div>
                      <div className="space-y-2">
                        {sorted.slice(0, 5).map((result, idx) => {
                          const likelihood = getLikelihood(totalScore, result.cutoffScore)
                          return (
                            <div key={`${result.majorId}-${idx}`} className="flex items-center justify-between">
                              <div className="flex items-center gap-2 flex-1">
                                <LikelihoodIcon score={totalScore} target={result.cutoffScore} />
                                <span className="text-sm text-navy-800">{result.majorName}</span>
                                <Badge variant="default" size="sm">{result.subjectGroup.split(';')[0]}</Badge>
                              </div>
                              <div className="text-right">
                                <span className="font-semibold text-sm text-navy-700">{result.cutoffScore.toFixed(2)}</span>
                                <span className="text-xs text-slate-400 ml-1">{result.year}</span>
                              </div>
                            </div>
                          )
                        })}
                      </div>
                    </div>
                  )
                })}
              </div>
            </CardContent>
          </Card>
          </BlurReveal>

          {compareList.length > 0 && (
            <BlurReveal duration={600} delay={420}>
            <Card>
              <CardHeader>
                <CardTitle>Bảng so sánh chi tiết</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-cream-200">
                        <th className="text-left py-3 px-3 font-semibold text-navy-800">Ngành</th>
                        {compareList.map((item) => (
                          <th key={item.universityId} className="text-center py-3 px-3 font-semibold text-navy-800">
                            {item.universityName.split(' ').slice(0, 3).join(' ')}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {['Khoa học máy tính', 'Quản trị kinh doanh', 'Kinh tế học', 'Kế toán'].map((majorName) => {
                        const keyword = majorName.split(' ')[0]
                        return (
                          <tr key={majorName} className="border-b border-cream-100">
                            <td className="py-3 px-3 font-medium text-navy-800">{majorName}</td>
                            {compareList.map((item) => {
                              const results = matchResults.filter((r) => r.universityId === item.universityId)
                              const candidate = results.find((r) =>
                                r.majorName.toLowerCase().includes(keyword.toLowerCase())
                              )
                              if (!candidate) {
                                return <td key={item.universityId} className="py-3 px-3 text-center text-slate-400">—</td>
                              }
                              const score = candidate.cutoffScore
                              if (!score || score === 0) {
                                return <td key={item.universityId} className="py-3 px-3 text-center text-slate-400">—</td>
                              }
                              const likelihood = getLikelihood(totalScore, score)
                              return (
                                <td key={item.universityId} className="py-3 px-3 text-center">
                                  <span className="font-semibold">{score.toFixed(2)}</span>
                                  <span className="ml-2 text-xs text-slate-400">{candidate.year}</span>
                                  <span className={`ml-2 text-xs ${likelihood.color}`}>({likelihood.label})</span>
                                </td>
                              )
                            })}
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
            </BlurReveal>
          )}
        </div>
      </div>

      {/* School picker modal */}
      {showPicker && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-navy-900/60" onClick={() => setShowPicker(false)} />
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[80vh] overflow-hidden">
            <div className="p-6 border-b border-cream-200 flex items-center justify-between">
              <h3 className="font-display text-xl font-semibold text-navy-800">Thêm trường vào so sánh</h3>
              <button onClick={() => setShowPicker(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-6 h-6" />
              </button>
            </div>
            <div className="p-6 overflow-y-auto max-h-[60vh] space-y-2">
              {pickerLoading ? (
                <div className="space-y-2">
                  {[1,2,3,4,5].map((i) => (
                    <Skeleton key={i} className="h-16 w-full rounded-xl" />
                  ))}
                </div>
              ) : (
                pickerUniversities.map((uni) => (
                  <button
                    key={uni.id}
                    onClick={() => addToCompare(uni)}
                    disabled={compareList.some((c) => c.universityId === uni.id)}
                    className={`w-full text-left p-4 rounded-xl border transition-all ${
                      compareList.some((c) => c.universityId === uni.id)
                        ? 'border-gold-400 bg-gold-50 opacity-60'
                        : 'border-cream-200 hover:border-navy-600 hover:bg-cream-50'
                    }`}
                  >
                    <p className="font-semibold text-navy-800">{uni.name}</p>
                    <p className="text-sm text-slate-500 mt-1">{uni.region} • {uni.type}</p>
                  </button>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
