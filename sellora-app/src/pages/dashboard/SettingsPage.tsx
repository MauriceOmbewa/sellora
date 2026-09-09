import React, { useState } from 'react'
import { Tabs, Input, Textarea, Select, Toggle, Button, PageHeader, Avatar, useToast } from '@/components/ui'
import { useAuth } from '@/context/AuthContext'

export default function SettingsPage() {
  const { user, currentBusiness } = useAuth()
  const { toast } = useToast()
  const [activeTab, setActiveTab] = useState('business')
  const [saving, setSaving] = useState(false)

  const [bizForm, setBizForm] = useState({
    name: currentBusiness?.name ?? '',
    category: currentBusiness?.category ?? '',
    description: currentBusiness?.description ?? '',
    phone: currentBusiness?.contact?.phone ?? '',
    email: currentBusiness?.contact?.email ?? '',
    address: currentBusiness?.contact?.address ?? '',
    city: currentBusiness?.contact?.city ?? '',
    openingHours: currentBusiness?.contact?.openingHours ?? '',
  })

  const [notifForm, setNotifForm] = useState({
    emailOnNewOrder: true,
    emailOnLowStock: true,
    emailOnNewMessage: false,
    smsOnNewOrder: false,
  })

  const handleSave = async () => {
    setSaving(true)
    await new Promise(r => setTimeout(r, 600))
    setSaving(false)
    toast('success', 'Settings saved', 'Your changes have been saved.')
  }

  const tabs = [
    { id: 'business', label: 'Business Profile' },
    { id: 'account', label: 'Account' },
    { id: 'notifications', label: 'Notifications' },
    { id: 'billing', label: 'Billing' },
  ]

  const categoryOptions = [
    { value: 'perfumes', label: 'Perfumes & Fragrances' },
    { value: 'cosmetics', label: 'Cosmetics & Skincare' },
    { value: 'fashion', label: 'Fashion & Boutique' },
    { value: 'accessories', label: 'Accessories & Jewellery' },
    { value: 'beauty', label: 'Beauty & Spa' },
    { value: 'gifts', label: 'Gifts' },
    { value: 'electronics', label: 'Electronics' },
    { value: 'other', label: 'Other' },
  ]

  return (
    <div className="space-y-5 fade-in">
      <PageHeader title="Settings" subtitle="Manage your business and account settings" />

      <Tabs tabs={tabs} activeTab={activeTab} onChange={setActiveTab} variant="underline" />

      {activeTab === 'business' && (
        <div className="grid lg:grid-cols-3 gap-5">
          <div className="lg:col-span-2 bg-white border border-sand rounded-[14px] p-5 space-y-5">
            <h3 className="font-serif text-[17px] font-medium text-ink">Business profile</h3>
            <Input label="Business name" value={bizForm.name} onChange={e => setBizForm(p => ({ ...p, name: e.target.value }))} />
            <Select label="Category" options={categoryOptions} value={bizForm.category} onChange={e => setBizForm(p => ({ ...p, category: e.target.value }))} />
            <Textarea label="Description" value={bizForm.description} onChange={e => setBizForm(p => ({ ...p, description: e.target.value }))} rows={4} />
            <div className="grid sm:grid-cols-2 gap-4">
              <Input label="Phone" value={bizForm.phone} onChange={e => setBizForm(p => ({ ...p, phone: e.target.value }))} />
              <Input label="Email" value={bizForm.email} onChange={e => setBizForm(p => ({ ...p, email: e.target.value }))} />
            </div>
            <div className="grid sm:grid-cols-2 gap-4">
              <Input label="City" value={bizForm.city} onChange={e => setBizForm(p => ({ ...p, city: e.target.value }))} />
              <Input label="Physical address" value={bizForm.address} onChange={e => setBizForm(p => ({ ...p, address: e.target.value }))} />
            </div>
            <Input label="Opening hours" value={bizForm.openingHours} onChange={e => setBizForm(p => ({ ...p, openingHours: e.target.value }))} />
            <div className="flex justify-end">
              <Button variant="primary" loading={saving} onClick={handleSave}>Save changes</Button>
            </div>
          </div>
          <div className="bg-white border border-sand rounded-[14px] p-5">
            <h3 className="font-serif text-[17px] font-medium text-ink mb-4">Business logo</h3>
            <div className="border-2 border-dashed border-sand rounded-[12px] p-8 flex flex-col items-center text-center cursor-pointer hover:border-ink/30">
              <div className="w-16 h-16 rounded-full bg-sand flex items-center justify-center font-serif font-bold text-[24px] text-ink mb-3">
                {currentBusiness?.name[0]}
              </div>
              <p className="text-[13px] text-slate">Click to upload logo</p>
            </div>
            <p className="text-[12px] text-slate mt-2 text-center">PNG, SVG or JPG. Max 2MB.</p>
          </div>
        </div>
      )}

      {activeTab === 'account' && (
        <div className="bg-white border border-sand rounded-[14px] p-5 max-w-lg space-y-5">
          <h3 className="font-serif text-[17px] font-medium text-ink">Account information</h3>
          <div className="flex items-center gap-4 p-4 bg-ivory border border-sand rounded-[12px]">
            <Avatar name={user?.name ?? 'U'} image={user?.avatar} size="lg" />
            <div>
              <p className="font-semibold text-ink">{user?.name}</p>
              <p className="text-[13px] text-slate">{user?.email}</p>
              <p className="text-[12px] text-slate mt-1 flex items-center gap-1.5">
                <span className="w-2 h-2 bg-green rounded-full" />
                Signed in with Google
              </p>
            </div>
          </div>
          <div className="bg-gold-light border border-gold/30 rounded-[12px] p-4 text-[13.5px] text-ink-soft">
            Your account is linked to <strong>{user?.email}</strong> via Google. To change your email or profile photo, update your Google account.
          </div>
          <div className="pt-2">
            <p className="text-[13px] font-semibold text-slate mb-3">Danger zone</p>
            <button className="text-[13.5px] text-red font-semibold hover:underline">
              Delete my account
            </button>
          </div>
        </div>
      )}

      {activeTab === 'notifications' && (
        <div className="bg-white border border-sand rounded-[14px] p-5 max-w-lg space-y-6">
          <h3 className="font-serif text-[17px] font-medium text-ink">Notification preferences</h3>
          {[
            { key: 'emailOnNewOrder', label: 'Email on new order', help: 'Get notified by email when a new order arrives.' },
            { key: 'emailOnLowStock', label: 'Email on low stock', help: 'Alert when a product drops below its threshold.' },
            { key: 'emailOnNewMessage', label: 'Email on new message', help: 'Be notified when a customer sends an inquiry.' },
            { key: 'smsOnNewOrder', label: 'SMS on new order', help: 'Receive a text message when an order is placed.' },
          ].map(item => (
            <Toggle
              key={item.key}
              checked={(notifForm as any)[item.key]}
              onChange={v => setNotifForm(p => ({ ...p, [item.key]: v }))}
              label={item.label}
              helpText={item.help}
            />
          ))}
          <div className="flex justify-end">
            <Button variant="primary" loading={saving} onClick={handleSave}>Save preferences</Button>
          </div>
        </div>
      )}

      {activeTab === 'billing' && (
        <div className="bg-white border border-sand rounded-[14px] p-5 max-w-lg space-y-5">
          <h3 className="font-serif text-[17px] font-medium text-ink">Billing & subscription</h3>
          <div className="border border-sand rounded-[12px] p-4">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-[14px] font-semibold text-ink">Business Plan</p>
                <p className="text-[13px] text-slate mt-0.5">KSh 3,499 / month</p>
              </div>
              <span className="bg-green-light text-green text-[11px] font-bold px-2.5 py-1 rounded-full">Active</span>
            </div>
            <p className="text-[12.5px] text-slate mt-3">Next billing date: <strong className="text-ink">October 8, 2026</strong></p>
          </div>
          <div className="space-y-2">
            <button className="text-[13.5px] font-semibold text-ink hover:underline">Upgrade plan</button>
            <br />
            <button className="text-[13.5px] text-slate hover:text-ink">View billing history</button>
            <br />
            <button className="text-[13.5px] text-red hover:underline">Cancel subscription</button>
          </div>
        </div>
      )}
    </div>
  )
}
