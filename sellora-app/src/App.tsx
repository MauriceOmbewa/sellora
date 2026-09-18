import React, { Suspense, lazy } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from '@/context/AuthContext'
import { ToastProvider } from '@/components/ui'
import { MarketingLayout } from '@/components/layouts/MarketingLayout'
import { DashboardLayout } from '@/components/layouts/DashboardLayout'

// ── Lazy pages — Marketing ────────────────────────────────────────────────────
const LandingPage        = lazy(() => import('@/pages/marketing/LandingPage'))

// Auth
const LoginPage          = lazy(() => import('@/pages/auth/LoginPage'))
const AuthCallbackPage   = lazy(() => import('@/pages/auth/AuthCallbackPage'))

// Onboarding
const OnboardingPage     = lazy(() => import('@/pages/onboarding/OnboardingPage'))

// My businesses
const MyBusinessesPage   = lazy(() => import('@/pages/MyBusinessesPage'))

// Dashboard
const OverviewPage       = lazy(() => import('@/pages/dashboard/OverviewPage'))
const ProductsPage       = lazy(() => import('@/pages/dashboard/ProductsPage'))
const ProductDetailPage  = lazy(() => import('@/pages/dashboard/ProductDetailPage'))
const CategoriesPage     = lazy(() => import('@/pages/dashboard/CategoriesPage'))
const OrdersPage         = lazy(() => import('@/pages/dashboard/OrdersPage'))
const OrderDetailPage    = lazy(() => import('@/pages/dashboard/OrderDetailPage'))
const CustomersPage      = lazy(() => import('@/pages/dashboard/CustomersPage'))
const CustomerDetailPage = lazy(() => import('@/pages/dashboard/CustomerDetailPage'))
const InventoryPage      = lazy(() => import('@/pages/dashboard/InventoryPage'))
const FinancesPage       = lazy(() => import('@/pages/dashboard/FinancesPage'))
const AnalyticsPage          = lazy(() => import('@/pages/dashboard/AnalyticsPage'))
const AnalyticsRevenuePage   = lazy(() => import('@/pages/dashboard/AnalyticsRevenuePage'))
const AnalyticsFinancesPage  = lazy(() => import('@/pages/dashboard/AnalyticsFinancesPage'))
const AnalyticsProductsPage  = lazy(() => import('@/pages/dashboard/AnalyticsProductsPage'))
const StorefrontMgmtPage = lazy(() => import('@/pages/dashboard/StorefrontMgmtPage'))
const MessagesPage       = lazy(() => import('@/pages/dashboard/MessagesPage'))
const SettingsPage       = lazy(() => import('@/pages/dashboard/SettingsPage'))

// Storefront pages
const StorefrontLayout   = lazy(() => import('@/pages/storefront/StorefrontLayout'))
const StorefrontHome     = lazy(() => import('@/pages/storefront/StorefrontHome'))
const StorefrontShop     = lazy(() => import('@/pages/storefront/StorefrontShop'))
const StorefrontProduct  = lazy(() => import('@/pages/storefront/StorefrontProduct'))
const StorefrontCart     = lazy(() => import('@/pages/storefront/StorefrontCart'))
const StorefrontCheckout = lazy(() => import('@/pages/storefront/StorefrontCheckout'))
const StorefrontSuccess  = lazy(() => import('@/pages/storefront/StorefrontSuccess'))
const StorefrontAbout    = lazy(() => import('@/pages/storefront/StorefrontAbout'))
const StorefrontContact  = lazy(() => import('@/pages/storefront/StorefrontContact'))

// ── Hostname detection ────────────────────────────────────────────────────────
//
// Production subdomain routing:
//   sellora.co.ke            → admin SaaS (marketing + dashboard)
//   kladi-collections.sellora.co.ke → storefront for "kladi-collections"
//
// Development:
//   localhost:5173           → admin SaaS
//   localhost:5173/store/:slug → storefront (path-based fallback)
//
// The VITE_SAAS_DOMAIN env var tells us the root domain (e.g. "sellora.co.ke").
// Any subdomain of it is treated as a storefront slug.
//
const SAAS_DOMAIN = import.meta.env.VITE_SAAS_DOMAIN ?? ''

function getStorefrontSlug(): string | null {
  const host = window.location.hostname  // e.g. "kladi-collections.sellora.co.ke"

  // Production: check if this is a subdomain of the SaaS domain
  if (SAAS_DOMAIN && host !== SAAS_DOMAIN && host.endsWith(`.${SAAS_DOMAIN}`)) {
    const slug = host.slice(0, host.length - SAAS_DOMAIN.length - 1)
    // Ignore "www" — that's still the main site
    if (slug && slug !== 'www') return slug
  }

  // Local dev: support `slug.localhost` pattern as well
  if (!SAAS_DOMAIN && host !== 'localhost' && host.endsWith('.localhost')) {
    const slug = host.replace('.localhost', '')
    if (slug) return slug
  }

  return null  // Not a storefront subdomain — render the admin SaaS app
}

// ── Page loader ───────────────────────────────────────────────────────────────

function PageLoader() {
  return (
    <div className="min-h-screen bg-ivory flex items-center justify-center">
      <div className="flex flex-col items-center gap-3">
        <div className="w-8 h-8 rounded-[8px] bg-gold flex items-center justify-center font-serif font-bold text-ink">S</div>
        <div className="w-5 h-5 border-2 border-gold/30 border-t-gold rounded-full animate-spin" />
      </div>
    </div>
  )
}

// ── Auth guards ───────────────────────────────────────────────────────────────

function AuthenticatedRedirect({ children }: { children: React.ReactNode }) {
  const { authState } = useAuth()
  if (authState === 'authenticated') return <Navigate to="/businesses" replace />
  if (authState === 'needs-onboarding') return <Navigate to="/onboarding" replace />
  return <>{children}</>
}

function RequireAuth({ children }: { children: React.ReactNode }) {
  const { authState } = useAuth()
  if (authState === 'loading') return <PageLoader />
  if (authState === 'unauthenticated') return <Navigate to="/login" replace />
  if (authState === 'needs-onboarding') return <Navigate to="/onboarding" replace />
  return <>{children}</>
}

function RequireBusiness({ children }: { children: React.ReactNode }) {
  const { authState, currentBusiness } = useAuth()
  if (authState === 'loading') return <PageLoader />
  if (authState === 'unauthenticated') return <Navigate to="/login" replace />
  if (authState === 'needs-onboarding') return <Navigate to="/onboarding" replace />
  if (!currentBusiness) return <Navigate to="/businesses" replace />
  return <>{children}</>
}

// ── Storefront routes (used for both subdomain and /store/:slug path) ─────────

function StorefrontRoutes({ slug }: { slug: string }) {
  return (
    <Suspense fallback={<PageLoader />}>
      {/* We inject the slug as a route param by wrapping in a fake param segment */}
      <Routes>
        <Route
          path="/*"
          element={
            <StorefrontLayout overrideSlug={slug} />
          }
        >
          <Route index element={<StorefrontHome />} />
          <Route path="shop" element={<StorefrontShop />} />
          <Route path="product/:productSlug" element={<StorefrontProduct />} />
          <Route path="cart" element={<StorefrontCart />} />
          <Route path="checkout" element={<StorefrontCheckout />} />
          <Route path="success" element={<StorefrontSuccess />} />
          <Route path="about" element={<StorefrontAbout />} />
          <Route path="contact" element={<StorefrontContact />} />
          <Route path="*" element={<Navigate to="." replace />} />
        </Route>
      </Routes>
    </Suspense>
  )
}

// ── Main routes (admin SaaS) ──────────────────────────────────────────────────

function AdminRoutes() {
  return (
    <Suspense fallback={<PageLoader />}>
      <Routes>
        {/* Marketing */}
        <Route element={<MarketingLayout />}>
          <Route path="/" element={<LandingPage />} />
        </Route>

        {/* Auth */}
        <Route path="/login" element={<AuthenticatedRedirect><LoginPage /></AuthenticatedRedirect>} />
        <Route path="/auth/callback" element={<AuthCallbackPage />} />
        <Route path="/auth/error" element={<AuthCallbackPage />} />

        {/* Onboarding */}
        <Route path="/onboarding" element={<OnboardingPage />} />

        {/* My businesses */}
        <Route path="/businesses" element={<MyBusinessesPage />} />

        {/* Dashboard */}
        <Route path="/app" element={<RequireBusiness><DashboardLayout /></RequireBusiness>}>
          <Route index element={<OverviewPage />} />
          <Route path="products" element={<ProductsPage />} />
          <Route path="products/new" element={<ProductDetailPage />} />
          <Route path="products/:id" element={<ProductDetailPage />} />
          <Route path="categories" element={<CategoriesPage />} />
          <Route path="orders" element={<OrdersPage />} />
          <Route path="orders/:id" element={<OrderDetailPage />} />
          <Route path="customers" element={<CustomersPage />} />
          <Route path="customers/:id" element={<CustomerDetailPage />} />
          <Route path="inventory" element={<InventoryPage />} />
          <Route path="finances" element={<FinancesPage />} />
          <Route path="analytics" element={<AnalyticsPage />} />
          <Route path="analytics/revenue"  element={<AnalyticsRevenuePage />} />
          <Route path="analytics/finances" element={<AnalyticsFinancesPage />} />
          <Route path="analytics/products" element={<AnalyticsProductsPage />} />
          <Route path="storefront" element={<StorefrontMgmtPage />} />
          <Route path="messages" element={<MessagesPage />} />
          <Route path="settings" element={<SettingsPage />} />
        </Route>

        {/* Path-based storefront (dev fallback: /store/:slug/*) */}
        <Route
          path="/store/:businessSlug/*"
          element={
            <Suspense fallback={<PageLoader />}>
              <StorefrontLayout />
            </Suspense>
          }
        >
          <Route index element={<StorefrontHome />} />
          <Route path="shop" element={<StorefrontShop />} />
          <Route path="product/:productSlug" element={<StorefrontProduct />} />
          <Route path="cart" element={<StorefrontCart />} />
          <Route path="checkout" element={<StorefrontCheckout />} />
          <Route path="success" element={<StorefrontSuccess />} />
          <Route path="about" element={<StorefrontAbout />} />
          <Route path="contact" element={<StorefrontContact />} />
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Suspense>
  )
}

// ── App root ──────────────────────────────────────────────────────────────────

function AppContent() {
  const storefrontSlug = getStorefrontSlug()

  // Subdomain routing: kladi-collections.sellora.co.ke
  // Render the storefront directly — no path prefix needed
  if (storefrontSlug) {
    return (
      <BrowserRouter>
        <StorefrontRoutes slug={storefrontSlug} />
      </BrowserRouter>
    )
  }

  // Standard admin SaaS routing
  return (
    <BrowserRouter>
      <AdminRoutes />
    </BrowserRouter>
  )
}

export default function App() {
  return (
    <AuthProvider>
      <ToastProvider>
        <AppContent />
      </ToastProvider>
    </AuthProvider>
  )
}
