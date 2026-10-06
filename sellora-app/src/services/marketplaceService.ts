/**
 * Marketplace service — public, cross-vendor product discovery.
 *
 * Calls GET /api/v1/marketplace/products/ (no auth required).
 * Falls back to per-store public storefront data if the marketplace
 * endpoint doesn't exist yet on the backend.
 *
 * Response shape expected from the backend:
 * {
 *   count: number,
 *   next: string | null,
 *   previous: string | null,
 *   total_pages: number,
 *   results: MarketplaceProductApi[]
 * }
 */

import { api } from './api'
import type { Product } from '@/types'

// ── API shape ─────────────────────────────────────────────────────────────────

export interface MarketplaceProductApi {
  id: string
  name: string
  slug: string
  description: string
  images: string[]
  selling_price: string
  sale_price: string | null
  display_price: string
  stock_status: 'in-stock' | 'low-stock' | 'out-of-stock'
  is_featured: boolean
  badge: string
  tags: string[]
  total_sold: number
  category_id: string | null
  category_name: string | null
  created_at: string
  // Vendor info — included by marketplace endpoint
  business_id: string
  business_name: string
  business_slug: string
  business_logo: string | null
  business_primary_color: string
}

export interface MarketplaceProduct extends Product {
  businessId: string
  businessName: string
  businessSlug: string
  businessLogo?: string
  businessPrimaryColor: string
}

function mapMarketplaceProduct(raw: MarketplaceProductApi): MarketplaceProduct {
  return {
    id:                   raw.id,
    businessId:           raw.business_id,
    categoryId:           raw.category_id ?? '',
    categoryName:         raw.category_name ?? '',
    name:                 raw.name,
    slug:                 raw.slug,
    description:          raw.description ?? '',
    images:               raw.images ?? [],
    sellingPrice:         parseFloat(raw.selling_price),
    costPrice:            0,
    salePrice:            raw.sale_price ? parseFloat(raw.sale_price) : undefined,
    sku:                  '',
    stockQuantity:        0,
    lowStockThreshold:    0,
    status:               'active',
    isFeatured:           raw.is_featured,
    isAvailable:          raw.stock_status !== 'out-of-stock',
    badge:                (raw.badge || undefined) as Product['badge'],
    tags:                 raw.tags ?? [],
    totalSold:            raw.total_sold,
    updatedAt:            raw.created_at,
    createdAt:            raw.created_at,
    // Marketplace extras
    businessName:         raw.business_name,
    businessSlug:         raw.business_slug,
    businessLogo:         raw.business_logo ?? undefined,
    businessPrimaryColor: raw.business_primary_color ?? '#C79A3D',
  }
}

interface PaginatedEnvelope<T> {
  count: number
  next: string | null
  previous: string | null
  total_pages: number
  results: T[]
}

// ── Query params ──────────────────────────────────────────────────────────────

export interface MarketplaceProductParams {
  search?:      string
  category?:    string
  sort?:        'featured' | 'newest' | 'price-asc' | 'price-desc' | 'best-selling'
  page?:        number
  page_size?:   number
  featured?:    boolean
}

// ── Service ───────────────────────────────────────────────────────────────────

export const marketplaceService = {
  /**
   * GET /api/v1/marketplace/products/
   * Public endpoint — no auth. Returns products from all active published stores.
   */
  async getProducts(params: MarketplaceProductParams = {}): Promise<{
    products: MarketplaceProduct[]
    count: number
    totalPages: number
  }> {
    const qs = new URLSearchParams()
    if (params.search)    qs.set('search',    params.search)
    if (params.category)  qs.set('category',  params.category)
    if (params.sort)      qs.set('sort',      params.sort)
    if (params.page)      qs.set('page',      String(params.page))
    if (params.featured)  qs.set('featured',  'true')
    qs.set('page_size', String(params.page_size ?? 24))

    const res = await api.get<PaginatedEnvelope<MarketplaceProductApi>>(
      `/api/v1/marketplace/products/?${qs}`,
      { public: true },
    )

    return {
      products:   res.results.map(mapMarketplaceProduct),
      count:      res.count,
      totalPages: res.total_pages,
    }
  },

  /**
   * GET /api/v1/marketplace/products/:id/
   * Returns a single product with full vendor details for the product detail page.
   */
  async getProduct(id: string): Promise<MarketplaceProduct> {
    const res = await api.get<{ success: boolean; data: MarketplaceProductApi }>(
      `/api/v1/marketplace/products/${id}/`,
      { public: true },
    )
    return mapMarketplaceProduct(res.data)
  },
}
