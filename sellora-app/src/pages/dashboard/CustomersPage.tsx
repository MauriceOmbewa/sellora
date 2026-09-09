import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Users, ArrowRight } from 'lucide-react'
import { Badge, PageHeader, SearchInput, EmptyState, Avatar } from '@/components/ui'
import { customerService } from '@/services'
import { useAuth } from '@/context/AuthContext'
import type { Customer } from '@/types'

export default function CustomersPage() {
  const { currentBusiness } = useAuth()
  const navigate = useNavigate()
  const [customers, setCustomers] = useState<Customer[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')

  useEffect(() => {
    if (!currentBusiness) return
    customerService.getAll(currentBusiness.id).then(c => { setCustomers(c); setLoading(false) })
  }, [currentBusiness])

  const filtered = customers.filter(c => {
    if (!search) return true
    const q = search.toLowerCase()
    return c.name.toLowerCase().includes(q) || c.phone.includes(q) || c.email?.toLowerCase().includes(q)
  })

  const vipCustomers = customers.filter(c => c.tags.includes('vip'))
  const totalRevenue = customers.reduce((s, c) => s + c.totalSpent, 0)

  return (
    <div className="space-y-5 fade-in">
      <PageHeader title="Customers" subtitle={`${customers.length} customers`} />

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: 'Total customers', value: customers.length },
          { label: 'VIP customers', value: vipCustomers.length },
          { label: 'Total spent', value: `KSh ${(totalRevenue / 1000).toFixed(0)}K` },
          { label: 'Avg. spend', value: customers.length > 0 ? `KSh ${Math.round(totalRevenue / customers.length).toLocaleString()}` : '—' },
        ].map(s => (
          <div key={s.label} className="bg-white border border-sand rounded-[14px] p-4">
            <p className="font-serif text-[22px] font-semibold text-ink">{s.value}</p>
            <p className="text-[12.5px] text-slate mt-1">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="bg-white border border-sand rounded-[14px] p-4">
        <SearchInput
          value={search}
          onChange={setSearch}
          placeholder="Search by name, phone or email…"
          className="w-full sm:w-80"
        />
      </div>

      {/* Table */}
      {loading ? (
        <div className="bg-white border border-sand rounded-[14px] p-5 space-y-4">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="flex items-center gap-3">
              <div className="w-9 h-9 skeleton rounded-full" />
              <div className="flex-1 space-y-2">
                <div className="h-3.5 skeleton rounded w-1/4" />
                <div className="h-3 skeleton rounded w-1/5" />
              </div>
            </div>
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="bg-white border border-sand rounded-[14px]">
          <EmptyState
            icon={<Users size={22} />}
            title={search ? 'No customers found' : 'No customers yet'}
            description={search ? 'Try a different search term.' : 'Customers appear here after their first order.'}
          />
        </div>
      ) : (
        <div className="bg-white border border-sand rounded-[14px] overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[640px]">
              <thead>
                <tr className="border-b border-sand bg-ivory/50">
                  {['Customer', 'Phone', 'Orders', 'Total Spent', 'Last Purchase', 'Tags', ''].map(h => (
                    <th key={h} className="text-left text-[11px] font-semibold text-slate py-3.5 px-4 first:pl-5 last:pr-5 uppercase tracking-wide">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map(c => (
                  <tr
                    key={c.id}
                    onClick={() => navigate(`/app/customers/${c.id}`)}
                    className="border-b border-sand last:border-0 hover:bg-ivory/40 cursor-pointer group"
                  >
                    <td className="py-3.5 pl-5 pr-4">
                      <div className="flex items-center gap-3">
                        <Avatar name={c.name} size="sm" />
                        <div>
                          <p className="text-[13.5px] font-semibold text-ink">{c.name}</p>
                          {c.email && <p className="text-[11.5px] text-slate">{c.email}</p>}
                        </div>
                      </div>
                    </td>
                    <td className="py-3.5 pr-4 text-[13px] text-slate">{c.phone}</td>
                    <td className="py-3.5 pr-4 text-[13.5px] text-ink font-semibold">{c.totalOrders}</td>
                    <td className="py-3.5 pr-4">
                      <p className="text-[13.5px] font-semibold text-ink">KSh {c.totalSpent.toLocaleString()}</p>
                    </td>
                    <td className="py-3.5 pr-4 text-[12.5px] text-slate">
                      {c.lastPurchaseAt
                        ? new Date(c.lastPurchaseAt).toLocaleDateString('en-KE', { day: 'numeric', month: 'short' })
                        : '—'}
                    </td>
                    <td className="py-3.5 pr-4">
                      <div className="flex gap-1 flex-wrap">
                        {c.tags.map(t => (
                          <Badge key={t} variant={t === 'vip' ? 'gold' : 'outline'} className="capitalize">{t}</Badge>
                        ))}
                      </div>
                    </td>
                    <td className="py-3.5 pr-5">
                      <ArrowRight size={14} className="text-slate group-hover:text-ink" />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}
