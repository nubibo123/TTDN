import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import { login as loginApi, register as registerApi, refresh as refreshApi, logout as logoutApi, type AuthResponse } from '../lib/auth'
import { clearToken, getToken, setToken, onAuthFailure } from '../lib/api'

interface AuthContextType {
  user: { userId: string; email: string; name: string } | null
  loading: boolean
  initializing: boolean
  login: (email: string, password: string) => Promise<void>
  register: (name: string, email: string, password: string) => Promise<void>
  logout: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | null>(null)

const USER_KEY = 'admit_user'

function persistUser(user: AuthResponse | null) {
  if (user) {
    localStorage.setItem(USER_KEY, JSON.stringify({
      userId: user.userId,
      email: user.email,
      name: user.name,
    }))
  } else {
    localStorage.removeItem(USER_KEY)
  }
}

function readPersistedUser() {
  const saved = localStorage.getItem(USER_KEY)
  return saved ? JSON.parse(saved) : null
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthContextType['user']>(null)
  const [loading, setLoading] = useState(false)
  const [initializing, setInitializing] = useState(true)

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      // Optimistic restore — show cached user immediately to avoid flicker
      const cached = readPersistedUser()
      if (cached) setUser(cached)

      // Validate session via cookie-based refresh
      try {
        const res = await refreshApi()
        if (cancelled) return
        if (res) {
          setUser({ userId: res.userId, email: res.email, name: res.name })
          persistUser(res)
        } else {
          // No valid session — clear everything
          setUser(null)
          persistUser(null)
          clearToken()
        }
      } catch {
        if (!cancelled) {
          setUser(null)
          persistUser(null)
          clearToken()
        }
      } finally {
        if (!cancelled) setInitializing(false)
      }
    })()
    return () => { cancelled = true }
  }, [])

  // Global auth-failure cleanup (refresh failed mid-session)
  useEffect(() => {
    return onAuthFailure(() => {
      setUser(null)
      persistUser(null)
    })
  }, [])

  const login = async (email: string, password: string) => {
    setLoading(true)
    try {
      const res = await loginApi(email, password)
      setToken(res.token)
      const userData = { userId: res.userId, email: res.email, name: res.name }
      persistUser(res)
      setUser(userData)
    } finally {
      setLoading(false)
    }
  }

  const register = async (name: string, email: string, password: string) => {
    setLoading(true)
    try {
      const res = await registerApi(name, email, password)
      setToken(res.token)
      const userData = { userId: res.userId, email: res.email, name: res.name }
      persistUser(res)
      setUser(userData)
    } finally {
      setLoading(false)
    }
  }

  const logout = async () => {
    setLoading(true)
    try {
      await logoutApi()
    } finally {
      clearToken()
      persistUser(null)
      setUser(null)
      setLoading(false)
    }
  }

  return (
    <AuthContext.Provider value={{ user, loading, initializing, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
