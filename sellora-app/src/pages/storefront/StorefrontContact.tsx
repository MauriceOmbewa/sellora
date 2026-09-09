import React, { useState } from 'react'
import { Phone, Mail, MapPin, Clock, MessageCircle, Share2, Send } from 'lucide-react'
import { useStorefront } from '@/context/StorefrontContext'
import { Input, Textarea } from '@/components/ui'

export default function StorefrontContact() {
  const { business } = useStorefront()
  const primary = business?.theme.primaryColor ?? '#C79A3D'
  const [form, setForm] = useState({ name: '', phone: '', email: '', message: '' })
  const [sent, setSent] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    await new Promise(r => setTimeout(r, 600))
    setSent(true)
  }

  return (
    <div>
      {/* Hero */}
      <section className="py-16 text-center" style={{ background: `${primary}10` }}>
        <div className="max-w-[600px] mx-auto px-5">
          <p className="text-[12px] font-semibold uppercase tracking-widest mb-4" style={{ color: primary }}>Get in touch</p>
          <h1 className="font-serif text-[44px] text-ink mb-4">Contact us</h1>
          <p className="text-[16px] text-slate">Have a question, want to place an order, or just want to say hello? We'd love to hear from you.</p>
        </div>
      </section>

      <div className="max-w-[1200px] mx-auto px-5 lg:px-8 py-14">
        <div className="grid lg:grid-cols-2 gap-12">
          {/* Contact info */}
          <div className="space-y-6">
            <h2 className="font-serif text-[26px] text-ink">Reach us directly</h2>

            <div className="space-y-4">
              {business?.contact.phone && (
                <a href={`tel:${business.contact.phone}`} className="flex items-center gap-4 p-4 bg-white border border-sand rounded-[12px] hover:border-ink/20 transition-colors group">
                  <div className="w-10 h-10 rounded-full flex items-center justify-center shrink-0" style={{ background: `${primary}18`, color: primary }}>
                    <Phone size={16} />
                  </div>
                  <div>
                    <p className="text-[12px] font-semibold uppercase tracking-wide text-slate">Phone</p>
                    <p className="font-semibold text-ink">{business.contact.phone}</p>
                  </div>
                </a>
              )}

              {business?.contact.whatsapp && (
                <a
                  href={`https://wa.me/${business.contact.whatsapp.replace(/\D/g, '')}?text=Hi! I'd like to enquire about your products.`}
                  target="_blank" rel="noreferrer"
                  className="flex items-center gap-4 p-4 bg-green-light border border-green/20 rounded-[12px] hover:bg-green/10 transition-colors"
                >
                  <div className="w-10 h-10 rounded-full bg-green flex items-center justify-center shrink-0">
                    <MessageCircle size={16} className="text-white" />
                  </div>
                  <div>
                    <p className="text-[12px] font-semibold uppercase tracking-wide text-green">WhatsApp — fastest response</p>
                    <p className="font-semibold text-ink">{business.contact.whatsapp}</p>
                  </div>
                </a>
              )}

              {business?.contact.email && (
                <a href={`mailto:${business.contact.email}`} className="flex items-center gap-4 p-4 bg-white border border-sand rounded-[12px] hover:border-ink/20 transition-colors">
                  <div className="w-10 h-10 rounded-full flex items-center justify-center shrink-0" style={{ background: `${primary}18`, color: primary }}>
                    <Mail size={16} />
                  </div>
                  <div>
                    <p className="text-[12px] font-semibold uppercase tracking-wide text-slate">Email</p>
                    <p className="font-semibold text-ink">{business.contact.email}</p>
                  </div>
                </a>
              )}

              {business?.contact.address && (
                <div className="flex items-start gap-4 p-4 bg-white border border-sand rounded-[12px]">
                  <div className="w-10 h-10 rounded-full flex items-center justify-center shrink-0 mt-0.5" style={{ background: `${primary}18`, color: primary }}>
                    <MapPin size={16} />
                  </div>
                  <div>
                    <p className="text-[12px] font-semibold uppercase tracking-wide text-slate">Location</p>
                    <p className="font-semibold text-ink">{business.contact.address}</p>
                    <p className="text-[13px] text-slate">{business.contact.city}, {business.contact.country}</p>
                  </div>
                </div>
              )}

              {business?.contact.openingHours && (
                <div className="flex items-center gap-4 p-4 bg-white border border-sand rounded-[12px]">
                  <div className="w-10 h-10 rounded-full flex items-center justify-center shrink-0" style={{ background: `${primary}18`, color: primary }}>
                    <Clock size={16} />
                  </div>
                  <div>
                    <p className="text-[12px] font-semibold uppercase tracking-wide text-slate">Hours</p>
                    <p className="font-semibold text-ink">{business.contact.openingHours}</p>
                  </div>
                </div>
              )}
            </div>

            {/* Social links */}
            {(business?.socialLinks.instagram || business?.socialLinks.facebook || business?.socialLinks.tiktok) && (
              <div className="pt-4">
                <p className="text-[12px] font-semibold uppercase tracking-widest text-slate mb-3">Follow us</p>
                <div className="flex gap-3">
                  {business.socialLinks.instagram && (
                    <a href={`https://instagram.com/${business.socialLinks.instagram}`} target="_blank" rel="noreferrer"
                      className="flex items-center gap-2 px-4 py-2.5 border border-sand rounded-[9px] text-[13px] font-semibold hover:border-ink hover:bg-ivory transition-colors">
                      <Share2 size={15} /> @{business.socialLinks.instagram}
                    </a>
                  )}
                  {business.socialLinks.facebook && (
                    <a href={`https://facebook.com/${business.socialLinks.facebook}`} target="_blank" rel="noreferrer"
                      className="flex items-center gap-2 px-4 py-2.5 border border-sand rounded-[9px] text-[13px] font-semibold hover:border-ink hover:bg-ivory transition-colors">
                      <Share2 size={15} />
                    </a>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Contact form */}
          <div className="bg-white border border-sand rounded-[16px] p-6">
            {sent ? (
              <div className="py-12 text-center">
                <div className="w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-4" style={{ background: `${primary}18` }}>
                  <Send size={22} style={{ color: primary }} />
                </div>
                <h2 className="font-serif text-[24px] text-ink mb-3">Message sent!</h2>
                <p className="text-slate">We'll get back to you as soon as possible.</p>
              </div>
            ) : (
              <>
                <h2 className="font-serif text-[22px] text-ink mb-5">Send us a message</h2>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <Input label="Your name" placeholder="Fatuma Ndungu" value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} required />
                  <div className="grid sm:grid-cols-2 gap-4">
                    <Input label="Phone" placeholder="+254 712 345 678" value={form.phone} onChange={e => setForm(p => ({ ...p, phone: e.target.value }))} />
                    <Input label="Email (optional)" type="email" value={form.email} onChange={e => setForm(p => ({ ...p, email: e.target.value }))} />
                  </div>
                  <Textarea label="Message" placeholder="What can we help you with?" value={form.message} onChange={e => setForm(p => ({ ...p, message: e.target.value }))} rows={5} required />
                  <button
                    type="submit"
                    className="w-full py-3.5 text-white font-semibold text-[15px] rounded-[10px] flex items-center justify-center gap-2 hover:opacity-90 transition-opacity"
                    style={{ background: primary }}
                  >
                    <Send size={16} /> Send Message
                  </button>
                </form>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
