import { useState, useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { Plus, ArrowRight, TrendingUp, ShoppingBag, LogOut, Trash2 } from 'lucide-react'
import { useAuth } from '@/context/AuthContext'
import { Avatar, ConfirmModal, useToast } from '@/components/ui'
import { tokenStorage } from '@/services/api'
import { businessService } from '@/services/businessService'
import type { Business } from '@/types'

const categoryLabels: Record<string, string> = {
  cosmetics: 'Cosmetics & skincare',
  perfumes: 'Perfume & fragrance',
  fashion: 'Fashion & boutique',
  accessories: 'Accessories & jewellery',
  beauty: 'Beauty',
  gifts: 'Gifts',
  electronics: 'Electronics',
  food: 'Food & beverage',
  other: 'Other retail',
}

function BusinessCard({ biz, onOpen }: { biz: Business; onOpen: () => void }) {
  return (
    <button
      onClick={onOpen}
      className="text-left bg-white border border-sand rounded-[16px] p-6 flex flex-col hover:border-ink/30 hover:-translate-y-0.5 transition-all duration-150 focus-visible:outline-2 focus-visible:outline-gold"
    >
      <div className="flex items-start justify-between mb-5">
        <div
          className="w-11 h-11 rounded-[12px] flex items-center justify-center font-serif font-semibold text-[18px]"
          style={{ background: biz.theme.primaryColor, color: '#FAF8F3' }}
        >
          {biz.name[0]}
        </div>
        <span className="text-[11px] font-semibold text-slate bg-ivory border border-sand px-2.5 py-1 rounded-full">
          Owner
        </span>
      </div>

      <h3 className="font-serif text-[18px] font-medium text-ink mb-1">{biz.name}</h3>
      <p className="text-[13px] text-slate mb-5">
        {categoryLabels[biz.category] ?? biz.category} · {biz.contact.city}
      </p>

      <div className="flex gap-5 pt-4 border-t border-sand mb-5">
        <div>
          <p className="font-serif text-[16px] font-semibold text-ink">
            KSh {(biz.totalRevenue / 1000).toFixed(0)}K
          </p>
          <p className="text-[11px] text-slate mt-0.5">Total revenue</p>
        </div>
        <div>
          <p className="font-serif text-[16px] font-semibold text-ink">{biz.totalOrders}</p>
          <p className="text-[11px] text-slate mt-0.5">Orders</p>
        </div>
        <div>
          <p className="font-serif text-[16px] font-semibold text-ink">{biz.totalProducts}</p>
          <p className="text-[11px] text-slate mt-0.5">Products</p>
        </div>
      </div>

      <div className="flex items-center justify-between text-[13.5px] font-semibold text-ink mt-auto">
        <span>Open dashboard</span>
        <ArrowRight size={15} />
      </div>
    </button>
  )
}

function AddBusinessCard({ onClick }: { onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="text-left bg-transparent border-2 border-dashed border-sand rounded-[16px] p-6 flex flex-col items-center justify-center min-h-[260px] hover:border-ink/30 hover:bg-white transition-all duration-150"
    >
      <div className="w-11 h-11 rounded-[12px] bg-ivory border border-sand flex items-center justify-center mb-4">
        <Plus size={18} className="text-ink" />
      </div>
      <h3 className="font-serif text-[16px] font-medium text-ink mb-2">Add a new business</h3>
      <p className="text-[13px] text-slate text-center max-w-[180px]">
        Set up a shop and get its storefront live in minutes.
      </p>
    </button>
  )
}

export default function MyBusinessesPage() {
  const { user, businesses, setCurrentBusiness, signOut, handleAuthCallback, authState, refreshBusinesses } = useAuth()
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()
  const [callbackLoading, setCallbackLoading] = useState(false)
  const [callbackError, setCallbackError] = useState('')
  const [deleteTarget, setDeleteTarget] = useState<Business | null>(null)
  const [deleting, setDeleting] = useState(false)
  const { toast } = useToast()

  // ── Handle tokens arriving from Google OAuth callback ──────────────────────
  // Backend redirects to: /businesses?access=TOKEN&refresh=TOKEN
  // This MUST run before any auth guard check.
  useEffect(() => {
    const access = searchParams.get('access')
    const refresh = searchParams.get('refresh')
    const message = searchParams.get('message')

    if (message) {
      setCallbackError(decodeURIComponent(message))
      setSearchParams({}, { replace: true })
      return
    }

    if (access && refresh) {
      // Strip tokens from URL immediately — never leave them visible
      setSearchParams({}, { replace: true })
      setCallbackLoading(true)
      handleAuthCallback(access, refresh)
        .catch(err => setCallbackError(err?.message ?? 'Sign-in failed. Please try again.'))
        .finally(() => setCallbackLoading(false))
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // ── Redirect to /login if no tokens and not authenticated ─────────────────
  // Only redirect once authState has settled (not 'loading') and there are
  // no URL tokens being processed.
  useEffect(() => {
    const hasUrlTokens = searchParams.get('access') || searchParams.get('refresh')
    if (callbackLoading || hasUrlTokens) return

    if (authState === 'unauthenticated') {
      navigate('/login', { replace: true })
    }
    if (authState === 'needs-onboarding') {
      navigate('/onboarding', { replace: true })
    }
  }, [authState, callbackLoading]) // eslint-disable-line react-hooks/exhaustive-deps

  const handleOpen = (biz: Business) => {
    setCurrentBusiness(biz)
    navigate('/app')
  }

  const handleAdd = () => navigate('/onboarding')

  const handleDelete = async () => {
    if (!deleteTarget) return
    setDeleting(true)
    try {
      await businessService.delete(deleteTarget.id)
      await refreshBusinesses()
      toast('success', 'Business deleted', `${deleteTarget.name} has been removed.`)
    } catch (err: unknown) {
      toast('error', 'Delete failed', err instanceof Error ? err.message : 'Please try again.')
    } finally {
      setDeleting(false)
      setDeleteTarget(null)
    }
  }

  // Show full-page loader while processing the OAuth callback or while auth
  // state is still resolving (avoids flash of unauthenticated content)
  if (callbackLoading || authState === 'loading') {
    return (
      <div className="min-h-screen bg-ivory flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 rounded-[10px] bg-gold flex items-center justify-center font-serif font-bold text-ink text-[18px]">S</div>
          <div className="w-5 h-5 border-2 border-gold/30 border-t-gold rounded-full animate-spin" />
          <p className="text-[13.5px] text-slate">
            {callbackLoading ? 'Completing sign-in…' : 'Loading…'}
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-ivory">
      {/* Callback loading overlay — shown while handleAuthCallback runs */}
      {callbackLoading && (
        <div className="fixed inset-0 bg-ivory/80 backdrop-blur-sm z-50 flex items-center justify-center">
          <div className="flex flex-col items-center gap-3">
            <div className="w-8 h-8 rounded-[8px] bg-gold flex items-center justify-center font-serif font-bold text-ink">S</div>
            <div className="w-5 h-5 border-2 border-gold/30 border-t-gold rounded-full animate-spin" />
            <p className="text-[13px] text-slate">Signing you in…</p>
          </div>
        </div>
      )}

      {/* Callback error banner */}
      {callbackError && (
        <div className="bg-red-light border-b border-red/20 px-6 py-3 text-center">
          <p className="text-[13.5px] text-red font-medium">{callbackError}</p>
        </div>
      )}
      {/* Header */}
      <header className="sticky top-0 z-20 bg-ivory/90 backdrop-blur-md border-b border-sand">
        <div className="max-w-[1080px] mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-[8px] bg-ink flex items-center justify-center">
              <span className="text-gold font-serif font-bold text-[14px]">S</span>
            </div>
            <span className="font-serif font-semibold text-[18px] text-ink">Sellora</span>
          </div>

          <div className="flex items-center gap-3">
            <div className="hidden sm:flex items-center gap-2.5">
              <Avatar name={user?.name ?? 'U'} size="sm" />
              <div>
                <p className="text-[13.5px] font-semibold text-ink">{user?.name}</p>
                <p className="text-[11.5px] text-slate">{user?.email}</p>
              </div>
            </div>
            <button
              onClick={() => { signOut().then(() => navigate('/')) }}
              className="flex items-center gap-2 text-[13px] text-slate hover:text-ink px-3 py-1.5 rounded-[7px] hover:bg-sand transition-colors"
            >
              <LogOut size={14} />
              <span className="hidden sm:inline">Sign out</span>
            </button>
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="max-w-[1080px] mx-auto px-6 py-12">
        {/* Page heading */}
        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-5 mb-10">
          <div>
            <h1 className="font-serif text-[32px] font-medium text-ink">Your businesses</h1>
            <p className="text-[15px] text-slate mt-2">
              Pick a business to manage, or add a new one to your account.
            </p>
          </div>
          <button
            onClick={handleAdd}
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-ink text-ivory text-[14px] font-semibold rounded-[9px] hover:bg-ink-soft transition-colors shrink-0"
          >
            <Plus size={15} />
            Add business
          </button>
        </div>

        {/* Stats bar */}
        {businesses.length > 0 && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-10">
            {[
              {
                icon: <TrendingUp size={16} className="text-gold" />,
                label: 'Total revenue',
                value: `KSh ${(businesses.reduce((s, b) => s + b.totalRevenue, 0) / 1000000).toFixed(1)}M`,
              },
              {
                icon: <ShoppingBag size={16} className="text-green" />,
                label: 'Total orders',
                value: businesses.reduce((s, b) => s + b.totalOrders, 0).toLocaleString(),
              },
              {
                icon: <Avatar name="B" size="xs" />,
                label: 'Businesses',
                value: businesses.length.toString(),
              },
              {
                icon: <Avatar name="C" size="xs" />,
                label: 'Total customers',
                value: businesses.reduce((s, b) => s + b.totalCustomers, 0).toLocaleString(),
              },
            ].map(stat => (
              <div key={stat.label} className="bg-white border border-sand rounded-[12px] p-4">
                <div className="mb-2">{stat.icon}</div>
                <p className="font-serif text-[22px] font-semibold text-ink">{stat.value}</p>
                <p className="text-[12px] text-slate mt-0.5">{stat.label}</p>
              </div>
            ))}
          </div>
        )}

        {/* Grid */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {businesses.map(biz => (
            <div key={biz.id} className="relative group">
              <BusinessCard biz={biz} onOpen={() => handleOpen(biz)} />
              <button
                onClick={e => { e.stopPropagation(); setDeleteTarget(biz) }}
                className="absolute top-3 right-3 p-1.5 bg-white border border-sand rounded-[7px] text-slate hover:text-red hover:border-red-light opacity-0 group-hover:opacity-100 transition-all"
                title="Delete business"
              >
                <Trash2 size={13} />
              </button>
            </div>
          ))}
          <AddBusinessCard onClick={handleAdd} />
        </div>
      </main>

      <ConfirmModal
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        title="Delete business?"
        description={`"${deleteTarget?.name}" and all its data will be permanently deleted. This cannot be undone.`}
        confirmText="Delete business"
        cancelText="Keep it"
        variant="danger"
        loading={deleting}
      />
    </div>
  )
}
