import { useState } from 'react'
import { Outlet, Link, useParams, useNavigate } from 'react-router-dom'
import { Search, ShoppingBag, Menu, X, MessageCircle, Share2 } from 'lucide-react'
import { StorefrontProvider, useStorefront } from '@/context/StorefrontContext'

function StorefrontNav() {
  const { businessSlug } = useParams<{ businessSlug: string }>()
  const { business, cart } = useStorefront()
  const [mobileOpen, setMobileOpen] = useState(false)
  const [searchOpen, setSearchOpen] = useState(false)
  const navigate = useNavigate()

  const base = `/store/${businessSlug}`
  const primary = business?.theme.primaryColor ?? '#C79A3D'
  const itemCount = cart.items.reduce((s, i) => s + i.quantity, 0)

  const navLinks = [
    { label: 'Home', to: base },
    { label: 'Shop', to: `${base}/shop` },
    { label: 'About', to: `${base}/about` },
    { label: 'Contact', to: `${base}/contact` },
  ]

  return (
    <>
      {/* Top announcement bar */}
      {business?.contact.whatsapp && (
        <div className="text-white text-center text-[12px] py-2 px-4" style={{ background: primary }}>
          Order via WhatsApp · <a href={`https://wa.me/${business.contact.whatsapp.replace(/\D/g, '')}`} className="font-semibold underline" target="_blank" rel="noreferrer">{business.contact.whatsapp}</a>
          &nbsp;·&nbsp; Free delivery over KSh 10,000
        </div>
      )}

      <header className="sticky top-0 z-40 bg-white border-b border-sand/80 shadow-sm">
        <div className="max-w-[1200px] mx-auto px-5 lg:px-8 py-3.5 flex items-center justify-between gap-4">
          {/* Logo */}
          <Link to={base} className="flex items-center gap-2.5 shrink-0">
            {business?.logo ? (
              <img src={business.logo} alt={business.name} className="h-8 w-auto" />
            ) : (
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full flex items-center justify-center font-serif font-bold text-white text-[14px]" style={{ background: primary }}>
                  {business?.name[0] ?? 'S'}
                </div>
                <span className="font-serif font-semibold text-[18px] text-ink">{business?.name ?? 'Store'}</span>
              </div>
            )}
          </Link>

          {/* Desktop nav */}
          <nav className="hidden md:flex items-center gap-7">
            {navLinks.map(link => (
              <Link key={link.to} to={link.to} className="text-[14px] font-medium text-ink-soft hover:text-ink transition-colors">
                {link.label}
              </Link>
            ))}
          </nav>

          {/* Actions */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => setSearchOpen(!searchOpen)}
              className="w-9 h-9 rounded-full flex items-center justify-center hover:bg-sand transition-colors"
              aria-label="Search"
            >
              <Search size={17} className="text-ink" />
            </button>

            {/* WhatsApp */}
            {business?.contact.whatsapp && (
              <a
                href={`https://wa.me/${business.contact.whatsapp.replace(/\D/g, '')}`}
                target="_blank"
                rel="noreferrer"
                className="hidden sm:flex w-9 h-9 rounded-full items-center justify-center hover:bg-sand transition-colors"
                aria-label="WhatsApp"
              >
                <MessageCircle size={17} className="text-green" />
              </a>
            )}

            <Link
              to={`${base}/cart`}
              className="relative w-9 h-9 rounded-full flex items-center justify-center hover:bg-sand transition-colors"
              aria-label={`Cart (${itemCount} items)`}
            >
              <ShoppingBag size={17} className="text-ink" />
              {itemCount > 0 && (
                <span className="absolute -top-0.5 -right-0.5 w-5 h-5 rounded-full text-white text-[10px] font-bold flex items-center justify-center" style={{ background: primary }}>
                  {itemCount}
                </span>
              )}
            </Link>

            <button
              className="md:hidden w-9 h-9 rounded-full flex items-center justify-center hover:bg-sand"
              onClick={() => setMobileOpen(!mobileOpen)}
              aria-label="Menu"
            >
              {mobileOpen ? <X size={18} /> : <Menu size={18} />}
            </button>
          </div>
        </div>

        {/* Search bar */}
        {searchOpen && (
          <div className="border-t border-sand px-5 py-3">
            <input
              autoFocus
              type="search"
              placeholder="Search products…"
              className="w-full max-w-md bg-ivory border border-sand rounded-[9px] px-4 py-2.5 text-[14px] focus:outline-none focus:border-ink"
              onKeyDown={e => {
                if (e.key === 'Enter') {
                  const q = (e.target as HTMLInputElement).value
                  navigate(`${base}/shop?q=${encodeURIComponent(q)}`)
                  setSearchOpen(false)
                }
              }}
            />
          </div>
        )}

        {/* Mobile menu */}
        {mobileOpen && (
          <div className="md:hidden border-t border-sand bg-white px-5 py-4 space-y-1">
            {navLinks.map(link => (
              <Link
                key={link.to}
                to={link.to}
                onClick={() => setMobileOpen(false)}
                className="block py-3 text-[15px] font-medium text-ink border-b border-sand last:border-0"
              >
                {link.label}
              </Link>
            ))}
            {business?.contact.whatsapp && (
              <a
                href={`https://wa.me/${business.contact.whatsapp.replace(/\D/g, '')}`}
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-2 py-3 text-[15px] font-medium text-green"
              >
                <MessageCircle size={16} /> Order via WhatsApp
              </a>
            )}
          </div>
        )}
      </header>
    </>
  )
}

function StorefrontFooter() {
  const { businessSlug } = useParams<{ businessSlug: string }>()
  const { business } = useStorefront()
  const base = `/store/${businessSlug}`
  const primary = business?.theme.primaryColor ?? '#C79A3D'

  return (
    <footer className="bg-ink text-ivory mt-0">
      <div className="max-w-[1200px] mx-auto px-5 lg:px-8 py-14">
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-10 mb-10">
          <div className="lg:col-span-2">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 rounded-full flex items-center justify-center font-serif font-bold text-ink text-[14px]" style={{ background: primary }}>
                {business?.name[0]}
              </div>
              <span className="font-serif font-semibold text-[18px]">{business?.name}</span>
            </div>
            <p className="text-[13.5px] text-ivory/60 leading-relaxed max-w-[260px]">{business?.description}</p>
            <div className="flex gap-3 mt-4">
              {business?.socialLinks.instagram && (
                <a href={`https://instagram.com/${business.socialLinks.instagram}`} target="_blank" rel="noreferrer" className="w-8 h-8 bg-white/10 rounded-full flex items-center justify-center hover:bg-white/20">
                  <Share2 size={15} />
                </a>
              )}
              {business?.socialLinks.facebook && (
                <a href={`https://facebook.com/${business.socialLinks.facebook}`} target="_blank" rel="noreferrer" className="w-8 h-8 bg-white/10 rounded-full flex items-center justify-center hover:bg-white/20">
                  <Share2 size={15} />
                </a>
              )}
              {business?.contact.whatsapp && (
                <a href={`https://wa.me/${business.contact.whatsapp.replace(/\D/g, '')}`} target="_blank" rel="noreferrer" className="w-8 h-8 bg-white/10 rounded-full flex items-center justify-center hover:bg-white/20">
                  <MessageCircle size={15} />
                </a>
              )}
            </div>
          </div>

          <div>
            <h4 className="text-[12px] font-semibold uppercase tracking-widest text-ivory/50 mb-4">Shop</h4>
            <div className="space-y-2.5">
              {['All Products', 'New Arrivals', 'Best Sellers', 'Gift Sets'].map(l => (
                <Link key={l} to={`${base}/shop`} className="block text-[13.5px] text-ivory/70 hover:text-ivory transition-colors">{l}</Link>
              ))}
            </div>
          </div>

          <div>
            <h4 className="text-[12px] font-semibold uppercase tracking-widest text-ivory/50 mb-4">Help</h4>
            <div className="space-y-2.5">
              <Link to={`${base}/contact`} className="block text-[13.5px] text-ivory/70 hover:text-ivory">Contact us</Link>
              <Link to={`${base}/about`} className="block text-[13.5px] text-ivory/70 hover:text-ivory">About us</Link>
              {business?.contact.whatsapp && (
                <a href={`https://wa.me/${business.contact.whatsapp.replace(/\D/g, '')}`} className="block text-[13.5px] text-ivory/70 hover:text-ivory">
                  WhatsApp us
                </a>
              )}
              {business?.contact.openingHours && (
                <p className="text-[12.5px] text-ivory/40 mt-2">{business.contact.openingHours}</p>
              )}
            </div>
          </div>
        </div>

        <div className="border-t border-white/10 pt-6 flex flex-col sm:flex-row items-center justify-between gap-3">
          <p className="text-[12.5px] text-ivory/40">© {new Date().getFullYear()} {business?.name}. All rights reserved.</p>
          <p className="text-[12.5px] text-ivory/30">
            Powered by <a href="/" className="text-ivory/50 hover:text-ivory">Sellora</a>
          </p>
        </div>
      </div>
    </footer>
  )
}

function StorefrontContent() {
  const { loading, business, notFound } = useStorefront()

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-sand border-t-ink rounded-full animate-spin" />
          <p className="text-[13px] text-slate">Loading store…</p>
        </div>
      </div>
    )
  }

  if (notFound || !business) {
    return (
      <div className="min-h-screen flex items-center justify-center text-center px-6">
        <div>
          <p className="font-serif text-[28px] text-ink mb-3">Store not found</p>
          <p className="text-slate">This store doesn't exist, hasn't been published yet, or may have moved.</p>
          <Link to="/" className="mt-6 inline-block text-ink font-semibold hover:underline">← Back to Sellora</Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex flex-col bg-white">
      <StorefrontNav />
      <main className="flex-1">
        <Outlet />
      </main>
      <StorefrontFooter />
    </div>
  )
}

export default function StorefrontLayout() {
  const { businessSlug } = useParams<{ businessSlug: string }>()
  return (
    <StorefrontProvider businessSlug={businessSlug ?? ''}>
      <StorefrontContent />
    </StorefrontProvider>
  )
}

// re-export Link for use in sub-pages
