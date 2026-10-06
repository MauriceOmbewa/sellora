import { Link } from 'react-router-dom'
import { ShoppingBag, Store } from 'lucide-react'
import type { MarketplaceProduct } from '@/services/marketplaceService'

const badgeStyles: Record<string, string> = {
  'new':         'bg-blue-50 text-blue-600',
  'best-seller': 'bg-amber-50 text-amber-700',
  'sale':        'bg-red-50 text-red-600',
  'limited':     'bg-ink text-ivory',
}

interface Props {
  product: MarketplaceProduct
  className?: string
}

export function MarketplaceProductCard({ product, className = '' }: Props) {
  const primary = product.businessPrimaryColor ?? '#C79A3D'

  return (
    <Link
      to={`/marketplace/product/${product.id}`}
      className={[
        'group block bg-white border border-sand rounded-[14px] overflow-hidden',
        'hover:shadow-md hover:border-sand-dark transition-all duration-200',
        className,
      ].join(' ')}
    >
      {/* Image */}
      <div className="relative aspect-square overflow-hidden bg-ivory">
        {product.images[0] ? (
          <img
            src={product.images[0]}
            alt={product.name}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            loading="lazy"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <ShoppingBag size={32} className="text-sand" />
          </div>
        )}

        {/* Badge */}
        {product.badge && (
          <div className="absolute top-2.5 left-2.5">
            <span className={[
              'text-[10px] font-bold px-2 py-0.5 rounded-full capitalize',
              badgeStyles[product.badge] ?? 'bg-sand text-ink',
            ].join(' ')}>
              {product.badge.replace('-', ' ')}
            </span>
          </div>
        )}

        {/* Out of stock */}
        {!product.isAvailable && (
          <div className="absolute inset-0 bg-white/70 flex items-center justify-center">
            <span className="bg-ink text-ivory text-[11px] font-bold px-3 py-1 rounded-full">
              Out of stock
            </span>
          </div>
        )}
      </div>

      {/* Details */}
      <div className="p-3.5">
        {/* Vendor chip */}
        <div className="flex items-center gap-1.5 mb-2">
          {product.businessLogo ? (
            <img
              src={product.businessLogo}
              alt={product.businessName}
              className="w-4 h-4 rounded-full object-cover"
            />
          ) : (
            <div
              className="w-4 h-4 rounded-full flex items-center justify-center text-white text-[8px] font-bold shrink-0"
              style={{ background: primary }}
            >
              {product.businessName[0]}
            </div>
          )}
          <span className="text-[11px] text-slate truncate">{product.businessName}</span>
        </div>

        <h3 className="text-[13.5px] font-semibold text-ink leading-snug mb-2 line-clamp-2 group-hover:text-ink/70 transition-colors">
          {product.name}
        </h3>

        <div className="flex items-center justify-between gap-2">
          <p className="font-serif text-[16px] font-semibold text-ink">
            KSh {product.sellingPrice.toLocaleString()}
          </p>
          <div
            className="flex items-center gap-1 px-2 py-1 rounded-full text-white text-[10px] font-semibold"
            style={{ background: primary }}
            aria-label={`Visit ${product.businessName}`}
          >
            <Store size={10} />
            View
          </div>
        </div>
      </div>
    </Link>
  )
}
