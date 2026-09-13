import React, { useEffect, useState } from 'react'
import { Plus, Tag, Edit, Trash2 } from 'lucide-react'
import {
  Button, Badge, PageHeader, Input, Textarea, Toggle,
  EmptyState, ConfirmModal, useToast, Skeleton,
} from '@/components/ui'
import { categoryService } from '@/services/productService'
import { useAuth } from '@/context/AuthContext'
import type { Category } from '@/types'

// ── Modal ─────────────────────────────────────────────────────────────────────

function CategoryModal({
  open, category, businessId, onClose, onSaved,
}: {
  open: boolean
  category: Category | null
  businessId: string
  onClose: () => void
  onSaved: (cat: Category) => void
}) {
  const { toast } = useToast()
  const [form, setForm] = useState({ name: '', description: '', is_active: true, sort_order: '0' })
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (category) {
      setForm({
        name:        category.name,
        description: category.description ?? '',
        is_active:   category.isActive,
        sort_order:  String(category.sortOrder),
      })
    } else {
      setForm({ name: '', description: '', is_active: true, sort_order: '0' })
    }
  }, [category, open])

  const handleSave = async () => {
    if (!form.name.trim()) { toast('error', 'Name required'); return }
    setSaving(true)
    try {
      const payload = {
        name:        form.name,
        description: form.description || undefined,
        is_active:   form.is_active,
        sort_order:  parseInt(form.sort_order) || 0,
      }
      const saved = category
        ? await categoryService.update(businessId, category.id, payload)
        : await categoryService.create(businessId, payload)
      onSaved(saved)
      toast('success', category ? 'Category updated' : 'Category created')
      onClose()
    } catch (err: unknown) {
      toast('error', 'Save failed', err instanceof Error ? err.message : '')
    } finally {
      setSaving(false)
    }
  }

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 backdrop-enter">
      <div className="absolute inset-0 bg-ink/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-sm bg-white rounded-[16px] shadow-2xl border border-sand/50 p-6 fade-in">
        <h2 className="font-serif text-[18px] font-medium text-ink mb-5">
          {category ? 'Edit category' : 'New category'}
        </h2>
        <div className="space-y-4">
          <Input
            label="Category name"
            placeholder="e.g. Eau de Parfum"
            value={form.name}
            onChange={e => setForm(p => ({ ...p, name: e.target.value }))}
          />
          <Textarea
            label="Description (optional)"
            placeholder="A short description for customers."
            value={form.description}
            onChange={e => setForm(p => ({ ...p, description: e.target.value }))}
            rows={3}
          />
          <Input
            label="Sort order"
            type="number"
            value={form.sort_order}
            onChange={e => setForm(p => ({ ...p, sort_order: e.target.value }))}
            helpText="Lower numbers appear first."
          />
          <Toggle
            checked={form.is_active}
            onChange={v => setForm(p => ({ ...p, is_active: v }))}
            label="Active"
            helpText="Inactive categories are hidden in the store."
          />
        </div>
        <div className="flex gap-3 justify-end mt-6">
          <button onClick={onClose} className="px-4 py-2 text-[14px] font-semibold border border-sand rounded-[8px] hover:border-ink text-ink">
            Cancel
          </button>
          <Button variant="primary" loading={saving} onClick={handleSave}>
            {category ? 'Save changes' : 'Create category'}
          </Button>
        </div>
      </div>
    </div>
  )
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function CategoriesPage() {
  const { currentBusiness } = useAuth()
  const { toast } = useToast()

  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading]       = useState(true)
  const [editTarget, setEditTarget] = useState<Category | null>(null)
  const [modalOpen, setModalOpen]   = useState(false)
  const [deleteTarget, setDeleteTarget] = useState<Category | null>(null)
  const [deleting, setDeleting]     = useState(false)

  const load = () => {
    if (!currentBusiness) return
    setLoading(true)
    categoryService.getAll(currentBusiness.id)
      .then(setCategories)
      .catch(() => toast('error', 'Failed to load categories'))
      .finally(() => setLoading(false))
  }

  useEffect(() => { load() }, [currentBusiness?.id]) // eslint-disable-line

  const openNew  = () => { setEditTarget(null); setModalOpen(true) }
  const openEdit = (cat: Category) => { setEditTarget(cat); setModalOpen(true) }

  const handleSaved = (cat: Category) => {
    setCategories(prev => {
      const idx = prev.findIndex(c => c.id === cat.id)
      if (idx >= 0) { const next = [...prev]; next[idx] = cat; return next }
      return [...prev, cat]
    })
  }

  const handleDelete = async () => {
    if (!deleteTarget || !currentBusiness) return
    setDeleting(true)
    try {
      await categoryService.delete(currentBusiness.id, deleteTarget.id)
      setCategories(prev => prev.filter(c => c.id !== deleteTarget.id))
      toast('success', 'Category deleted', 'Products in this category are unaffected.')
    } catch (err: unknown) {
      toast('error', 'Delete failed', err instanceof Error ? err.message : '')
    } finally {
      setDeleting(false)
      setDeleteTarget(null)
    }
  }

  return (
    <div className="space-y-5 fade-in">
      <PageHeader
        title="Categories"
        subtitle={`${categories.length} categor${categories.length !== 1 ? 'ies' : 'y'}`}
        actions={
          <Button variant="primary" icon={<Plus size={15} />} onClick={openNew}>
            Add Category
          </Button>
        }
      />

      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map(i => <Skeleton key={i} height={64} className="rounded-[14px]" />)}
        </div>
      ) : categories.length === 0 ? (
        <div className="bg-white border border-sand rounded-[14px]">
          <EmptyState
            icon={<Tag size={22} />}
            title="No categories yet"
            description="Categories help customers find products in your store."
            action={{ label: 'Add Category', onClick: openNew }}
          />
        </div>
      ) : (
        <div className="bg-white border border-sand rounded-[14px] overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-sand bg-ivory/50">
                {['Category', 'Products', 'Sort', 'Status', ''].map(h => (
                  <th key={h} className="text-left text-[11px] font-semibold text-slate py-3.5 px-5 uppercase tracking-wide">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {categories.map(cat => (
                <tr key={cat.id} className="border-b border-sand last:border-0 hover:bg-ivory/40 group">
                  <td className="py-4 pl-5 pr-4">
                    <div className="flex items-center gap-3">
                      {cat.imageUrl ? (
                        <img src={cat.imageUrl} alt="" className="w-9 h-9 rounded-[8px] object-cover" />
                      ) : (
                        <div className="w-9 h-9 rounded-[8px] bg-sand flex items-center justify-center">
                          <Tag size={14} className="text-slate" />
                        </div>
                      )}
                      <div>
                        <p className="text-[13.5px] font-semibold text-ink">{cat.name}</p>
                        {cat.description && <p className="text-[12px] text-slate">{cat.description}</p>}
                      </div>
                    </div>
                  </td>
                  <td className="py-4 pr-4 text-[13px] text-slate">{cat.productCount} products</td>
                  <td className="py-4 pr-4 text-[13px] text-slate">{cat.sortOrder}</td>
                  <td className="py-4 pr-4">
                    <Badge variant={cat.isActive ? 'success' : 'outline'}>
                      {cat.isActive ? 'Active' : 'Inactive'}
                    </Badge>
                  </td>
                  <td className="py-4 pr-5">
                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button onClick={() => openEdit(cat)} className="p-1.5 text-slate hover:text-ink hover:bg-sand rounded-[6px]"><Edit size={14} /></button>
                      <button onClick={() => setDeleteTarget(cat)} className="p-1.5 text-slate hover:text-red hover:bg-red-light rounded-[6px]"><Trash2 size={14} /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {currentBusiness && (
        <CategoryModal
          open={modalOpen}
          category={editTarget}
          businessId={currentBusiness.id}
          onClose={() => setModalOpen(false)}
          onSaved={handleSaved}
        />
      )}

      <ConfirmModal
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        title="Delete category?"
        description={`"${deleteTarget?.name}" will be removed. Products in this category won't be deleted — they'll just become uncategorised.`}
        confirmText="Delete"
        variant="danger"
        loading={deleting}
      />
    </div>
  )
}
