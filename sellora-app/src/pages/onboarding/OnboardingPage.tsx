import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Check, ArrowRight, ArrowLeft, Upload, Globe } from 'lucide-react'
import { Input, Textarea, Select, ColorPicker, Button, useToast } from '@/components/ui'
import { businessService } from '@/services/businessService'
import { useAuth } from '@/context/AuthContext'
import type { BusinessCategory } from '@/types'

const STEPS = ['Business basics', 'Brand identity', 'Contact & social', 'Preview & launch']

const categoryOptions = [
  { value: 'perfumes', label: 'Perfumes & Fragrances' },
  { value: 'cosmetics', label: 'Cosmetics & Skincare' },
  { value: 'fashion', label: 'Fashion & Boutique' },
  { value: 'accessories', label: 'Accessories & Jewellery' },
  { value: 'beauty', label: 'Beauty & Spa' },
  { value: 'gifts', label: 'Gifts & Home Decor' },
  { value: 'electronics', label: 'Electronics' },
  { value: 'other', label: 'Other Retail' },
]

interface FormData {
  name: string
  category: BusinessCategory | ''
  description: string
  motto: string
  primaryColor: string
  accentColor: string
  phone: string
  whatsapp: string
  email: string
  address: string
  city: string
  instagram: string
  facebook: string
  tiktok: string
}

const defaultForm: FormData = {
  name: '',
  category: '',
  description: '',
  motto: '',
  primaryColor: '#C79A3D',
  accentColor: '#3F6B4F',
  phone: '',
  whatsapp: '',
  email: '',
  address: '',
  city: '',
  instagram: '',
  facebook: '',
  tiktok: '',
}

// ── Step indicator ────────────────────────────────────────────────────────────
function StepIndicator({ current, total }: { current: number; total: number }) {
  return (
    <div className="flex items-center gap-2">
      {Array.from({ length: total }).map((_, i) => {
        const done = i < current
        const active = i === current
        return (
          <React.Fragment key={i}>
            <div
              className={[
                'w-8 h-8 rounded-full flex items-center justify-center text-[13px] font-bold transition-all',
                done ? 'bg-ink text-ivory' : active ? 'bg-gold text-ink' : 'bg-sand text-slate',
              ].join(' ')}
            >
              {done ? <Check size={14} /> : i + 1}
            </div>
            {i < total - 1 && (
              <div className={['flex-1 h-0.5 max-w-[40px] transition-colors', done ? 'bg-ink' : 'bg-sand'].join(' ')} />
            )}
          </React.Fragment>
        )
      })}
    </div>
  )
}

// ── Live preview card ─────────────────────────────────────────────────────────
function StorePreviewCard({ form }: { form: FormData }) {
  const name = form.name || 'Your Business'
  const motto = form.motto || 'Your tagline goes here'
  const primary = form.primaryColor

  return (
    <div className="bg-white border border-sand rounded-[16px] overflow-hidden shadow-sm">
      {/* Storefront hero */}
      <div className="px-5 py-5" style={{ background: primary }}>
        <p className="font-serif font-semibold text-white text-[16px]">{name}</p>
        <p className="text-white/75 text-[12px] mt-1">{motto}</p>
        <button
          className="mt-3 px-4 py-1.5 text-[12px] font-semibold rounded-[6px] transition-colors"
          style={{ background: 'rgba(255,255,255,0.2)', color: 'white' }}
        >
          Shop Collection
        </button>
      </div>
      {/* Product placeholders */}
      <div className="grid grid-cols-3 gap-2 p-4">
        {['Product 1', 'Product 2', 'Product 3'].map(p => (
          <div key={p} className="space-y-1.5">
            <div className="bg-sand rounded-[7px] h-[52px]" />
            <p className="text-[10px] font-medium text-ink">{p}</p>
            <p className="text-[10px] text-slate">KSh 2,500</p>
          </div>
        ))}
      </div>
      {/* Contact strip */}
      {form.phone && (
        <div className="px-4 pb-4">
          <div
            className="flex items-center gap-2 px-3 py-2 rounded-[8px] text-[11px] font-semibold"
            style={{ background: `${primary}18`, color: primary }}
          >
            <Globe size={12} />
            {form.city || 'Your city'} · {form.phone}
          </div>
        </div>
      )}
    </div>
  )
}

// ── Step 1: Basics ────────────────────────────────────────────────────────────
function Step1({ form, update }: { form: FormData; update: (k: keyof FormData, v: string) => void }) {
  return (
    <div className="space-y-5">
      <Input
        label="Business name"
        placeholder="e.g. Maison Aura"
        value={form.name}
        onChange={e => update('name', e.target.value)}
        helpText="This is what customers will see on your storefront."
      />
      <Select
        label="Business category"
        options={categoryOptions}
        placeholder="Select a category"
        value={form.category}
        onChange={e => update('category', e.target.value)}
      />
      <Textarea
        label="Short description"
        placeholder="Tell customers what you sell and why they should shop with you."
        value={form.description}
        onChange={e => update('description', e.target.value)}
        rows={4}
        helpText="Keep it under 160 characters for best results."
      />
    </div>
  )
}

// ── Step 2: Brand ─────────────────────────────────────────────────────────────
function Step2({ form, update }: { form: FormData; update: (k: keyof FormData, v: string) => void }) {
  return (
    <div className="space-y-6">
      {/* Logo upload */}
      <div>
        <label className="block text-[13px] font-semibold text-ink mb-1.5">Business logo</label>
        <div className="border-2 border-dashed border-sand rounded-[12px] p-8 flex flex-col items-center justify-center gap-3 hover:border-ink/30 cursor-pointer transition-colors bg-white">
          <div className="w-10 h-10 rounded-[10px] bg-ivory border border-sand flex items-center justify-center">
            <Upload size={18} className="text-slate" />
          </div>
          <div className="text-center">
            <p className="text-[13.5px] font-semibold text-ink">Upload your logo</p>
            <p className="text-[12px] text-slate mt-0.5">PNG, JPG or SVG. Max 2MB.</p>
          </div>
        </div>
      </div>

      <Input
        label="Motto / tagline"
        placeholder="e.g. Find the scent that feels like you."
        value={form.motto}
        onChange={e => update('motto', e.target.value)}
        helpText="A short memorable phrase that captures your brand."
      />

      <ColorPicker
        label="Primary brand colour"
        value={form.primaryColor}
        onChange={v => update('primaryColor', v)}
      />
      <ColorPicker
        label="Accent colour"
        value={form.accentColor}
        onChange={v => update('accentColor', v)}
      />
    </div>
  )
}

// ── Step 3: Contact ───────────────────────────────────────────────────────────
function Step3({ form, update }: { form: FormData; update: (k: keyof FormData, v: string) => void }) {
  return (
    <div className="space-y-5">
      <div className="grid sm:grid-cols-2 gap-4">
        <Input
          label="Phone number"
          placeholder="+254 712 345 678"
          value={form.phone}
          onChange={e => update('phone', e.target.value)}
        />
        <Input
          label="WhatsApp number"
          placeholder="+254712345678"
          value={form.whatsapp}
          onChange={e => update('whatsapp', e.target.value)}
          helpText="Include country code, no spaces."
        />
      </div>
      <Input
        label="Business email"
        type="email"
        placeholder="hello@yourbusiness.co.ke"
        value={form.email}
        onChange={e => update('email', e.target.value)}
      />
      <div className="grid sm:grid-cols-2 gap-4">
        <Input
          label="City"
          placeholder="e.g. Nairobi"
          value={form.city}
          onChange={e => update('city', e.target.value)}
        />
        <Input
          label="Physical address"
          placeholder="e.g. Westgate Mall, Ground Floor"
          value={form.address}
          onChange={e => update('address', e.target.value)}
        />
      </div>
      <div className="pt-2">
        <p className="text-[13px] font-semibold text-ink mb-4">Social media (optional)</p>
        <div className="space-y-3">
          <Input
            label="Instagram"
            placeholder="yourbusiness"
            value={form.instagram}
            onChange={e => update('instagram', e.target.value)}
            icon={<span className="text-[12px] font-bold text-slate">@</span>}
          />
          <Input
            label="TikTok"
            placeholder="yourbusiness"
            value={form.tiktok}
            onChange={e => update('tiktok', e.target.value)}
            icon={<span className="text-[12px] font-bold text-slate">@</span>}
          />
          <Input
            label="Facebook"
            placeholder="yourbusiness"
            value={form.facebook}
            onChange={e => update('facebook', e.target.value)}
          />
        </div>
      </div>
    </div>
  )
}

// ── Step 4: Preview ───────────────────────────────────────────────────────────
function Step4({ form }: { form: FormData }) {
  const slug = form.name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')

  return (
    <div className="space-y-6">
      <div className="bg-green-light border border-green/20 rounded-[12px] p-4">
        <div className="flex items-start gap-3">
          <Check size={16} className="text-green mt-0.5 shrink-0" />
          <div>
            <p className="text-[14px] font-semibold text-ink">Looking good!</p>
            <p className="text-[13px] text-slate mt-0.5">
              Your store will be live at{' '}
              <strong className="text-ink font-mono text-[12px]">
                {slug || 'your-business'}.sellora.co.ke
              </strong>
            </p>
          </div>
        </div>
      </div>

      <div>
        <p className="text-[13px] font-semibold text-slate uppercase tracking-widest mb-4">Store preview</p>
        <StorePreviewCard form={form} />
      </div>

      <div className="bg-white border border-sand rounded-[12px] p-5 space-y-3">
        <p className="text-[13px] font-semibold text-ink">What's next after creating your business?</p>
        {[
          'Add your products with photos and prices',
          'Customise your store\'s homepage content',
          'Share your store link with customers',
          'Track orders and revenue from your dashboard',
        ].map(item => (
          <div key={item} className="flex items-center gap-2.5 text-[13.5px] text-slate">
            <div className="w-1.5 h-1.5 bg-gold rounded-full shrink-0" />
            {item}
          </div>
        ))}
      </div>
    </div>
  )
}

// ── Main onboarding page ──────────────────────────────────────────────────────
export default function OnboardingPage() {
  const [step, setStep] = useState(0)
  const [form, setForm] = useState<FormData>(defaultForm)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const { refreshBusinesses } = useAuth()
  const { toast } = useToast()
  const navigate = useNavigate()

  const update = (key: keyof FormData, value: string) => {
    setForm(prev => ({ ...prev, [key]: value }))
  }

  const canNext = () => {
    if (step === 0) return form.name.trim().length > 0 && form.category !== ''
    return true
  }

  const handleNext = () => {
    if (step < STEPS.length - 1) setStep(s => s + 1)
  }

  const handleBack = () => {
    if (step > 0) setStep(s => s - 1)
  }

  const handleCreate = async () => {
    setLoading(true)
    setError('')
    try {
      await businessService.create({
        name: form.name,
        category: form.category as BusinessCategory,
        description: form.description || undefined,
        motto: form.motto || undefined,
        theme: {
          primaryColor: form.primaryColor,
          primaryHover: form.primaryColor,
          accentColor: form.accentColor,
          backgroundColor: '#FAF8F3',
          textColor: '#171B21',
        },
        contact: {
          phone: form.phone || undefined,
          whatsapp: form.whatsapp || undefined,
          email: form.email || undefined,
          address: form.address || undefined,
          city: form.city || undefined,
          country: 'Kenya',
          openingHours: 'Mon–Sat 9am–6pm',
        },
        hero: {
          heading: `Welcome to ${form.name}`,
          subheading: form.motto || form.description || undefined,
          ctaText: 'Shop Now',
          ctaSecondaryText: 'Explore Products',
        },
        about_text: form.description || undefined,
      })

      await refreshBusinesses()
      toast('success', 'Business created!', `${form.name} is ready.`)
      navigate('/app')
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to create business. Please try again.'
      setError(msg)
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-ivory flex items-center justify-center p-5">
      <div className="w-full max-w-lg">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-2 mb-6">
            <div className="w-7 h-7 rounded-[8px] bg-ink flex items-center justify-center">
              <span className="text-gold font-serif font-bold text-[14px]">S</span>
            </div>
            <span className="font-serif font-semibold text-[18px] text-ink">Sellora</span>
          </div>

          <StepIndicator current={step} total={STEPS.length} />

          <div className="mt-5">
            <h1 className="font-serif text-[26px] font-medium text-ink">{STEPS[step]}</h1>
            <p className="text-[14px] text-slate mt-1">
              Step {step + 1} of {STEPS.length}
            </p>
          </div>
        </div>

        {/* Form card */}
        <div className="bg-white border border-sand rounded-[18px] p-6 mb-5">
          {step === 0 && <Step1 form={form} update={update} />}
          {step === 1 && <Step2 form={form} update={update} />}
          {step === 2 && <Step3 form={form} update={update} />}
          {step === 3 && <Step4 form={form} />}
        </div>

        {/* Navigation */}
        <div className="flex items-center justify-between gap-4">
          {step > 0 ? (
            <button
              onClick={handleBack}
              className="flex items-center gap-2 px-4 py-2.5 text-[14px] font-semibold text-slate hover:text-ink border border-sand rounded-[9px] hover:border-ink transition-colors"
            >
              <ArrowLeft size={15} />
              Back
            </button>
          ) : (
            <div />
          )}

          {step < STEPS.length - 1 ? (
            <Button
              variant="primary"
              onClick={handleNext}
              disabled={!canNext()}
              iconRight={<ArrowRight size={15} />}
            >
              Continue
            </Button>
          ) : (
            <Button
              variant="gold"
              onClick={handleCreate}
              loading={loading}
              iconRight={<ArrowRight size={15} />}
            >
              Create My Business
            </Button>
          )}
        </div>
        {error && (
          <p className="text-center text-[13px] text-red font-medium mt-3">{error}</p>
        )}
      </div>
    </div>
  )
}
