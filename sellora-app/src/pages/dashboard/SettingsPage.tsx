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
  const [waSettings, setWaSettings]         = useState<WaSettings | null>(null)
  const [waLoading, setWaLoading]           = useState(false)
  const [waConnecting, setWaConnecting]     = useState(false)
  const [waDisconnecting, setWaDisconnecting] = useState(false)

  // Load settings whenever the tab is opened (once per mount)
  useEffect(() => {
    if (activeTab !== 'whatsapp' || !currentBusiness || waSettings !== null) return
    setWaLoading(true)
    whatsappService.getSettings(currentBusiness.id)
      .then(s => setWaSettings(s))
      .catch(() => toast('error', 'Failed to load WhatsApp settings'))
      .finally(() => setWaLoading(false))
  }, [activeTab, currentBusiness?.id]) // eslint-disable-line

  // Load the Meta JS SDK once (idempotent)
  useEffect(() => {
    if (document.getElementById('facebook-jssdk')) return
    const script = document.createElement('script')
    script.id  = 'facebook-jssdk'
    script.src = 'https://connect.facebook.net/en_US/sdk.js'
    script.async = true
    script.defer = true
    document.body.appendChild(script)
    script.onload = () => {
      const appId = import.meta.env.VITE_WHATSAPP_APP_ID ?? ''
      if (!appId) return
      ;(window as any).FB?.init({ appId, cookie: true, xfbml: true, version: 'v20.0' })
    }
  }, [])

  const launchEmbeddedSignup = () => {
    const FB = (window as any).FB
    if (!FB) {
      toast('error', 'Meta SDK not loaded', 'Please refresh the page and try again.')
      return
    }
    setWaConnecting(true)

    FB.login(
      (response: any) => {
        if (response.authResponse?.code) {
          handleSignupComplete(response.authResponse)
        } else {
          setWaConnecting(false)
          // User closed the popup without completing
        }
      },
      {
        config_id:      import.meta.env.VITE_WHATSAPP_CONFIG_ID ?? '',
        response_type:  'code',
        override_default_response_type: true,
        extras: {
          setup: {},
          featureType:  '',
          sessionInfoVersion: '3',
        },
      },
    )

    // Also listen for the sessionInfoListener message that carries waba_id + phone_number_id
    const sessionHandler = (event: MessageEvent) => {
      if (event.origin !== 'https://www.facebook.com' &&
          event.origin !== 'https://web.facebook.com') return
      try {
        const data = JSON.parse(event.data)
        if (data.type === 'WA_EMBEDDED_SIGNUP') {
          if (data.event === 'FINISH') {
            // Store on window so handleSignupComplete can pick them up
            ;(window as any)._waSignupData = {
              waba_id:         data.data?.waba_id ?? '',
              phone_number_id: data.data?.phone_number_id ?? '',
            }
          }
        }
      } catch { /* non-JSON message — ignore */ }
      window.removeEventListener('message', sessionHandler)
    }
    window.addEventListener('message', sessionHandler)
  }

  const handleSignupComplete = async (authResponse: any) => {
    if (!currentBusiness) return
    const code           = authResponse.code as string
    const signupData     = (window as any)._waSignupData ?? {}
    const waba_id        = signupData.waba_id        ?? authResponse.waba_id        ?? ''
    const phone_number_id = signupData.phone_number_id ?? authResponse.phone_number_id ?? ''

    if (!waba_id || !phone_number_id) {
      toast('error', 'Missing data from Meta', 'Could not get WABA ID or phone number. Please try again.')
      setWaConnecting(false)
      return
    }

    try {
      const saved = await whatsappService.connect(currentBusiness.id, {
        code, waba_id, phone_number_id,
      })
      setWaSettings(saved)
      toast('success', 'WhatsApp connected!', `${saved.phoneNumber} is now receiving messages.`)
    } catch {
      toast('error', 'Connection failed', 'Please try again or contact support.')
    } finally {
      setWaConnecting(false)
      delete (window as any)._waSignupData
    }
  }

  const handleDisconnectWhatsApp = async () => {
    if (!currentBusiness) return
    if (!confirm('Disconnect WhatsApp? Incoming messages will stop being received.')) return
    setWaDisconnecting(true)
    try {
      await whatsappService.disconnect(currentBusiness.id)
      setWaSettings(null)
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
      {/* WhatsApp tab */}
      {activeTab === 'whatsapp' && (
        <div className="space-y-5 max-w-xl">

          {/* Connection status card */}
          <div className={[
            'rounded-[14px] border p-5',
            waSettings?.isActive ? 'bg-green-light border-green/20' : 'bg-white border-sand',
          ].join(' ')}>
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-start gap-3">
                <div className={[
                  'w-11 h-11 rounded-full flex items-center justify-center shrink-0 text-[22px]',
                  waSettings?.isActive ? 'bg-green/20' : 'bg-sand',
                ].join(' ')}>
                  💬
                </div>
                <div>
                  <p className="font-semibold text-ink text-[15px] flex items-center gap-2">
                    WhatsApp Business
                    {waSettings?.isActive && (
                      <span className="inline-flex items-center gap-1 text-[11px] font-bold text-green bg-green/10 px-2 py-0.5 rounded-full">
                        <span className="w-1.5 h-1.5 bg-green rounded-full" />
                        Connected
                      </span>
                    )}
                  </p>
                  {waSettings?.isActive ? (
                    <div className="mt-1 space-y-0.5 text-[13px] text-ink-soft">
                      <p>
                        <span className="text-slate">Number: </span>
                        <span className="font-semibold text-ink">{waSettings.phoneNumber}</span>
                      </p>
                      {waSettings.connectedAt && (
                        <p className="text-[12px] text-slate">
                          Connected {new Date(waSettings.connectedAt).toLocaleDateString('en-KE', { day: 'numeric', month: 'long', year: 'numeric' })}
                        </p>
                      )}
                    </div>
                  ) : (
                    <p className="text-[13px] text-slate mt-0.5">
                      Connect your WhatsApp Business number to receive and reply to customer messages right here.
                    </p>
                  )}
                </div>
              </div>

              {waSettings?.isActive && (
                <button
                  onClick={handleDisconnectWhatsApp}
                  disabled={waDisconnecting}
                  className="text-[12.5px] font-semibold text-red hover:underline shrink-0 disabled:opacity-50 mt-0.5"
                >
                  {waDisconnecting ? 'Disconnecting...' : 'Disconnect'}
                </button>
              )}
            </div>
          </div>

          {/* Connect / loaded */}
          {waLoading ? (
            <div className="space-y-3">
              <Skeleton height={52} className="rounded-[12px]" />
              <Skeleton height={80} className="rounded-[12px]" />
            </div>
          ) : !waSettings?.isActive ? (
            <div className="bg-white border border-sand rounded-[14px] p-6 space-y-5">
              <div>
                <h3 className="font-serif text-[17px] font-medium text-ink">Connect your number</h3>
                <p className="text-[13.5px] text-slate mt-1.5 leading-relaxed">
                  Click the button below. A Meta window will open where you log in with
                  Facebook and select your WhatsApp Business number. No API keys, no copying credentials.
                </p>
              </div>

              <div className="space-y-2.5">
                {[
                  { n: '1', text: 'Click "Connect with WhatsApp"' },
                  { n: '2', text: 'Log in with your Facebook account' },
                  { n: '3', text: 'Select or register your WhatsApp Business number' },
                  { n: '4', text: 'Confirm with a one-time code — done' },
                ].map(s => (
                  <div key={s.n} className="flex items-center gap-3 text-[13.5px] text-ink-soft">
                    <span className="w-6 h-6 rounded-full bg-sand text-ink font-bold text-[12px] flex items-center justify-center shrink-0">
                      {s.n}
                    </span>
                    {s.text}
                  </div>
                ))}
              </div>

              <button
                onClick={launchEmbeddedSignup}
                disabled={waConnecting}
                className={[
                  'w-full flex items-center justify-center gap-3 py-3.5 rounded-[11px]',
                  'font-semibold text-[14.5px] transition-all',
                  waConnecting
                    ? 'bg-sand text-slate cursor-not-allowed'
                    : 'bg-[#1877F2] hover:bg-[#1565d8] text-white shadow-sm hover:shadow-md',
                ].join(' ')}
              >
                {waConnecting ? (
                  <>
                    <span className="w-4 h-4 border-2 border-slate border-t-transparent rounded-full animate-spin" />
                    Connecting...
                  </>
                ) : (
                  <>
                    <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5 shrink-0">
                      <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                    </svg>
                    Connect with WhatsApp
                  </>
                )}
              </button>

              <p className="text-[12px] text-slate text-center">
                Your number stays yours. Sellora gets permission to send and receive messages on your behalf.
              </p>
            </div>
          ) : (
            <div className="bg-white border border-sand rounded-[14px] p-5 space-y-4">
              <h3 className="font-serif text-[16px] font-medium text-ink">Active integration</h3>
              <div className="grid sm:grid-cols-2 gap-3 text-[13px]">
                <div className="bg-ivory rounded-[10px] p-3">
                  <p className="text-slate text-[11.5px] font-semibold uppercase tracking-wide mb-0.5">Phone Number</p>
                  <p className="font-semibold text-ink">{waSettings.phoneNumber}</p>
                </div>
                <div className="bg-ivory rounded-[10px] p-3">
                  <p className="text-slate text-[11.5px] font-semibold uppercase tracking-wide mb-0.5">WABA ID</p>
                  <p className="font-mono text-ink text-[12px]">{waSettings.wabaId}</p>
                </div>
                <div className="bg-ivory rounded-[10px] p-3">
                  <p className="text-slate text-[11.5px] font-semibold uppercase tracking-wide mb-0.5">Phone Number ID</p>
                  <p className="font-mono text-ink text-[12px]">{waSettings.phoneNumberId}</p>
                </div>
                <div className="bg-ivory rounded-[10px] p-3">
                  <p className="text-slate text-[11.5px] font-semibold uppercase tracking-wide mb-0.5">Access Token</p>
                  <p className="font-mono text-ink text-[12px]">{waSettings.accessTokenHint}</p>
                </div>
              </div>
              <p className="text-[13px] text-slate pt-1">
                Need to switch numbers?{' '}
                <button
                  onClick={launchEmbeddedSignup}
                  disabled={waConnecting}
                  className="text-ink font-semibold hover:underline disabled:opacity-50"
                >
                  {waConnecting ? 'Connecting...' : 'Re-connect'}
                </button>
              </p>
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
