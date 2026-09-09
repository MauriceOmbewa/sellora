import React, { useState } from 'react'
import { NavLink, useNavigate, Outlet } from 'react-router-dom'
import {
  LayoutDashboard, Package, Tag, ShoppingBag, Users, Archive,
  DollarSign, BarChart2, Globe, MessageSquare, Settings,
  HelpCircle, ExternalLink, Menu, X, ChevronDown,
  LogOut, Bell,
} from 'lucide-react'
import { Avatar } from '@/components/ui'
import { useAuth } from '@/context/AuthContext'

interface NavItem {
  icon: React.ReactNode
  label: string
  to: string
  badge?: number
}

const navItems: NavItem[] = [
  { icon: <LayoutDashboard size={16} />, label: 'Overview', to: '/app' },
  { icon: <Package size={16} />, label: 'Products', to: '/app/products' },
  { icon: <Tag size={16} />, label: 'Categories', to: '/app/categories' },
  { icon: <ShoppingBag size={16} />, label: 'Orders', to: '/app/orders', badge: 3 },
  { icon: <Users size={16} />, label: 'Customers', to: '/app/customers' },
  { icon: <Archive size={16} />, label: 'Inventory', to: '/app/inventory' },
  { icon: <DollarSign size={16} />, label: 'Finances', to: '/app/finances' },
  { icon: <BarChart2 size={16} />, label: 'Analytics', to: '/app/analytics' },
  { icon: <Globe size={16} />, label: 'Storefront', to: '/app/storefront' },
  { icon: <MessageSquare size={16} />, label: 'Messages', to: '/app/messages', badge: 2 },
  { icon: <Settings size={16} />, label: 'Settings', to: '/app/settings' },
]

function SidebarContent({ onClose }: { onClose?: () => void }) {
  const { user, currentBusiness, businesses, setCurrentBusiness, signOut } = useAuth()
  const navigate = useNavigate()
  const [bizMenuOpen, setBizMenuOpen] = useState(false)

  const handleViewStore = () => {
    if (currentBusiness) {
      navigate(`/store/${currentBusiness.slug}`)
      onClose?.()
    }
  }

  return (
    <div className="flex flex-col h-full bg-ink text-ivory">
      {/* Logo */}
      <div className="flex items-center justify-between px-4 pt-5 pb-5">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-[7px] bg-gold flex items-center justify-center font-serif font-bold text-ink text-[14px]">
            S
          </div>
          <span className="font-serif font-semibold text-[18px]">Sellora</span>
        </div>
        {onClose && (
          <button onClick={onClose} className="p-1.5 rounded-[7px] text-ivory/50 hover:text-ivory hover:bg-white/5">
            <X size={15} />
          </button>
        )}
      </div>

      {/* Business switcher */}
      <div className="px-3 mb-4">
        <button
          onClick={() => setBizMenuOpen(!bizMenuOpen)}
          className="w-full flex items-center gap-2.5 bg-white/6 border border-white/10 rounded-[10px] px-3 py-2.5 hover:bg-white/8 transition-colors"
        >
          <div
            className="w-7 h-7 rounded-[7px] flex items-center justify-center font-serif font-bold text-[13px] shrink-0"
            style={{ background: currentBusiness?.theme.primaryColor ?? '#C79A3D', color: '#171B21' }}
          >
            {currentBusiness?.name[0] ?? 'B'}
          </div>
          <div className="flex-1 min-w-0 text-left">
            <p className="text-[13px] font-semibold truncate">{currentBusiness?.name ?? 'Select business'}</p>
            <p className="text-[10.5px] text-ivory/50">Switch business</p>
          </div>
          <ChevronDown size={13} className={['opacity-50 transition-transform', bizMenuOpen ? 'rotate-180' : ''].join(' ')} />
        </button>

        {bizMenuOpen && (
          <div className="mt-1.5 bg-ink-soft border border-white/10 rounded-[10px] overflow-hidden">
            {businesses.map(biz => (
              <button
                key={biz.id}
                onClick={() => { setCurrentBusiness(biz); setBizMenuOpen(false) }}
                className={[
                  'w-full flex items-center gap-2.5 px-3 py-2.5 text-left transition-colors',
                  currentBusiness?.id === biz.id ? 'bg-white/10' : 'hover:bg-white/5',
                ].join(' ')}
              >
                <div
                  className="w-6 h-6 rounded-[6px] flex items-center justify-center font-bold text-[11px] shrink-0"
                  style={{ background: biz.theme.primaryColor, color: '#171B21' }}
                >
                  {biz.name[0]}
                </div>
                <span className="text-[13px] font-medium truncate">{biz.name}</span>
              </button>
            ))}
            <div className="border-t border-white/10">
              <button
                onClick={() => { navigate('/businesses'); setBizMenuOpen(false); onClose?.() }}
                className="w-full flex items-center gap-2.5 px-3 py-2.5 text-ivory/60 hover:text-ivory hover:bg-white/5 text-[12.5px] transition-colors"
              >
                Manage businesses
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 space-y-0.5 overflow-y-auto">
        {navItems.map(item => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.to === '/app'}
            onClick={onClose}
            className={({ isActive }) =>
              [
                'flex items-center gap-2.5 px-3 py-2.5 rounded-[8px] text-[13.5px] font-medium transition-all',
                isActive
                  ? 'bg-gold text-ink'
                  : 'text-ivory/70 hover:bg-white/5 hover:text-ivory',
              ].join(' ')
            }
          >
            {item.icon}
            <span className="flex-1">{item.label}</span>
            {item.badge ? (
              <span className="bg-red text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full leading-none">
                {item.badge}
              </span>
            ) : null}
          </NavLink>
        ))}
      </nav>

      {/* Footer */}
      <div className="px-3 pb-4 pt-3 border-t border-white/10 space-y-1">
        {/* View store */}
        <button
          onClick={handleViewStore}
          className="w-full flex items-center justify-between bg-gold text-ink px-3 py-2.5 rounded-[9px] text-[13px] font-bold hover:bg-gold-deep transition-colors mb-2"
        >
          <span>View Store</span>
          <ExternalLink size={13} />
        </button>

        {/* Help */}
        <NavLink
          to="/app/help"
          onClick={onClose}
          className="flex items-center gap-2.5 px-3 py-2 rounded-[8px] text-[13px] text-ivory/60 hover:text-ivory hover:bg-white/5 transition-colors"
        >
          <HelpCircle size={15} />
          Help & Support
        </NavLink>

        {/* User */}
        <div className="flex items-center gap-2.5 px-3 py-2 mt-1">
          <Avatar name={user?.name ?? 'User'} image={user?.avatar} size="sm" />
          <div className="flex-1 min-w-0">
            <p className="text-[12.5px] font-semibold truncate">{user?.name}</p>
            <p className="text-[10.5px] text-ivory/50">Owner</p>
          </div>
          <button
            onClick={() => { signOut(); navigate('/') }}
            aria-label="Sign out"
            className="p-1.5 rounded-[7px] text-ivory/40 hover:text-ivory hover:bg-white/5"
          >
            <LogOut size={14} />
          </button>
        </div>
      </div>
    </div>
  )
}

export function DashboardLayout() {
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false)
  const { user, currentBusiness } = useAuth()

  return (
    <div className="min-h-screen bg-ivory flex">
      {/* Desktop sidebar */}
      <aside className="hidden lg:flex flex-col w-[240px] shrink-0 sticky top-0 h-screen">
        <SidebarContent />
      </aside>

      {/* Mobile sidebar overlay */}
      {mobileSidebarOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div
            className="absolute inset-0 bg-ink/40 backdrop-blur-sm"
            onClick={() => setMobileSidebarOpen(false)}
          />
          <div className="absolute left-0 top-0 h-full w-64 shadow-2xl">
            <SidebarContent onClose={() => setMobileSidebarOpen(false)} />
          </div>
        </div>
      )}

      {/* Main area */}
      <div className="flex-1 min-w-0 flex flex-col">
        {/* Top header — mobile */}
        <header className="lg:hidden sticky top-0 z-30 bg-ivory/90 backdrop-blur-sm border-b border-sand px-4 py-3 flex items-center justify-between">
          <button
            onClick={() => setMobileSidebarOpen(true)}
            className="p-2 rounded-[8px] hover:bg-sand transition-colors"
            aria-label="Open navigation"
          >
            <Menu size={18} />
          </button>
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-[6px] bg-gold flex items-center justify-center font-serif font-bold text-ink text-[12px]">S</div>
            <span className="font-serif font-semibold text-[16px]">{currentBusiness?.name ?? 'Sellora'}</span>
          </div>
          <div className="flex items-center gap-2">
            <button className="p-2 rounded-[8px] hover:bg-sand relative">
              <Bell size={16} />
              <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 bg-red rounded-full" />
            </button>
            <Avatar name={user?.name ?? 'U'} size="sm" />
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 p-5 lg:p-8 max-w-screen-2xl w-full mx-auto">
          <Outlet />
        </main>
      </div>
    </div>
  )
}

// Protected route wrapper
export function RequireAuth({ children }: { children: React.ReactNode }) {
  const { authState } = useAuth()
  const navigate = useNavigate()

  useEffect(() => {
    if (authState === 'unauthenticated') navigate('/login', { replace: true })
    if (authState === 'needs-onboarding') navigate('/onboarding', { replace: true })
  }, [authState, navigate])

  if (authState === 'loading') {
    return (
      <div className="min-h-screen bg-ivory flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 rounded-[8px] bg-gold flex items-center justify-center font-serif font-bold text-ink">S</div>
          <div className="w-5 h-5 border-2 border-gold/30 border-t-gold rounded-full animate-spin" />
        </div>
      </div>
    )
  }

  return <>{children}</>
}

// Import useEffect used in RequireAuth
import { useEffect } from 'react'
