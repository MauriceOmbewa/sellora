import { useState, useEffect, useCallback, useRef } from 'react'
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
  Store,
  AlertTriangle,
  RotateCcw,
  Save,
  Upload,
  X,
  Loader2,
} from 'lucide-react'
import {
  Button,
  Input,
  Textarea,
  Tabs,
  Toggle,
  ColorPicker,
  useToast,
  PageHeader,
  StorefrontStatusCard,
} from '@/components/ui'
import { useAuth } from '@/context/AuthContext'
import { businessService } from '@/services/businessService'
import { uploadService, validateImageAsync } from '@/services/uploadService'
import {
  paymentService,
  type PaymentConfiguration,
} from '@/services/paymentService'
import { ApiError } from '@/services/api'
import { useNavigate, useLocation } from 'react-router-dom'
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
  const navigate = useNavigate()

  const [activeTab, setActiveTab] = useState('preview')
  const [viewport, setViewport] =
    useState<ViewportSize>('desktop')
  const [loading, setLoading] = useState(false)
  const [publishing, setPublishing] = useState(false)
  const [storefrontSettings, setStorefrontSettings] =
    useState<StorefrontSettings | null>(null)
  const [sfLoading, setSfLoading] = useState(false)

  // ── Dirty / unsaved-changes tracking ──────────────────────────────────────
  // We keep a "committed" snapshot of the form values as they existed when
  // the page loaded (or after a successful save). isDirty is true whenever
  // the current form differs from that snapshot.

  const committed = useRef({
    brandForm: {
      name:         currentBusiness?.name ?? '',
      motto:        currentBusiness?.motto ?? '',
      primaryColor: currentBusiness?.theme?.primaryColor ?? '#C79A3D',
      accentColor:  currentBusiness?.theme?.accentColor ?? '#3F6B4F',
    },
    homeForm: {
      heading:    currentBusiness?.hero?.heading ?? '',
      subheading: currentBusiness?.hero?.subheading ?? '',
      ctaText:    currentBusiness?.hero?.ctaText ?? 'Shop Now',
      aboutText:  currentBusiness?.aboutText ?? '',
    },
    contactForm: {
      phone:        currentBusiness?.contact?.phone ?? '',
      whatsapp:     currentBusiness?.contact?.whatsapp ?? '',
      email:        currentBusiness?.contact?.email ?? '',
      address:      currentBusiness?.contact?.address ?? '',
      openingHours: currentBusiness?.contact?.openingHours ?? '',
    },
    socialForm: {
      instagram: currentBusiness?.socialLinks?.instagram ?? '',
      tiktok:    currentBusiness?.socialLinks?.tiktok ?? '',
      facebook:  currentBusiness?.socialLinks?.facebook ?? '',
      twitter:   currentBusiness?.socialLinks?.twitter ?? '',
      youtube:   currentBusiness?.socialLinks?.youtube ?? '',
    },
  })

  const [isDirty, setIsDirty] = useState(false)

  // Show browser unload warning when dirty
  useEffect(() => {
    const handler = (e: BeforeUnloadEvent) => {
      if (isDirty) {
        e.preventDefault()
        e.returnValue = ''
      }
    }
    window.addEventListener('beforeunload', handler)
    return () => window.removeEventListener('beforeunload', handler)
  }, [isDirty])

  // Intercept in-app navigation when dirty.
  // We override navigate() so any attempt to leave shows our modal first.
  const [pendingNav, setPendingNav] = useState<string | null>(null)

  const guardedNavigate = useCallback((to: string) => {
    if (isDirty) {
      setPendingNav(to)
    } else {
      navigate(to)
    }
  }, [isDirty, navigate])

  // Also intercept browser back/forward (popstate) when dirty
  useEffect(() => {
    const handler = (e: PopStateEvent) => {
      if (isDirty) {
        // Push the current state back to prevent the navigation
        window.history.pushState(null, '', location.pathname)
        setPendingNav('__back__')
      }
    }
    window.addEventListener('popstate', handler)
    return () => window.removeEventListener('popstate', handler)
  }, [isDirty, location.pathname])

  // Intercept all in-app link clicks when dirty (catches sidebar NavLinks)
  useEffect(() => {
    if (!isDirty) return
    const handler = (e: MouseEvent) => {
      const target = (e.target as HTMLElement).closest('a')
      if (!target) return
      const href = target.getAttribute('href')
      if (!href || href.startsWith('http') || href.startsWith('#')) return
      // It's an in-app link — intercept
      e.preventDefault()
      e.stopPropagation()
      setPendingNav(href)
    }
    document.addEventListener('click', handler, true) // capture phase
    return () => document.removeEventListener('click', handler, true)
  }, [isDirty])

  // ── Unsaved-changes modal ──────────────────────────────────────────────────
  // Rendered below; controlled by pendingNav


  // ── Payment state ──────────────────────────────────────────────────────────

  const [mpesaPaymentMethod, setMpesaPaymentMethod] =
    useState<MpesaPaymentMethod>(null)

  // Controls whether the M-Pesa provider section is expanded.
  const [mpesaOpen, setMpesaOpen] = useState(false)

  // Saved backend payment configuration.
  const [paymentConfiguration, setPaymentConfiguration] =
    useState<PaymentConfiguration | null>(null)

  const [paymentLoading, setPaymentLoading] = useState(false)
  const [paymentSaving, setPaymentSaving] = useState(false)

  const [paymentForm, setPaymentForm] = useState({
    paybillNumber: '',
    paybillAccountNumber: '',
    tillNumber: '',
    pochiNumber: '',
    sendMoneyNumber: '',
  })

  // ── Editable local state ──────────────────────────────────────────────────

  const [brandForm, _setBrandForm] = useState({
    name: currentBusiness?.name ?? '',
    motto: currentBusiness?.motto ?? '',
    primaryColor:
      currentBusiness?.theme?.primaryColor ?? '#C79A3D',
    accentColor:
      currentBusiness?.theme?.accentColor ?? '#3F6B4F',
  })

  const [homeForm, _setHomeForm] = useState({
    heading: currentBusiness?.hero?.heading ?? '',
    subheading: currentBusiness?.hero?.subheading ?? '',
    ctaText: currentBusiness?.hero?.ctaText ?? 'Shop Now',
    aboutText: currentBusiness?.aboutText ?? '',
  })

  const [contactForm, _setContactForm] = useState({
    phone: currentBusiness?.contact?.phone ?? '',
    whatsapp: currentBusiness?.contact?.whatsapp ?? '',
    email: currentBusiness?.contact?.email ?? '',
    address: currentBusiness?.contact?.address ?? '',
    openingHours:
      currentBusiness?.contact?.openingHours ?? '',
  })

  const [socialForm, _setSocialForm] = useState({
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

  // Dirty-aware setters
  const setBrandForm:   typeof _setBrandForm   = useCallback(fn => { _setBrandForm(fn);   setIsDirty(true) }, [])
  const setHomeForm:    typeof _setHomeForm    = useCallback(fn => { _setHomeForm(fn);    setIsDirty(true) }, [])
  const setContactForm: typeof _setContactForm = useCallback(fn => { _setContactForm(fn); setIsDirty(true) }, [])
  const setSocialForm:  typeof _setSocialForm  = useCallback(fn => { _setSocialForm(fn);  setIsDirty(true) }, [])

  // ── Logo upload state ─────────────────────────────────────────────────────
  // Separate from brandForm because it is uploaded independently (not a text field)

  const [logoUrl, setLogoUrl]           = useState<string>(currentBusiness?.logo ?? '')
  const [logoUploading, setLogoUploading] = useState(false)
  const [logoError, setLogoError]       = useState('')
  const logoFileRef                     = useRef<HTMLInputElement>(null)

  const handleLogoFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setLogoError('')
    const err = await validateImageAsync(file)
    if (err) { setLogoError(err); return }
    setLogoUploading(true)
    try {
      const url = await uploadService.uploadImage(file, 'logos')
      setLogoUrl(url)
      setIsDirty(true)
    } catch (uploadErr: unknown) {
      setLogoError(uploadErr instanceof Error ? uploadErr.message : 'Upload failed')
    } finally {
      setLogoUploading(false)
      if (logoFileRef.current) logoFileRef.current.value = ''
    }
  }

  const handleRemoveLogo = () => {
    setLogoUrl('')
    setIsDirty(true)
  }

  // Sync local state when business changes (e.g. after switching businesses)
  useEffect(() => {
    if (!currentBusiness) return

    const next = {
      brandForm: {
        name:         currentBusiness.name,
        motto:        currentBusiness.motto,
        primaryColor: currentBusiness.theme?.primaryColor ?? '#C79A3D',
        accentColor:  currentBusiness.theme?.accentColor ?? '#3F6B4F',
      },
      homeForm: {
        heading:    currentBusiness.hero?.heading ?? '',
        subheading: currentBusiness.hero?.subheading ?? '',
        ctaText:    currentBusiness.hero?.ctaText ?? 'Shop Now',
        aboutText:  currentBusiness.aboutText ?? '',
      },
      contactForm: {
        phone:        currentBusiness.contact?.phone ?? '',
        whatsapp:     currentBusiness.contact?.whatsapp ?? '',
        email:        currentBusiness.contact?.email ?? '',
        address:      currentBusiness.contact?.address ?? '',
        openingHours: currentBusiness.contact?.openingHours ?? '',
      },
      socialForm: {
        instagram: currentBusiness.socialLinks?.instagram ?? '',
        tiktok:    currentBusiness.socialLinks?.tiktok ?? '',
        facebook:  currentBusiness.socialLinks?.facebook ?? '',
        twitter:   currentBusiness.socialLinks?.twitter ?? '',
        youtube:   currentBusiness.socialLinks?.youtube ?? '',
      },
    }

    committed.current = next
    _setBrandForm(next.brandForm)
    _setHomeForm(next.homeForm)
    _setContactForm(next.contactForm)
    _setSocialForm(next.socialForm)
    setLogoUrl(currentBusiness.logo ?? '')
    setIsDirty(false)
  }, [currentBusiness?.id]) // eslint-disable-line

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

  // ── Load payment configuration ─────────────────────────────────────────────

  useEffect(() => {
    if (!currentBusiness) return

    setPaymentLoading(true)

    paymentService
      .getConfiguration(currentBusiness.id)
      .then(configuration => {
        setPaymentConfiguration(configuration)

        if (configuration.method === 'paybill') {
          setMpesaPaymentMethod('paybill')

          setPaymentForm(prev => ({
            ...prev,
            paybillNumber:
              configuration.paybill_number ?? '',
            paybillAccountNumber:
              configuration.paybill_account_reference ?? '',
            tillNumber: '',
          }))
        } else if (configuration.method === 'till') {
          setMpesaPaymentMethod('till')

          setPaymentForm(prev => ({
            ...prev,
            paybillNumber: '',
            paybillAccountNumber: '',
            tillNumber:
              configuration.till_number ?? '',
          }))
        }
      })
      .catch((err: unknown) => {
        // 404 means the business has not configured
        // a payment method yet.
        if (
          err instanceof ApiError &&
          err.status === 404
        ) {
          setPaymentConfiguration(null)
          setMpesaPaymentMethod(null)

          setPaymentForm(prev => ({
            ...prev,
            paybillNumber: '',
            paybillAccountNumber: '',
            tillNumber: '',
          }))

          return
        }

        toast(
          'error',
          'Payment settings could not be loaded',
          err instanceof Error
            ? err.message
            : 'Please try again.'
        )
      })
      .finally(() => {
        setPaymentLoading(false)
      })
  }, [currentBusiness?.id])

  // ── Save all changes ───────────────────────────────────────────────────────

  const handleSave = async () => {
    if (!currentBusiness) return

    setLoading(true)

    try {
      await businessService.update(currentBusiness.id, {
        name: brandForm.name,
        motto: brandForm.motto,
        logo: logoUrl || undefined,
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
          tiktok:
            socialForm.tiktok || undefined,
          facebook:
            socialForm.facebook || undefined,
          twitter:
            socialForm.twitter || undefined,
          youtube:
            socialForm.youtube || undefined,
        },
      })

      await refreshBusinesses()

      // Mark as clean — snapshot the saved values
      committed.current = { brandForm, homeForm, contactForm, socialForm }
      setIsDirty(false)

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

  // ── Save payment settings ──────────────────────────────────────────────────

  const handleSavePayments = async () => {
    if (!currentBusiness) return

    if (!mpesaPaymentMethod) {
      toast(
        'error',
        'Payment method required',
        'Choose one M-Pesa payment method for your business.'
      )
      return
    }

    // Pochi and Send Money remain frontend-only for now.
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

    // PayBill validation
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

    // Till validation
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

    // Pochi and Send Money are not connected
    // to the backend yet.
    if (
      mpesaPaymentMethod === 'pochi' ||
      mpesaPaymentMethod === 'send_money'
    ) {
      toast(
        'success',
        'Payment method selected',
        'This payment method is currently saved on this page only.'
      )
      return
    }

    setPaymentSaving(true)

    try {
      if (mpesaPaymentMethod === 'paybill') {
        const data = {
          provider: 'mpesa' as const,
          method: 'paybill' as const,
          paybill_number:
            paymentForm.paybillNumber,
          paybill_account_reference:
            paymentForm.paybillAccountNumber,
          till_number: '',
        }

        const configuration =
          paymentConfiguration
            ? await paymentService.updateConfiguration(
                currentBusiness.id,
                data
              )
            : await paymentService.createConfiguration(
                currentBusiness.id,
                data
              )

        setPaymentConfiguration(configuration)

        toast(
          'success',
          'Payment settings saved',
          'Your M-Pesa PayBill configuration has been saved.'
        )
      }

      if (mpesaPaymentMethod === 'till') {
        const data = {
          provider: 'mpesa' as const,
          method: 'till' as const,
          paybill_number: '',
          paybill_account_reference: '',
          till_number:
            paymentForm.tillNumber,
        }

        const configuration =
          paymentConfiguration
            ? await paymentService.updateConfiguration(
                currentBusiness.id,
                data
              )
            : await paymentService.createConfiguration(
                currentBusiness.id,
                data
              )

        setPaymentConfiguration(configuration)

        toast(
          'success',
          'Payment settings saved',
          'Your M-Pesa Till Number configuration has been saved.'
        )
      }
    } catch (err: unknown) {
      toast(
        'error',
        'Payment settings failed',
        err instanceof Error
          ? err.message
          : 'Please try again.'
      )
    } finally {
      setPaymentSaving(false)
    }
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

  // ── Marketplace toggle ─────────────────────────────────────────────────────

  const [marketplaceToggling, setMarketplaceToggling] = useState(false)

  const handleMarketplaceToggle = async (enabled: boolean) => {
    if (!currentBusiness || !storefrontSettings) return
    setMarketplaceToggling(true)
    // Optimistic update
    setStorefrontSettings(prev => prev ? { ...prev, showInMarketplace: enabled } : prev)
    try {
      const updated = await businessService.saveStorefrontSettings(
        currentBusiness.id,
        { show_in_marketplace: enabled },
      )
      setStorefrontSettings(updated)
      toast(
        'success',
        enabled ? 'Now visible in marketplace' : 'Removed from marketplace',
        enabled
          ? 'Your products will appear in the Sellora marketplace.'
          : 'Your products are no longer listed in the shared marketplace.',
      )
    } catch (err: unknown) {
      // Revert on failure
      setStorefrontSettings(prev => prev ? { ...prev, showInMarketplace: !enabled } : prev)
      toast('error', 'Could not update marketplace setting', err instanceof Error ? err.message : 'Please try again.')
    } finally {
      setMarketplaceToggling(false)
    }
  }

  const isPublished =
    storefrontSettings?.isPublished ?? false

  // ── Discard changes ───────────────────────────────────────────────────────

  const handleDiscard = useCallback(() => {
    const c = committed.current
    _setBrandForm(c.brandForm)
    _setHomeForm(c.homeForm)
    _setContactForm(c.contactForm)
    _setSocialForm(c.socialForm)
    setLogoUrl(currentBusiness?.logo ?? '')
    setIsDirty(false)
  }, [currentBusiness?.logo])

  return (
    <div className="space-y-5 fade-in">
      {/* ── Unsaved changes modal ────────────────────────────────────────── */}
      {pendingNav !== null && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-ink/50 backdrop-blur-sm" />
          <div className="relative w-full max-w-[420px] bg-ivory rounded-[20px] shadow-2xl p-7">
            <div className="w-11 h-11 rounded-full bg-gold-light flex items-center justify-center mb-4">
              <AlertTriangle size={20} className="text-gold-deep" />
            </div>
            <h2 className="font-serif text-[22px] text-ink mb-2">Unsaved changes</h2>
            <p className="text-[14px] text-slate leading-relaxed mb-6">
              You've made changes to your storefront settings that haven't been saved yet.
              If you leave now, those changes will be lost.
            </p>
            <div className="flex flex-col gap-2.5">
              <button
                onClick={async () => {
                  const dest = pendingNav
                  setPendingNav(null)
                  await handleSave()
                  if (dest && dest !== '__back__') navigate(dest)
                  else window.history.back()
                }}
                disabled={loading}
                className="w-full flex items-center justify-center gap-2 py-3 bg-gold text-ink text-[14px] font-semibold rounded-[10px] hover:bg-gold-deep transition-colors"
              >
                {loading
                  ? <span className="w-4 h-4 border-2 border-ink/20 border-t-ink rounded-full animate-spin" />
                  : <Save size={14} />
                }
                Save changes &amp; leave
              </button>
              <button
                onClick={() => {
                  const dest = pendingNav
                  setPendingNav(null)
                  handleDiscard()
                  if (dest && dest !== '__back__') navigate(dest)
                  else window.history.back()
                }}
                className="w-full flex items-center justify-center gap-2 py-3 bg-white border border-sand text-ink text-[14px] font-semibold rounded-[10px] hover:border-ink transition-colors"
              >
                <RotateCcw size={14} />
                Discard changes &amp; leave
              </button>
              <button
                onClick={() => setPendingNav(null)}
                className="w-full py-3 text-[14px] font-medium text-slate hover:text-ink transition-colors"
              >
                Stay on this page
              </button>
            </div>
          </div>
        </div>
      )}
      <PageHeader
        title="Storefront"
        subtitle="Manage your public-facing store"
        actions={
          <div className="flex gap-2 flex-wrap">
            {isPublished && (
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
                View Live
              </Button>
            )}

            <Button
              variant={isDirty ? 'gold' : 'secondary'}
              loading={loading}
              onClick={handleSave}
            >
              {isDirty ? '● Save Changes' : 'Save Changes'}
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

      {/* Storefront status card — always visible */}
      <StorefrontStatusCard
        slug={currentBusiness?.slug ?? ''}
        name={currentBusiness?.name ?? ''}
        isPublished={isPublished}
        isLoading={sfLoading && !storefrontSettings}
        onPublish={isPublished ? undefined : handlePublish}
        publishing={publishing}
      />

      {/* Sticky unsaved-changes bar */}
      {isDirty && (
        <div className="sticky top-0 z-30 flex items-center justify-between gap-4 bg-gold border border-gold-deep rounded-[12px] px-5 py-3 shadow-md">
          <div className="flex items-center gap-2.5">
            <div className="w-2 h-2 rounded-full bg-ink animate-pulse shrink-0" />
            <p className="text-[13.5px] font-semibold text-ink">
              You have unsaved changes
            </p>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={handleDiscard}
              className="flex items-center gap-1.5 px-3.5 py-2 text-[12.5px] font-semibold text-ink/70 bg-white/40 hover:bg-white/60 rounded-[8px] transition-colors"
            >
              <RotateCcw size={13} /> Discard
            </button>
            <button
              onClick={handleSave}
              disabled={loading}
              className="flex items-center gap-1.5 px-4 py-2 text-[12.5px] font-semibold bg-ink text-ivory rounded-[8px] hover:bg-ink-soft transition-colors disabled:opacity-60"
            >
              {loading
                ? <span className="w-3 h-3 border-2 border-ivory/20 border-t-ivory rounded-full animate-spin" />
                : <Save size={13} />
              }
              Save
            </button>
          </div>
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

          {/* ── Marketplace visibility card */}
          {storefrontSettings && (
            <div className="bg-white border border-sand rounded-[14px] p-5">
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-start gap-3">
                  <div className="w-9 h-9 rounded-[10px] bg-gold-light flex items-center justify-center shrink-0 mt-0.5">
                    <Store size={16} className="text-gold-deep" />
                  </div>
                  <div>
                    <p className="text-[14px] font-semibold text-ink">
                      Sellora Marketplace
                    </p>
                    <p className="text-[13px] text-slate mt-0.5 max-w-lg">
                      When on, your products appear in the shared Sellora marketplace where shoppers discover vendors.
                      Turn off to keep your storefront live but out of the marketplace feed.
                    </p>
                  </div>
                </div>
                <Toggle
                  checked={storefrontSettings.showInMarketplace}
                  onChange={handleMarketplaceToggle}
                  disabled={marketplaceToggling || !isPublished}
                  size="md"
                />
              </div>
              {!isPublished && (
                <p className="mt-3 ml-12 text-[12px] text-slate">
                  Publish your storefront first to enable marketplace visibility.
                </p>
              )}
            </div>
          )}
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

              <div
                onClick={() => !logoUploading && logoFileRef.current?.click()}
                className={[
                  'relative border-2 border-dashed rounded-[12px] transition-colors bg-white',
                  logoUploading ? 'border-sand cursor-not-allowed' : 'border-sand hover:border-ink/40 cursor-pointer',
                  logoUrl ? 'p-4' : 'p-6',
                ].join(' ')}
              >
                {logoUrl ? (
                  <div className="flex items-center gap-4">
                    <img
                      src={logoUrl}
                      alt="Business logo"
                      className="w-14 h-14 rounded-[10px] object-cover border border-sand shrink-0"
                    />
                    <div className="flex-1">
                      <p className="text-[13.5px] font-semibold text-ink">Logo uploaded</p>
                      <p className="text-[12px] text-slate mt-0.5">Click to replace · changes saved with "Save Changes"</p>
                    </div>
                    <button
                      type="button"
                      onClick={e => { e.stopPropagation(); handleRemoveLogo() }}
                      className="w-7 h-7 rounded-full bg-sand flex items-center justify-center hover:bg-red-light hover:text-red transition-colors shrink-0"
                      aria-label="Remove logo"
                    >
                      <X size={13} />
                    </button>
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center gap-3">
                    <div className="w-10 h-10 rounded-[10px] bg-ivory border border-sand flex items-center justify-center">
                      {logoUploading
                        ? <Loader2 size={18} className="text-slate animate-spin" />
                        : <Upload size={18} className="text-slate" />}
                    </div>
                    <div className="text-center">
                      <p className="text-[13.5px] font-semibold text-ink">
                        {logoUploading ? 'Uploading…' : 'Upload your logo'}
                      </p>
                      <p className="text-[12px] text-slate mt-0.5">
                        JPEG, PNG, WebP · max 5 MB · optional
                      </p>
                    </div>
                  </div>
                )}
              </div>

              {logoError && (
                <p className="text-[12px] text-red mt-1.5">{logoError}</p>
              )}

              <input
                ref={logoFileRef}
                type="file"
                accept="image/jpeg,image/png,image/webp,image/gif"
                className="hidden"
                onChange={handleLogoFile}
              />
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

          {/* Payment loading */}
          {paymentLoading && (
            <div className="bg-sand/40 border border-sand rounded-[10px] px-4 py-3 text-[12px] text-slate">
              Loading payment configuration...
            </div>
          )}

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
              loading={paymentSaving}
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