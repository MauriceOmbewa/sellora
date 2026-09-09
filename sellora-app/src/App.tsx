import React, { Suspense, lazy } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from '@/context/AuthContext'
import { ToastProvider } from '@/components/ui'
import { MarketingLayout } from '@/components/layouts/MarketingLayout'
import { DashboardLayout } from '@/components/layouts/DashboardLayout'

// Marketing
const LandingPage        = lazy(() => import('@/pages/marketing/LandingPage'))

// Auth
const LoginPage          = lazy(() => import('@/pages/auth/LoginPage'))

// Onboarding
const OnboardingPage     = lazy(() => import('@/pages/onboarding/OnboardingPage'))

// My businesses
const MyBusinessesPage   = lazy(() => import('@/pages/MyBusinessesPage'))

// Dashboard pages
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
const AnalyticsPage      = lazy(() => import('@/pages/dashboard/AnalyticsPage'))
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

function AuthenticatedRedirect({ children }: { children: React.ReactNode }) {
  const { authState } = useAuth()
  if (authState === 'authenticated') return <Navigate to="/app" replace />
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

function AppRoutes() {
  return (
    <Suspense fallback={<PageLoader />}>
      <Routes>
        {/* Marketing */}
        <Route element={<MarketingLayout />}>
          <Route path="/" element={<LandingPage />} />
        </Route>

        {/* Auth */}
        <Route
          path="/login"
          element={
            <AuthenticatedRedirect>
              <LoginPage />
            </AuthenticatedRedirect>
          }
        />

        {/* Onboarding */}
        <Route path="/onboarding" element={<OnboardingPage />} />

        {/* My businesses */}
        <Route
          path="/businesses"
          element={
            <RequireAuth>
              <MyBusinessesPage />
            </RequireAuth>
          }
        />

        {/* Dashboard */}
        <Route
          path="/app"
          element={
            <RequireAuth>
              <DashboardLayout />
            </RequireAuth>
          }
        >
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
          <Route path="storefront" element={<StorefrontMgmtPage />} />
          <Route path="messages" element={<MessagesPage />} />
          <Route path="settings" element={<SettingsPage />} />
        </Route>

        {/* Public storefront */}
        <Route
          path="/store/:businessSlug"
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

        {/* Fallback */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Suspense>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <ToastProvider>
          <AppRoutes />
        </ToastProvider>
      </AuthProvider>
    </BrowserRouter>
  )
}
