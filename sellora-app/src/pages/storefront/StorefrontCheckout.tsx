import React, {
  useState,
  useEffect,
  useRef,
} from 'react'
import { useNavigate } from 'react-router-dom'
import {
  CreditCard,
  Banknote,
  ArrowLeft,
  MessageCircle,
  Truck,
  Store,
  CheckCircle,
  XCircle,
  Loader2,
} from 'lucide-react'

import { useStorefront } from '@/context/StorefrontContext'
import {
  Input,
  Textarea,
  useToast,
} from '@/components/ui'
import { storefrontService } from '@/services/storefrontService'
import { api } from '@/services/api'
import PhoneInput from '@/components/ui/PhoneInput'

type PaymentMethod =
  | 'mpesa'
  | 'cash'
  | 'whatsapp'

// ── M-Pesa polling state ──────────────────────────────────────────────────────

type MpesaPollingStatus =
  | 'waiting'
  | 'paid'
  | 'failed'
  | 'expired'

interface STKPushResponse {
  message: string
  checkout_request_id: string
  amount: string
}

interface MpesaStatusResponse {
  status:
    | 'pending'
    | 'paid'
    | 'failed'
    | 'expired'
  order_id?: string
  order_number?: string
  reason?: string
}

// ── M-Pesa waiting overlay ────────────────────────────────────────────────────

interface MpesaWaitingOverlayProps {
  phone: string
  amount: string
  pollingStatus: MpesaPollingStatus
  failureReason: string
  onRetry: () => void
  onCancel: () => void
}

function MpesaWaitingOverlay({
  phone,
  amount,
  pollingStatus,
  failureReason,
  onRetry,
  onCancel,
}: MpesaWaitingOverlayProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm px-4">
      <div className="bg-white rounded-[20px] shadow-2xl max-w-sm w-full p-8 text-center">

        {/* Waiting */}
        {pollingStatus === 'waiting' && (
          <>
            <div className="w-16 h-16 rounded-full bg-green-light flex items-center justify-center mx-auto mb-5">
              <Loader2
                size={30}
                className="text-green animate-spin"
              />
            </div>

            <h2 className="font-serif text-[22px] text-ink mb-2">
              Waiting for payment…
            </h2>

            <p className="text-[14px] text-slate mb-1">
              A payment request of{' '}
              <strong className="text-ink">
                KSh {parseFloat(amount).toLocaleString()}
              </strong>{' '}
              has been sent to
            </p>

            <p className="font-mono font-bold text-ink text-[15px] mb-5">
              {phone}
            </p>

            <p className="text-[13px] text-slate mb-6">
              Open your M-PESA menu and enter your PIN
              to complete the payment. This page will
              update automatically.
            </p>

            <button
              onClick={onCancel}
              className="text-[13px] text-slate underline hover:text-ink"
            >
              Cancel and go back
            </button>
          </>
        )}

        {/* Payment successful */}
        {pollingStatus === 'paid' && (
          <>
            <div className="w-16 h-16 rounded-full bg-green-light flex items-center justify-center mx-auto mb-5">
              <CheckCircle
                size={30}
                className="text-green"
              />
            </div>

            <h2 className="font-serif text-[22px] text-ink mb-2">
              Payment confirmed!
            </h2>

            <p className="text-[14px] text-slate">
              Redirecting to your order confirmation…
            </p>
          </>
        )}

        {/* Payment failed / expired */}
        {(pollingStatus === 'failed' ||
          pollingStatus === 'expired') && (
          <>
            <div className="w-16 h-16 rounded-full bg-red-50 flex items-center justify-center mx-auto mb-5">
              <XCircle
                size={30}
                className="text-red-500"
              />
            </div>

            <h2 className="font-serif text-[22px] text-ink mb-2">
              Payment{' '}
              {pollingStatus === 'expired'
                ? 'timed out'
                : 'failed'}
            </h2>

            <p className="text-[14px] text-slate mb-6">
              {pollingStatus === 'expired'
                ? 'The M-PESA request expired. Please try again.'
                : failureReason ||
                  'Your payment was not completed. Please try again.'}
            </p>

            <div className="flex flex-col gap-3">
              <button
                onClick={onRetry}
                className="w-full py-3 bg-ink text-white font-semibold text-[14px] rounded-[10px] hover:opacity-90 transition-opacity"
              >
                Try again
              </button>

              <button
                onClick={onCancel}
                className="text-[13px] text-slate underline hover:text-ink"
              >
                Cancel
              </button>
            </div>
          </>
        )}

      </div>
    </div>
  )
}

// ── Main checkout page ────────────────────────────────────────────────────────

export default function StorefrontCheckout() {
  const {
    cart,
    business,
    clearCart,
    basePath,
    setFulfillmentType,
  } = useStorefront()

  const navigate = useNavigate()
  const { toast } = useToast()

  const primary =
    business?.theme.primaryColor ?? '#C79A3D'

  const ds = business?.deliverySettings

  const deliveryEnabled =
    ds?.deliveryEnabled ?? true

  const pickupEnabled =
    ds?.pickupEnabled ?? true

  const [form, setForm] = useState({
    name: '',
    phone: '',
    email: '',
    address: '',
    notes: '',
  })

  const [payment, setPayment] =
    useState<PaymentMethod>('mpesa')

  const [submitting, setSubmitting] =
    useState(false)

  const [errors, setErrors] =
    useState<Partial<typeof form>>({})

  /*
   * Normalized phone number generated by PhoneInput.
   *
   * Example:
   *
   * 0712345678 -> 254712345678
   * 712345678  -> 254712345678
   */
  const [normalizedPhone, setNormalizedPhone] =
    useState('')

  // ── M-PESA polling state ──────────────────────────────────────────────────

  const [mpesaOverlay, setMpesaOverlay] =
    useState(false)

  const [mpesaPolling, setMpesaPolling] =
    useState<MpesaPollingStatus>('waiting')

  const [mpesaCheckoutId, setMpesaCheckoutId] =
    useState('')

  const [mpesaAmount, setMpesaAmount] =
    useState('')

  const [mpesaFailReason, setMpesaFailReason] =
    useState('')

  const pollIntervalRef =
    useRef<ReturnType<typeof setInterval> | null>(null)

  const pollAttemptsRef =
    useRef(0)

  // Poll for approximately 3 minutes.
  // 60 attempts × 3 seconds.
  const MAX_POLL_ATTEMPTS = 60

  const set = (
    key: keyof typeof form,
    value: string
  ) => {
    setForm(previous => ({
      ...previous,
      [key]: value,
    }))

    setErrors(previous => ({
      ...previous,
      [key]: '',
    }))
  }

  // ── Validation ─────────────────────────────────────────────────────────────

  const validate = () => {
    const errors: Partial<typeof form> = {}

    if (!form.name.trim()) {
      errors.name = 'Full name is required'
    }

    if (!form.phone.trim()) {
      errors.phone = 'Phone number is required'
    }

    if (
      cart.fulfillmentType === 'delivery' &&
      !form.address.trim()
    ) {
      errors.address =
        'Delivery address is required'
    }

    return errors
  }

  // ── Stop polling ───────────────────────────────────────────────────────────

  const stopPolling = () => {
    if (pollIntervalRef.current) {
      clearInterval(pollIntervalRef.current)
      pollIntervalRef.current = null
    }

    pollAttemptsRef.current = 0
  }

  // Clean up polling when leaving the page.
  useEffect(() => {
    return () => {
      stopPolling()
    }
  }, [])

  // ── Start M-PESA polling ──────────────────────────────────────────────────

  const startPolling = (
    checkoutRequestId: string,
    orderAmount: string
  ) => {
    setMpesaCheckoutId(checkoutRequestId)
    setMpesaAmount(orderAmount)
    setMpesaPolling('waiting')
    setMpesaFailReason('')
    setMpesaOverlay(true)

    pollAttemptsRef.current = 0

    pollIntervalRef.current =
      setInterval(async () => {
        pollAttemptsRef.current += 1

        // Timeout after maximum attempts.
        if (
          pollAttemptsRef.current >
          MAX_POLL_ATTEMPTS
        ) {
          stopPolling()

          setMpesaPolling('expired')
          setSubmitting(false)

          return
        }

        try {
          const response =
            await api.get<MpesaStatusResponse>(
              `/api/v1/payments/mpesa/status/${checkoutRequestId}/`
            )

          if (response.status === 'paid') {
            stopPolling()

            setMpesaPolling('paid')

            clearCart()

            // Give the user a moment to see
            // the successful payment message.
            setTimeout(() => {
              navigate(
                `${basePath}/success?order=${response.order_number ?? ''}&payment=mpesa`
              )
            }, 1200)
          }

          if (
            response.status === 'failed' ||
            response.status === 'expired'
          ) {
            stopPolling()

            setMpesaPolling(response.status)

            setMpesaFailReason(
              response.reason ?? ''
            )

            setSubmitting(false)
          }

          // pending:
          // continue polling.
        } catch {
          /*
           * Network error while polling.
           *
           * We deliberately keep polling because
           * the payment may still be processing.
           */
        }
      }, 3000)
  }

  // ── M-PESA cancel ─────────────────────────────────────────────────────────

  const handleMpesaCancel = () => {
    stopPolling()

    setMpesaOverlay(false)
    setSubmitting(false)
  }

  // ── M-PESA retry ──────────────────────────────────────────────────────────

  const handleMpesaRetry = () => {
    stopPolling()

    setMpesaOverlay(false)
    setMpesaPolling('waiting')
    setMpesaFailReason('')
    setSubmitting(false)

    /*
     * The customer can click Place Order again.
     */
  }

  // ── Submit ─────────────────────────────────────────────────────────────────

  const handleSubmit = async () => {
    const validationErrors = validate()

    if (
      Object.keys(validationErrors).length > 0
    ) {
      setErrors(validationErrors)
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
       * STEP 1
       *
       * Create the order.
       *
       * The customer's original phone value is
       * stored with the order.
       *
       * Example:
       *
       * customer_phone:
       * 0712345678
       */
      const confirmation =
        await storefrontService.placeOrder(
          business.slug,
          {
            customer_name: form.name,

            customer_phone: form.phone,

            customer_email:
              form.email || undefined,

            delivery_address:
              cart.fulfillmentType === 'delivery'
                ? form.address || undefined
                : undefined,

            order_notes:
              form.notes || undefined,

            fulfillment_type:
              cart.fulfillmentType,

            payment_method:
              payment === 'whatsapp'
                ? 'cash'
                : payment,

            items: cart.items.map(item => ({
              product_id: item.productId,
              quantity: item.quantity,
            })),
          }
        )

      /*
       * STEP 2
       *
       * M-PESA payment.
       *
       * PhoneInput provides the normalized number.
       *
       * Example:
       *
       * User enters:
       * 0712345678
       *
       * normalizedPhone:
       * 254712345678
       */
      if (payment === 'mpesa') {
        const stkResponse =
          await api.post<STKPushResponse>(
            '/api/v1/payments/stk-push/',
            {
              order_id: confirmation.id,

              /*
               * IMPORTANT:
               * M-PESA receives the normalized
               * international-format phone number.
               */
              phone: normalizedPhone,
            }
          )

        /*
         * Start waiting for the M-PESA callback
         * and payment status.
         */
        startPolling(
          stkResponse.checkout_request_id,
          stkResponse.amount
        )

        return
      }

      /*
       * STEP 3
       *
       * CASH / WHATSAPP
       *
       * The order has already been created,
       * so we can immediately show success.
       */
      clearCart()

      navigate(
        `${basePath}/success?order=${confirmation.order_number}`
      )
    } catch (error: unknown) {
      toast(
        'error',
        'Payment failed',
        error instanceof Error
          ? error.message
          : 'Unable to place your order. Please try again.'
      )

      setSubmitting(false)
    }
  }

  // ── Payment options ───────────────────────────────────────────────────────

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

  // ── Empty cart ────────────────────────────────────────────────────────────

  if (cart.items.length === 0) {
    navigate(`${basePath}/cart`)
    return null
  }

  return (
    <>
      {/* M-PESA payment waiting overlay */}
      {mpesaOverlay && (
        <MpesaWaitingOverlay
          phone={form.phone}
          amount={mpesaAmount}
          pollingStatus={mpesaPolling}
          failureReason={mpesaFailReason}
          onRetry={handleMpesaRetry}
          onCancel={handleMpesaCancel}
        />
      )}

      <div className="max-w-[1200px] mx-auto px-5 lg:px-8 py-10">

        {/* Back to cart */}
        <button
          onClick={() =>
            navigate(`${basePath}/cart`)
          }
          className="flex items-center gap-2 text-[13.5px] text-slate hover:text-ink mb-7"
        >
          <ArrowLeft size={15} />
          Back to cart
        </button>

        <h1 className="font-serif text-[32px] text-ink mb-8">
          Checkout
        </h1>

        <div className="grid lg:grid-cols-3 gap-8">

          {/* ────────────────────────────────────────────────────────────────
              FORM
          ──────────────────────────────────────────────────────────────── */}

          <div className="lg:col-span-2 space-y-6">

            {/* Fulfillment */}
            {(deliveryEnabled ||
              pickupEnabled) && (
              <div className="bg-white border border-sand rounded-[14px] p-6">

                <h2 className="font-serif text-[18px] font-medium text-ink mb-4">
                  How would you like to receive your order?
                </h2>

                <div className="grid sm:grid-cols-2 gap-3">

                  {/* Delivery */}
                  {deliveryEnabled && (
                    <button
                      type="button"
                      onClick={() =>
                        setFulfillmentType(
                          'delivery'
                        )
                      }
                      className={[
                        'flex items-center gap-4 p-4 rounded-[12px] border-2 transition-all text-left',
                        cart.fulfillmentType ===
                        'delivery'
                          ? 'border-ink bg-ivory/60'
                          : 'border-sand hover:border-sand-dark',
                      ].join(' ')}
                    >
                      <div
                        className={[
                          'w-10 h-10 rounded-[10px] flex items-center justify-center shrink-0',
                          cart.fulfillmentType ===
                          'delivery'
                            ? 'bg-ink text-ivory'
                            : 'bg-ivory text-slate border border-sand',
                        ].join(' ')}
                      >
                        <Truck size={18} />
                      </div>

                      <div>
                        <p className="font-semibold text-ink text-[14px]">
                          Delivery
                        </p>

                        <p className="text-[12.5px] text-slate mt-0.5">
                          {cart.deliveryFee ===
                          0
                            ? 'Free delivery'
                            : `KSh ${(ds?.deliveryFee ?? 300).toLocaleString()} fee`}
                        </p>
                      </div>
                    </button>
                  )}

                  {/* Pickup */}
                  {pickupEnabled && (
                    <button
                      type="button"
                      onClick={() =>
                        setFulfillmentType(
                          'pickup'
                        )
                      }
                      className={[
                        'flex items-center gap-4 p-4 rounded-[12px] border-2 transition-all text-left',
                        cart.fulfillmentType ===
                        'pickup'
                          ? 'border-ink bg-ivory/60'
                          : 'border-sand hover:border-sand-dark',
                      ].join(' ')}
                    >
                      <div
                        className={[
                          'w-10 h-10 rounded-[10px] flex items-center justify-center shrink-0',
                          cart.fulfillmentType ===
                          'pickup'
                            ? 'bg-ink text-ivory'
                            : 'bg-ivory text-slate border border-sand',
                        ].join(' ')}
                      >
                        <Store size={18} />
                      </div>

                      <div>
                        <p className="font-semibold text-ink text-[14px]">
                          Pick up myself
                        </p>

                        <p className="text-[12.5px] text-slate mt-0.5">
                          No delivery fee
                        </p>
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
                  onChange={e =>
                    set(
                      'name',
                      e.target.value
                    )
                  }
                  error={errors.name}
                />

                <div className="grid sm:grid-cols-2 gap-4">

                  {/* Phone */}
                  <div className="relative">
                    <PhoneInput
                      label="Phone number *"
                      placeholder="712 345 678"
                      value={form.phone}
                      onChange={value =>
                        set('phone', value)
                      }
                      onNormalizedChange={
                        setNormalizedPhone
                      }
                      error={errors.phone}
                    />

                    {/* <p className="absolute left-0 top-full mt-1.5 text-[11.5px] text-slate">
                      Enter your number as 07XXXXXXXX or start with 7XXXXXXXX.
                    </p> */}
                  </div>

                  {/* Email */}
                  <Input
                    label="Email (optional)"
                    type="email"
                    placeholder="your@email.com"
                    value={form.email}
                    onChange={e =>
                      set(
                        'email',
                        e.target.value
                      )
                    }
                  />

                </div>

                {/* Delivery address */}
                {cart.fulfillmentType ===
                  'delivery' && (
                  <Input
                    label="Delivery address *"
                    placeholder="e.g. Westlands, Nairobi or full physical address"
                    value={form.address}
                    onChange={e =>
                      set(
                        'address',
                        e.target.value
                      )
                    }
                    error={errors.address}
                  />
                )}

                {/* Notes */}
                <Textarea
                  label="Order notes (optional)"
                  placeholder="Any special instructions for your order…"
                  value={form.notes}
                  onChange={e =>
                    set(
                      'notes',
                      e.target.value
                    )
                  }
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

                {paymentOptions.map(option => (
                  <label
                    key={option.id}
                    className={[
                      'flex items-start gap-4 p-4 rounded-[12px] border-2 cursor-pointer transition-all',
                      payment === option.id
                        ? 'border-ink bg-ivory/60'
                        : 'border-sand hover:border-sand-dark',
                    ].join(' ')}
                  >
                    <input
                      type="radio"
                      name="payment"
                      value={option.id}
                      checked={
                        payment === option.id
                      }
                      onChange={() =>
                        setPayment(
                          option.id
                        )
                      }
                      className="mt-0.5 accent-ink"
                    />

                    <div className="flex items-start gap-3">

                      <div
                        className={[
                          'w-9 h-9 rounded-[9px] flex items-center justify-center shrink-0',
                          payment === option.id
                            ? 'bg-ink text-ivory'
                            : 'bg-ivory text-slate border border-sand',
                        ].join(' ')}
                      >
                        {option.icon}
                      </div>

                      <div>
                        <p className="font-semibold text-ink text-[14px]">
                          {option.label}
                        </p>

                        <p className="text-[13px] text-slate mt-0.5">
                          {option.desc}
                        </p>
                      </div>

                    </div>
                  </label>
                ))}

              </div>

              {/* M-PESA information */}
              {payment === 'mpesa' && (
                <div className="mt-4 bg-green-light border border-green/20 rounded-[12px] p-4 text-[13.5px] text-ink">

                  <p className="font-semibold mb-1">
                    M-PESA payment
                  </p>

                  <p className="text-slate">
                    Enter your M-PESA phone number above and click
                    <strong className="text-ink">
                      {' '}Place Order
                    </strong>.
                  </p>

                  <p className="text-slate mt-1">
                    A payment request will be sent to your phone.
                    You'll be prompted to enter your M-PESA PIN to confirm.
                  </p>

                  <p className="text-slate mt-1">
                    Your order will only be completed after payment is confirmed.
                  </p>

                </div>
              )}

            </div>

          </div>

          {/* ────────────────────────────────────────────────────────────────
              ORDER SUMMARY
          ──────────────────────────────────────────────────────────────── */}

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
                          src={
                            item.product
                              .images[0]
                          }
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
                        item.product
                          .sellingPrice *
                        item.quantity
                      ).toLocaleString()}
                    </p>

                  </div>
                ))}

              </div>

              {/* Totals */}
              <div className="border-t border-sand pt-3 space-y-2 text-[13.5px]">

                <div className="flex justify-between">
                  <span className="text-slate">
                    Subtotal
                  </span>

                  <span>
                    KSh{' '}
                    {cart.subtotal.toLocaleString()}
                  </span>
                </div>

                <div className="flex justify-between">

                  <span className="text-slate">
                    {cart.fulfillmentType ===
                    'pickup'
                      ? 'Pickup'
                      : 'Delivery'}
                  </span>

                  <span
                    className={
                      cart.deliveryFee === 0
                        ? 'text-green font-semibold'
                        : ''
                    }
                  >
                    {cart.fulfillmentType ===
                    'pickup'
                      ? 'Free — self pickup'
                      : cart.deliveryFee === 0
                        ? 'Free'
                        : `KSh ${cart.deliveryFee.toLocaleString()}`}
                  </span>

                </div>

                <div className="flex justify-between font-bold text-[15px] text-ink pt-1 border-t border-sand">

                  <span>Total</span>

                  <span>
                    KSh{' '}
                    {cart.total.toLocaleString()}
                  </span>

                </div>

              </div>

              {/* Place order */}
              <button
                onClick={handleSubmit}
                disabled={submitting}
                className="w-full mt-5 flex items-center justify-center gap-2 py-4 text-white font-semibold text-[15px] rounded-[10px] disabled:opacity-60 hover:opacity-90 transition-opacity"
                style={{
                  background: primary,
                }}
              >
                {submitting &&
                !mpesaOverlay ? (
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : null}

                {submitting &&
                !mpesaOverlay
                  ? payment === 'mpesa'
                    ? 'Sending M-PESA request…'
                    : 'Placing order…'
                  : 'Place Order'}
              </button>

            </div>
          </div>

        </div>
      </div>
    </>
  )
}