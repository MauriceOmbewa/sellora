import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Shield, ShoppingBag, Store } from 'lucide-react'
import { useAuth } from '@/context/AuthContext'

function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" aria-hidden="true">
      <path fill="#4285F4" d="M17.64 9.2c0-.64-.06-1.25-.16-1.84H9v3.48h4.84c-.21 1.13-.84 2.08-1.8 2.72v2.26h2.9c1.7-1.56 2.68-3.87 2.68-6.62z"/>
      <path fill="#34A853" d="M9 18c2.43 0 4.47-.8 5.96-2.18l-2.9-2.26c-.8.54-1.83.86-3.06.86-2.35 0-4.34-1.59-5.05-3.72H.96v2.33C2.44 15.98 5.48 18 9 18z"/>
      <path fill="#FBBC05" d="M3.95 10.7c-.18-.54-.28-1.11-.28-1.7s.1-1.16.28-1.7V4.97H.96A9 9 0 000 9c0 1.45.35 2.83.96 4.03l2.99-2.33z"/>
      <path fill="#EA4335" d="M9 3.58c1.32 0 2.51.45 3.44 1.35l2.58-2.58C13.46.89 11.43 0 9 0 5.48 0 2.44 2.02.96 4.97l2.99 2.33C4.66 5.17 6.65 3.58 9 3.58z"/>
    </svg>
  )
}

export default function LoginPage() {
  const { initiateGoogleSignIn } = useAuth()
  const [loading, setLoading] = useState(false)

  // Default return destination: landing page (customer-first)
  const handleGoogle = (returnTo = '/') => {
    setLoading(true)
    initiateGoogleSignIn(returnTo)
    // Page navigates away — no setLoading(false) needed
  }

  return (
    <div className="min-h-screen grid lg:grid-cols-2">
      {/* ── LEFT: form ─────────────────────────────────── */}
      <div className="bg-ivory flex flex-col px-8 py-10 lg:px-16">
        {/* Logo */}
        <Link to="/" className="flex items-center gap-2 mb-auto pb-10">
          <div className="w-7 h-7 rounded-[8px] bg-ink flex items-center justify-center">
            <span className="text-gold font-serif font-bold text-[14px]">S</span>
          </div>
          <span className="font-serif font-semibold text-[20px] text-ink">Sellora</span>
        </Link>

        {/* Form center */}
        <div className="flex-1 flex flex-col justify-center max-w-[380px] mx-auto w-full">
          <h1 className="font-serif text-[32px] text-ink mb-2">Welcome to Sellora</h1>
          <p className="text-[15px] text-slate leading-relaxed mb-8">
            Sign in to shop, track your orders, and save your favourites across all stores.
          </p>

          {/* Primary CTA — customer sign in (returns to landing) */}
          <button
            onClick={() => handleGoogle('/')}
            disabled={loading}
            className={[
              'w-full flex items-center justify-center gap-3 bg-white border border-sand',
              'rounded-[10px] px-5 py-4 text-[15px] font-semibold text-ink',
              'hover:border-ink hover:shadow-sm transition-all duration-150',
              'focus-visible:outline-2 focus-visible:outline-gold',
              'disabled:opacity-60 disabled:cursor-not-allowed',
            ].join(' ')}
          >
            {loading ? (
              <div className="w-4 h-4 border-2 border-ink/20 border-t-ink rounded-full animate-spin" />
            ) : (
              <GoogleIcon />
            )}
            {loading ? 'Redirecting to Google…' : 'Continue with Google'}
          </button>

          {/* Why Google */}
          <div className="flex items-start gap-3 mt-5 p-4 bg-white border border-sand rounded-[12px]">
            <Shield size={15} className="text-green mt-0.5 shrink-0" />
            <p className="text-[13px] text-slate leading-relaxed">
              One less password to forget. Your account stays tied to the Google inbox you already use every day.
            </p>
          </div>

          {/* Divider */}
          <div className="flex items-center gap-3 my-7">
            <div className="flex-1 h-px bg-sand" />
            <span className="text-[12px] text-slate">want to sell on Sellora?</span>
            <div className="flex-1 h-px bg-sand" />
          </div>

          {/* Vendor CTA — sign in and go straight to business dashboard */}
          <button
            onClick={() => handleGoogle('/businesses')}
            disabled={loading}
            className={[
              'w-full flex items-center justify-center gap-2.5 border border-sand',
              'rounded-[10px] px-5 py-3.5 text-[14px] font-semibold text-ink-soft',
              'hover:border-ink hover:text-ink hover:shadow-sm transition-all duration-150',
              'focus-visible:outline-2 focus-visible:outline-gold',
              'disabled:opacity-60 disabled:cursor-not-allowed',
            ].join(' ')}
          >
            <Store size={15} />
            Sign in as a vendor
          </button>
          <p className="text-center text-[12.5px] text-slate mt-2">
            Takes you to your business dashboard
          </p>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-center gap-4 text-[13px] text-slate mt-10">
          <Link to="/marketplace" className="flex items-center gap-1.5 hover:text-ink transition-colors">
            <ShoppingBag size={13} />
            Browse the marketplace
          </Link>
          <span className="text-sand">·</span>
          <Link to="/" className="hover:text-ink transition-colors">
            Back to home
          </Link>
        </div>
      </div>

      {/* ── RIGHT: brand panel ─────────────────────────── */}
      <div className="hidden lg:flex flex-col bg-ink px-14 py-14 justify-between relative overflow-hidden">
        {/* Glow */}
        <div
          className="absolute top-[-100px] right-[-100px] w-[400px] h-[400px] rounded-full pointer-events-none"
          style={{ background: 'radial-gradient(circle, rgba(199,154,61,0.2), transparent 70%)' }}
        />

        {/* Two roles callout */}
        <div className="relative z-10 space-y-5">
          <p className="text-[12px] font-semibold text-gold uppercase tracking-widest mb-2">
            One account, two ways to use Sellora
          </p>

          <div className="bg-white/5 border border-white/10 rounded-[14px] p-5">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-8 h-8 rounded-[8px] bg-gold/20 flex items-center justify-center">
                <ShoppingBag size={15} className="text-gold" />
              </div>
              <p className="text-[14px] font-semibold text-ivory">Shop as a customer</p>
            </div>
            <p className="text-[13px] text-ivory/60 leading-relaxed">
              Browse all stores on Sellora, track your orders, and save items you love — all in one place.
            </p>
          </div>

          <div className="bg-white/5 border border-white/10 rounded-[14px] p-5">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-8 h-8 rounded-[8px] bg-green/20 flex items-center justify-center">
                <Store size={15} className="text-green" />
              </div>
              <p className="text-[14px] font-semibold text-ivory">Sell as a vendor</p>
            </div>
            <p className="text-[13px] text-ivory/60 leading-relaxed">
              Launch your own branded storefront, manage products, and track every order from a powerful dashboard.
            </p>
          </div>
        </div>

        {/* Testimonial */}
        <div className="relative z-10 max-w-[420px]">
          <blockquote className="font-serif text-[22px] text-ivory leading-[1.4] font-light italic mb-5">
            "I used to close the shop just to reconcile my payments. Now I see everything update live from my phone."
          </blockquote>
          <div>
            <p className="text-[14px] font-semibold text-ivory">Faith Wanjiru</p>
            <p className="text-[13px] text-ivory/50">Owner, Maison Aura · Nairobi</p>
          </div>
        </div>
      </div>
    </div>
  )
}
