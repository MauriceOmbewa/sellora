import { useState, useEffect } from 'react'
import { Link, useLocation, Outlet, useNavigate } from 'react-router-dom'
import { Menu, X, LayoutDashboard, LogOut } from 'lucide-react'
import { useAuth } from '@/context/AuthContext'

const navLinks = [
  { label: 'Product', href: '/#product' },
  { label: 'Features', href: '/#features' },
  { label: 'How It Works', href: '/#how-it-works' },
  { label: 'Pricing', href: '/#pricing' },
  { label: 'FAQ', href: '/#faq' },
]

export function MarketingLayout() {
  const [scrolled, setScrolled] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)
  const location = useLocation()
  const { authState, user, signOut } = useAuth()
  const navigate = useNavigate()
  const isLoggedIn = authState === 'authenticated' || authState === 'needs-onboarding'

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20)
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  useEffect(() => {
    setMobileOpen(false)
  }, [location])

  const handleSignOut = () => {
    signOut().then(() => navigate('/'))
  }

  return (
    <>
      <nav
        className={[
          'fixed top-0 left-0 right-0 z-50 transition-all duration-200',
          scrolled ? 'bg-ivory/90 backdrop-blur-md border-b border-sand shadow-sm' : 'bg-transparent',
        ].join(' ')}
      >
        <div className="max-w-[1180px] mx-auto px-6 lg:px-8 py-4 flex items-center justify-between">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2.5 shrink-0">
            <div className="w-7 h-7 rounded-[8px] bg-ink flex items-center justify-center">
              <span className="text-gold font-serif font-bold text-[14px]">S</span>
            </div>
            <span className="font-serif font-semibold text-[20px] text-ink">Sellora</span>
          </Link>

          {/* Desktop nav links */}
          <div className="hidden md:flex items-center gap-8">
            {navLinks.map(link => (
              <a
                key={link.label}
                href={link.href}
                className="text-[14px] font-medium text-ink-soft hover:text-ink transition-colors"
              >
                {link.label}
              </a>
            ))}
          </div>

          {/* Desktop CTAs — changes based on auth state */}
          <div className="hidden md:flex items-center gap-3">
            {isLoggedIn ? (
              <>
                {/* Logged-in state */}
                <span className="text-[13.5px] text-slate">
                  {user?.name?.split(' ')[0]}
                </span>
                <Link
                  to="/businesses"
                  className="flex items-center gap-2 px-4 py-2.5 bg-ink text-ivory text-[13.5px] font-semibold rounded-[8px] hover:bg-ink-soft transition-colors"
                >
                  <LayoutDashboard size={14} />
                  My Dashboard
                </Link>
                <button
                  onClick={handleSignOut}
                  className="flex items-center gap-1.5 px-3 py-2.5 text-[13.5px] text-slate font-medium hover:text-ink border border-sand rounded-[8px] hover:border-ink transition-colors"
                >
                  <LogOut size={13} />
                  Sign out
                </button>
              </>
            ) : (
              <>
                {/* Logged-out state */}
                <Link
                  to="/login"
                  className="text-[14px] font-semibold text-ink hover:text-ink-soft transition-colors"
                >
                  Sign In
                </Link>
                <Link
                  to="/login"
                  className="px-5 py-2.5 bg-ink text-ivory text-[14px] font-semibold rounded-[8px] hover:bg-ink-soft transition-colors"
                >
                  Get Started
                </Link>
              </>
            )}
          </div>

          {/* Mobile menu button */}
          <button
            className="md:hidden p-2 rounded-[8px] hover:bg-sand"
            onClick={() => setMobileOpen(!mobileOpen)}
            aria-label="Toggle menu"
          >
            {mobileOpen ? <X size={18} /> : <Menu size={18} />}
          </button>
        </div>

        {/* Mobile menu */}
        {mobileOpen && (
          <div className="md:hidden bg-ivory border-t border-sand px-6 py-4 space-y-1">
            {navLinks.map(link => (
              <a
                key={link.label}
                href={link.href}
                className="block py-2.5 text-[15px] font-medium text-ink-soft hover:text-ink border-b border-sand/50 last:border-0"
                onClick={() => setMobileOpen(false)}
              >
                {link.label}
              </a>
            ))}
            <div className="pt-4 flex flex-col gap-2.5">
              {isLoggedIn ? (
                <>
                  <Link
                    to="/businesses"
                    onClick={() => setMobileOpen(false)}
                    className="flex items-center justify-center gap-2 py-3 text-[14px] font-semibold bg-ink text-ivory rounded-[8px]"
                  >
                    <LayoutDashboard size={14} /> My Dashboard
                  </Link>
                  <button
                    onClick={() => { handleSignOut(); setMobileOpen(false) }}
                    className="py-3 text-[14px] font-semibold text-slate border border-sand rounded-[8px]"
                  >
                    Sign out
                  </button>
                </>
              ) : (
                <>
                  <Link
                    to="/login"
                    onClick={() => setMobileOpen(false)}
                    className="block py-2.5 text-center text-[14px] font-semibold border border-sand rounded-[8px] text-ink"
                  >
                    Sign In
                  </Link>
                  <Link
                    to="/login"
                    onClick={() => setMobileOpen(false)}
                    className="block py-2.5 text-center text-[14px] font-semibold bg-ink text-ivory rounded-[8px]"
                  >
                    Get Started
                  </Link>
                </>
              )}
            </div>
          </div>
        )}
      </nav>

      <Outlet />
    </>
  )
}
