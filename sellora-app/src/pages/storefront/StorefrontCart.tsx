import React from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Minus, Plus, Trash2, ShoppingBag, MessageCircle, ArrowRight } from 'lucide-react'
import { useStorefront } from '@/context/StorefrontContext'

export default function StorefrontCart() {
    const { cart, updateQty, removeFromCart, business, basePath } = useStorefront()
  const navigate = useNavigate()
  const primary = business?.theme.primaryColor ?? '#C79A3D'

  const handleWhatsAppOrder = () => {
    const lines = cart.items.map(i => `• ${i.product.name} × ${i.quantity} = KSh ${(i.product.sellingPrice * i.quantity).toLocaleString()}`)
    const msg = `Hi! I'd like to order:\n\n${lines.join('\n')}\n\nSubtotal: KSh ${cart.subtotal.toLocaleString()}\nTotal: KSh ${cart.total.toLocaleString()}`
    window.open(`https://wa.me/${business?.contact.whatsapp?.replace(/\D/g, '')}?text=${encodeURIComponent(msg)}`, '_blank')
  }

  if (cart.items.length === 0) {
    return (
      <div className="max-w-[600px] mx-auto px-5 py-24 text-center">
        <div className="w-16 h-16 rounded-full bg-ivory border border-sand flex items-center justify-center mx-auto mb-5">
          <ShoppingBag size={26} className="text-slate" />
        </div>
        <h1 className="font-serif text-[28px] text-ink mb-3">Your cart is empty</h1>
        <p className="text-slate mb-7">Looks like you haven't added anything yet.</p>
        <Link
          to={`${basePath}/shop`}
          className="inline-flex items-center gap-2 px-7 py-3.5 font-semibold text-[15px] text-white rounded-[10px]"
          style={{ background: primary }}
        >
          <ShoppingBag size={16} /> Browse Products
        </Link>
      </div>
    )
  }

  return (
    <div className="max-w-[1200px] mx-auto px-5 lg:px-8 py-10">
      <h1 className="font-serif text-[32px] text-ink mb-8">Your Cart</h1>

      <div className="grid lg:grid-cols-3 gap-8">
        {/* Cart items */}
        <div className="lg:col-span-2 space-y-4">
          {cart.items.map(item => (
            <div key={item.productId} className="flex gap-4 bg-white border border-sand rounded-[14px] p-4">
              {/* Image */}
              <Link to={`${basePath}/product/${item.product.slug}`} className="shrink-0">
                <div className="w-20 h-20 lg:w-24 lg:h-24 rounded-[10px] overflow-hidden bg-ivory border border-sand">
                  {item.product.images[0] ? (
                    <img src={item.product.images[0]} alt={item.product.name} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <ShoppingBag size={20} className="text-sand-dark" />
                    </div>
                  )}
                </div>
              </Link>

              {/* Details */}
              <div className="flex-1 min-w-0">
                <Link to={`${basePath}/product/${item.product.slug}`}>
                  <h3 className="font-semibold text-ink text-[14px] mb-0.5 hover:opacity-70 transition-opacity">{item.product.name}</h3>
                </Link>
                <p className="text-[12.5px] text-slate mb-3">{item.product.categoryName}</p>

                <div className="flex items-center justify-between">
                  {/* Qty controls */}
                  <div className="flex items-center border border-sand rounded-[8px] overflow-hidden">
                    <button
                      onClick={() => updateQty(item.productId, item.quantity - 1)}
                      className="w-9 h-9 flex items-center justify-center hover:bg-sand"
                    >
                      <Minus size={13} />
                    </button>
                    <span className="w-9 text-center text-[14px] font-semibold">{item.quantity}</span>
                    <button
                      onClick={() => updateQty(item.productId, item.quantity + 1)}
                      className="w-9 h-9 flex items-center justify-center hover:bg-sand"
                    >
                      <Plus size={13} />
                    </button>
                  </div>

                  <div className="flex items-center gap-3">
                    <p className="font-serif text-[17px] font-semibold text-ink">
                      KSh {(item.product.sellingPrice * item.quantity).toLocaleString()}
                    </p>
                    <button
                      onClick={() => removeFromCart(item.productId)}
                      aria-label="Remove"
                      className="w-8 h-8 flex items-center justify-center text-slate hover:text-red hover:bg-red-light rounded-full transition-colors"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Summary */}
        <div className="space-y-4">
          <div className="bg-white border border-sand rounded-[14px] p-5">
            <h2 className="font-serif text-[18px] font-medium text-ink mb-4">Order summary</h2>
            <div className="space-y-3 text-[14px]">
              <div className="flex justify-between">
                <span className="text-slate">Subtotal ({cart.items.reduce((s, i) => s + i.quantity, 0)} items)</span>
                <span className="text-ink">KSh {cart.subtotal.toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate">Delivery</span>
                <span className="text-ink">KSh {cart.deliveryFee.toLocaleString()}</span>
              </div>
              <div className="border-t border-sand pt-3 flex justify-between font-bold text-[16px] text-ink">
                <span>Total</span>
                <span>KSh {cart.total.toLocaleString()}</span>
              </div>
            </div>
          </div>

          <button
            onClick={() => navigate(`${basePath}/checkout`)}
            className="w-full flex items-center justify-center gap-2.5 py-4 text-white font-semibold text-[15px] rounded-[10px] hover:opacity-90 transition-opacity"
            style={{ background: primary }}
          >
            Proceed to Checkout <ArrowRight size={16} />
          </button>

          {business?.contact.whatsapp && (
            <button
              onClick={handleWhatsAppOrder}
              className="w-full flex items-center justify-center gap-2.5 py-3.5 text-green font-semibold text-[14px] rounded-[10px] border-2 border-green/20 bg-green-light hover:bg-green/10 transition-colors"
            >
              <MessageCircle size={16} />
              Order via WhatsApp
            </button>
          )}

          <Link
            to={`${basePath}/shop`}
            className="block text-center text-[13.5px] text-slate hover:text-ink font-medium mt-1"
          >
            ← Continue shopping
          </Link>
        </div>
      </div>
    </div>
  )
}
