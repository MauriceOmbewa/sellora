import React from 'react'
import { Link, useParams } from 'react-router-dom'
import { ArrowRight, MessageCircle } from 'lucide-react'
import { useStorefront } from '@/context/StorefrontContext'

export default function StorefrontAbout() {
    const { business, products, basePath } = useStorefront()
  const primary = business?.theme.primaryColor ?? '#C79A3D'

  return (
    <div>
      {/* Hero */}
      <section className="py-16 lg:py-24" style={{ background: `linear-gradient(135deg, ${primary}12, ${primary}06)` }}>
        <div className="max-w-[1200px] mx-auto px-5 lg:px-8 text-center">
          <p className="text-[12px] font-semibold uppercase tracking-widest mb-4" style={{ color: primary }}>Our story</p>
          <h1 className="font-serif text-[44px] lg:text-[56px] text-ink mb-5">About {business?.name}</h1>
          <p className="text-[16px] text-slate max-w-xl mx-auto leading-relaxed">{business?.motto}</p>
        </div>
      </section>

      {/* Story */}
      <section className="py-16 max-w-[900px] mx-auto px-5 lg:px-8">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          <div className="bg-sand rounded-[20px] aspect-square" />
          <div>
            <h2 className="font-serif text-[32px] text-ink mb-5">Who we are</h2>
            <p className="text-[16px] text-slate leading-relaxed">{business?.aboutText ?? business?.description}</p>
            {business?.contact.city && (
              <p className="mt-5 text-[14px] text-slate">
                📍 Based in <strong className="text-ink">{business.contact.city}</strong>
                {business.contact.openingHours && ` · ${business.contact.openingHours}`}
              </p>
            )}
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="py-12 bg-ink">
        <div className="max-w-[1200px] mx-auto px-5 lg:px-8">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-6 text-center">
            {[
              { num: `${products.length}+`, label: 'Products' },
              { num: '240+', label: 'Happy Customers' },
              { num: '4.9★', label: 'Average Rating' },
              { num: '3yr', label: 'In Business' },
            ].map(s => (
              <div key={s.label}>
                <p className="font-serif text-[36px] font-semibold text-ivory mb-1">{s.num}</p>
                <p className="text-[13px] text-ivory/50">{s.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Why us */}
      <section className="py-16 max-w-[1200px] mx-auto px-5 lg:px-8">
        <h2 className="font-serif text-[32px] text-ink mb-10 text-center">Why shop with us</h2>
        <div className="grid sm:grid-cols-3 gap-5">
          {[
            { icon: '✨', title: 'Authentic Products', body: 'Every product we sell is 100% genuine. We source directly from trusted suppliers.' },
            { icon: '🚀', title: 'Fast Delivery', body: 'Same-day delivery in Nairobi. We pack and dispatch orders quickly.' },
            { icon: '💬', title: 'Personal Service', body: 'Have questions? Chat with us on WhatsApp. We respond fast and are always happy to help.' },
          ].map(item => (
            <div key={item.title} className="bg-white border border-sand rounded-[16px] p-6 text-center">
              <div className="text-[32px] mb-4">{item.icon}</div>
              <h3 className="font-serif text-[18px] text-ink mb-2">{item.title}</h3>
              <p className="text-[14px] text-slate leading-relaxed">{item.body}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="py-12 border-t border-sand text-center px-5">
        <h2 className="font-serif text-[28px] text-ink mb-4">Ready to find your perfect product?</h2>
        <div className="flex justify-center gap-3 flex-wrap">
          <Link
            to={`${basePath}/shop`}
            className="inline-flex items-center gap-2 px-6 py-3.5 text-white font-semibold text-[14px] rounded-[10px]"
            style={{ background: primary }}
          >
            Shop Now <ArrowRight size={15} />
          </Link>
          {business?.contact.whatsapp && (
            <a
              href={`https://wa.me/${business.contact.whatsapp.replace(/\D/g, '')}`}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-2 px-6 py-3.5 text-green font-semibold text-[14px] rounded-[10px] border-2 border-green/20 bg-green-light"
            >
              <MessageCircle size={15} /> WhatsApp us
            </a>
          )}
        </div>
      </section>
    </div>
  )
}
