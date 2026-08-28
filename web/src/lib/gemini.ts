import type { SubjectKey } from '@/pages/TranscriptPage'
import { createWorker } from 'tesseract.js'

const HAS_CUSTOM_ENDPOINT = Boolean(import.meta.env.VITE_OCR_ENDPOINT)
const OCR_ENDPOINT = (import.meta.env.VITE_OCR_ENDPOINT as string | undefined) ?? '/ocr-proxy/ocr'
const OCR_TIMEOUT_MS = 3_000

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
          return num >= 0 && num <= 10
        })

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

async function runGeminiApiOcr(file: File, apiKey: string): Promise<ExtractedScores | null> {
  try {
    const arrayBuffer = await file.arrayBuffer()
    const bytes = new Uint8Array(arrayBuffer)
    let binary = ''
    for (let i = 0; i < bytes.byteLength; i++) {
      binary += String.fromCharCode(bytes[i])
    }
    const base64Data = btoa(binary)

    const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{
          parts: [
            {
              text: `Read this high school transcript image and extract grades into JSON format with keys hoc_ky_1 and hoc_ky_2. Extract exact scores for subjects: toan, van, tieng_anh, vat_ly, hoa_hoc, sinh_hoc, lich_su, dia_ly, gdcd. Output ONLY JSON.`
            },
            {
              inline_data: {
                mime_type: file.type || 'image/jpeg',
                data: base64Data
              }
            }
          ]
        }]
      })
    })

    if (res.ok) {
      const data = await res.json()
      const text = data.candidates?.[0]?.content?.parts?.[0]?.text
      if (text) {
        const parsed = parseOcrText(text)
        if (parsed.source === 'ocr') return parsed
      }
    }
  } catch (err) {
    console.warn('Gemini API OCR error:', err)
  }
  return null
}

async function runClientOcr(file: File): Promise<ExtractedScores | null> {
  const geminiKey = (import.meta.env.VITE_GEMINI_API_KEY as string | undefined) ?? localStorage.getItem('gemini_api_key')
  if (geminiKey) {
    const geminiResult = await runGeminiApiOcr(file, geminiKey)
    if (geminiResult && geminiResult.source === 'ocr') {
      return geminiResult
    }
  }

  try {
    const worker = await createWorker('eng')
    const { data: { text } } = await worker.recognize(file)
    await worker.terminate()
    if (text) {
      const parsed = parseOcrText(text)
      if (parsed.source === 'ocr') {
        return parsed
      }
    }
  } catch (err) {
    console.warn('Client OCR recognition error:', err)
  }
  return null
}

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
    const clientOcr = await runClientOcr(file)
    if (clientOcr) return clientOcr
    if (allowDemoFallback) {
      return demoScores({ semester1: EMPTY(), semester2: EMPTY() })
    }
    throw err instanceof Error ? err : new Error('Không thể đọc ảnh')
  }

  if (!HAS_CUSTOM_ENDPOINT) {
    const clientOcr = await runClientOcr(file)
    if (clientOcr) return clientOcr
    if (allowDemoFallback) {
      return demoScores({ semester1: EMPTY(), semester2: EMPTY() })
    }
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
    const clientOcr = await runClientOcr(file)
    if (clientOcr) return clientOcr
    if (allowDemoFallback) {
      const parsed = demoScores({ semester1: EMPTY(), semester2: EMPTY() })
      ;(parsed as ExtractedScores & { _fallbackReason: string })._fallbackReason =
        err instanceof Error ? err.message : 'network_error'
      return parsed
    }
    throw new Error('Không thể kết nối tới máy chủ OCR. Vui lòng thử lại sau.')
  }
  clearTimeout(timer)

  if (!res || !res.ok) {
    const clientOcr = await runClientOcr(file)
    if (clientOcr) return clientOcr
    if (allowDemoFallback) {
      const parsed = demoScores({ semester1: EMPTY(), semester2: EMPTY() })
      ;(parsed as ExtractedScores & { _fallbackReason: string })._fallbackReason =
        `http_${res?.status}`
      return parsed
    }
    throw new OcrServerError(res?.status ?? 500, 'OCR endpoint unavailable')
  }

  let json: unknown
  try {
    json = await res.json()
  } catch {
    const clientOcr = await runClientOcr(file)
    if (clientOcr) return clientOcr
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
