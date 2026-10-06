import { useState, useEffect } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import {
  ArrowLeft, Package, Truck, Shield, MessageCircle,
  ExternalLink, Store, ShoppingBag, Tag,
} from 'lucide-react'
import { marketplaceService } from '@/services/marketplaceService'
import type { MarketplaceProduct } from '@/services/marketplaceService'
import { Skeleton } from '@/components/ui'

const SAAS_DOMAIN = import.meta.env.VITE_SAAS_DOMAIN ?? ''

/** Builds the full URL to the vendor's storefront. */
function storefrontUrl(slug: string): string {
  if (SAAS_DOMAIN) {
    return `${window.location.protocol}//${slug}.${SAAS_DOMAIN}`
  }
  // Local dev — path-based
  return `/store/${slug}`
}

// ── Loading skeleton ──────────────────────────────────────────────────────────

function PageSkeleton() {
  return (
    <div className="max-w-[1100px] mx-auto px-5 lg:px-8 py-10">
      <Skeleton className="h-4 w-48 mb-8 rounded" />
      <div className="grid lg:grid-cols-2 gap-12">
        <Skeleton className="aspect-square rounded-[16px]" />
        <div className="space-y-5">
          <Skeleton className="h-4 w-24 rounded" />
          <Skeleton className="h-10 w-3/4 rounded" />
          <Skeleton className="h-8 w-1/3 rounded" />
          <Skeleton className="h-20 rounded" />
          <Skeleton className="h-14 rounded-[10px]" />
          <Skeleton className="h-14 rounded-[10px]" />
        </div>
      </div>
    </div>
  )
}

// ── Main page ─────────────────────────────────────────────────────────────────

export default function MarketplaceProductPage() {
  const { id }       = useParams<{ id: string }>()
  const navigate     = useNavigate()

  const [product, setProduct]         = useState<MarketplaceProduct | null>(null)
  const [loading, setLoading]         = useState(true)
  const [notFound, setNotFound]       = useState(false)
  const [selectedImage, setSelectedImage] = useState(0)

  useEffect(() => {
    if (!id) return
    setLoading(true)
    setNotFound(false)
    marketplaceService.getProduct(id)
      .then(p  => setProduct(p))
      .catch(() => setNotFound(true))
      .finally(() => setLoading(false))
  }, [id])

  if (loading) return (
    <div className="min-h-screen bg-ivory pt-20">
      <PageSkeleton />
    </div>
  )

  if (notFound || !product) {
    return (
      <div className="min-h-screen bg-ivory pt-24 flex flex-col items-center justify-center text-center px-6">
        <p className="font-serif text-[28px] text-ink mb-3">Product not found</p>
        <p className="text-[14px] text-slate mb-6">This product may have been removed or is no longer available.</p>
        <Link
          to="/marketplace"
          className="flex items-center gap-2 text-[14px] font-semibold text-ink hover:underline"
        >
          <ArrowLeft size={15} /> Back to Marketplace
        </Link>
      </div>
    )
  }

  const primary     = product.businessPrimaryColor ?? '#C79A3D'
  const storeUrl    = storefrontUrl(product.businessSlug)
  const productUrl  = `${storeUrl}/product/${product.slug}`
  const inStock     = product.isAvailable

  return (
    <div className="min-h-screen bg-ivory">
      {/* Thin vendor colour bar */}
      <div className="h-1 w-full" style={{ background: primary }} />

      <div className="pt-20 pb-16">
        <div className="max-w-[1100px] mx-auto px-5 lg:px-8">

          {/* Breadcrumb */}
          <nav className="flex items-center gap-2 text-[13px] text-slate mb-8 flex-wrap">
            <button onClick={() => navigate(-1)} className="hover:text-ink flex items-center gap-1">
              <ArrowLeft size={13} /> Back
            </button>
            <span>/</span>
            <Link to="/marketplace" className="hover:text-ink">Marketplace</Link>
            {product.categoryName && (
              <>
                <span>/</span>
                <Link to={`/marketplace?category=${encodeURIComponent(product.categoryName)}`} className="hover:text-ink">
                  {product.categoryName}
                </Link>
              </>
            )}
            <span>/</span>
            <span className="text-ink font-medium truncate max-w-[200px]">{product.name}</span>
          </nav>

          <div className="grid lg:grid-cols-2 gap-12 lg:gap-16">
            {/* ── Images ─────────────────────────────────────── */}
            <div className="space-y-3">
              <div className="aspect-square rounded-[18px] overflow-hidden bg-white border border-sand">
                {product.images[selectedImage] ? (
                  <img
                    src={product.images[selectedImage]}
                    alt={product.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <Package size={56} className="text-sand" />
                  </div>
                )}
              </div>
              {product.images.length > 1 && (
                <div className="flex gap-2 flex-wrap">
                  {product.images.map((img, i) => (
                    <button
                      key={i}
                      onClick={() => setSelectedImage(i)}
                      className={[
                        'w-16 h-16 rounded-[10px] overflow-hidden border-2 transition-colors',
                        selectedImage === i ? 'border-ink' : 'border-sand hover:border-slate',
                      ].join(' ')}
                    >
                      <img src={img} alt="" className="w-full h-full object-cover" />
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* ── Product info ────────────────────────────────── */}
            <div>
              {/* Vendor identity */}
              <div className="flex items-center gap-3 mb-5 p-3 bg-white border border-sand rounded-[12px]">
                {product.businessLogo ? (
                  <img
                    src={product.businessLogo}
                    alt={product.businessName}
                    className="w-10 h-10 rounded-full object-cover shrink-0"
                  />
                ) : (
                  <div
                    className="w-10 h-10 rounded-full flex items-center justify-center font-serif font-bold text-white text-[16px] shrink-0"
                    style={{ background: primary }}
                  >
                    {product.businessName[0]}
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <p className="text-[13px] text-slate">Sold by</p>
                  <p className="text-[14px] font-semibold text-ink truncate">{product.businessName}</p>
                </div>
                <a
                  href={storeUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-[8px] text-[12.5px] font-semibold border border-sand hover:border-ink transition-colors text-ink shrink-0"
                  aria-label={`Visit ${product.businessName} storefront`}
                >
                  <ExternalLink size={12} />
                  Visit Store
                </a>
              </div>

              {/* Category + name */}
              {product.categoryName && (
                <p className="text-[12.5px] text-slate font-medium uppercase tracking-wide mb-2">
                  {product.categoryName}
                </p>
              )}
              <h1 className="font-serif text-[30px] lg:text-[36px] text-ink leading-tight mb-4">
                {product.name}
              </h1>

              {/* Price */}
              <div className="flex items-baseline gap-3 mb-4">
                <p className="font-serif text-[28px] font-semibold text-ink">
                  KSh {product.sellingPrice.toLocaleString()}
                </p>
                {product.salePrice && (
                  <p className="text-[18px] text-slate line-through">
                    KSh {product.salePrice.toLocaleString()}
                  </p>
                )}
              </div>

              {/* Stock status */}
              <div className="mb-5">
                {inStock ? (
                  <span className="inline-flex items-center gap-1.5 text-[13px] font-semibold text-green">
                    <span className="w-2 h-2 bg-green rounded-full" /> In stock
                  </span>
                ) : (
                  <span className="text-[13px] font-semibold text-red">Out of stock</span>
                )}
              </div>

              {/* Description */}
              {product.description && (
                <p className="text-[15px] text-slate leading-relaxed mb-7">{product.description}</p>
              )}

              {/* Tags */}
              {product.tags.length > 0 && (
                <div className="flex flex-wrap gap-2 mb-7">
                  {product.tags.map(tag => (
                    <span key={tag} className="flex items-center gap-1 px-2.5 py-1 bg-ivory border border-sand rounded-full text-[12px] text-slate">
                      <Tag size={10} /> {tag}
                    </span>
                  ))}
                </div>
              )}

              {/* ── Primary CTA — visit store product page ──── */}
              <div className="space-y-3 mb-7">
                <a
                  href={productUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center justify-center gap-2.5 w-full py-4 text-white font-semibold text-[15px] rounded-[12px] hover:opacity-90 transition-opacity"
                  style={{ background: primary }}
                >
                  <ShoppingBag size={17} />
                  Buy from {product.businessName}
                </a>

                <a
                  href={storeUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center justify-center gap-2.5 w-full py-3.5 bg-white border-2 border-sand text-ink font-semibold text-[14px] rounded-[12px] hover:border-ink transition-colors"
                >
                  <Store size={16} />
                  See all products from this store
                </a>
              </div>

              {/* Trust badges */}
              <div className="border border-sand rounded-[12px] p-4 space-y-3">
                {[
                  { icon: <Truck size={14} className="text-slate shrink-0" />,       text: 'Delivery available — contact the vendor for details' },
                  { icon: <Shield size={14} className="text-slate shrink-0" />,       text: 'All vendors on Sellora are verified Kenyan businesses' },
                  { icon: <MessageCircle size={14} className="text-slate shrink-0" />, text: 'Questions? Chat directly with the store via WhatsApp' },
                ].map((item, i) => (
                  <div key={i} className="flex items-start gap-3 text-[13px] text-slate">
                    {item.icon} {item.text}
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* ── More from this vendor ──────────────────────── */}
          <div className="mt-16 pt-10 border-t border-sand">
            <div className="flex items-center justify-between mb-6">
              <h2 className="font-serif text-[24px] text-ink">
                More from {product.businessName}
              </h2>
              <a
                href={storeUrl}
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-1.5 text-[13.5px] font-semibold text-ink hover:underline"
              >
                Visit full store <ExternalLink size={13} />
              </a>
            </div>

            {/* Vendor banner */}
            <div
              className="rounded-[16px] p-8 flex flex-col sm:flex-row items-center justify-between gap-6"
              style={{ background: `${primary}14` }}
            >
              <div className="flex items-center gap-4">
                {product.businessLogo ? (
                  <img
                    src={product.businessLogo}
                    alt={product.businessName}
                    className="w-14 h-14 rounded-full object-cover border-2 border-white shadow-sm"
                  />
                ) : (
                  <div
                    className="w-14 h-14 rounded-full flex items-center justify-center font-serif font-bold text-white text-[22px] shadow-sm"
                    style={{ background: primary }}
                  >
                    {product.businessName[0]}
                  </div>
                )}
                <div>
                  <p className="font-serif text-[20px] text-ink font-medium">{product.businessName}</p>
                  <p className="text-[13px] text-slate mt-0.5">
                    Explore their full collection on Sellora
                  </p>
                </div>
              </div>
              <a
                href={storeUrl}
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-2 px-6 py-3 text-white font-semibold text-[14px] rounded-[10px] hover:opacity-90 transition-opacity shrink-0"
                style={{ background: primary }}
              >
                <Store size={15} />
                Open Store
              </a>
            </div>
          </div>

        </div>
      </div>
    </div>
  )
}
