import { fetchApi, postApi, putApi } from './api'

export interface ConsultationDto {
  id: string
  studentId: string
  studentName?: string
  studentEmail?: string
  advisorId?: string
  advisorName?: string
  topic: string
  message: string
  mode: 'CHAT' | 'SCHEDULED_CALL'
  scheduledTime?: string
  contactPhone?: string
  status: 'PENDING' | 'ACCEPTED' | 'COMPLETED' | 'REJECTED'
  createdAt: string
}

export interface ConsultationMessageDto {
  id: string
  consultationId: string
  senderId: string
  senderName?: string
  senderRole: 'STUDENT' | 'ADVISOR'
  content: string
  isOfficial?: boolean
  createdAt: string
}

export interface CreateConsultationRequest {
  advisorId?: string
  topic: string
  message: string
  mode: 'CHAT' | 'SCHEDULED_CALL'
  scheduledTime?: string
  contactPhone?: string
}

export async function getMyConsultations(): Promise<ConsultationDto[]> {
  return fetchApi<ConsultationDto[]>('/consultations')
}

export async function getAdvisorConsultations(): Promise<ConsultationDto[]> {
  return fetchApi<ConsultationDto[]>('/consultations/advisor')
}

export async function getConsultationById(id: string): Promise<ConsultationDto> {
  return fetchApi<ConsultationDto>(`/consultations/${id}`)
}

export async function createConsultation(req: CreateConsultationRequest): Promise<ConsultationDto> {
  return postApi<ConsultationDto>('/consultations', req)
}

export async function updateConsultationStatus(
  id: string,
  status: 'ACCEPTED' | 'REJECTED' | 'COMPLETED'
): Promise<ConsultationDto> {
  return putApi<ConsultationDto>(`/consultations/${id}/status`, { status })
}

export async function getConsultationMessages(id: string): Promise<ConsultationMessageDto[]> {
  return fetchApi<ConsultationMessageDto[]>(`/consultations/${id}/messages`)
}

export async function sendConsultationMessage(
  id: string,
  content: string
): Promise<ConsultationMessageDto> {
  return postApi<ConsultationMessageDto>(`/consultations/${id}/messages`, { content })
}
