import { useEffect, useState, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { Users, ArrowRight } from 'lucide-react'
import { PageHeader, SearchInput, EmptyState, Avatar, Badge, Skeleton } from '@/components/ui'
import { customerService } from '@/services/remainingServices'
import { useAuth } from '@/context/AuthContext'
import type { Customer } from '@/types'

export default function CustomersPage() {
  const { currentBusiness } = useAuth()
  const navigate = useNavigate()
  const [customers, setCustomers] = useState<Customer[]>([])
  const [loading, setLoading]     = useState(true)
  const [search, setSearch]       = useState('')
  const [totalCount, setTotalCount] = useState(0)
  const [page, setPage]           = useState(1)
  const PAGE_SIZE = 20

  const load = useCallback((pg = 1) => {
    if (!currentBusiness) return
    setLoading(true)
    customerService.getAll(currentBusiness.id, { search: search || undefined, page: pg, page_size: PAGE_SIZE })
      .then(({ customers, count }) => { setCustomers(customers); setTotalCount(count); setPage(pg) })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [currentBusiness?.id, search]) // eslint-disable-line

  useEffect(() => { load(1) }, [currentBusiness?.id, search]) // eslint-disable-line

  const totalRevenue = customers.reduce((s, c) => s + c.totalSpent, 0)
  const vip          = customers.filter(c => c.tags.includes('vip'))
  const totalPages   = Math.ceil(totalCount / PAGE_SIZE)

  return (
    <div className="space-y-5 fade-in">
      <PageHeader title="Customers" subtitle={`${totalCount} customers`} />

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: 'Total customers', value: totalCount.toLocaleString() },
          { label: 'VIP customers',   value: vip.length.toString() },
          { label: 'Revenue this page', value: `KSh ${(totalRevenue / 1000).toFixed(0)}K` },
          { label: 'Avg. spend',      value: customers.length > 0 ? `KSh ${Math.round(totalRevenue / customers.length).toLocaleString()}` : '—' },
        ].map(s => (
          <div key={s.label} className="bg-white border border-sand rounded-[14px] p-4">
            <p className="font-serif text-[22px] font-semibold text-ink">{s.value}</p>
            <p className="text-[12.5px] text-slate mt-1">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Search */}
      <div className="bg-white border border-sand rounded-[14px] p-4">
        <SearchInput value={search} onChange={v => { setSearch(v); setPage(1) }} placeholder="Search by name, phone or email…" className="w-full sm:w-80" />
      </div>

      {/* Table */}
      {loading ? (
        <div className="bg-white border border-sand rounded-[14px] p-5 space-y-4">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="flex items-center gap-3">
              <Skeleton width={36} height={36} rounded />
              <div className="flex-1 space-y-2"><Skeleton height={13} className="w-1/4" /><Skeleton height={11} className="w-1/5" /></div>
            </div>
          ))}
        </div>
      ) : customers.length === 0 ? (
        <div className="bg-white border border-sand rounded-[14px]">
          <EmptyState icon={<Users size={22} />} title={search ? 'No customers found' : 'No customers yet'} description={search ? 'Try a different search.' : 'Customers appear here after their first order.'} />
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
                {customers.map(c => (
                  <tr key={c.id} onClick={() => navigate(`/app/customers/${c.id}`)} className="border-b border-sand last:border-0 hover:bg-ivory/40 cursor-pointer group">
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
                    <td className="py-3.5 pr-4 text-[13.5px] font-semibold text-ink">{c.totalOrders}</td>
                    <td className="py-3.5 pr-4"><p className="text-[13.5px] font-semibold text-ink">KSh {c.totalSpent.toLocaleString()}</p></td>
                    <td className="py-3.5 pr-4 text-[12.5px] text-slate">
                      {c.lastPurchaseAt ? new Date(c.lastPurchaseAt).toLocaleDateString('en-KE', { day: 'numeric', month: 'short' }) : '—'}
                    </td>
                    <td className="py-3.5 pr-4">
                      <div className="flex gap-1 flex-wrap">
                        {c.tags.map(t => <Badge key={t} variant={t === 'vip' ? 'gold' : 'outline'} className="capitalize">{t}</Badge>)}
                      </div>
                    </td>
                    <td className="py-3.5 pr-5"><ArrowRight size={14} className="text-slate group-hover:text-ink" /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {totalPages > 1 && (
            <div className="flex items-center justify-between px-5 py-3 border-t border-sand">
              <p className="text-[13px] text-slate">Showing {(page-1)*PAGE_SIZE+1}–{Math.min(page*PAGE_SIZE, totalCount)} of {totalCount}</p>
              <div className="flex gap-2">
                <button disabled={page===1} onClick={() => load(page-1)} className="px-3 py-1.5 text-[13px] border border-sand rounded-[7px] disabled:opacity-40 hover:border-ink">Previous</button>
                <button disabled={page===totalPages} onClick={() => load(page+1)} className="px-3 py-1.5 text-[13px] border border-sand rounded-[7px] disabled:opacity-40 hover:border-ink">Next</button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
