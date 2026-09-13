import { useEffect, useState, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { ShoppingBag, ArrowRight } from 'lucide-react'
import { Badge, PageHeader, SearchInput, EmptyState, Avatar, Skeleton } from '@/components/ui'
import { orderService } from '@/services/remainingServices'
import { useAuth } from '@/context/AuthContext'
import type { Order } from '@/types'

const statusVariant: Record<string, 'info' | 'gold' | 'warning' | 'success' | 'danger' | 'outline'> = {
  new: 'info', confirmed: 'gold', processing: 'warning', ready: 'success', completed: 'success', cancelled: 'danger',
}
const payVariant: Record<string, 'success' | 'warning' | 'danger' | 'outline'> = {
  paid: 'success', pending: 'warning', failed: 'danger', refunded: 'outline',
}
const statusLabel: Record<string, string> = {
  new: 'New', confirmed: 'Confirmed', processing: 'Processing', ready: 'Ready', completed: 'Completed', cancelled: 'Cancelled',
}
const channelLabel: Record<string, string> = {
  online: 'Online', whatsapp: 'WhatsApp', 'walk-in': 'Walk-in', phone: 'Phone',
}

export default function OrdersPage() {
  const { currentBusiness } = useAuth()
  const navigate = useNavigate()
  const [orders, setOrders]       = useState<Order[]>([])
  const [loading, setLoading]     = useState(true)
  const [search, setSearch]       = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [payFilter, setPayFilter] = useState('')
  const [totalCount, setTotalCount] = useState(0)
  const [page, setPage]           = useState(1)
  const PAGE_SIZE = 20

  const load = useCallback((pg = 1) => {
    if (!currentBusiness) return
    setLoading(true)
    orderService.getAll(currentBusiness.id, {
      status:         statusFilter || undefined,
      payment_status: payFilter || undefined,
      search:         search || undefined,
      page: pg, page_size: PAGE_SIZE,
    }).then(({ orders, count }) => { setOrders(orders); setTotalCount(count); setPage(pg) })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [currentBusiness?.id, search, statusFilter, payFilter]) // eslint-disable-line

  useEffect(() => { load(1) }, [currentBusiness?.id, search, statusFilter, payFilter]) // eslint-disable-line

  const totalPages = Math.ceil(totalCount / PAGE_SIZE)

  return (
    <div className="space-y-5 fade-in">
      <PageHeader title="Orders" subtitle={`${totalCount} total orders`} />

      {/* Status tabs */}
      <div className="flex flex-wrap gap-2">
        {[
          { id: '',           label: `All (${totalCount})` },
          { id: 'new',        label: 'New' },
          { id: 'processing', label: 'Processing' },
          { id: 'completed',  label: 'Completed' },
          { id: 'cancelled',  label: 'Cancelled' },
        ].map(tab => (
          <button key={tab.id} onClick={() => { setStatusFilter(tab.id); setPage(1) }}
            className={['px-4 py-2 rounded-[8px] text-[13px] font-semibold border transition-colors',
              statusFilter === tab.id ? 'bg-ink text-ivory border-ink' : 'bg-white text-slate border-sand hover:border-ink hover:text-ink'].join(' ')}>
            {tab.label}
          </button>
        ))}
      </div>

      {/* Filters */}
      <div className="bg-white border border-sand rounded-[14px] p-4 flex flex-wrap gap-3">
        <SearchInput value={search} onChange={v => { setSearch(v); setPage(1) }} placeholder="Search by name or order #…" className="w-full sm:w-72" />
        <select value={payFilter} onChange={e => { setPayFilter(e.target.value); setPage(1) }}
          className="bg-white border border-sand rounded-[8px] px-3 py-2 text-[13px] text-ink focus:outline-none">
          <option value="">All payments</option>
          <option value="paid">Paid</option>
          <option value="pending">Pending</option>
          <option value="failed">Failed</option>
          <option value="refunded">Refunded</option>
        </select>
      </div>

      {/* Table */}
      {loading ? (
        <div className="bg-white border border-sand rounded-[14px] p-5">
          {Array.from({length:5}).map((_,i) => (
            <div key={i} className="flex gap-3 py-4 border-b border-sand last:border-0">
              <Skeleton width={36} height={36} rounded />
              <div className="flex-1 space-y-2"><Skeleton height={13} className="w-1/3" /><Skeleton height={11} className="w-1/4" /></div>
            </div>
          ))}
        </div>
      ) : orders.length === 0 ? (
        <div className="bg-white border border-sand rounded-[14px]">
          <EmptyState icon={<ShoppingBag size={22} />} title="No orders found" description="Try adjusting your filters." />
        </div>
      ) : (
        <div className="bg-white border border-sand rounded-[14px] overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[700px]">
              <thead>
                <tr className="border-b border-sand bg-ivory/50">
                  {['Order','Customer','Date','Items','Total','Payment','Status','Channel',''].map(h => (
                    <th key={h} className="text-left text-[11px] font-semibold text-slate py-3.5 px-4 first:pl-5 last:pr-5 uppercase tracking-wide whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {orders.map(order => (
                  <tr key={order.id} onClick={() => navigate(`/app/orders/${order.id}`)}
                    className="border-b border-sand last:border-0 hover:bg-ivory/40 cursor-pointer group">
                    <td className="py-3.5 pl-5 pr-4"><p className="text-[13px] font-mono font-semibold text-ink">{order.orderNumber}</p></td>
                    <td className="py-3.5 pr-4">
                      <div className="flex items-center gap-2.5">
                        <Avatar name={order.customerName} size="sm" />
                        <div>
                          <p className="text-[13px] font-semibold text-ink">{order.customerName}</p>
                          <p className="text-[11.5px] text-slate">{order.customerPhone}</p>
                        </div>
                      </div>
                    </td>
                    <td className="py-3.5 pr-4 text-[12.5px] text-slate whitespace-nowrap">
                      {new Date(order.createdAt).toLocaleDateString('en-KE', {day:'numeric',month:'short'})}
                    </td>
                    <td className="py-3.5 pr-4 text-[13px] text-slate">{order.items.length} item{order.items.length!==1?'s':''}</td>
                    <td className="py-3.5 pr-4"><p className="text-[13.5px] font-semibold text-ink whitespace-nowrap">KSh {order.total.toLocaleString()}</p></td>
                    <td className="py-3.5 pr-4"><Badge variant={payVariant[order.paymentStatus]}>{order.paymentStatus}</Badge></td>
                    <td className="py-3.5 pr-4"><Badge variant={statusVariant[order.status]}>{statusLabel[order.status]}</Badge></td>
                    <td className="py-3.5 pr-4 text-[12.5px] text-slate">{channelLabel[order.channel] ?? order.channel}</td>
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
