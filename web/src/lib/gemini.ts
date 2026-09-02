import type { SubjectKey } from '@/pages/TranscriptPage'

const OCR_ENDPOINT = '/ocr-proxy/ocr'
const OCR_TIMEOUT_MS = 180_000

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

// Map các tên môn tiếng Việt -> SubjectKey
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

function normalizeScore(value: unknown): string {
  if (value === null || value === undefined || value === '' || value === '-') return ''

  const score = Number(String(value).trim().replace(',', '.'))
  if (!Number.isFinite(score) || score < 0 || score > 100) return ''

  if (score > 10) return (score / 10).toFixed(1)
  return String(value).trim().replace(',', '.')
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
            base[subjectKey] = normalizeScore(val)
          }
        }
        return base
      }
      
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
  } catch {
    // Ignore JSON error for plain OCR text
  }

  const lines = text.split('\n').map((l) => l.trim()).filter(Boolean)
  let currentSemester: 'semester1' | 'semester2' = 'semester1'
  let anyHit = false

  for (const line of lines) {
    const lower = line.toLowerCase()
    if (lower.includes('học kỳ 1') || lower.includes('hk1')) { currentSemester = 'semester1'; continue }
    if (lower.includes('học kỳ 2') || lower.includes('hk2')) { currentSemester = 'semester2'; continue }

    for (const [name, key] of Object.entries(SUBJECT_MAP)) {
      if (lower.includes(name)) {
        // Sanitize spaces around decimals (e.g., "9 . 5" or "9 , 5" -> "9.5")
        const cleanLine = line.replace(/(\d+)\s*[.,]\s*(\d+)/g, '$1.$2')
        const rawMatches = [...cleanLine.matchAll(/(\d+[.,]\d+|\d+)/g)].map((m) => m[1].replace(',', '.'))
        const subjectIndexInLine = lower.indexOf(name)

        // Filter out STT row index numbers (e.g., "1 Toán 9.5 9.0" -> drop "1")
        const matches = rawMatches.filter((val, idx) => {
          const num = parseFloat(val)
          if (isNaN(num)) return false

          if (idx === 0 && rawMatches.length > 1 && Number.isInteger(num) && num >= 1 && num <= 9) {
            const numIndexInLine = cleanLine.indexOf(val)
            if (numIndexInLine < subjectIndexInLine) {
              return false
            }
          }
          return Boolean(normalizeScore(val))
        }).map(normalizeScore)

        if (matches.length >= 2) {
          result.semester1[key] = matches[0]
          result.semester2[key] = matches[1]
          anyHit = true
        } else if (matches.length === 1) {
          result[currentSemester][key] = matches[0]
          anyHit = true
        }
        break
      }
    }
  }

  result.source = anyHit ? 'ocr' : 'empty'
  return result
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
  file: File
): Promise<ExtractedScores> {
  let jpegBlob: Blob
  try {
    jpegBlob = await new Promise<Blob>((resolve, reject) => {
      const img = new Image()
      const url = URL.createObjectURL(file)
      const imgTimer = setTimeout(() => {
        URL.revokeObjectURL(url)
        reject(new Error('Image load timeout'))
      }, 3000)
      img.onload = () => {
        clearTimeout(imgTimer)
        const canvas = document.createElement('canvas')
        const scale = 2
        canvas.width = (img.naturalWidth || 800) * scale
        canvas.height = (img.naturalHeight || 600) * scale
        const ctx = canvas.getContext('2d')!
        ctx.fillStyle = '#ffffff'
        ctx.fillRect(0, 0, canvas.width, canvas.height)
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height)

        // Binarize image to make text ultra crisp for Tesseract OCR
        const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height)
        const d = imgData.data
        for (let i = 0; i < d.length; i += 4) {
          const avg = d[i] * 0.299 + d[i + 1] * 0.587 + d[i + 2] * 0.114
          const v = avg < 165 ? 0 : 255
          d[i] = v
          d[i + 1] = v
          d[i + 2] = v
        }
        ctx.putImageData(imgData, 0, 0)

        URL.revokeObjectURL(url)
        canvas.toBlob(
          (blob) => blob ? resolve(blob) : reject(new Error('Canvas toBlob failed')),
          'image/jpeg', 0.95
        )
      }
      img.onerror = () => {
        clearTimeout(imgTimer)
        URL.revokeObjectURL(url)
        reject(new Error('Image load failed'))
      }
      img.src = url
    })
  } catch (err) {
    throw err instanceof Error ? err : new Error('Không thể đọc ảnh')
  }

  const formData = new FormData()
  formData.append('file', jpegBlob, 'image.jpg')

  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), OCR_TIMEOUT_MS)

  let res: Response | null = null
  try {
    res = await fetch(OCR_ENDPOINT, {
      method: 'POST',
      headers: { 'ngrok-skip-browser-warning': 'true' },
      body: formData,
      signal: controller.signal,
    })
  } catch (err) {
    clearTimeout(timer)
    throw new Error('Không thể kết nối tới máy chủ OCR. Vui lòng thử lại sau.')
  }
  clearTimeout(timer)

  if (!res || !res.ok) {
    throw new OcrServerError(res?.status ?? 500, 'OCR endpoint unavailable')
  }

  let json: unknown
  try {
    json = await res.json()
  } catch {
    throw new Error('Phản hồi OCR không hợp lệ')
  }

  const raw = (json as { text?: unknown; result?: unknown; data?: unknown }).text
    ?? (json as { result?: unknown }).result
    ?? (json as { data?: unknown }).data
    ?? JSON.stringify(json)
  const text = typeof raw === 'string' ? raw : JSON.stringify(raw)

  const parsed = parseOcrText(text)
  parsed.source = parsed.source ?? 'ocr'
  return parsed
}
