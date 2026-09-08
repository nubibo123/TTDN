import { fetchApi, postApi, putApi, deleteApi } from './api'

export interface AdminStats {
  totalUsers: number
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
  const stats = await fetchApi<Partial<AdminStats>>('/admin/stats')
  return {
    totalUsers: stats.totalUsers ?? stats.totalStudents ?? 0,
    totalStudents: stats.totalStudents ?? 0,
    totalUniversities: stats.totalUniversities ?? 0,
    totalConsultations: stats.totalConsultations ?? 0,
    totalPosts: stats.totalPosts ?? 0,
    pendingAdvisors: stats.pendingAdvisors ?? 0,
  }
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

export async function deleteAdminForumPost(id: string, banAuthor = false): Promise<string> {
  return deleteApi<string>(`/admin/forum-posts/${encodeURIComponent(id)}${banAuthor ? "?banAuthor=true" : ""}`)
}

export async function getPendingAdvisors(): Promise<AdminAdvisor[]> {
  return fetchApi<AdminAdvisor[]>('/admin/advisors/pending')
}

export async function verifyAdvisor(id: string, verified: boolean): Promise<AdminAdvisor> {
  return putApi<AdminAdvisor>(`/admin/advisors/${id}/verify`, { verified })
}

/** Reject a pending advisor: removes their ADVISOR role + profile (the user account is kept). */
export async function rejectAdminAdvisor(id: string): Promise<string> {
  return deleteApi<string>(`/admin/advisors/${id}`)
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

export interface AdminCreateUserRequest {
  name: string
  email: string
  password: string
  role?: 'ADVISOR' | 'ADMIN'
  universityId?: string | null
  title?: string
  bio?: string
}

export interface AdminCreatedAccount {
  token: string | null
  userId: string
  email: string
  name: string
  roles: string[]
}

/** Create a new account (typically an ADVISOR) from the admin panel. */
export async function createAdminUser(data: AdminCreateUserRequest): Promise<AdminCreatedAccount> {
  return postApi<AdminCreatedAccount>('/admin/users', data)
}

/** Activate / deactivate a user account. */
export async function updateAdminUserStatus(userId: string, isActive: boolean): Promise<AdminUser> {
  return putApi<AdminUser>(`/admin/users/${userId}/status`, { isActive })
}

export async function moderateAdminComment(id: string): Promise<import('./forumThreadService').ModerationResult> {
  return postApi(`/admin/forum-posts/${encodeURIComponent(id)}/moderate`, {})
}
