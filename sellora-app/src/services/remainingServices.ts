/**
 * Services for: Inventory, Customers, Orders, Finances, Analytics, Messages
 * Integrations #4–#9
 */

import { api } from './api'
import type {
  InventoryItem, StockAdjustment, Customer, Order, OrderStatus,
  AnalyticsSummary, RevenueDataPoint, ProductPerformance,
  CategoryPerformance, CustomerGrowthPoint, Message, MessageStatus,
  FinanceSummary, Expense,
} from '@/types'

// ── Shared helpers ────────────────────────────────────────────────────────────

interface DataEnvelope<T>     { success: boolean; data: T; message?: string }
interface ListEnvelope<T>     { success: boolean; data: T[] }
interface PaginatedEnvelope<T>{ success: boolean; count: number; next: string | null; previous: string | null; total_pages: number; results: T[] }

// ─────────────────────────────────────────────────────────────────────────────
// INVENTORY  (#4)
// ─────────────────────────────────────────────────────────────────────────────

interface InventoryApiItem {
  id: string
  name: string
  sku: string
  category_name: string | null
  stock_quantity: number
  low_stock_threshold: number
  stock_status: 'in-stock' | 'low-stock' | 'out-of-stock'
  stock_value: number
  cost_price: string
  selling_price: string
  updated_at: string
}

interface StockAdjustmentApiObject {
  id: string
  product: string
  product_name: string
  quantity_delta: number
  previous_stock: number
  new_stock: number
  reason: string
  created_at: string
}

function mapInventoryItem(raw: InventoryApiItem): InventoryItem {
  return {
    productId:          raw.id,
    productName:        raw.name,
    sku:                raw.sku,
    currentStock:       raw.stock_quantity,
    lowStockThreshold:  raw.low_stock_threshold,
    stockStatus:        raw.stock_status,
    stockValue:         raw.stock_value,
    lastUpdated:        raw.updated_at,
    categoryName:       raw.category_name ?? '',
  }
}

export const inventoryService = {
  /** GET /businesses/:id/inventory/ */
  async getAll(businessId: string, lowStockOnly = false): Promise<{ items: InventoryItem[]; count: number }> {
    const qs = lowStockOnly ? '?low_stock=true&page_size=100' : '?page_size=100'
    const res = await api.get<PaginatedEnvelope<InventoryApiItem>>(
      `/api/v1/businesses/${businessId}/inventory/${qs}`
    )
    return { items: res.results.map(mapInventoryItem), count: res.count }
  },

  /** POST /businesses/:id/inventory/adjust/ */
  async adjustStock(businessId: string, productId: string, quantityDelta: number, reason = ''): Promise<InventoryItem> {
    const res = await api.post<DataEnvelope<InventoryApiItem>>(
      `/api/v1/businesses/${businessId}/inventory/adjust/`,
      { product_id: productId, quantity_delta: quantityDelta, reason },
    )
    return mapInventoryItem(res.data)
  },

  /** GET /businesses/:id/inventory/history/ */
  async getHistory(businessId: string): Promise<StockAdjustment[]> {
    const res = await api.get<PaginatedEnvelope<StockAdjustmentApiObject>>(
      `/api/v1/businesses/${businessId}/inventory/history/?page_size=50`
    )
    return res.results.map(r => ({
      id:            r.id,
      productId:     r.product,
      productName:   r.product_name,
      type:          r.quantity_delta > 0 ? 'add' : 'remove',
      quantity:      Math.abs(r.quantity_delta),
      previousStock: r.previous_stock,
      newStock:      r.new_stock,
      reason:        r.reason,
      createdAt:     r.created_at,
      createdBy:     '',
    } as StockAdjustment))
  },
}

// ─────────────────────────────────────────────────────────────────────────────
// CUSTOMERS  (#5)
// ─────────────────────────────────────────────────────────────────────────────

interface CustomerApiObject {
  id: string
  name: string
  phone: string
  email: string
  location: string
  total_orders: number
  total_spent: string
  last_purchase_at: string | null
  first_purchase_at: string | null
  status: 'active' | 'inactive'
  notes: string
  tags: string[]
  created_at: string
  updated_at: string
}

function mapCustomer(raw: CustomerApiObject): Customer {
  return {
    id:              raw.id,
    businessId:      '',
    name:            raw.name,
    phone:           raw.phone,
    email:           raw.email || undefined,
    location:        raw.location || undefined,
    totalOrders:     raw.total_orders,
    totalSpent:      parseFloat(raw.total_spent ?? '0'),
    lastPurchaseAt:  raw.last_purchase_at ?? undefined,
    firstPurchaseAt: raw.first_purchase_at ?? undefined,
    status:          raw.status,
    notes:           raw.notes || undefined,
    tags:            raw.tags ?? [],
    createdAt:       raw.created_at,
  }
}

export interface CustomerListParams {
  search?: string
  status?: 'active' | 'inactive'
  page?: number
  page_size?: number
}

export interface UpdateCustomerPayload {
  name?: string
  email?: string
  location?: string
  notes?: string
  tags?: string[]
  status?: 'active' | 'inactive'
}

export const customerService = {
  /** GET /businesses/:id/customers/ */
  async getAll(businessId: string, params: CustomerListParams = {}): Promise<{ customers: Customer[]; count: number; totalPages: number }> {
    const qs = new URLSearchParams()
    if (params.search)    qs.set('search', params.search)
    if (params.status)    qs.set('status', params.status)
    if (params.page)      qs.set('page', String(params.page))
    if (params.page_size) qs.set('page_size', String(params.page_size))
    const q = qs.toString() ? `?${qs}` : '?page_size=50'
    const res = await api.get<PaginatedEnvelope<CustomerApiObject>>(
      `/api/v1/businesses/${businessId}/customers/${q}`
    )
    return { customers: res.results.map(mapCustomer), count: res.count, totalPages: res.total_pages }
  },

  /** GET /businesses/:id/customers/:id/ */
  async getById(businessId: string, customerId: string): Promise<Customer> {
    const res = await api.get<DataEnvelope<CustomerApiObject>>(
      `/api/v1/businesses/${businessId}/customers/${customerId}/`
    )
    return { ...mapCustomer(res.data), businessId }
  },

  /** PATCH /businesses/:id/customers/:id/ */
  async update(businessId: string, customerId: string, payload: UpdateCustomerPayload): Promise<Customer> {
    const res = await api.patch<DataEnvelope<CustomerApiObject>>(
      `/api/v1/businesses/${businessId}/customers/${customerId}/`,
      payload,
    )
    return { ...mapCustomer(res.data), businessId }
  },
}

// ─────────────────────────────────────────────────────────────────────────────
// ORDERS  (#6)
// ─────────────────────────────────────────────────────────────────────────────

interface OrderItemApi {
  id: string
  product: string | null
  product_name: string
  product_image: string
  sku: string
  quantity: number
  unit_price: string
  total_price: string
}

interface OrderTimelineApi {
  status: string
  note: string
  timestamp: string
}

interface OrderApiObject {
  id: string
  order_number: string
  business: string
  customer: string | null
  customer_name: string
  customer_phone: string
  customer_email: string
  delivery_address: string
  order_notes: string
  subtotal: string
  delivery_fee: string
  discount: string
  total: string
  status: string
  payment_status: string
  payment_method: string
  channel: string
  next_statuses: string[]
  items: OrderItemApi[]
  timeline: OrderTimelineApi[]
  created_at: string
  updated_at: string
}

function mapOrder(raw: OrderApiObject): Order {
  return {
    id:              raw.id,
    orderNumber:     raw.order_number,
    businessId:      raw.business,
    customerId:      raw.customer ?? undefined,
    customerName:    raw.customer_name,
    customerPhone:   raw.customer_phone,
    customerEmail:   raw.customer_email || undefined,
    deliveryAddress: raw.delivery_address || undefined,
    orderNotes:      raw.order_notes || undefined,
    subtotal:        parseFloat(raw.subtotal),
    deliveryFee:     parseFloat(raw.delivery_fee),
    discount:        parseFloat(raw.discount),
    total:           parseFloat(raw.total),
    status:          raw.status as Order['status'],
    paymentStatus:   raw.payment_status as Order['paymentStatus'],
    paymentMethod:   raw.payment_method as Order['paymentMethod'],
    channel:         raw.channel as Order['channel'],
    items:           raw.items.map(i => ({
      id:           i.id,
      productId:    i.product ?? '',
      productName:  i.product_name,
      productImage: i.product_image || undefined,
      sku:          i.sku,
      quantity:     i.quantity,
      unitPrice:    parseFloat(i.unit_price),
      totalPrice:   parseFloat(i.total_price),
    })),
    timeline: raw.timeline.map(t => ({
      status:    t.status as OrderStatus,
      timestamp: t.timestamp,
      note:      t.note || undefined,
    })),
    createdAt:  raw.created_at,
    updatedAt:  raw.updated_at,
  }
}

export interface OrderListParams {
  status?: string
  payment_status?: string
  customer_id?: string
  search?: string
  page?: number
  page_size?: number
}

export interface CreateOrderPayload {
  customer_name: string
  customer_phone: string
  customer_email?: string
  delivery_address?: string
  order_notes?: string
  payment_method?: string
  channel?: string
  discount?: string | number
  items: { product_id: string; quantity: number }[]
}

export const orderService = {
  /** GET /businesses/:id/orders/ */
  async getAll(businessId: string, params: OrderListParams = {}): Promise<{ orders: Order[]; count: number; totalPages: number }> {
    const qs = new URLSearchParams()
    if (params.status)          qs.set('status', params.status)
    if (params.payment_status)  qs.set('payment_status', params.payment_status)
    if (params.customer_id)     qs.set('customer_id', params.customer_id)
    if (params.search)          qs.set('search', params.search)
    if (params.page)            qs.set('page', String(params.page))
    qs.set('page_size', String(params.page_size ?? 20))
    const res = await api.get<PaginatedEnvelope<OrderApiObject>>(
      `/api/v1/businesses/${businessId}/orders/?${qs}`
    )
    return { orders: res.results.map(mapOrder), count: res.count, totalPages: res.total_pages }
  },

  /** GET /businesses/:id/orders/:id/ */
  async getById(businessId: string, orderId: string): Promise<Order> {
    const res = await api.get<DataEnvelope<OrderApiObject>>(
      `/api/v1/businesses/${businessId}/orders/${orderId}/`
    )
    return mapOrder(res.data)
  },

  /** POST /businesses/:id/orders/ */
  async create(businessId: string, payload: CreateOrderPayload): Promise<Order> {
    const res = await api.post<DataEnvelope<OrderApiObject>>(
      `/api/v1/businesses/${businessId}/orders/`,
      payload,
    )
    return mapOrder(res.data)
  },

  /** PATCH /businesses/:id/orders/:id/status/ */
  async updateStatus(businessId: string, orderId: string, status: OrderStatus, note?: string): Promise<Order> {
    const res = await api.patch<DataEnvelope<OrderApiObject>>(
      `/api/v1/businesses/${businessId}/orders/${orderId}/status/`,
      { status, ...(note ? { note } : {}) },
    )
    return mapOrder(res.data)
  },

  /** PATCH /businesses/:id/orders/:id/payment-status/ */
  async updatePaymentStatus(businessId: string, orderId: string, paymentStatus: Order['paymentStatus']): Promise<Order> {
    const res = await api.patch<DataEnvelope<OrderApiObject>>(
      `/api/v1/businesses/${businessId}/orders/${orderId}/payment-status/`,
      { payment_status: paymentStatus },
    )
    return mapOrder(res.data)
  },
}

// ─────────────────────────────────────────────────────────────────────────────
// FINANCES  (#7)
// ─────────────────────────────────────────────────────────────────────────────

interface FinanceSummaryApi {
  period: string
  revenue: string
  cost_of_goods: string
  gross_profit: string
  expenses: string
  net_profit: string
  gross_margin: number
  net_margin: number
}

interface ExpenseApiObject {
  id: string
  category: string
  description: string
  amount: string
  date: string
  created_at: string
  updated_at: string
}

function mapFinanceSummary(raw: FinanceSummaryApi): FinanceSummary {
  return {
    revenue:      parseFloat(raw.revenue),
    costOfGoods:  parseFloat(raw.cost_of_goods),
    grossProfit:  parseFloat(raw.gross_profit),
    expenses:     parseFloat(raw.expenses),
    netProfit:    parseFloat(raw.net_profit),
    grossMargin:  raw.gross_margin,
    netMargin:    raw.net_margin,
  }
}

function mapExpense(raw: ExpenseApiObject): Expense {
  return {
    id:          raw.id,
    businessId:  '',
    category:    raw.category,
    description: raw.description,
    amount:      parseFloat(raw.amount),
    date:        raw.date,
    createdAt:   raw.created_at,
  }
}

export interface CreateExpensePayload {
  category: string
  description: string
  amount: number | string
  date: string
}

export const financesService = {
  /** GET /businesses/:id/finances/summary/?period=30d */
  async getSummary(businessId: string, period: '7d' | '30d' | '90d' | 'all' = '30d'): Promise<FinanceSummary> {
    const res = await api.get<DataEnvelope<FinanceSummaryApi>>(
      `/api/v1/businesses/${businessId}/finances/summary/?period=${period}`
    )
    return mapFinanceSummary(res.data)
  },

  /** GET /businesses/:id/finances/expenses/ */
  async getExpenses(businessId: string, period = '30d'): Promise<{ expenses: Expense[]; count: number }> {
    const res = await api.get<PaginatedEnvelope<ExpenseApiObject>>(
      `/api/v1/businesses/${businessId}/finances/expenses/?period=${period}&page_size=50`
    )
    return { expenses: res.results.map(mapExpense), count: res.count }
  },

  /** POST /businesses/:id/finances/expenses/ */
  async createExpense(businessId: string, payload: CreateExpensePayload): Promise<Expense> {
    const res = await api.post<DataEnvelope<ExpenseApiObject>>(
      `/api/v1/businesses/${businessId}/finances/expenses/`,
      payload,
    )
    return mapExpense(res.data)
  },

  /** PATCH /businesses/:id/finances/expenses/:id/ */
  async updateExpense(businessId: string, expenseId: string, payload: Partial<CreateExpensePayload>): Promise<Expense> {
    const res = await api.patch<DataEnvelope<ExpenseApiObject>>(
      `/api/v1/businesses/${businessId}/finances/expenses/${expenseId}/`,
      payload,
    )
    return mapExpense(res.data)
  },

  /** DELETE /businesses/:id/finances/expenses/:id/ */
  async deleteExpense(businessId: string, expenseId: string): Promise<void> {
    await api.delete(`/api/v1/businesses/${businessId}/finances/expenses/${expenseId}/`)
  },
}

// ─────────────────────────────────────────────────────────────────────────────
// ANALYTICS  (#8)
// ─────────────────────────────────────────────────────────────────────────────

interface AnalyticsSummaryApi {
  period: string
  total_revenue: string
  total_orders: number
  total_customers: number
  average_order_value: string
  revenue_change: number
  orders_change: number
  customers_change: number
  aov_change: number
}

interface RevenuePointApi   { date: string; revenue: number; orders: number }
interface TopProductApi     { product_id: string | null; product_name: string; total_sold: number; revenue: number; percentage_of_total: number }
interface CategoryPerfApi   { category_id: string | null; category_name: string; total_sold: number; revenue: number; percentage_of_total: number }
interface CustomerGrowthApi { date: string; new_customers: number }

export const analyticsService = {
  /** GET /businesses/:id/analytics/summary/ */
  async getSummary(businessId: string, period: '7d' | '30d' | '90d' = '30d'): Promise<AnalyticsSummary> {
    const res = await api.get<DataEnvelope<AnalyticsSummaryApi>>(
      `/api/v1/businesses/${businessId}/analytics/summary/?period=${period}`
    )
    const d = res.data
    return {
      totalRevenue:       parseFloat(d.total_revenue),
      totalOrders:        d.total_orders,
      totalCustomers:     d.total_customers,
      averageOrderValue:  parseFloat(d.average_order_value),
      revenueChange:      d.revenue_change,
      ordersChange:       d.orders_change,
      customersChange:    d.customers_change,
      aovChange:          d.aov_change,
      revenueData:        [],
      topProducts:        [],
      categoryPerformance:[],
      customerGrowth:     [],
    }
  },

  /** GET /businesses/:id/analytics/revenue/ */
  async getRevenue(businessId: string, period = '30d'): Promise<RevenueDataPoint[]> {
    const res = await api.get<DataEnvelope<RevenuePointApi[]>>(
      `/api/v1/businesses/${businessId}/analytics/revenue/?period=${period}`
    )
    return (res.data ?? []).map(r => ({ date: r.date, revenue: r.revenue, orders: r.orders }))
  },

  /** GET /businesses/:id/analytics/top-products/ */
  async getTopProducts(businessId: string, period = '30d', limit = 5): Promise<ProductPerformance[]> {
    const res = await api.get<DataEnvelope<TopProductApi[]>>(
      `/api/v1/businesses/${businessId}/analytics/top-products/?period=${period}&limit=${limit}`
    )
    return (res.data ?? []).map(r => ({
      productId:          r.product_id ?? '',
      productName:        r.product_name,
      totalSold:          r.total_sold,
      revenue:            r.revenue,
      percentageOfTotal:  r.percentage_of_total,
    }))
  },

  /** GET /businesses/:id/analytics/categories/ */
  async getCategories(businessId: string, period = '30d'): Promise<CategoryPerformance[]> {
    const res = await api.get<DataEnvelope<CategoryPerfApi[]>>(
      `/api/v1/businesses/${businessId}/analytics/categories/?period=${period}`
    )
    return (res.data ?? []).map(r => ({
      categoryId:         r.category_id ?? '',
      categoryName:       r.category_name,
      totalSold:          r.total_sold,
      revenue:            r.revenue,
      percentageOfTotal:  r.percentage_of_total,
    }))
  },

  /** GET /businesses/:id/analytics/customer-growth/ */
  async getCustomerGrowth(businessId: string, period = '30d'): Promise<CustomerGrowthPoint[]> {
    const res = await api.get<DataEnvelope<CustomerGrowthApi[]>>(
      `/api/v1/businesses/${businessId}/analytics/customer-growth/?period=${period}`
    )
    return (res.data ?? []).map(r => ({
      date:               r.date,
      newCustomers:       r.new_customers,
      returningCustomers: 0,
      totalCustomers:     0,
    }))
  },

  /** Convenience: fetch all analytics data in parallel */
  async getAll(businessId: string, period: '7d' | '30d' | '90d' = '30d'): Promise<AnalyticsSummary> {
    const [summary, revenue, topProducts, categories, customerGrowth] = await Promise.all([
      analyticsService.getSummary(businessId, period),
      analyticsService.getRevenue(businessId, period),
      analyticsService.getTopProducts(businessId, period),
      analyticsService.getCategories(businessId, period),
      analyticsService.getCustomerGrowth(businessId, period),
    ])
    return { ...summary, revenueData: revenue, topProducts, categoryPerformance: categories, customerGrowth }
  },
}

// ─────────────────────────────────────────────────────────────────────────────
// MESSAGES  (#9)
// ─────────────────────────────────────────────────────────────────────────────

interface MessageApiObject {
  id: string
  sender_name: string
  sender_phone: string
  sender_email: string
  subject: string
  body: string
  channel: string
  status: string
  created_at: string
  updated_at: string
}

function mapMessage(raw: MessageApiObject): Message {
  return {
    id:          raw.id,
    businessId:  '',
    senderName:  raw.sender_name,
    senderPhone: raw.sender_phone || undefined,
    senderEmail: raw.sender_email || undefined,
    subject:     raw.subject || undefined,
    body:        raw.body,
    channel:     raw.channel as Message['channel'],
    status:      raw.status as Message['status'],
    createdAt:   raw.created_at,
  }
}

export const messagesService = {
  /** GET /businesses/:id/messages/ */
  async getAll(businessId: string, status?: MessageStatus, page = 1): Promise<{ messages: Message[]; count: number }> {
    const qs = new URLSearchParams({ page: String(page), page_size: '30' })
    if (status) qs.set('status', status)
    const res = await api.get<PaginatedEnvelope<MessageApiObject>>(
      `/api/v1/businesses/${businessId}/messages/?${qs}`
    )
    return { messages: res.results.map(mapMessage), count: res.count }
  },

  /** GET /businesses/:id/messages/:id/ — auto-marks unread → read */
  async getById(businessId: string, messageId: string): Promise<Message> {
    const res = await api.get<DataEnvelope<MessageApiObject>>(
      `/api/v1/businesses/${businessId}/messages/${messageId}/`
    )
    return mapMessage(res.data)
  },

  /** PATCH /businesses/:id/messages/:id/ */
  async updateStatus(businessId: string, messageId: string, status: MessageStatus): Promise<Message> {
    const res = await api.patch<DataEnvelope<MessageApiObject>>(
      `/api/v1/businesses/${businessId}/messages/${messageId}/`,
      { status },
    )
    return mapMessage(res.data)
  },
}

// ─────────────────────────────────────────────────────────────────────────────
// WHATSAPP  (#10)
// ─────────────────────────────────────────────────────────────────────────────

import type {
  WaConversation, WaMessage, WaSettings,
} from '@/types'

// ── Raw API shapes ────────────────────────────────────────────────────────────

interface WaMessageApi {
  id: string
  whatsapp_message_id: string
  direction: string
  message_type: string
  body: string
  media_url: string
  media_mime_type: string
  media_caption: string
  status: string
  sent_by_name: string
  message_timestamp: string | null
  created_at: string
}

interface WaConversationApi {
  id: string
  customer_phone: string
  customer_name: string
  status: string
  unread_count: number
  last_message_at: string | null
  last_message_preview: string
  service_window_active: boolean
  service_window_seconds_left: number
  service_window_expires_at: string | null
  assigned_to_name: string
  created_at: string
  messages?: WaMessageApi[]
}

interface WaSettingsApi {
  phone_number: string
  phone_number_id: string
  waba_id: string
  webhook_verify_token: string
  is_active: boolean
  connected_at: string | null
  access_token_hint: string
}

// ── Mappers ───────────────────────────────────────────────────────────────────

function mapWaMessage(raw: WaMessageApi): WaMessage {
  return {
    id:               raw.id,
    whatsappMessageId: raw.whatsapp_message_id,
    direction:        raw.direction as WaMessage['direction'],
    messageType:      raw.message_type as WaMessage['messageType'],
    body:             raw.body,
    mediaUrl:         raw.media_url,
    mediaMimeType:    raw.media_mime_type,
    mediaCaption:     raw.media_caption,
    status:           raw.status as WaMessage['status'],
    sentByName:       raw.sent_by_name,
    messageTimestamp: raw.message_timestamp,
    createdAt:        raw.created_at,
  }
}

function mapWaConversation(raw: WaConversationApi): WaConversation {
  return {
    id:                        raw.id,
    customerPhone:             raw.customer_phone,
    customerName:              raw.customer_name,
    status:                    raw.status as WaConversation['status'],
    unreadCount:               raw.unread_count,
    lastMessageAt:             raw.last_message_at,
    lastMessagePreview:        raw.last_message_preview,
    serviceWindowActive:       raw.service_window_active,
    serviceWindowSecondsLeft:  raw.service_window_seconds_left,
    serviceWindowExpiresAt:    raw.service_window_expires_at,
    assignedToName:            raw.assigned_to_name,
    createdAt:                 raw.created_at,
    messages:                  raw.messages?.map(mapWaMessage),
  }
}

function mapWaSettings(raw: WaSettingsApi): WaSettings {
  return {
    phoneNumber:       raw.phone_number,
    phoneNumberId:     raw.phone_number_id,
    wabaId:            raw.waba_id,
    webhookVerifyToken: raw.webhook_verify_token,
    isActive:          raw.is_active,
    connectedAt:       raw.connected_at,
    accessTokenHint:   raw.access_token_hint,
  }
}

// ── Service ───────────────────────────────────────────────────────────────────

export const whatsappService = {
  /** GET /businesses/:id/whatsapp/conversations/ */
  async getConversations(
    businessId: string,
    status?: string,
    page = 1,
  ): Promise<{ conversations: WaConversation[]; count: number }> {
    const qs = new URLSearchParams({ page: String(page), page_size: '30' })
    if (status) qs.set('status', status)
    const res = await api.get<PaginatedEnvelope<WaConversationApi>>(
      `/api/v1/businesses/${businessId}/whatsapp/conversations/?${qs}`,
    )
    return { conversations: res.results.map(mapWaConversation), count: res.count }
  },

  /** GET /businesses/:id/whatsapp/conversations/:conv_id/ */
  async getConversation(businessId: string, conversationId: string): Promise<WaConversation> {
    const res = await api.get<DataEnvelope<WaConversationApi>>(
      `/api/v1/businesses/${businessId}/whatsapp/conversations/${conversationId}/`,
    )
    return mapWaConversation(res.data)
  },

  /** POST /businesses/:id/whatsapp/conversations/:conv_id/reply/ */
  async reply(businessId: string, conversationId: string, body: string): Promise<WaMessage> {
    const res = await api.post<DataEnvelope<WaMessageApi>>(
      `/api/v1/businesses/${businessId}/whatsapp/conversations/${conversationId}/reply/`,
      { body },
    )
    return mapWaMessage(res.data)
  },

  /** GET /businesses/:id/whatsapp/settings/ */
  async getSettings(businessId: string): Promise<WaSettings | null> {
    const res = await api.get<DataEnvelope<WaSettingsApi | null>>(
      `/api/v1/businesses/${businessId}/whatsapp/settings/`,
    )
    return res.data ? mapWaSettings(res.data) : null
  },

  /** POST /businesses/:id/whatsapp/settings/ */
  async saveSettings(
    businessId: string,
    payload: {
      phone_number: string
      phone_number_id: string
      waba_id: string
      access_token: string
      webhook_verify_token: string
    },
  ): Promise<WaSettings> {
    const res = await api.post<DataEnvelope<WaSettingsApi>>(
      `/api/v1/businesses/${businessId}/whatsapp/settings/`,
      payload,
    )
    return mapWaSettings(res.data)
  },

  /** DELETE /businesses/:id/whatsapp/settings/ */
  async disconnect(businessId: string): Promise<void> {
    await api.delete(`/api/v1/businesses/${businessId}/whatsapp/settings/`)
  },

  /**
   * POST /businesses/:id/whatsapp/connect/
   * Called after the Meta Embedded Signup popup completes.
   * Sends the code + waba_id + phone_number_id returned by the popup;
   * the backend exchanges the code for a token and saves everything.
   */
  async connect(
    businessId: string,
    payload: { code: string; waba_id: string; phone_number_id: string },
  ): Promise<WaSettings> {
    const res = await api.post<DataEnvelope<WaSettingsApi>>(
      `/api/v1/businesses/${businessId}/whatsapp/connect/`,
      payload,
    )
    return mapWaSettings(res.data)
  },
}
