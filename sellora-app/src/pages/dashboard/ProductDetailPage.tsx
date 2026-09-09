import React, { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft, Upload, Plus, X } from 'lucide-react'
import {
  Button, Input, Textarea, Select, Toggle, PageHeader, useToast,
} from '@/components/ui'
import { productService, categoryService } from '@/services'
import { useAuth } from '@/context/AuthContext'
import type { Product, Category } from '@/types'

const statusOptions = [
  { value: 'active', label: 'Active' },
  { value: 'draft', label: 'Draft' },
  { value: 'archived', label: 'Archived' },
]

const badgeOptions = [
  { value: '', label: 'No badge' },
  { value: 'new', label: 'New' },
  { value: 'best-seller', label: 'Best Seller' },
  { value: 'sale', label: 'Sale' },
  { value: 'limited', label: 'Limited' },
]

export default function ProductDetailPage() {
  const { id } = useParams<{ id: string }>()
  const isNew = !id || id === 'new'
  const navigate = useNavigate()
  const { currentBusiness } = useAuth()
  const { toast } = useToast()

  const [loading, setLoading] = useState(!isNew)
  const [saving, setSaving] = useState(false)
  const [categories, setCategories] = useState<Category[]>([])
  const [form, setForm] = useState<Partial<Product>>({
    name: '', description: '', categoryId: '', sellingPrice: 0,
    costPrice: 0, sku: '', stockQuantity: 0, lowStockThreshold: 5,
    status: 'active', isAvailable: true, isFeatured: false,
    badge: undefined, images: [], tags: [],
  })

  useEffect(() => {
    if (!currentBusiness) return
    categoryService.getAll(currentBusiness.id).then(setCategories)
    if (!isNew && id) {
      productService.getById(id).then(p => {
        if (p) setForm(p)
        setLoading(false)
      })
    }
  }, [currentBusiness, id, isNew])

  const set = (key: keyof Product, value: unknown) =>
    setForm(prev => ({ ...prev, [key]: value }))

  const catOptions = categories.map(c => ({ value: c.id, label: c.name }))

  const handleSave = async () => {
    if (!form.name?.trim()) {
      toast('error', 'Name required', 'Please enter a product name.')
      return
    }
    setSaving(true)
    try {
      if (isNew) {
        const slug = (form.name ?? '').toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')
        const catName = categories.find(c => c.id === form.categoryId)?.name ?? ''
        await productService.create({
          ...form,
          slug,
          categoryName: catName,
          businessId: currentBusiness!.id,
          tags: form.tags ?? [],
          images: form.images ?? [],
        } as any)
        toast('success', 'Product created', `${form.name} has been added to your store.`)
      } else {
        await productService.update(id!, form)
        toast('success', 'Product updated', 'Changes have been saved.')
      }
      navigate('/app/products')
    } catch {
      toast('error', 'Save failed', 'Please try again.')
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="space-y-4 animate-pulse">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="h-14 bg-sand rounded-[10px]" />
        ))}
      </div>
    )
  }

  return (
    <div className="space-y-5 fade-in">
      <PageHeader
        title={isNew ? 'Add Product' : (form.name ?? 'Edit Product')}
        breadcrumb={[{ label: 'Products', href: '/app/products' }, { label: isNew ? 'New' : 'Edit' }]}
        actions={
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => navigate('/app/products')}>Cancel</Button>
            <Button variant="primary" loading={saving} onClick={handleSave}>
              {isNew ? 'Create Product' : 'Save Changes'}
            </Button>
          </div>
        }
      />

      <div className="grid lg:grid-cols-3 gap-5">
        {/* Main form */}
        <div className="lg:col-span-2 space-y-5">
          {/* Basic info */}
          <div className="bg-white border border-sand rounded-[14px] p-5">
            <h3 className="font-serif text-[16px] font-medium text-ink mb-4">Basic information</h3>
            <div className="space-y-4">
              <Input
                label="Product name"
                placeholder="e.g. Velvet Oud Eau de Parfum"
                value={form.name ?? ''}
                onChange={e => set('name', e.target.value)}
              />
              <Textarea
                label="Description"
                placeholder="Describe this product to your customers…"
                value={form.description ?? ''}
                onChange={e => set('description', e.target.value)}
                rows={4}
              />
              <div className="grid sm:grid-cols-2 gap-4">
                <Select
                  label="Category"
                  options={catOptions}
                  placeholder="Select category"
                  value={form.categoryId ?? ''}
                  onChange={e => set('categoryId', e.target.value)}
                />
                <Input
                  label="SKU"
                  placeholder="e.g. MA-VO-001"
                  value={form.sku ?? ''}
                  onChange={e => set('sku', e.target.value)}
                  helpText="Unique product code."
                />
              </div>
            </div>
          </div>

          {/* Pricing */}
          <div className="bg-white border border-sand rounded-[14px] p-5">
            <h3 className="font-serif text-[16px] font-medium text-ink mb-4">Pricing</h3>
            <div className="grid sm:grid-cols-2 gap-4">
              <Input
                label="Selling price (KSh)"
                type="number"
                placeholder="0"
                value={form.sellingPrice?.toString() ?? ''}
                onChange={e => set('sellingPrice', Number(e.target.value))}
              />
              <Input
                label="Cost price (KSh)"
                type="number"
                placeholder="0"
                value={form.costPrice?.toString() ?? ''}
                onChange={e => set('costPrice', Number(e.target.value))}
                helpText="Not shown to customers."
              />
            </div>
            {(form.costPrice ?? 0) > 0 && (form.sellingPrice ?? 0) > 0 && (
              <div className="mt-3 text-[13px] text-slate">
                Margin:{' '}
                <strong className="text-green">
                  {(((form.sellingPrice! - form.costPrice!) / form.sellingPrice!) * 100).toFixed(0)}%
                </strong>{' '}
                (KSh {(form.sellingPrice! - form.costPrice!).toLocaleString()} per unit)
              </div>
            )}
          </div>

          {/* Inventory */}
          <div className="bg-white border border-sand rounded-[14px] p-5">
            <h3 className="font-serif text-[16px] font-medium text-ink mb-4">Inventory</h3>
            <div className="grid sm:grid-cols-2 gap-4">
              <Input
                label="Stock quantity"
                type="number"
                placeholder="0"
                value={form.stockQuantity?.toString() ?? ''}
                onChange={e => set('stockQuantity', Number(e.target.value))}
              />
              <Input
                label="Low stock alert threshold"
                type="number"
                placeholder="5"
                value={form.lowStockThreshold?.toString() ?? ''}
                onChange={e => set('lowStockThreshold', Number(e.target.value))}
                helpText="Alert when stock drops below this."
              />
            </div>
          </div>

          {/* Images */}
          <div className="bg-white border border-sand rounded-[14px] p-5">
            <h3 className="font-serif text-[16px] font-medium text-ink mb-4">Product images</h3>
            <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
              {(form.images ?? []).map((img, i) => (
                <div key={i} className="relative aspect-square rounded-[10px] overflow-hidden border border-sand group">
                  <img src={img} alt="" className="w-full h-full object-cover" />
                  <button
                    onClick={() => set('images', (form.images ?? []).filter((_, j) => j !== i))}
                    className="absolute top-1 right-1 w-5 h-5 bg-white/90 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <X size={11} className="text-red" />
                  </button>
                </div>
              ))}
              <button className="aspect-square rounded-[10px] border-2 border-dashed border-sand flex flex-col items-center justify-center gap-1 hover:border-ink/30 transition-colors">
                <Upload size={16} className="text-slate" />
                <span className="text-[11px] text-slate">Add</span>
              </button>
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-5">
          {/* Status & visibility */}
          <div className="bg-white border border-sand rounded-[14px] p-5">
            <h3 className="font-serif text-[16px] font-medium text-ink mb-4">Status & visibility</h3>
            <div className="space-y-4">
              <Select
                label="Status"
                options={statusOptions}
                value={form.status ?? 'active'}
                onChange={e => set('status', e.target.value)}
              />
              <Select
                label="Badge"
                options={badgeOptions}
                value={form.badge ?? ''}
                onChange={e => set('badge', e.target.value || undefined)}
              />
              <Toggle
                checked={form.isAvailable ?? true}
                onChange={v => set('isAvailable', v)}
                label="Available for purchase"
                helpText="Toggle off to hide from store."
              />
              <Toggle
                checked={form.isFeatured ?? false}
                onChange={v => set('isFeatured', v)}
                label="Featured product"
                helpText="Show on homepage featured section."
              />
            </div>
          </div>

          {/* Preview */}
          {form.name && (
            <div className="bg-white border border-sand rounded-[14px] p-5">
              <h3 className="font-serif text-[16px] font-medium text-ink mb-4">Store preview</h3>
              <div className="border border-sand rounded-[10px] overflow-hidden">
                <div className="aspect-square bg-sand">
                  {(form.images?.[0]) && (
                    <img src={form.images[0]} alt="" className="w-full h-full object-cover" />
                  )}
                </div>
                <div className="p-3">
                  <p className="text-[13px] font-semibold text-ink">{form.name}</p>
                  {form.categoryId && (
                    <p className="text-[11px] text-slate">
                      {categories.find(c => c.id === form.categoryId)?.name}
                    </p>
                  )}
                  {(form.sellingPrice ?? 0) > 0 && (
                    <p className="font-serif text-[16px] font-semibold text-ink mt-2">
                      KSh {form.sellingPrice?.toLocaleString()}
                    </p>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
