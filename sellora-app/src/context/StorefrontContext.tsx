import React, { createContext, useContext, useState, useEffect, useCallback } from 'react'
import type { Business, Product, CartItem, Cart } from '@/types'
import { businessService } from '@/services/businessService'
import { productService } from '@/services/productService'

interface StorefrontContextType {
  business: Business | null
  products: Product[]
  cart: Cart
  loading: boolean
  addToCart: (product: Product, qty: number) => void
  removeFromCart: (productId: string) => void
  updateQty: (productId: string, qty: number) => void
  clearCart: () => void
}

const StorefrontContext = createContext<StorefrontContextType | null>(null)

export function StorefrontProvider({
  children,
  businessSlug,
}: {
  children: React.ReactNode
  businessSlug: string
}) {
  const [business, setBusiness] = useState<Business | null>(null)
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [cartItems, setCartItems] = useState<CartItem[]>([])

  useEffect(() => {
    businessService.getBySlug(businessSlug).then(biz => {
      setBusiness(biz)
      if (biz) {
        productService.getAll(biz.id, { page_size: 100, status: 'active' }).then(result => {
          setProducts(result.products.filter(p => p.isAvailable))
          setLoading(false)
        })
      } else {
        setLoading(false)
      }
    }).catch(() => setLoading(false))
  }, [businessSlug])

  // Apply brand CSS variables when business loads
  useEffect(() => {
    if (!business) return
    const root = document.documentElement
    root.style.setProperty('--brand-primary', business.theme.primaryColor)
    root.style.setProperty('--brand-primary-hover', business.theme.primaryHover)
    root.style.setProperty('--brand-accent', business.theme.accentColor)
    root.style.setProperty('--brand-background', business.theme.backgroundColor)
    root.style.setProperty('--brand-text', business.theme.textColor)
    return () => {
      // Reset to defaults when leaving storefront
      root.style.setProperty('--brand-primary', '#C79A3D')
      root.style.setProperty('--brand-primary-hover', '#A67D28')
      root.style.setProperty('--brand-accent', '#3F6B4F')
      root.style.setProperty('--brand-background', '#FAF8F3')
      root.style.setProperty('--brand-text', '#171B21')
    }
  }, [business])

  const addToCart = useCallback((product: Product, qty: number) => {
    setCartItems(prev => {
      const existing = prev.find(i => i.productId === product.id)
      if (existing) {
        return prev.map(i => i.productId === product.id ? { ...i, quantity: i.quantity + qty } : i)
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
      setCartItems(prev => prev.map(i => i.productId === productId ? { ...i, quantity: qty } : i))
    }
  }, [])

  const clearCart = useCallback(() => setCartItems([]), [])

  const subtotal = cartItems.reduce((s, i) => s + i.product.sellingPrice * i.quantity, 0)
  const deliveryFee = subtotal > 0 ? 300 : 0
  const cart: Cart = {
    businessId: business?.id ?? '',
    items: cartItems,
    subtotal,
    deliveryFee,
    total: subtotal + deliveryFee,
  }

  return (
    <StorefrontContext.Provider value={{ business, products, cart, loading, addToCart, removeFromCart, updateQty, clearCart }}>
      {children}
    </StorefrontContext.Provider>
  )
}

export function useStorefront() {
  const ctx = useContext(StorefrontContext)
  if (!ctx) throw new Error('useStorefront must be inside StorefrontProvider')
  return ctx
}
