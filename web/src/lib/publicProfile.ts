import { fetchApi } from './api'
import type { TranscriptDto } from './transcripts'

export interface PublicProfileDto {
  id: string
  name: string
  avatarUrl?: string | null
  graduationYear?: number | null
  province?: string | null
  gradesVisible: boolean
  transcripts: TranscriptDto[]
  role: 'STUDENT' | 'ADVISOR'
  title?: string | null
  bio?: string | null
  universityName?: string | null
  verified?: boolean
  universityId?: string | null
}

export function getPublicProfile(userId: string): Promise<PublicProfileDto> {
  return fetchApi<PublicProfileDto>(`/profile/users/${encodeURIComponent(userId)}`, { _skipAuth: true })
}