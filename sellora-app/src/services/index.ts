/**
 * Services barrel — re-exports real backend service modules.
 *
 * Dashboard pages that haven't been migrated yet still import from '@/services'.
 * This file provides backwards-compatible mock fallbacks for those pages until
 * each one is migrated to its own real service in subsequent integrations.
 */

// ── Real backend services ─────────────────────────────────────────────────────
export { businessService } from './businessService'
export { productService, categoryService } from './productService'
export { api, tokenStorage, ApiError } from './api'

import type {
  Order, Customer, InventoryItem, AnalyticsSummary, StorefrontSettings,
} from '@/types'
import { mockOrders, mockCustomers, mockAnalytics, mockProducts } from '@/mock'

const delay = (ms = 300) => new Promise(r => setTimeout(r, ms))

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
