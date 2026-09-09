import React, { createContext, useContext, useState, useCallback, useEffect } from 'react'
import type { User, Business, AuthState } from '@/types'
import { businessService, authService } from '@/services'

interface AuthContextType {
  user: User | null
  authState: AuthState
  businesses: Business[]
  currentBusiness: Business | null
  signInWithGoogle: () => Promise<void>
  signOut: () => void
  setCurrentBusiness: (business: Business) => void
  refreshBusinesses: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | null>(null)

// Persist session in localStorage (mock only — never store real tokens this way)
const SESSION_KEY = 'sellora_mock_user'
const BUSINESS_KEY = 'sellora_mock_business'

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [authState, setAuthState] = useState<AuthState>('loading')
  const [businesses, setBusinesses] = useState<Business[]>([])
  const [currentBusiness, setCurrentBusinessState] = useState<Business | null>(null)

  // Restore session on mount
  useEffect(() => {
    const stored = localStorage.getItem(SESSION_KEY)
    if (stored) {
      try {
        const parsed = JSON.parse(stored) as User
        setUser(parsed)
        // Load businesses — restore previously selected one if saved
        businessService.getAll().then(bizList => {
          setBusinesses(bizList)
          const storedBizId = localStorage.getItem(BUSINESS_KEY)
          if (storedBizId) {
            const current = bizList.find(b => b.id === storedBizId) ?? null
            setCurrentBusinessState(current)
          }
          setAuthState(bizList.length === 0 ? 'needs-onboarding' : 'authenticated')
        })
      } catch {
        localStorage.removeItem(SESSION_KEY)
        setAuthState('unauthenticated')
      }
    } else {
      setAuthState('unauthenticated')
    }
  }, [])

  const signInWithGoogle = useCallback(async () => {
    setAuthState('loading')
    const { user: googleUser } = await authService.signInWithGoogle()
    const newUser: User = {
      id: googleUser.id,
      googleId: googleUser.id,
      name: googleUser.name,
      email: googleUser.email,
      avatar: googleUser.avatar,
      createdAt: new Date().toISOString(),
    }
    setUser(newUser)
    localStorage.setItem(SESSION_KEY, JSON.stringify(newUser))

    const bizList = await businessService.getAll()
    setBusinesses(bizList)

    if (bizList.length === 0) {
      setAuthState('needs-onboarding')
    } else {
      // Don't auto-select a business here — user picks from /businesses
      // Clear any previously stored business so they always choose fresh
      localStorage.removeItem(BUSINESS_KEY)
      setCurrentBusinessState(null)
      setAuthState('authenticated')
    }
  }, [])

  const signOut = useCallback(() => {
    setUser(null)
    setBusinesses([])
    setCurrentBusinessState(null)
    setAuthState('unauthenticated')
    localStorage.removeItem(SESSION_KEY)
    localStorage.removeItem(BUSINESS_KEY)
  }, [])

  const setCurrentBusiness = useCallback((biz: Business) => {
    setCurrentBusinessState(biz)
    localStorage.setItem(BUSINESS_KEY, biz.id)
  }, [])

  const refreshBusinesses = useCallback(async () => {
    const bizList = await businessService.getAll()
    setBusinesses(bizList)
    if (!currentBusiness) setCurrentBusinessState(bizList[0] ?? null)
  }, [currentBusiness])

  return (
    <AuthContext.Provider
      value={{
        user,
        authState,
        businesses,
        currentBusiness,
        signInWithGoogle,
        signOut,
        setCurrentBusiness,
        refreshBusinesses,
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
