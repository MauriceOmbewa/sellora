import { useEffect, useRef, useState } from 'react'
import { MessageSquare, Send, Clock, CheckCheck, Check, Image, FileText, Mic, Phone } from 'lucide-react'
import {
  PageHeader, EmptyState, Badge, Skeleton, Tabs, useToast,
} from '@/components/ui'
import { messagesService, whatsappService } from '@/services/remainingServices'
import { useAuth } from '@/context/AuthContext'
import type { Message, MessageStatus, WaConversation, WaMessage } from '@/types'

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

const channelLabel: Record<string, string> = {
  contact_form: 'Contact Form',
  whatsapp:     'WhatsApp',
  email:        'Email',
}

function formatTime(iso: string | null): string {
  if (!iso) return ''
  const d = new Date(iso)
  const now = new Date()
  const diffH = (now.getTime() - d.getTime()) / 3_600_000
  if (diffH < 24) return d.toLocaleTimeString('en-KE', { hour: '2-digit', minute: '2-digit' })
  if (diffH < 168) return d.toLocaleDateString('en-KE', { weekday: 'short' })
  return d.toLocaleDateString('en-KE', { day: 'numeric', month: 'short' })
}

function formatWindowTime(seconds: number): string {
  if (seconds <= 0) return 'Expired'
  const h = Math.floor(seconds / 3600)
  const m = Math.floor((seconds % 3600) / 60)
  if (h > 0) return `${h}h ${m}m`
  return `${m}m`
}

function WaStatusIcon({ status }: { status: string }) {
  if (status === 'read')      return <CheckCheck size={13} className="text-blue" />
  if (status === 'delivered') return <CheckCheck size={13} className="text-slate" />
  if (status === 'sent')      return <Check size={13} className="text-slate" />
  if (status === 'failed')    return <span className="text-red text-[11px] font-bold">!</span>
  return null
}

function MediaIcon({ type }: { type: string }) {
  if (type === 'image')    return <Image size={13} className="inline mr-1" />
  if (type === 'document') return <FileText size={13} className="inline mr-1" />
  if (type === 'audio')    return <Mic size={13} className="inline mr-1" />
  return null
}

// ─────────────────────────────────────────────────────────────────────────────
// Contact-form inquiries panel (unchanged behaviour)
// ─────────────────────────────────────────────────────────────────────────────

function InquiriesPanel() {
  const { currentBusiness } = useAuth()
  const { toast } = useToast()
  const [messages, setMessages]       = useState<Message[]>([])
  const [loading, setLoading]         = useState(true)
  const [statusFilter, setStatusFilter] = useState<MessageStatus | ''>('')
  const [selected, setSelected]       = useState<Message | null>(null)
  const [totalCount, setTotalCount]   = useState(0)

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
    <div className="space-y-4">
      {/* Filter tabs */}
      <div className="flex gap-2 flex-wrap">
        {[
          { id: '',        label: `All (${totalCount})` },
          { id: 'unread',  label: `Unread (${unreadCount})` },
          { id: 'read',    label: 'Read' },
          { id: 'replied', label: 'Replied' },
        ].map(tab => (
          <button key={tab.id} onClick={() => setStatusFilter(tab.id as MessageStatus | '')}
            className={['px-4 py-2 rounded-[8px] text-[13px] font-semibold border transition-colors',
              statusFilter === tab.id
                ? 'bg-ink text-ivory border-ink'
                : 'bg-white text-slate border-sand hover:border-ink hover:text-ink',
            ].join(' ')}>
            {tab.label}
          </button>
        ))}
      </div>

      <div className="grid lg:grid-cols-5 gap-5">
        {/* List */}
        <div className="lg:col-span-2 bg-white border border-sand rounded-[14px] overflow-hidden">
          {loading ? (
            <div className="p-5 space-y-4">
              {[1,2,3,4].map(i => (
                <div key={i} className="flex gap-3">
                  <Skeleton width={36} height={36} rounded />
                  <div className="flex-1 space-y-2">
                    <Skeleton height={13} className="w-2/3" />
                    <Skeleton height={11} className="w-1/2" />
                  </div>
                </div>
              ))}
            </div>
          ) : messages.length === 0 ? (
            <EmptyState icon={<MessageSquare size={22} />} title="No messages"
              description="Customer inquiries will appear here." />
          ) : (
            messages.map(msg => (
              <button key={msg.id} onClick={() => openMessage(msg)}
                className={['w-full flex items-start gap-3 px-4 py-4 border-b border-sand last:border-0 text-left transition-colors',
                  selected?.id === msg.id ? 'bg-ivory' : 'hover:bg-ivory/50',
                  msg.status === 'unread' ? 'bg-blue-light/20' : '',
                ].join(' ')}>
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
                  <p className="text-[12px] text-slate bg-sand/60 px-2 py-0.5 rounded-full w-fit mt-0.5">
                    {channelLabel[msg.channel] ?? msg.channel}
                  </p>
                  <p className="text-[12.5px] text-slate mt-1 line-clamp-2">{msg.body}</p>
                </div>
              </button>
            ))
          )}
        </div>

        {/* Detail */}
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
                      className="px-3 py-1.5 text-[12.5px] font-semibold bg-ink text-ivory rounded-[8px] hover:bg-ink/80">
                      Mark replied
                    </button>
                  )}
                  <Badge variant={selected.status === 'unread' ? 'info' : selected.status === 'replied' ? 'success' : 'outline'}>
                    {selected.status}
                  </Badge>
                </div>
              </div>
              <div className="flex flex-wrap gap-4 py-3 border-y border-sand text-[13px]">
                {selected.senderPhone && <span className="text-slate flex items-center gap-1.5"><Phone size={13} /> {selected.senderPhone}</span>}
                {selected.senderEmail && <span className="text-slate">✉️ {selected.senderEmail}</span>}
                <span className="text-slate ml-auto">{new Date(selected.createdAt).toLocaleString('en-KE')}</span>
              </div>
              <div className="bg-ivory rounded-[12px] p-4">
                <p className="text-[14px] text-ink leading-relaxed whitespace-pre-wrap">{selected.body}</p>
              </div>
              {selected.senderPhone && currentBusiness?.contact?.whatsapp && (
                <a href={`https://wa.me/${selected.senderPhone.replace(/\D/g, '')}?text=Hi ${selected.senderName}, thank you for reaching out to ${currentBusiness.name}.`}
                  target="_blank" rel="noreferrer"
                  className="flex items-center gap-2 px-4 py-2.5 bg-green-light text-green font-semibold text-[13.5px] rounded-[9px] border border-green/20 hover:bg-green/10 w-fit">
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

// ─────────────────────────────────────────────────────────────────────────────
// WhatsApp conversations panel
// ─────────────────────────────────────────────────────────────────────────────

function WhatsAppPanel() {
  const { currentBusiness } = useAuth()
  const { toast } = useToast()

  const [conversations, setConversations] = useState<WaConversation[]>([])
  const [loading, setLoading]             = useState(true)
  const [selected, setSelected]           = useState<WaConversation | null>(null)
  const [convLoading, setConvLoading]     = useState(false)
  const [replyText, setReplyText]         = useState('')
  const [sending, setSending]             = useState(false)
  const [totalCount, setTotalCount]       = useState(0)
  const [windowTick, setWindowTick]       = useState(0)

  const bottomRef = useRef<HTMLDivElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  // Countdown ticker — updates every minute so the window badge stays accurate
  useEffect(() => {
    const id = setInterval(() => setWindowTick(t => t + 1), 60_000)
    return () => clearInterval(id)
  }, [])

  const loadList = () => {
    if (!currentBusiness) return
    setLoading(true)
    whatsappService.getConversations(currentBusiness.id)
      .then(({ conversations, count }) => {
        setConversations(conversations)
        setTotalCount(count)
      })
      .catch(() => toast('error', 'Failed to load WhatsApp conversations'))
      .finally(() => setLoading(false))
  }

  useEffect(() => { loadList() }, [currentBusiness?.id]) // eslint-disable-line

  const openConversation = async (conv: WaConversation) => {
    if (!currentBusiness) return
    setSelected(conv)
    setConvLoading(true)
    try {
      const full = await whatsappService.getConversation(currentBusiness.id, conv.id)
      setSelected(full)
      // Clear unread badge locally
      setConversations(prev =>
        prev.map(c => c.id === conv.id ? { ...c, unreadCount: 0 } : c)
      )
    } catch {
      toast('error', 'Failed to load conversation')
    } finally {
      setConvLoading(false)
    }
  }

  // Scroll to bottom when messages load
  useEffect(() => {
    if (selected?.messages?.length) {
      setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: 'smooth' }), 50)
    }
  }, [selected?.messages?.length])

  const sendReply = async () => {
    if (!currentBusiness || !selected || !replyText.trim()) return
    setSending(true)
    try {
      const newMsg = await whatsappService.reply(currentBusiness.id, selected.id, replyText.trim())
      setSelected(prev => prev ? {
        ...prev,
        messages: [...(prev.messages ?? []), newMsg],
        lastMessagePreview: replyText.trim(),
      } : prev)
      setConversations(prev => prev.map(c =>
        c.id === selected.id
          ? { ...c, lastMessagePreview: replyText.trim(), lastMessageAt: new Date().toISOString() }
          : c
      ))
      setReplyText('')
      textareaRef.current?.focus()
    } catch {
      toast('error', 'Failed to send message', 'Check your WhatsApp integration settings.')
    } finally {
      setSending(false)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendReply()
    }
  }

  // Window status (recalculated every minute via windowTick)
  const windowActive = selected
    ? (selected.serviceWindowExpiresAt
        ? new Date(selected.serviceWindowExpiresAt) > new Date()
        : false)
    : false
  const windowSecondsLeft = selected?.serviceWindowExpiresAt
    ? Math.max(0, Math.floor((new Date(selected.serviceWindowExpiresAt).getTime() - Date.now()) / 1000))
    : 0
  void windowTick // consumed by the effect above

  return (
    <div className="grid lg:grid-cols-5 gap-5">
      {/* Conversation list */}
      <div className="lg:col-span-2 bg-white border border-sand rounded-[14px] overflow-hidden flex flex-col">
        <div className="px-4 py-3 border-b border-sand flex items-center justify-between">
          <p className="text-[13px] font-semibold text-ink">
            {totalCount} conversation{totalCount !== 1 ? 's' : ''}
          </p>
          <button onClick={loadList} className="text-[12px] text-slate hover:text-ink transition-colors">
            Refresh
          </button>
        </div>

        <div className="flex-1 overflow-y-auto">
          {loading ? (
            <div className="p-5 space-y-4">
              {[1,2,3,4].map(i => (
                <div key={i} className="flex gap-3">
                  <Skeleton width={40} height={40} rounded />
                  <div className="flex-1 space-y-2">
                    <Skeleton height={13} className="w-3/4" />
                    <Skeleton height={11} className="w-1/2" />
                  </div>
                </div>
              ))}
            </div>
          ) : conversations.length === 0 ? (
            <EmptyState
              icon={<MessageSquare size={22} />}
              title="No WhatsApp conversations"
              description="Messages from your WhatsApp number will appear here once a customer texts you."
            />
          ) : (
            conversations.map(conv => (
              <button key={conv.id} onClick={() => openConversation(conv)}
                className={['w-full flex items-start gap-3 px-4 py-3.5 border-b border-sand last:border-0 text-left transition-colors',
                  selected?.id === conv.id ? 'bg-ivory' : 'hover:bg-ivory/50',
                  conv.unreadCount > 0 ? 'bg-green-light/20' : '',
                ].join(' ')}>
                {/* Avatar */}
                <div className="w-10 h-10 rounded-full bg-green-light flex items-center justify-center font-serif font-semibold text-green shrink-0 text-[14px]">
                  {(conv.customerName || conv.customerPhone)[0].toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-1">
                    <p className={['text-[13.5px] truncate', conv.unreadCount > 0 ? 'font-bold text-ink' : 'font-medium text-ink'].join(' ')}>
                      {conv.customerName || conv.customerPhone}
                    </p>
                    <span className="text-[11px] text-slate shrink-0">{formatTime(conv.lastMessageAt)}</span>
                  </div>
                  <div className="flex items-center justify-between gap-1 mt-0.5">
                    <p className="text-[12.5px] text-slate truncate flex-1">{conv.lastMessagePreview || '...'}</p>
                    {conv.unreadCount > 0 && (
                      <span className="bg-green text-white text-[11px] font-bold w-5 h-5 rounded-full flex items-center justify-center shrink-0">
                        {conv.unreadCount > 9 ? '9+' : conv.unreadCount}
                      </span>
                    )}
                  </div>
                </div>
              </button>
            ))
          )}
        </div>
      </div>

      {/* Conversation thread */}
      <div className="lg:col-span-3 flex flex-col bg-white border border-sand rounded-[14px] overflow-hidden" style={{ minHeight: 480 }}>
        {!selected ? (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <MessageSquare size={28} className="text-sand-dark mx-auto mb-3" />
              <p className="text-[14px] text-slate">Select a conversation</p>
            </div>
          </div>
        ) : (
          <>
            {/* Header */}
            <div className="px-5 py-3.5 border-b border-sand flex items-center justify-between gap-4 shrink-0">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-9 h-9 rounded-full bg-green-light flex items-center justify-center font-serif font-semibold text-green shrink-0 text-[13px]">
                  {(selected.customerName || selected.customerPhone)[0].toUpperCase()}
                </div>
                <div className="min-w-0">
                  <p className="font-semibold text-ink text-[14px] truncate">
                    {selected.customerName || selected.customerPhone}
                  </p>
                  <p className="text-[12px] text-slate">+{selected.customerPhone}</p>
                </div>
              </div>

              {/* 24-hour window indicator */}
              <div className={[
                'flex items-center gap-1.5 px-3 py-1 rounded-full text-[11.5px] font-semibold shrink-0',
                windowActive
                  ? 'bg-green-light text-green'
                  : 'bg-red-light text-red',
              ].join(' ')}>
                <Clock size={11} />
                {windowActive
                  ? `Window: ${formatWindowTime(windowSecondsLeft)}`
                  : 'Window closed'}
              </div>
            </div>

            {/* Window-closed notice */}
            {!windowActive && (
              <div className="px-5 py-2.5 bg-gold-light border-b border-gold/20 text-[12.5px] text-ink-soft">
                The 24-hour service window is closed. To message this customer you'll need an approved WhatsApp template. Contact Meta to submit templates.
              </div>
            )}

            {/* Messages */}
            <div className="flex-1 overflow-y-auto px-5 py-4 space-y-3">
              {convLoading ? (
                <div className="space-y-3">
                  {[1,2,3].map(i => (
                    <div key={i} className={`flex ${i % 2 === 0 ? 'justify-end' : 'justify-start'}`}>
                      <Skeleton height={48} className={`rounded-[14px] ${i % 2 === 0 ? 'w-2/3' : 'w-1/2'}`} />
                    </div>
                  ))}
                </div>
              ) : (selected.messages ?? []).length === 0 ? (
                <p className="text-center text-[13px] text-slate py-8">No messages yet</p>
              ) : (
                (selected.messages ?? []).map(msg => (
                  <WaMessageBubble key={msg.id} msg={msg} />
                ))
              )}
              <div ref={bottomRef} />
            </div>

            {/* Reply box */}
            <div className="px-4 py-3 border-t border-sand shrink-0">
              <div className="flex items-end gap-3">
                <textarea
                  ref={textareaRef}
                  value={replyText}
                  onChange={e => setReplyText(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder={windowActive ? 'Type a message… (Enter to send)' : 'Window closed — templates only'}
                  disabled={!windowActive || sending}
                  rows={2}
                  className={[
                    'flex-1 resize-none rounded-[10px] border px-3.5 py-2.5 text-[13.5px] text-ink placeholder:text-slate/60',
                    'focus:outline-none focus:ring-2 focus:ring-green/30 focus:border-green transition-all',
                    'disabled:bg-ivory disabled:cursor-not-allowed',
                    windowActive ? 'border-sand' : 'border-sand bg-ivory',
                  ].join(' ')}
                />
                <button
                  onClick={sendReply}
                  disabled={!replyText.trim() || sending || !windowActive}
                  className={[
                    'w-10 h-10 rounded-full flex items-center justify-center shrink-0 transition-all',
                    replyText.trim() && !sending && windowActive
                      ? 'bg-green text-white hover:bg-green/80'
                      : 'bg-sand text-slate cursor-not-allowed',
                  ].join(' ')}
                >
                  <Send size={16} />
                </button>
              </div>
              <p className="text-[11px] text-slate mt-1.5 text-right">
                Shift+Enter for new line · Enter to send
              </p>
            </div>
          </>
        )}
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// Message bubble
// ─────────────────────────────────────────────────────────────────────────────

function WaMessageBubble({ msg }: { msg: WaMessage }) {
  const isOut = msg.direction === 'outbound'
  const time = msg.messageTimestamp
    ? new Date(msg.messageTimestamp).toLocaleTimeString('en-KE', { hour: '2-digit', minute: '2-digit' })
    : ''

  return (
    <div className={`flex ${isOut ? 'justify-end' : 'justify-start'}`}>
      <div className={[
        'max-w-[70%] px-3.5 py-2.5 rounded-[14px] text-[13.5px] leading-snug',
        isOut
          ? 'bg-green text-white rounded-br-[4px]'
          : 'bg-ivory text-ink border border-sand rounded-bl-[4px]',
      ].join(' ')}>
        {msg.messageType !== 'text' && (
          <p className={`flex items-center gap-1 text-[12px] mb-1 ${isOut ? 'text-white/70' : 'text-slate'}`}>
            <MediaIcon type={msg.messageType} />
            {msg.messageType}
          </p>
        )}
        {msg.body && <p className="whitespace-pre-wrap break-words">{msg.body}</p>}
        <div className={`flex items-center justify-end gap-1 mt-1 ${isOut ? 'text-white/60' : 'text-slate'}`}>
          <span className="text-[11px]">{time}</span>
          {isOut && <WaStatusIcon status={msg.status} />}
          {isOut && msg.sentByName && (
            <span className="text-[10px] opacity-70">{msg.sentByName}</span>
          )}
        </div>
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// Page root
// ─────────────────────────────────────────────────────────────────────────────

export default function MessagesPage() {
  const [activeTab, setActiveTab] = useState('whatsapp')

  const tabs = [
    { id: 'whatsapp',   label: 'WhatsApp' },
    { id: 'inquiries',  label: 'Inquiries' },
  ]

  return (
    <div className="space-y-5 fade-in">
      <PageHeader
        title="Messages"
        subtitle="WhatsApp conversations and customer inquiries"
      />

      <Tabs tabs={tabs} activeTab={activeTab} onChange={setActiveTab} variant="underline" />

      {activeTab === 'whatsapp'  && <WhatsAppPanel />}
      {activeTab === 'inquiries' && <InquiriesPanel />}
    </div>
  )
}
