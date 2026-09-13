import { useEffect, useState, useRef } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { X, Upload, Loader2 } from 'lucide-react'
import { Button, Input, Textarea, Select, Toggle, PageHeader, useToast, Skeleton } from '@/components/ui'
import { productService, categoryService } from '@/services/productService'
import { uploadService } from '@/services/uploadService'
import { useAuth } from '@/context/AuthContext'
import type { Product, Category } from '@/types'

const statusOptions  = [
  { value: 'active',   label: 'Active' },
  { value: 'draft',    label: 'Draft' },
  { value: 'archived', label: 'Archived' },
]
const badgeOptions = [
  { value: '',           label: 'No badge' },
  { value: 'new',        label: 'New' },
  { value: 'best-seller',label: 'Best Seller' },
  { value: 'sale',       label: 'Sale' },
  { value: 'limited',    label: 'Limited' },
]

type FormState = {
  name: string; description: string; category_id: string
  selling_price: string; cost_price: string; sale_price: string
  sku: string; stock_quantity: string; low_stock_threshold: string
  status: string; is_available: boolean; is_featured: boolean
  badge: string; tags: string[]; images: string[]
}

const blankForm: FormState = {
  name: '', description: '', category_id: '',
  selling_price: '', cost_price: '', sale_price: '',
  sku: '', stock_quantity: '0', low_stock_threshold: '5',
  status: 'draft', is_available: true, is_featured: false,
  badge: '', tags: [], images: [],
}

export default function ProductDetailPage() {
  const { id } = useParams<{ id: string }>()
  const isNew = !id || id === 'new'
  const navigate = useNavigate()
  const { currentBusiness } = useAuth()
  const { toast } = useToast()

  const [loading, setLoading]       = useState(!isNew)
  const [saving, setSaving]         = useState(false)
  const [uploading, setUploading]   = useState(false)
  const [categories, setCategories] = useState<Category[]>([])
  const [form, setForm]             = useState<FormState>(blankForm)
  const [tagInput, setTagInput]     = useState('')
  const fileInputRef                = useRef<HTMLInputElement>(null)

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const err = uploadService.validate(file)
    if (err) { toast('error', 'Invalid file', err); return }
    setUploading(true)
    try {
      const url = await uploadService.uploadImage(file, 'products')
      set('images', [...form.images, url])
      toast('success', 'Image uploaded')
    } catch (uploadErr: unknown) {
      toast('error', 'Upload failed', uploadErr instanceof Error ? uploadErr.message : '')
    } finally {
      setUploading(false)
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }

  useEffect(() => {
    if (!currentBusiness) return
    categoryService.getAll(currentBusiness.id).then(setCategories)

    if (!isNew && id) {
      productService.getById(currentBusiness.id, id).then(p => {
        setForm({
          name:               p.name,
          description:        p.description,
          category_id:        p.categoryId,
          selling_price:      String(p.sellingPrice),
          cost_price:         String(p.costPrice),
          sale_price:         p.salePrice ? String(p.salePrice) : '',
          sku:                p.sku,
          stock_quantity:     String(p.stockQuantity),
          low_stock_threshold: String(p.lowStockThreshold),
          status:             p.status,
          is_available:       p.isAvailable,
          is_featured:        p.isFeatured,
          badge:              p.badge ?? '',
          tags:               p.tags,
          images:             p.images,
        })
        setLoading(false)
      }).catch(() => {
        toast('error', 'Product not found')
        navigate('/app/products')
      })
    }
  }, [currentBusiness?.id, id, isNew]) // eslint-disable-line

  const set = (k: keyof FormState, v: FormState[typeof k]) =>
    setForm(prev => ({ ...prev, [k]: v }))

  const addTag = () => {
    const t = tagInput.trim()
    if (t && !form.tags.includes(t)) setForm(p => ({ ...p, tags: [...p.tags, t] }))
    setTagInput('')
  }
  const removeTag = (t: string) => setForm(p => ({ ...p, tags: p.tags.filter(x => x !== t) }))

  const handleSave = async () => {
    if (!form.name.trim()) { toast('error', 'Name required'); return }
    if (!form.selling_price || parseFloat(form.selling_price) <= 0) { toast('error', 'Price required'); return }
    if (!currentBusiness) return

    setSaving(true)
    try {
      const payload = {
        name:               form.name,
        description:        form.description,
        category_id:        form.category_id || null,
        selling_price:      form.selling_price,
        cost_price:         form.cost_price || '0',
        sale_price:         form.sale_price ? form.sale_price : null,
        sku:                form.sku,
        stock_quantity:     parseInt(form.stock_quantity) || 0,
        low_stock_threshold: parseInt(form.low_stock_threshold) || 5,
        status:             form.status as Product['status'],
        is_available:       form.is_available,
        is_featured:        form.is_featured,
        badge:              form.badge,
        tags:               form.tags,
        images:             form.images,
      }

      if (isNew) {
        await productService.create(currentBusiness.id, payload)
        toast('success', 'Product created', `${form.name} has been added to your store.`)
      } else {
        await productService.update(currentBusiness.id, id!, payload)
        toast('success', 'Product updated', 'Changes have been saved.')
      }
      navigate('/app/products')
    } catch (err: unknown) {
      toast('error', 'Save failed', err instanceof Error ? err.message : 'Please try again.')
    } finally {
      setSaving(false)
    }
  }

  const catOptions = categories.map(c => ({ value: c.id, label: c.name }))

  const margin = form.selling_price && form.cost_price
    ? (((parseFloat(form.selling_price) - parseFloat(form.cost_price)) / parseFloat(form.selling_price)) * 100).toFixed(0)
    : null

  if (loading) {
    return (
      <div className="space-y-4">
        {Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} height={52} className="rounded-[10px]" />)}
      </div>
    )
  }

  return (
    <div className="space-y-5 fade-in">
      <PageHeader
        title={isNew ? 'Add Product' : (form.name || 'Edit Product')}
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
        {/* Main */}
        <div className="lg:col-span-2 space-y-5">

          {/* Basic info */}
          <div className="bg-white border border-sand rounded-[14px] p-5 space-y-4">
            <h3 className="font-serif text-[16px] font-medium text-ink">Basic information</h3>
            <Input label="Product name" placeholder="e.g. Velvet Oud Eau de Parfum" value={form.name} onChange={e => set('name', e.target.value)} />
            <Textarea label="Description" placeholder="Describe this product to your customers…" value={form.description} onChange={e => set('description', e.target.value)} rows={4} />
            <div className="grid sm:grid-cols-2 gap-4">
              <Select label="Category" options={catOptions} placeholder="Select category" value={form.category_id} onChange={e => set('category_id', e.target.value)} />
              <Input label="SKU" placeholder="e.g. MA-VO-001" value={form.sku} onChange={e => set('sku', e.target.value)} helpText="Unique product code." />
            </div>
          </div>

          {/* Pricing */}
          <div className="bg-white border border-sand rounded-[14px] p-5 space-y-4">
            <h3 className="font-serif text-[16px] font-medium text-ink">Pricing</h3>
            <div className="grid sm:grid-cols-3 gap-4">
              <Input label="Selling price (KSh)" type="number" placeholder="0" value={form.selling_price} onChange={e => set('selling_price', e.target.value)} />
              <Input label="Cost price (KSh)" type="number" placeholder="0" value={form.cost_price} onChange={e => set('cost_price', e.target.value)} helpText="Not shown to customers." />
              <Input label="Sale price (KSh)" type="number" placeholder="Optional" value={form.sale_price} onChange={e => set('sale_price', e.target.value)} helpText="Leave blank for no sale." />
            </div>
            {margin && (
              <p className="text-[13px] text-slate">
                Margin: <strong className="text-green">{margin}%</strong>
                {' '}(KSh {(parseFloat(form.selling_price) - parseFloat(form.cost_price)).toLocaleString()} per unit)
              </p>
            )}
          </div>

          {/* Inventory */}
          <div className="bg-white border border-sand rounded-[14px] p-5 space-y-4">
            <h3 className="font-serif text-[16px] font-medium text-ink">Inventory</h3>
            <div className="grid sm:grid-cols-2 gap-4">
              <Input label="Stock quantity" type="number" placeholder="0" value={form.stock_quantity} onChange={e => set('stock_quantity', e.target.value)} />
              <Input label="Low stock threshold" type="number" placeholder="5" value={form.low_stock_threshold} onChange={e => set('low_stock_threshold', e.target.value)} helpText="Alert when stock drops below this." />
            </div>
          </div>

          {/* Tags */}
          <div className="bg-white border border-sand rounded-[14px] p-5 space-y-3">
            <h3 className="font-serif text-[16px] font-medium text-ink">Tags</h3>
            <div className="flex gap-2">
              <input
                type="text"
                value={tagInput}
                onChange={e => setTagInput(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addTag() } }}
                placeholder="Add a tag and press Enter"
                className="flex-1 bg-white border border-sand rounded-[8px] px-3 py-2 text-[13.5px] focus:outline-none focus:ring-2 focus:ring-gold/30 focus:border-gold"
              />
              <button onClick={addTag} className="px-4 py-2 text-[13px] font-semibold bg-ink text-ivory rounded-[8px] hover:bg-ink-soft">Add</button>
            </div>
            {form.tags.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {form.tags.map(t => (
                  <span key={t} className="flex items-center gap-1.5 px-2.5 py-1 bg-ivory border border-sand rounded-full text-[12.5px] font-medium text-ink">
                    {t}
                    <button onClick={() => removeTag(t)} className="text-slate hover:text-red"><X size={11} /></button>
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Images */}
          <div className="bg-white border border-sand rounded-[14px] p-5 space-y-3">
            <h3 className="font-serif text-[16px] font-medium text-ink">Product images</h3>
            <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
              {form.images.map((img, i) => (
                <div key={i} className="relative aspect-square rounded-[10px] overflow-hidden border border-sand group">
                  <img src={img} alt="" className="w-full h-full object-cover" />
                  <button
                    onClick={() => set('images', form.images.filter((_, j) => j !== i))}
                    className="absolute top-1 right-1 w-5 h-5 bg-white/90 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <X size={11} className="text-red" />
                  </button>
                </div>
              ))}
              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading}
                className="aspect-square rounded-[10px] border-2 border-dashed border-sand flex flex-col items-center justify-center gap-1 hover:border-ink/30 transition-colors text-slate disabled:opacity-50"
              >
                {uploading ? <Loader2 size={16} className="animate-spin" /> : <Upload size={16} />}
                <span className="text-[11px]">{uploading ? 'Uploading…' : 'Add image'}</span>
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp,image/gif"
                className="hidden"
                onChange={handleImageUpload}
              />
            </div>
            <p className="text-[12px] text-slate">Accepted: JPEG, PNG, WebP, GIF. Max 10MB per image.</p>
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-5">
          {/* Status */}
          <div className="bg-white border border-sand rounded-[14px] p-5 space-y-4">
            <h3 className="font-serif text-[16px] font-medium text-ink">Status & visibility</h3>
            <Select label="Status" options={statusOptions} value={form.status} onChange={e => set('status', e.target.value)} />
            <Select label="Badge" options={badgeOptions} value={form.badge} onChange={e => set('badge', e.target.value)} />
            <Toggle checked={form.is_available} onChange={v => set('is_available', v)} label="Available for purchase" helpText="Toggle off to hide from store." />
            <Toggle checked={form.is_featured} onChange={v => set('is_featured', v)} label="Featured product" helpText="Show on homepage featured section." />
          </div>

          {/* Store preview */}
          {form.name && (
            <div className="bg-white border border-sand rounded-[14px] p-5">
              <h3 className="font-serif text-[16px] font-medium text-ink mb-4">Store preview</h3>
              <div className="border border-sand rounded-[10px] overflow-hidden">
                <div className="aspect-square bg-sand">
                  {form.images[0] && <img src={form.images[0]} alt="" className="w-full h-full object-cover" />}
                </div>
                <div className="p-3">
                  <p className="text-[13px] font-semibold text-ink">{form.name}</p>
                  {form.category_id && (
                    <p className="text-[11px] text-slate">{categories.find(c => c.id === form.category_id)?.name}</p>
                  )}
                  {form.selling_price && (
                    <p className="font-serif text-[16px] font-semibold text-ink mt-2">KSh {parseFloat(form.selling_price).toLocaleString()}</p>
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
