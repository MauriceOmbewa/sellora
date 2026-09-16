import { useState, useEffect, useCallback } from 'react'
import { useSearchParams, useParams } from 'react-router-dom'
import { SlidersHorizontal, X } from 'lucide-react'
import { useStorefront } from '@/context/StorefrontContext'
import { ProductCard } from '@/components/storefront/ProductCard'
import { SearchInput, Skeleton } from '@/components/ui'
import { storefrontService } from '@/services/storefrontService'
import type { Product } from '@/types'

type SortOption = 'featured' | 'newest' | 'price-asc' | 'price-desc' | 'best-selling'

const sortLabels: Record<SortOption, string> = {
  featured:      'Featured',
  newest:        'Newest',
  'price-asc':   'Price: Low to High',
  'price-desc':  'Price: High to Low',
  'best-selling':'Best Selling',
}

export default function StorefrontShop() {
    const { business, categories, basePath } = useStorefront()
  const [searchParams] = useSearchParams()
  const primary = business?.theme.primaryColor ?? '#C79A3D'

  const [products, setProducts]     = useState<Product[]>([])
  const [totalCount, setTotalCount] = useState(0)
  const [page, setPage]             = useState(1)
  const [loading, setLoading]       = useState(true)
  const PAGE_SIZE = 20

  const [search, setSearch]                 = useState(searchParams.get('q') ?? '')
  const [selectedCategory, setCategory]    = useState('')
  const [sort, setSort]                    = useState<SortOption>((searchParams.get('sort') as SortOption) ?? 'featured')
  const [priceMin, setPriceMin]            = useState('')
  const [priceMax, setPriceMax]            = useState('')
  const [showFilters, setShowFilters]      = useState(false)

  const load = useCallback((pg = 1) => {
    if (!business) return
    setLoading(true)
    storefrontService.getProducts(business.slug, {
      search:      search || undefined,
      category_id: selectedCategory || undefined,
      sort,
      page:        pg,
      page_size:   PAGE_SIZE,
    }).then(({ products, count }) => {
      // Apply client-side price filter (API doesn't support it)
      let filtered = products
      if (priceMin) filtered = filtered.filter(p => p.sellingPrice >= parseInt(priceMin))
      if (priceMax) filtered = filtered.filter(p => p.sellingPrice <= parseInt(priceMax))
      setProducts(filtered)
      setTotalCount(count)
      setPage(pg)
    }).catch(() => {}).finally(() => setLoading(false))
  }, [business?.slug, search, selectedCategory, sort, priceMin, priceMax]) // eslint-disable-line

  useEffect(() => { load(1) }, [business?.slug, search, selectedCategory, sort]) // eslint-disable-line

  const hasFilters = selectedCategory || priceMin || priceMax || search
  const totalPages = Math.ceil(totalCount / PAGE_SIZE)

  const clearAll = () => { setSearch(''); setCategory(''); setPriceMin(''); setPriceMax('') }

  const FilterPanel = () => (
    <div className="space-y-6">
      {/* Category */}
      <div>
        <p className="text-[12px] font-semibold uppercase tracking-widest text-slate mb-3">Category</p>
        <div className="space-y-1">
          {[{ id: '', name: 'All Products' }, ...categories].map(cat => (
            <button key={cat.id} onClick={() => setCategory(cat.id)}
              className={['w-full text-left px-3 py-2 rounded-[8px] text-[13.5px] transition-colors',
                selectedCategory === cat.id ? 'font-semibold' : 'text-slate hover:text-ink'].join(' ')}
              style={selectedCategory === cat.id ? { color: primary, background: `${primary}12` } : {}}>
              {cat.name}
            </button>
          ))}
        </div>
      </div>

      {/* Price range */}
      <div>
        <p className="text-[12px] font-semibold uppercase tracking-widest text-slate mb-3">Price range (KSh)</p>
        <div className="flex items-center gap-2">
          <input type="number" placeholder="Min" value={priceMin} onChange={e => setPriceMin(e.target.value)}
            className="w-full bg-ivory border border-sand rounded-[8px] px-3 py-2 text-[13px] focus:outline-none focus:border-ink" />
          <span className="text-slate">–</span>
          <input type="number" placeholder="Max" value={priceMax} onChange={e => setPriceMax(e.target.value)}
            className="w-full bg-ivory border border-sand rounded-[8px] px-3 py-2 text-[13px] focus:outline-none focus:border-ink" />
        </div>
        {(priceMin || priceMax) && (
          <button onClick={() => load(1)}
            className="mt-2 text-[13px] font-semibold w-full py-2 rounded-[8px] text-white"
            style={{ background: primary }}>
            Apply
          </button>
        )}
      </div>

      {hasFilters && (
        <button onClick={clearAll}
          className="w-full py-2 text-[13px] font-semibold text-red border border-red-light rounded-[8px] hover:bg-red-light transition-colors">
          Clear all filters
        </button>
      )}
    </div>
  )

  return (
    <div className="max-w-[1200px] mx-auto px-5 lg:px-8 py-10">
      {/* Header */}
      <div className="mb-7">
        <h1 className="font-serif text-[32px] text-ink mb-1">Shop All Products</h1>
        <p className="text-[14px] text-slate">{totalCount} product{totalCount !== 1 ? 's' : ''}</p>
      </div>

      {/* Controls */}
      <div className="flex flex-wrap gap-3 mb-7 items-center">
        <SearchInput value={search} onChange={setSearch} placeholder="Search products…" className="w-full sm:w-64" />
        <select value={sort} onChange={e => setSort(e.target.value as SortOption)}
          className="bg-white border border-sand rounded-[9px] px-3 py-2.5 text-[13.5px] text-ink focus:outline-none">
          {Object.entries(sortLabels).map(([val, label]) => (
            <option key={val} value={val}>{label}</option>
          ))}
        </select>
        <button onClick={() => setShowFilters(!showFilters)}
          className="lg:hidden flex items-center gap-2 px-4 py-2.5 border border-sand rounded-[9px] text-[13.5px] font-semibold text-ink">
          <SlidersHorizontal size={15} />
          Filters {hasFilters && <span className="w-2 h-2 bg-red rounded-full" />}
        </button>
      </div>

      {/* Mobile filters */}
      {showFilters && (
        <div className="lg:hidden bg-white border border-sand rounded-[14px] p-5 mb-5">
          <div className="flex items-center justify-between mb-4">
            <p className="font-semibold text-ink">Filters</p>
            <button onClick={() => setShowFilters(false)}><X size={16} className="text-slate" /></button>
          </div>
          <FilterPanel />
        </div>
      )}

      <div className="flex gap-7">
        {/* Desktop sidebar */}
        <aside className="hidden lg:block w-56 shrink-0">
          <div className="sticky top-24"><FilterPanel /></div>
        </aside>

        {/* Products */}
        <div className="flex-1 min-w-0">
          {loading ? (
            <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
              {Array.from({length: 6}).map((_, i) => (
                <div key={i} className="rounded-[14px] overflow-hidden border border-sand">
                  <Skeleton className="aspect-square" />
                  <div className="p-4 space-y-2"><Skeleton height={14} className="w-3/4" /><Skeleton height={16} className="w-1/2" /></div>
                </div>
              ))}
            </div>
          ) : products.length === 0 ? (
            <div className="text-center py-20">
              <p className="font-serif text-[22px] text-ink mb-3">No products found</p>
              <p className="text-slate mb-6">Try adjusting your filters or search term.</p>
              <button onClick={clearAll} className="text-ink font-semibold hover:underline">Clear all filters</button>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 lg:gap-5">
                {products.map(p => <ProductCard key={p.id} product={p} />)}
              </div>
              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex items-center justify-center gap-2 mt-8">
                  <button disabled={page===1} onClick={() => load(page-1)}
                    className="px-4 py-2 border border-sand rounded-[8px] text-[13px] disabled:opacity-40 hover:border-ink">
                    Previous
                  </button>
                  <span className="text-[13px] text-slate">Page {page} of {totalPages}</span>
                  <button disabled={page===totalPages} onClick={() => load(page+1)}
                    className="px-4 py-2 border border-sand rounded-[8px] text-[13px] disabled:opacity-40 hover:border-ink">
                    Next
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  )
}
