import React from 'react'
import { Link, useParams, useSearchParams } from 'react-router-dom'
import { CheckCircle, MessageCircle, ShoppingBag } from 'lucide-react'
import { useStorefront } from '@/context/StorefrontContext'

export default function StorefrontSuccess() {
    const { business, basePath } = useStorefront()
  const [searchParams] = useSearchParams()
  const orderNum = searchParams.get('order') ?? '000000'
  const primary = business?.theme.primaryColor ?? '#C79A3D'
  const accent  = business?.theme.accentColor  ?? '#3F6B4F'

  return (
    <div className="max-w-[560px] mx-auto px-5 py-20 text-center">
      <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-5" style={{ background: `${primary}18` }}>
        <CheckCircle size={30} style={{ color: primary }} />
      </div>

      <h1 className="font-serif text-[32px] text-ink mb-3">Order placed!</h1>
      <p className="text-[16px] text-slate mb-2">Thank you for shopping with <strong className="text-ink">{business?.name}</strong>.</p>
      <p className="text-[14px] text-slate mb-8">Order reference: <strong className="font-mono text-ink">#{orderNum}</strong></p>

      <div className="bg-white border border-sand rounded-[14px] p-5 mb-7 text-left space-y-3">
        <h2 className="font-semibold text-ink text-[15px]">What happens next?</h2>
        {[
          'We\'ll confirm your order via phone or WhatsApp',
          'Payment instructions will be sent (if M-PESA)',
          'Your order will be packed and dispatched',
          'You\'ll receive delivery confirmation',
        ].map((step, i) => (
          <div key={i} className="flex items-start gap-3 text-[13.5px] text-slate">
            <span className="w-5 h-5 rounded-full text-white text-[10px] font-bold flex items-center justify-center shrink-0 mt-0.5" style={{ background: accent }}>
              {i + 1}
            </span>
            {step}
          </div>
        ))}
      </div>

      <div className="flex flex-col sm:flex-row gap-3 justify-center">
        <Link
          to={`${basePath}/shop`}
          className="flex items-center justify-center gap-2 px-6 py-3.5 font-semibold text-[14px] text-white rounded-[10px]"
          style={{ background: primary }}
        >
          <ShoppingBag size={16} /> Continue Shopping
        </Link>

        {business?.contact.whatsapp && (
          <a
            href={`https://wa.me/${business.contact.whatsapp.replace(/\D/g, '')}?text=Hi! I just placed order #${orderNum}. Can you confirm receipt?`}
            target="_blank"
            rel="noreferrer"
            className="flex items-center justify-center gap-2 px-6 py-3.5 font-semibold text-[14px] text-green border-2 border-green/20 bg-green-light rounded-[10px]"
          >
            <MessageCircle size={16} /> Contact on WhatsApp
          </a>
        )}
      </div>
    </div>
  )
}
