import { useState, useEffect } from 'react'
import { ExternalLink, Monitor, Tablet, Smartphone, Globe } from 'lucide-react'
import { Button, Input, Textarea, Tabs, ColorPicker, useToast, PageHeader, Skeleton } from '@/components/ui'
import { useAuth } from '@/context/AuthContext'
import { businessService } from '@/services/businessService'
import type { StorefrontSettings } from '@/types'

type ViewportSize = 'desktop' | 'tablet' | 'mobile'

// ── Storefront preview card ───────────────────────────────────────────────────

function StorefrontPreview({ primary, name, heading, subheading, ctaText, viewport }: {
  primary: string; name: string; heading: string; subheading: string; ctaText: string; viewport: ViewportSize
}) {
  const maxW = viewport === 'desktop' ? '100%' : viewport === 'tablet' ? '768px' : '375px'
  return (
    <div className="flex justify-center overflow-hidden rounded-[12px] border border-sand bg-ivory/50 p-3" style={{ minHeight: 480 }}>
      <div className="bg-white rounded-[8px] overflow-hidden border border-sand shadow-sm w-full transition-all duration-300" style={{ maxWidth: maxW }}>
        {/* Nav */}
        <div className="flex items-center justify-between px-5 py-3 border-b border-sand">
          <div className="flex items-center gap-2">
            <div className="w-5 h-5 rounded-full" style={{ background: primary }} />
            <span className="font-serif font-semibold text-[14px] text-ink">{name || 'Your Store'}</span>
          </div>
          {viewport !== 'mobile' && (
            <div className="flex gap-4 text-[11px] text-slate">
              {['Home', 'Shop', 'About', 'Contact'].map(l => <span key={l}>{l}</span>)}
            </div>
          )}
        </div>
        {/* Hero */}
        <div className="px-5 py-10 text-center" style={{ background: primary }}>
          <h2 className="font-serif text-white text-[20px] mb-2">{heading || 'Welcome to our store'}</h2>
          <p className="text-white/80 text-[12px] mb-4">{subheading || 'Discover our collection'}</p>
          <button className="px-5 py-2 bg-white text-[12px] font-semibold rounded-[6px]" style={{ color: primary }}>
            {ctaText || 'Shop Now'}
          </button>
        </div>
        {/* Product placeholders */}
        <div className="p-4">
          <p className="text-[11px] font-semibold text-slate uppercase tracking-widest mb-3">Featured Products</p>
          <div className={['grid gap-3', viewport === 'mobile' ? 'grid-cols-2' : 'grid-cols-3'].join(' ')}>
            {['Product 1', 'Product 2', 'Product 3'].slice(0, viewport === 'mobile' ? 2 : 3).map(p => (
              <div key={p} className="border border-sand rounded-[8px] overflow-hidden">
                <div className="bg-sand h-24" />
                <div className="p-2">
                  <p className="text-[11px] font-semibold text-ink">{p}</p>
                  <p className="text-[10px] text-slate mt-0.5">KSh 4,800</p>
                </div>
              </div>
            ))}
          </div>
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
  const [viewport, setViewport] = useState<ViewportSize>('desktop')
  const [loading, setLoading] = useState(false)
  const [publishing, setPublishing] = useState(false)
  const [storefrontSettings, setStorefrontSettings] = useState<StorefrontSettings | null>(null)
  const [sfLoading, setSfLoading] = useState(false)

  // ── Editable local state ──────────────────────────────────────────────────
  const [brandForm, setBrandForm] = useState({
    name:         currentBusiness?.name ?? '',
    motto:        currentBusiness?.motto ?? '',
    primaryColor: currentBusiness?.theme?.primaryColor ?? '#C79A3D',
    accentColor:  currentBusiness?.theme?.accentColor ?? '#3F6B4F',
  })
  const [homeForm, setHomeForm] = useState({
    heading:    currentBusiness?.hero?.heading ?? '',
    subheading: currentBusiness?.hero?.subheading ?? '',
    ctaText:    currentBusiness?.hero?.ctaText ?? 'Shop Now',
    aboutText:  currentBusiness?.aboutText ?? '',
  })
  const [contactForm, setContactForm] = useState({
    phone:        currentBusiness?.contact?.phone ?? '',
    whatsapp:     currentBusiness?.contact?.whatsapp ?? '',
    email:        currentBusiness?.contact?.email ?? '',
    address:      currentBusiness?.contact?.address ?? '',
    openingHours: currentBusiness?.contact?.openingHours ?? '',
  })
  const [socialForm, setSocialForm] = useState({
    instagram: currentBusiness?.socialLinks?.instagram ?? '',
    tiktok:    currentBusiness?.socialLinks?.tiktok ?? '',
    facebook:  currentBusiness?.socialLinks?.facebook ?? '',
    twitter:   currentBusiness?.socialLinks?.twitter ?? '',
    youtube:   currentBusiness?.socialLinks?.youtube ?? '',
  })

  // Sync local state when business changes
  useEffect(() => {
    if (!currentBusiness) return
    setBrandForm({
      name:         currentBusiness.name,
      motto:        currentBusiness.motto,
      primaryColor: currentBusiness.theme?.primaryColor ?? '#C79A3D',
      accentColor:  currentBusiness.theme?.accentColor ?? '#3F6B4F',
    })
    setHomeForm({
      heading:    currentBusiness.hero?.heading ?? '',
      subheading: currentBusiness.hero?.subheading ?? '',
      ctaText:    currentBusiness.hero?.ctaText ?? 'Shop Now',
      aboutText:  currentBusiness.aboutText ?? '',
    })
    setContactForm({
      phone:        currentBusiness.contact?.phone ?? '',
      whatsapp:     currentBusiness.contact?.whatsapp ?? '',
      email:        currentBusiness.contact?.email ?? '',
      address:      currentBusiness.contact?.address ?? '',
      openingHours: currentBusiness.contact?.openingHours ?? '',
    })
    setSocialForm({
      instagram: currentBusiness.socialLinks?.instagram ?? '',
      tiktok:    currentBusiness.socialLinks?.tiktok ?? '',
      facebook:  currentBusiness.socialLinks?.facebook ?? '',
      twitter:   currentBusiness.socialLinks?.twitter ?? '',
      youtube:   currentBusiness.socialLinks?.youtube ?? '',
    })
  }, [currentBusiness?.id])

  // Load storefront section toggles
  useEffect(() => {
    if (!currentBusiness || storefrontSettings) return
    setSfLoading(true)
    businessService.getStorefrontSettings(currentBusiness.id)
      .then(setStorefrontSettings)
      .catch(() => { /* non-critical */ })
      .finally(() => setSfLoading(false))
  }, [currentBusiness?.id])

  // ── Save all changes (branding + hero + contact + social in one PATCH) ────

  const handleSave = async () => {
    if (!currentBusiness) return
    setLoading(true)
    try {
      await businessService.update(currentBusiness.id, {
        name:  brandForm.name,
        motto: brandForm.motto,
        theme: {
          primaryColor: brandForm.primaryColor,
          primaryHover: brandForm.primaryColor,
          accentColor:  brandForm.accentColor,
          backgroundColor: currentBusiness.theme?.backgroundColor ?? '#FAF8F3',
          textColor:       currentBusiness.theme?.textColor ?? '#171B21',
        },
        hero: {
          heading:          homeForm.heading,
          subheading:       homeForm.subheading,
          ctaText:          homeForm.ctaText,
          ctaSecondaryText: currentBusiness.hero?.ctaSecondaryText,
        },
        about_text:   homeForm.aboutText,
        contact: {
          phone:        contactForm.phone,
          whatsapp:     contactForm.whatsapp,
          email:        contactForm.email,
          address:      contactForm.address,
          openingHours: contactForm.openingHours,
          city:         currentBusiness.contact?.city,
          country:      currentBusiness.contact?.country,
        },
        social_links: {
          instagram: socialForm.instagram || undefined,
          tiktok:    socialForm.tiktok || undefined,
          facebook:  socialForm.facebook || undefined,
          twitter:   socialForm.twitter || undefined,
          youtube:   socialForm.youtube || undefined,
        },
      })
      await refreshBusinesses()
      toast('success', 'Changes saved', 'Your storefront settings have been updated.')
    } catch (err: unknown) {
      toast('error', 'Save failed', err instanceof Error ? err.message : 'Please try again.')
    } finally {
      setLoading(false)
    }
  }

  // ── Publish ───────────────────────────────────────────────────────────────

  const handlePublish = async () => {
    if (!currentBusiness) return
    setPublishing(true)
    try {
      const updated = await businessService.publishStorefront(currentBusiness.id)
      setStorefrontSettings(updated)
      toast('success', 'Store published', 'Your storefront is now live.')
    } catch (err: unknown) {
      toast('error', 'Publish failed', err instanceof Error ? err.message : 'Please try again.')
    } finally {
      setPublishing(false)
    }
  }

  const handleUnpublish = async () => {
    if (!currentBusiness) return
    setPublishing(true)
    try {
      const updated = await businessService.unpublishStorefront(currentBusiness.id)
      setStorefrontSettings(updated)
      toast('success', 'Store taken offline')
    } catch (err: unknown) {
      toast('error', 'Failed', err instanceof Error ? err.message : 'Please try again.')
    } finally {
      setPublishing(false)
    }
  }

  const tabs = [
    { id: 'preview',   label: 'Preview' },
    { id: 'branding',  label: 'Branding' },
    { id: 'homepage',  label: 'Homepage' },
    { id: 'contact',   label: 'Contact' },
    { id: 'social',    label: 'Social Media' },
  ]

  const isPublished = storefrontSettings?.isPublished ?? false

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
              onClick={() => window.open(`/store/${currentBusiness?.slug}`, '_blank')}
            >
              View Live Store
            </Button>
            <Button variant="secondary" loading={loading} onClick={handleSave}>
              Save Changes
            </Button>
            {isPublished ? (
              <Button variant="outline" loading={publishing} onClick={handleUnpublish}>
                Unpublish
              </Button>
            ) : (
              <Button variant="gold" icon={<Globe size={14} />} loading={publishing} onClick={handlePublish}>
                Publish
              </Button>
            )}
          </div>
        }
      />

      {/* Published indicator */}
      {storefrontSettings && (
        <div className={[
          'flex items-center gap-2 px-4 py-2 rounded-[10px] text-[13px] font-medium w-fit',
          isPublished
            ? 'bg-green-light text-green border border-green/20'
            : 'bg-sand text-slate border border-sand-dark',
        ].join(' ')}>
          <span className={['w-2 h-2 rounded-full', isPublished ? 'bg-green' : 'bg-slate'].join(' ')} />
          {isPublished ? 'Storefront is live' : 'Storefront is offline'}
          {storefrontSettings.lastPublishedAt && (
            <span className="text-[12px] opacity-70 ml-1">
              · Last published {new Date(storefrontSettings.lastPublishedAt).toLocaleDateString('en-KE')}
            </span>
          )}
        </div>
      )}

      <Tabs tabs={tabs} activeTab={activeTab} onChange={setActiveTab} variant="underline" />

      {/* ── Preview ──────────────────────────────────────────────────────── */}
      {activeTab === 'preview' && (
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            {([
              { id: 'desktop' as const, icon: <Monitor size={15} /> },
              { id: 'tablet'  as const, icon: <Tablet size={15} /> },
              { id: 'mobile'  as const, icon: <Smartphone size={15} /> },
            ]).map(v => (
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
            <h3 className="font-serif text-[17px] font-medium text-ink">Brand identity</h3>
            <Input
              label="Business name"
              value={brandForm.name}
              onChange={e => setBrandForm(p => ({ ...p, name: e.target.value }))}
            />
            <Input
              label="Motto / tagline"
              value={brandForm.motto}
              onChange={e => setBrandForm(p => ({ ...p, motto: e.target.value }))}
            />
            <div>
              <label className="block text-[13px] font-semibold text-ink mb-1.5">Business logo</label>
              <div className="border-2 border-dashed border-sand rounded-[12px] p-6 text-center hover:border-ink/30 cursor-pointer">
                {currentBusiness?.logo ? (
                  <img src={currentBusiness.logo} alt="" className="w-12 h-12 rounded-full mx-auto mb-2 object-cover" />
                ) : (
                  <p className="text-[13px] text-slate">Click to upload logo (PNG, SVG, JPG)</p>
                )}
              </div>
            </div>
            <ColorPicker
              label="Primary colour"
              value={brandForm.primaryColor}
              onChange={v => setBrandForm(p => ({ ...p, primaryColor: v }))}
            />
            <ColorPicker
              label="Accent colour"
              value={brandForm.accentColor}
              onChange={v => setBrandForm(p => ({ ...p, accentColor: v }))}
            />
          </div>

          {/* Live colour preview */}
          <div className="bg-white border border-sand rounded-[14px] p-5">
            <h3 className="font-serif text-[17px] font-medium text-ink mb-4">Colour preview</h3>
            <div className="space-y-3">
              <div className="rounded-[10px] p-4 text-white" style={{ background: brandForm.primaryColor }}>
                <p className="font-semibold text-[14px]">Primary — {brandForm.primaryColor}</p>
                <p className="text-[12px] opacity-80 mt-0.5">Hero section, CTAs, highlights</p>
              </div>
              <div className="rounded-[10px] p-4 text-white" style={{ background: brandForm.accentColor }}>
                <p className="font-semibold text-[14px]">Accent — {brandForm.accentColor}</p>
                <p className="text-[12px] opacity-80 mt-0.5">Links, active states, badges</p>
              </div>
              <button
                className="w-full py-3 rounded-[10px] font-semibold text-[14px] text-white"
                style={{ background: brandForm.primaryColor }}
              >
                Button preview
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Homepage ─────────────────────────────────────────────────────── */}
      {activeTab === 'homepage' && (
        <div className="bg-white border border-sand rounded-[14px] p-5 space-y-5">
          <h3 className="font-serif text-[17px] font-medium text-ink">Homepage content</h3>
          <Input
            label="Hero heading"
            placeholder="e.g. Find Your Signature Scent"
            value={homeForm.heading}
            onChange={e => setHomeForm(p => ({ ...p, heading: e.target.value }))}
          />
          <Textarea
            label="Hero subheading"
            placeholder="Supporting text for your hero section."
            value={homeForm.subheading}
            onChange={e => setHomeForm(p => ({ ...p, subheading: e.target.value }))}
            rows={3}
          />
          <Input
            label="CTA button text"
            placeholder="e.g. Shop Collection"
            value={homeForm.ctaText}
            onChange={e => setHomeForm(p => ({ ...p, ctaText: e.target.value }))}
          />
          <div>
            <label className="block text-[13px] font-semibold text-ink mb-1.5">Hero image</label>
            <div className="border-2 border-dashed border-sand rounded-[12px] p-6 text-center cursor-pointer hover:border-ink/30">
              <p className="text-[13px] text-slate">Upload hero image</p>
              <p className="text-[11.5px] text-slate mt-0.5">Recommended: 1920×600px</p>
            </div>
          </div>
          <Textarea
            label="About your business"
            placeholder="Tell your story to customers visiting your about section."
            value={homeForm.aboutText}
            onChange={e => setHomeForm(p => ({ ...p, aboutText: e.target.value }))}
            rows={5}
          />
        </div>
      )}

      {/* ── Contact ──────────────────────────────────────────────────────── */}
      {activeTab === 'contact' && (
        <div className="bg-white border border-sand rounded-[14px] p-5 space-y-5">
          <h3 className="font-serif text-[17px] font-medium text-ink">Contact information</h3>
          <div className="grid sm:grid-cols-2 gap-4">
            <Input label="Phone number" value={contactForm.phone} onChange={e => setContactForm(p => ({ ...p, phone: e.target.value }))} />
            <Input label="WhatsApp number" value={contactForm.whatsapp} onChange={e => setContactForm(p => ({ ...p, whatsapp: e.target.value }))} helpText="Include country code." />
          </div>
          <Input label="Email address" type="email" value={contactForm.email} onChange={e => setContactForm(p => ({ ...p, email: e.target.value }))} />
          <Input label="Physical address" value={contactForm.address} onChange={e => setContactForm(p => ({ ...p, address: e.target.value }))} />
          <Input label="Opening hours" placeholder="e.g. Mon–Sat 9am–7pm" value={contactForm.openingHours} onChange={e => setContactForm(p => ({ ...p, openingHours: e.target.value }))} />
        </div>
      )}

      {/* ── Social ───────────────────────────────────────────────────────── */}
      {activeTab === 'social' && (
        <div className="bg-white border border-sand rounded-[14px] p-5 space-y-5">
          <h3 className="font-serif text-[17px] font-medium text-ink">Social media links</h3>
          {[
            { key: 'instagram', label: 'Instagram',  prefix: '@' },
            { key: 'tiktok',    label: 'TikTok',     prefix: '@' },
            { key: 'facebook',  label: 'Facebook',   prefix: 'facebook.com/' },
            { key: 'twitter',   label: 'X / Twitter', prefix: '@' },
            { key: 'youtube',   label: 'YouTube',    prefix: 'youtube.com/' },
          ].map(field => (
            <Input
              key={field.key}
              label={field.label}
              placeholder={`${field.prefix}yourhandle`}
              value={(socialForm as any)[field.key]}
              onChange={e => setSocialForm(p => ({ ...p, [field.key]: e.target.value }))}
              icon={<span className="text-[12px] font-bold text-slate">{field.prefix}</span>}
            />
          ))}
        </div>
      )}
    </div>
  )
}
