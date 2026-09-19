/**
 * Business service — wraps all /api/v1/businesses/* endpoints.
 *
 * All response shapes are typed against the actual backend serializers.
 * snake_case → camelCase mapping happens here so the rest of the app
 * stays consistent with the existing TypeScript types.
 */

import { api } from './api'
import type { Business, BusinessCategory, BusinessStatus, PlanType, StorefrontSettings } from '@/types'

// ── Backend shapes ────────────────────────────────────────────────────────────

export interface BusinessApiObject {
  id: string
  owner_id: string
  owner_name: string
  owner_email: string
  name: string
  slug: string
  category: string
  description: string
  motto: string
  logo?: string
  favicon?: string
  status: string
  plan: string
  theme: {
    primaryColor: string
    primaryHover: string
    accentColor: string
    backgroundColor: string
    textColor: string
  }
  contact: {
    phone: string
    whatsapp: string
    email: string
    address: string
    city: string
    country: string
    openingHours: string
  }
  social_links: {
    instagram?: string
    facebook?: string
    tiktok?: string
    twitter?: string
    youtube?: string
  }
  hero: {
    heading: string
    subheading: string
    ctaText: string
    ctaSecondaryText: string
    imageUrl?: string
  }
  about_text: string
  total_products: number
  total_orders: number
  total_customers: number
  total_revenue: string   // DRF serializes DecimalField as string
  is_storefront_published: boolean
  created_at: string
  updated_at: string
}

export interface BusinessSettingsApiObject {
  email_on_new_order: boolean
  email_on_low_stock: boolean
  email_on_new_message: boolean
  sms_on_new_order: boolean
  currency: string
  timezone: string
  language: string
  // Delivery settings
  delivery_enabled: boolean
  pickup_enabled: boolean
  delivery_fee: string
  free_delivery_threshold: string
  updated_at: string
}

export interface StorefrontSettingsApiObject {
  featured_product_ids: string[]
  featured_category_ids: string[]
  show_new_arrivals: boolean
  show_best_sellers: boolean
  show_testimonials: boolean
  is_published: boolean
  last_published_at: string | null
  updated_at: string
}

// ── Standard envelope helpers ─────────────────────────────────────────────────

interface DataEnvelope<T>   { success: boolean; data: T; message?: string }
interface ListEnvelope<T>   { success: boolean; data: T[] }

// ── Mapper: backend → frontend types ─────────────────────────────────────────

export function mapBusiness(raw: BusinessApiObject): Business {
  return {
    id: raw.id,
    slug: raw.slug,
    name: raw.name,
    category: raw.category as BusinessCategory,
    description: raw.description ?? '',
    motto: raw.motto ?? '',
    logo: raw.logo,
    favicon: raw.favicon,
    theme: raw.theme,
    contact: raw.contact,
    socialLinks: {
      instagram: raw.social_links?.instagram,
      facebook:  raw.social_links?.facebook,
      tiktok:    raw.social_links?.tiktok,
      twitter:   raw.social_links?.twitter,
      youtube:   raw.social_links?.youtube,
    },
    hero: {
      heading:           raw.hero?.heading ?? '',
      subheading:        raw.hero?.subheading ?? '',
      ctaText:           raw.hero?.ctaText ?? 'Shop Now',
      ctaSecondaryText:  raw.hero?.ctaSecondaryText ?? 'Learn More',
      imageUrl:          raw.hero?.imageUrl,
    },
    aboutText:      raw.about_text ?? '',
    status:         raw.status as BusinessStatus,
    plan:           raw.plan as PlanType,
    ownerId:        raw.owner_id,
    createdAt:      raw.created_at,
    updatedAt:      raw.updated_at,
    totalProducts:  raw.total_products ?? 0,
    totalOrders:    raw.total_orders ?? 0,
    totalRevenue:   parseFloat(raw.total_revenue ?? '0'),
    totalCustomers: raw.total_customers ?? 0,
    deliverySettings: (raw as any).delivery_settings ? {
      deliveryEnabled:       (raw as any).delivery_settings.delivery_enabled,
      pickupEnabled:         (raw as any).delivery_settings.pickup_enabled,
      deliveryFee:           parseFloat((raw as any).delivery_settings.delivery_fee ?? '300'),
      freeDeliveryThreshold: parseFloat((raw as any).delivery_settings.free_delivery_threshold ?? '10000'),
    } : undefined,
  }
}

export function mapStorefrontSettings(raw: StorefrontSettingsApiObject): StorefrontSettings {
  return {
    businessId:           '',  // caller fills this in
    featuredProductIds:   raw.featured_product_ids ?? [],
    featuredCategoryIds:  raw.featured_category_ids ?? [],
    showNewArrivals:      raw.show_new_arrivals,
    showBestSellers:      raw.show_best_sellers,
    showTestimonials:     raw.show_testimonials,
    isPublished:          raw.is_published,
    lastPublishedAt:      raw.last_published_at ?? undefined,
  }
}

// ── Create payload ────────────────────────────────────────────────────────────

export interface CreateBusinessPayload {
  name: string
  category: BusinessCategory
  description?: string
  motto?: string
  logo?: string
  contact?: Partial<Business['contact']>
  theme?: Partial<Business['theme']>
  hero?: Partial<Business['hero']>
  about_text?: string
}

export interface UpdateBusinessPayload {
  name?: string
  slug?: string
  category?: BusinessCategory
  description?: string
  motto?: string
  logo?: string
  favicon?: string
  contact?: Partial<Business['contact']>
  theme?: Partial<Business['theme']>
  social_links?: Partial<Business['socialLinks']>
  hero?: Partial<Business['hero']>
  about_text?: string
}

export interface UpdateSettingsPayload {
  email_on_new_order?: boolean
  email_on_low_stock?: boolean
  email_on_new_message?: boolean
  sms_on_new_order?: boolean
  currency?: string
  timezone?: string
  language?: string
}

export interface UpdateStorefrontPayload {
  featured_product_ids?: string[]
  featured_category_ids?: string[]
  show_new_arrivals?: boolean
  show_best_sellers?: boolean
  show_testimonials?: boolean
}

// ── Service ───────────────────────────────────────────────────────────────────

export const businessService = {

  /** GET /api/v1/businesses/ — all businesses for the current user */
  async getAll(): Promise<Business[]> {
    const res = await api.get<ListEnvelope<BusinessApiObject>>('/api/v1/businesses/')
    return res.data.map(mapBusiness)
  },

  /** GET /api/v1/businesses/:id/ */
  async getById(id: string): Promise<Business> {
    const res = await api.get<DataEnvelope<BusinessApiObject>>(`/api/v1/businesses/${id}/`)
    return mapBusiness(res.data)
  },

  /** GET /api/v1/businesses/by-slug/:slug/ — public, no auth */
  async getBySlug(slug: string): Promise<Business> {
    const res = await api.get<DataEnvelope<BusinessApiObject>>(
      `/api/v1/businesses/by-slug/${slug}/`,
      { public: true },
    )
    return mapBusiness(res.data)
  },

  /** POST /api/v1/businesses/ */
  async create(payload: CreateBusinessPayload): Promise<Business> {
    const res = await api.post<DataEnvelope<BusinessApiObject>>('/api/v1/businesses/', payload)
    return mapBusiness(res.data)
  },

  /** PATCH /api/v1/businesses/:id/ */
  async update(id: string, payload: UpdateBusinessPayload): Promise<Business> {
    const res = await api.patch<DataEnvelope<BusinessApiObject>>(
      `/api/v1/businesses/${id}/`,
      payload,
    )
    return mapBusiness(res.data)
  },

  /** DELETE /api/v1/businesses/:id/ */
  async delete(id: string): Promise<void> {
    await api.delete(`/api/v1/businesses/${id}/`)
  },

  // ── Settings ────────────────────────────────────────────────────────────────

  /** GET /api/v1/businesses/:id/settings/ */
  async getSettings(id: string): Promise<BusinessSettingsApiObject> {
    const res = await api.get<DataEnvelope<BusinessSettingsApiObject>>(
      `/api/v1/businesses/${id}/settings/`,
    )
    return res.data
  },

  /** PUT /api/v1/businesses/:id/settings/ */
  async updateSettings(id: string, payload: UpdateSettingsPayload): Promise<BusinessSettingsApiObject> {
    const res = await api.put<DataEnvelope<BusinessSettingsApiObject>>(
      `/api/v1/businesses/${id}/settings/`,
      payload,
    )
    return res.data
  },

  // ── Storefront ──────────────────────────────────────────────────────────────

  /** GET /api/v1/businesses/:id/storefront/ */
  async getStorefrontSettings(id: string): Promise<StorefrontSettings> {
    const res = await api.get<DataEnvelope<StorefrontSettingsApiObject>>(
      `/api/v1/businesses/${id}/storefront/`,
    )
    return { ...mapStorefrontSettings(res.data), businessId: id }
  },

  /** PUT /api/v1/businesses/:id/storefront/ */
  async saveStorefrontSettings(id: string, payload: UpdateStorefrontPayload): Promise<StorefrontSettings> {
    const res = await api.put<DataEnvelope<StorefrontSettingsApiObject>>(
      `/api/v1/businesses/${id}/storefront/`,
      payload,
    )
    return { ...mapStorefrontSettings(res.data), businessId: id }
  },

  /** POST /api/v1/businesses/:id/storefront/publish/ */
  async publishStorefront(id: string): Promise<StorefrontSettings> {
    const res = await api.post<DataEnvelope<StorefrontSettingsApiObject>>(
      `/api/v1/businesses/${id}/storefront/publish/`,
    )
    return { ...mapStorefrontSettings(res.data), businessId: id }
  },

  /** POST /api/v1/businesses/:id/storefront/unpublish/ */
  async unpublishStorefront(id: string): Promise<StorefrontSettings> {
    const res = await api.post<DataEnvelope<StorefrontSettingsApiObject>>(
      `/api/v1/businesses/${id}/storefront/unpublish/`,
    )
    return { ...mapStorefrontSettings(res.data), businessId: id }
  },
}
