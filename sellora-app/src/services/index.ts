/**
 * Services barrel — re-exports real backend service modules.
 *
 * Dashboard pages that haven't been migrated yet still import from '@/services'.
 * This file provides backwards-compatible mock fallbacks for those pages until
 * each one is migrated to its own real service in subsequent integrations.
 */

// ── Real backend services ─────────────────────────────────────────────────────
export { businessService } from './businessService'
export { api, tokenStorage, ApiError } from './api'

// ── Remaining mock services (will be replaced in integrations 3–13) ──────────
export { mockProducts as productsMock } from '@/mock'

import type {
  Product, Category, Order, Customer,
  InventoryItem, AnalyticsSummary, StorefrontSettings,
} from '@/types'
import {
  mockProducts, mockCategories, mockOrders,
  mockCustomers, mockAnalytics,
} from '@/mock'

const delay = (ms = 300) => new Promise(r => setTimeout(r, ms))

export const productService = {
  async getAll(_businessId: string): Promise<Product[]> { await delay(); return [...mockProducts] },
  async getById(id: string): Promise<Product | null> { await delay(); return mockProducts.find(p => p.id === id) ?? null },
  async getBySlug(slug: string): Promise<Product | null> { await delay(100); return mockProducts.find(p => p.slug === slug) ?? null },
  async getFeatured(_businessId: string): Promise<Product[]> { await delay(); return mockProducts.filter(p => p.isFeatured && p.isAvailable) },
  async create(data: Omit<Product, 'id' | 'createdAt' | 'updatedAt' | 'totalSold'>): Promise<Product> {
    await delay()
    const p: Product = { ...data, id: `prod-${Date.now()}`, totalSold: 0, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() }
    mockProducts.push(p); return p
  },
  async update(id: string, data: Partial<Product>): Promise<Product> {
    await delay()
    const i = mockProducts.findIndex(p => p.id === id)
    if (i === -1) throw new Error('Not found')
    mockProducts[i] = { ...mockProducts[i], ...data, updatedAt: new Date().toISOString() }
    return mockProducts[i]
  },
  async delete(id: string): Promise<void> { await delay(); const i = mockProducts.findIndex(p => p.id === id); if (i !== -1) mockProducts.splice(i, 1) },
}

export const categoryService = {
  async getAll(_businessId: string): Promise<Category[]> { await delay(); return [...mockCategories] },
  async create(data: Omit<Category, 'id' | 'createdAt' | 'productCount'>): Promise<Category> {
    await delay()
    const c: Category = { ...data, id: `cat-${Date.now()}`, productCount: 0, createdAt: new Date().toISOString() }
    mockCategories.push(c); return c
  },
  async update(id: string, data: Partial<Category>): Promise<Category> {
    await delay()
    const i = mockCategories.findIndex(c => c.id === id)
    if (i === -1) throw new Error('Not found')
    mockCategories[i] = { ...mockCategories[i], ...data }
    return mockCategories[i]
  },
  async delete(id: string): Promise<void> { await delay(); const i = mockCategories.findIndex(c => c.id === id); if (i !== -1) mockCategories.splice(i, 1) },
}

export const orderService = {
  async getAll(_businessId: string): Promise<Order[]> { await delay(); return [...mockOrders] },
  async getById(id: string): Promise<Order | null> { await delay(); return mockOrders.find(o => o.id === id) ?? null },
  async updateStatus(id: string, status: Order['status']): Promise<Order> {
    await delay()
    const o = mockOrders.find(o => o.id === id)
    if (!o) throw new Error('Not found')
    o.status = status; o.updatedAt = new Date().toISOString()
    o.timeline.push({ status, timestamp: new Date().toISOString() })
    return o
  },
}

export const customerService = {
  async getAll(_businessId: string): Promise<Customer[]> { await delay(); return [...mockCustomers] },
  async getById(id: string): Promise<Customer | null> { await delay(); return mockCustomers.find(c => c.id === id) ?? null },
}

export const inventoryService = {
  async getAll(_businessId: string): Promise<InventoryItem[]> {
    await delay()
    return mockProducts.map(p => ({
      productId: p.id,
      productName: p.name,
      sku: p.sku,
      currentStock: p.stockQuantity,
      lowStockThreshold: p.lowStockThreshold,
      stockStatus: p.stockQuantity === 0 ? 'out-of-stock' : p.stockQuantity <= p.lowStockThreshold ? 'low-stock' : 'in-stock',
      stockValue: p.stockQuantity * p.costPrice,
      lastUpdated: p.updatedAt,
      categoryName: p.categoryName,
    }))
  },
  async adjustStock(productId: string, adjustment: number, _reason: string): Promise<void> {
    await delay()
    const p = mockProducts.find(p => p.id === productId)
    if (!p) throw new Error('Not found')
    p.stockQuantity = Math.max(0, p.stockQuantity + adjustment)
    p.updatedAt = new Date().toISOString()
  },
}

export const analyticsService = {
  async getSummary(_businessId: string): Promise<AnalyticsSummary> { await delay(); return mockAnalytics },
}

export const storefrontService = {
  async getSettings(businessId: string): Promise<StorefrontSettings> {
    await delay()
    return { businessId, featuredProductIds: [], featuredCategoryIds: [], showNewArrivals: true, showBestSellers: true, showTestimonials: true, isPublished: false }
  },
  async publish(_businessId: string): Promise<void> { await delay(500) },
}

export const authService = {
  async signInWithGoogle() { await delay(800); return { user: { id: 'user-001', name: 'Maurice Odhiambo', email: 'maurice@gmail.com' } } },
  async signOut(): Promise<void> { await delay(200) },
}
