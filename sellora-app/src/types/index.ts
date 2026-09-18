// ============================================================
// CORE ENTITY TYPES
// ============================================================

export interface User {
  id: string
  googleId: string
  name: string
  email: string
  avatar?: string
  createdAt: string
}

// ============================================================
// BUSINESS & THEME
// ============================================================

export interface BusinessTheme {
  primaryColor: string
  primaryHover: string
  accentColor: string
  backgroundColor: string
  textColor: string
}

export interface BusinessContact {
  phone: string
  whatsapp: string
  email: string
  address: string
  city: string
  country: string
  openingHours: string
}

export interface BusinessSocialLinks {
  instagram?: string
  facebook?: string
  tiktok?: string
  twitter?: string
  youtube?: string
}

export interface BusinessHero {
  heading: string
  subheading: string
  ctaText: string
  ctaSecondaryText: string
  imageUrl?: string
}

export type BusinessCategory =
  | 'cosmetics'
  | 'perfumes'
  | 'fashion'
  | 'accessories'
  | 'beauty'
  | 'gifts'
  | 'electronics'
  | 'food'
  | 'other'

export type BusinessStatus = 'active' | 'inactive' | 'suspended'
export type PlanType = 'starter' | 'business' | 'growth'

export interface Business {
  id: string
  slug: string
  name: string
  category: BusinessCategory
  description: string
  logo?: string
  favicon?: string
  motto: string
  theme: BusinessTheme
  contact: BusinessContact
  socialLinks: BusinessSocialLinks
  hero: BusinessHero
  aboutText: string
  status: BusinessStatus
  plan: PlanType
  ownerId: string
  createdAt: string
  updatedAt: string
  // Meta
  totalProducts: number
  totalOrders: number
  totalRevenue: number
  totalCustomers: number
}

export interface StorefrontSettings {
  businessId: string
  featuredProductIds: string[]
  featuredCategoryIds: string[]
  showNewArrivals: boolean
  showBestSellers: boolean
  showTestimonials: boolean
  isPublished: boolean
  lastPublishedAt?: string
}

// ============================================================
// PRODUCT & CATEGORY
// ============================================================

export type ProductStatus = 'active' | 'draft' | 'archived'

export interface Product {
  id: string
  businessId: string
  name: string
  slug: string
  description: string
  categoryId: string
  categoryName: string
  images: string[]
  sellingPrice: number
  costPrice: number
  sku: string
  stockQuantity: number
  lowStockThreshold: number
  status: ProductStatus
  isFeatured: boolean
  isAvailable: boolean
  totalSold: number
  badge?: 'new' | 'best-seller' | 'sale' | 'limited'
  salePrice?: number
  tags: string[]
  createdAt: string
  updatedAt: string
}

export interface Category {
  id: string
  businessId: string
  name: string
  slug: string
  description?: string
  imageUrl?: string
  productCount: number
  isActive: boolean
  sortOrder: number
  createdAt: string
}

// ============================================================
// ORDER
// ============================================================

export type OrderStatus =
  | 'new'
  | 'confirmed'
  | 'processing'
  | 'ready'
  | 'completed'
  | 'cancelled'

export type PaymentStatus = 'paid' | 'pending' | 'failed' | 'refunded'
export type PaymentMethod = 'mpesa' | 'cash' | 'card' | 'bank_transfer' | 'whatsapp'
export type OrderChannel = 'online' | 'whatsapp' | 'walk-in' | 'phone'

export interface OrderItem {
  id: string
  productId: string
  productName: string
  productImage?: string
  quantity: number
  unitPrice: number
  totalPrice: number
  sku: string
}

export interface OrderTimeline {
  status: OrderStatus
  timestamp: string
  note?: string
}

export interface Order {
  id: string
  orderNumber: string
  businessId: string
  customerId?: string
  customerName: string
  customerPhone: string
  customerEmail?: string
  deliveryAddress?: string
  orderNotes?: string
  items: OrderItem[]
  subtotal: number
  deliveryFee: number
  discount: number
  total: number
  status: OrderStatus
  paymentStatus: PaymentStatus
  paymentMethod: PaymentMethod
  channel: OrderChannel
  timeline: OrderTimeline[]
  createdAt: string
  updatedAt: string
}

// ============================================================
// CUSTOMER
// ============================================================

export type CustomerStatus = 'active' | 'inactive'

export interface Customer {
  id: string
  businessId: string
  name: string
  phone: string
  email?: string
  location?: string
  totalOrders: number
  totalSpent: number
  lastPurchaseAt?: string
  firstPurchaseAt?: string
  status: CustomerStatus
  notes?: string
  tags: string[]
  createdAt: string
}

// ============================================================
// INVENTORY
// ============================================================

export type StockStatus = 'in-stock' | 'low-stock' | 'out-of-stock'

export interface InventoryItem {
  productId: string
  productName: string
  sku: string
  currentStock: number
  lowStockThreshold: number
  stockStatus: StockStatus
  stockValue: number
  lastUpdated: string
  categoryName: string
}

export interface StockAdjustment {
  id: string
  productId: string
  productName: string
  type: 'add' | 'remove' | 'adjustment'
  quantity: number
  previousStock: number
  newStock: number
  reason: string
  createdAt: string
  createdBy: string
}

// ============================================================
// FINANCES
// ============================================================

export interface FinanceSummary {
  revenue: number
  costOfGoods: number
  grossProfit: number
  expenses: number
  netProfit: number
  grossMargin: number
  netMargin: number
}

export interface Expense {
  id: string
  businessId: string
  category: string
  description: string
  amount: number
  date: string
  createdAt: string
}

export interface FinanceActivity {
  id: string
  type: 'income' | 'expense' | 'refund'
  description: string
  amount: number
  date: string
  category: string
}

// ============================================================
// ANALYTICS
// ============================================================

export interface RevenueDataPoint {
  date: string
  revenue: number
  orders: number
}

export interface ProductPerformance {
  productId: string
  productName: string
  totalSold: number
  revenue: number
  percentageOfTotal: number
}

export interface CategoryPerformance {
  categoryId: string
  categoryName: string
  totalSold: number
  revenue: number
  percentageOfTotal: number
}

export interface CustomerGrowthPoint {
  date: string
  newCustomers: number
  returningCustomers: number
  totalCustomers: number
}

export interface AnalyticsSummary {
  totalRevenue: number
  totalOrders: number
  totalCustomers: number
  averageOrderValue: number
  revenueChange: number
  ordersChange: number
  customersChange: number
  aovChange: number
  revenueData: RevenueDataPoint[]
  topProducts: ProductPerformance[]
  categoryPerformance: CategoryPerformance[]
  customerGrowth: CustomerGrowthPoint[]
}

export interface MonthlyDataPoint {
  month: number          // 1–12
  monthName: string      // 'Jan' … 'Dec'
  revenue: number
  expenses: number
  netProfit: number
  orders: number
}
  customerGrowth: CustomerGrowthPoint[]
}

// ============================================================
// CART (STOREFRONT)
// ============================================================

export interface CartItem {
  productId: string
  product: Product
  quantity: number
}

export interface Cart {
  businessId: string
  items: CartItem[]
  subtotal: number
  deliveryFee: number
  total: number
}

// ============================================================
// MESSAGES / INQUIRIES
// ============================================================

export type MessageStatus = 'unread' | 'read' | 'replied'
export type MessageChannel = 'contact_form' | 'whatsapp' | 'email'

export interface Message {
  id: string
  businessId: string
  senderName: string
  senderPhone?: string
  senderEmail?: string
  subject?: string
  body: string
  channel: MessageChannel
  status: MessageStatus
  createdAt: string
}

// ============================================================
// WHATSAPP CONVERSATIONS
// ============================================================

export type WaMessageDirection = 'inbound' | 'outbound'
export type WaMessageType = 'text' | 'image' | 'document' | 'audio' | 'video' | 'sticker' | 'template' | 'unknown'
export type WaMessageStatus = 'pending' | 'sent' | 'delivered' | 'read' | 'failed' | 'received'
export type WaConversationStatus = 'open' | 'closed' | 'awaiting_reply'

export interface WaMessage {
  id: string
  whatsappMessageId: string
  direction: WaMessageDirection
  messageType: WaMessageType
  body: string
  mediaUrl: string
  mediaMimeType: string
  mediaCaption: string
  status: WaMessageStatus
  sentByName: string
  messageTimestamp: string | null
  createdAt: string
}

export interface WaConversation {
  id: string
  customerPhone: string
  customerName: string
  status: WaConversationStatus
  unreadCount: number
  lastMessageAt: string | null
  lastMessagePreview: string
  serviceWindowActive: boolean
  serviceWindowSecondsLeft: number
  serviceWindowExpiresAt: string | null
  assignedToName: string
  createdAt: string
  messages?: WaMessage[]
}

export interface WaSettings {
  phoneNumber: string
  phoneNumberId: string
  wabaId: string
  webhookVerifyToken: string
  isActive: boolean
  connectedAt: string | null
  accessTokenHint: string
}

// ============================================================
// NOTIFICATIONS / TOAST
// ============================================================

export type ToastType = 'success' | 'error' | 'warning' | 'info'

export interface Toast {
  id: string
  type: ToastType
  title: string
  message?: string
  duration?: number
}

// ============================================================
// AUTH STATE
// ============================================================

export type AuthState = 'unauthenticated' | 'authenticated' | 'needs-onboarding' | 'loading'

export interface AuthContext {
  user: User | null
  authState: AuthState
  businesses: Business[]
  currentBusiness: Business | null
  signInWithGoogle: () => Promise<void>
  signOut: () => void
  setCurrentBusiness: (business: Business) => void
}

// ============================================================
// SETTINGS
// ============================================================

export interface NotificationSettings {
  emailOnNewOrder: boolean
  emailOnLowStock: boolean
  emailOnNewMessage: boolean
  smsOnNewOrder: boolean
}

export interface BusinessSettings {
  businessId: string
  notifications: NotificationSettings
  currency: string
  timezone: string
  language: string
}

// ============================================================
// PRICING / PLANS
// ============================================================

export interface PricingPlan {
  id: PlanType
  name: string
  monthlyPrice: number
  annualPrice: number
  description: string
  features: string[]
  highlighted: boolean
  ctaText: string
}
