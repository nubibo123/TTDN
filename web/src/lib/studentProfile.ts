import { fetchApi, putApi } from './api'

export interface StudentProfileDto {
  id: string
  userId: string
  graduationYear: number | null
  province: string | null
  avatarUrl: string | null
  isProfilePublic: boolean
  showGrades: boolean
  allowContact: boolean
  showInForum: boolean
}

export interface UpdateStudentProfileRequest {
  graduationYear?: number | null
  province?: string | null
  isProfilePublic?: boolean
  showGrades?: boolean
  allowContact?: boolean
  showInForum?: boolean
}

export async function getMyStudentProfile(): Promise<StudentProfileDto> {
  return fetchApi<StudentProfileDto>('/student-profile/me')
}

export async function updateMyStudentProfile(data: UpdateStudentProfileRequest): Promise<StudentProfileDto> {
  return putApi<StudentProfileDto>('/student-profile/me', data)
}
