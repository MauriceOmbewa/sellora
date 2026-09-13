import { useEffect, useState } from 'react'
import { MessageSquare } from 'lucide-react'
import { PageHeader, EmptyState, Badge, Skeleton, useToast } from '@/components/ui'
import { messagesService } from '@/services/remainingServices'
import { useAuth } from '@/context/AuthContext'
import type { Message, MessageStatus } from '@/types'

const channelLabel: Record<string, string> = {
  contact_form: 'Contact Form',
  whatsapp: 'WhatsApp',
  email: 'Email',
}

export default function MessagesPage() {
  const { currentBusiness } = useAuth()
  const { toast } = useToast()
  const [messages, setMessages]     = useState<Message[]>([])
  const [loading, setLoading]       = useState(true)
  const [statusFilter, setStatusFilter] = useState<MessageStatus | ''>('')
  const [selected, setSelected]     = useState<Message | null>(null)
  const [totalCount, setTotalCount] = useState(0)

  const load = () => {
    if (!currentBusiness) return
    setLoading(true)
    messagesService.getAll(currentBusiness.id, statusFilter || undefined)
      .then(({ messages, count }) => { setMessages(messages); setTotalCount(count) })
      .catch(() => toast('error', 'Failed to load messages'))
      .finally(() => setLoading(false))
  }

  useEffect(() => { load() }, [currentBusiness?.id, statusFilter]) // eslint-disable-line

  const openMessage = async (msg: Message) => {
    setSelected(msg)
    // Auto-marks unread → read server-side; update locally
    if (msg.status === 'unread' && currentBusiness) {
      try {
        await messagesService.getById(currentBusiness.id, msg.id)
        setMessages(prev => prev.map(m => m.id === msg.id ? { ...m, status: 'read' } : m))
        setSelected(prev => prev?.id === msg.id ? { ...prev, status: 'read' } : prev)
      } catch { /* non-critical */ }
    }
  }

  const updateStatus = async (msgId: string, status: MessageStatus) => {
    if (!currentBusiness) return
    try {
      const updated = await messagesService.updateStatus(currentBusiness.id, msgId, status)
      setMessages(prev => prev.map(m => m.id === msgId ? updated : m))
      if (selected?.id === msgId) setSelected(updated)
      toast('success', `Marked as ${status}`)
    } catch { toast('error', 'Update failed') }
  }

  const unreadCount = messages.filter(m => m.status === 'unread').length

  return (
    <div className="space-y-5 fade-in">
      <PageHeader
        title="Messages"
        subtitle={`${totalCount} customer inquir${totalCount !== 1 ? 'ies' : 'y'}`}
      />

      {/* Filter tabs */}
      <div className="flex gap-2">
        {[
          { id: '',          label: `All (${totalCount})` },
          { id: 'unread',    label: `Unread (${unreadCount})` },
          { id: 'read',      label: 'Read' },
          { id: 'replied',   label: 'Replied' },
        ].map(tab => (
          <button key={tab.id} onClick={() => setStatusFilter(tab.id as MessageStatus | '')}
            className={['px-4 py-2 rounded-[8px] text-[13px] font-semibold border transition-colors',
              statusFilter === tab.id ? 'bg-ink text-ivory border-ink' : 'bg-white text-slate border-sand hover:border-ink hover:text-ink'].join(' ')}>
            {tab.label}
          </button>
        ))}
      </div>

      {/* Layout: list + detail */}
      <div className="grid lg:grid-cols-5 gap-5">
        {/* Message list */}
        <div className="lg:col-span-2 bg-white border border-sand rounded-[14px] overflow-hidden">
          {loading ? (
            <div className="p-5 space-y-4">
              {[1,2,3,4].map(i => (
                <div key={i} className="flex gap-3">
                  <Skeleton width={36} height={36} rounded />
                  <div className="flex-1 space-y-2"><Skeleton height={13} className="w-2/3" /><Skeleton height={11} className="w-1/2" /></div>
                </div>
              ))}
            </div>
          ) : messages.length === 0 ? (
            <EmptyState icon={<MessageSquare size={22} />} title="No messages" description="Customer inquiries will appear here." />
          ) : (
            messages.map(msg => (
              <button key={msg.id} onClick={() => openMessage(msg)}
                className={['w-full flex items-start gap-3 px-4 py-4 border-b border-sand last:border-0 text-left transition-colors',
                  selected?.id === msg.id ? 'bg-ivory' : 'hover:bg-ivory/50',
                  msg.status === 'unread' ? 'bg-blue-light/20' : '',
                ].join(' ')}>
                {/* Avatar */}
                <div className="w-9 h-9 rounded-full bg-sand flex items-center justify-center font-serif font-semibold text-ink shrink-0 text-[13px]">
                  {msg.senderName[0]}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <p className={['text-[13.5px] truncate', msg.status === 'unread' ? 'font-bold text-ink' : 'font-semibold text-ink'].join(' ')}>
                      {msg.senderName}
                    </p>
                    {msg.status === 'unread' && <span className="w-2 h-2 bg-blue rounded-full shrink-0" />}
                  </div>
                  <p className="text-[12px] text-slate bg-sand/60 px-2 py-0.5 rounded-full w-fit mt-0.5">{channelLabel[msg.channel] ?? msg.channel}</p>
                  <p className="text-[12.5px] text-slate mt-1 line-clamp-2">{msg.body}</p>
                </div>
              </button>
            ))
          )}
        </div>

        {/* Message detail */}
        <div className="lg:col-span-3">
          {selected ? (
            <div className="bg-white border border-sand rounded-[14px] p-5 space-y-4">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h3 className="font-serif text-[18px] font-medium text-ink">{selected.senderName}</h3>
                  <p className="text-[13px] text-slate mt-0.5">
                    {channelLabel[selected.channel] ?? selected.channel}
                    {selected.subject ? ` · ${selected.subject}` : ''}
                  </p>
                </div>
                <div className="flex gap-2 shrink-0">
                  {selected.status !== 'replied' && (
                    <button onClick={() => updateStatus(selected.id, 'replied')}
                      className="px-3 py-1.5 text-[12.5px] font-semibold bg-ink text-ivory rounded-[8px] hover:bg-ink-soft">
                      Mark replied
                    </button>
                  )}
                  <Badge variant={selected.status === 'unread' ? 'info' : selected.status === 'replied' ? 'success' : 'outline'}>
                    {selected.status}
                  </Badge>
                </div>
              </div>

              {/* Contact details */}
              <div className="flex flex-wrap gap-4 py-3 border-y border-sand text-[13px]">
                {selected.senderPhone && <span className="text-slate">📞 {selected.senderPhone}</span>}
                {selected.senderEmail && <span className="text-slate">✉️ {selected.senderEmail}</span>}
                <span className="text-slate ml-auto">{new Date(selected.createdAt).toLocaleString('en-KE')}</span>
              </div>

              {/* Message body */}
              <div className="bg-ivory rounded-[12px] p-4">
                <p className="text-[14px] text-ink leading-relaxed whitespace-pre-wrap">{selected.body}</p>
              </div>

              {/* Reply via WhatsApp */}
              {selected.senderPhone && currentBusiness?.contact?.whatsapp && (
                <a
                  href={`https://wa.me/${selected.senderPhone.replace(/\D/g, '')}?text=Hi ${selected.senderName}, thank you for reaching out to ${currentBusiness.name}.`}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center gap-2 px-4 py-2.5 bg-green-light text-green font-semibold text-[13.5px] rounded-[9px] border border-green/20 hover:bg-green/10 w-fit"
                >
                  <MessageSquare size={15} /> Reply on WhatsApp
                </a>
              )}
            </div>
          ) : (
            <div className="bg-white border border-sand rounded-[14px] flex items-center justify-center" style={{ minHeight: 320 }}>
              <div className="text-center">
                <MessageSquare size={28} className="text-sand-dark mx-auto mb-3" />
                <p className="text-[14px] text-slate">Select a message to view it</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
