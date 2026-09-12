/**
 * AuthContext — real Google SSO integration
 *
 * Flow:
 *   1. User clicks "Continue with Google"
 *   2. Browser navigates to GET /api/v1/auth/google/?next=web
 *   3. Google sign-in happens server-side
 *   4. Backend redirects to: /businesses?access=TOKEN&refresh=TOKEN
 *   5. MyBusinessesPage (or the callback route) reads tokens from URL, stores them,
 *      calls GET /api/v1/auth/me/ to hydrate the user, then loads businesses.
 *
 * Token refresh is handled automatically by the api.ts client (single-flight).
 */

import React, {
  createContext, useContext, useState, useCallback, useEffect,
} from 'react'
import type { User, Business, AuthState } from '@/types'
import { tokenStorage, api, ApiError } from '@/services/api'

const API_BASE = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:8000'

// ── Types ─────────────────────────────────────────────────────────────────────

interface AuthContextType {
  user: User | null
  authState: AuthState
  businesses: Business[]
  currentBusiness: Business | null
  initiateGoogleSignIn: () => void
  signOut: () => Promise<void>
  setCurrentBusiness: (business: Business) => void
  refreshBusinesses: () => Promise<void>
  /** Called by the /businesses page after tokens land in the URL */
  handleAuthCallback: (access: string, refresh: string) => Promise<void>
}

// ── Context ───────────────────────────────────────────────────────────────────

const AuthContext = createContext<AuthContextType | null>(null)

const USER_KEY = 'sellora_user'
const BUSINESS_KEY = 'sellora_current_business'

// ── Backend response shapes ───────────────────────────────────────────────────

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

interface BusinessesResponse {
  success: boolean
  results: Array<{
    id: string
    name: string
    slug: string
    category: string
    description: string
    motto: string
    logo?: string
    status: string
    plan: string
    theme: {
      primaryColor: string
      primaryHover: string
      accentColor: string
      backgroundColor: string
      textColor: string
    }
    contact: {
      phone: string
      whatsapp: string
      email: string
      address: string
      city: string
      country: string
      openingHours: string
    }
    social_links: {
      instagram?: string
      facebook?: string
      tiktok?: string
      twitter?: string
      youtube?: string
    }
    hero: {
      heading: string
      subheading: string
      ctaText: string
      ctaSecondaryText: string
    }
    about_text: string
    total_products: number
    total_orders: number
    total_revenue: number
    total_customers: number
    created_at: string
    updated_at: string
  }>
}

// ── Mappers — backend snake_case → frontend camelCase ─────────────────────────

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

function mapBusiness(raw: BusinessesResponse['results'][number]): Business {
  return {
    id: raw.id,
    slug: raw.slug,
    name: raw.name,
    category: raw.category as Business['category'],
    description: raw.description,
    motto: raw.motto,
    logo: raw.logo,
    theme: raw.theme,
    contact: raw.contact,
    socialLinks: {
      instagram: raw.social_links?.instagram,
      facebook: raw.social_links?.facebook,
      tiktok: raw.social_links?.tiktok,
      twitter: raw.social_links?.twitter,
      youtube: raw.social_links?.youtube,
    },
    hero: raw.hero,
    aboutText: raw.about_text,
    status: raw.status as Business['status'],
    plan: raw.plan as Business['plan'],
    ownerId: '',
    createdAt: raw.created_at,
    updatedAt: raw.updated_at,
    totalProducts: raw.total_products ?? 0,
    totalOrders: raw.total_orders ?? 0,
    totalRevenue: raw.total_revenue ?? 0,
    totalCustomers: raw.total_customers ?? 0,
  }
}

// ── Provider ──────────────────────────────────────────────────────────────────

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [authState, setAuthState] = useState<AuthState>('loading')
  const [businesses, setBusinesses] = useState<Business[]>([])
  const [currentBusiness, setCurrentBusinessState] = useState<Business | null>(null)

  // ── Restore session on mount ──────────────────────────────────────────────

  useEffect(() => {
    const access = tokenStorage.getAccess()
    const storedUser = localStorage.getItem(USER_KEY)

    if (!access) {
      setAuthState('unauthenticated')
      return
    }

    // We have a token — restore user from cache first (instant), then verify
    if (storedUser) {
      try {
        setUser(JSON.parse(storedUser) as User)
      } catch {
        // ignore parse errors
      }
    }

    // Verify token is still valid by calling /me
    api.get<MeResponse>('/api/v1/auth/me/')
      .then(res => {
        const mappedUser = mapUser(res.data)
        setUser(mappedUser)
        localStorage.setItem(USER_KEY, JSON.stringify(mappedUser))

        // Restore previously selected business
        const storedBizId = localStorage.getItem(BUSINESS_KEY)
        return loadBusinesses(storedBizId ?? undefined)
      })
      .catch(() => {
        // Token invalid / expired and refresh failed
        tokenStorage.clear()
        localStorage.removeItem(USER_KEY)
        localStorage.removeItem(BUSINESS_KEY)
        setUser(null)
        setAuthState('unauthenticated')
      })
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // ── Load businesses helper ────────────────────────────────────────────────

  const loadBusinesses = useCallback(async (selectId?: string) => {
    try {
      const res = await api.get<BusinessesResponse>('/api/v1/businesses/')
      const mapped = res.results.map(mapBusiness)
      setBusinesses(mapped)

      if (mapped.length === 0) {
        setAuthState('needs-onboarding')
        return
      }

      // Restore previously selected business if it still exists
      if (selectId) {
        const found = mapped.find(b => b.id === selectId)
        if (found) setCurrentBusinessState(found)
      }

      setAuthState('authenticated')
    } catch {
      setAuthState('authenticated') // still authenticated, just no businesses
    }
  }, [])

  // ── Handle auth callback (called from /businesses after URL tokens) ────────

  const handleAuthCallback = useCallback(async (access: string, refresh: string) => {
    tokenStorage.setTokens(access, refresh)
    try {
      const res = await api.get<MeResponse>('/api/v1/auth/me/')
      const mappedUser = mapUser(res.data)
      setUser(mappedUser)
      localStorage.setItem(USER_KEY, JSON.stringify(mappedUser))
      await loadBusinesses()
    } catch {
      tokenStorage.clear()
      setAuthState('unauthenticated')
      throw new Error('Failed to complete sign-in')
    }
  }, [loadBusinesses])

  // ── Initiate Google sign-in ───────────────────────────────────────────────

  const initiateGoogleSignIn = useCallback(() => {
    // Full browser navigation — the backend handles the OAuth redirect chain
    window.location.href = `${API_BASE}/api/v1/auth/google/?next=web`
  }, [])

  // ── Sign out ──────────────────────────────────────────────────────────────

  const signOut = useCallback(async () => {
    const refresh = tokenStorage.getRefresh()
    try {
      if (refresh) {
        await api.post('/api/v1/auth/signout/', { refresh })
      }
    } catch {
      // Blacklisting may fail if token already expired — still clear locally
    } finally {
      tokenStorage.clear()
      localStorage.removeItem(USER_KEY)
      localStorage.removeItem(BUSINESS_KEY)
      setUser(null)
      setBusinesses([])
      setCurrentBusinessState(null)
      setAuthState('unauthenticated')
    }
  }, [])

  // ── Set current business ──────────────────────────────────────────────────

  const setCurrentBusiness = useCallback((biz: Business) => {
    setCurrentBusinessState(biz)
    localStorage.setItem(BUSINESS_KEY, biz.id)
  }, [])

  // ── Refresh businesses list ───────────────────────────────────────────────

  const refreshBusinesses = useCallback(async () => {
    await loadBusinesses(currentBusiness?.id)
  }, [loadBusinesses, currentBusiness?.id])

  return (
    <AuthContext.Provider
      value={{
        user,
        authState,
        businesses,
        currentBusiness,
        initiateGoogleSignIn,
        signOut,
        setCurrentBusiness,
        refreshBusinesses,
        handleAuthCallback,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be inside AuthProvider')
  return ctx
}
