import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Shield, TrendingUp } from 'lucide-react'
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
  const { signInWithGoogle } = useAuth()
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleGoogle = async () => {
    setLoading(true)
    setError('')
    try {
      await signInWithGoogle()
      navigate('/app', { replace: true })
    } catch {
      setError('Something went wrong. Please try again.')
      setLoading(false)
    }
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
          <h1 className="font-serif text-[32px] text-ink mb-2">Welcome back</h1>
          <p className="text-[15px] text-slate leading-relaxed mb-8">
            Sign in to manage your shop, check today's sales,
            and keep your storefront up to date.
          </p>

          {/* Google button */}
          <button
            onClick={handleGoogle}
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
            {loading ? 'Signing in…' : 'Continue with Google'}
          </button>

          {error && (
            <p className="mt-3 text-[13px] text-red font-medium text-center">{error}</p>
          )}

          {/* Divider */}
          <div className="flex items-center gap-3 my-6">
            <div className="flex-1 h-px bg-sand" />
            <span className="text-[12px] text-slate">that's the only way in</span>
            <div className="flex-1 h-px bg-sand" />
          </div>

          {/* Why Google */}
          <div className="bg-white border border-sand rounded-[12px] p-4">
            <div className="flex items-start gap-3">
              <Shield size={16} className="text-green mt-0.5 shrink-0" />
              <div>
                <p className="text-[13.5px] font-semibold text-ink mb-1">Why only Google?</p>
                <p className="text-[13px] text-slate leading-relaxed">
                  One less password to lose. Your account stays tied to an inbox you already check every day.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="text-center text-[13px] text-slate mt-10">
          Don't have a shop yet?{' '}
          <Link to="/" className="text-ink font-semibold hover:underline">
            Learn more →
          </Link>
        </div>
      </div>

      {/* ── RIGHT: brand ─────────────────────────────────── */}
      <div className="hidden lg:flex flex-col bg-ink px-14 py-14 justify-between relative overflow-hidden">
        {/* Glow */}
        <div
          className="absolute top-[-100px] right-[-100px] w-[400px] h-[400px] rounded-full pointer-events-none"
          style={{ background: 'radial-gradient(circle, rgba(199,154,61,0.2), transparent 70%)' }}
        />

        {/* Testimonial */}
        <div className="relative z-10 max-w-[420px]">
          <p className="text-[12px] font-semibold text-gold uppercase tracking-widest mb-6">Maison Aura · Nairobi</p>
          <blockquote className="font-serif text-[28px] text-ivory leading-[1.35] font-light italic">
            "I used to close the shop just to reconcile my payments. Now I see everything update live from my phone."
          </blockquote>
          <div className="mt-6">
            <p className="text-[14px] font-semibold text-ivory">Faith Wanjiru</p>
            <p className="text-[13px] text-ivory/50">Owner, Maison Aura</p>
          </div>
        </div>

        {/* Mini dashboard preview */}
        <div className="relative z-10 bg-white/5 border border-white/10 rounded-[14px] p-5 backdrop-blur-sm">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-[6px] bg-gold flex items-center justify-center font-serif font-bold text-ink text-[12px]">M</div>
              <span className="text-[13px] font-semibold text-ivory">Maison Aura</span>
            </div>
            <span className="text-[11px] text-ivory/50">Today</span>
          </div>
          <div className="grid grid-cols-3 gap-3">
            {[
              { label: 'Revenue', value: 'KSh 84.2K', icon: <TrendingUp size={13} className="text-gold" /> },
              { label: 'Orders', value: '37', icon: null },
              { label: 'Low stock', value: '3', icon: null },
            ].map(kpi => (
              <div key={kpi.label} className="bg-white/8 rounded-[9px] p-3">
                <p className="text-[10px] text-ivory/50 mb-1.5">{kpi.label}</p>
                <div className="flex items-center gap-1.5">
                  <p className="font-serif text-[17px] font-semibold text-ivory">{kpi.value}</p>
                  {kpi.icon}
                </div>
              </div>
            ))}
          </div>

          {/* sparkline bars */}
          <div className="mt-4 flex items-end gap-1 h-12">
            {[35, 50, 40, 65, 55, 80, 96].map((h, i) => (
              <div
                key={i}
                className="flex-1 rounded-t-[2px]"
                style={{ height: `${(h / 100) * 48}px`, background: h >= 80 ? '#C79A3D' : 'rgba(255,255,255,0.2)' }}
              />
            ))}
          </div>
          <p className="text-[10px] text-ivory/40 mt-2">Sales this week</p>
        </div>
      </div>
    </div>
  )
}
