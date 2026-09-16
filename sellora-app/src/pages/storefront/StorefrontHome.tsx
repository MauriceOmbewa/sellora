import React from 'react'
import { Link } from 'react-router-dom'
import { ArrowRight, MessageCircle, Star, ShieldCheck, Truck, RefreshCw } from 'lucide-react'
import { useStorefront } from '@/context/StorefrontContext'
import { ProductCard } from '@/components/storefront/ProductCard'

export default function StorefrontHome() {
  const { business, products, loading, basePath } = useStorefront()
  const primary = business?.theme.primaryColor ?? '#C79A3D'
  const accent  = business?.theme.accentColor  ?? '#3F6B4F'

  // Show featured products; if none are marked featured, show ALL products (fallback)
  const featured   = products.filter(p => p.isFeatured).slice(0, 4)
  const showAll    = featured.length === 0   // no featured products set yet

  const bestSellers = [...products].sort((a, b) => b.totalSold - a.totalSold).slice(0, 4)
  const newArrivals = [...products]
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 4)

  if (loading) {
    return (
      <div className="max-w-[1200px] mx-auto px-5 py-16">
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="rounded-[14px] overflow-hidden border border-sand">
              <div className="aspect-square skeleton" />
              <div className="p-4 space-y-2">
                <div className="h-3 skeleton rounded w-1/2" />
                <div className="h-4 skeleton rounded w-3/4" />
                <div className="h-5 skeleton rounded w-1/3" />
              </div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div>
      {/* ── HERO ─────────────────────────────────────── */}
      <section
        className="relative overflow-hidden"
        style={{ background: `linear-gradient(135deg, ${primary}18 0%, ${primary}08 100%)` }}
      >
        {/* Hero image if configured */}
        {business?.hero.imageUrl && (
          <div className="absolute inset-0 z-0">
            <img src={business.hero.imageUrl} alt="" className="w-full h-full object-cover opacity-20" />
          </div>
        )}

        <div className="relative z-10 max-w-[1200px] mx-auto px-5 lg:px-8 py-20 lg:py-28">
          <div className="max-w-xl">
            <p className="text-[13px] font-semibold uppercase tracking-widest mb-5" style={{ color: accent }}>
              {business?.contact.city} · New Collection
            </p>
            <h1 className="font-serif text-[48px] lg:text-[60px] leading-[1.05] text-ink mb-5">
              {business?.hero.heading ?? 'Welcome to our store'}
            </h1>
            <p className="text-[17px] text-slate leading-relaxed mb-8 max-w-md">
              {business?.hero.subheading ?? 'Discover our curated collection'}
            </p>
            <div className="flex flex-wrap gap-3">
              <Link
                to={`${basePath}/shop`}
                className="inline-flex items-center gap-2 px-7 py-3.5 font-semibold text-[15px] text-white rounded-[10px] hover:opacity-90 transition-opacity"
                style={{ background: primary }}
              >
                {business?.hero.ctaText ?? 'Shop Now'}
                <ArrowRight size={16} />
              </Link>
              <Link
                to={`${basePath}/shop?sort=best-selling`}
                className="inline-flex items-center gap-2 px-7 py-3.5 font-semibold text-[15px] text-ink bg-white border border-sand rounded-[10px] hover:border-ink transition-colors"
              >
                {business?.hero.ctaSecondaryText ?? 'Best Sellers'}
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ── TRUST BAR ─────────────────────────────────── */}
      <section className="border-t border-b border-sand bg-ivory/50">
        <div className="max-w-[1200px] mx-auto px-5 lg:px-8 py-5">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 sm:gap-0 sm:divide-x divide-sand">
            {[
              { icon: <Truck size={16} />, title: 'Fast Delivery', sub: 'Nairobi same-day available' },
              { icon: <ShieldCheck size={16} />, title: 'Authentic Products', sub: '100% genuine guarantee' },
              { icon: <MessageCircle size={16} />, title: 'WhatsApp Orders', sub: 'Chat to order anytime' },
              { icon: <RefreshCw size={16} />, title: 'Easy Returns', sub: '7-day return policy' },
            ].map(item => (
              <div key={item.title} className="flex items-center gap-3 px-4 first:pl-0 last:pr-0">
                <div className="w-9 h-9 rounded-full flex items-center justify-center shrink-0" style={{ background: `${accent}18`, color: accent }}>
                  {item.icon}
                </div>
                <div>
                  <p className="text-[13px] font-semibold text-ink">{item.title}</p>
                  <p className="text-[11.5px] text-slate">{item.sub}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FEATURED / ALL PRODUCTS ─────────────────── */}
      {products.length > 0 && (
        <section className="py-16">
          <div className="max-w-[1200px] mx-auto px-5 lg:px-8">
            <div className="flex items-end justify-between mb-8">
              <div>
                <p className="text-[12px] font-semibold uppercase tracking-widest mb-2" style={{ color: accent }}>
                  {showAll ? 'Our collection' : 'Curated for you'}
                </p>
                <h2 className="font-serif text-[32px] text-ink">
                  {showAll ? 'All Products' : 'Featured Products'}
                </h2>
              </div>
              <Link to={`${basePath}/shop`} className="hidden sm:flex items-center gap-1.5 text-[14px] font-semibold text-ink hover:opacity-70 transition-opacity">
                View all <ArrowRight size={14} />
              </Link>
            </div>
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
              {(showAll ? products.slice(0, 8) : featured).map(p => (
                <ProductCard key={p.id} product={p} />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ── PROMOTIONAL BANNER ─────────────────────────── */}
      <section className="py-6">
        <div className="max-w-[1200px] mx-auto px-5 lg:px-8">
          <div className="rounded-[20px] overflow-hidden relative px-8 py-12 flex items-center justify-between gap-6" style={{ background: primary }}>
            <div className="relative z-10">
              <p className="text-[13px] font-semibold text-white/70 uppercase tracking-widest mb-3">Limited time</p>
              <h2 className="font-serif text-[30px] text-white leading-tight mb-4">
                {business?.motto ?? 'Discover our collection'}
              </h2>
              <Link
                to={`${basePath}/shop`}
                className="inline-flex items-center gap-2 px-6 py-3 bg-white font-semibold text-[14px] rounded-[8px] hover:bg-ivory transition-colors"
                style={{ color: primary }}
              >
                Shop Collection <ArrowRight size={14} />
              </Link>
            </div>
            {/* Decorative circles */}
            <div className="absolute right-0 top-0 w-64 h-64 rounded-full opacity-10 bg-white translate-x-16 -translate-y-16" />
            <div className="absolute right-0 bottom-0 w-48 h-48 rounded-full opacity-10 bg-white translate-x-8 translate-y-8" />
          </div>
        </div>
      </section>

      {/* ── BEST SELLERS ─────────────────────────────── */}
      {bestSellers.length > 0 && (
        <section className="py-16 bg-ivory/40">
          <div className="max-w-[1200px] mx-auto px-5 lg:px-8">
            <div className="flex items-end justify-between mb-8">
              <div>
                <p className="text-[12px] font-semibold uppercase tracking-widest mb-2" style={{ color: accent }}>Most loved</p>
                <h2 className="font-serif text-[32px] text-ink">Best Sellers</h2>
              </div>
              <Link to={`${basePath}/shop?sort=best-selling`} className="hidden sm:flex items-center gap-1.5 text-[14px] font-semibold text-ink hover:opacity-70">
                View all <ArrowRight size={14} />
              </Link>
            </div>
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
              {bestSellers.map(p => <ProductCard key={p.id} product={p} />)}
            </div>
          </div>
        </section>
      )}

      {/* ── NEW ARRIVALS ─────────────────────────────── */}
      {newArrivals.length > 0 && (
        <section className="py-16">
          <div className="max-w-[1200px] mx-auto px-5 lg:px-8">
            <div className="flex items-end justify-between mb-8">
              <div>
                <p className="text-[12px] font-semibold uppercase tracking-widest mb-2" style={{ color: accent }}>Just landed</p>
                <h2 className="font-serif text-[32px] text-ink">New Arrivals</h2>
              </div>
            </div>
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
              {newArrivals.map(p => <ProductCard key={p.id} product={p} />)}
            </div>
          </div>
        </section>
      )}

      {/* ── TESTIMONIALS ─────────────────────────────── */}
      <section className="py-16 bg-ink">
        <div className="max-w-[1200px] mx-auto px-5 lg:px-8">
          <div className="text-center mb-10">
            <p className="text-[12px] font-semibold uppercase tracking-widest mb-3" style={{ color: accent }}>What customers say</p>
            <h2 className="font-serif text-[32px] text-ivory">Real reviews</h2>
          </div>
          <div className="grid sm:grid-cols-3 gap-5">
            {[
              { name: 'Fatuma N.', text: 'The Velvet Oud is absolutely divine. Long-lasting and gets so many compliments.', rating: 5 },
              { name: 'Aisha M.', text: 'Ordered a gift set for my sister. Beautiful packaging and fast delivery. Will order again!', rating: 5 },
              { name: 'Brian K.', text: 'Ocean Mist is perfect for the office. Light but distinctive. My go-to daily fragrance now.', rating: 5 },
            ].map(review => (
              <div key={review.name} className="bg-white/5 border border-white/10 rounded-[14px] p-6">
                <div className="flex mb-3">
                  {Array.from({ length: review.rating }).map((_, i) => (
                    <Star key={i} size={13} className="text-gold fill-gold" />
                  ))}
                </div>
                <p className="text-[14px] text-ivory/80 leading-relaxed mb-4">"{review.text}"</p>
                <p className="text-[13px] font-semibold text-ivory">{review.name}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── ABOUT TEASER ─────────────────────────────── */}
      {business?.aboutText && (
        <section className="py-16 border-t border-sand">
          <div className="max-w-[1200px] mx-auto px-5 lg:px-8">
            <div className="grid lg:grid-cols-2 gap-12 items-center">
              <div>
                <p className="text-[12px] font-semibold uppercase tracking-widest mb-4" style={{ color: accent }}>Our story</p>
                <h2 className="font-serif text-[36px] text-ink leading-tight mb-5">About {business.name}</h2>
                <p className="text-[16px] text-slate leading-relaxed mb-6">{business.aboutText}</p>
                <Link to={`${basePath}/about`} className="inline-flex items-center gap-2 font-semibold text-ink hover:opacity-70">
                  Read our story <ArrowRight size={15} />
                </Link>
              </div>
              <div className="grid grid-cols-2 gap-3">
                {[
                  { num: `${products.length}+`, label: 'Products' },
                  { num: '240+', label: 'Happy customers' },
                  { num: '4.9', label: 'Average rating' },
                  { num: '3yr', label: 'In business' },
                ].map(stat => (
                  <div key={stat.label} className="bg-ivory border border-sand rounded-[14px] p-6 text-center">
                    <p className="font-serif text-[30px] font-semibold text-ink">{stat.num}</p>
                    <p className="text-[13px] text-slate mt-1">{stat.label}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>
      )}

      {/* ── WHATSAPP CTA ─────────────────────────────── */}
      {business?.contact.whatsapp && (
        <section className="py-12 bg-ivory border-t border-sand">
          <div className="max-w-[1200px] mx-auto px-5 lg:px-8 text-center">
            <MessageCircle size={28} className="text-green mx-auto mb-4" />
            <h2 className="font-serif text-[26px] text-ink mb-3">Prefer to order via WhatsApp?</h2>
            <p className="text-[15px] text-slate mb-6">Chat with us directly. We respond fast.</p>
            <a
              href={`https://wa.me/${business.contact.whatsapp.replace(/\D/g, '')}?text=Hi! I'd like to place an order.`}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-2.5 px-8 py-4 bg-green text-white font-semibold text-[15px] rounded-[10px] hover:bg-green/90 transition-colors"
            >
              <MessageCircle size={18} />
              Order on WhatsApp
            </a>
          </div>
        </section>
      )}
    </div>
  )
}
