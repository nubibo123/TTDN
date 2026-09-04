import { fetchApi, putApi } from './api'

export interface AdvisorDto {
  id: string
  name: string
  email: string
  universityId: string | null
  universityName: string | null
  title: string | null
  bio: string | null
  verified: boolean
}

export interface UpdateAdvisorRequest {
  universityId?: string
  title?: string
  bio?: string
}

export async function getMyAdvisorProfile(): Promise<AdvisorDto | null> {
  return fetchApi<AdvisorDto | null>('/advisors/me')
}

export async function getAdvisors(universityId?: string): Promise<AdvisorDto[]> {
  const query = universityId ? `?universityId=${encodeURIComponent(universityId)}` : ''
  return fetchApi<AdvisorDto[]>(`/advisors${query}`)
}

export async function updateMyAdvisorProfile(data: UpdateAdvisorRequest): Promise<AdvisorDto> {
  return putApi<AdvisorDto>('/advisors/me', data)
}
