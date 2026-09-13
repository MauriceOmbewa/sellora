import React, { createContext, useContext, useState, useCallback, useEffect } from 'react'
import type { User, Business, AuthState } from '@/types'
import { tokenStorage, api } from '@/services/api'
import { businessService } from '@/services/businessService'

const API_BASE = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:8000'

// ── Auth context type ─────────────────────────────────────────────────────────

interface AuthContextType {
  user: User | null
  authState: AuthState
  businesses: Business[]
  currentBusiness: Business | null
  initiateGoogleSignIn: () => void
  signOut: () => Promise<void>
  setCurrentBusiness: (business: Business) => void
  refreshBusinesses: () => Promise<void>
  handleAuthCallback: (access: string, refresh: string) => Promise<void>
}

const AuthContext = createContext<AuthContextType | null>(null)

const USER_KEY     = 'sellora_user'
const BUSINESS_KEY = 'sellora_current_business'

// ── Backend /me response ──────────────────────────────────────────────────────

interface MeResponse {
  success: boolean
  data: {
    id: string
    email: string
    name: string
    avatar?: string
    is_staff: boolean
    created_at: string
  }
}

function mapUser(raw: MeResponse['data']): User {
  return {
    id: raw.id,
    googleId: raw.id,
    name: raw.name,
    email: raw.email,
    avatar: raw.avatar,
    createdAt: raw.created_at,
  }
}

// ── Provider ──────────────────────────────────────────────────────────────────

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [authState, setAuthState] = useState<AuthState>('loading')
  const [businesses, setBusinesses] = useState<Business[]>([])
  const [currentBusiness, setCurrentBusinessState] = useState<Business | null>(null)

  // ── Load businesses ───────────────────────────────────────────────────────

  const loadBusinesses = useCallback(async (selectId?: string) => {
    try {
      const list = await businessService.getAll()
      setBusinesses(list)

      if (list.length === 0) {
        setAuthState('needs-onboarding')
        return
      }

      if (selectId) {
        const found = list.find(b => b.id === selectId)
        if (found) setCurrentBusinessState(found)
      }

      setAuthState('authenticated')
    } catch {
      // Still authenticated, just no businesses loaded — show empty state
      setAuthState('authenticated')
    }
  }, [])

  // ── Restore session on mount ──────────────────────────────────────────────

  useEffect(() => {
    const access = tokenStorage.getAccess()
    if (!access) {
      setAuthState('unauthenticated')
      return
    }

    // Restore cached user instantly, then verify with /me
    const cached = localStorage.getItem(USER_KEY)
    if (cached) {
      try { setUser(JSON.parse(cached) as User) } catch { /* ignore */ }
    }

    api.get<MeResponse>('/api/v1/auth/me/')
      .then(res => {
        const u = mapUser(res.data)
        setUser(u)
        localStorage.setItem(USER_KEY, JSON.stringify(u))
        return loadBusinesses(localStorage.getItem(BUSINESS_KEY) ?? undefined)
      })
      .catch(() => {
        tokenStorage.clear()
        localStorage.removeItem(USER_KEY)
        localStorage.removeItem(BUSINESS_KEY)
        setUser(null)
        setAuthState('unauthenticated')
      })
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // ── Handle OAuth callback tokens ──────────────────────────────────────────

  const handleAuthCallback = useCallback(async (access: string, refresh: string) => {
    tokenStorage.setTokens(access, refresh)
    try {
      const res = await api.get<MeResponse>('/api/v1/auth/me/')
      const u = mapUser(res.data)
      setUser(u)
      localStorage.setItem(USER_KEY, JSON.stringify(u))
      await loadBusinesses()
    } catch {
      tokenStorage.clear()
      setAuthState('unauthenticated')
      throw new Error('Failed to complete sign-in. Please try again.')
    }
  }, [loadBusinesses])

  // ── Initiate Google sign-in ───────────────────────────────────────────────

  const initiateGoogleSignIn = useCallback(() => {
    window.location.href = `${API_BASE}/api/v1/auth/google/?next=web`
  }, [])

  // ── Sign out ──────────────────────────────────────────────────────────────

  const signOut = useCallback(async () => {
    const refresh = tokenStorage.getRefresh()
    try {
      if (refresh) await api.post('/api/v1/auth/signout/', { refresh })
    } catch { /* token may already be expired */ }
    finally {
      tokenStorage.clear()
      localStorage.removeItem(USER_KEY)
      localStorage.removeItem(BUSINESS_KEY)
      setUser(null)
      setBusinesses([])
      setCurrentBusinessState(null)
      setAuthState('unauthenticated')
    }
  }, [])

  // ── Set / refresh businesses ──────────────────────────────────────────────

  const setCurrentBusiness = useCallback((biz: Business) => {
    setCurrentBusinessState(biz)
    localStorage.setItem(BUSINESS_KEY, biz.id)
  }, [])

  const refreshBusinesses = useCallback(async () => {
    await loadBusinesses(currentBusiness?.id)
  }, [loadBusinesses, currentBusiness?.id])

  return (
    <AuthContext.Provider value={{
      user, authState, businesses, currentBusiness,
      initiateGoogleSignIn, signOut,
      setCurrentBusiness, refreshBusinesses, handleAuthCallback,
    }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be inside AuthProvider')
  return ctx
}
