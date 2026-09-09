import { Link, useParams } from 'react-router-dom'
import { ShoppingBag, Heart } from 'lucide-react'
import type { Product } from '@/types'
import { useStorefront } from '@/context/StorefrontContext'

interface ProductCardProps {
  product: Product
  className?: string
}

const badgeStyles: Record<string, string> = {
  'new': 'bg-blue-light text-blue',
  'best-seller': 'bg-gold-light text-gold-deep',
  'sale': 'bg-red-light text-red',
  'limited': 'bg-ink text-ivory',
}

export function ProductCard({ product, className = '' }: ProductCardProps) {
  const { businessSlug } = useParams<{ businessSlug: string }>()
  const { addToCart, business } = useStorefront()
  const primary = business?.theme.primaryColor ?? '#C79A3D'

  const isLowStock = product.stockQuantity > 0 && product.stockQuantity <= product.lowStockThreshold

  return (
    <div className={['group relative bg-white border border-sand rounded-[14px] overflow-hidden hover:shadow-md hover:border-sand-dark transition-all duration-200', className].join(' ')}>
      {/* Image */}
      <Link to={`/store/${businessSlug}/product/${product.slug}`} className="block">
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
              <ShoppingBag size={32} className="text-sand-dark" />
            </div>
          )}

          {/* Badge */}
          {product.badge && (
            <div className="absolute top-2.5 left-2.5">
              <span className={['text-[10px] font-bold px-2 py-0.5 rounded-full capitalize', badgeStyles[product.badge] ?? 'bg-sand text-ink'].join(' ')}>
                {product.badge.replace('-', ' ')}
              </span>
            </div>
          )}

          {/* Wishlist */}
          <button
            className="absolute top-2.5 right-2.5 w-7 h-7 bg-white/90 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow-sm"
            aria-label="Save to wishlist"
          >
            <Heart size={13} className="text-slate" />
          </button>

          {/* Out of stock overlay */}
          {product.stockQuantity === 0 && (
            <div className="absolute inset-0 bg-white/70 flex items-center justify-center">
              <span className="bg-ink text-ivory text-[11px] font-bold px-3 py-1 rounded-full">Out of stock</span>
            </div>
          )}
        </div>
      </Link>

      {/* Details */}
      <div className="p-4">
        <p className="text-[11.5px] text-slate mb-1">{product.categoryName}</p>
        <Link to={`/store/${businessSlug}/product/${product.slug}`}>
          <h3 className="text-[14px] font-semibold text-ink leading-snug mb-2 hover:text-ink/70 transition-colors line-clamp-2">
            {product.name}
          </h3>
        </Link>

        <div className="flex items-center justify-between gap-2">
          <div>
            <p className="font-serif text-[17px] font-semibold text-ink">
              KSh {product.sellingPrice.toLocaleString()}
            </p>
            {product.salePrice && (
              <p className="text-[12px] text-slate line-through">KSh {product.salePrice.toLocaleString()}</p>
            )}
          </div>

          {product.stockQuantity > 0 && (
            <button
              onClick={() => addToCart(product, 1)}
              aria-label={`Add ${product.name} to cart`}
              className="w-9 h-9 rounded-full flex items-center justify-center text-white transition-all hover:scale-105 active:scale-95 shadow-sm"
              style={{ background: primary }}
            >
              <ShoppingBag size={15} />
            </button>
          )}
        </div>

        {isLowStock && (
          <p className="text-[11px] font-semibold text-gold-deep mt-2">Only {product.stockQuantity} left</p>
        )}
      </div>
    </div>
  )
}
