/**
 * Product & Category services — /api/v1/businesses/:id/products/ & /categories/
 */

import { api } from './api'
import type { Product, Category } from '@/types'

// ── Pagination envelope ───────────────────────────────────────────────────────

export interface PaginatedResponse<T> {
  success: boolean
  count: number
  next: string | null
  previous: string | null
  total_pages: number
  results: T[]
}

interface DataEnvelope<T> { success: boolean; data: T; message?: string }
interface ListEnvelope<T> { success: boolean; data: T[] }

// ── Backend shapes ────────────────────────────────────────────────────────────

interface ProductApiObject {
  id: string
  business: string
  category_id: string | null
  category_name: string | null
  name: string
  slug: string
  description: string
  images: string[]
  selling_price: string
  cost_price: string
  sale_price: string | null
  display_price: string
  sku: string
  stock_quantity: number
  low_stock_threshold: number
  stock_status: 'in-stock' | 'low-stock' | 'out-of-stock'
  status: 'active' | 'draft' | 'archived'
  is_featured: boolean
  is_available: boolean
  badge: string
  tags: string[]
  total_sold: number
  created_at: string
  updated_at: string
}

interface CategoryApiObject {
  id: string
  name: string
  slug: string
  description: string
  image_url: string
  product_count: number
  is_active: boolean
  sort_order: number
  created_at: string
  updated_at: string
}

// ── Mappers ───────────────────────────────────────────────────────────────────

function mapProduct(raw: ProductApiObject): Product {
  return {
    id: raw.id,
    businessId: raw.business,
    categoryId: raw.category_id ?? '',
    categoryName: raw.category_name ?? '',
    name: raw.name,
    slug: raw.slug,
    description: raw.description ?? '',
    images: raw.images ?? [],
    sellingPrice: parseFloat(raw.selling_price),
    costPrice: parseFloat(raw.cost_price ?? '0'),
    salePrice: raw.sale_price ? parseFloat(raw.sale_price) : undefined,
    sku: raw.sku ?? '',
    stockQuantity: raw.stock_quantity,
    lowStockThreshold: raw.low_stock_threshold,
    status: raw.status,
    isFeatured: raw.is_featured,
    isAvailable: raw.is_available,
    badge: (raw.badge || undefined) as Product['badge'],
    tags: raw.tags ?? [],
    totalSold: raw.total_sold,
    createdAt: raw.created_at,
    updatedAt: raw.updated_at,
  }
}

function mapCategory(raw: CategoryApiObject): Category {
  return {
    id: raw.id,
    businessId: '',          // not in API output — caller fills if needed
    name: raw.name,
    slug: raw.slug,
    description: raw.description ?? '',
    imageUrl: raw.image_url || undefined,
    productCount: raw.product_count,
    isActive: raw.is_active,
    sortOrder: raw.sort_order,
    createdAt: raw.created_at,
  }
}

// ── Payload types ─────────────────────────────────────────────────────────────

export interface CreateProductPayload {
  name: string
  selling_price: number | string
  description?: string
  category_id?: string | null
  cost_price?: number | string
  sale_price?: number | string | null
  sku?: string
  stock_quantity?: number
  low_stock_threshold?: number
  status?: 'active' | 'draft' | 'archived'
  is_featured?: boolean
  is_available?: boolean
  images?: string[]
  badge?: string
  tags?: string[]
}

export interface UpdateProductPayload extends Partial<CreateProductPayload> {}

export interface CreateCategoryPayload {
  name: string
  description?: string
  image_url?: string
  is_active?: boolean
  sort_order?: number
}

export interface UpdateCategoryPayload extends Partial<CreateCategoryPayload> {}

export interface ListProductsParams {
  status?: 'active' | 'draft' | 'archived'
  category_id?: string
  search?: string
  page?: number
  page_size?: number
}

// ── Product service ───────────────────────────────────────────────────────────

export const productService = {

  /** GET /businesses/:bizId/products/ — paginated */
  async getAll(businessId: string, params: ListProductsParams = {}): Promise<{ products: Product[]; count: number; totalPages: number }> {
    const qs = new URLSearchParams()
    if (params.status)      qs.set('status', params.status)
    if (params.category_id) qs.set('category_id', params.category_id)
    if (params.search)      qs.set('search', params.search)
    if (params.page)        qs.set('page', String(params.page))
    if (params.page_size)   qs.set('page_size', String(params.page_size))

    const query = qs.toString() ? `?${qs.toString()}` : ''
    const res = await api.get<PaginatedResponse<ProductApiObject>>(
      `/api/v1/businesses/${businessId}/products/${query}`
    )
    return {
      products: res.results.map(mapProduct),
      count: res.count,
      totalPages: res.total_pages,
    }
  },

  /** GET /businesses/:bizId/products/:id/ */
  async getById(businessId: string, productId: string): Promise<Product> {
    const res = await api.get<DataEnvelope<ProductApiObject>>(
      `/api/v1/businesses/${businessId}/products/${productId}/`
    )
    return mapProduct(res.data)
  },

  /** POST /businesses/:bizId/products/ */
  async create(businessId: string, payload: CreateProductPayload): Promise<Product> {
    const res = await api.post<DataEnvelope<ProductApiObject>>(
      `/api/v1/businesses/${businessId}/products/`,
      payload,
    )
    return mapProduct(res.data)
  },

  /** PATCH /businesses/:bizId/products/:id/ */
  async update(businessId: string, productId: string, payload: UpdateProductPayload): Promise<Product> {
    const res = await api.patch<DataEnvelope<ProductApiObject>>(
      `/api/v1/businesses/${businessId}/products/${productId}/`,
      payload,
    )
    return mapProduct(res.data)
  },

  /** DELETE /businesses/:bizId/products/:id/ — soft-archives the product */
  async delete(businessId: string, productId: string): Promise<void> {
    await api.delete(`/api/v1/businesses/${businessId}/products/${productId}/`)
  },
}

// ── Category service ──────────────────────────────────────────────────────────

export const categoryService = {

  /** GET /businesses/:bizId/categories/ — no pagination */
  async getAll(businessId: string, activeOnly = false): Promise<Category[]> {
    const query = activeOnly ? '?active=true' : ''
    const res = await api.get<ListEnvelope<CategoryApiObject>>(
      `/api/v1/businesses/${businessId}/categories/${query}`
    )
    return res.data.map(c => ({ ...mapCategory(c), businessId }))
  },

  /** GET /businesses/:bizId/categories/:id/ */
  async getById(businessId: string, categoryId: string): Promise<Category> {
    const res = await api.get<DataEnvelope<CategoryApiObject>>(
      `/api/v1/businesses/${businessId}/categories/${categoryId}/`
    )
    return { ...mapCategory(res.data), businessId }
  },

  /** POST /businesses/:bizId/categories/ */
  async create(businessId: string, payload: CreateCategoryPayload): Promise<Category> {
    const res = await api.post<DataEnvelope<CategoryApiObject>>(
      `/api/v1/businesses/${businessId}/categories/`,
      payload,
    )
    return { ...mapCategory(res.data), businessId }
  },

  /** PATCH /businesses/:bizId/categories/:id/ */
  async update(businessId: string, categoryId: string, payload: UpdateCategoryPayload): Promise<Category> {
    const res = await api.patch<DataEnvelope<CategoryApiObject>>(
      `/api/v1/businesses/${businessId}/categories/${categoryId}/`,
      payload,
    )
    return { ...mapCategory(res.data), businessId }
  },

  /** DELETE /businesses/:bizId/categories/:id/ — hard delete, products get category=null */
  async delete(businessId: string, categoryId: string): Promise<void> {
    await api.delete(`/api/v1/businesses/${businessId}/categories/${categoryId}/`)
  },
}
