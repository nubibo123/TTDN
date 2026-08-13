import { fetchApi, postApi, deleteApi } from './api'

export type TranscriptSemester =
  | 'HK1_L10'
  | 'HK2_L10'
  | 'HK1_L11'
  | 'HK2_L11'
  | 'HK1_L12'
  | 'HK2_L12'
  | 'GRADUATION_EXAM'

export interface TranscriptDto {
  id: string
  studentId: string
  semester: TranscriptSemester
  year: number
  scores: string
  avgScore: number | null
  isDraft: boolean
  imageUrl?: string | null
  ocrText?: string | null
  createdAt?: string
  updatedAt?: string
}

export interface SaveTranscriptRequest {
  semester: TranscriptSemester
  year: number
  scores: string
  avgScore?: number | null
  isDraft?: boolean
  imageUrl?: string | null
  ocrText?: string | null
}

export interface BatchSaveTranscriptRequest {
  transcripts: SaveTranscriptRequest[]
}

export async function getMyTranscripts(): Promise<TranscriptDto[]> {
  return fetchApi<TranscriptDto[]>('/transcripts/me')
}

export async function saveTranscript(request: SaveTranscriptRequest): Promise<TranscriptDto> {
  return postApi<TranscriptDto>('/transcripts', request)
}

export async function saveBatchTranscripts(transcripts: SaveTranscriptRequest[]): Promise<TranscriptDto[]> {
  return postApi<TranscriptDto[]>('/transcripts/batch', { transcripts })
}

export async function deleteTranscript(id: string): Promise<void> {
  return deleteApi<void>(`/transcripts/${id}`)
}
