/**
 * StorefrontContext — drives the public customer-facing storefront.
 *
 * Uses the real public storefront API (/api/v1/store/:slug/*).
 * No authentication required — all calls are public.
 *
 * Returns 404 from backend if:
 *   - Business slug doesn't exist
 *   - Business is inactive/suspended
 *   - Storefront is not published (is_published = false)
 */

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react'
import type { Business, Product, Category, CartItem, Cart } from '@/types'
import { storefrontService } from '@/services/storefrontService'

interface StorefrontContextType {
  business: Business | null
  products: Product[]
  categories: Category[]
  cart: Cart
  loading: boolean
  notFound: boolean
  /** Base URL prefix for storefront links.
   *  - Path mode:     "/store/kladi-collections"
   *  - Subdomain mode: "" (root)
   */
  basePath: string
  addToCart: (product: Product, qty: number) => void
  removeFromCart: (productId: string) => void
  updateQty: (productId: string, qty: number) => void
  clearCart: () => void
}

const StorefrontContext = createContext<StorefrontContextType | null>(null)

export function StorefrontProvider({
  children,
  businessSlug,
  basePath = '',
}: {
  children: React.ReactNode
  businessSlug: string
  basePath?: string
}) {
  const [business, setBusiness]     = useState<Business | null>(null)
  const [products, setProducts]     = useState<Product[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading]       = useState(true)
  const [notFound, setNotFound]     = useState(false)
  const [cartItems, setCartItems]   = useState<CartItem[]>([])

  useEffect(() => {
    if (!businessSlug) { setLoading(false); setNotFound(true); return }

    setLoading(true)
    setNotFound(false)

    // Load business profile, products, and categories in parallel
    Promise.all([
      storefrontService.getStore(businessSlug),
      storefrontService.getProducts(businessSlug, { page_size: 100 }),
      storefrontService.getCategories(businessSlug),
    ])
      .then(([biz, { products }, cats]) => {
        setBusiness(biz)
        setProducts(products)
        setCategories(cats)
      })
      .catch((err) => {
        // 404 = unpublished or doesn't exist
        if (err?.status === 404) setNotFound(true)
        // Other errors: still show store shell with empty products
      })
      .finally(() => setLoading(false))
  }, [businessSlug])

  // Apply brand CSS variables when business loads
  useEffect(() => {
    if (!business) return
    const root = document.documentElement
    root.style.setProperty('--brand-primary',       business.theme.primaryColor)
    root.style.setProperty('--brand-primary-hover', business.theme.primaryHover || business.theme.primaryColor)
    root.style.setProperty('--brand-accent',        business.theme.accentColor)
    root.style.setProperty('--brand-background',    business.theme.backgroundColor)
    root.style.setProperty('--brand-text',          business.theme.textColor)
    return () => {
      // Reset when leaving the storefront
      root.style.setProperty('--brand-primary',       '#C79A3D')
      root.style.setProperty('--brand-primary-hover', '#A67D28')
      root.style.setProperty('--brand-accent',        '#3F6B4F')
      root.style.setProperty('--brand-background',    '#FAF8F3')
      root.style.setProperty('--brand-text',          '#171B21')
    }
  }, [business?.id])

  // ── Cart operations ───────────────────────────────────────────────────────

  const addToCart = useCallback((product: Product, qty: number) => {
    setCartItems(prev => {
      const existing = prev.find(i => i.productId === product.id)
      if (existing) {
        return prev.map(i =>
          i.productId === product.id ? { ...i, quantity: i.quantity + qty } : i
        )
      }
      return [...prev, { productId: product.id, product, quantity: qty }]
    })
  }, [])

  const removeFromCart = useCallback((productId: string) => {
    setCartItems(prev => prev.filter(i => i.productId !== productId))
  }, [])

  const updateQty = useCallback((productId: string, qty: number) => {
    if (qty <= 0) {
      setCartItems(prev => prev.filter(i => i.productId !== productId))
    } else {
      setCartItems(prev => prev.map(i =>
        i.productId === productId ? { ...i, quantity: qty } : i
      ))
    }
  }, [])

  const clearCart = useCallback(() => setCartItems([]), [])

  // ── Cart totals ───────────────────────────────────────────────────────────

  const subtotal     = cartItems.reduce((s, i) => s + i.product.sellingPrice * i.quantity, 0)
  const deliveryFee  = subtotal > 0 ? 300 : 0
  const cart: Cart   = {
    businessId:  business?.id ?? '',
    items:       cartItems,
    subtotal,
    deliveryFee,
    total:       subtotal + deliveryFee,
  }

  return (
    <StorefrontContext.Provider value={{
      business, products, categories, cart, loading, notFound,
      basePath,
      addToCart, removeFromCart, updateQty, clearCart,
    }}>
      {children}
    </StorefrontContext.Provider>
  )
}

export function useStorefront() {
  const ctx = useContext(StorefrontContext)
  if (!ctx) throw new Error('useStorefront must be inside StorefrontProvider')
  return ctx
}
