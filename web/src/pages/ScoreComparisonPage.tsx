import { useState, useEffect, useMemo, useRef, useCallback } from 'react'
import { Plus, X, TrendingUp, TrendingDown, Minus, ChevronDown, Heart, Check, GraduationCap, Filter, Sparkles } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Skeleton } from '@/components/ui/Skeleton'
import { getLikelihood, cn } from '@/lib/utils'
import { getMajors, postMatch, getSavedUniversities, type MatchResult, type Major, type University } from '@/lib/universities'
import { SUBJECT_COMBINATIONS } from '@/data/subjectCombinations'
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
const [scoreInput, setScoreInput] = useState<Record<string, string>>({
  math: '', physics: '', chemistry: '', literature: '', english: '',
  biology: '', history: '', geography: '', gdcd: '',
  french: '', chinese: '', japanese: '', russian: '', german: '', korean: '',
  nk_tdtt: '', nk_ve: '', nk_am_nhac: '', nk_thuyet_trinh: '', nk_khac: '',
})
const [compareList, setCompareList] = useState<CompareItem[]>([])
const [matchResults, setMatchResults] = useState<MatchResult[]>([])
  const [matchLoading, setMatchLoading] = useState(false)
  const [initialLoadDone, setInitialLoadDone] = useState(false)
  const [uniPage, setUniPage] = useState(0)
const [selectedGroup, setSelectedGroup] = useState('A00')
const [showGroupModal, setShowGroupModal] = useState(false)
const [groupSearchQuery, setGroupSearchQuery] = useState('')
const [searchQuery, setSearchQuery] = useState('')
const [majorSearchQuery, setMajorSearchQuery] = useState('')
const [expandedUniId, setExpandedUniId] = useState<string | null>(null)
  const UNIS_PER_PAGE = 5

  const EMPTY_SCORES: Record<string, string> = {
    math: '', physics: '', chemistry: '', literature: '', english: '',
    biology: '', history: '', geography: '', gdcd: '',
    french: '', chinese: '', japanese: '', russian: '', german: '', korean: '',
    nk_tdtt: '', nk_ve: '', nk_am_nhac: '', nk_thuyet_trinh: '', nk_khac: '',
  }

  const handleSelectGroup = (code: string) => {
    setSelectedGroup(code)
    setScoreInput({ ...EMPTY_SCORES })
    setShowGroupModal(false)
    setGroupSearchQuery('')
  }

  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

const SUBJECT_TO_KEY: Record<string, string | null> = {
  'Toán': 'math',
  'Vật lí': 'physics',
  'Hóa học': 'chemistry',
  'Ngữ văn': 'literature',
  'Tiếng Anh': 'english',
  'Sinh học': 'biology',
  'Lịch sử': 'history',
  'Địa lí': 'geography',
  'GDKTPL': 'gdcd',
  'Tiếng Pháp': 'french',
  'Tiếng Trung': 'chinese',
  'Tiếng Nhật': 'japanese',
  'Tiếng Nga': 'russian',
  'Tiếng Đức': 'german',
  'Tiếng Hàn': 'korean',
  'Tin học': 'math',
  'Công nghệ công nghiệp': 'math',
  'Công nghệ nông nghiệp': 'math',
  'Năng khiếu TDTT': 'nk_tdtt',
  'Năng khiếu vẽ Nghệ thuật 1': 'nk_ve',
  'Năng khiếu vẽ Nghệ thuật 2': 'nk_ve',
  'Đọc diễn cảm': 'math',
  'Hát': 'math',
  'Năng khiếu SKĐA 1': 'nk_am_nhac',
  'Năng khiếu SKĐA 2': 'nk_am_nhac',
  'xướng âm': 'math',
  'biểu diễn nghệ thuật': 'math',
  'Vẽ Hình họa mỹ thuật': 'nk_ve',
  'Vẽ trang trí màu': 'nk_ve',
  'Vẽ Năng khiếu': 'nk_ve',
  'Năng khiếu': 'nk_khac',
'NK Mầm non 1( kể chuyện, đọc, diễn cảm)': 'math',
  'NK Mầm non 2 (Hát)': 'math',
  'Năng khiếu báo chí': 'nk_khac',
  'Ký xướng âm': 'nk_khac',
  'Hát hoặc biểu diễn nhạc cụ': 'nk_am_nhac',
  'Năng khiếu âm nhạc': 'nk_am_nhac',
  'Năng khiếu thuyết trình': 'nk_thuyet_trinh',
  'Biểu diễn nghệ thuật': 'nk_khac',
  'Năng khiếu nghệ thuật': 'nk_khac',
  'Xây dựng kịch bản sự kiện': 'nk_khac',
  'Đọc diễn cảm, Hát': 'math',
  'Đọc kể diễn cảm': 'math',
  'Hát - Múa': 'math',
}

function stripDiacritics(s: string): string {
  return s
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd').replace(/Đ/g, 'D')
}

function scoreKeyFor(subjectName: string): string | null {
  const trimmed = subjectName.trim()
  const direct = SUBJECT_TO_KEY[trimmed]
  if (direct !== undefined) return direct
  const lowered = trimmed.toLowerCase()
  const fromLower: string | null = Object.entries(SUBJECT_TO_KEY).find(
    ([k]) => k.toLowerCase() === lowered
  )?.[1] ?? null
  if (fromLower !== null) return fromLower
  const stripped = stripDiacritics(trimmed).toLowerCase()
  return Object.entries(SUBJECT_TO_KEY).find(
    ([k]) => stripDiacritics(k).toLowerCase() === stripped
  )?.[1] ?? null
}

const totalScore = (() => {
  const group = SUBJECT_COMBINATIONS.find(c => c.code === selectedGroup)
  if (!group) return 0
  return group.subjects
    .split(',')
    .map(s => {
      const key = scoreKeyFor(s.trim())
      return key ? (parseFloat(scoreInput[key]) || 0) : 0
    })
    .reduce((sum, v) => sum + v, 0)
})()

  const universities = useMemo(() => {
    const region = totalScore >= 22 ? 'SOUTH' : totalScore >= 18 ? 'CENTRAL' : 'NORTH'
    const type = totalScore >= 20 ? 'top' : 'regular'
    const uniMap = new Map<string, UniversityLite>()
    for (const r of matchResults) {
      if (!uniMap.has(r.universityId)) {
        uniMap.set(r.universityId, {
          id: r.universityId,
          code: r.universityCode,
          name: r.universityName,
          region,
          type,
        })
      }
    }
    return Array.from(uniMap.values())
  }, [matchResults, totalScore])

  const searchLower = searchQuery.trim().toLowerCase()

  const filteredUniversities = useMemo(() => {
    return universities
      .filter((uni) => matchResults.some((r) => r.universityId === uni.id))
      .filter((uni) => !searchLower || uni.name.toLowerCase().includes(searchLower))
  }, [universities, matchResults, searchLower])

  useEffect(() => {
    setUniPage(0)
  }, [matchResults, selectedGroup, searchLower])

  const callMatch = useCallback(
    async (scores: {
      math: number
      physics: number
      chemistry: number
      literature: number
      english: number
      biology: number
      history: number
      geography: number
      gdcd: number
    }) => {
      setMatchLoading(true)
      try {
        const results = await postMatch({
          ...scores,
          method: 'Điểm thi THPT',
          year: 2025,
          tolerance: 3,
          subjectGroup: selectedGroup,
        })
        setMatchResults(results)
      } catch {
        setMatchResults([])
      } finally {
        setMatchLoading(false)
      }
    },
    [selectedGroup],
  )

  useEffect(() => {
    if (!initialLoadDone) {
      callMatch({
        math: parseFloat(scoreInput.math) || 0,
        physics: parseFloat(scoreInput.physics) || 0,
        chemistry: parseFloat(scoreInput.chemistry) || 0,
        literature: parseFloat(scoreInput.literature) || 0,
        english: parseFloat(scoreInput.english) || 0,
        biology: parseFloat(scoreInput.biology) || 0,
        history: parseFloat(scoreInput.history) || 0,
        geography: parseFloat(scoreInput.geography) || 0,
        gdcd: parseFloat(scoreInput.gdcd) || 0,
      })
      setInitialLoadDone(true)
    }
  }, [initialLoadDone, callMatch, scoreInput, selectedGroup])

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
        history: parseFloat(scoreInput.history) || 0,
        geography: parseFloat(scoreInput.geography) || 0,
        gdcd: parseFloat(scoreInput.gdcd) || 0,
      })
    }, 400)
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current)
    }
}, [initialLoadDone, callMatch, scoreInput, selectedGroup])

const addToCompare = async (uni: { universityId: string; universityName: string; region: string; type: string }) => {
  if (compareList.find((c) => c.universityId === uni.universityId)) return
  setCompareList((prev) => [
    ...prev,
    { universityId: uni.universityId, universityName: uni.universityName, region: uni.region, type: uni.type, loading: true },
  ])
  try {
    const majors = await getMajors(uni.universityId)
    setCompareList((prev) =>
      prev.map((c) => (c.universityId === uni.universityId ? { ...c, majors, loading: false } : c)),
    )
  } catch {
    setCompareList((prev) => prev.filter((c) => c.universityId !== uni.universityId))
  }
}

const removeFromCompare = (id: string) => {
  setCompareList((prev) => prev.filter((c) => c.universityId !== id))
}

  const [activeTab, setActiveTab] = useState<'match' | 'compare'>('match')
  const [loadingSaved, setLoadingSaved] = useState(false)
  const [onlyShowScoredMajors, setOnlyShowScoredMajors] = useState(false)

  const loadSavedUniversitiesToCompare = async () => {
    setLoadingSaved(true)
    try {
      const savedUnis = await getSavedUniversities()
      for (const uni of savedUnis) {
        if (!compareList.some((c) => c.universityId === uni.id)) {
          await addToCompare({
            universityId: uni.id,
            universityName: uni.name,
            region: uni.region === 'NORTH' ? 'Miền Bắc' : uni.region === 'CENTRAL' ? 'Miền Trung' : 'Miền Nam',
            type: uni.type === 'PUBLIC' ? 'Công lập' : 'Tư thục',
          })
        }
      }
      setActiveTab('compare')
    } catch (e) {
      console.error('Failed to load saved universities:', e)
    } finally {
      setLoadingSaved(false)
    }
  }

  const allComparisonMajors = useMemo(() => {
    if (compareList.length === 0) return []
    const majorSet = new Set<string>()
    for (const comp of compareList) {
      const results = matchResults.filter((r) => r.universityId === comp.universityId)
      for (const r of results) {
        if (r.majorName) majorSet.add(r.majorName)
      }
      if (comp.majors) {
        for (const m of comp.majors) {
          if (m.name) majorSet.add(m.name)
        }
      }
    }
    let list = Array.from(majorSet)
    if (list.length === 0) {
      list = ['Khoa học máy tính', 'Quản trị kinh doanh', 'Kinh tế học', 'Kế toán']
    }
    if (onlyShowScoredMajors) {
      list = list.filter((majorName) =>
        compareList.some((item) => {
          const results = matchResults.filter((r) => r.universityId === item.universityId)
          return results.some(
            (r) =>
              (r.majorName.toLowerCase().includes(majorName.toLowerCase()) ||
                majorName.toLowerCase().includes(r.majorName.toLowerCase())) &&
              r.cutoffScore > 0
          )
        })
      )
    }
    return list.sort((a, b) => a.localeCompare(b, 'vi'))
  }, [compareList, matchResults, onlyShowScoredMajors])

  const LikelihoodIcon = ({ score, target }: { score: number; target: number }) => {
    if (score >= target + 2) return <TrendingUp className="w-5 h-5 text-green-600" />
    if (score >= target) return <Minus className="w-5 h-5 text-yellow-600" />
    return <TrendingDown className="w-5 h-5 text-red-500" />
  }

  const handleExpand = (uniId: string) => {
    setMajorSearchQuery('')
    setExpandedUniId((prev) => (prev === uniId ? null : uniId))
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
<h1 className="font-display text-4xl font-bold text-navy-800 mb-2">Điểm thi / Học bạ</h1>
      <p className="text-slate-600">
        Chọn tổ hợp môn, nhập điểm 3 môn và xem khả năng đậu
      </p>
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
    {(() => {
      const group = SUBJECT_COMBINATIONS.find(c => c.code === selectedGroup)
      if (!group) return null
      const names = group.subjects.split(',').map(s => s.trim())
      const hasNk = names.some(n => !scoreKeyFor(n))
      return (
        <>
          <div className="grid grid-cols-3 gap-3">
            {names.map((name, i) => {
              const k = scoreKeyFor(name)
              if (!k) return null
              return (
                <div key={`${selectedGroup}-${i}`}>
                  <label className="text-xs text-slate-500 block mb-1">{name}</label>
                  <input
                    type="number"
                    min="0"
                    max="10"
                    step="0.1"
                    value={scoreInput[k]}
                    onChange={(e) => {
                      const raw = e.target.value
                      if (raw === '') {
                        setScoreInput(prev => ({ ...prev, [k]: '' }))
                        return
                      }
                      const num = parseFloat(raw)
                      if (!isNaN(num)) {
                        if (num > 10) {
                          setScoreInput(prev => ({ ...prev, [k]: '10' }))
                        } else if (num < 0) {
                          setScoreInput(prev => ({ ...prev, [k]: '0' }))
                        } else {
                          setScoreInput(prev => ({ ...prev, [k]: raw }))
                        }
                      }
                    }}
                    onBlur={(e) => {
                      const raw = e.target.value
                      if (raw === '') return
                      const num = parseFloat(raw)
                      if (!isNaN(num)) {
                        const clamped = Math.max(0, Math.min(10, num))
                        setScoreInput(prev => ({ ...prev, [k]: clamped.toString() }))
                      }
                    }}
                    className="w-full px-3 py-2 rounded-lg border border-cream-200 bg-white text-center text-navy-800 font-semibold focus:outline-none focus:ring-2 focus:ring-gold-400"
                  />
                </div>
              )
            })}
          </div>
          {hasNk && (
            <p className="text-xs text-slate-400 italic">
              Tổ hợp này có môn năng khiếu — chưa tính vào điểm xét tuyển.
            </p>
          )}
        </>
      )
    })()}

<div className="pt-4 border-t border-cream-200 space-y-3">
        <div className="flex items-center justify-between cursor-pointer group" onClick={() => setShowGroupModal(true)}>
          <div>
            <label className="text-sm text-slate-500 block">Khối xét tuyển</label>
            <p className="text-sm font-semibold text-navy-800">
              {selectedGroup} — {SUBJECT_COMBINATIONS.find(c => c.code === selectedGroup)?.subjects || selectedGroup}
            </p>
            {SUBJECT_COMBINATIONS.find(c => c.code === selectedGroup) && (
              <p className="text-xs text-slate-400">
                {SUBJECT_COMBINATIONS.find(c => c.code === selectedGroup)!.subjects}
              </p>
            )}
          </div>
          <ChevronDown className="w-5 h-5 text-slate-400 group-hover:text-navy-800 transition-colors" />
        </div>
        <div className="flex justify-between items-center">
          <span className="text-sm font-medium text-navy-800">Tổng điểm:</span>
          <span className="font-display text-3xl font-bold text-gold-600">
            {totalScore.toFixed(2)}
          </span>
        </div>
      </div>

{showGroupModal && (
  <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
    <div className="absolute inset-0 bg-navy-900/60" onClick={() => { setShowGroupModal(false); setGroupSearchQuery('') }} />
    <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[80vh] flex flex-col overflow-hidden">
      <div className="p-6 border-b border-cream-200 flex items-center justify-between shrink-0">
        <h3 className="font-display text-xl font-semibold text-navy-800">Chọn tổ hợp môn</h3>
        <button
          onClick={() => { setShowGroupModal(false); setGroupSearchQuery('') }}
          className="text-slate-400 hover:text-slate-600"
        >
          <X className="w-6 h-6" />
        </button>
      </div>
      <div className="p-4 border-b border-cream-200 shrink-0">
        <input
          placeholder="Tìm tổ hợp (A00, A01, D01...) hoặc tên môn"
          value={groupSearchQuery}
          onChange={(e) => setGroupSearchQuery(e.target.value)}
          className="w-full px-4 py-2.5 rounded-xl border border-cream-200 bg-white text-sm text-navy-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-gold-400"
        />
      </div>
      <div className="p-4 overflow-y-auto flex-1 space-y-2">
        {(() => {
          const q = groupSearchQuery.trim().toLowerCase()
          return SUBJECT_COMBINATIONS
            .filter(c => !q || c.code.toLowerCase().includes(q) || c.subjects.toLowerCase().includes(q))
            .map(c => (
              <button
                key={c.code}
                onClick={() => handleSelectGroup(c.code)}
                className={`w-full text-left p-4 rounded-xl border transition-all ${
                  selectedGroup === c.code
                    ? 'border-gold-400 bg-gold-50'
                    : 'border-cream-200 hover:border-navy-600 hover:bg-cream-50'
                }`}
              >
                <p className="font-semibold text-navy-800">{c.code}</p>
                <p className="text-sm text-slate-500 mt-0.5">{c.subjects}</p>
              </button>
            ))
        })()}
      </div>
    </div>
  </div>
)}
                </div>
              </CardContent>
            </Card>
          </BlurReveal>

        </div>

        {/* Right: Results Box with Tabs */}
        <div className="lg:col-span-2 space-y-6">
          <Card className="overflow-hidden">
              <CardHeader className="pb-4 border-b border-cream-200 bg-cream-50/50">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  {/* Tab Switcher Pills */}
                  <div className="flex items-center bg-white p-1 rounded-xl border border-cream-200 shadow-sm">
                    <button
                      onClick={() => setActiveTab('match')}
                      className={cn(
                        'px-4 py-2 rounded-lg text-xs sm:text-sm font-semibold transition-all flex items-center gap-2',
                        activeTab === 'match'
                          ? 'bg-navy-800 text-cream-50 shadow'
                          : 'text-slate-600 hover:text-navy-800 hover:bg-cream-50'
                      )}
                    >
                      <span>Trường phù hợp</span>
                      <span className={cn(
                        'px-2 py-0.5 rounded-full text-xs font-bold',
                        activeTab === 'match' ? 'bg-gold-500 text-white' : 'bg-cream-200 text-navy-800'
                      )}>
                        {filteredUniversities.length}
                      </span>
                    </button>
                    <button
                      onClick={() => setActiveTab('compare')}
                      className={cn(
                        'px-4 py-2 rounded-lg text-xs sm:text-sm font-semibold transition-all flex items-center gap-2',
                        activeTab === 'compare'
                          ? 'bg-navy-800 text-cream-50 shadow'
                          : 'text-slate-600 hover:text-navy-800 hover:bg-cream-50'
                      )}
                    >
                      <span>Bảng so sánh chi tiết</span>
                      <span className={cn(
                        'px-2 py-0.5 rounded-full text-xs font-bold',
                        activeTab === 'compare' ? 'bg-gold-500 text-white' : 'bg-cream-200 text-navy-800'
                      )}>
                        {compareList.length}
                      </span>
                    </button>
                  </div>

                  <div className="flex items-center gap-2 self-end sm:self-auto">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={loadSavedUniversitiesToCompare}
                      disabled={loadingSaved}
                      className="border-gold-400 text-gold-600 hover:bg-gold-50 h-8 text-xs gap-1.5"
                    >
                      <Heart className="w-3.5 h-3.5 fill-current text-red-500" />
                      {loadingSaved ? 'Đang nạp...' : 'So sánh trường đã lưu'}
                    </Button>
                    <Badge variant="gold">
                      Khối {selectedGroup} • {totalScore.toFixed(2)} điểm
                    </Badge>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-6">
                {activeTab === 'match' ? (
                  /* TAB 1: Matched Universities List */
                  matchLoading ? (
                    <div className="text-center py-12 text-slate-400">
                      <div className="inline-block w-6 h-6 border-2 border-gold-400 border-t-transparent rounded-full animate-spin mb-2" />
                      <p className="text-sm">Đang tìm trường phù hợp...</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      <input
                        type="text"
                        placeholder="Tìm tên trường..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="mb-3 w-full px-3 py-2 rounded-lg border border-cream-200 bg-white text-sm text-navy-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-gold-400"
                      />
                      {filteredUniversities.length === 0 ? (
                        <div className="text-center py-10 text-slate-500">
                          <p className="text-sm">
                            Không có trường nào phù hợp với điểm hiện tại.
                          </p>
                        </div>
                      ) : (
                        filteredUniversities
                          .slice(uniPage * UNIS_PER_PAGE, (uniPage + 1) * UNIS_PER_PAGE)
                          .map((uni) => {
                            const results = matchResults.filter((r) => r.universityId === uni.id)
                            const sorted = [...results].sort((a, b) => a.cutoffScore - b.cutoffScore)
                            const isExpanded = expandedUniId === uni.id
                            const isSelectedForCompare = compareList.some((c) => c.universityId === uni.id)

                            const likely = sorted.filter((r) => totalScore >= r.cutoffScore)
                            const unlikely = sorted.filter((r) => totalScore < r.cutoffScore)

                            const query = majorSearchQuery.trim().toLowerCase()
                            const filterByQuery = (list: typeof likely) =>
                              !query ? list : list.filter((r) => r.majorName.toLowerCase().includes(query))

                            const displayedLikely = filterByQuery(likely)
                            const displayedUnlikely = filterByQuery(unlikely)

                            return (
                              <div
                                key={uni.id}
                                className="border border-cream-200 rounded-xl hover:border-gold-400/40 transition-all bg-white"
                              >
                                <div className="p-4 flex items-start justify-between gap-3">
                                  <button
                                    onClick={() => handleExpand(uni.id)}
                                    className="flex-1 text-left flex items-start justify-between cursor-pointer"
                                  >
                                    <div className="flex-1">
                                      <div className="flex items-center justify-between pr-2">
                                        <h4 className="font-semibold text-navy-800 hover:text-gold-600 transition-colors">
                                          {uni.name}
                                        </h4>
                                        <ChevronDown
                                          className={`w-5 h-5 text-slate-400 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
                                        />
                                      </div>
                                      <p className="text-xs text-slate-500 mt-1">
                                        {sorted.length} ngành • {likely.length} có thể đậu •{' '}
                                        {unlikely.length} khó đậu
                                      </p>
                                    </div>
                                    <div className="flex items-center gap-2 ml-3 mt-1">
                                      {likely.length > 0 && <Badge variant="success">{likely.length}</Badge>}
                                      {unlikely.length > 0 && <Badge variant="danger">{unlikely.length}</Badge>}
                                    </div>
                                  </button>

                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation()
                                      if (isSelectedForCompare) {
                                        removeFromCompare(uni.id)
                                      } else {
                                        addToCompare({
                                          universityId: uni.id,
                                          universityName: uni.name,
                                          region: uni.region,
                                          type: uni.type,
                                        })
                                      }
                                    }}
                                    className={cn(
                                      'px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 shrink-0 self-start mt-0.5',
                                      isSelectedForCompare
                                        ? 'bg-gold-500 text-white shadow-sm hover:bg-gold-600'
                                        : 'bg-cream-100 text-navy-800 hover:bg-gold-400/20 hover:text-gold-700'
                                    )}
                                    title={isSelectedForCompare ? 'Bỏ chọn so sánh' : 'Thêm vào bảng so sánh'}
                                  >
                                    {isSelectedForCompare ? (
                                      <>
                                        <Check className="w-3.5 h-3.5" /> Đã chọn
                                      </>
                                    ) : (
                                      <>
                                        <Plus className="w-3.5 h-3.5" /> So sánh
                                      </>
                                    )}
                                  </button>
                                </div>

                                {isExpanded && (
                                  <div className="px-4 pb-4 pt-2 border-t border-cream-100">
                                    <input
                                      type="text"
                                      placeholder="Tìm ngành..."
                                      value={majorSearchQuery}
                                      onChange={(e) => setMajorSearchQuery(e.target.value)}
                                      className="mb-3 w-full px-3 py-2 rounded-lg border border-cream-200 bg-white text-sm text-navy-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-gold-400"
                                    />
                                    {displayedLikely.length === 0 &&
                                      displayedUnlikely.length === 0 && (
                                        <p className="text-sm text-slate-400 text-center py-3">
                                          Không tìm thấy ngành phù hợp.
                                        </p>
                                      )}
                                    {displayedLikely.length > 0 && (
                                      <div className="mb-3">
                                        <p className="text-xs font-medium text-green-700 mb-2">
                                          Có thể đậu
                                        </p>
                                        <div className="space-y-2">
                                          {displayedLikely.map((result) => (
                                            <div
                                              key={result.majorId}
                                              className="flex items-center justify-between bg-green-50/60 rounded-lg px-3 py-2"
                                            >
                                              <div className="flex items-center gap-2 flex-1">
                                                <TrendingUp className="w-4 h-4 text-green-600" />
                                                <span className="text-sm text-navy-800">
                                                  {result.majorName}
                                                </span>
                                                <Badge variant="default" size="sm">
                                                  {result.subjectGroup.split(';').map(g => g.trim()).find(g => g === selectedGroup) ?? result.subjectGroup.split(';')[0]}
                                                </Badge>
                                              </div>
                                              <div className="text-right">
                                                <span className="font-semibold text-sm text-navy-700">
                                                  {result.cutoffScore.toFixed(2)}
                                                </span>
                                                <span className="text-xs text-slate-400 ml-1">
                                                  {result.year}
                                                </span>
                                              </div>
                                            </div>
                                          ))}
                                        </div>
                                      </div>
                                    )}
                                    {displayedUnlikely.length > 0 && (
                                      <div>
                                        <p className="text-xs font-medium text-red-600 mb-2">
                                          Khó đậu
                                        </p>
                                        <div className="space-y-2">
                                          {displayedUnlikely.map((result) => (
                                            <div
                                              key={result.majorId}
                                              className="flex items-center justify-between bg-red-50/60 rounded-lg px-3 py-2"
                                            >
                                              <div className="flex items-center gap-2 flex-1">
                                                <TrendingDown className="w-4 h-4 text-red-500" />
                                                <span className="text-sm text-navy-800">
                                                  {result.majorName}
                                                </span>
                                                <Badge variant="default" size="sm">
                                                  {result.subjectGroup.split(';').map(g => g.trim()).find(g => g === selectedGroup) ?? result.subjectGroup.split(';')[0]}
                                                </Badge>
                                              </div>
                                              <div className="text-right">
                                                <span className="font-semibold text-sm text-navy-700">
                                                  {result.cutoffScore.toFixed(2)}
                                                </span>
                                                <span className="text-xs text-slate-400 ml-1">
                                                  {result.year}
                                                </span>
                                              </div>
                                            </div>
                                          ))}
                                        </div>
                                      </div>
                                    )}
                                  </div>
                                )}
                              </div>
                            )
                          })
                      )}

                      {!matchLoading && filteredUniversities.length > UNIS_PER_PAGE && (
                        <div className="flex items-center justify-between pt-4 border-t border-cream-200">
                          <button
                            disabled={uniPage === 0}
                            onClick={() => setUniPage((p) => Math.max(0, p - 1))}
                            className="px-4 py-2 rounded-lg border border-cream-200 text-sm text-navy-700 disabled:opacity-40 hover:border-gold-400 transition-colors"
                          >
                            Trước
                          </button>
                          <span className="text-sm text-slate-500">
                            Trang {uniPage + 1} / {Math.ceil(filteredUniversities.length / UNIS_PER_PAGE)}
                          </span>
                          <button
                            disabled={
                              uniPage >= Math.ceil(filteredUniversities.length / UNIS_PER_PAGE) - 1
                            }
                            onClick={() =>
                              setUniPage((p) =>
                                Math.min(Math.ceil(filteredUniversities.length / UNIS_PER_PAGE) - 1, p + 1),
                              )
                            }
                            className="px-4 py-2 rounded-lg border border-cream-200 text-sm text-navy-700 disabled:opacity-40 hover:border-gold-400 transition-colors"
                          >
                            Sau
                          </button>
                        </div>
                      )}
                    </div>
                  )
                ) : (
                  /* TAB 2: Side-by-Side Detailed Comparison Table */
                  compareList.length === 0 ? (
                    <div className="text-center py-12 text-slate-500">
                      <p className="text-base font-semibold text-navy-800 mb-1">Chưa chọn trường nào để so sánh</p>
                      <p className="text-xs text-slate-500 mb-6 max-w-md mx-auto">
                        Hãy bấm nút <strong>"+ So sánh"</strong> trên bất kỳ trường nào bên tab <strong>"Trường phù hợp"</strong> hoặc bấm nút bên dưới.
                      </p>
                      <Button variant="outline" size="sm" onClick={loadSavedUniversitiesToCompare} disabled={loadingSaved} className="border-gold-400 text-gold-600 hover:bg-gold-50">
                        <Heart className="w-4 h-4 text-red-500 fill-current mr-1.5" />
                        {loadingSaved ? 'Đang nạp...' : 'Nạp trường đã lưu vào bảng so sánh'}
                      </Button>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <div className="flex flex-wrap items-center justify-between gap-3 pb-2 border-b border-cream-100">
                        <div className="flex items-center gap-3">
                          <span className="text-xs font-semibold text-slate-500">
                            Đang so sánh {compareList.length} trường đại học
                          </span>
                          <button
                            onClick={() => setOnlyShowScoredMajors(!onlyShowScoredMajors)}
                            className={cn(
                              'text-xs px-2.5 py-1 rounded-lg border font-medium transition-all flex items-center gap-1.5',
                              onlyShowScoredMajors
                                ? 'bg-gold-500 text-white border-gold-500 shadow-sm'
                                : 'bg-cream-100 text-slate-600 border-cream-200 hover:bg-cream-200'
                            )}
                          >
                            <Filter className="w-3 h-3" />
                            {onlyShowScoredMajors ? 'Đang ẩn ngành không có điểm' : 'Ẩn ngành không có điểm'}
                          </button>
                        </div>
                        <button
                          onClick={() => setCompareList([])}
                          className="text-xs text-red-600 hover:underline font-semibold"
                        >
                          Xóa tất cả ({compareList.length})
                        </button>
                      </div>
                      <div className="overflow-x-auto border border-cream-200 rounded-xl relative max-h-[600px]">
                        <table className="w-full text-sm border-collapse">
                          <thead>
                            <tr className="bg-cream-100/80 border-b border-cream-200 sticky top-0 z-30">
                              <th className="text-left py-3.5 px-4 font-bold text-navy-800 min-w-[220px] sticky left-0 bg-cream-100 z-40 border-r border-cream-200 shadow-[3px_0_8px_-2px_rgba(0,0,0,0.06)]">
                                <div className="flex items-center gap-1.5">
                                  <GraduationCap className="w-4 h-4 text-gold-600" />
                                  <span>Ngành đào tạo</span>
                                </div>
                              </th>
                              {compareList.map((item) => (
                                <th
                                  key={item.universityId}
                                  className="text-center py-3.5 px-4 font-bold text-navy-800 min-w-[190px] bg-cream-100/90"
                                >
                                  <div className="flex items-center justify-between gap-1.5 bg-white p-2 rounded-xl border border-cream-200/80 shadow-sm">
                                    <span className="font-semibold text-navy-800 text-xs text-left line-clamp-2 leading-tight flex-1">
                                      {item.universityName}
                                    </span>
                                    <button
                                      onClick={() => removeFromCompare(item.universityId)}
                                      className="p-1 rounded-full text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors shrink-0"
                                      title="Xóa khỏi bảng so sánh"
                                    >
                                      <X className="w-3.5 h-3.5" />
                                    </button>
                                  </div>
                                </th>
                              ))}
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-cream-100 bg-white">
                            {allComparisonMajors.map((majorName) => (
                              <tr key={majorName} className="hover:bg-cream-50/60 transition-colors group">
                                <td className="py-3 px-4 font-semibold text-navy-800 text-xs sm:text-sm sticky left-0 bg-white group-hover:bg-cream-50 z-20 border-r border-cream-200 shadow-[3px_0_8px_-2px_rgba(0,0,0,0.06)]">
                                  {majorName}
                                </td>
                                {compareList.map((item) => {
                                  const results = matchResults.filter(
                                    (r) => r.universityId === item.universityId
                                  )
                                  const candidate = results.find(
                                    (r) =>
                                      r.majorName.toLowerCase() === majorName.toLowerCase() ||
                                      r.majorName.toLowerCase().includes(majorName.toLowerCase()) ||
                                      majorName.toLowerCase().includes(r.majorName.toLowerCase())
                                  )
                                  if (!candidate || !candidate.cutoffScore) {
                                    return (
                                      <td key={item.universityId} className="py-3 px-4 text-center">
                                        <span className="text-[11px] text-slate-400/80 bg-slate-50 px-2 py-0.5 rounded font-normal italic">
                                          Không tuyển sinh
                                        </span>
                                      </td>
                                    )
                                  }
                                  const score = candidate.cutoffScore
                                  const likelihood = getLikelihood(totalScore, score)
                                  return (
                                    <td key={item.universityId} className="py-3 px-4 text-center">
                                      <div className={cn(
                                        'inline-flex flex-col items-center px-3 py-1.5 rounded-xl transition-all',
                                        likelihood.label === 'Chắc chắn' ? 'bg-green-50 border border-green-200/80 text-green-800' :
                                        likelihood.label === 'Có thể đậu' ? 'bg-yellow-50 border border-yellow-200/80 text-yellow-900' :
                                        'bg-red-50 border border-red-200/80 text-red-800'
                                      )}>
                                        <div className="flex items-center gap-1.5">
                                          <span className="font-bold text-sm leading-none">
                                            {score.toFixed(2)}
                                          </span>
                                          <span className="text-[10px] opacity-60 font-mono">
                                            {candidate.year}
                                          </span>
                                        </div>
                                        <span className={`text-[11px] font-semibold ${likelihood.color} mt-0.5`}>
                                          ({likelihood.label})
                                        </span>
                                      </div>
                                    </td>
                                  )
                                })}
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )
                )}
              </CardContent>
            </Card>
        </div>
      </div>
    </div>
  )
}