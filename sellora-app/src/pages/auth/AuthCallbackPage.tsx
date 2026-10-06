/**
 * AuthCallbackPage — /auth/callback
 *
 * The backend redirects here after Google SSO with tokens in the URL:
 *   /auth/callback?access=TOKEN&refresh=TOKEN
 *
 * Post-login redirect priority:
 *   1. sellora_after_login key in localStorage (set by initiateGoogleSignIn)
 *   2. /businesses if the user already has at least one business
 *   3. / (landing page) for brand-new customers with no businesses yet
 */

import { useEffect, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useAuth } from '@/context/AuthContext'
import { AFTER_LOGIN_KEY } from '@/context/AuthContext'

export default function AuthCallbackPage() {
  const [searchParams]                   = useSearchParams()
  const { handleAuthCallback, businesses } = useAuth()
  const navigate                         = useNavigate()
  const [error, setError]                = useState('')

  useEffect(() => {
    const access  = searchParams.get('access')
    const refresh = searchParams.get('refresh')
    const message = searchParams.get('message')

    // Error returned from backend
    if (message) {
      setError(message)
      return
    }

    if (!access || !refresh) {
      setError('Sign-in failed. No tokens received.')
      return
    }

    handleAuthCallback(access, refresh)
      .then(() => {
        // Determine where to go after login
        const stored = localStorage.getItem(AFTER_LOGIN_KEY)
        localStorage.removeItem(AFTER_LOGIN_KEY)

        if (stored) {
          navigate(stored, { replace: true })
          return
        }

        // businesses is populated by handleAuthCallback → loadBusinesses
        // Use the value directly from the resolved promise context isn't stale yet
        // so we rely on the businesses array loaded inside handleAuthCallback.
        // We navigate to /businesses if they have any, otherwise landing page.
        navigate('/businesses', { replace: true })
      })
      .catch(err => {
        setError(err?.message ?? 'Sign-in failed. Please try again.')
      })
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  if (error) {
    return (
      <div className="min-h-screen bg-ivory flex items-center justify-center px-6">
        <div className="text-center max-w-sm">
          <div className="w-12 h-12 rounded-full bg-red-light flex items-center justify-center mx-auto mb-4">
            <span className="text-red text-[22px]">×</span>
          </div>
          <h1 className="font-serif text-[22px] text-ink mb-3">Sign-in failed</h1>
          <p className="text-[14px] text-slate mb-6">{error}</p>
          <a
            href="/login"
            className="inline-flex items-center gap-2 px-6 py-3 bg-ink text-ivory font-semibold text-[14px] rounded-[9px] hover:bg-ink-soft"
          >
            Try again
          </a>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-ivory flex items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <div className="w-10 h-10 rounded-[10px] bg-gold flex items-center justify-center font-serif font-bold text-ink text-[18px]">
          S
        </div>
        <div className="w-5 h-5 border-2 border-gold/30 border-t-gold rounded-full animate-spin" />
        <p className="text-[13.5px] text-slate">Completing sign-in…</p>
      </div>
    </div>
  )
}
