import React, { useEffect, useState } from 'react'
import { Plus, Tag, Edit, Trash2 } from 'lucide-react'
import { Button, Badge, PageHeader, Input, Textarea, Toggle, EmptyState, ConfirmModal, useToast } from '@/components/ui'
import { categoryService } from '@/services'
import { useAuth } from '@/context/AuthContext'
import type { Category } from '@/types'

function CategoryModal({
  open, category, onClose, onSave,
}: {
  open: boolean
  category: Partial<Category> | null
  onClose: () => void
  onSave: (data: Partial<Category>) => Promise<void>
}) {
  const [form, setForm] = useState<Partial<Category>>(category ?? { name: '', description: '', isActive: true })
  const [saving, setSaving] = useState(false)

  useEffect(() => { setForm(category ?? { name: '', description: '', isActive: true }) }, [category])

  const handleSave = async () => {
    setSaving(true)
    await onSave(form)
    setSaving(false)
    onClose()
  }

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 backdrop-enter">
      <div className="absolute inset-0 bg-ink/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-sm bg-white rounded-[16px] shadow-2xl border border-sand/50 p-6 fade-in">
        <h2 className="font-serif text-[18px] font-medium text-ink mb-5">
          {form.id ? 'Edit category' : 'New category'}
        </h2>
        <div className="space-y-4">
          <Input
            label="Category name"
            placeholder="e.g. Eau de Parfum"
            value={form.name ?? ''}
            onChange={e => setForm(p => ({ ...p, name: e.target.value }))}
          />
          <Textarea
            label="Description (optional)"
            placeholder="A short description for customers."
            value={form.description ?? ''}
            onChange={e => setForm(p => ({ ...p, description: e.target.value }))}
            rows={3}
          />
          <Toggle
            checked={form.isActive ?? true}
            onChange={v => setForm(p => ({ ...p, isActive: v }))}
            label="Active"
            helpText="Inactive categories are hidden in the store."
          />
        </div>
        <div className="flex gap-3 justify-end mt-6">
          <button onClick={onClose} className="px-4 py-2 text-[14px] font-semibold border border-sand rounded-[8px] hover:border-ink text-ink">
            Cancel
          </button>
          <Button variant="primary" loading={saving} onClick={handleSave}>
            {form.id ? 'Save changes' : 'Create category'}
          </Button>
        </div>
      </div>
    </div>
  )
}

export default function CategoriesPage() {
  const { currentBusiness } = useAuth()
  const { toast } = useToast()
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [editTarget, setEditTarget] = useState<Partial<Category> | null>(null)
  const [modalOpen, setModalOpen] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState<Category | null>(null)

  useEffect(() => {
    if (!currentBusiness) return
    categoryService.getAll(currentBusiness.id).then(cats => {
      setCategories(cats)
      setLoading(false)
    })
  }, [currentBusiness])

  const openNew = () => { setEditTarget(null); setModalOpen(true) }
  const openEdit = (cat: Category) => { setEditTarget(cat); setModalOpen(true) }

  const handleSave = async (data: Partial<Category>) => {
    if (data.id) {
      const updated = await categoryService.update(data.id, data)
      setCategories(prev => prev.map(c => c.id === data.id ? updated : c))
      toast('success', 'Category updated')
    } else {
      const slug = (data.name ?? '').toLowerCase().replace(/\s+/g, '-')
      const created = await categoryService.create({
        ...data,
        slug,
        businessId: currentBusiness!.id,
        sortOrder: categories.length + 1,
      } as any)
      setCategories(prev => [...prev, created])
      toast('success', 'Category created')
    }
  }

  const handleDelete = async () => {
    if (!deleteTarget) return
    await categoryService.delete(deleteTarget.id)
    setCategories(prev => prev.filter(c => c.id !== deleteTarget.id))
    toast('success', 'Category deleted')
    setDeleteTarget(null)
  }

  return (
    <div className="space-y-5 fade-in">
      <PageHeader
        title="Categories"
        subtitle={`${categories.length} categories`}
        actions={
          <Button variant="primary" icon={<Plus size={15} />} onClick={openNew}>
            Add Category
          </Button>
        }
      />

      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map(i => <div key={i} className="h-16 skeleton rounded-[14px]" />)}
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
                {['Category', 'Products', 'Status', ''].map(h => (
                  <th key={h} className="text-left text-[11px] font-semibold text-slate py-3.5 px-5 uppercase tracking-wide">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {categories.map(cat => (
                <tr key={cat.id} className="border-b border-sand last:border-0 hover:bg-ivory/40 group">
                  <td className="py-4 pl-5 pr-4">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-[8px] bg-sand flex items-center justify-center">
                        <Tag size={14} className="text-slate" />
                      </div>
                      <div>
                        <p className="text-[13.5px] font-semibold text-ink">{cat.name}</p>
                        {cat.description && <p className="text-[12px] text-slate">{cat.description}</p>}
                      </div>
                    </div>
                  </td>
                  <td className="py-4 pr-4 text-[13px] text-slate">{cat.productCount} products</td>
                  <td className="py-4 pr-4">
                    <Badge variant={cat.isActive ? 'success' : 'outline'}>
                      {cat.isActive ? 'Active' : 'Inactive'}
                    </Badge>
                  </td>
                  <td className="py-4 pr-5">
                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button onClick={() => openEdit(cat)} className="p-1.5 text-slate hover:text-ink hover:bg-sand rounded-[6px]">
                        <Edit size={14} />
                      </button>
                      <button onClick={() => setDeleteTarget(cat)} className="p-1.5 text-slate hover:text-red hover:bg-red-light rounded-[6px]">
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <CategoryModal
        open={modalOpen}
        category={editTarget}
        onClose={() => setModalOpen(false)}
        onSave={handleSave}
      />
      <ConfirmModal
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        title="Delete category?"
        description={`"${deleteTarget?.name}" will be removed. Products in this category won't be deleted.`}
        confirmText="Delete"
        variant="danger"
      />
    </div>
  )
}
