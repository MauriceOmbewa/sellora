import { useState, useEffect, useCallback } from 'react'
import { useSearchParams, Link } from 'react-router-dom'
import { Search, SlidersHorizontal, X, ChevronLeft, ChevronRight, Store } from 'lucide-react'
import { marketplaceService } from '@/services/marketplaceService'
import type { MarketplaceProduct, MarketplaceProductParams } from '@/services/marketplaceService'
import { MarketplaceProductCard } from '@/components/marketplace/MarketplaceProductCard'
import { Skeleton } from '@/components/ui'

const SORT_OPTIONS = [
  { value: 'featured',     label: 'Featured' },
  { value: 'newest',       label: 'New Arrivals' },
  { value: 'best-selling', label: 'Best Selling' },
  { value: 'price-asc',    label: 'Price: Low → High' },
  { value: 'price-desc',   label: 'Price: High → Low' },
] as const

type SortValue = typeof SORT_OPTIONS[number]['value']

const PAGE_SIZE = 24

// ── Product grid skeleton ─────────────────────────────────────────────────────

function ProductSkeleton() {
  return (
    <div className="bg-white border border-sand rounded-[14px] overflow-hidden">
      <Skeleton className="aspect-square w-full" />
      <div className="p-3.5 space-y-2">
        <Skeleton className="h-3 w-1/3" />
        <Skeleton className="h-4 w-3/4" />
        <Skeleton className="h-4 w-1/2" />
      </div>
    </div>
  )
}

// ── Empty state ───────────────────────────────────────────────────────────────

function EmptyResults({ query }: { query: string }) {
  return (
    <div className="col-span-full py-20 flex flex-col items-center text-center">
      <div className="w-14 h-14 rounded-full bg-sand flex items-center justify-center mb-4">
        <Search size={22} className="text-slate" />
      </div>
      <p className="font-serif text-[22px] text-ink mb-2">No products found</p>
      <p className="text-[14px] text-slate max-w-xs">
        {query
          ? `No results for "${query}". Try a different search or browse all products.`
          : 'No products are available right now. Check back soon.'}
      </p>
    </div>
  )
}

// ── Main page ─────────────────────────────────────────────────────────────────

export default function MarketplacePage() {
  const [searchParams, setSearchParams] = useSearchParams()

  const [products, setProducts]   = useState<MarketplaceProduct[]>([])
  const [loading, setLoading]     = useState(true)
  const [totalCount, setTotal]    = useState(0)
  const [totalPages, setTotalPages] = useState(1)

  // Controlled inputs
  const [searchInput, setSearchInput] = useState(searchParams.get('q') ?? '')

  // Derived from URL params (single source of truth)
  const currentSearch = searchParams.get('q') ?? ''
  const currentSort   = (searchParams.get('sort') ?? 'featured') as SortValue
  const currentPage   = parseInt(searchParams.get('page') ?? '1', 10)

  const updateParams = useCallback((updates: Record<string, string>) => {
    setSearchParams(prev => {
      const next = new URLSearchParams(prev)
      Object.entries(updates).forEach(([k, v]) => {
        if (v) next.set(k, v); else next.delete(k)
      })
      // Reset page when filter/sort changes (but not when page itself changes)
      if (!('page' in updates)) next.delete('page')
      return next
    })
  }, [setSearchParams])

  useEffect(() => {
    setLoading(true)
    const params: MarketplaceProductParams = {
      search:    currentSearch || undefined,
      sort:      currentSort,
      page:      currentPage,
      page_size: PAGE_SIZE,
    }

    marketplaceService.getProducts(params)
      .then(({ products, count, totalPages }) => {
        setProducts(products)
        setTotal(count)
        setTotalPages(totalPages)
      })
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [currentSearch, currentSort, currentPage])

  // Sync search input when URL changes externally (e.g. back/forward)
  useEffect(() => {
    setSearchInput(searchParams.get('q') ?? '')
  }, [searchParams])

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    updateParams({ q: searchInput.trim() })
  }

  const clearSearch = () => {
    setSearchInput('')
    updateParams({ q: '' })
  }

  const startItem = (currentPage - 1) * PAGE_SIZE + 1
  const endItem   = Math.min(currentPage * PAGE_SIZE, totalCount)

  return (
    <div className="min-h-screen bg-ivory">
      {/* ── Header ─────────────────────────────────────────── */}
      <div className="pt-24 pb-10 border-b border-sand bg-white">
        <div className="max-w-[1200px] mx-auto px-5 lg:px-8">
          <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-5">
            <div>
              <p className="text-[12px] font-semibold text-green uppercase tracking-widest mb-1">
                Sellora Marketplace
              </p>
              <h1 className="font-serif text-[34px] text-ink leading-tight">
                Shop from all stores
              </h1>
              <p className="text-[14px] text-slate mt-1">
                {loading ? (
                  <span className="inline-block w-32 h-4 bg-sand rounded animate-pulse" />
                ) : (
                  `${totalCount.toLocaleString()} products across Kenyan stores`
                )}
              </p>
            </div>

            {/* Search */}
            <form
              onSubmit={handleSearchSubmit}
              className="flex items-center gap-2 w-full md:w-auto md:min-w-[320px]"
            >
              <div className="relative flex-1">
                <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate pointer-events-none" />
                <input
                  type="search"
                  value={searchInput}
                  onChange={e => setSearchInput(e.target.value)}
                  placeholder="Search products…"
                  className="w-full pl-9 pr-9 py-2.5 bg-ivory border border-sand rounded-[9px] text-[13.5px] focus:outline-none focus:border-ink transition-colors"
                />
                {searchInput && (
                  <button
                    type="button"
                    onClick={clearSearch}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate hover:text-ink"
                    aria-label="Clear search"
                  >
                    <X size={13} />
                  </button>
                )}
              </div>
              <button
                type="submit"
                className="px-4 py-2.5 bg-ink text-ivory text-[13.5px] font-semibold rounded-[9px] hover:bg-ink-soft transition-colors shrink-0"
              >
                Search
              </button>
            </form>
          </div>

          {/* Sort + active filters */}
          <div className="flex flex-wrap items-center gap-3 mt-5">
            <div className="flex items-center gap-2">
              <SlidersHorizontal size={14} className="text-slate" />
              <span className="text-[13px] text-slate font-medium">Sort:</span>
            </div>
            <div className="flex flex-wrap gap-2">
              {SORT_OPTIONS.map(opt => (
                <button
                  key={opt.value}
                  onClick={() => updateParams({ sort: opt.value })}
                  className={[
                    'px-3 py-1.5 rounded-full text-[12.5px] font-medium transition-colors',
                    currentSort === opt.value
                      ? 'bg-ink text-ivory'
                      : 'bg-white border border-sand text-ink-soft hover:border-ink hover:text-ink',
                  ].join(' ')}
                >
                  {opt.label}
                </button>
              ))}
            </div>

            {currentSearch && (
              <button
                onClick={clearSearch}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-gold/15 text-gold-deep rounded-full text-[12.5px] font-medium hover:bg-gold/25 transition-colors"
              >
                <X size={11} />
                "{currentSearch}"
              </button>
            )}
          </div>
        </div>
      </div>

      {/* ── Product grid ───────────────────────────────────── */}
      <div className="max-w-[1200px] mx-auto px-5 lg:px-8 py-10">
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
          {loading ? (
            Array.from({ length: PAGE_SIZE }).map((_, i) => <ProductSkeleton key={i} />)
          ) : products.length === 0 ? (
            <EmptyResults query={currentSearch} />
          ) : (
            products.map(product => (
              <MarketplaceProductCard key={product.id} product={product} />
            ))
          )}
        </div>

        {/* Pagination */}
        {!loading && totalPages > 1 && (
          <div className="flex items-center justify-between mt-10 pt-6 border-t border-sand">
            <p className="text-[13px] text-slate">
              Showing {startItem}–{endItem} of {totalCount.toLocaleString()}
            </p>
            <div className="flex items-center gap-2">
              <button
                onClick={() => updateParams({ page: String(currentPage - 1) })}
                disabled={currentPage <= 1}
                className="w-9 h-9 rounded-[8px] border border-sand flex items-center justify-center hover:border-ink disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                aria-label="Previous page"
              >
                <ChevronLeft size={15} />
              </button>
              {Array.from({ length: totalPages }, (_, i) => i + 1)
                .filter(p => p === 1 || p === totalPages || Math.abs(p - currentPage) <= 1)
                .reduce<(number | '...')[]>((acc, p, i, arr) => {
                  if (i > 0 && typeof arr[i - 1] === 'number' && (p as number) - (arr[i - 1] as number) > 1) {
                    acc.push('...')
                  }
                  acc.push(p)
                  return acc
                }, [])
                .map((p, i) =>
                  p === '...' ? (
                    <span key={`ellipsis-${i}`} className="w-9 h-9 flex items-center justify-center text-slate text-[13px]">…</span>
                  ) : (
                    <button
                      key={p}
                      onClick={() => updateParams({ page: String(p) })}
                      className={[
                        'w-9 h-9 rounded-[8px] text-[13px] font-semibold transition-colors',
                        p === currentPage
                          ? 'bg-ink text-ivory'
                          : 'border border-sand hover:border-ink text-ink',
                      ].join(' ')}
                    >
                      {p}
                    </button>
                  )
                )
              }
              <button
                onClick={() => updateParams({ page: String(currentPage + 1) })}
                disabled={currentPage >= totalPages}
                className="w-9 h-9 rounded-[8px] border border-sand flex items-center justify-center hover:border-ink disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                aria-label="Next page"
              >
                <ChevronRight size={15} />
              </button>
            </div>
          </div>
        )}

        {/* Vendor CTA */}
        <div className="mt-16 bg-ink rounded-[20px] px-8 py-10 flex flex-col sm:flex-row items-center justify-between gap-6">
          <div>
            <p className="font-serif text-[24px] text-ivory mb-2">Sell your products here</p>
            <p className="text-[14px] text-ivory/60 max-w-sm">
              Join hundreds of Kenyan vendors on Sellora. Get your own branded storefront and start selling today.
            </p>
          </div>
          <Link
            to="/login"
            className="flex items-center gap-2 px-6 py-3.5 bg-gold text-ink font-semibold text-[14px] rounded-[10px] hover:bg-gold-deep transition-colors shrink-0"
          >
            <Store size={15} />
            Open Your Store
          </Link>
        </div>
      </div>
    </div>
  )
}
