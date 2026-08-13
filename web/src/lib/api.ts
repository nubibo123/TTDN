const LOCAL_API = 'http://localhost:8080/api'
export const API_BASE = import.meta.env.PROD ? '/api' : LOCAL_API

const TOKEN_KEY = 'admit_token'

export function getToken(): string | null {
  return localStorage.getItem(TOKEN_KEY)
}

export function setToken(token: string): void {
  localStorage.setItem(TOKEN_KEY, token)
}

export function clearToken(): void {
  localStorage.removeItem(TOKEN_KEY)
}

interface ApiResponse<T> {
  success: boolean
  message: string
  data: T | null
}

interface RequestOptions extends RequestInit {
  _isRetry?: boolean
  _skipAuth?: boolean
}

let refreshInFlight: Promise<string | null> | null = null
let refreshSubscribers: Array<(token: string | null) => void> = []
let authFailureListeners: Array<() => void> = []

async function callRefresh(): Promise<string | null> {
  try {
    const res = await fetch(`${API_BASE}/auth/refresh`, {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
    })
    if (!res.ok) return null
    const json: ApiResponse<{ token: string; userId: string; email: string; name: string }> = await res.json()
    if (!json.success || !json.data) return null
    return json.data.token
  } catch {
    return null
  }
}

function notifyRefreshSubscribers(token: string | null) {
  const subs = refreshSubscribers
  refreshSubscribers = []
  for (const cb of subs) cb(token)
}

function notifyAuthFailure() {
  const listeners = authFailureListeners
  authFailureListeners = []
  for (const cb of listeners) {
    try { cb() } catch { /* ignore listener errors */ }
  }
}

async function refreshAccessToken(): Promise<string | null> {
  if (refreshInFlight) return refreshInFlight

  refreshInFlight = (async () => {
    const token = await callRefresh()
    if (token) setToken(token)
    else clearToken()
    notifyRefreshSubscribers(token)
    return token
  })()

  try {
    return await refreshInFlight
  } finally {
    refreshInFlight = null
  }
}

export function onAuthFailure(cb: () => void): () => void {
  authFailureListeners.push(cb)
  return () => {
    authFailureListeners = authFailureListeners.filter((l) => l !== cb)
  }
}

function shouldSkipAuth(path: string): boolean {
  return path.startsWith('/auth/refresh') || path.startsWith('/auth/login') || path.startsWith('/auth/register')
}

export async function fetchApi<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const { _isRetry, _skipAuth, ...init } = options
  const token = getToken()
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(init.headers as Record<string, string>),
  }
  if (token && !_skipAuth) {
    headers['Authorization'] = `Bearer ${token}`
  }

  const fetchOpts: RequestInit = {
    ...init,
    headers,
    credentials: 'include',
  }

  let res = await fetch(`${API_BASE}${path}`, fetchOpts)

  // Auto-refresh on 401 or 403 (skip for auth endpoints to avoid loops)
  if ((res.status === 401 || res.status === 403) && !_isRetry && !shouldSkipAuth(path) && token) {
    const newToken = await refreshAccessToken()
    if (newToken) {
      headers['Authorization'] = `Bearer ${newToken}`
      res = await fetch(`${API_BASE}${path}`, {
        ...init,
        headers,
        credentials: 'include',
      })
    } else {
      // Refresh failed — broadcast auth failure for global cleanup
      clearToken()
      notifyAuthFailure()
    }
  }

  const text = await res.text()
  let json: ApiResponse<T>
  try {
    json = text ? JSON.parse(text) : { success: res.ok, message: res.statusText, data: null }
  } catch {
    if (!res.ok) {
      throw new Error(`HTTP ${res.status}: ${res.statusText || 'Yêu cầu không thành công'}`)
    }
    throw new Error('Phản hồi từ máy chủ không hợp lệ')
  }

  if (!res.ok || !json.success) {
    throw new Error(json.message || `HTTP ${res.status}`)
  }
  return json.data as T
}

export async function postApi<T>(path: string, body: unknown): Promise<T> {
  return fetchApi<T>(path, {
    method: 'POST',
    body: JSON.stringify(body),
  })
}

export async function putApi<T>(path: string, body: unknown): Promise<T> {
  return fetchApi<T>(path, {
    method: 'PUT',
    body: JSON.stringify(body),
  })
}

export async function deleteApi<T>(path: string): Promise<T> {
  return fetchApi<T>(path, { method: 'DELETE' })
}
