import { fetchApi, postApi } from './api'

export interface AuthResponse {
  token: string
  userId: string
  email: string
  name: string
}

export async function login(email: string, password: string): Promise<AuthResponse> {
  return postApi<AuthResponse>('/auth/login', { email, password })
}

export async function register(name: string, email: string, password: string): Promise<AuthResponse> {
  return postApi<AuthResponse>('/auth/register', { name, email, password })
}

export async function refresh(): Promise<AuthResponse | null> {
  try {
    return await fetchApi<AuthResponse>('/auth/refresh', { method: 'POST' })
  } catch {
    return null
  }
}

export async function logout(): Promise<void> {
  try {
    await fetchApi<string>('/auth/logout', { method: 'POST' })
  } catch {
    // best-effort — local clear happens in authContext regardless
  }
}
