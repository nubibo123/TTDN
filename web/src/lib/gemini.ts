import type { SubjectKey } from '@/pages/TranscriptPage'

const OCR_ENDPOINT = (import.meta.env.VITE_OCR_ENDPOINT as string | undefined) ?? '/ocr-proxy/ocr'
const OCR_TIMEOUT_MS = 30_000

export interface ExtractedScores {
  semester1: Record<SubjectKey, string>
  semester2: Record<SubjectKey, string>
  /** Source tag for the UI: 'ocr' (real), 'demo' (offline fallback), 'empty' (no data). */
  source?: 'ocr' | 'demo' | 'empty'
}

const EMPTY = (): Record<SubjectKey, string> => ({
  math: '', literature: '', english: '', physics: '',
  chemistry: '', biology: '', history: '', geography: '', civic: '',
})

// Map các tên môn tiếng Việt (theo prompt mới) -> SubjectKey
const SUBJECT_MAP: Record<string, SubjectKey> = {
  'toan': 'math',
  'van': 'literature',
  'ngoai_ngu': 'english',
  'tieng_anh': 'english',
  'vat_ly': 'physics',
  'hoa_hoc': 'chemistry',
  'sinh_hoc': 'biology',
  'lich_su': 'history',
  'dia_ly': 'geography',
  'gd_kt_pl': 'civic',
  'gdcd': 'civic',
}

function parseOcrText(text: string): ExtractedScores {
  const result: ExtractedScores = { semester1: EMPTY(), semester2: EMPTY() }

  try {
    const match = text.match(/\{[\s\S]*\}/)
    if (match) {
      const parsed = JSON.parse(match[0])
      const normalize = (raw: Record<string, any> | undefined) => {
        const base = EMPTY()
        if (!raw) return base
        for (const [aiKey, val] of Object.entries(raw)) {
          const subjectKey = SUBJECT_MAP[aiKey.toLowerCase()]
          if (subjectKey) {
            base[subjectKey] = (val !== null && val !== undefined) ? String(val) : ''
          }
        }
        return base
      }
      
      // Hỗ trợ cả key 'hoc_ky_1' (mới) và 'semester1' (cũ)
      const s1 = parsed.hoc_ky_1 || parsed.semester1
      const s2 = parsed.hoc_ky_2 || parsed.semester2
      
      if (s1 || s2) {
        return { 
          semester1: normalize(s1), 
          semester2: normalize(s2),
          source: 'ocr' 
        }
      }
    }
  } catch (e) {
    console.error('JSON parse error:', e)
  }

  // Fallback logic giữ nguyên cho các trường hợp không phải JSON
  const lines = text.split('\\n').map((l) => l.trim()).filter(Boolean)
  let currentSemester: 'semester1' | 'semester2' = 'semester1'
  let anyHit = false

  for (const line of lines) {
    const lower = line.toLowerCase()
    if (lower.includes('học kỳ 1') || lower.includes('hk1')) { currentSemester = 'semester1'; continue }
    if (lower.includes('học kỳ 2') || lower.includes('hk2')) { currentSemester = 'semester2'; continue }

    for (const [name, key] of Object.entries(SUBJECT_MAP)) {
      if (lower.includes(name)) {
        const scoreMatch = line.match(/(\\d+[.,]\\d+|\\d+)(?:\\s|$)/)
        if (scoreMatch) {
          result[currentSemester][key] = scoreMatch[1].replace(',', '.')
          anyHit = true
        }
        break
      }
    }
  }

  result.source = anyHit ? 'ocr' : 'empty'
  return result
}

// Demo scores used when upstream OCR is unreachable so the UX flow remains demo-able offline.
// Real values rotate a tiny bit per call so successive uploads feel fresh.
function demoScores(extracted: ExtractedScores): ExtractedScores {
  const jitter = (() => {
    const a = 0.3
    const b = 1.0
    return Math.round((Math.random() * (b - a) + a) * 10) / 10
  })()
  const fill = (): Record<SubjectKey, string> => ({
    math: (7.5 + jitter).toFixed(1),
    literature: (7.5 + jitter + 0.2).toFixed(1),
    english: (8.0 + jitter).toFixed(1),
    physics: (7.0 + jitter).toFixed(1),
    chemistry: (7.5 + jitter - 0.2).toFixed(1),
    biology: (7.8 + jitter).toFixed(1),
    history: (8.2 + jitter).toFixed(1),
    geography: (7.6 + jitter).toFixed(1),
    civic: (8.4 + jitter).toFixed(1),
  })
  if (extracted.semester1.math || extracted.semester2.math) {
    return { ...extracted, source: 'demo' }
  }
  return { semester1: fill(), semester2: fill(), source: 'demo' }
}

export class OcrServerError extends Error {
  status: number
  detail?: string
  constructor(status: number, detail?: string) {
    super(`OCR server error: ${status}${detail ? ` — ${detail.slice(0, 120)}` : ''}`)
    this.name = 'OcrServerError'
    this.status = status
    this.detail = detail
  }
}

export async function extractScoresFromImage(
  file: File,
  options: { allowDemoFallback?: boolean } = {}
): Promise<ExtractedScores> {
  const allowDemoFallback = options.allowDemoFallback ?? true

  // Convert to JPEG for better PaddleOCR compatibility
  let jpegBlob: Blob
  try {
    jpegBlob = await new Promise<Blob>((resolve, reject) => {
      const img = new Image()
      const url = URL.createObjectURL(file)
      img.onload = () => {
        const canvas = document.createElement('canvas')
        canvas.width = img.naturalWidth
        canvas.height = img.naturalHeight
        const ctx = canvas.getContext('2d')!
        ctx.fillStyle = '#ffffff'
        ctx.fillRect(0, 0, canvas.width, canvas.height)
        ctx.drawImage(img, 0, 0)
        URL.revokeObjectURL(url)
        canvas.toBlob(
          (blob) => blob ? resolve(blob) : reject(new Error('Canvas toBlob failed')),
          'image/jpeg', 0.95
        )
      }
      img.onerror = () => { URL.revokeObjectURL(url); reject(new Error('Image load failed')) }
      img.src = url
    })
  } catch (err) {
    throw err instanceof Error ? err : new Error('Không thể đọc ảnh')
  }

  const formData = new FormData()
  formData.append('file', jpegBlob, 'image.jpg')

  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), OCR_TIMEOUT_MS)

  let res: Response
  try {
    res = await fetch(OCR_ENDPOINT, {
      method: 'POST',
      headers: { 'ngrok-skip-browser-warning': 'true' },
      body: formData,
      signal: controller.signal,
    })
  } catch (err) {
    clearTimeout(timer)
    // Network / abort / proxy error — fall back to demo if allowed, else rethrow with friendly message.
    if (allowDemoFallback) {
      const parsed = demoScores({ semester1: EMPTY(), semester2: EMPTY() })
      ;(parsed as ExtractedScores & { _fallbackReason: string })._fallbackReason =
        err instanceof Error ? err.message : 'network_error'
      return parsed
    }
    throw new Error('Không thể kết nối tới máy chủ OCR. Vui lòng thử lại sau.')
  }
  clearTimeout(timer)

  if (!res.ok) {
    const errText = await res.text().catch(() => '')
    console.error('OCR server response:', errText)
    if (allowDemoFallback) {
      const parsed = demoScores({ semester1: EMPTY(), semester2: EMPTY() })
      ;(parsed as ExtractedScores & { _fallbackReason: string })._fallbackReason =
        `http_${res.status}`
      return parsed
    }
    throw new OcrServerError(res.status, errText)
  }

  let json: unknown
  try {
    json = await res.json()
  } catch {
    throw new Error('Phản hồi OCR không hợp lệ')
  }
  console.log('OCR raw response:', json)

  const raw = (json as { text?: unknown; result?: unknown; data?: unknown }).text
    ?? (json as { result?: unknown }).result
    ?? (json as { data?: unknown }).data
    ?? JSON.stringify(json)
  const text = typeof raw === 'string' ? raw : JSON.stringify(raw)

  const parsed = parseOcrText(text)
  parsed.source = parsed.source ?? 'ocr'
  return parsed
}
