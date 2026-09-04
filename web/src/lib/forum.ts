import { fetchApi, postApi } from './api'

export interface ForumCategory {
  id: string
  name: string
  slug: string
  displayOrder: number
}

export interface ForumThreadDto {
  id: string
  authorId: string
  authorName: string | null
  categoryId: string
  categoryName: string | null
  title: string
  content: string
  viewsCount: number
  likesCount: number
  isPinned: boolean
  isLocked: boolean
  createdAt: string
  replyCount: number
  isAdvicer: boolean
  likedByMe: boolean
}

export interface ForumPostDto {
  id: string
  threadId: string
  authorId: string
  authorName: string | null
  parentId: string | null
  content: string
  likesCount: number
  isOfficialReply: boolean
  createdAt: string
  isAdvicer: boolean
  likedByMe: boolean
}

export interface LikeResponse {
  postId: string
  liked: boolean
  likesCount: number
}

export interface ThreadLikeResponse {
  threadId: string
  liked: boolean
  likesCount: number
}

export interface CreateThreadRequest {
  categoryId: string
  title: string
  content: string
  isPinned?: boolean
}

export interface CreatePostRequest {
  threadId: string
  content: string
  parentId?: string
}

export async function getForumCategories(): Promise<ForumCategory[]> {
  return fetchApi<ForumCategory[]>('/forum-categories')
}

export async function getForumThreads(categoryId?: string): Promise<ForumThreadDto[]> {
  const query = categoryId ? `?categoryId=${encodeURIComponent(categoryId)}` : ''
  return fetchApi<ForumThreadDto[]>(`/forum-threads${query}`)
}

export async function getForumThread(id: string): Promise<ForumThreadDto> {
  return fetchApi<ForumThreadDto>(`/forum-threads/${id}`)
}

export async function registerForumView(id: string): Promise<ForumThreadDto> {
  return postApi<ForumThreadDto>(`/forum-threads/${id}/view`, {})
}

export async function toggleThreadLike(threadId: string): Promise<ThreadLikeResponse> {
  return postApi<ThreadLikeResponse>(`/forum-threads/${threadId}/like`, {})
}

export async function createForumThread(data: CreateThreadRequest): Promise<ForumThreadDto> {
  return postApi<ForumThreadDto>('/forum-threads', data)
}

export async function getForumPosts(threadId: string): Promise<ForumPostDto[]> {
  return fetchApi<ForumPostDto[]>(`/forum-posts?threadId=${encodeURIComponent(threadId)}`)
}

export async function createForumPost(data: CreatePostRequest): Promise<ForumPostDto> {
  return postApi<ForumPostDto>('/forum-posts', data)
}

export async function toggleLike(postId: string): Promise<LikeResponse> {
  return postApi<LikeResponse>(`/forum-posts/${postId}/like`, {})
}

export function formatForumDate(iso: string): string {
  const date = new Date(iso)
  if (Number.isNaN(date.getTime())) return ''
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const minutes = Math.floor(diffMs / 60000)
  if (minutes < 1) return 'Vừa xong'
  if (minutes < 60) return `${minutes} phút trước`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours} giờ trước`
  const days = Math.floor(hours / 24)
  if (days < 7) return `${days} ngày trước`
  return date.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' })
}
