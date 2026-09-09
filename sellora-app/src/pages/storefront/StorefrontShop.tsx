import React, { useState, useMemo } from 'react'
import { useSearchParams } from 'react-router-dom'
import { SlidersHorizontal, X } from 'lucide-react'
import { useStorefront } from '@/context/StorefrontContext'
import { ProductCard } from '@/components/storefront/ProductCard'
import { SearchInput } from '@/components/ui'

type SortOption = 'featured' | 'newest' | 'price-asc' | 'price-desc' | 'best-selling'

const sortLabels: Record<SortOption, string> = {
  featured: 'Featured',
  newest: 'Newest',
  'price-asc': 'Price: Low to High',
  'price-desc': 'Price: High to Low',
  'best-selling': 'Best Selling',
}

export default function StorefrontShop() {
  const { products, business } = useStorefront()
  const [searchParams] = useSearchParams()
  const primary = business?.theme.primaryColor ?? '#C79A3D'

  const [search, setSearch] = useState(searchParams.get('q') ?? '')
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [sort, setSort] = useState<SortOption>((searchParams.get('sort') as SortOption) ?? 'featured')
  const [priceMin, setPriceMin] = useState('')
  const [priceMax, setPriceMax] = useState('')
  const [showFilters, setShowFilters] = useState(false)

  // Build categories from products
  const categories = useMemo(() => {
    const cats = new Map<string, string>()
    products.forEach(p => cats.set(p.categoryId, p.categoryName))
    return Array.from(cats.entries()).map(([id, name]) => ({ id, name }))
  }, [products])

  const filtered = useMemo(() => {
    let list = [...products]
    if (search) list = list.filter(p => p.name.toLowerCase().includes(search.toLowerCase()))
    if (selectedCategory !== 'all') list = list.filter(p => p.categoryId === selectedCategory)
    if (priceMin) list = list.filter(p => p.sellingPrice >= parseInt(priceMin))
    if (priceMax) list = list.filter(p => p.sellingPrice <= parseInt(priceMax))

    switch (sort) {
      case 'newest': list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()); break
      case 'price-asc': list.sort((a, b) => a.sellingPrice - b.sellingPrice); break
      case 'price-desc': list.sort((a, b) => b.sellingPrice - a.sellingPrice); break
      case 'best-selling': list.sort((a, b) => b.totalSold - a.totalSold); break
      default: list.sort((a, b) => (b.isFeatured ? 1 : 0) - (a.isFeatured ? 1 : 0))
    }
    return list
  }, [products, search, selectedCategory, sort, priceMin, priceMax])

  const hasFilters = selectedCategory !== 'all' || priceMin || priceMax || search

  const FilterPanel = () => (
    <div className="space-y-6">
      <div>
        <p className="text-[12px] font-semibold uppercase tracking-widest text-slate mb-3">Category</p>
        <div className="space-y-1">
          {[{ id: 'all', name: 'All Products' }, ...categories].map(cat => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              className={[
                'w-full text-left px-3 py-2 rounded-[8px] text-[13.5px] transition-colors',
                selectedCategory === cat.id ? 'font-semibold' : 'text-slate hover:text-ink',
              ].join(' ')}
              style={selectedCategory === cat.id ? { color: primary, background: `${primary}12` } : {}}
            >
              {cat.name}
            </button>
          ))}
        </div>
      </div>

      <div>
        <p className="text-[12px] font-semibold uppercase tracking-widest text-slate mb-3">Price range (KSh)</p>
        <div className="flex items-center gap-2">
          <input
            type="number"
            placeholder="Min"
            value={priceMin}
            onChange={e => setPriceMin(e.target.value)}
            className="w-full bg-ivory border border-sand rounded-[8px] px-3 py-2 text-[13px] focus:outline-none focus:border-ink"
          />
          <span className="text-slate">–</span>
          <input
            type="number"
            placeholder="Max"
            value={priceMax}
            onChange={e => setPriceMax(e.target.value)}
            className="w-full bg-ivory border border-sand rounded-[8px] px-3 py-2 text-[13px] focus:outline-none focus:border-ink"
          />
        </div>
      </div>

      {hasFilters && (
        <button
          onClick={() => { setSelectedCategory('all'); setPriceMin(''); setPriceMax(''); setSearch('') }}
          className="w-full py-2 text-[13px] font-semibold text-red border border-red-light rounded-[8px] hover:bg-red-light transition-colors"
        >
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
        <p className="text-[14px] text-slate">{filtered.length} product{filtered.length !== 1 ? 's' : ''}</p>
      </div>

      {/* Controls */}
      <div className="flex flex-wrap gap-3 mb-7 items-center">
        <SearchInput
          value={search}
          onChange={setSearch}
          placeholder="Search products…"
          className="w-full sm:w-64"
        />
        <select
          value={sort}
          onChange={e => setSort(e.target.value as SortOption)}
          className="bg-white border border-sand rounded-[9px] px-3 py-2.5 text-[13.5px] text-ink focus:outline-none"
        >
          {Object.entries(sortLabels).map(([val, label]) => (
            <option key={val} value={val}>{label}</option>
          ))}
        </select>

        {/* Mobile filter toggle */}
        <button
          onClick={() => setShowFilters(!showFilters)}
          className="lg:hidden flex items-center gap-2 px-4 py-2.5 border border-sand rounded-[9px] text-[13.5px] font-semibold text-ink"
        >
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
        {/* Desktop sidebar filters */}
        <aside className="hidden lg:block w-56 shrink-0">
          <div className="sticky top-24">
            <FilterPanel />
          </div>
        </aside>

        {/* Product grid */}
        <div className="flex-1 min-w-0">
          {filtered.length === 0 ? (
            <div className="text-center py-20">
              <p className="font-serif text-[22px] text-ink mb-3">No products found</p>
              <p className="text-slate mb-6">Try adjusting your filters or search term.</p>
              <button
                onClick={() => { setSelectedCategory('all'); setPriceMin(''); setPriceMax(''); setSearch('') }}
                className="text-ink font-semibold hover:underline"
              >
                Clear all filters
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 lg:gap-5">
              {filtered.map(p => <ProductCard key={p.id} product={p} />)}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
