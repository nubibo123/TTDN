export interface University {
  id: string
  code: string
  name: string
  year: number
  method: string
  majors: UniversityMajor[]
}

export interface UniversityMajor {
  id: string
  name: string
  code: string
  subjectGroup: string
  score: number
  note: string
  url: string
}

export interface StudentTranscript {
  semester1: SubjectScore
  semester2: SubjectScore
  graduationExam: GraduationExamScore
}

export interface SubjectScore {
  math: number | null
  literature: number | null
  english: number | null
  physics: number | null
  chemistry: number | null
  biology: number | null
  history: number | null
  geography: number | null
  civic: number | null
}

export interface GraduationExamScore {
  math: number | null
  literature: number | null
  english: number | null
  physics: number | null
  chemistry: number | null
  biology: number | null
  history: number | null
  geography: number | null
  civic: number | null
}

export interface ForumThread {
  id: string
  title: string
  author: string
  avatar: string
  category: string
  replies: number
  views: number
  lastReply: string
  isPinned: boolean
  isAdvicer: boolean
}

export interface ConsultationRequest {
  id: string
  studentName: string
  studentAvatar: string
  topic: string
  message: string
  status: 'pending' | 'accepted' | 'completed'
  date: string
}

export interface SystemStats {
  totalStudents: number
  totalUniversities: number
  totalConsultations: number
  totalPosts: number
}