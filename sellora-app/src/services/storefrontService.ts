/**
 * Public storefront API service  — Integration #10
 * All endpoints under /api/v1/store/:slug/* require NO authentication.
 *
 * Key facts from the backend:
 * - Every endpoint returns 404 if the store is unpublished or inactive
 * - ProductPublicSerializer NEVER includes cost_price
 * - display_price = sale_price if set, else selling_price
 * - Storefront orders always get channel="online" regardless of payload
 * - Contact form needs at least one of sender_phone OR sender_email
 */

import { api } from './api'
import type { Business, Product, Category } from '@/types'
import { mapBusiness } from './businessService'

// ── Paginated product list ────────────────────────────────────────────────────

export interface StorefrontPaginatedProducts {
  count: number
  next: string | null
  previous: string | null
  total_pages: number
  results: StorefrontProductApi[]
}

interface StorefrontProductApi {
  id: string
  category_id: string | null
  category_name: string | null
  name: string
  slug: string
  description: string
  images: string[]
  selling_price: string
  sale_price: string | null
  display_price: string
  stock_quantity: number
  stock_status: 'in-stock' | 'low-stock' | 'out-of-stock'
  is_featured: boolean
  badge: string
  tags: string[]
  total_sold: number
  created_at: string
}

function mapPublicProduct(raw: StorefrontProductApi): Product {
  return {
    id:               raw.id,
    businessId:       '',
    categoryId:       raw.category_id ?? '',
    categoryName:     raw.category_name ?? '',
    name:             raw.name,
    slug:             raw.slug,
    description:      raw.description ?? '',
    images:           raw.images ?? [],
    sellingPrice:     parseFloat(raw.selling_price),
    costPrice:        0,             // never returned by public API
    salePrice:        raw.sale_price ? parseFloat(raw.sale_price) : undefined,
    sku:              '',
    stockQuantity:    raw.stock_quantity,
    lowStockThreshold: 0,
    status:           'active',
    isFeatured:       raw.is_featured,
    isAvailable:      true,
    badge:            (raw.badge || undefined) as Product['badge'],
    tags:             raw.tags ?? [],
    totalSold:        raw.total_sold,
    updatedAt:        raw.created_at,
    createdAt:        raw.created_at,
  }
}

// ── Storefront order create ───────────────────────────────────────────────────

export interface StorefrontOrderPayload {
  customer_name: string
  customer_phone: string
  customer_email?: string
  delivery_address?: string
  order_notes?: string
  payment_method?: 'mpesa' | 'cash' | 'card' | 'bank_transfer' | 'whatsapp'
  discount?: string | number
  items: { product_id: string; quantity: number }[]
}

export interface StorefrontOrderConfirmation {
  id: string
  order_number: string
  customer_name: string
  total: string
  delivery_fee: string
  subtotal: string
  payment_method: string
  status: string
}

// ── Contact form ──────────────────────────────────────────────────────────────

export interface ContactFormPayload {
  sender_name: string
  sender_phone?: string
  sender_email?: string
  subject?: string
  body: string
  channel?: 'contact_form' | 'whatsapp' | 'email'
}

// ── Response envelopes ────────────────────────────────────────────────────────

interface DataEnvelope<T> { success: boolean; data: T; message?: string }
interface ListEnvelope<T> { success: boolean; data: T[] }
interface PaginatedEnvelope<T> { success: boolean; count: number; next: string | null; previous: string | null; total_pages: number; results: T[] }

// ── Sort options ──────────────────────────────────────────────────────────────

export type StorefrontSortOption = 'featured' | 'newest' | 'price-asc' | 'price-desc' | 'best-selling'

export interface StorefrontProductListParams {
  category_id?: string
  search?: string
  sort?: StorefrontSortOption
  page?: number
  page_size?: number
}

// ── Service ───────────────────────────────────────────────────────────────────

export const storefrontService = {

  /**
   * GET /api/v1/store/:slug/
   * Returns the full business profile for the storefront.
   * Returns 404 if store is unpublished or business is inactive.
   */
  async getStore(slug: string): Promise<Business> {
    const res = await api.get<DataEnvelope<ReturnType<typeof Object.assign>>>(
      `/api/v1/store/${slug}/`,
      { public: true },
    )
    return mapBusiness(res.data as any)
  },

  /**
   * GET /api/v1/store/:slug/products/
   * Paginated. Supports category_id, search, sort, page, page_size.
   * Only active + available products. cost_price is never included.
   */
  async getProducts(
    slug: string,
    params: StorefrontProductListParams = {},
  ): Promise<{ products: Product[]; count: number; totalPages: number }> {
    const qs = new URLSearchParams()
    if (params.category_id) qs.set('category_id', params.category_id)
    if (params.search)      qs.set('search', params.search)
    if (params.sort)        qs.set('sort', params.sort)
    if (params.page)        qs.set('page', String(params.page))
    qs.set('page_size', String(params.page_size ?? 20))

    const res = await api.get<PaginatedEnvelope<StorefrontProductApi>>(
      `/api/v1/store/${slug}/products/?${qs}`,
      { public: true },
    )
    return {
      products:   res.results.map(mapPublicProduct),
      count:      res.count,
      totalPages: res.total_pages,
    }
  },

  /**
   * GET /api/v1/store/:slug/products/:productSlug/
   */
  async getProduct(slug: string, productSlug: string): Promise<Product> {
    const res = await api.get<DataEnvelope<StorefrontProductApi>>(
      `/api/v1/store/${slug}/products/${productSlug}/`,
      { public: true },
    )
    return mapPublicProduct(res.data)
  },

  /**
   * GET /api/v1/store/:slug/categories/
   * Returns active categories only. Not paginated.
   */
  async getCategories(slug: string): Promise<Category[]> {
    const res = await api.get<ListEnvelope<{
      id: string; name: string; slug: string; description: string;
      image_url: string; product_count: number; is_active: boolean;
      sort_order: number; created_at: string; updated_at: string
    }>>(`/api/v1/store/${slug}/categories/`, { public: true })
    return res.data.map(c => ({
      id:           c.id,
      businessId:   '',
      name:         c.name,
      slug:         c.slug,
      description:  c.description,
      imageUrl:     c.image_url || undefined,
      productCount: c.product_count,
      isActive:     c.is_active,
      sortOrder:    c.sort_order,
      createdAt:    c.created_at,
    }))
  },

  /**
   * POST /api/v1/store/:slug/orders/
   * Places a storefront order. channel is forced to "online" by the backend.
   * Decrements stock, upserts customer, sends owner notification.
   */
  async placeOrder(slug: string, payload: StorefrontOrderPayload): Promise<StorefrontOrderConfirmation> {
    const res = await api.post<DataEnvelope<StorefrontOrderConfirmation>>(
      `/api/v1/store/${slug}/orders/`,
      payload,
      { public: true },
    )
    return res.data
  },

  /**
   * POST /api/v1/store/:slug/messages/
   * Submits a contact form message. At least one of sender_phone or sender_email required.
   * Creates CustomerMessage(status=unread) and notifies business owner.
   */
  async sendMessage(slug: string, payload: ContactFormPayload): Promise<void> {
    await api.post<DataEnvelope<null>>(
      `/api/v1/store/${slug}/messages/`,
      payload,
      { public: true },
    )
  },
}
