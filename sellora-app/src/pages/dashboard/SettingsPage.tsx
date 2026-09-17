import { useState, useEffect } from 'react'
import { Tabs, Input, Textarea, Select, Toggle, Button, PageHeader, Avatar, useToast, Skeleton } from '@/components/ui'
import { useAuth } from '@/context/AuthContext'
import { businessService } from '@/services/businessService'
import { whatsappService } from '@/services/remainingServices'
import type { BusinessSettingsApiObject } from '@/services/businessService'
import type { WaSettings } from '@/types'

export default function SettingsPage() {
  const { user, currentBusiness, refreshBusinesses } = useAuth()
  const { toast } = useToast()
  const [activeTab, setActiveTab] = useState('business')

  // ── Business profile form ─────────────────────────────────────────────────
  const [bizLoading, setBizLoading] = useState(false)
  const [bizForm, setBizForm] = useState({
    name:         currentBusiness?.name ?? '',
    category:     currentBusiness?.category ?? '',
    description:  currentBusiness?.description ?? '',
    phone:        currentBusiness?.contact?.phone ?? '',
    email:        currentBusiness?.contact?.email ?? '',
    address:      currentBusiness?.contact?.address ?? '',
    city:         currentBusiness?.contact?.city ?? '',
    openingHours: currentBusiness?.contact?.openingHours ?? '',
  })

  // Sync form when business changes
  useEffect(() => {
    if (!currentBusiness) return
    setBizForm({
      name:         currentBusiness.name,
      category:     currentBusiness.category,
      description:  currentBusiness.description,
      phone:        currentBusiness.contact?.phone ?? '',
      email:        currentBusiness.contact?.email ?? '',
      address:      currentBusiness.contact?.address ?? '',
      city:         currentBusiness.contact?.city ?? '',
      openingHours: currentBusiness.contact?.openingHours ?? '',
    })
  }, [currentBusiness?.id])

  const handleSaveBusiness = async () => {
    if (!currentBusiness) return
    setBizLoading(true)
    try {
      await businessService.update(currentBusiness.id, {
        name:        bizForm.name,
        category:    bizForm.category as any,
        description: bizForm.description,
        contact: {
          phone:        bizForm.phone,
          email:        bizForm.email,
          address:      bizForm.address,
          city:         bizForm.city,
          openingHours: bizForm.openingHours,
        },
      })
      await refreshBusinesses()
      toast('success', 'Profile saved', 'Business details updated.')
    } catch (err: unknown) {
      toast('error', 'Save failed', err instanceof Error ? err.message : 'Please try again.')
    } finally {
      setBizLoading(false)
    }
  }

  // ── Notification settings ─────────────────────────────────────────────────
  const [notifSettings, setNotifSettings] = useState<BusinessSettingsApiObject | null>(null)
  const [notifLoading, setNotifLoading] = useState(false)
  const [notifSaving, setNotifSaving] = useState(false)

  useEffect(() => {
    if (activeTab !== 'notifications' || !currentBusiness || notifSettings) return
    setNotifLoading(true)
    businessService.getSettings(currentBusiness.id)
      .then(setNotifSettings)
      .catch(() => toast('error', 'Failed to load settings'))
      .finally(() => setNotifLoading(false))
  }, [activeTab, currentBusiness?.id])

  const handleSaveNotif = async () => {
    if (!currentBusiness || !notifSettings) return
    setNotifSaving(true)
    try {
      const updated = await businessService.updateSettings(currentBusiness.id, {
        email_on_new_order:  notifSettings.email_on_new_order,
        email_on_low_stock:  notifSettings.email_on_low_stock,
        email_on_new_message: notifSettings.email_on_new_message,
        sms_on_new_order:    notifSettings.sms_on_new_order,
        currency:            notifSettings.currency,
        timezone:            notifSettings.timezone,
        language:            notifSettings.language,
      })
      setNotifSettings(updated)
      toast('success', 'Preferences saved')
    } catch {
      toast('error', 'Save failed', 'Please try again.')
    } finally {
      setNotifSaving(false)
    }
  }

  // ── WhatsApp integration ──────────────────────────────────────────────────
  const [waSettings, setWaSettings]   = useState<WaSettings | null>(null)
  const [waLoading, setWaLoading]     = useState(false)
  const [waSaving, setWaSaving]       = useState(false)
  const [waDisconnecting, setWaDisconnecting] = useState(false)
  const [waForm, setWaForm] = useState({
    phone_number:        '',
    phone_number_id:     '',
    waba_id:             '',
    access_token:        '',
    webhook_verify_token: '',
  })

  useEffect(() => {
    if (activeTab !== 'whatsapp' || !currentBusiness || waSettings !== null) return
    setWaLoading(true)
    whatsappService.getSettings(currentBusiness.id)
      .then(s => {
        setWaSettings(s)
        if (s) {
          setWaForm({
            phone_number:        s.phoneNumber,
            phone_number_id:     s.phoneNumberId,
            waba_id:             s.wabaId,
            access_token:        '',           // never pre-fill the token
            webhook_verify_token: s.webhookVerifyToken,
          })
        }
      })
      .catch(() => toast('error', 'Failed to load WhatsApp settings'))
      .finally(() => setWaLoading(false))
  }, [activeTab, currentBusiness?.id]) // eslint-disable-line

  const handleSaveWhatsApp = async () => {
    if (!currentBusiness) return
    setWaSaving(true)
    try {
      const saved = await whatsappService.saveSettings(currentBusiness.id, waForm)
      setWaSettings(saved)
      setWaForm(f => ({ ...f, access_token: '' })) // clear token field after save
      toast('success', 'WhatsApp connected', `+${saved.phoneNumber} is now active.`)
    } catch {
      toast('error', 'Connection failed', 'Check your credentials and try again.')
    } finally {
      setWaSaving(false)
    }
  }

  const handleDisconnectWhatsApp = async () => {
    if (!currentBusiness) return
    if (!confirm('Disconnect WhatsApp? Incoming messages will stop being received.')) return
    setWaDisconnecting(true)
    try {
      await whatsappService.disconnect(currentBusiness.id)
      setWaSettings(null)
      setWaForm({ phone_number: '', phone_number_id: '', waba_id: '', access_token: '', webhook_verify_token: '' })
      toast('success', 'WhatsApp disconnected')
    } catch {
      toast('error', 'Disconnect failed')
    } finally {
      setWaDisconnecting(false)
    }
  }

  const categoryOptions = [
    { value: 'perfumes',     label: 'Perfumes & Fragrances' },
    { value: 'cosmetics',    label: 'Cosmetics & Skincare' },
    { value: 'fashion',      label: 'Fashion & Boutique' },
    { value: 'accessories',  label: 'Accessories & Jewellery' },
    { value: 'beauty',       label: 'Beauty & Spa' },
    { value: 'gifts',        label: 'Gifts' },
    { value: 'electronics',  label: 'Electronics' },
    { value: 'other',        label: 'Other' },
  ]

  const tabs = [
    { id: 'business',      label: 'Business Profile' },
    { id: 'account',       label: 'Account' },
    { id: 'notifications', label: 'Notifications' },
    { id: 'whatsapp',      label: 'WhatsApp' },
    { id: 'billing',       label: 'Billing' },
  ]

  return (
    <div className="space-y-5 fade-in">
      <PageHeader title="Settings" subtitle="Manage your business and account settings" />
      <Tabs tabs={tabs} activeTab={activeTab} onChange={setActiveTab} variant="underline" />

      {/* ── Business Profile ──────────────────────────────────────────────── */}
      {activeTab === 'business' && (
        <div className="grid lg:grid-cols-3 gap-5">
          <div className="lg:col-span-2 bg-white border border-sand rounded-[14px] p-5 space-y-5">
            <h3 className="font-serif text-[17px] font-medium text-ink">Business profile</h3>
            <Input
              label="Business name"
              value={bizForm.name}
              onChange={e => setBizForm(p => ({ ...p, name: e.target.value }))}
            />
            <Select
              label="Category"
              options={categoryOptions}
              value={bizForm.category}
              onChange={e => setBizForm(p => ({ ...p, category: e.target.value }))}
            />
            <Textarea
              label="Description"
              value={bizForm.description}
              onChange={e => setBizForm(p => ({ ...p, description: e.target.value }))}
              rows={4}
            />
            <div className="grid sm:grid-cols-2 gap-4">
              <Input label="Phone" value={bizForm.phone} onChange={e => setBizForm(p => ({ ...p, phone: e.target.value }))} />
              <Input label="Email" value={bizForm.email} onChange={e => setBizForm(p => ({ ...p, email: e.target.value }))} />
            </div>
            <div className="grid sm:grid-cols-2 gap-4">
              <Input label="City" value={bizForm.city} onChange={e => setBizForm(p => ({ ...p, city: e.target.value }))} />
              <Input label="Physical address" value={bizForm.address} onChange={e => setBizForm(p => ({ ...p, address: e.target.value }))} />
            </div>
            <Input
              label="Opening hours"
              value={bizForm.openingHours}
              onChange={e => setBizForm(p => ({ ...p, openingHours: e.target.value }))}
              placeholder="e.g. Mon–Sat 9am–7pm"
            />
            <div className="flex justify-end">
              <Button variant="primary" loading={bizLoading} onClick={handleSaveBusiness}>
                Save changes
              </Button>
            </div>
          </div>

          <div className="bg-white border border-sand rounded-[14px] p-5">
            <h3 className="font-serif text-[17px] font-medium text-ink mb-4">Business logo</h3>
            <div className="border-2 border-dashed border-sand rounded-[12px] p-8 flex flex-col items-center text-center cursor-pointer hover:border-ink/30">
              {currentBusiness?.logo ? (
                <img src={currentBusiness.logo} alt="Logo" className="w-16 h-16 rounded-full object-cover mb-3" />
              ) : (
                <div className="w-16 h-16 rounded-full bg-sand flex items-center justify-center font-serif font-bold text-[24px] text-ink mb-3">
                  {currentBusiness?.name[0]}
                </div>
              )}
              <p className="text-[13px] text-slate">Click to upload logo</p>
              <p className="text-[11.5px] text-slate mt-1">PNG, SVG or JPG. Max 2MB.</p>
            </div>
            {currentBusiness && (
              <div className="mt-4 pt-4 border-t border-sand space-y-2 text-[13px]">
                <div className="flex justify-between">
                  <span className="text-slate">Plan</span>
                  <span className="font-semibold text-ink capitalize">{currentBusiness.plan}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate">Status</span>
                  <span className="font-semibold text-ink capitalize">{currentBusiness.status}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate">Slug</span>
                  <span className="font-mono text-[12px] text-slate">{currentBusiness.slug}</span>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── Account ───────────────────────────────────────────────────────── */}
      {activeTab === 'account' && (
        <div className="bg-white border border-sand rounded-[14px] p-5 max-w-lg space-y-5">
          <h3 className="font-serif text-[17px] font-medium text-ink">Account information</h3>
          <div className="flex items-center gap-4 p-4 bg-ivory border border-sand rounded-[12px]">
            <Avatar name={user?.name ?? 'U'} image={user?.avatar} size="lg" />
            <div>
              <p className="font-semibold text-ink">{user?.name}</p>
              <p className="text-[13px] text-slate">{user?.email}</p>
              <p className="text-[12px] text-slate mt-1 flex items-center gap-1.5">
                <span className="w-2 h-2 bg-green rounded-full inline-block" />
                Signed in with Google
              </p>
            </div>
          </div>
          <div className="bg-gold-light border border-gold/30 rounded-[12px] p-4 text-[13.5px] text-ink-soft">
            Your account is linked to <strong>{user?.email}</strong> via Google.
            To change your profile photo or email, update your Google account directly.
          </div>
        </div>
      )}

      {/* ── Notifications ─────────────────────────────────────────────────── */}
      {activeTab === 'notifications' && (
        <div className="bg-white border border-sand rounded-[14px] p-5 max-w-lg space-y-6">
          <h3 className="font-serif text-[17px] font-medium text-ink">Notification preferences</h3>

          {notifLoading ? (
            <div className="space-y-4">
              {[1, 2, 3, 4].map(i => <Skeleton key={i} height={48} className="rounded-[10px]" />)}
            </div>
          ) : notifSettings ? (
            <>
              {[
                { key: 'email_on_new_order',   label: 'Email on new order',   help: 'Get notified when a new order arrives.' },
                { key: 'email_on_low_stock',   label: 'Email on low stock',   help: 'Alert when a product drops below its threshold.' },
                { key: 'email_on_new_message', label: 'Email on new message', help: 'Be notified when a customer sends an inquiry.' },
                { key: 'sms_on_new_order',     label: 'SMS on new order',     help: 'Receive a text when an order is placed.' },
              ].map(item => (
                <Toggle
                  key={item.key}
                  checked={(notifSettings as any)[item.key]}
                  onChange={v => setNotifSettings(p => p ? { ...p, [item.key]: v } : p)}
                  label={item.label}
                  helpText={item.help}
                />
              ))}
              <div className="flex justify-end pt-2">
                <Button variant="primary" loading={notifSaving} onClick={handleSaveNotif}>
                  Save preferences
                </Button>
              </div>
            </>
          ) : (
            <p className="text-[13.5px] text-slate">Failed to load settings.</p>
          )}
        </div>
      )}

      {/* ── WhatsApp ──────────────────────────────────────────────────────── */}
      {activeTab === 'whatsapp' && (
        <div className="space-y-5 max-w-2xl">
          {/* Status card */}
          <div className={[
            'rounded-[14px] border p-5 flex items-start justify-between gap-4',
            waSettings?.isActive
              ? 'bg-green-light border-green/20'
              : 'bg-white border-sand',
          ].join(' ')}>
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className={['w-2.5 h-2.5 rounded-full shrink-0', waSettings?.isActive ? 'bg-green' : 'bg-sand-dark'].join(' ')} />
                <p className="font-semibold text-ink text-[14px]">
                  {waSettings?.isActive ? 'Connected' : 'Not connected'}
                </p>
              </div>
              {waSettings?.isActive ? (
                <div className="space-y-0.5 text-[13px] text-ink-soft">
                  <p>Number: <span className="font-medium text-ink">{waSettings.phoneNumber}</span></p>
                  <p>Token: <span className="font-mono text-[12px]">{waSettings.accessTokenHint}</span></p>
                  {waSettings.connectedAt && (
                    <p>Since {new Date(waSettings.connectedAt).toLocaleDateString('en-KE')}</p>
                  )}
                </div>
              ) : (
                <p className="text-[13px] text-slate">Enter your Meta credentials below to connect.</p>
              )}
            </div>
            {waSettings?.isActive && (
              <button onClick={handleDisconnectWhatsApp} disabled={waDisconnecting}
                className="text-[12.5px] font-semibold text-red hover:underline shrink-0 disabled:opacity-50">
                {waDisconnecting ? 'Disconnecting…' : 'Disconnect'}
              </button>
            )}
          </div>

          {waLoading ? (
            <div className="space-y-4">
              {[1,2,3,4,5].map(i => <Skeleton key={i} height={48} className="rounded-[10px]" />)}
            </div>
          ) : (
            <div className="bg-white border border-sand rounded-[14px] p-5 space-y-5">
              <h3 className="font-serif text-[17px] font-medium text-ink">API credentials</h3>
              <p className="text-[13px] text-slate -mt-2">
                Get these from your{' '}
                <a href="https://developers.facebook.com/apps" target="_blank" rel="noreferrer"
                  className="text-ink underline underline-offset-2 hover:text-gold">
                  Meta Developer App
                </a>{' '}
                → WhatsApp → API Setup.
              </p>

              <div className="grid sm:grid-cols-2 gap-4">
                <Input
                  label="Phone Number (E.164)"
                  placeholder="+254712345678"
                  value={waForm.phone_number}
                  onChange={e => setWaForm(f => ({ ...f, phone_number: e.target.value }))}
                />
                <Input
                  label="Phone Number ID"
                  placeholder="1234567890123"
                  value={waForm.phone_number_id}
                  onChange={e => setWaForm(f => ({ ...f, phone_number_id: e.target.value }))}
                />
              </div>

              <Input
                label="WhatsApp Business Account ID (WABA ID)"
                placeholder="9876543210123"
                value={waForm.waba_id}
                onChange={e => setWaForm(f => ({ ...f, waba_id: e.target.value }))}
              />

              <Input
                label="Access Token"
                type="password"
                placeholder={waSettings?.isActive ? `Current: ${waSettings.accessTokenHint} — paste new to update` : 'EAAxxxxxxxx...'}
                value={waForm.access_token}
                onChange={e => setWaForm(f => ({ ...f, access_token: e.target.value }))}
                helpText="Permanent system-user token from your Meta App. Stored securely."
              />

              <Input
                label="Webhook Verify Token"
                placeholder="my-secret-verify-token-123"
                value={waForm.webhook_verify_token}
                onChange={e => setWaForm(f => ({ ...f, webhook_verify_token: e.target.value }))}
                helpText="A random string you choose. Copy this into Meta App → Webhooks → Verify Token."
              />

              <div className="pt-1 border-t border-sand">
                <p className="text-[12.5px] text-slate mb-3 font-medium">Webhook URL to paste in Meta</p>
                <div className="flex items-center gap-2">
                  <code className="flex-1 bg-ivory rounded-[8px] px-3 py-2 text-[12px] font-mono text-ink border border-sand truncate select-all">
                    {(import.meta.env.VITE_API_BASE_URL ?? 'https://your-api-domain.com')}/api/v1/webhooks/whatsapp/
                  </code>
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(
                        `${import.meta.env.VITE_API_BASE_URL ?? 'https://your-api-domain.com'}/api/v1/webhooks/whatsapp/`
                      )
                      toast('success', 'Copied!')
                    }}
                    className="px-3 py-2 text-[12.5px] font-semibold border border-sand rounded-[8px] hover:border-ink text-ink transition-colors shrink-0"
                  >
                    Copy
                  </button>
                </div>
                <p className="text-[12px] text-slate mt-2">
                  Subscribe to <span className="font-mono">messages</span> under Webhook Fields in your Meta App.
                </p>
              </div>

              <div className="flex justify-end">
                <Button
                  variant="primary"
                  loading={waSaving}
                  onClick={handleSaveWhatsApp}
                  disabled={
                    !waForm.phone_number ||
                    !waForm.phone_number_id ||
                    !waForm.waba_id ||
                    !waForm.webhook_verify_token ||
                    (!waForm.access_token && !waSettings?.isActive)
                  }
                >
                  {waSettings?.isActive ? 'Update credentials' : 'Connect WhatsApp'}
                </Button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── Billing ───────────────────────────────────────────────────────── */}
      {activeTab === 'billing' && (
        <div className="bg-white border border-sand rounded-[14px] p-5 max-w-lg space-y-5">
          <h3 className="font-serif text-[17px] font-medium text-ink">Billing & subscription</h3>
          <div className="border border-sand rounded-[12px] p-4">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-[14px] font-semibold text-ink capitalize">
                  {currentBusiness?.plan ?? 'Starter'} Plan
                </p>
                <p className="text-[13px] text-slate mt-0.5">
                  {currentBusiness?.plan === 'starter'
                    ? 'Free'
                    : currentBusiness?.plan === 'business'
                    ? 'KSh 3,499 / month'
                    : 'KSh 7,999 / month'}
                </p>
              </div>
              <span className="bg-green-light text-green text-[11px] font-bold px-2.5 py-1 rounded-full">
                Active
              </span>
            </div>
          </div>
          <div className="space-y-2">
            <button className="text-[13.5px] font-semibold text-ink hover:underline block">
              Upgrade plan
            </button>
            <button className="text-[13.5px] text-slate hover:text-ink block">
              View billing history
            </button>
            <button className="text-[13.5px] text-red hover:underline block">
              Cancel subscription
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
