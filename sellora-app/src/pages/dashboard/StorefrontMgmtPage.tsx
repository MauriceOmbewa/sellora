import { useState, useEffect } from 'react'
import {
  ExternalLink,
  Monitor,
  Tablet,
  Smartphone,
  Globe,
  ShoppingBag,
  Truck,
  ShieldCheck,
  MessageCircle,
  RefreshCw,
  ArrowRight,
  CreditCard,
  SmartphoneNfc,
  Building2,
  Send,
  Check,
  ChevronDown,
} from 'lucide-react'
import {
  Button,
  Input,
  Textarea,
  Tabs,
  ColorPicker,
  useToast,
  PageHeader,
} from '@/components/ui'
import { useAuth } from '@/context/AuthContext'
import { businessService } from '@/services/businessService'
import type { StorefrontSettings } from '@/types'

type ViewportSize = 'desktop' | 'tablet' | 'mobile'

type MpesaPaymentMethod =
  | 'paybill'
  | 'till'
  | 'pochi'
  | 'send_money'
  | null

// ── Storefront preview card ───────────────────────────────────────────────────

function StorefrontPreview({
  primary,
  accent,
  name,
  heading,
  subheading,
  ctaText,
  viewport,
}: {
  primary: string
  accent: string
  name: string
  heading: string
  subheading: string
  ctaText: string
  viewport: ViewportSize
}) {
  const maxW =
    viewport === 'desktop'
      ? '100%'
      : viewport === 'tablet'
        ? '680px'
        : '360px'

  const trustItems = [
    { icon: <Truck size={11} />, label: 'Fast Delivery' },
    { icon: <ShieldCheck size={11} />, label: 'Authentic' },
    { icon: <MessageCircle size={11} />, label: 'WhatsApp' },
    { icon: <RefreshCw size={11} />, label: 'Easy Returns' },
  ]

  const products = [
    { name: 'Velvet Oud', price: 'KSh 4,800', tag: 'Best seller' },
    { name: 'Ocean Mist', price: 'KSh 3,200', tag: 'New' },
    { name: 'Rose Bloom', price: 'KSh 5,500', tag: null },
  ]

  const showThree = viewport !== 'mobile'

  return (
    <div
      className="flex justify-center overflow-auto rounded-[12px] border border-sand bg-[#F5F3EE] p-3"
      style={{ minHeight: 560 }}
    >
      <div
        className="bg-white rounded-[8px] overflow-hidden border border-sand shadow-sm w-full transition-all duration-300 text-left"
        style={{ maxWidth: maxW }}
      >
        {/* ── Announcement bar */}
        <div
          className="text-white text-center text-[10px] py-1.5 px-3 font-medium"
          style={{ background: primary }}
        >
          Order via WhatsApp · Free delivery over KSh 10,000
        </div>

        {/* ── Nav */}
        <div className="flex items-center justify-between px-4 py-2.5 border-b border-sand bg-white">
          <div className="flex items-center gap-2">
            <div
              className="w-6 h-6 rounded-full flex items-center justify-center text-white text-[10px] font-bold font-serif"
              style={{ background: primary }}
            >
              {(name || 'S')[0].toUpperCase()}
            </div>

            <span className="font-serif font-semibold text-[13px] text-ink">
              {name || 'Your Store'}
            </span>
          </div>

          {viewport !== 'mobile' && (
            <div className="flex gap-4 text-[11px] text-slate font-medium">
              {['Home', 'Shop', 'About', 'Contact'].map(l => (
                <span key={l}>{l}</span>
              ))}
            </div>
          )}

          <div className="flex items-center gap-1.5">
            <div className="w-6 h-6 rounded-full border border-sand flex items-center justify-center">
              <ShoppingBag size={11} className="text-ink" />
            </div>
          </div>
        </div>

        {/* ── Hero */}
        <div
          className="px-6 py-8 relative overflow-hidden"
          style={{
            background: `linear-gradient(135deg, ${primary}20 0%, ${primary}08 100%)`,
          }}
        >
          <p
            className="text-[9px] font-bold uppercase tracking-widest mb-2"
            style={{ color: accent }}
          >
            New Collection
          </p>

          <h2 className="font-serif text-ink text-[18px] leading-tight mb-2">
            {heading || 'Welcome to our store'}
          </h2>

          <p className="text-slate text-[11px] mb-4 max-w-[240px]">
            {subheading || 'Discover our curated collection'}
          </p>

          <div className="flex gap-2 flex-wrap">
            <button
              className="px-4 py-1.5 text-white text-[11px] font-semibold rounded-[6px] flex items-center gap-1 hover:opacity-90 transition-opacity"
              style={{ background: primary }}
            >
              {ctaText || 'Shop Now'} <ArrowRight size={9} />
            </button>

            <button className="px-4 py-1.5 text-ink text-[11px] font-semibold rounded-[6px] border border-sand bg-white">
              Best Sellers
            </button>
          </div>
        </div>

        {/* ── Trust bar */}
        <div className="border-t border-b border-sand bg-[#FAFAF8] px-4 py-2.5">
          <div
            className={[
              'grid gap-2',
              showThree ? 'grid-cols-4' : 'grid-cols-2',
            ].join(' ')}
          >
            {trustItems.map(item => (
              <div key={item.label} className="flex items-center gap-1.5">
                <div
                  className="w-5 h-5 rounded-full flex items-center justify-center shrink-0"
                  style={{
                    background: `${accent}18`,
                    color: accent,
                  }}
                >
                  {item.icon}
                </div>

                <span className="text-[9.5px] font-semibold text-ink">
                  {item.label}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* ── Featured products */}
        <div className="p-4">
          <p
            className="text-[9px] font-bold uppercase tracking-widest mb-1"
            style={{ color: accent }}
          >
            Curated for you
          </p>

          <p className="font-serif text-[14px] text-ink mb-3">
            Featured Products
          </p>

          <div
            className={[
              'grid gap-2.5',
              showThree ? 'grid-cols-3' : 'grid-cols-2',
            ].join(' ')}
          >
            {products
              .slice(0, showThree ? 3 : 2)
              .map(p => (
                <div
                  key={p.name}
                  className="border border-sand rounded-[8px] overflow-hidden bg-white"
                >
                  <div
                    className="h-16 flex items-center justify-center"
                    style={{ background: `${primary}10` }}
                  >
                    <ShoppingBag size={16} style={{ color: primary }} />
                  </div>

                  <div className="p-2">
                    {p.tag && (
                      <span
                        className="text-[8px] font-bold px-1.5 py-0.5 rounded-full mb-1 inline-block text-white"
                        style={{ background: accent }}
                      >
                        {p.tag}
                      </span>
                    )}

                    <p className="text-[10px] font-semibold text-ink leading-tight">
                      {p.name}
                    </p>

                    <div className="flex items-center justify-between mt-1.5">
                      <p className="text-[10px] font-serif text-ink">
                        {p.price}
                      </p>

                      <button
                        className="w-5 h-5 rounded-full flex items-center justify-center text-white shrink-0"
                        style={{ background: primary }}
                      >
                        <ShoppingBag size={8} />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
          </div>
        </div>

        {/* ── Promo banner */}
        <div
          className="mx-4 mb-4 rounded-[8px] px-4 py-5 relative overflow-hidden"
          style={{ background: primary }}
        >
          <p className="text-[9px] font-semibold text-white/70 uppercase tracking-widest mb-1">
            Limited time
          </p>

          <p className="font-serif text-white text-[13px] mb-2.5">
            {name || 'Your Store'} · Special offer
          </p>

          <button
            className="px-3 py-1 bg-white text-[10px] font-semibold rounded-[5px]"
            style={{ color: primary }}
          >
            Shop Collection
          </button>

          <div className="absolute right-0 top-0 w-20 h-20 rounded-full opacity-10 bg-white translate-x-6 -translate-y-6" />
        </div>
      </div>
    </div>
  )
}

// ── Main page ─────────────────────────────────────────────────────────────────

export default function StorefrontMgmtPage() {
  const { currentBusiness, refreshBusinesses } = useAuth()
  const { toast } = useToast()

  const [activeTab, setActiveTab] = useState('preview')
  const [viewport, setViewport] =
    useState<ViewportSize>('desktop')
  const [loading, setLoading] = useState(false)
  const [publishing, setPublishing] = useState(false)
  const [storefrontSettings, setStorefrontSettings] =
    useState<StorefrontSettings | null>(null)
  const [sfLoading, setSfLoading] = useState(false)

  // ── Payment state ──────────────────────────────────────────────────────────
  const [mpesaPaymentMethod, setMpesaPaymentMethod] =
    useState<MpesaPaymentMethod>(null)

  // Controls whether the M-Pesa provider section is expanded.
  const [mpesaOpen, setMpesaOpen] = useState(false)

  const [paymentForm, setPaymentForm] = useState({
    paybillNumber: '',
    paybillAccountNumber: '',
    tillNumber: '',
    pochiNumber: '',
    sendMoneyNumber: '',
  })

  // ── Editable local state ──────────────────────────────────────────────────

  const [brandForm, setBrandForm] = useState({
    name: currentBusiness?.name ?? '',
    motto: currentBusiness?.motto ?? '',
    primaryColor:
      currentBusiness?.theme?.primaryColor ?? '#C79A3D',
    accentColor:
      currentBusiness?.theme?.accentColor ?? '#3F6B4F',
  })

  const [homeForm, setHomeForm] = useState({
    heading: currentBusiness?.hero?.heading ?? '',
    subheading: currentBusiness?.hero?.subheading ?? '',
    ctaText: currentBusiness?.hero?.ctaText ?? 'Shop Now',
    aboutText: currentBusiness?.aboutText ?? '',
  })

  const [contactForm, setContactForm] = useState({
    phone: currentBusiness?.contact?.phone ?? '',
    whatsapp: currentBusiness?.contact?.whatsapp ?? '',
    email: currentBusiness?.contact?.email ?? '',
    address: currentBusiness?.contact?.address ?? '',
    openingHours:
      currentBusiness?.contact?.openingHours ?? '',
  })

  const [socialForm, setSocialForm] = useState({
    instagram:
      currentBusiness?.socialLinks?.instagram ?? '',
    tiktok: currentBusiness?.socialLinks?.tiktok ?? '',
    facebook:
      currentBusiness?.socialLinks?.facebook ?? '',
    twitter:
      currentBusiness?.socialLinks?.twitter ?? '',
    youtube:
      currentBusiness?.socialLinks?.youtube ?? '',
  })

  // Sync local state when business changes
  useEffect(() => {
    if (!currentBusiness) return

    setBrandForm({
      name: currentBusiness.name,
      motto: currentBusiness.motto,
      primaryColor:
        currentBusiness.theme?.primaryColor ?? '#C79A3D',
      accentColor:
        currentBusiness.theme?.accentColor ?? '#3F6B4F',
    })

    setHomeForm({
      heading: currentBusiness.hero?.heading ?? '',
      subheading:
        currentBusiness.hero?.subheading ?? '',
      ctaText:
        currentBusiness.hero?.ctaText ?? 'Shop Now',
      aboutText: currentBusiness.aboutText ?? '',
    })

    setContactForm({
      phone: currentBusiness.contact?.phone ?? '',
      whatsapp:
        currentBusiness.contact?.whatsapp ?? '',
      email: currentBusiness.contact?.email ?? '',
      address:
        currentBusiness.contact?.address ?? '',
      openingHours:
        currentBusiness.contact?.openingHours ?? '',
    })

    setSocialForm({
      instagram:
        currentBusiness.socialLinks?.instagram ?? '',
      tiktok:
        currentBusiness.socialLinks?.tiktok ?? '',
      facebook:
        currentBusiness.socialLinks?.facebook ?? '',
      twitter:
        currentBusiness.socialLinks?.twitter ?? '',
      youtube:
        currentBusiness.socialLinks?.youtube ?? '',
    })
  }, [currentBusiness?.id])

  // Load storefront section toggles
  useEffect(() => {
    if (!currentBusiness || storefrontSettings) return

    setSfLoading(true)

    businessService
      .getStorefrontSettings(currentBusiness.id)
      .then(setStorefrontSettings)
      .catch(() => {
        /* non-critical */
      })
      .finally(() => setSfLoading(false))
  }, [currentBusiness?.id])

  // ── Save all changes ───────────────────────────────────────────────────────

  const handleSave = async () => {
    if (!currentBusiness) return

    setLoading(true)

    try {
      await businessService.update(currentBusiness.id, {
        name: brandForm.name,
        motto: brandForm.motto,
        theme: {
          primaryColor: brandForm.primaryColor,
          primaryHover: brandForm.primaryColor,
          accentColor: brandForm.accentColor,
          backgroundColor:
            currentBusiness.theme?.backgroundColor ??
            '#FAF8F3',
          textColor:
            currentBusiness.theme?.textColor ??
            '#171B21',
        },
        hero: {
          heading: homeForm.heading,
          subheading: homeForm.subheading,
          ctaText: homeForm.ctaText,
          ctaSecondaryText:
            currentBusiness.hero?.ctaSecondaryText,
        },
        about_text: homeForm.aboutText,
        contact: {
          phone: contactForm.phone,
          whatsapp: contactForm.whatsapp,
          email: contactForm.email,
          address: contactForm.address,
          openingHours: contactForm.openingHours,
          city: currentBusiness.contact?.city,
          country: currentBusiness.contact?.country,
        },
        social_links: {
          instagram:
            socialForm.instagram || undefined,
          tiktok: socialForm.tiktok || undefined,
          facebook:
            socialForm.facebook || undefined,
          twitter:
            socialForm.twitter || undefined,
          youtube:
            socialForm.youtube || undefined,
        },
      })

      await refreshBusinesses()

      toast(
        'success',
        'Changes saved',
        'Your storefront settings have been updated.'
      )
    } catch (err: unknown) {
      toast(
        'error',
        'Save failed',
        err instanceof Error
          ? err.message
          : 'Please try again.'
      )
    } finally {
      setLoading(false)
    }
  }

  // ── Save payment settings ─────────────────────────────────────────────────

  const handleSavePayments = () => {
    if (!mpesaPaymentMethod) {
      toast(
        'error',
        'Payment method required',
        'Choose one M-Pesa payment method for your business.'
      )
      return
    }

    if (
      mpesaPaymentMethod === 'paybill' &&
      (!paymentForm.paybillNumber ||
        !paymentForm.paybillAccountNumber)
    ) {
      toast(
        'error',
        'PayBill details required',
        'Enter both your PayBill number and account number.'
      )
      return
    }

    if (
      mpesaPaymentMethod === 'till' &&
      !paymentForm.tillNumber
    ) {
      toast(
        'error',
        'Till number required',
        'Enter your M-Pesa Till Number.'
      )
      return
    }

    if (
      mpesaPaymentMethod === 'pochi' &&
      !paymentForm.pochiNumber
    ) {
      toast(
        'error',
        'Pochi number required',
        'Enter your Pochi La Biashara number.'
      )
      return
    }

    if (
      mpesaPaymentMethod === 'send_money' &&
      !paymentForm.sendMoneyNumber
    ) {
      toast(
        'error',
        'M-Pesa number required',
        'Enter the M-Pesa number customers should use.'
      )
      return
    }

    toast(
      'success',
      'Payment method selected',
      'Your M-Pesa payment configuration is ready to be connected to the backend.'
    )
  }

  // ── Publish ───────────────────────────────────────────────────────────────

  const handlePublish = async () => {
    if (!currentBusiness) return

    setPublishing(true)

    try {
      const updated =
        await businessService.publishStorefront(
          currentBusiness.id
        )

      setStorefrontSettings(updated)

      toast(
        'success',
        'Store published',
        'Your storefront is now live.'
      )
    } catch (err: unknown) {
      toast(
        'error',
        'Publish failed',
        err instanceof Error
          ? err.message
          : 'Please try again.'
      )
    } finally {
      setPublishing(false)
    }
  }

  const handleUnpublish = async () => {
    if (!currentBusiness) return

    setPublishing(true)

    try {
      const updated =
        await businessService.unpublishStorefront(
          currentBusiness.id
        )

      setStorefrontSettings(updated)

      toast('success', 'Store taken offline')
    } catch (err: unknown) {
      toast(
        'error',
        'Failed',
        err instanceof Error
          ? err.message
          : 'Please try again.'
      )
    } finally {
      setPublishing(false)
    }
  }

  const tabs = [
    { id: 'preview', label: 'Preview' },
    { id: 'branding', label: 'Branding' },
    { id: 'homepage', label: 'Homepage' },
    { id: 'contact', label: 'Contact' },
    { id: 'social', label: 'Social Media' },
    { id: 'payments', label: 'Payments' },
  ]

  const isPublished =
    storefrontSettings?.isPublished ?? false

  return (
    <div className="space-y-5 fade-in">
      <PageHeader
        title="Storefront"
        subtitle="Manage your public-facing store"
        actions={
          <div className="flex gap-2 flex-wrap">
            <Button
              variant="outline"
              icon={<ExternalLink size={14} />}
              onClick={() =>
                window.open(
                  `/store/${currentBusiness?.slug}`,
                  '_blank'
                )
              }
            >
              View Live Store
            </Button>

            <Button
              variant="secondary"
              loading={loading}
              onClick={handleSave}
            >
              Save Changes
            </Button>

            {isPublished ? (
              <Button
                variant="outline"
                loading={publishing}
                onClick={handleUnpublish}
              >
                Unpublish
              </Button>
            ) : (
              <Button
                variant="gold"
                icon={<Globe size={14} />}
                loading={publishing}
                onClick={handlePublish}
              >
                Publish
              </Button>
            )}
          </div>
        }
      />

      {/* Published indicator */}
      {storefrontSettings && (
        <div
          className={[
            'flex items-center gap-2 px-4 py-2 rounded-[10px] text-[13px] font-medium w-fit',
            isPublished
              ? 'bg-green-light text-green border border-green/20'
              : 'bg-sand text-slate border border-sand-dark',
          ].join(' ')}
        >
          <span
            className={[
              'w-2 h-2 rounded-full',
              isPublished ? 'bg-green' : 'bg-slate',
            ].join(' ')}
          />

          {isPublished
            ? 'Storefront is live'
            : 'Storefront is offline'}

          {storefrontSettings.lastPublishedAt && (
            <span className="text-[12px] opacity-70 ml-1">
              · Last published{' '}
              {new Date(
                storefrontSettings.lastPublishedAt
              ).toLocaleDateString('en-KE')}
            </span>
          )}
        </div>
      )}

      <Tabs
        tabs={tabs}
        activeTab={activeTab}
        onChange={setActiveTab}
        variant="underline"
      />

      {/* ── Preview ──────────────────────────────────────────────────────── */}
      {activeTab === 'preview' && (
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            {[
              {
                id: 'desktop' as const,
                icon: <Monitor size={15} />,
              },
              {
                id: 'tablet' as const,
                icon: <Tablet size={15} />,
              },
              {
                id: 'mobile' as const,
                icon: <Smartphone size={15} />,
              },
            ].map(v => (
              <button
                key={v.id}
                onClick={() => setViewport(v.id)}
                className={[
                  'flex items-center gap-2 px-3 py-2 rounded-[8px] text-[13px] font-semibold border capitalize',
                  viewport === v.id
                    ? 'bg-ink text-ivory border-ink'
                    : 'bg-white border-sand text-slate hover:border-ink hover:text-ink',
                ].join(' ')}
              >
                {v.icon} {v.id}
              </button>
            ))}
          </div>

          <StorefrontPreview
            primary={brandForm.primaryColor}
            accent={brandForm.accentColor}
            name={brandForm.name}
            heading={homeForm.heading}
            subheading={homeForm.subheading}
            ctaText={homeForm.ctaText}
            viewport={viewport}
          />
        </div>
      )}

      {/* ── Branding ─────────────────────────────────────────────────────── */}
      {activeTab === 'branding' && (
        <div className="grid lg:grid-cols-2 gap-5">
          <div className="bg-white border border-sand rounded-[14px] p-5 space-y-5">
            <h3 className="font-serif text-[17px] font-medium text-ink">
              Brand identity
            </h3>

            <Input
              label="Business name"
              value={brandForm.name}
              onChange={e =>
                setBrandForm(p => ({
                  ...p,
                  name: e.target.value,
                }))
              }
            />

            <Input
              label="Motto / tagline"
              value={brandForm.motto}
              onChange={e =>
                setBrandForm(p => ({
                  ...p,
                  motto: e.target.value,
                }))
              }
            />

            <div>
              <label className="block text-[13px] font-semibold text-ink mb-1.5">
                Business logo
              </label>

              <div className="border-2 border-dashed border-sand rounded-[12px] p-6 text-center hover:border-ink/30 cursor-pointer">
                {currentBusiness?.logo ? (
                  <img
                    src={currentBusiness.logo}
                    alt=""
                    className="w-12 h-12 rounded-full mx-auto mb-2 object-cover"
                  />
                ) : (
                  <p className="text-[13px] text-slate">
                    Click to upload logo (PNG, SVG, JPG)
                  </p>
                )}
              </div>
            </div>

            <ColorPicker
              label="Primary colour"
              value={brandForm.primaryColor}
              onChange={v =>
                setBrandForm(p => ({
                  ...p,
                  primaryColor: v,
                }))
              }
            />

            <ColorPicker
              label="Accent colour"
              value={brandForm.accentColor}
              onChange={v =>
                setBrandForm(p => ({
                  ...p,
                  accentColor: v,
                }))
              }
            />
          </div>

          {/* Live colour preview */}
          <div className="bg-white border border-sand rounded-[14px] p-5 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-serif text-[17px] font-medium text-ink">
                Live preview
              </h3>

              <span className="text-[11px] text-slate bg-sand px-2 py-0.5 rounded-full">
                Updates as you type
              </span>
            </div>

            <StorefrontPreview
              primary={brandForm.primaryColor}
              accent={brandForm.accentColor}
              name={brandForm.name}
              heading={homeForm.heading}
              subheading={homeForm.subheading}
              ctaText={homeForm.ctaText}
              viewport="desktop"
            />

            <div className="grid grid-cols-2 gap-2 pt-1">
              <div className="flex items-center gap-2.5 p-3 border border-sand rounded-[10px]">
                <div
                  className="w-8 h-8 rounded-[6px] shrink-0 shadow-sm"
                  style={{
                    background:
                      brandForm.primaryColor,
                  }}
                />

                <div>
                  <p className="text-[11px] font-semibold text-ink">
                    Primary
                  </p>

                  <p className="text-[10px] text-slate font-mono">
                    {brandForm.primaryColor}
                  </p>

                  <p className="text-[9.5px] text-slate/70 mt-0.5">
                    Buttons, hero, banner
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2.5 p-3 border border-sand rounded-[10px]">
                <div
                  className="w-8 h-8 rounded-[6px] shrink-0 shadow-sm"
                  style={{
                    background:
                      brandForm.accentColor,
                  }}
                />

                <div>
                  <p className="text-[11px] font-semibold text-ink">
                    Accent
                  </p>

                  <p className="text-[10px] text-slate font-mono">
                    {brandForm.accentColor}
                  </p>

                  <p className="text-[9.5px] text-slate/70 mt-0.5">
                    Labels, icons, badges
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Homepage ─────────────────────────────────────────────────────── */}
      {activeTab === 'homepage' && (
        <div className="bg-white border border-sand rounded-[14px] p-5 space-y-5">
          <h3 className="font-serif text-[17px] font-medium text-ink">
            Homepage content
          </h3>

          <Input
            label="Hero heading"
            placeholder="e.g. Find Your Signature Scent"
            value={homeForm.heading}
            onChange={e =>
              setHomeForm(p => ({
                ...p,
                heading: e.target.value,
              }))
            }
          />

          <Textarea
            label="Hero subheading"
            placeholder="Supporting text for your hero section."
            value={homeForm.subheading}
            onChange={e =>
              setHomeForm(p => ({
                ...p,
                subheading: e.target.value,
              }))
            }
            rows={3}
          />

          <Input
            label="CTA button text"
            placeholder="e.g. Shop Collection"
            value={homeForm.ctaText}
            onChange={e =>
              setHomeForm(p => ({
                ...p,
                ctaText: e.target.value,
              }))
            }
          />

          <div>
            <label className="block text-[13px] font-semibold text-ink mb-1.5">
              Hero image
            </label>

            <div className="border-2 border-dashed border-sand rounded-[12px] p-6 text-center cursor-pointer hover:border-ink/30">
              <p className="text-[13px] text-slate">
                Upload hero image
              </p>

              <p className="text-[11.5px] text-slate mt-0.5">
                Recommended: 1920×600px
              </p>
            </div>
          </div>

          <Textarea
            label="About your business"
            placeholder="Tell your story to customers visiting your about section."
            value={homeForm.aboutText}
            onChange={e =>
              setHomeForm(p => ({
                ...p,
                aboutText: e.target.value,
              }))
            }
            rows={5}
          />
        </div>
      )}

      {/* ── Contact ──────────────────────────────────────────────────────── */}
      {activeTab === 'contact' && (
        <div className="bg-white border border-sand rounded-[14px] p-5 space-y-5">
          <h3 className="font-serif text-[17px] font-medium text-ink">
            Contact information
          </h3>

          <div className="grid sm:grid-cols-2 gap-4">
            <Input
              label="Phone number"
              value={contactForm.phone}
              onChange={e =>
                setContactForm(p => ({
                  ...p,
                  phone: e.target.value,
                }))
              }
            />

            <Input
              label="WhatsApp number"
              value={contactForm.whatsapp}
              onChange={e =>
                setContactForm(p => ({
                  ...p,
                  whatsapp: e.target.value,
                }))
              }
              helpText="Include country code."
            />
          </div>

          <Input
            label="Email address"
            type="email"
            value={contactForm.email}
            onChange={e =>
              setContactForm(p => ({
                ...p,
                email: e.target.value,
              }))
            }
          />

          <Input
            label="Physical address"
            value={contactForm.address}
            onChange={e =>
              setContactForm(p => ({
                ...p,
                address: e.target.value,
              }))
            }
          />

          <Input
            label="Opening hours"
            placeholder="e.g. Mon–Sat 9am–7pm"
            value={contactForm.openingHours}
            onChange={e =>
              setContactForm(p => ({
                ...p,
                openingHours: e.target.value,
              }))
            }
          />
        </div>
      )}

      {/* ── Social ───────────────────────────────────────────────────────── */}
      {activeTab === 'social' && (
        <div className="bg-white border border-sand rounded-[14px] p-5 space-y-5">
          <h3 className="font-serif text-[17px] font-medium text-ink">
            Social media links
          </h3>

          {[
            {
              key: 'instagram',
              label: 'Instagram',
              prefix: '@',
            },
            {
              key: 'tiktok',
              label: 'TikTok',
              prefix: '@',
            },
            {
              key: 'facebook',
              label: 'Facebook',
              prefix: 'facebook.com/',
            },
            {
              key: 'twitter',
              label: 'X / Twitter',
              prefix: '@',
            },
            {
              key: 'youtube',
              label: 'YouTube',
              prefix: 'youtube.com/',
            },
          ].map(field => (
            <Input
              key={field.key}
              label={field.label}
              placeholder={`${field.prefix}yourhandle`}
              value={(socialForm as any)[field.key]}
              onChange={e =>
                setSocialForm(p => ({
                  ...p,
                  [field.key]: e.target.value,
                }))
              }
              icon={
                <span className="text-[12px] font-bold text-slate">
                  {field.prefix}
                </span>
              }
            />
          ))}
        </div>
      )}

      {/* ── Payments ─────────────────────────────────────────────────────── */}
      {activeTab === 'payments' && (
        <div className="space-y-5">

          {/* Header */}
          <div className="bg-ink rounded-[14px] p-5 text-ivory">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-[10px] bg-white/10 text-ivory flex items-center justify-center shrink-0">
                <CreditCard size={18} />
              </div>

              <div>
                <h3 className="font-serif text-[20px] font-medium text-ivory">
                  Choose your payment method
                </h3>

                <p className="text-[13px] text-ivory/70 mt-1.5 max-w-[650px] leading-relaxed">
                  Choose how customers will pay your business when they
                  place an order through your storefront. You can select
                  one payment method for now. More payment providers will
                  be added in the future.
                </p>
              </div>
            </div>
          </div>

          {/* Payment methods */}
          <div className="bg-white border border-sand rounded-[14px] p-5 space-y-5">
            <div>
              <h3 className="font-serif text-[17px] font-medium text-ink">
                Payment methods
              </h3>

              <p className="text-[12px] text-slate mt-1">
                Select a payment provider for your storefront.
              </p>
            </div>

            {/* M-Pesa provider */}
            <div className="border border-sand rounded-[12px] overflow-hidden">

              {/* M-Pesa dropdown header */}
              <button
                type="button"
                onClick={() =>
                  setMpesaOpen(prev => !prev)
                }
                className="w-full text-left p-4 bg-[#FAFAF8] hover:bg-sand/40 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-[9px] bg-green-light text-green flex items-center justify-center shrink-0">
                    <SmartphoneNfc size={18} />
                  </div>

                  <div className="flex-1">
                    <p className="text-[14px] font-semibold text-ink">
                      M-Pesa
                    </p>

                    <p className="text-[11.5px] text-slate mt-0.5">
                      Accept payments through M-Pesa.
                    </p>
                  </div>

                  <span className="text-[10px] font-semibold px-2 py-1 rounded-full bg-green-light text-green mr-1">
                    Available
                  </span>

                  <ChevronDown
                    size={18}
                    className={[
                      'text-slate transition-transform duration-200',
                      mpesaOpen
                        ? 'rotate-180'
                        : '',
                    ].join(' ')}
                  />
                </div>
              </button>

              {/* M-Pesa dropdown content */}
              {mpesaOpen && (
                <div className="p-4 space-y-3 border-t border-sand">
                  <div>
                    <p className="text-[13px] font-semibold text-ink">
                      Choose your M-Pesa payment method
                    </p>

                    <p className="text-[11.5px] text-slate mt-1">
                      Select only one method. Choosing another option will
                      automatically replace your current selection.
                    </p>
                  </div>

                  {/* PayBill */}
                  <button
                    type="button"
                    onClick={() =>
                      setMpesaPaymentMethod('paybill')
                    }
                    className={[
                      'w-full text-left border rounded-[12px] p-4 transition-all',
                      mpesaPaymentMethod === 'paybill'
                        ? 'border-ink bg-[#FAFAF8]'
                        : 'border-sand bg-white hover:border-ink/30',
                    ].join(' ')}
                  >
                    <div className="flex items-start gap-3">
                      <div
                        className={[
                          'w-5 h-5 rounded-full border flex items-center justify-center mt-0.5 shrink-0',
                          mpesaPaymentMethod === 'paybill'
                            ? 'border-ink bg-ink'
                            : 'border-sand-dark',
                        ].join(' ')}
                      >
                        {mpesaPaymentMethod === 'paybill' && (
                          <Check
                            size={12}
                            className="text-white"
                          />
                        )}
                      </div>

                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <Building2
                            size={16}
                            className="text-ink"
                          />

                          <p className="text-[13px] font-semibold text-ink">
                            PayBill
                          </p>
                        </div>

                        <p className="text-[11.5px] text-slate mt-1">
                          Customers pay using your M-Pesa PayBill
                          number and account reference.
                        </p>
                      </div>
                    </div>
                  </button>

                  {mpesaPaymentMethod === 'paybill' && (
                    <div className="ml-8 pl-3 border-l-2 border-sand space-y-4">
                      <Input
                        label="PayBill number"
                        placeholder="e.g. 174379"
                        value={paymentForm.paybillNumber}
                        onChange={e =>
                          setPaymentForm(p => ({
                            ...p,
                            paybillNumber:
                              e.target.value,
                          }))
                        }
                        helpText="Enter the PayBill number customers will use."
                      />

                      <Input
                        label="Account number / reference"
                        placeholder="e.g. SELLORA"
                        value={
                          paymentForm.paybillAccountNumber
                        }
                        onChange={e =>
                          setPaymentForm(p => ({
                            ...p,
                            paybillAccountNumber:
                              e.target.value,
                          }))
                        }
                        helpText="The account reference used to identify payments."
                      />
                    </div>
                  )}

                  {/* Till Number */}
                  <button
                    type="button"
                    onClick={() =>
                      setMpesaPaymentMethod('till')
                    }
                    className={[
                      'w-full text-left border rounded-[12px] p-4 transition-all',
                      mpesaPaymentMethod === 'till'
                        ? 'border-ink bg-[#FAFAF8]'
                        : 'border-sand bg-white hover:border-ink/30',
                    ].join(' ')}
                  >
                    <div className="flex items-start gap-3">
                      <div
                        className={[
                          'w-5 h-5 rounded-full border flex items-center justify-center mt-0.5 shrink-0',
                          mpesaPaymentMethod === 'till'
                            ? 'border-ink bg-ink'
                            : 'border-sand-dark',
                        ].join(' ')}
                      >
                        {mpesaPaymentMethod === 'till' && (
                          <Check
                            size={12}
                            className="text-white"
                          />
                        )}
                      </div>

                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <SmartphoneNfc
                            size={16}
                            className="text-ink"
                          />

                          <p className="text-[13px] font-semibold text-ink">
                            Till Number
                          </p>
                        </div>

                        <p className="text-[11.5px] text-slate mt-1">
                          Customers pay directly to your M-Pesa Till
                          Number.
                        </p>
                      </div>
                    </div>
                  </button>

                  {mpesaPaymentMethod === 'till' && (
                    <div className="ml-8 pl-3 border-l-2 border-sand">
                      <Input
                        label="Till Number"
                        placeholder="e.g. 1234567"
                        value={paymentForm.tillNumber}
                        onChange={e =>
                          setPaymentForm(p => ({
                            ...p,
                            tillNumber: e.target.value,
                          }))
                        }
                        helpText="Enter your M-Pesa Till Number."
                      />
                    </div>
                  )}

                  {/* Pochi */}
                  <button
                    type="button"
                    onClick={() =>
                      setMpesaPaymentMethod('pochi')
                    }
                    className={[
                      'w-full text-left border rounded-[12px] p-4 transition-all',
                      mpesaPaymentMethod === 'pochi'
                        ? 'border-ink bg-[#FAFAF8]'
                        : 'border-sand bg-white hover:border-ink/30',
                    ].join(' ')}
                  >
                    <div className="flex items-start gap-3">
                      <div
                        className={[
                          'w-5 h-5 rounded-full border flex items-center justify-center mt-0.5 shrink-0',
                          mpesaPaymentMethod === 'pochi'
                            ? 'border-ink bg-ink'
                            : 'border-sand-dark',
                        ].join(' ')}
                      >
                        {mpesaPaymentMethod === 'pochi' && (
                          <Check
                            size={12}
                            className="text-white"
                          />
                        )}
                      </div>

                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <CreditCard
                            size={16}
                            className="text-ink"
                          />

                          <p className="text-[13px] font-semibold text-ink">
                            Pochi La Biashara
                          </p>
                        </div>

                        <p className="text-[11.5px] text-slate mt-1">
                          Receive business payments through Pochi La
                          Biashara.
                        </p>
                      </div>
                    </div>
                  </button>

                  {mpesaPaymentMethod === 'pochi' && (
                    <div className="ml-8 pl-3 border-l-2 border-sand">
                      <Input
                        label="Pochi number"
                        placeholder="e.g. 0712345678"
                        value={paymentForm.pochiNumber}
                        onChange={e =>
                          setPaymentForm(p => ({
                            ...p,
                            pochiNumber: e.target.value,
                          }))
                        }
                        helpText="Enter the M-Pesa number registered for Pochi La Biashara."
                      />
                    </div>
                  )}

                  {/* Send Money */}
                  <button
                    type="button"
                    onClick={() =>
                      setMpesaPaymentMethod('send_money')
                    }
                    className={[
                      'w-full text-left border rounded-[12px] p-4 transition-all',
                      mpesaPaymentMethod === 'send_money'
                        ? 'border-ink bg-[#FAFAF8]'
                        : 'border-sand bg-white hover:border-ink/30',
                    ].join(' ')}
                  >
                    <div className="flex items-start gap-3">
                      <div
                        className={[
                          'w-5 h-5 rounded-full border flex items-center justify-center mt-0.5 shrink-0',
                          mpesaPaymentMethod === 'send_money'
                            ? 'border-ink bg-ink'
                            : 'border-sand-dark',
                        ].join(' ')}
                      >
                        {mpesaPaymentMethod === 'send_money' && (
                          <Check
                            size={12}
                            className="text-white"
                          />
                        )}
                      </div>

                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <Send
                            size={16}
                            className="text-ink"
                          />

                          <p className="text-[13px] font-semibold text-ink">
                            Send Money
                          </p>
                        </div>

                        <p className="text-[11.5px] text-slate mt-1">
                          Use an M-Pesa mobile number as the business
                          payment destination.
                        </p>
                      </div>
                    </div>
                  </button>

                  {mpesaPaymentMethod === 'send_money' && (
                    <div className="ml-8 pl-3 border-l-2 border-sand">
                      <Input
                        label="M-Pesa number"
                        placeholder="e.g. 0712345678"
                        value={paymentForm.sendMoneyNumber}
                        onChange={e =>
                          setPaymentForm(p => ({
                            ...p,
                            sendMoneyNumber:
                              e.target.value,
                          }))
                        }
                        helpText="Enter the M-Pesa number customers should use for payments."
                      />
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Future payment providers */}
            <div className="border border-sand border-dashed rounded-[12px] p-4">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-[9px] bg-sand text-slate flex items-center justify-center">
                  <CreditCard size={17} />
                </div>

                <div className="flex-1">
                  <p className="text-[13px] font-semibold text-ink">
                    More payment methods
                  </p>

                  <p className="text-[11.5px] text-slate mt-0.5">
                    Additional payment providers such as PayPal and
                    other options will be available in the future.
                  </p>
                </div>

                <span className="text-[10px] font-semibold px-2 py-1 rounded-full bg-sand text-slate">
                  Coming soon
                </span>
              </div>
            </div>
          </div>

          {/* Checkout explanation */}
          <div className="bg-ink rounded-[14px] p-5 text-ivory">
            <div className="flex items-start gap-3">
              <div className="w-9 h-9 rounded-[9px] bg-white/10 flex items-center justify-center shrink-0">
                <SmartphoneNfc size={17} />
              </div>

              <div>
                <h3 className="font-serif text-[16px] font-medium">
                  Simple customer checkout
                </h3>

                <p className="text-[12px] text-ivory/65 mt-1.5 leading-relaxed max-w-[700px]">
                  Once your payment method is configured, customers
                  will select the payment option during checkout.
                  Sellora will handle the payment flow using the
                  payment details you have configured for your
                  business.
                </p>
              </div>
            </div>
          </div>

          {/* Save */}
          <div className="flex items-center justify-between bg-white border border-sand rounded-[14px] p-4">
            <div>
              <p className="text-[13px] font-semibold text-ink">
                Payment configuration
              </p>

              <p className="text-[11.5px] text-slate mt-0.5">
                {mpesaPaymentMethod
                  ? `M-Pesa · ${
                      mpesaPaymentMethod === 'paybill'
                        ? 'PayBill'
                        : mpesaPaymentMethod === 'till'
                          ? 'Till Number'
                          : mpesaPaymentMethod === 'pochi'
                            ? 'Pochi La Biashara'
                            : 'Send Money'
                    }`
                  : 'No payment method selected'}
              </p>
            </div>

            <Button
              variant="secondary"
              onClick={handleSavePayments}
            >
              Save Payment Settings
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
