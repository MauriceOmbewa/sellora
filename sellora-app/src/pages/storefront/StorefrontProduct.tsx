import React, { useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { ShoppingBag, MessageCircle, Minus, Plus, ArrowLeft, Package, Truck, Shield } from 'lucide-react'
import { useStorefront } from '@/context/StorefrontContext'
import { ProductCard } from '@/components/storefront/ProductCard'
import { useToast } from '@/components/ui'

export default function StorefrontProduct() {
  const { businessSlug, productSlug } = useParams<{ businessSlug: string; productSlug: string }>()
  const { products, business, addToCart } = useStorefront()
  const { toast } = useToast()
  const primary = business?.theme.primaryColor ?? '#C79A3D'

  const product = products.find(p => p.slug === productSlug)
  const [selectedImage, setSelectedImage] = useState(0)
  const [qty, setQty] = useState(1)

  const related = products.filter(p => p.id !== product?.id && p.categoryId === product?.categoryId).slice(0, 4)

  if (!product) {
    return (
      <div className="max-w-[1200px] mx-auto px-5 py-20 text-center">
        <p className="font-serif text-[28px] text-ink mb-4">Product not found</p>
        <Link to={`/store/${businessSlug}/shop`} className="text-ink font-semibold hover:underline">
          ← Back to Shop
        </Link>
      </div>
    )
  }

  const handleAddToCart = () => {
    addToCart(product, qty)
    toast('success', 'Added to cart', `${product.name} × ${qty}`)
  }

  const handleWhatsApp = () => {
    const msg = `Hi! I'm interested in ${product.name} (KSh ${product.sellingPrice.toLocaleString()}). Is it available?`
    window.open(`https://wa.me/${business?.contact.whatsapp?.replace(/\D/g, '')}?text=${encodeURIComponent(msg)}`, '_blank')
  }

  const inStock = product.stockQuantity > 0
  const isLow = inStock && product.stockQuantity <= product.lowStockThreshold

  return (
    <div>
      <div className="max-w-[1200px] mx-auto px-5 lg:px-8 py-8">
        {/* Breadcrumb */}
        <nav className="flex items-center gap-2 text-[13px] text-slate mb-6">
          <Link to={`/store/${businessSlug}`} className="hover:text-ink">Home</Link>
          <span>/</span>
          <Link to={`/store/${businessSlug}/shop`} className="hover:text-ink">Shop</Link>
          <span>/</span>
          <span className="text-ink font-medium truncate max-w-[200px]">{product.name}</span>
        </nav>

        {/* Product detail */}
        <div className="grid lg:grid-cols-2 gap-10 lg:gap-14">
          {/* Images */}
          <div className="space-y-3">
            {/* Main image */}
            <div className="aspect-square rounded-[16px] overflow-hidden bg-ivory border border-sand">
              {product.images[selectedImage] ? (
                <img
                  src={product.images[selectedImage]}
                  alt={product.name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <Package size={48} className="text-sand-dark" />
                </div>
              )}
            </div>
            {/* Thumbnails */}
            {product.images.length > 1 && (
              <div className="flex gap-2">
                {product.images.map((img, i) => (
                  <button
                    key={i}
                    onClick={() => setSelectedImage(i)}
                    className={[
                      'w-16 h-16 rounded-[10px] overflow-hidden border-2 transition-colors',
                      selectedImage === i ? 'border-ink' : 'border-sand hover:border-sand-dark',
                    ].join(' ')}
                  >
                    <img src={img} alt="" className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Info */}
          <div>
            <p className="text-[13px] text-slate mb-2">{product.categoryName}</p>
            <h1 className="font-serif text-[32px] lg:text-[38px] text-ink leading-tight mb-4">{product.name}</h1>

            {/* Price */}
            <div className="flex items-baseline gap-3 mb-4">
              <p className="font-serif text-[28px] font-semibold text-ink">
                KSh {product.sellingPrice.toLocaleString()}
              </p>
              {product.salePrice && (
                <p className="text-[18px] text-slate line-through">KSh {product.salePrice.toLocaleString()}</p>
              )}
            </div>

            {/* Stock */}
            <div className="mb-5">
              {!inStock ? (
                <span className="text-[13px] font-semibold text-red">Out of stock</span>
              ) : isLow ? (
                <span className="text-[13px] font-semibold text-gold-deep">Only {product.stockQuantity} left — order soon</span>
              ) : (
                <span className="text-[13px] font-semibold text-green flex items-center gap-1.5">
                  <span className="w-2 h-2 bg-green rounded-full" />
                  In stock
                </span>
              )}
            </div>

            {/* Description */}
            <p className="text-[15px] text-slate leading-relaxed mb-7">{product.description}</p>

            {/* Qty + Add to cart */}
            {inStock && (
              <div className="space-y-3 mb-6">
                <div className="flex items-center gap-4">
                  <div className="flex items-center border border-sand rounded-[10px] overflow-hidden">
                    <button
                      onClick={() => setQty(q => Math.max(1, q - 1))}
                      className="w-11 h-11 flex items-center justify-center hover:bg-sand transition-colors"
                    >
                      <Minus size={14} />
                    </button>
                    <span className="w-12 text-center font-semibold text-ink text-[15px]">{qty}</span>
                    <button
                      onClick={() => setQty(q => Math.min(product.stockQuantity, q + 1))}
                      className="w-11 h-11 flex items-center justify-center hover:bg-sand transition-colors"
                    >
                      <Plus size={14} />
                    </button>
                  </div>
                  <button
                    onClick={handleAddToCart}
                    className="flex-1 flex items-center justify-center gap-2.5 py-3.5 text-white font-semibold text-[15px] rounded-[10px] hover:opacity-90 transition-opacity"
                    style={{ background: primary }}
                  >
                    <ShoppingBag size={17} />
                    Add to Cart
                  </button>
                </div>

                {business?.contact.whatsapp && (
                  <button
                    onClick={handleWhatsApp}
                    className="w-full flex items-center justify-center gap-2.5 py-3.5 text-green font-semibold text-[15px] rounded-[10px] border-2 border-green/20 bg-green-light hover:bg-green/10 transition-colors"
                  >
                    <MessageCircle size={17} />
                    Inquire via WhatsApp
                  </button>
                )}
              </div>
            )}

            {/* Delivery info */}
            <div className="border border-sand rounded-[12px] p-4 space-y-3">
              {[
                { icon: <Truck size={15} className="text-slate" />, text: 'Same-day delivery available in Nairobi' },
                { icon: <Shield size={15} className="text-slate" />, text: '100% authentic products, guaranteed' },
                { icon: <MessageCircle size={15} className="text-slate" />, text: 'WhatsApp support for all orders' },
              ].map((item, i) => (
                <div key={i} className="flex items-center gap-3 text-[13.5px] text-slate">
                  {item.icon}
                  {item.text}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Related products */}
        {related.length > 0 && (
          <div className="mt-16 pt-10 border-t border-sand">
            <h2 className="font-serif text-[26px] text-ink mb-6">You might also like</h2>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              {related.map(p => <ProductCard key={p.id} product={p} />)}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
