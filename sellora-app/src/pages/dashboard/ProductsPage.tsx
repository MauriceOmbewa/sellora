import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Plus, Package, Edit, Trash2, Eye } from 'lucide-react'
import {
  Badge, Button, PageHeader, SearchInput,
  EmptyState, ConfirmModal, useToast,
} from '@/components/ui'
import { productService, categoryService } from '@/services'
import { useAuth } from '@/context/AuthContext'
import type { Product, Category } from '@/types'

const statusVariant: Record<string, any> = {
  active: 'success', draft: 'warning', archived: 'outline',
}

export default function ProductsPage() {
  const { currentBusiness } = useAuth()
  const navigate = useNavigate()
  const { toast } = useToast()

  const [products, setProducts] = useState<Product[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [catFilter, setCatFilter] = useState('all')
  const [statusFilter, setStatusFilter] = useState('all')
  const [deleteTarget, setDeleteTarget] = useState<Product | null>(null)
  const [view, setView] = useState<'table' | 'grid'>('table')

  useEffect(() => {
    if (!currentBusiness) return
    Promise.all([
      productService.getAll(currentBusiness.id),
      categoryService.getAll(currentBusiness.id),
    ]).then(([prods, cats]) => {
      setProducts(prods)
      setCategories(cats)
      setLoading(false)
    })
  }, [currentBusiness])

  const filtered = products.filter(p => {
    if (search && !p.name.toLowerCase().includes(search.toLowerCase())) return false
    if (catFilter !== 'all' && p.categoryId !== catFilter) return false
    if (statusFilter !== 'all' && p.status !== statusFilter) return false
    return true
  })

  const handleDelete = async () => {
    if (!deleteTarget) return
    await productService.delete(deleteTarget.id)
    setProducts(prev => prev.filter(p => p.id !== deleteTarget.id))
    toast('success', 'Product deleted', `${deleteTarget.name} has been removed.`)
    setDeleteTarget(null)
  }

  const stockBadge = (p: Product) => {
    if (p.stockQuantity === 0) return <Badge variant="danger">Out of stock</Badge>
    if (p.stockQuantity <= p.lowStockThreshold) return <Badge variant="warning">{p.stockQuantity} left</Badge>
    return <Badge variant="success">{p.stockQuantity} in stock</Badge>
  }

  return (
    <div className="space-y-5 fade-in">
      <PageHeader
        title="Products"
        subtitle={`${products.length} product${products.length !== 1 ? 's' : ''} in your store`}
        actions={
          <Button
            variant="primary"
            icon={<Plus size={15} />}
            onClick={() => navigate('/app/products/new')}
          >
            Add Product
          </Button>
        }
      />

      {/* Filters */}
      <div className="bg-white border border-sand rounded-[14px] p-4">
        <div className="flex flex-wrap gap-3 items-center">
          <SearchInput
            value={search}
            onChange={setSearch}
            placeholder="Search products…"
            className="w-full sm:w-64"
          />
          <select
            value={catFilter}
            onChange={e => setCatFilter(e.target.value)}
            className="bg-white border border-sand rounded-[8px] px-3 py-2 text-[13px] text-ink focus:outline-none focus:ring-2 focus:ring-gold/20"
          >
            <option value="all">All categories</option>
            {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
          <select
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value)}
            className="bg-white border border-sand rounded-[8px] px-3 py-2 text-[13px] text-ink focus:outline-none focus:ring-2 focus:ring-gold/20"
          >
            <option value="all">All statuses</option>
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
        <div className="bg-white border border-sand rounded-[14px] p-5">
          <div className="space-y-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="flex gap-3 items-center py-3 border-b border-sand last:border-0">
                <div className="w-10 h-10 bg-sand rounded-[8px] skeleton shrink-0" />
                <div className="flex-1 space-y-2">
                  <div className="h-3.5 skeleton rounded w-1/3" />
                  <div className="h-3 skeleton rounded w-1/5" />
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : filtered.length === 0 ? (
        <div className="bg-white border border-sand rounded-[14px]">
          <EmptyState
            icon={<Package size={22} />}
            title={search ? 'No products found' : 'No products yet'}
            description={search ? 'Try a different search term or filter.' : 'Add your first product to get started.'}
            action={!search ? { label: 'Add Product', onClick: () => navigate('/app/products/new') } : undefined}
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
                {filtered.map(p => (
                  <tr
                    key={p.id}
                    className="border-b border-sand last:border-0 hover:bg-ivory/40 transition-colors group"
                  >
                    <td className="py-3.5 pl-5 pr-4">
                      <div className="flex items-center gap-3">
                        <div
                          className="w-10 h-10 rounded-[8px] bg-sand shrink-0 overflow-hidden"
                        >
                          {p.images[0] && (
                            <img src={p.images[0]} alt={p.name} className="w-full h-full object-cover" />
                          )}
                        </div>
                        <div>
                          <p className="text-[13.5px] font-semibold text-ink">{p.name}</p>
                          <p className="text-[11.5px] text-slate">{p.sku}</p>
                        </div>
                      </div>
                    </td>
                    <td className="py-3.5 pr-4 text-[13px] text-slate">{p.categoryName}</td>
                    <td className="py-3.5 pr-4">
                      <div>
                        <p className="text-[13.5px] font-semibold text-ink">KSh {p.sellingPrice.toLocaleString()}</p>
                        {p.salePrice && <p className="text-[11.5px] text-slate line-through">KSh {p.salePrice.toLocaleString()}</p>}
                      </div>
                    </td>
                    <td className="py-3.5 pr-4">{stockBadge(p)}</td>
                    <td className="py-3.5 pr-4 text-[13px] text-slate">{p.totalSold} sold</td>
                    <td className="py-3.5 pr-4">
                      <Badge variant={statusVariant[p.status]}>{p.status}</Badge>
                    </td>
                    <td className="py-3.5 pr-5">
                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={() => navigate(`/app/products/${p.id}`)}
                          className="p-1.5 text-slate hover:text-ink hover:bg-sand rounded-[6px]"
                          title="Edit"
                        >
                          <Edit size={14} />
                        </button>
                        <button
                          onClick={() => window.open(`/store/${currentBusiness?.slug}/product/${p.slug}`, '_blank')}
                          className="p-1.5 text-slate hover:text-ink hover:bg-sand rounded-[6px]"
                          title="View in store"
                        >
                          <Eye size={14} />
                        </button>
                        <button
                          onClick={() => setDeleteTarget(p)}
                          className="p-1.5 text-slate hover:text-red hover:bg-red-light rounded-[6px]"
                          title="Delete"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        /* Grid view */
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filtered.map(p => (
            <div
              key={p.id}
              className="bg-white border border-sand rounded-[14px] overflow-hidden hover:border-ink/20 transition-all group"
            >
              <div className="relative aspect-square bg-sand overflow-hidden">
                {p.images[0] && (
                  <img src={p.images[0]} alt={p.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                )}
                {p.badge && (
                  <div className="absolute top-2 left-2">
                    <Badge variant={p.badge as any}>{p.badge.replace('-', ' ')}</Badge>
                  </div>
                )}
              </div>
              <div className="p-4">
                <p className="text-[13.5px] font-semibold text-ink mb-0.5">{p.name}</p>
                <p className="text-[12px] text-slate mb-3">{p.categoryName}</p>
                <div className="flex items-center justify-between">
                  <p className="font-serif text-[16px] font-semibold text-ink">KSh {p.sellingPrice.toLocaleString()}</p>
                  {stockBadge(p)}
                </div>
                <div className="flex gap-2 mt-3">
                  <button
                    onClick={() => navigate(`/app/products/${p.id}`)}
                    className="flex-1 py-2 text-[12.5px] font-semibold text-center border border-sand rounded-[7px] hover:border-ink hover:bg-ivory transition-colors"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => setDeleteTarget(p)}
                    className="px-3 py-2 text-[12.5px] text-red border border-red-light rounded-[7px] hover:bg-red-light transition-colors"
                  >
                    <Trash2 size={13} />
                  </button>
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
        title="Delete product?"
        description={`"${deleteTarget?.name}" will be permanently removed from your store.`}
        confirmText="Delete product"
        cancelText="Keep it"
        variant="danger"
      />
    </div>
  )
}
