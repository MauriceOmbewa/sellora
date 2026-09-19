import React, { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { CreditCard, Banknote, ArrowLeft, MessageCircle, Truck, Store } from 'lucide-react'
import { useStorefront } from '@/context/StorefrontContext'
import { Input, Textarea, useToast } from '@/components/ui'
import { storefrontService } from '@/services/storefrontService'
import { api } from '@/services/api'

type PaymentMethod = 'mpesa' | 'cash' | 'whatsapp'

interface STKPushResponse {
  message: string
  order_id: string
  order_number: string
  amount: string
  payment_method: string
  mpesa_response: {
    MerchantRequestID?: string
    CheckoutRequestID?: string
    ResponseCode?: string
    ResponseDescription?: string
    CustomerMessage?: string
  }
}

export default function StorefrontCheckout() {
  const { cart, business, clearCart, basePath, setFulfillmentType } = useStorefront()
  const navigate = useNavigate()
  const { toast } = useToast()
  const primary = business?.theme.primaryColor ?? '#C79A3D'

  const ds = business?.deliverySettings
  const deliveryEnabled = ds?.deliveryEnabled ?? true
  const pickupEnabled   = ds?.pickupEnabled   ?? true

  const [form, setForm] = useState({
    name: '',
    phone: '',
    email: '',
    address: '',
    notes: '',
  })

  const [payment, setPayment]   = useState<PaymentMethod>('mpesa')
  const [submitting, setSubmitting] = useState(false)
  const [errors, setErrors]     = useState<Partial<typeof form>>({})

  const set = (k: keyof typeof form, v: string) => {
    setForm(p => ({ ...p, [k]: v }))
    setErrors(p => ({ ...p, [k]: '' }))
  }

  const validate = () => {
    const e: Partial<typeof form> = {}
    if (!form.name.trim())  e.name  = 'Full name is required'
    if (!form.phone.trim()) e.phone = 'Phone number is required'
    if (cart.fulfillmentType === 'delivery' && !form.address.trim()) {
      e.address = 'Delivery address is required'
    }
    return e
  }

  const handleSubmit = async () => {
    const e = validate()

    if (Object.keys(e).length > 0) {
      setErrors(e)
      return
    }

    if (!business) {
      toast(
        'error',
        'Order failed',
        'Store information is unavailable.'
      )
      return
    }

    setSubmitting(true)

    try {
      /*
       * STEP 1:
       * Create the order.
       *
       * The backend calculates/stores the order total and returns
       * the order ID and order number.
       */
      const confirmation = await storefrontService.placeOrder(
        business.slug,
        {
          customer_name: form.name,
          customer_phone: form.phone,
          customer_email: form.email || undefined,
          delivery_address: cart.fulfillmentType === 'delivery' ? (form.address || undefined) : undefined,
          order_notes: form.notes || undefined,
          fulfillment_type: cart.fulfillmentType,
          payment_method:
            payment === 'whatsapp'
              ? 'cash'
              : payment,
          items: cart.items.map(i => ({
            product_id: i.productId,
            quantity: i.quantity,
          })),
        }
      )

      /*
       * STEP 2:
       * If the customer selected M-PESA, initiate an STK Push.
       *
       * We only send:
       * - order_id
       * - customer's phone
       *
       * The backend gets:
       * - business
       * - order amount
       * - order number
       * - PayBill/Till
       * - transaction type
       */
      if (payment === 'mpesa') {
        const stkResponse = await api.post<STKPushResponse>(
          '/api/v1/payments/stk-push/',
          {
            order_id: confirmation.id,
            phone: form.phone,
          }
        )

        /*
         * The STK request was accepted by M-PESA.
         *
         * Don't wait for the callback here.
         * Safaricom will send the final payment result
         * to our backend callback.
         */
        clearCart()

        navigate(
          `${basePath}/success?order=${stkResponse.order_number}&payment=mpesa`
        )

        return
      }

      /*
       * Cash and WhatsApp don't need STK Push.
       */
      clearCart()

      navigate(
        `${basePath}/success?order=${confirmation.order_number}`
      )
    } catch (err: unknown) {
      toast(
        'error',
        'Payment failed',
        err instanceof Error
          ? err.message
          : 'Unable to place your order. Please try again.'
      )

      setSubmitting(false)
    }
  }

  const paymentOptions: {
    id: PaymentMethod
    icon: React.ReactNode
    label: string
    desc: string
  }[] = [
    {
      id: 'mpesa',
      icon: <CreditCard size={18} />,
      label: 'M-PESA',
      desc: 'Pay securely using M-PESA',
    },
    {
      id: 'cash',
      icon: <Banknote size={18} />,
      label: 'Cash / Pay on Delivery',
      desc: 'Pay when you receive your order',
    },
    {
      id: 'whatsapp',
      icon: <MessageCircle size={18} />,
      label: 'Order via WhatsApp',
      desc: 'Confirm and pay through WhatsApp',
    },
  ]

  if (cart.items.length === 0) {
    navigate(`${basePath}/cart`)
    return null
  }

  return (
    <div className="max-w-[1200px] mx-auto px-5 lg:px-8 py-10">
      <button
        onClick={() => navigate(`${basePath}/cart`)}
        className="flex items-center gap-2 text-[13.5px] text-slate hover:text-ink mb-7"
      >
        <ArrowLeft size={15} />
        Back to cart
      </button>

      <h1 className="font-serif text-[32px] text-ink mb-8">
        Checkout
      </h1>

      <div className="grid lg:grid-cols-3 gap-8">
        {/* Form */}
        <div className="lg:col-span-2 space-y-6">

          {/* Fulfillment — delivery vs pickup */}
          {(deliveryEnabled || pickupEnabled) && (
            <div className="bg-white border border-sand rounded-[14px] p-6">
              <h2 className="font-serif text-[18px] font-medium text-ink mb-4">
                How would you like to receive your order?
              </h2>
              <div className="grid sm:grid-cols-2 gap-3">
                {deliveryEnabled && (
                  <button
                    type="button"
                    onClick={() => setFulfillmentType('delivery')}
                    className={[
                      'flex items-center gap-4 p-4 rounded-[12px] border-2 transition-all text-left',
                      cart.fulfillmentType === 'delivery'
                        ? 'border-ink bg-ivory/60'
                        : 'border-sand hover:border-sand-dark',
                    ].join(' ')}
                  >
                    <div className={[
                      'w-10 h-10 rounded-[10px] flex items-center justify-center shrink-0',
                      cart.fulfillmentType === 'delivery' ? 'bg-ink text-ivory' : 'bg-ivory text-slate border border-sand',
                    ].join(' ')}>
                      <Truck size={18} />
                    </div>
                    <div>
                      <p className="font-semibold text-ink text-[14px]">Delivery</p>
                      <p className="text-[12.5px] text-slate mt-0.5">
                        {cart.deliveryFee === 0
                          ? 'Free delivery'
                          : `KSh ${(ds?.deliveryFee ?? 300).toLocaleString()} fee`}
                      </p>
                    </div>
                  </button>
                )}
                {pickupEnabled && (
                  <button
                    type="button"
                    onClick={() => setFulfillmentType('pickup')}
                    className={[
                      'flex items-center gap-4 p-4 rounded-[12px] border-2 transition-all text-left',
                      cart.fulfillmentType === 'pickup'
                        ? 'border-ink bg-ivory/60'
                        : 'border-sand hover:border-sand-dark',
                    ].join(' ')}
                  >
                    <div className={[
                      'w-10 h-10 rounded-[10px] flex items-center justify-center shrink-0',
                      cart.fulfillmentType === 'pickup' ? 'bg-ink text-ivory' : 'bg-ivory text-slate border border-sand',
                    ].join(' ')}>
                      <Store size={18} />
                    </div>
                    <div>
                      <p className="font-semibold text-ink text-[14px]">Pick up myself</p>
                      <p className="text-[12.5px] text-slate mt-0.5">No delivery fee</p>
                    </div>
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Customer details */}
          <div className="bg-white border border-sand rounded-[14px] p-6">
            <h2 className="font-serif text-[18px] font-medium text-ink mb-5">
              Your details
            </h2>

            <div className="space-y-4">
              <Input
                label="Full name *"
                placeholder="e.g. Fatuma Ndungu"
                value={form.name}
                onChange={e => set('name', e.target.value)}
                error={errors.name}
              />

              <div className="grid sm:grid-cols-2 gap-4">
                <Input
                  label="Phone number *"
                  placeholder="+254 712 345 678"
                  value={form.phone}
                  onChange={e => set('phone', e.target.value)}
                  error={errors.phone}
                />

                <Input
                  label="Email (optional)"
                  type="email"
                  placeholder="your@email.com"
                  value={form.email}
                  onChange={e => set('email', e.target.value)}
                />
              </div>

              {cart.fulfillmentType === 'delivery' && (
                <Input
                  label="Delivery address *"
                  placeholder="e.g. Westlands, Nairobi or full physical address"
                  value={form.address}
                  onChange={e => set('address', e.target.value)}
                  error={errors.address}
                />
              )}

              <Textarea
                label="Order notes (optional)"
                placeholder="Any special instructions for your order…"
                value={form.notes}
                onChange={e => set('notes', e.target.value)}
                rows={3}
              />
            </div>
          </div>

          {/* Payment */}
          <div className="bg-white border border-sand rounded-[14px] p-6">
            <h2 className="font-serif text-[18px] font-medium text-ink mb-5">
              Payment method
            </h2>

            <div className="space-y-3">
              {paymentOptions.map(opt => (
                <label
                  key={opt.id}
                  className={[
                    'flex items-start gap-4 p-4 rounded-[12px] border-2 cursor-pointer transition-all',
                    payment === opt.id
                      ? 'border-ink bg-ivory/60'
                      : 'border-sand hover:border-sand-dark',
                  ].join(' ')}
                >
                  <input
                    type="radio"
                    name="payment"
                    value={opt.id}
                    checked={payment === opt.id}
                    onChange={() => setPayment(opt.id)}
                    className="mt-0.5 accent-ink"
                  />

                  <div className="flex items-start gap-3">
                    <div
                      className={[
                        'w-9 h-9 rounded-[9px] flex items-center justify-center shrink-0',
                        payment === opt.id
                          ? 'bg-ink text-ivory'
                          : 'bg-ivory text-slate border border-sand',
                      ].join(' ')}
                    >
                      {opt.icon}
                    </div>

                    <div>
                      <p className="font-semibold text-ink text-[14px]">
                        {opt.label}
                      </p>

                      <p className="text-[13px] text-slate mt-0.5">
                        {opt.desc}
                      </p>
                    </div>
                  </div>
                </label>
              ))}
            </div>

            {payment === 'mpesa' && (
              <div className="mt-4 bg-green-light border border-green/20 rounded-[12px] p-4 text-[13.5px] text-ink">
                <p className="font-semibold mb-1">
                  M-PESA payment
                </p>

                <p className="text-slate">
                  Enter your M-PESA phone number above and click
                  <strong className="text-ink"> Place Order</strong>.
                </p>

                <p className="text-slate mt-1">
                  A payment request will be sent to your phone.
                  You'll then be prompted to enter your M-PESA PIN.
                </p>

                <p className="text-slate mt-1">
                  You don't need to enter your PIN on this website.
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Summary */}
        <div className="space-y-4">
          <div className="bg-white border border-sand rounded-[14px] p-5 sticky top-24">
            <h2 className="font-serif text-[18px] font-medium text-ink mb-4">
              Order summary
            </h2>

            <div className="space-y-3 mb-4">
              {cart.items.map(item => (
                <div
                  key={item.productId}
                  className="flex items-center gap-3"
                >
                  <div className="w-12 h-12 rounded-[8px] overflow-hidden bg-ivory border border-sand shrink-0">
                    {item.product.images[0] && (
                      <img
                        src={item.product.images[0]}
                        alt=""
                        className="w-full h-full object-cover"
                      />
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <p className="text-[13px] font-semibold text-ink truncate">
                      {item.product.name}
                    </p>

                    <p className="text-[12px] text-slate">
                      ×{item.quantity}
                    </p>
                  </div>

                  <p className="text-[13px] font-semibold text-ink shrink-0">
                    KSh{' '}
                    {(
                      item.product.sellingPrice *
                      item.quantity
                    ).toLocaleString()}
                  </p>
                </div>
              ))}
            </div>

            <div className="border-t border-sand pt-3 space-y-2 text-[13.5px]">
              <div className="flex justify-between">
                <span className="text-slate">
                  Subtotal
                </span>

                <span>
                  KSh {cart.subtotal.toLocaleString()}
                </span>
              </div>

              <div className="flex justify-between">
                <span className="text-slate">
                  {cart.fulfillmentType === 'pickup' ? 'Pickup' : 'Delivery'}
                </span>
                <span className={cart.deliveryFee === 0 ? 'text-green font-semibold' : ''}>
                  {cart.fulfillmentType === 'pickup'
                    ? 'Free — self pickup'
                    : cart.deliveryFee === 0
                      ? 'Free'
                      : `KSh ${cart.deliveryFee.toLocaleString()}`}
                </span>
              </div>

              <div className="flex justify-between font-bold text-[15px] text-ink pt-1 border-t border-sand">
                <span>Total</span>

                <span>
                  KSh {cart.total.toLocaleString()}
                </span>
              </div>
            </div>

            <button
              onClick={handleSubmit}
              disabled={submitting}
              className="w-full mt-5 flex items-center justify-center gap-2 py-4 text-white font-semibold text-[15px] rounded-[10px] disabled:opacity-60 hover:opacity-90 transition-opacity"
              style={{ background: primary }}
            >
              {submitting ? (
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : null}

              {submitting
                ? payment === 'mpesa'
                  ? 'Sending M-PESA request…'
                  : 'Placing order…'
                : 'Place Order'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}