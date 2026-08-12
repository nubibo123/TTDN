import { fetchApi } from './api'

export interface MatchResult {
  universityId: string
  universityName: string
  universityCode: string
  region: string
  type: string
  majorId: string
  majorName: string
  majorCode: string
  subjectGroup: string
  year: number
  cutoffScore: number
  userScore: number
  likelihood: 'high' | 'medium' | 'low' | 'very_low' | 'unknown'
}

export interface MatchRequest {
  math?: number
  physics?: number
  chemistry?: number
  literature?: number
  english?: number
  biology?: number
  method?: string
  year?: number
  tolerance?: number
  subjectGroup?: string
}

export async function postMatch(req: MatchRequest): Promise<MatchResult[]> {
  return fetchApi<MatchResult[]>('/match', { method: 'POST', body: JSON.stringify(req) })
}

export interface University {
  id: string
  code: string
  name: string
  region: 'NORTH' | 'CENTRAL' | 'SOUTH'
  type: 'PUBLIC' | 'PRIVATE' | 'NATIONAL' | 'INTERNATIONAL'
  address?: string
  websiteUrl?: string
  tuitionRange?: string
  isVerified: boolean
  deanUrl?: string
  latitude?: number
  longitude?: number
}

export async function getUniversities(): Promise<University[]> {
  return fetchApi<University[]>('/universities')
}

export async function getUniversityById(id: string): Promise<University> {
  return fetchApi<University>(`/universities/${id}`)
}

export async function getUniversityByCode(code: string): Promise<University> {
  return fetchApi<University>(`/universities/code/${code}`)
}

export interface Major {
  id: string
  universityId: string
  universityName: string
  code: string
  name: string
  subjectGroup: string
  description?: string
  tuitionMin?: number
  tuitionMax?: number
  careerPaths: string[]
  isActive: boolean
  categoryId?: string
  categoryName?: string
}

export async function getMajors(universityId?: string, subjectGroup?: string): Promise<Major[]> {
  const params = new URLSearchParams()
  if (universityId) params.set('universityId', universityId)
  if (subjectGroup) params.set('subjectGroup', subjectGroup)
  const query = params.toString()
  return fetchApi<Major[]>(`/majors${query ? `?${query}` : ''}`)
}

export async function getMajorById(id: string): Promise<Major> {
  return fetchApi<Major>(`/majors/${id}`)
}

export interface AdmissionScore {
  id: string
  majorId: string
  majorName: string
  universityId: string
  universityName: string
  year: number
  method: string
  score: number
  note?: string
  url?: string
}

export async function getAdmissionScores(
  majorId?: string,
  year?: number,
  universityId?: string
): Promise<AdmissionScore[]> {
  const params = new URLSearchParams()
  if (majorId) params.set('majorId', majorId)
  if (universityId) params.set('universityId', universityId)
  if (year) params.set('year', year.toString())
  const query = params.toString()
  return fetchApi<AdmissionScore[]>(`/admission-scores${query ? `?${query}` : ''}`)
}