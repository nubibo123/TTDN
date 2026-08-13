import { useState, useRef, useEffect, useCallback } from 'react'
import { Link } from 'react-router-dom'
import { Upload, Camera, Edit3, Check, X, AlertCircle, TrendingUp, BookOpen, Loader2, RotateCcw, Save, ShieldCheck, LogIn } from 'lucide-react'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { averageScore } from '@/lib/utils'
import BlurReveal from '@/components/BlurReveal'
import { extractScoresFromImage } from '@/lib/gemini'
import { useAuth } from '@/lib/authContext'
import { getMyTranscripts, saveBatchTranscripts, type SaveTranscriptRequest, type TranscriptDto } from '@/lib/transcripts'

export type SubjectKey = 'math' | 'literature' | 'english' | 'physics' | 'chemistry' | 'biology' | 'history' | 'geography' | 'civic'
type GradeKey = 'grade10' | 'grade11' | 'grade12'

interface GradeScores {
  semester1: Record<SubjectKey, string>
  semester2: Record<SubjectKey, string>
}

interface ScoreEntry {
  grade10: GradeScores
  grade11: GradeScores
  grade12: GradeScores
  graduation: Record<SubjectKey, string>
}

const EMPTY: Record<SubjectKey, string> = {
  math: '',
  literature: '',
  english: '',
  physics: '',
  chemistry: '',
  biology: '',
  history: '',
  geography: '',
  civic: '',
}

const subjects: { key: SubjectKey; shortLabel: string }[] = [
  { key: 'math', shortLabel: 'Toán' },
  { key: 'literature', shortLabel: 'Văn' },
  { key: 'english', shortLabel: 'NN' },
  { key: 'physics', shortLabel: 'Lý' },
  { key: 'chemistry', shortLabel: 'Hóa' },
  { key: 'biology', shortLabel: 'Sinh' },
  { key: 'history', shortLabel: 'Sử' },
  { key: 'geography', shortLabel: 'Địa' },
  { key: 'civic', shortLabel: 'GDCD' },
]

const GRADE_LABELS: Record<GradeKey, string> = {
  grade10: 'Lớp 10',
  grade11: 'Lớp 11',
  grade12: 'Lớp 12',
}

const LOCAL_STORAGE_KEY = 'admit_transcripts_draft'

function loadLocalBackup(): ScoreEntry | null {
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_KEY)
    if (raw) return JSON.parse(raw)
  } catch {
    // Ignore parse error
  }
  return null
}

function saveLocalBackup(scores: ScoreEntry) {
  try {
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(scores))
  } catch {
    // Ignore storage quota error
  }
}

function hasAnyScore(s: Record<SubjectKey, string>): boolean {
  return Object.values(s).some((val) => val !== '' && val !== null && val !== undefined)
}

function countEnteredSubjects(s: Record<SubjectKey, string>): number {
  return Object.values(s).filter((val) => val !== '' && val !== null && val !== undefined).length
}

function cn(...classes: (string | undefined | false)[]) {
  return classes.filter(Boolean).join(' ')
}

function ScoreCell({ value, onChange, editable }: { value: string; onChange: (v: string) => void; editable: boolean }) {
  const [editing, setEditing] = useState(false)
  const [localVal, setLocalVal] = useState(value)

  useEffect(() => {
    setLocalVal(value)
  }, [value])

  if (!editable) return <span className="text-slate-400">—</span>

  if (editing) {
    return (
      <div className="flex items-center gap-1">
        <input
          type="number"
          min="0"
          max="10"
          step="0.1"
          value={localVal}
          onChange={(e) => setLocalVal(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              onChange(localVal)
              setEditing(false)
            }
            if (e.key === 'Escape') {
              setLocalVal(value)
              setEditing(false)
            }
          }}
          className="w-16 px-2 py-1 text-sm rounded-lg border border-gold-400 bg-white text-center focus:outline-none"
          autoFocus
        />
        <button
          onClick={() => {
            onChange(localVal)
            setEditing(false)
          }}
          className="text-green-600 hover:text-green-700"
        >
          <Check className="w-4 h-4" />
        </button>
        <button
          onClick={() => {
            setLocalVal(value)
            setEditing(false)
          }}
          className="text-red-400 hover:text-red-600"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    )
  }

  return (
    <div className="flex items-center gap-1 group">
      <span className={cn('min-w-[3ch] text-center', value ? 'text-navy-800 font-medium' : 'text-slate-400')}>
        {value || '—'}
      </span>
      <button
        onClick={() => setEditing(true)}
        className="opacity-0 group-hover:opacity-100 transition-opacity text-slate-400 hover:text-gold-600"
      >
        <Edit3 className="w-3 h-3" />
      </button>
    </div>
  )
}

function ScoreTable({
  scores,
  editable,
  onChange,
}: {
  scores: Record<SubjectKey, string>
  editable: boolean
  onChange: (key: SubjectKey, val: string) => void
}) {
  return (
    <div className="grid grid-cols-5 gap-2">
      {subjects.map((s) => (
        <div key={s.key} className="flex flex-col gap-1">
          <span className="text-xs text-slate-500 text-center">{s.shortLabel}</span>
          <ScoreCell value={scores[s.key]} onChange={(v) => onChange(s.key, v)} editable={editable} />
        </div>
      ))}
    </div>
  )
}

function AverageBar({ scores, label, color }: { scores: Record<SubjectKey, string>; label: string; color: string }) {
  const vals = Object.values(scores).map(Number).filter((v) => !isNaN(v) && v > 0)
  const count = vals.length
  const avg = count ? vals.reduce((a, b) => a + b, 0) / count : 0
  return (
    <div className="mt-3">
      <div className="flex justify-between text-xs text-slate-500 mb-1">
        <span>
          {label} {count > 0 && count < 9 ? `(${count}/9 môn)` : ''}
        </span>
        <span className="font-semibold text-navy-800">{count > 0 ? avg.toFixed(2) : '—'}</span>
      </div>
      <div className="h-2 bg-cream-200 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-700 ${color}`}
          style={{ width: count > 0 ? `${(avg / 10) * 100}%` : '0%' }}
        />
      </div>
    </div>
  )
}

function parseScoreMap(raw: string | undefined): Record<SubjectKey, string> {
  if (!raw) return { ...EMPTY }
  try {
    const parsed = JSON.parse(raw)
    const res = { ...EMPTY }
    for (const key of Object.keys(EMPTY) as SubjectKey[]) {
      if (parsed[key] !== undefined && parsed[key] !== null) {
        res[key] = String(parsed[key])
      }
    }
    return res
  } catch {
    return { ...EMPTY }
  }
}

function calcSemesterAvg(scores: Record<SubjectKey, string>): number | null {
  const vals = Object.values(scores).map(Number).filter((v) => !isNaN(v) && v > 0)
  return vals.length ? parseFloat((vals.reduce((a, b) => a + b, 0) / vals.length).toFixed(2)) : null
}

export default function TranscriptPage() {
  const { user } = useAuth()
  const [uploaded, setUploaded] = useState(false)
  const [extracting, setExtracting] = useState(false)
  const [extractError, setExtractError] = useState('')
  const [editable, setEditable] = useState(true)
  const [activeTab, setActiveTab] = useState<'manual' | 'upload'>('manual')
  const [activeGrade, setActiveGrade] = useState<GradeKey>('grade12')
  const [loadingData, setLoadingData] = useState(false)
  const [saving, setSaving] = useState(false)
  const [saveSuccessMsg, setSaveSuccessMsg] = useState('')
  const [saveWarningMsg, setSaveWarningMsg] = useState('')
  const [saveError, setSaveError] = useState('')
  const fileRef = useRef<HTMLInputElement>(null)

  const [scores, setScores] = useState<ScoreEntry>(() => {
    const local = loadLocalBackup()
    if (local) return local
    return {
      grade10: { semester1: { ...EMPTY }, semester2: { ...EMPTY } },
      grade11: { semester1: { ...EMPTY }, semester2: { ...EMPTY } },
      grade12: { semester1: { ...EMPTY }, semester2: { ...EMPTY } },
      graduation: { ...EMPTY },
    }
  })

  // Auto-backup to localStorage on state change
  useEffect(() => {
    saveLocalBackup(scores)
  }, [scores])

  const loadTranscripts = useCallback(async () => {
    if (!user) return
    setLoadingData(true)
    try {
      const data: TranscriptDto[] = await getMyTranscripts()
      if (data && data.length > 0) {
        setScores((prev) => {
          const next: ScoreEntry = {
            grade10: { ...prev.grade10 },
            grade11: { ...prev.grade11 },
            grade12: { ...prev.grade12 },
            graduation: { ...prev.graduation },
          }

          for (const item of data) {
            const parsed = parseScoreMap(item.scores)
            switch (item.semester) {
              case 'HK1_L10':
                next.grade10.semester1 = parsed
                break
              case 'HK2_L10':
                next.grade10.semester2 = parsed
                break
              case 'HK1_L11':
                next.grade11.semester1 = parsed
                break
              case 'HK2_L11':
                next.grade11.semester2 = parsed
                break
              case 'HK1_L12':
                next.grade12.semester1 = parsed
                break
              case 'HK2_L12':
                next.grade12.semester2 = parsed
                break
              case 'GRADUATION_EXAM':
                next.graduation = parsed
                break
            }
          }
          saveLocalBackup(next)
          return next
        })
      }
    } catch (err: any) {
      console.warn('Could not load existing transcripts from server, using local cache:', err)
    } finally {
      setLoadingData(false)
    }
  }, [user])

  useEffect(() => {
    loadTranscripts()
  }, [loadTranscripts])

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setExtracting(true)
    setExtractError('')
    try {
      const extracted = await extractScoresFromImage(file, { allowDemoFallback: false })
      setScores((prev) => ({
        ...prev,
        [activeGrade]: extracted,
      }))
      setUploaded(true)
    } catch (err: any) {
      console.error('OCR error detailed:', err)
      setExtractError('Không thể trích xuất điểm từ hình ảnh lúc này. Vui lòng thử lại sau hoặc nhập thủ công.')
    } finally {
      setExtracting(false)
      if (e.target) e.target.value = ''
    }
  }

  const handleSave = async () => {
    setSaving(true)
    setSaveError('')
    setSaveWarningMsg('')
    setSaveSuccessMsg('')

    // 1. Always back up locally first
    saveLocalBackup(scores)

    // Check how many subjects are entered overall
    const totalFilled =
      countEnteredSubjects(scores.grade10.semester1) +
      countEnteredSubjects(scores.grade10.semester2) +
      countEnteredSubjects(scores.grade11.semester1) +
      countEnteredSubjects(scores.grade11.semester2) +
      countEnteredSubjects(scores.grade12.semester1) +
      countEnteredSubjects(scores.grade12.semester2) +
      countEnteredSubjects(scores.graduation)

    if (totalFilled === 0) {
      setSaveWarningMsg('Bạn chưa nhập điểm môn nào. Vui lòng nhập ít nhất 1 điểm trước khi lưu.')
      setSaving(false)
      return
    }

    const currentYear = new Date().getFullYear()

    const allSemesters: { semester: SaveTranscriptRequest['semester']; year: number; scoresMap: Record<SubjectKey, string> }[] = [
      { semester: 'HK1_L10', year: currentYear - 2, scoresMap: scores.grade10.semester1 },
      { semester: 'HK2_L10', year: currentYear - 2, scoresMap: scores.grade10.semester2 },
      { semester: 'HK1_L11', year: currentYear - 1, scoresMap: scores.grade11.semester1 },
      { semester: 'HK2_L11', year: currentYear - 1, scoresMap: scores.grade11.semester2 },
      { semester: 'HK1_L12', year: currentYear, scoresMap: scores.grade12.semester1 },
      { semester: 'HK2_L12', year: currentYear, scoresMap: scores.grade12.semester2 },
      { semester: 'GRADUATION_EXAM', year: currentYear, scoresMap: scores.graduation },
    ]

    // Include all semesters that have any score entered (partial or full)
    const payload: SaveTranscriptRequest[] = allSemesters.map(({ semester, year, scoresMap }) => {
      const count = countEnteredSubjects(scoresMap)
      return {
        semester,
        year,
        scores: JSON.stringify(scoresMap),
        avgScore: calcSemesterAvg(scoresMap),
        isDraft: count < 9,
      }
    })

    if (!user) {
      setSaveWarningMsg('Đã lưu bản nháp an toàn trên thiết bị của bạn! Vui lòng đăng nhập để đồng bộ lên hệ thống.')
      setSaving(false)
      setTimeout(() => setSaveWarningMsg(''), 5000)
      return
    }

    try {
      await saveBatchTranscripts(payload)
      setSaveSuccessMsg(`Đã lưu thành công (${totalFilled} điểm môn học)!`)
      setTimeout(() => setSaveSuccessMsg(''), 4000)
    } catch (err: any) {
      console.error('Failed to save transcripts to server:', err)
      setSaveWarningMsg(
        'Đã lưu an toàn vào thiết bị của bạn. Đã có lỗi bất ngờ xảy ra khi đồng bộ trực tuyến, vui lòng thử lại sau.'
      )
    } finally {
      setSaving(false)
    }
  }

  const updateGradeScore = (semester: 'semester1' | 'semester2', key: SubjectKey, val: string) => {
    setScores((prev) => ({
      ...prev,
      [activeGrade]: {
        ...prev[activeGrade],
        [semester]: { ...prev[activeGrade][semester], [key]: val },
      },
    }))
  }

  const resetGradeScores = (semester: 'semester1' | 'semester2') => {
    setScores((prev) => ({
      ...prev,
      [activeGrade]: { ...prev[activeGrade], [semester]: { ...EMPTY } },
    }))
  }

  const updateGraduation = (key: SubjectKey, val: string) => {
    setScores((prev) => ({
      ...prev,
      graduation: { ...prev.graduation, [key]: val },
    }))
  }

  const gradeScores = scores[activeGrade]
  const overallAvgVals = [
    ...Object.values(gradeScores.semester1).map(Number),
    ...Object.values(gradeScores.semester2).map(Number),
  ].filter((v) => !isNaN(v) && v > 0)

  const overallAvg = overallAvgVals.length ? averageScore(overallAvgVals) : 0

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <BlurReveal as="div" className="mb-8" duration={700}>
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="font-display text-4xl font-bold text-navy-800 mb-2">Nhập điểm học bạ</h1>
            <p className="text-slate-600">
              Nhập điểm từng môn linh hoạt (1 hoặc nhiều môn). Điểm được tự động lưu tạm trên máy và đồng bộ lên hệ thống.
            </p>
          </div>
          {!user && (
            <Link to="/dang-nhap">
              <Badge variant="warning" className="cursor-pointer gap-1.5 py-1 px-3">
                <LogIn className="w-3.5 h-3.5" /> Chưa đăng nhập (Lưu cục bộ)
              </Badge>
            </Link>
          )}
        </div>
      </BlurReveal>

      {/* Save Alerts */}
      {saveSuccessMsg && (
        <div className="mb-6 flex items-center gap-3 p-4 rounded-xl bg-green-50 border border-green-200 text-green-800 shadow-sm animate-in fade-in slide-in-from-top duration-300">
          <Check className="w-5 h-5 text-green-600 shrink-0" />
          <div>
            <p className="font-semibold text-sm">Lưu thành công!</p>
            <p className="text-xs text-green-700">{saveSuccessMsg}</p>
          </div>
        </div>
      )}

      {saveWarningMsg && (
        <div className="mb-6 flex items-center justify-between gap-3 p-4 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 shadow-sm">
          <div className="flex items-center gap-3">
            <ShieldCheck className="w-5 h-5 text-amber-600 shrink-0" />
            <div>
              <p className="font-semibold text-sm">Lưu trữ cục bộ an toàn</p>
              <p className="text-xs text-amber-700">{saveWarningMsg}</p>
            </div>
          </div>
          {!user && (
            <Link to="/dang-nhap">
              <Button size="sm" variant="outline" className="border-amber-400 text-amber-800 hover:bg-amber-100 shrink-0">
                Đăng nhập ngay
              </Button>
            </Link>
          )}
        </div>
      )}

      {saveError && (
        <div className="mb-6 flex items-center gap-3 p-4 rounded-xl bg-red-50 border border-red-200 text-red-800 shadow-sm">
          <AlertCircle className="w-5 h-5 text-red-600 shrink-0" />
          <div>
            <p className="font-semibold text-sm">Lỗi khi lưu học bạ</p>
            <p className="text-xs text-red-700">{saveError}</p>
          </div>
        </div>
      )}

      {/* Input method tabs */}
      <div className="flex flex-wrap gap-2 mb-6">
        {(['manual', 'upload'] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-medium transition-all ${
              activeTab === tab
                ? 'bg-navy-800 text-cream-100'
                : 'bg-white text-slate-600 hover:bg-cream-100 border border-cream-200'
            }`}
          >
            {tab === 'manual' ? <Edit3 className="w-4 h-4" /> : <Upload className="w-4 h-4" />}
            {tab === 'manual' ? 'Nhập thủ công' : 'Upload hình ảnh'}
          </button>
        ))}
      </div>

      {/* Grade selector */}
      <div className="flex gap-2 mb-8">
        {(['grade10', 'grade11', 'grade12'] as GradeKey[]).map((g) => {
          const filledCount =
            countEnteredSubjects(scores[g].semester1) + countEnteredSubjects(scores[g].semester2)
          return (
            <button
              key={g}
              onClick={() => setActiveGrade(g)}
              className={`px-4 py-2 rounded-xl text-sm font-medium transition-all border flex items-center gap-2 ${
                activeGrade === g
                  ? 'bg-gold-500 text-white border-gold-500'
                  : 'bg-white text-slate-600 hover:bg-cream-100 border-cream-200'
              }`}
            >
              <span>{GRADE_LABELS[g]}</span>
              {filledCount > 0 && (
                <span
                  className={`text-xs px-1.5 py-0.5 rounded-full ${
                    activeGrade === g ? 'bg-gold-600 text-white' : 'bg-cream-200 text-navy-800'
                  }`}
                >
                  {filledCount}/18
                </span>
              )}
            </button>
          )
        })}
      </div>

      {activeTab === 'upload' && (
        <BlurReveal duration={600} delay={100} className="mb-8">
          <Card>
            <CardContent className="py-12">
              {extracting ? (
                <div className="flex flex-col items-center gap-4">
                  <div className="w-16 h-16 bg-gold-500/10 rounded-full flex items-center justify-center">
                    <Loader2 className="w-8 h-8 text-gold-500 animate-spin" />
                  </div>
                  <p className="font-semibold text-navy-800">Gemini đang đọc điểm...</p>
                  <p className="text-sm text-slate-500">Vui lòng đợi trong giây lát</p>
                </div>
              ) : !uploaded ? (
                <div className="flex flex-col items-center gap-4">
                  <div className="w-20 h-20 bg-cream-100 rounded-2xl flex items-center justify-center">
                    <Camera className="w-10 h-10 text-slate-400" />
                  </div>
                  <div className="text-center">
                    <p className="font-semibold text-navy-800 mb-1">
                      Upload hình ảnh học bạ {GRADE_LABELS[activeGrade]}
                    </p>
                    <p className="text-sm text-slate-500 mb-4">Hỗ trợ JPG, PNG, PDF. Dung lượng tối đa 10MB.</p>
                  </div>
                  <input ref={fileRef} type="file" accept="image/*" onChange={handleFileChange} className="hidden" />
                  <Button onClick={() => fileRef.current?.click()} variant="primary">
                    <Upload className="w-4 h-4" /> Chọn file
                  </Button>
                  {extractError && (
                    <div className="flex items-start gap-2 p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm">
                      <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
                      <span>{extractError}</span>
                    </div>
                  )}
                  <p className="text-xs text-slate-400 mt-2">
                    <AlertCircle className="w-3 h-3 inline mr-1" />
                    Gemini AI sẽ tự động trích xuất điểm từ hình ảnh. Bạn có thể chỉnh sửa sau khi upload.
                  </p>
                </div>
              ) : (
                <div className="flex flex-col items-center gap-4">
                  <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
                    <Check className="w-8 h-8 text-green-600" />
                  </div>
                  <p className="font-semibold text-navy-800">Đã trích xuất điểm thành công!</p>
                  <p className="text-sm text-slate-500">Vui lòng kiểm tra và chỉnh sửa điểm bên dưới nếu cần.</p>
                  <Button
                    variant="outline"
                    onClick={() => {
                      setUploaded(false)
                      setExtractError('')
                    }}
                  >
                    Upload lại
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </BlurReveal>
      )}

      {/* Score tables */}
      <div className="space-y-6">
        <BlurReveal key={`${activeGrade}-hk1`} duration={600} delay={150}>
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-gold-500/15 rounded-xl flex items-center justify-center">
                    <BookOpen className="w-5 h-5 text-gold-600" />
                  </div>
                  <div>
                    <CardTitle>Học kỳ 1 ({GRADE_LABELS[activeGrade]})</CardTitle>
                    <p className="text-sm text-slate-500 font-normal mt-0.5">Nhấn vào ô điểm để nhập hoặc sửa</p>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => resetGradeScores('semester1')}
                  className="text-slate-400 hover:text-red-500 h-8 px-2 gap-1.5"
                >
                  <RotateCcw className="w-3 h-3" />
                  <span className="text-xs">Reset</span>
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {loadingData ? (
                <div className="py-8 text-center text-slate-400">
                  <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2 text-gold-500" />
                  <p className="text-xs">Đang tải điểm từ hệ thống...</p>
                </div>
              ) : (
                <>
                  <ScoreTable
                    scores={gradeScores.semester1}
                    editable={editable}
                    onChange={(k, v) => updateGradeScore('semester1', k, v)}
                  />
                  <AverageBar scores={gradeScores.semester1} label="Điểm TB HKI" color="bg-gold-500" />
                </>
              )}
            </CardContent>
          </Card>
        </BlurReveal>

        <BlurReveal key={`${activeGrade}-hk2`} duration={600} delay={250}>
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-gold-500/15 rounded-xl flex items-center justify-center">
                    <BookOpen className="w-5 h-5 text-gold-600" />
                  </div>
                  <div>
                    <CardTitle>Học kỳ 2 ({GRADE_LABELS[activeGrade]})</CardTitle>
                    <p className="text-sm text-slate-500 font-normal mt-0.5">Nhấn vào ô điểm để nhập hoặc sửa</p>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => resetGradeScores('semester2')}
                  className="text-slate-400 hover:text-red-500 h-8 px-2 gap-1.5"
                >
                  <RotateCcw className="w-3 h-3" />
                  <span className="text-xs">Reset</span>
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {loadingData ? (
                <div className="py-8 text-center text-slate-400">
                  <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2 text-gold-500" />
                  <p className="text-xs">Đang tải điểm từ hệ thống...</p>
                </div>
              ) : (
                <>
                  <ScoreTable
                    scores={gradeScores.semester2}
                    editable={editable}
                    onChange={(k, v) => updateGradeScore('semester2', k, v)}
                  />
                  <AverageBar scores={gradeScores.semester2} label="Điểm TB HKII" color="bg-gold-500" />
                </>
              )}
            </CardContent>
          </Card>
        </BlurReveal>

        {activeGrade === 'grade12' && (
          <BlurReveal duration={600} delay={350}>
            <Card>
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-navy-800/10 rounded-xl flex items-center justify-center">
                    <TrendingUp className="w-5 h-5 text-navy-800" />
                  </div>
                  <div>
                    <CardTitle>Điểm thi tốt nghiệp THPT (nếu có)</CardTitle>
                    <p className="text-sm text-slate-500 font-normal mt-0.5">
                      Nhập điểm thi thật hoặc dự đoán để so sánh xét tuyển
                    </p>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <ScoreTable scores={scores.graduation} editable={true} onChange={updateGraduation} />
              </CardContent>
            </Card>
          </BlurReveal>
        )}

        {/* Summary */}
        <Card className="bg-navy-800 border-navy-800">
          <CardContent className="py-6">
            <BlurReveal duration={700} delay={450}>
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div>
                  <p className="text-cream-200 text-sm mb-1">
                    Điểm trung bình {GRADE_LABELS[activeGrade]} (HKI + HKII)
                  </p>
                  <p className="font-display text-5xl font-bold text-gold-400">
                    {overallAvgVals.length ? overallAvg.toFixed(2) : '—'}
                  </p>
                </div>
                <div className="flex flex-wrap gap-3">
                  <Button
                    variant="outline"
                    className="border-cream-100/30 text-cream-100 hover:bg-cream-100/10"
                    onClick={() => setEditable(!editable)}
                  >
                    {editable ? 'Khóa chỉnh sửa' : 'Mở chỉnh sửa'}
                  </Button>
                  <Button variant="primary" onClick={handleSave} disabled={saving} className="gap-2">
                    {saving ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Đang lưu...
                      </>
                    ) : saveSuccessMsg ? (
                      <>
                        <Check className="w-4 h-4 text-green-300" />
                        Đã lưu!
                      </>
                    ) : (
                      <>
                        <Save className="w-4 h-4" />
                        Lưu học bạ
                      </>
                    )}
                  </Button>
                </div>
              </div>
              {activeGrade === 'grade12' && Object.values(scores.graduation).some((v) => v) && (
                <div className="mt-4 pt-4 border-t border-navy-700">
                  <div className="flex flex-wrap gap-6">
                    {[
                      { label: 'Khối A00 (Toán+Lý+Hóa)', keys: ['math', 'physics', 'chemistry'] as SubjectKey[] },
                      { label: 'Khối A01 (Toán+Lý+Anh)', keys: ['math', 'physics', 'english'] as SubjectKey[] },
                      { label: 'Khối D01 (Toán+Văn+Anh)', keys: ['math', 'literature', 'english'] as SubjectKey[] },
                    ].map(({ label, keys }) => (
                      <div key={label}>
                        <p className="text-cream-200 text-xs">{label}</p>
                        <p className="text-cream-50 font-display font-bold text-lg">
                          {keys
                            .map((k) => Number(scores.graduation[k]))
                            .filter((v) => !isNaN(v) && v > 0)
                            .reduce((a, b) => a + b, 0)
                            .toFixed(2) || '—'}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </BlurReveal>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
