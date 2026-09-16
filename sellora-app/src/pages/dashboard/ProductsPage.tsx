import { useEffect, useState, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { Plus, Package, Edit, Trash2, Eye } from 'lucide-react'
import {
  Badge, Button, PageHeader, SearchInput,
  EmptyState, ConfirmModal, useToast, Skeleton,
} from '@/components/ui'
import { productService, categoryService } from '@/services/productService'
import { useAuth } from '@/context/AuthContext'
import type { Product, Category } from '@/types'

const statusVariant: Record<string, 'success' | 'warning' | 'outline'> = {
  active: 'success', draft: 'warning', archived: 'outline',
}

export default function ProductsPage() {
  const { currentBusiness } = useAuth()
  const navigate = useNavigate()
  const { toast } = useToast()

  const [products, setProducts] = useState<Product[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [totalCount, setTotalCount] = useState(0)
  const [page, setPage] = useState(1)
  const PAGE_SIZE = 20

  const [search, setSearch]           = useState('')
  const [catFilter, setCatFilter]     = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [view, setView]               = useState<'table' | 'grid'>('table')
  const [deleteTarget, setDeleteTarget] = useState<Product | null>(null)
  const [deleting, setDeleting]       = useState(false)

  const load = useCallback(async (pg = 1) => {
    if (!currentBusiness) return
    setLoading(true)
    try {
      const [result, cats] = await Promise.all([
        productService.getAll(currentBusiness.id, {
          search:      search || undefined,
          category_id: catFilter || undefined,
          status:      (statusFilter as any) || undefined,
          page:        pg,
          page_size:   PAGE_SIZE,
        }),
        categories.length === 0 ? categoryService.getAll(currentBusiness.id) : Promise.resolve(categories),
      ])
      setProducts(result.products)
      setTotalCount(result.count)
      if (categories.length === 0) setCategories(cats)
      setPage(pg)
    } catch (err: unknown) {
      toast('error', 'Failed to load products', err instanceof Error ? err.message : '')
    } finally {
      setLoading(false)
    }
  }, [currentBusiness?.id, search, catFilter, statusFilter]) // eslint-disable-line

  useEffect(() => { load(1) }, [currentBusiness?.id, search, catFilter, statusFilter]) // eslint-disable-line

  const handleDelete = async () => {
    if (!deleteTarget || !currentBusiness) return
    setDeleting(true)
    try {
      await productService.delete(currentBusiness.id, deleteTarget.id)
      toast('success', 'Product archived', `${deleteTarget.name} has been removed from your store.`)
      load(page)
    } catch (err: unknown) {
      toast('error', 'Delete failed', err instanceof Error ? err.message : '')
    } finally {
      setDeleting(false)
      setDeleteTarget(null)
    }
  }

  const stockBadge = (p: Product) => {
    if (p.stockQuantity === 0)                         return <Badge variant="danger">Out of stock</Badge>
    if (p.stockQuantity <= p.lowStockThreshold)        return <Badge variant="warning">{p.stockQuantity} left</Badge>
    return                                                    <Badge variant="success">{p.stockQuantity} in stock</Badge>
  }

  const totalPages = Math.ceil(totalCount / PAGE_SIZE)

  // Count hidden products (draft or archived) in current view
  const hiddenCount = products.filter(p => p.status !== 'active' || !p.isAvailable).length

  return (
    <div className="space-y-5 fade-in">
      <PageHeader
        title="Products"
        subtitle={`${totalCount} product${totalCount !== 1 ? 's' : ''} in your store`}
        actions={
          <Button variant="primary" icon={<Plus size={15} />} onClick={() => navigate('/app/products/new')}>
            Add Product
          </Button>
        }
      />

      {/* Warn about hidden products so owners know why storefront looks empty */}
      {!loading && hiddenCount > 0 && !statusFilter && (
        <div className="bg-gold-light border border-gold/30 rounded-[12px] px-4 py-3 flex items-start gap-3">
          <span className="text-[15px] shrink-0">⚠️</span>
          <p className="text-[13.5px] text-ink-soft">
            <strong>{hiddenCount} product{hiddenCount !== 1 ? 's are' : ' is'} hidden</strong> from your storefront
            (status is Draft or Archived, or "Available" is off).
            {' '}<button onClick={() => navigate('/app/products/' + products.find(p => p.status !== 'active')?.id)}
              className="text-gold-deep font-semibold hover:underline">
              Fix now →
            </button>
          </p>
        </div>
      )}
      {/* Filters */}
      <div className="bg-white border border-sand rounded-[14px] p-4">
        <div className="flex flex-wrap gap-3 items-center">
          <SearchInput
            value={search}
            onChange={v => setSearch(v)}
            placeholder="Search products…"
            className="w-full sm:w-64"
          />
          <select
            value={catFilter}
            onChange={e => setCatFilter(e.target.value)}
            className="bg-white border border-sand rounded-[8px] px-3 py-2 text-[13px] text-ink focus:outline-none focus:ring-2 focus:ring-gold/20"
          >
            <option value="">All categories</option>
            {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
          <select
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value)}
            className="bg-white border border-sand rounded-[8px] px-3 py-2 text-[13px] text-ink focus:outline-none focus:ring-2 focus:ring-gold/20"
          >
            <option value="">All statuses</option>
            <option value="active">Active</option>
            <option value="draft">Draft</option>
            <option value="archived">Archived</option>
          </select>
          <div className="ml-auto flex gap-1 bg-ivory border border-sand rounded-[8px] p-1">
            {(['table', 'grid'] as const).map(v => (
              <button
                key={v}
                onClick={() => setView(v)}
                className={['px-3 py-1 text-[12px] font-semibold rounded-[6px] capitalize', view === v ? 'bg-white text-ink shadow-sm' : 'text-slate'].join(' ')}
              >
                {v}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Content */}
      {loading ? (
        <div className="bg-white border border-sand rounded-[14px] p-5 space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="flex gap-3 items-center py-3 border-b border-sand last:border-0">
              <Skeleton width={40} height={40} className="rounded-[8px] shrink-0" />
              <div className="flex-1 space-y-2">
                <Skeleton height={14} className="w-1/3" />
                <Skeleton height={12} className="w-1/5" />
              </div>
            </div>
          ))}
        </div>
      ) : products.length === 0 ? (
        <div className="bg-white border border-sand rounded-[14px]">
          <EmptyState
            icon={<Package size={22} />}
            title={search || catFilter || statusFilter ? 'No products found' : 'No products yet'}
            description={search || catFilter || statusFilter
              ? 'Try adjusting your search or filters.'
              : 'Add your first product to start selling.'}
            action={!search && !catFilter && !statusFilter
              ? { label: 'Add Product', onClick: () => navigate('/app/products/new') }
              : undefined}
          />
        </div>
      ) : view === 'table' ? (
        <div className="bg-white border border-sand rounded-[14px] overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[700px]">
              <thead>
                <tr className="border-b border-sand bg-ivory/50">
                  {['Product', 'Category', 'Price', 'Stock', 'Sales', 'Status', ''].map(h => (
                    <th key={h} className="text-left text-[11px] font-semibold text-slate py-3.5 px-4 first:pl-5 last:pr-5 uppercase tracking-wide">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {products.map(p => (
                  <tr key={p.id} className="border-b border-sand last:border-0 hover:bg-ivory/40 group">
                    <td className="py-3.5 pl-5 pr-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-[8px] bg-sand shrink-0 overflow-hidden">
                          {p.images[0] && <img src={p.images[0]} alt={p.name} className="w-full h-full object-cover" />}
                        </div>
                        <div>
                          <p className="text-[13.5px] font-semibold text-ink">{p.name}</p>
                          <p className="text-[11.5px] text-slate">{p.sku || '—'}</p>
                        </div>
                      </div>
                    </td>
                    <td className="py-3.5 pr-4 text-[13px] text-slate">{p.categoryName || '—'}</td>
                    <td className="py-3.5 pr-4">
                      <p className="text-[13.5px] font-semibold text-ink">KSh {p.sellingPrice.toLocaleString()}</p>
                      {p.salePrice && <p className="text-[11.5px] text-slate line-through">KSh {p.salePrice.toLocaleString()}</p>}
                    </td>
                    <td className="py-3.5 pr-4">{stockBadge(p)}</td>
                    <td className="py-3.5 pr-4 text-[13px] text-slate">{p.totalSold} sold</td>
                    <td className="py-3.5 pr-4">
                      <Badge variant={statusVariant[p.status] ?? 'outline'}>{p.status}</Badge>
                    </td>
                    <td className="py-3.5 pr-5">
                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button onClick={() => navigate(`/app/products/${p.id}`)} className="p-1.5 text-slate hover:text-ink hover:bg-sand rounded-[6px]" title="Edit"><Edit size={14} /></button>
                        <button onClick={() => window.open(`/store/${currentBusiness?.slug}/product/${p.slug}`, '_blank')} className="p-1.5 text-slate hover:text-ink hover:bg-sand rounded-[6px]" title="View in store"><Eye size={14} /></button>
                        <button onClick={() => setDeleteTarget(p)} className="p-1.5 text-slate hover:text-red hover:bg-red-light rounded-[6px]" title="Archive"><Trash2 size={14} /></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between px-5 py-3 border-t border-sand">
              <p className="text-[13px] text-slate">
                Showing {(page - 1) * PAGE_SIZE + 1}–{Math.min(page * PAGE_SIZE, totalCount)} of {totalCount}
              </p>
              <div className="flex gap-2">
                <button
                  disabled={page === 1}
                  onClick={() => load(page - 1)}
                  className="px-3 py-1.5 text-[13px] border border-sand rounded-[7px] disabled:opacity-40 hover:border-ink"
                >
                  Previous
                </button>
                <button
                  disabled={page === totalPages}
                  onClick={() => load(page + 1)}
                  className="px-3 py-1.5 text-[13px] border border-sand rounded-[7px] disabled:opacity-40 hover:border-ink"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </div>
      ) : (
        /* Grid view */
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {products.map(p => (
            <div key={p.id} className="bg-white border border-sand rounded-[14px] overflow-hidden hover:border-ink/20 transition-all group">
              <div className="relative aspect-square bg-sand overflow-hidden">
                {p.images[0] && <img src={p.images[0]} alt={p.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />}
                {p.badge && (
                  <div className="absolute top-2 left-2">
                    <Badge variant={p.badge as any}>{p.badge.replace('-', ' ')}</Badge>
                  </div>
                )}
              </div>
              <div className="p-4">
                <p className="text-[13.5px] font-semibold text-ink mb-0.5">{p.name}</p>
                <p className="text-[12px] text-slate mb-3">{p.categoryName || '—'}</p>
                <div className="flex items-center justify-between">
                  <p className="font-serif text-[16px] font-semibold text-ink">KSh {p.sellingPrice.toLocaleString()}</p>
                  {stockBadge(p)}
                </div>
                <div className="flex gap-2 mt-3">
                  <button onClick={() => navigate(`/app/products/${p.id}`)} className="flex-1 py-2 text-[12.5px] font-semibold text-center border border-sand rounded-[7px] hover:border-ink hover:bg-ivory transition-colors">Edit</button>
                  <button onClick={() => setDeleteTarget(p)} className="px-3 py-2 text-[12.5px] text-red border border-red-light rounded-[7px] hover:bg-red-light transition-colors"><Trash2 size={13} /></button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <ConfirmModal
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        title="Archive product?"
        description={`"${deleteTarget?.name}" will be archived and hidden from your store.`}
        confirmText="Archive product"
        cancelText="Keep it"
        variant="danger"
        loading={deleting}
      />
    </div>
  )
}
