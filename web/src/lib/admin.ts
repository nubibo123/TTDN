import { fetchApi, postApi, putApi, deleteApi } from './api'

export interface AdminStats {
  totalStudents: number
  totalUniversities: number
  totalConsultations: number
  totalPosts: number
  pendingAdvisors: number
}

export interface AdminUser {
  id: string
  name: string
  email: string
  isActive: boolean
  roles: string[]
  createdAt: string
}

export interface AdminConsultation {
  id: string
  studentId: string
  studentName: string | null
  advisorId: string | null
  advisorTitle: string | null
  topic: string
  message: string
  status: string
  createdAt: string
}

export interface AdminForumPost {
  id: string
  threadId: string
  threadTitle: string | null
  authorId: string
  authorName: string | null
  content: string
  isDeleted: boolean
  createdAt: string
}

export interface AdminAdvisor {
  id: string
  name: string | null
  email: string | null
  university: string | null
  title: string | null
  bio: string | null
}

export async function getAdminStats(): Promise<AdminStats> {
  return fetchApi<AdminStats>('/admin/stats')
}

export async function getAdminUsers(): Promise<AdminUser[]> {
  return fetchApi<AdminUser[]>('/admin/users')
}

export async function updateAdminUserRoles(userId: string, roles: string[]): Promise<AdminUser> {
  return putApi<AdminUser>(`/admin/users/${userId}/roles`, { roles })
}

export async function getAdminConsultations(): Promise<AdminConsultation[]> {
  return fetchApi<AdminConsultation[]>('/admin/consultations')
}

export async function updateAdminConsultationStatus(id: string, status: string): Promise<AdminConsultation> {
  return putApi<AdminConsultation>(`/admin/consultations/${id}/status`, { status })
}

export async function getAdminForumPosts(): Promise<AdminForumPost[]> {
  return fetchApi<AdminForumPost[]>('/admin/forum-posts')
}

export async function deleteAdminForumPost(id: string): Promise<string> {
  return deleteApi<string>(`/admin/forum-posts/${id}`)
}

export async function getPendingAdvisors(): Promise<AdminAdvisor[]> {
  return fetchApi<AdminAdvisor[]>('/admin/advisors/pending')
}

export async function verifyAdvisor(id: string, verified: boolean): Promise<AdminAdvisor> {
  return putApi<AdminAdvisor>(`/admin/advisors/${id}/verify`, { verified })
}

export interface AuthMeResponse {
  id: string
  name: string
  email: string
  avatarUrl: string | null
  roles: string[]
}

export async function getAuthMe(): Promise<AuthMeResponse> {
  return fetchApi<AuthMeResponse>('/auth/me')
}

export interface AcademicYear {
  id: string
  year: string
  isActive: boolean
  createdAt: string
}

export async function getAcademicYears(): Promise<AcademicYear[]> {
  return fetchApi<AcademicYear[]>('/admin/academic-years')
}

export async function createAcademicYear(year: string, isActive?: boolean): Promise<AcademicYear> {
  return postApi<AcademicYear>('/admin/academic-years', { year, isActive })
}

export async function updateAcademicYear(id: string, year: string, isActive?: boolean): Promise<AcademicYear> {
  return putApi<AcademicYear>(`/admin/academic-years/${id}`, { year, isActive })
}

export async function deleteAcademicYear(id: string): Promise<string> {
  return deleteApi<string>(`/admin/academic-years/${id}`)
}

export interface SystemSetting {
  key: string
  value: string
}

export async function getSystemSettings(): Promise<Record<string, string>> {
  return fetchApi<Record<string, string>>('/admin/settings')
}

export async function updateSystemSetting(key: string, value: string): Promise<SystemSetting> {
  return putApi<SystemSetting>(`/admin/settings/${key}`, { value })
}

export interface RegisterAdvisorRequest {
  name: string
  email: string
  password: string
  universityId: string
  title: string
  bio: string
}

export interface RegisterAdvisorResponse {
  id: string
  name: string
  email: string
  universityId: string
  title: string
  bio: string
}

export async function registerAdvisor(data: RegisterAdvisorRequest): Promise<RegisterAdvisorResponse> {
  return postApi<RegisterAdvisorResponse>('/advisors/register', data)
}

