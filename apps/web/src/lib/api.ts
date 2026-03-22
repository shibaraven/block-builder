import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export interface AuthUser {
  id: string
  email: string
  name: string
  avatar?: string
}

interface AuthStore {
  user: AuthUser | null
  token: string | null
  loading: boolean
  setUser: (user: AuthUser | null) => void
  setToken: (token: string | null) => void
  setLoading: (v: boolean) => void
  logout: () => void
  isLoggedIn: () => boolean
}

export const useAuthStore = create<AuthStore>()(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      loading: false,
      setUser: (user) => set({ user }),
      setToken: (token) => set({ token }),
      setLoading: (loading) => set({ loading }),
      logout: () => {
        set({ user: null, token: null })
        fetch(`${API_BASE}/auth/logout`, { method: 'POST', credentials: 'include' }).catch(() => {})
      },
      isLoggedIn: () => !!get().token && !!get().user,
    }),
    { name: 'bb-auth', partialize: (s) => ({ token: s.token, user: s.user }) }
  )
)

// ─── API client ───────────────────────────────────────────────────────
export const API_BASE = import.meta.env.VITE_API_URL ?? 'http://localhost:3001'

export async function apiRequest<T>(
  path: string,
  options: RequestInit = {}
): Promise<{ success: boolean; data?: T; error?: string }> {
  const token = useAuthStore.getState().token
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string> ?? {}),
  }
  if (token) headers['Authorization'] = `Bearer ${token}`

  try {
    const res = await fetch(`${API_BASE}${path}`, { ...options, headers, credentials: 'include' })
    const json = await res.json()
    if (res.status === 401) {
      useAuthStore.getState().logout()
    }
    return json
  } catch (e) {
    return { success: false, error: (e as Error).message }
  }
}

// ─── Project API ──────────────────────────────────────────────────────
export const projectApi = {
  list: () => apiRequest<any[]>('/api/projects'),
  get: (id: string) => apiRequest<any>(`/api/projects/${id}`),
  getByShare: (token: string) => apiRequest<any>(`/api/projects/share/${token}`),
  create: (data: any) => apiRequest<any>('/api/projects', { method: 'POST', body: JSON.stringify(data) }),
  update: (id: string, data: any) => apiRequest<any>(`/api/projects/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  delete: (id: string) => apiRequest<void>(`/api/projects/${id}`, { method: 'DELETE' }),
  duplicate: (id: string) => apiRequest<any>(`/api/projects/${id}/duplicate`, { method: 'POST' }),
  share: (id: string) => apiRequest<{ shareToken: string; shareUrl: string }>(`/api/projects/${id}/share`, { method: 'POST' }),
  unshare: (id: string) => apiRequest<void>(`/api/projects/${id}/share`, { method: 'DELETE' }),
}

// ─── Auth helpers ─────────────────────────────────────────────────────
export function initiateGithubLogin() {
  window.location.href = `${API_BASE}/auth/github`
}

export async function fetchCurrentUser(): Promise<AuthUser | null> {
  const res = await apiRequest<AuthUser>('/auth/me')
  if (res.success && res.data) {
    useAuthStore.getState().setUser(res.data)
    return res.data
  }
  return null
}

// Handle OAuth callback (token in URL params)
export function handleOAuthCallback() {
  const params = new URLSearchParams(window.location.search)
  const token = params.get('token')
  const success = params.get('auth_success')
  const error = params.get('auth_error')

  if (token && success) {
    useAuthStore.getState().setToken(token)
    fetchCurrentUser()
    // Clean URL
    window.history.replaceState({}, '', window.location.pathname)
    return true
  }

  if (error) {
    console.error('[Auth] OAuth error:', error)
    window.history.replaceState({}, '', window.location.pathname)
  }
  return false
}
