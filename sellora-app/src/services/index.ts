import type {
  Business, Product, Category, Order, Customer,
  InventoryItem, AnalyticsSummary, StorefrontSettings,
} from '@/types'
import {
  mockBusinesses, mockProducts, mockCategories,
  mockOrders, mockCustomers, mockAnalytics,
} from '@/mock'

// Simulated async delay
const delay = (ms = 300) => new Promise(resolve => setTimeout(resolve, ms))

// ============================================================
// BUSINESS SERVICE
// ============================================================
export const businessService = {
  async getAll(): Promise<Business[]> {
    await delay()
    return mockBusinesses
  },
  async getById(id: string): Promise<Business | null> {
    await delay()
    return mockBusinesses.find(b => b.id === id) ?? null
  },
  async getBySlug(slug: string): Promise<Business | null> {
    await delay(100)
    return mockBusinesses.find(b => b.slug === slug) ?? null
  },
  async update(id: string, data: Partial<Business>): Promise<Business> {
    await delay()
    const biz = mockBusinesses.find(b => b.id === id)
    if (!biz) throw new Error('Business not found')
    Object.assign(biz, data, { updatedAt: new Date().toISOString() })
    return biz
  },
  async create(data: Omit<Business, 'id' | 'createdAt' | 'updatedAt' | 'totalProducts' | 'totalOrders' | 'totalRevenue' | 'totalCustomers'>): Promise<Business> {
    await delay()
    const newBiz: Business = {
      ...data,
      id: `biz-${Date.now()}`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      totalProducts: 0,
      totalOrders: 0,
      totalRevenue: 0,
      totalCustomers: 0,
    }
    mockBusinesses.push(newBiz)
    return newBiz
  },
}

// ============================================================
// PRODUCT SERVICE
// ============================================================
export const productService = {
  async getAll(businessId: string): Promise<Product[]> {
    await delay()
    return mockProducts.filter(p => p.businessId === businessId)
  },
  async getById(id: string): Promise<Product | null> {
    await delay()
    return mockProducts.find(p => p.id === id) ?? null
  },
  async getBySlug(slug: string): Promise<Product | null> {
    await delay(100)
    return mockProducts.find(p => p.slug === slug) ?? null
  },
  async getFeatured(businessId: string): Promise<Product[]> {
    await delay()
    return mockProducts.filter(p => p.businessId === businessId && p.isFeatured && p.isAvailable)
  },
  async create(data: Omit<Product, 'id' | 'createdAt' | 'updatedAt' | 'totalSold'>): Promise<Product> {
    await delay()
    const product: Product = {
      ...data,
      id: `prod-${Date.now()}`,
      totalSold: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }
    mockProducts.push(product)
    return product
  },
  async update(id: string, data: Partial<Product>): Promise<Product> {
    await delay()
    const idx = mockProducts.findIndex(p => p.id === id)
    if (idx === -1) throw new Error('Product not found')
    mockProducts[idx] = { ...mockProducts[idx], ...data, updatedAt: new Date().toISOString() }
    return mockProducts[idx]
  },
  async delete(id: string): Promise<void> {
    await delay()
    const idx = mockProducts.findIndex(p => p.id === id)
    if (idx !== -1) mockProducts.splice(idx, 1)
  },
}

// ============================================================
// CATEGORY SERVICE
// ============================================================
export const categoryService = {
  async getAll(businessId: string): Promise<Category[]> {
    await delay()
    return mockCategories.filter(c => c.businessId === businessId)
  },
  async create(data: Omit<Category, 'id' | 'createdAt' | 'productCount'>): Promise<Category> {
    await delay()
    const cat: Category = { ...data, id: `cat-${Date.now()}`, productCount: 0, createdAt: new Date().toISOString() }
    mockCategories.push(cat)
    return cat
  },
  async update(id: string, data: Partial<Category>): Promise<Category> {
    await delay()
    const idx = mockCategories.findIndex(c => c.id === id)
    if (idx === -1) throw new Error('Category not found')
    mockCategories[idx] = { ...mockCategories[idx], ...data }
    return mockCategories[idx]
  },
  async delete(id: string): Promise<void> {
    await delay()
    const idx = mockCategories.findIndex(c => c.id === id)
    if (idx !== -1) mockCategories.splice(idx, 1)
  },
}

// ============================================================
// ORDER SERVICE
// ============================================================
export const orderService = {
  async getAll(businessId: string): Promise<Order[]> {
    await delay()
    return mockOrders.filter(o => o.businessId === businessId)
  },
  async getById(id: string): Promise<Order | null> {
    await delay()
    return mockOrders.find(o => o.id === id) ?? null
  },
  async updateStatus(id: string, status: Order['status']): Promise<Order> {
    await delay()
    const order = mockOrders.find(o => o.id === id)
    if (!order) throw new Error('Order not found')
    order.status = status
    order.updatedAt = new Date().toISOString()
    order.timeline.push({ status, timestamp: new Date().toISOString() })
    return order
  },
}

// ============================================================
// CUSTOMER SERVICE
// ============================================================
export const customerService = {
  async getAll(businessId: string): Promise<Customer[]> {
    await delay()
    return mockCustomers.filter(c => c.businessId === businessId)
  },
  async getById(id: string): Promise<Customer | null> {
    await delay()
    return mockCustomers.find(c => c.id === id) ?? null
  },
}

// ============================================================
// INVENTORY SERVICE
// ============================================================
export const inventoryService = {
  async getAll(businessId: string): Promise<InventoryItem[]> {
    await delay()
    const products = mockProducts.filter(p => p.businessId === businessId)
    return products.map(p => ({
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
  async adjustStock(productId: string, adjustment: number, reason: string): Promise<void> {
    await delay()
    const product = mockProducts.find(p => p.id === productId)
    if (!product) throw new Error('Product not found')
    product.stockQuantity = Math.max(0, product.stockQuantity + adjustment)
    product.updatedAt = new Date().toISOString()
    console.log(`Stock adjusted for ${product.name}: ${adjustment} (${reason})`)
  },
}

// ============================================================
// ANALYTICS SERVICE
// ============================================================
export const analyticsService = {
  async getSummary(_businessId: string): Promise<AnalyticsSummary> {
    await delay()
    return mockAnalytics
  },
}

// ============================================================
// STOREFRONT SERVICE
// ============================================================
export const storefrontService = {
  async getSettings(businessId: string): Promise<StorefrontSettings> {
    await delay()
    return {
      businessId,
      featuredProductIds: ['prod-001', 'prod-002', 'prod-005', 'prod-008'],
      featuredCategoryIds: ['cat-001', 'cat-003'],
      showNewArrivals: true,
      showBestSellers: true,
      showTestimonials: true,
      isPublished: true,
      lastPublishedAt: '2026-09-01T08:00:00Z',
    }
  },
  async publish(_businessId: string): Promise<void> {
    await delay(500)
  },
}

// ============================================================
// AUTH SERVICE (mock)
// ============================================================
export const authService = {
  async signInWithGoogle(): Promise<{ user: { id: string; name: string; email: string; avatar?: string } }> {
    await delay(800)
    return {
      user: {
        id: 'user-001',
        name: 'Maurice Odhiambo',
        email: 'maurice@gmail.com',
        avatar: undefined,
      },
    }
  },
  async signOut(): Promise<void> {
    await delay(200)
  },
}
