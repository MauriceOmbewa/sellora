import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import {
  ArrowRight, Package, ShoppingBag, Users, BarChart2,
  Globe, MessageSquare, Zap, Check, ChevronDown, ChevronUp,
  Store, TrendingUp, Archive, Palette, Star, ArrowUpRight,
} from 'lucide-react'
import { plansService } from '@/services/plansService'
import type { PricingPlan } from '@/types'

// ── Hero dashboard mockup ─────────────────────────────────────────────────────
function DashboardMockup() {
  const bars = [38, 55, 44, 78, 60, 90, 96]
  const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Today']

  return (
    <div className="relative h-[440px]">
      {/* background card */}
      <div className="absolute top-[-16px] right-0 w-[280px] h-[180px] bg-sand/40 border border-sand rounded-[16px] z-0" />

      {/* main dashboard card */}
      <div className="absolute top-0 left-0 right-8 bg-white border border-sand rounded-[16px] shadow-[0_24px_48px_-12px_rgba(23,27,33,0.2)] overflow-hidden z-10">
        {/* header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-sand bg-ink">
          <div className="flex items-center gap-2">
            <div className="w-5 h-5 rounded-[5px] bg-gold flex items-center justify-center font-serif font-bold text-ink text-[10px]">S</div>
            <span className="text-[12px] font-semibold text-ivory">Maison Aura</span>
          </div>
          <span className="text-[10px] text-ivory/50">Overview</span>
        </div>
        {/* kpis */}
        <div className="grid grid-cols-2 gap-2 p-3">
          {[
            { label: 'Revenue today', value: 'KSh 84,200', delta: '↑ 18%', up: true },
            { label: 'Orders', value: '37', delta: '6 pending', up: true },
          ].map(kpi => (
            <div key={kpi.label} className="bg-ivory border border-sand rounded-[9px] p-3">
              <p className="text-[10px] text-slate font-medium mb-1">{kpi.label}</p>
              <p className="font-serif text-[18px] font-semibold text-ink">{kpi.value}</p>
              <p className={['text-[10px] font-semibold mt-1', kpi.up ? 'text-green' : 'text-slate'].join(' ')}>{kpi.delta}</p>
            </div>
          ))}
        </div>
        {/* bar chart */}
        <div className="px-3 pb-3">
          <p className="text-[10px] text-slate font-semibold mb-2 uppercase tracking-wide">Sales this week</p>
          <div className="flex items-end gap-1 h-[80px]">
            {bars.map((h, i) => (
              <div key={i} className="flex-1 flex flex-col items-center gap-1">
                <div
                  className="w-full rounded-t-[3px]"
                  style={{
                    height: `${(h / 100) * 72}px`,
                    background: h === 96 || h === 90 ? '#C79A3D' : '#171B21',
                    opacity: h === 96 || h === 90 ? 1 : 0.75,
                  }}
                />
                <span className="text-[8px] text-slate">{days[i]}</span>
              </div>
            ))}
          </div>
        </div>
        {/* order list */}
        <div className="border-t border-sand px-3 py-2 space-y-1.5">
          {[
            { name: 'Fatuma N.', item: 'Velvet Oud ×1', amt: 'KSh 4,800', paid: true },
            { name: 'Brian K.', item: 'Ocean Mist ×2', amt: 'KSh 5,600', paid: false },
          ].map(o => (
            <div key={o.name} className="flex items-center justify-between py-1 text-[11px]">
              <div>
                <p className="font-semibold text-ink">{o.name}</p>
                <p className="text-slate">{o.item}</p>
              </div>
              <div className="text-right">
                <p className="font-semibold text-ink">{o.amt}</p>
                <span className={['font-bold px-1.5 py-0.5 rounded-full text-[9px]', o.paid ? 'bg-green-light text-green' : 'bg-gold-light text-gold-deep'].join(' ')}>
                  {o.paid ? 'Paid' : 'Pending'}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* floating low-stock alert */}
      <div className="absolute bottom-4 left-6 bg-white border border-sand rounded-[12px] shadow-lg px-4 py-3 z-20 w-[190px]">
        <p className="text-[10px] text-slate font-medium mb-1">Low stock alerts</p>
        <p className="font-serif text-[22px] font-semibold text-ink">3</p>
        <p className="text-[10.5px] text-red font-semibold mt-1">↑ Restock soon</p>
      </div>

      {/* floating orders card */}
      <div className="absolute top-32 right-0 bg-white border border-sand rounded-[12px] shadow-lg px-3 py-3 z-20 w-[160px]">
        <p className="text-[10px] font-semibold text-slate uppercase tracking-wide mb-2">Latest orders</p>
        {['#1089 · Paid', '#1088 · Paid', '#1087 · Pending'].map(o => (
          <div key={o} className="flex items-center justify-between py-1.5 border-b border-sand last:border-0 text-[11px]">
            <span className="text-ink font-medium">{o.split(' · ')[0]}</span>
            <span className={o.includes('Paid') ? 'text-green font-semibold' : 'text-gold-deep font-semibold'}>
              {o.split(' · ')[1]}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}

// ── Storefront mini-preview ───────────────────────────────────────────────────
interface StorePreview {
  name: string
  tagline: string
  primaryColor: string
  products: string[]
}

function StoreMiniPreview({ store }: { store: StorePreview }) {
  return (
    <div className="bg-white border border-sand rounded-[14px] overflow-hidden shadow-sm hover:shadow-md transition-shadow">
      {/* hero bar */}
      <div className="px-4 py-4" style={{ background: store.primaryColor }}>
        <p className="font-serif font-semibold text-white text-[15px]">{store.name}</p>
        <p className="text-white/75 text-[11px] mt-0.5">{store.tagline}</p>
      </div>
      {/* product grid */}
      <div className="grid grid-cols-3 gap-2 p-3">
        {store.products.map(p => (
          <div key={p} className="space-y-1.5">
            <div className="bg-sand rounded-[6px] h-[52px]" />
            <p className="text-[10px] font-medium text-ink truncate">{p}</p>
            <p className="text-[10px] text-slate">KSh {(Math.floor(Math.random() * 4 + 2) * 1000).toLocaleString()}</p>
          </div>
        ))}
      </div>
    </div>
  )
}

// ── FAQ accordion ─────────────────────────────────────────────────────────────
function FaqItem({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false)
  return (
    <div className="border-b border-sand last:border-0">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between py-5 text-left gap-4"
      >
        <span className="font-medium text-ink text-[15px]">{q}</span>
        {open ? <ChevronUp size={16} className="text-slate shrink-0" /> : <ChevronDown size={16} className="text-slate shrink-0" />}
      </button>
      {open && (
        <p className="text-[14px] text-slate leading-relaxed pb-5">{a}</p>
      )}
    </div>
  )
}

// ── Main page ─────────────────────────────────────────────────────────────────
export default function LandingPage() {
  // Fetch live pricing plans from the backend
  const [plans, setPlans]       = useState<PricingPlan[]>([])
  const [plansLoading, setPlansLoading] = useState(true)

  useEffect(() => {
    plansService.getAll()
      .then(setPlans)
      .catch(() => {
        // Fallback static plans if backend is unreachable
        setPlans([
          { id: 'starter',  name: 'Starter',  monthlyPrice: 0,    annualPrice: 0,     description: 'Perfect for new businesses.', features: ['1 storefront','50 products','Order management','Basic analytics'], highlighted: false, ctaText: 'Get started free' },
          { id: 'business', name: 'Business', monthlyPrice: 3499, annualPrice: 34990, description: 'For growing businesses.', features: ['Unlimited products','Advanced analytics','Custom domain','Priority support','Inventory management'], highlighted: true, ctaText: 'Start Business plan' },
          { id: 'growth',   name: 'Growth',   monthlyPrice: 7999, annualPrice: 79990, description: 'For businesses scaling fast.', features: ['Multiple storefronts','Everything in Business','API access','Team accounts'], highlighted: false, ctaText: 'Start Growth plan' },
        ])
      })
      .finally(() => setPlansLoading(false))
  }, [])
  const businessTypes = [
    { icon: '🌸', label: 'Perfumes' },
    { icon: '✨', label: 'Cosmetics' },
    { icon: '👗', label: 'Fashion' },
    { icon: '💍', label: 'Accessories' },
    { icon: '💅', label: 'Beauty' },
    { icon: '🎁', label: 'Gifts' },
    { icon: '📱', label: 'Electronics' },
    { icon: '🛍️', label: 'Retail' },
  ]

  const features = [
    {
      icon: <BarChart2 size={20} />,
      title: 'Business Dashboard',
      desc: 'One clear view of your revenue, orders, customers and inventory. No spreadsheets.',
    },
    {
      icon: <Globe size={20} />,
      title: 'Online Storefront',
      desc: 'Every business gets a professional branded storefront — ready immediately.',
    },
    {
      icon: <Package size={20} />,
      title: 'Product Management',
      desc: 'Add products with images, pricing, categories and stock. Keep everything organised.',
    },
    {
      icon: <Archive size={20} />,
      title: 'Inventory Tracking',
      desc: 'Know exactly what\'s in stock and get alerted before you run out.',
    },
    {
      icon: <Users size={20} />,
      title: 'Customer Management',
      desc: 'See who your best customers are, their order history and lifetime value.',
    },
    {
      icon: <ShoppingBag size={20} />,
      title: 'Sales & Orders',
      desc: 'Manage every order from new to delivered. Track payments and status.',
    },
    {
      icon: <TrendingUp size={20} />,
      title: 'Analytics & Reports',
      desc: 'Understand what\'s selling, when, and why. Make informed decisions fast.',
    },
    {
      icon: <Palette size={20} />,
      title: 'Brand Customisation',
      desc: 'Set your colours, logo, and story. Your store looks uniquely yours.',
    },
    {
      icon: <MessageSquare size={20} />,
      title: 'WhatsApp Integration',
      desc: 'Let customers order via WhatsApp. Perfect for businesses already selling there.',
    },
    {
      icon: <Zap size={20} />,
      title: 'Mobile Friendly',
      desc: 'Manage your shop from your phone. Works beautifully on every screen size.',
    },
  ]

  const steps = [
    { num: '01', title: 'Sign in with Google', desc: 'No forms to fill twice. Your account is tied to the Google account you already use.' },
    { num: '02', title: 'Create your business', desc: 'Name, category, logo, and a short description. Takes under two minutes.' },
    { num: '03', title: 'Add your products', desc: 'Upload images, set prices, and organise by category. Your storefront updates instantly.' },
    { num: '04', title: 'Start selling', desc: 'Share your store link, take orders, and watch your business dashboard fill up.' },
  ]

  const storeExamples: StorePreview[] = [
    { name: 'Maison Aura', tagline: 'Find the scent that feels like you.', primaryColor: '#C79A3D', products: ['Velvet Oud', 'Midnight Bloom', 'Rose Elixir'] },
    { name: 'Glow Beauty', tagline: 'Skincare made for your skin.', primaryColor: '#3F6B4F', products: ['Glow Serum', 'Rose Toner', 'Clay Mask'] },
    { name: 'Urban Store', tagline: 'Dress the way you want to be seen.', primaryColor: '#171B21', products: ['Ankara Dress', 'Silk Blouse', 'Linen Set'] },
  ]

  // plans are loaded from the API above

  const faqs = [
    { q: 'Do I need technical knowledge?', a: 'Not at all. Sellora is designed for business owners, not developers. If you can use a smartphone, you can manage your entire business on Sellora.' },
    { q: 'Can I customise my store?', a: 'Yes. You can set your business name, logo, brand colours, tagline, hero image, and featured products. Your store reflects your brand.' },
    { q: 'Can customers order from their phones?', a: 'Absolutely. The storefront is fully optimised for mobile. Customers can browse, add to cart, and checkout on any device.' },
    { q: 'Can I connect WhatsApp?', a: 'Yes. Add your WhatsApp number and a "Order via WhatsApp" button appears on your storefront and product pages. Perfect for businesses that already use WhatsApp.' },
    { q: 'Can I change my branding later?', a: 'You can change your business name, logo, colours, and storefront content at any time from your dashboard. Changes go live immediately.' },
    { q: 'How many products can I add?', a: 'Starter plans support up to 100 products. Business and Growth plans support unlimited products.' },
  ]

  return (
    <div className="bg-ivory">
      {/* ── HERO ─────────────────────────────────────────── */}
      <section className="pt-28 pb-20 overflow-hidden">
        <div className="max-w-[1180px] mx-auto px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-14 items-center">
            <div>
              <div className="inline-flex items-center gap-2.5 mb-7">
                <div className="flex">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} size={13} className="text-gold fill-gold" />
                  ))}
                </div>
                <span className="text-[13.5px] text-slate">
                  <strong className="text-ink">4.9</strong> · 240+ shops trust Sellora
                </span>
              </div>

              <h1 className="font-serif text-[54px] leading-[1.05] text-ink mb-5">
                Run your business.<br />
                Sell online.<br />
                <span className="text-gold">Understand everything.</span>
              </h1>

              <p className="text-[17px] text-slate leading-relaxed max-w-[480px] mb-8">
                Sellora gives small retailers one place to manage products, orders,
                customers, inventory and analytics — and a professional online store that
                customers love.
              </p>

              <div className="flex flex-wrap gap-3 mb-8">
                <Link
                  to="/login"
                  className="inline-flex items-center gap-2 px-6 py-3.5 bg-ink text-ivory font-semibold text-[15px] rounded-[9px] hover:bg-ink-soft transition-colors"
                >
                  Start Your Business
                  <ArrowRight size={16} />
                </Link>
                <a
                  href="#how-it-works"
                  className="inline-flex items-center gap-2 px-6 py-3.5 border border-sand text-ink font-semibold text-[15px] rounded-[9px] hover:border-ink transition-colors"
                >
                  See How It Works
                </a>
              </div>

              <div className="flex flex-wrap gap-3 pt-5 border-t border-sand">
                {['Amaya Cosmetics', 'Nyota Perfumes', 'Kilele Fashion', 'Zawadi Beauty', 'Boma Footwear'].map(name => (
                  <span key={name} className="text-[13px] text-slate font-medium">{name}</span>
                ))}
              </div>
            </div>

            {/* Mockup */}
            <div className="hidden lg:block">
              <DashboardMockup />
            </div>
          </div>
        </div>
      </section>

      {/* ── BUSINESS TYPES ───────────────────────────────── */}
      <section className="py-14 border-t border-sand">
        <div className="max-w-[1180px] mx-auto px-6 lg:px-8">
          <p className="text-[13px] font-medium text-slate mb-5 uppercase tracking-widest">Built for businesses like yours</p>
          <div className="flex flex-wrap gap-3">
            {businessTypes.map(bt => (
              <div
                key={bt.label}
                className="flex items-center gap-2 px-4 py-2.5 bg-white border border-sand rounded-full text-[14px] font-medium text-ink-soft hover:border-ink transition-colors"
              >
                <span>{bt.icon}</span>
                {bt.label}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FEATURES ─────────────────────────────────────── */}
      <section id="features" className="py-20 border-t border-sand">
        <div className="max-w-[1180px] mx-auto px-6 lg:px-8">
          <div className="max-w-xl mb-14">
            <p className="text-[13px] font-semibold text-green uppercase tracking-widest mb-3">Everything in one place</p>
            <h2 className="font-serif text-[38px] text-ink leading-[1.15] mb-4">The back office your shop was missing</h2>
            <p className="text-[16px] text-slate leading-relaxed">No more juggling a notebook for stock, WhatsApp for orders, and a calculator for finances. It's all in Sellora.</p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {features.map((f, i) => (
              <div
                key={f.title}
                className={[
                  'rounded-[18px] p-7 flex flex-col',
                  i === 0 ? 'bg-ink text-ivory border border-ink sm:col-span-2 lg:col-span-1' : 'bg-white border border-sand',
                ].join(' ')}
              >
                <div className={[
                  'w-10 h-10 rounded-[10px] flex items-center justify-center mb-5',
                  i === 0 ? 'bg-white/10 text-gold' : 'bg-ivory border border-sand text-ink',
                ].join(' ')}>
                  {f.icon}
                </div>
                <h3 className={['font-serif text-[18px] font-medium mb-2', i === 0 ? 'text-ivory' : 'text-ink'].join(' ')}>{f.title}</h3>
                <p className={['text-[14px] leading-relaxed', i === 0 ? 'text-ivory/70' : 'text-slate'].join(' ')}>{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── HOW IT WORKS ─────────────────────────────────── */}
      <section id="how-it-works" className="py-20 border-t border-sand bg-white">
        <div className="max-w-[1180px] mx-auto px-6 lg:px-8">
          <div className="max-w-xl mb-14">
            <p className="text-[13px] font-semibold text-green uppercase tracking-widest mb-3">Getting started</p>
            <h2 className="font-serif text-[38px] text-ink leading-[1.15]">Open for business in one afternoon</h2>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-px bg-sand rounded-[18px] overflow-hidden">
            {steps.map(step => (
              <div key={step.num} className="bg-white p-8">
                <p className="font-serif text-[14px] font-semibold text-gold-deep mb-4">{step.num}</p>
                <h3 className="font-serif text-[18px] text-ink mb-3">{step.title}</h3>
                <p className="text-[14px] text-slate leading-relaxed">{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── STOREFRONT PREVIEW ───────────────────────────── */}
      <section className="py-20 border-t border-sand">
        <div className="max-w-[1180px] mx-auto px-6 lg:px-8">
          <div className="max-w-xl mb-14">
            <p className="text-[13px] font-semibold text-green uppercase tracking-widest mb-3">One platform, many brands</p>
            <h2 className="font-serif text-[38px] text-ink leading-[1.15] mb-4">Your store, your identity</h2>
            <p className="text-[16px] text-slate leading-relaxed">
              Every business gets the same powerful template — customised with your branding.
              Same product, different personality.
            </p>
          </div>

          <div className="grid sm:grid-cols-3 gap-5">
            {storeExamples.map(store => (
              <StoreMiniPreview key={store.name} store={store} />
            ))}
          </div>

          <p className="text-center text-[13.5px] text-slate mt-6">
            All three run on the same Sellora template — with different names, colours, and branding.
          </p>
        </div>
      </section>

      {/* ── DASHBOARD PREVIEW ────────────────────────────── */}
      <section className="py-20 bg-ink border-t border-ink">
        <div className="max-w-[1180px] mx-auto px-6 lg:px-8">
          <div className="max-w-xl mb-12">
            <p className="text-[13px] font-semibold text-gold uppercase tracking-widest mb-3">Two experiences, one product</p>
            <h2 className="font-serif text-[38px] text-ivory leading-[1.15] mb-4">Manage in the dashboard. Shine in the storefront.</h2>
            <p className="text-[16px] text-ivory/65 leading-relaxed">
              Update your branding once in the dashboard and your storefront updates instantly.
              No developer required.
            </p>
          </div>

          <div className="grid lg:grid-cols-2 gap-5">
            {/* Admin side */}
            <div className="bg-ivory/5 border border-white/10 rounded-[16px] overflow-hidden">
              <div className="px-5 py-3 border-b border-white/10">
                <p className="text-[12px] font-semibold text-ivory/60">Dashboard view</p>
              </div>
              <div className="p-5 space-y-3">
                {[
                  { label: 'Orders today', value: '37', color: 'text-ivory' },
                  { label: 'Revenue today', value: 'KSh 84,200', color: 'text-gold' },
                  { label: 'Low stock alerts', value: '3 products', color: 'text-red' },
                  { label: 'Best seller this week', value: 'Velvet Oud', color: 'text-ivory' },
                ].map(row => (
                  <div key={row.label} className="flex items-center justify-between py-3 border-b border-white/10 last:border-0">
                    <span className="text-[13.5px] text-ivory/60">{row.label}</span>
                    <span className={['text-[13.5px] font-semibold', row.color].join(' ')}>{row.value}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Storefront side */}
            <div className="bg-ivory/5 border border-white/10 rounded-[16px] overflow-hidden">
              <div className="px-5 py-3 border-b border-white/10">
                <p className="text-[12px] font-semibold text-ivory/60">Storefront view (maison-aura.sellora.co.ke)</p>
              </div>
              <div className="p-5">
                <div className="bg-gold rounded-[10px] p-4 mb-4">
                  <p className="font-serif font-semibold text-ink text-[16px] mb-1">Maison Aura</p>
                  <p className="text-ink/70 text-[12px]">Find the scent that feels like you.</p>
                  <button className="mt-3 px-4 py-1.5 bg-ink text-ivory text-[12px] font-semibold rounded-[6px]">Shop Collection</button>
                </div>
                <div className="grid grid-cols-3 gap-2">
                  {['Velvet Oud', 'Midnight Bloom', 'Rose Elixir'].map(p => (
                    <div key={p} className="bg-white/10 rounded-[8px] p-2.5">
                      <div className="bg-white/20 rounded-[5px] h-[44px] mb-2" />
                      <p className="text-[10px] font-medium text-ivory">{p}</p>
                      <p className="text-[9px] text-ivory/60 mt-0.5">KSh 4,800</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── PRICING ──────────────────────────────────────── */}
      <section id="pricing" className="py-20 border-t border-sand">
        <div className="max-w-[1180px] mx-auto px-6 lg:px-8">
          <div className="text-center max-w-xl mx-auto mb-14">
            <p className="text-[13px] font-semibold text-green uppercase tracking-widest mb-3">Pricing</p>
            <h2 className="font-serif text-[38px] text-ink leading-[1.15] mb-4">Simple, transparent pricing</h2>
            <p className="text-[16px] text-slate">Start free for 14 days. No credit card required.</p>
          </div>

          <div className="grid md:grid-cols-3 gap-5 items-start">
            {plansLoading ? (
              // Skeleton placeholders while plans load
              [1, 2, 3].map(i => (
                <div key={i} className="rounded-[18px] border border-sand bg-white p-8 space-y-4">
                  <div className="h-4 bg-sand rounded w-1/3" />
                  <div className="h-8 bg-sand rounded w-1/2" />
                  <div className="h-4 bg-sand rounded w-3/4" />
                  {[1,2,3,4].map(j => <div key={j} className="h-4 bg-sand rounded" />)}
                  <div className="h-10 bg-sand rounded-[9px]" />
                </div>
              ))
            ) : (
              plans.map(plan => (
                <div
                  key={plan.id}
                  className={[
                    'rounded-[18px] p-8 relative',
                    plan.highlighted
                      ? 'bg-ink text-ivory border-2 border-ink shadow-xl scale-[1.02]'
                      : 'bg-white border border-sand',
                  ].join(' ')}
                >
                  {plan.highlighted && (
                    <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 px-3 py-1 bg-gold text-ink text-[11px] font-bold rounded-full">
                      Most popular
                    </div>
                  )}
                  <p className={['text-[13px] font-semibold uppercase tracking-widest mb-2', plan.highlighted ? 'text-gold' : 'text-slate'].join(' ')}>
                    {plan.name}
                  </p>
                  <div className="flex items-baseline gap-1 mb-2">
                    <span className="font-serif text-[32px] font-semibold">
                      {plan.monthlyPrice === 0 ? 'Free' : `KSh ${plan.monthlyPrice.toLocaleString()}`}
                    </span>
                    {plan.monthlyPrice > 0 && (
                      <span className={['text-[13px]', plan.highlighted ? 'text-ivory/60' : 'text-slate'].join(' ')}>/month</span>
                    )}
                  </div>
                  <p className={['text-[13.5px] mb-6', plan.highlighted ? 'text-ivory/70' : 'text-slate'].join(' ')}>{plan.description}</p>
                  <ul className="space-y-3 mb-8">
                    {plan.features.map(f => (
                      <li key={f} className="flex items-center gap-2.5 text-[14px]">
                        <Check size={14} className={plan.highlighted ? 'text-gold shrink-0' : 'text-green shrink-0'} />
                        <span className={plan.highlighted ? 'text-ivory/85' : 'text-ink-soft'}>{f}</span>
                      </li>
                    ))}
                  </ul>
                  <Link
                    to="/login"
                    className={[
                      'flex items-center justify-center gap-2 w-full py-3 rounded-[9px] text-[14px] font-semibold transition-colors',
                      plan.highlighted
                        ? 'bg-gold text-ink hover:bg-gold-deep'
                        : 'bg-ink text-ivory hover:bg-ink-soft',
                    ].join(' ')}
                  >
                    {plan.ctaText}
                    <ArrowRight size={14} />
                  </Link>
                </div>
              ))
            )}
          </div>
        </div>
      </section>

      {/* ── FAQ ──────────────────────────────────────────── */}
      <section id="faq" className="py-20 border-t border-sand bg-white">
        <div className="max-w-[1180px] mx-auto px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-16">
            <div>
              <p className="text-[13px] font-semibold text-green uppercase tracking-widest mb-3">FAQ</p>
              <h2 className="font-serif text-[38px] text-ink leading-[1.15] mb-4">Common questions</h2>
              <p className="text-[16px] text-slate leading-relaxed">
                Can't find what you're looking for? Email us at{' '}
                <a href="mailto:hello@sellora.co.ke" className="text-ink font-semibold underline">hello@sellora.co.ke</a>
              </p>
            </div>
            <div>
              {faqs.map(faq => (
                <FaqItem key={faq.q} q={faq.q} a={faq.a} />
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── FINAL CTA ─────────────────────────────────────── */}
      <section className="py-20 border-t border-sand">
        <div className="max-w-[1180px] mx-auto px-6 lg:px-8">
          <div className="bg-gold rounded-[24px] px-10 py-16 flex flex-col lg:flex-row items-center justify-between gap-8">
            <div>
              <h2 className="font-serif text-[34px] text-ink leading-[1.15] mb-3">
                Your shop deserves better than a notebook and a calculator.
              </h2>
              <p className="text-ink/70 text-[15px]">Start free for 14 days. No credit card required. Takes 2 minutes.</p>
            </div>
            <Link
              to="/login"
              className="inline-flex items-center gap-2 px-7 py-4 bg-ink text-ivory font-semibold text-[15px] rounded-[10px] hover:bg-ink-soft transition-colors shrink-0"
            >
              Start Your Business
              <ArrowUpRight size={16} />
            </Link>
          </div>
        </div>
      </section>

      {/* ── FOOTER ───────────────────────────────────────── */}
      <footer className="border-t border-sand py-14 bg-ivory">
        <div className="max-w-[1180px] mx-auto px-6 lg:px-8">
          <div className="grid sm:grid-cols-2 lg:grid-cols-5 gap-10 mb-12">
            <div className="lg:col-span-2">
              <div className="flex items-center gap-2.5 mb-4">
                <div className="w-7 h-7 rounded-[8px] bg-ink flex items-center justify-center">
                  <span className="text-gold font-serif font-bold text-[14px]">S</span>
                </div>
                <span className="font-serif font-semibold text-[18px] text-ink">Sellora</span>
              </div>
              <p className="text-[13.5px] text-slate leading-relaxed max-w-[220px]">
                The business dashboard and storefront for small Kenyan retailers.
              </p>
              <div className="flex gap-3 mt-5">
                {['Instagram', 'Twitter', 'LinkedIn'].map(s => (
                  <a key={s} href="#" className="text-[13px] text-slate hover:text-ink">{s}</a>
                ))}
              </div>
            </div>

            {[
              { title: 'Product', links: ['Dashboard', 'Storefronts', 'Inventory', 'Analytics', 'Pricing'] },
              { title: 'Company', links: ['About', 'Blog', 'Careers', 'Contact'] },
              { title: 'Support', links: ['Help Centre', 'Status', 'Terms', 'Privacy'] },
            ].map(col => (
              <div key={col.title}>
                <h4 className="text-[12.5px] font-semibold text-ink uppercase tracking-widest mb-4">{col.title}</h4>
                <div className="space-y-2.5">
                  {col.links.map(link => (
                    <a key={link} href="#" className="block text-[14px] text-slate hover:text-ink transition-colors">
                      {link}
                    </a>
                  ))}
                </div>
              </div>
            ))}
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-8 border-t border-sand">
            <p className="text-[13px] text-slate">© 2026 Sellora. Built for Kenyan retail.</p>
            <p className="text-[13px] text-slate">Nairobi · Mombasa · Kisumu</p>
          </div>
        </div>
      </footer>
    </div>
  )
}
