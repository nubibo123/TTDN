import { useState, useRef } from 'react'
import { Upload, Camera, Edit3, Check, X, AlertCircle, TrendingUp, BookOpen, Loader2, RotateCcw } from 'lucide-react'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { averageScore } from '@/lib/utils'
import BlurReveal from '@/components/BlurReveal'
import { extractScoresFromImage } from '@/lib/gemini'

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

const EMPTY: Record<SubjectKey, string> = { math: '', literature: '', english: '', physics: '', chemistry: '', biology: '', history: '', geography: '', civic: '' }

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

const GRADE_LABELS: Record<GradeKey, string> = { grade10: 'Lớp 10', grade11: 'Lớp 11', grade12: 'Lớp 12' }

function cn(...classes: (string | undefined | false)[]) {
  return classes.filter(Boolean).join(' ')
}

function ScoreCell({ value, onChange, editable }: { value: string; onChange: (v: string) => void; editable: boolean }) {
  const [editing, setEditing] = useState(false)
  const [localVal, setLocalVal] = useState(value)

  if (!editable) return <span className="text-slate-400">—</span>

  if (editing) {
    return (
      <div className="flex items-center gap-1">
        <input
          type="number" min="0" max="10" step="0.1" value={localVal}
          onChange={(e) => setLocalVal(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') { onChange(localVal); setEditing(false) }
            if (e.key === 'Escape') { setLocalVal(value); setEditing(false) }
          }}
          className="w-16 px-2 py-1 text-sm rounded-lg border border-gold-400 bg-white text-center focus:outline-none"
          autoFocus
        />
        <button onClick={() => { onChange(localVal); setEditing(false) }} className="text-green-600 hover:text-green-700"><Check className="w-4 h-4" /></button>
        <button onClick={() => { setLocalVal(value); setEditing(false) }} className="text-red-400 hover:text-red-600"><X className="w-4 h-4" /></button>
      </div>
    )
  }

  return (
    <div className="flex items-center gap-1 group">
      <span className={cn('min-w-[3ch] text-center', value ? 'text-navy-800 font-medium' : 'text-slate-400')}>{value || '—'}</span>
      <button onClick={() => setEditing(true)} className="opacity-0 group-hover:opacity-100 transition-opacity text-slate-400 hover:text-gold-600">
        <Edit3 className="w-3 h-3" />
      </button>
    </div>
  )
}

function ScoreTable({ scores, editable, onChange }: { scores: Record<SubjectKey, string>; editable: boolean; onChange: (key: SubjectKey, val: string) => void }) {
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
  const avg = vals.length ? vals.reduce((a, b) => a + b, 0) / vals.length : 0
  return (
    <div className="mt-3">
      <div className="flex justify-between text-xs text-slate-500 mb-1">
        <span>{label}</span>
        <span className="font-semibold text-navy-800">{avg.toFixed(2)}</span>
      </div>
      <div className="h-2 bg-cream-200 rounded-full overflow-hidden">
        <div className={`h-full rounded-full transition-all duration-700 ${color}`} style={{ width: `${(avg / 10) * 100}%` }} />
      </div>
    </div>
  )
}

export default function TranscriptPage() {
  const [uploaded, setUploaded] = useState(false)
  const [extracting, setExtracting] = useState(false)
  const [extractError, setExtractError] = useState('')
  const [editable, setEditable] = useState(true)
  const [activeTab, setActiveTab] = useState<'manual' | 'upload'>('manual')
  const [activeGrade, setActiveGrade] = useState<GradeKey>('grade12')
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)

  const [scores, setScores] = useState<ScoreEntry>({
    grade10: { semester1: { ...EMPTY }, semester2: { ...EMPTY } },
    grade11: { semester1: { ...EMPTY }, semester2: { ...EMPTY } },
    grade12: {
      semester1: { math: '8.5', literature: '8.0', english: '8.5', physics: '8.0', chemistry: '7.5', biology: '8.0', history: '8.5', geography: '8.0', civic: '8.5' },
      semester2: { math: '8.0', literature: '8.5', english: '9.0', physics: '7.5', chemistry: '8.0', biology: '8.5', history: '8.0', geography: '8.5', civic: '8.5' },
    },
    graduation: { ...EMPTY },
  })

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
      const errorMessage = err.response?.data || err.message || 'Unknown error'
      setExtractError(`Lỗi OCR: ${errorMessage}. Vui lòng thử lại hoặc nhập thủ công.`)
    } finally {
      setExtracting(false)
      if (e.target) e.target.value = ''
    }
  }

  const handleSave = async () => {
    setSaving(true)
    await new Promise((r) => setTimeout(r, 800))
    setSaving(false)
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  const updateGradeScore = (semester: 'semester1' | 'semester2', key: SubjectKey, val: string) => {
    setScores((prev) => ({
      ...prev,
      [activeGrade]: { ...prev[activeGrade], [semester]: { ...prev[activeGrade][semester], [key]: val } },
    }))
  }

  const resetGradeScores = (semester: 'semester1' | 'semester2') => {
    setScores((prev) => ({
      ...prev,
      [activeGrade]: { ...prev[activeGrade], [semester]: { ...EMPTY } },
    }))
  }

  const updateGraduation = (key: SubjectKey, val: string) => {
    setScores((prev) => ({ ...prev, graduation: { ...prev.graduation, [key]: val } }))
  }

  const gradeScores = scores[activeGrade]
  const overallAvg = averageScore([
    ...Object.values(gradeScores.semester1).map(Number),
    ...Object.values(gradeScores.semester2).map(Number),
  ].filter(Boolean))

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <BlurReveal as="div" className="mb-8" duration={700}>
        <h1 className="font-display text-4xl font-bold text-navy-800 mb-2">Nhập điểm học bạ</h1>
        <p className="text-slate-600">Upload hình ảnh học bạ hoặc nhập điểm thủ công. Nhấn vào ô điểm để chỉnh sửa.</p>
      </BlurReveal>

      {/* Input method tabs */}
      <div className="flex flex-wrap gap-2 mb-6">
        {(['manual', 'upload'] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-medium transition-all ${
              activeTab === tab ? 'bg-navy-800 text-cream-100' : 'bg-white text-slate-600 hover:bg-cream-100 border border-cream-200'
            }`}
          >
            {tab === 'manual' ? <Edit3 className="w-4 h-4" /> : <Upload className="w-4 h-4" />}
            {tab === 'manual' ? 'Nhập thủ công' : 'Upload hình ảnh'}
          </button>
        ))}
      </div>

      {/* Grade selector */}
      <div className="flex gap-2 mb-8">
        {(['grade10', 'grade11', 'grade12'] as GradeKey[]).map((g) => (
          <button
            key={g}
            onClick={() => setActiveGrade(g)}
            className={`px-4 py-2 rounded-xl text-sm font-medium transition-all border ${
              activeGrade === g ? 'bg-gold-500 text-white border-gold-500' : 'bg-white text-slate-600 hover:bg-cream-100 border-cream-200'
            }`}
          >
            {GRADE_LABELS[g]}
          </button>
        ))}
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
                    <p className="font-semibold text-navy-800 mb-1">Upload hình ảnh học bạ {GRADE_LABELS[activeGrade]}</p>
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
                  <Button variant="outline" onClick={() => { setUploaded(false); setExtractError('') }}>Upload lại</Button>
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
                     <p className="text-sm text-slate-500 font-normal mt-0.5">Nhấn vào ô điểm để chỉnh sửa</p>
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
              <ScoreTable scores={gradeScores.semester1} editable={editable} onChange={(k, v) => updateGradeScore('semester1', k, v)} />
              <AverageBar scores={gradeScores.semester1} label="Điểm TB HKI" color="bg-gold-500" />
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
                     <p className="text-sm text-slate-500 font-normal mt-0.5">Nhấn vào ô điểm để chỉnh sửa</p>
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
              <ScoreTable scores={gradeScores.semester2} editable={editable} onChange={(k, v) => updateGradeScore('semester2', k, v)} />
              <AverageBar scores={gradeScores.semester2} label="Điểm TB HKII" color="bg-gold-500" />
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
                    <p className="text-sm text-slate-500 font-normal mt-0.5">Nhập điểm thi thật hoặc dự đoán để so sánh</p>
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
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-cream-200 text-sm mb-1">Điểm trung bình {GRADE_LABELS[activeGrade]} (HKI + HKII)</p>
                  <p className="font-display text-5xl font-bold text-gold-400">{overallAvg.toFixed(2)}</p>
                </div>
                <div className="flex gap-3">
                  <Button variant="outline" className="border-cream-100/30 text-cream-100 hover:bg-cream-100/10" onClick={() => setEditable(!editable)}>
                    {editable ? 'Khóa chỉnh sửa' : 'Mở chỉnh sửa'}
                  </Button>
                  <Button variant="primary" onClick={handleSave} disabled={saving}>
                    {saving ? 'Đang lưu...' : saved ? <><Check className="w-4 h-4" /> Đã lưu!</> : 'Lưu học bạ'}
                  </Button>
                </div>
              </div>
              {activeGrade === 'grade12' && Object.values(scores.graduation).some((v) => v) && (
                <div className="mt-4 pt-4 border-t border-navy-700">
                  <div className="flex gap-6">
                    {[
                      { label: 'Khối A00 (Toán+Lý+Hóa)', keys: ['math', 'physics', 'chemistry'] as SubjectKey[] },
                      { label: 'Khối A01 (Toán+Lý+Anh)', keys: ['math', 'physics', 'english'] as SubjectKey[] },
                      { label: 'Khối D01 (Toán+Văn+Anh)', keys: ['math', 'literature', 'english'] as SubjectKey[] },
                    ].map(({ label, keys }) => (
                      <div key={label}>
                        <p className="text-cream-200 text-xs">{label}</p>
                        <p className="text-cream-50 font-display font-bold text-lg">
                          {keys.map((k) => Number(scores.graduation[k])).filter((v) => !isNaN(v) && v > 0).reduce((a, b) => a + b, 0).toFixed(2) || '—'}
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
