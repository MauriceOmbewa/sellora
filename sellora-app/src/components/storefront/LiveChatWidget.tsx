/**
 * LiveChatWidget
 *
 * Floating live-chat button and panel for every storefront page.
 *
 * States:
 *   closed   → floating button
 *   intro    → name/phone form + anonymous-session warning
 *   chat     → message list + composer (WebSocket)
 *
 * Anonymous visitors:
 *   - Identified by a UUID stored in localStorage (persists across page
 *     refreshes within the same browser).
 *   - A one-time banner warns that chat history won't carry over if they
 *     clear local storage or use a different device.
 *   - Offering to sign in is shown in the banner (links to /login).
 *
 * Logged-in customers (future work — hook AuthContext here):
 *   - Skip the intro form (name is already known).
 *   - No warning banner needed.
 */

import { useEffect, useRef, useState } from 'react'
import {
  MessageCircle, Send, X, Minus,
  AlertCircle, ArrowRight, User, Phone,
} from 'lucide-react'
import { useStorefront } from '@/context/StorefrontContext'
import {
  createOrGetChatVisitor,
  createOrGetChatConversation,
  getChatMessages,
} from '@/services/chatService'

// ── Types ─────────────────────────────────────────────────────────────────────

interface ChatMessage {
  id: string
  sender: 'customer' | 'business'
  text: string
  time: string
}

interface ChatVisitor {
  id: string
  name: string
  email: string
  created_at: string
}

interface ChatConversation {
  id: string
  status: 'open' | 'closed'
  last_message_at: string | null
  created_at: string
}

// ── Constants ─────────────────────────────────────────────────────────────────

const VISITOR_KEY   = 'sellora_chat_visitor_id'
const WARNED_KEY    = 'sellora_chat_warned'   // set once user has seen the anon warning

// ── Helpers ───────────────────────────────────────────────────────────────────

function fmtTime(iso: string) {
  return new Date(iso).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
}

function mapMsg(raw: {
  id: string; sender_type: 'visitor' | 'business'; content: string; created_at: string
}): ChatMessage {
  return {
    id:     raw.id,
    sender: raw.sender_type === 'visitor' ? 'customer' : 'business',
    text:   raw.content,
    time:   fmtTime(raw.created_at),
  }
}

function buildWsUrl(conversationId: string): string {
  const base   = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:8000'
  const parsed = new URL(base)
  const proto  = parsed.protocol === 'https:' ? 'wss:' : 'ws:'
  return `${proto}//${parsed.host}/ws/chat/${conversationId}/`
}

// ── Component ─────────────────────────────────────────────────────────────────

export default function LiveChatWidget() {
  const { business, basePath } = useStorefront()
  const primary = business?.theme.primaryColor ?? '#C79A3D'
  const slug    = business?.slug

  // Panel state
  type PanelState = 'closed' | 'intro' | 'chat'
  const [panel, setPanel]                 = useState<PanelState>('closed')

  // Intro form
  const [introName, setIntroName]         = useState('')
  const [introPhone, setIntroPhone]       = useState('')
  const [introError, setIntroError]       = useState('')
  const [introSubmitting, setIntroSubmitting] = useState(false)

  // Session / chat
  const [visitor, setVisitor]             = useState<ChatVisitor | null>(null)
  const [conversation, setConversation]   = useState<ChatConversation | null>(null)
  const [messages, setMessages]           = useState<ChatMessage[]>([])
  const [message, setMessage]             = useState('')
  const [loading, setLoading]             = useState(false)
  const [connected, setConnected]         = useState(false)
  const [showWarning, setShowWarning]     = useState(false)

  const socketRef   = useRef<WebSocket | null>(null)
  const bottomRef   = useRef<HTMLDivElement>(null)
  const inputRef    = useRef<HTMLTextAreaElement>(null)

  // Scroll to bottom when new messages arrive
  useEffect(() => {
    if (messages.length) {
      setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: 'smooth' }), 40)
    }
  }, [messages.length])

  // Show warning once per browser until dismissed
  useEffect(() => {
    if (panel === 'chat' && !localStorage.getItem(WARNED_KEY)) {
      setShowWarning(true)
    }
  }, [panel])

  // ── WebSocket ───────────────────────────────────────────────────────────────

  const closeSocket = () => {
    if (socketRef.current) {
      socketRef.current.close()
      socketRef.current = null
    }
    setConnected(false)
  }

  // Timeout ref: if we don't receive auth.success within 8s, show fallback
  const connectTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const [wsUnavailable, setWsUnavailable] = useState(false)

  const clearConnectTimeout = () => {
    if (connectTimeoutRef.current) {
      clearTimeout(connectTimeoutRef.current)
      connectTimeoutRef.current = null
    }
  }

  const connectWs = (convId: string, visitorId: string) => {
    closeSocket()
    setWsUnavailable(false)

    // Start a connection timeout — if auth.success doesn't arrive in 8s, give up gracefully
    clearConnectTimeout()
    connectTimeoutRef.current = setTimeout(() => {
      setWsUnavailable(true)
      setConnected(false)
      closeSocket()
    }, 8000)

    let ws: WebSocket
    try {
      ws = new WebSocket(buildWsUrl(convId))
    } catch {
      clearConnectTimeout()
      setWsUnavailable(true)
      return
    }

    ws.onopen = () => {
      ws.send(JSON.stringify({ type: 'auth', role: 'visitor', visitor_id: visitorId }))
    }

    ws.onmessage = evt => {
      try {
        const data = JSON.parse(evt.data)
        if (data.type === 'auth.success') {
          clearConnectTimeout()
          setConnected(true)
          return
        }
        if (data.type === 'chat.message' && data.message) {
          const incoming = mapMsg(data.message)
          setMessages(prev =>
            prev.some(m => m.id === incoming.id) ? prev : [...prev, incoming]
          )
        }
        if (data.type === 'error') console.error('[chat]', data.message)
      } catch { /* ignore parse errors */ }
    }

    ws.onclose  = () => { clearConnectTimeout(); setConnected(false) }
    ws.onerror  = () => { clearConnectTimeout(); setConnected(false) }
    socketRef.current = ws
  }

  // Clean up timeout on unmount
  useEffect(() => () => clearConnectTimeout(), [])

  // ── Init chat (called after intro form is submitted) ────────────────────────

  const initChat = async (name: string, phone: string) => {
    if (!slug) return
    setLoading(true)
    try {
      // Always create a new visitor when a name is explicitly provided.
      // Pass NO stored visitor ID so the backend creates a fresh record.
      // This ensures the name the user just typed is what gets saved.
      const v = await createOrGetChatVisitor(slug, undefined, name, phone)
      localStorage.setItem(VISITOR_KEY, v.id)
      setVisitor(v)

      const conv = await createOrGetChatConversation(slug, v.id)
      setConversation(conv)

      const history = await getChatMessages(slug, conv.id, v.id)
      setMessages(history.map(mapMsg))

      connectWs(conv.id, v.id)
      setPanel('chat')
    } catch (err) {
      console.error('[chat] init failed', err)
      setIntroError('Could not connect to chat. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  // ── Handlers ────────────────────────────────────────────────────────────────

  const handleOpen = () => {
    // Always go to intro so the user can confirm/change their name.
    // Pre-fill from localStorage visitor name if available, but let them edit.
    // Do NOT pre-fill from `visitor` state — it may be stale from a previous session.
    setIntroName('')
    setIntroPhone('')
    setIntroError('')
    setPanel('intro')
  }

  const handleClose = () => {
    clearConnectTimeout()
    closeSocket()
    setPanel('closed')
    setConversation(null)
    setMessages([])
    setConnected(false)
    setWsUnavailable(false)
    setIntroError('')
  }

  const handleIntroSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!introName.trim()) { setIntroError('Please enter your name so we know who to chat with.'); return }
    setIntroError('')
    setIntroSubmitting(true)
    await initChat(introName.trim(), introPhone.trim())
    setIntroSubmitting(false)
  }

  const handleSend = () => {
    const trimmed = message.trim()
    if (!trimmed) return
    if (!socketRef.current || socketRef.current.readyState !== WebSocket.OPEN) {
      console.warn('[chat] WebSocket not open')
      return
    }
    socketRef.current.send(JSON.stringify({ type: 'message', content: trimmed }))
    setMessage('')
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend() }
  }

  const dismissWarning = () => {
    localStorage.setItem(WARNED_KEY, '1')
    setShowWarning(false)
  }

  // ── Render ───────────────────────────────────────────────────────────────────

  // ── Floating button (closed) ─────────────────────────────────────────────────
  if (panel === 'closed') {
    return (
      <button
        onClick={handleOpen}
        className="fixed bottom-5 right-5 sm:right-6 z-50 w-14 h-14 rounded-full text-white shadow-lg flex items-center justify-center hover:scale-105 transition-transform"
        style={{ background: primary }}
        aria-label="Open live chat"
      >
        <MessageCircle size={23} />
        <span className="absolute top-0.5 right-0.5 w-3.5 h-3.5 rounded-full bg-green border-2 border-white" />
      </button>
    )
  }

  // Shared panel wrapper
  return (
    <div className="fixed bottom-24 right-5 sm:right-6 z-50 w-[calc(100vw-40px)] max-w-[380px] bg-white rounded-2xl border border-sand shadow-2xl overflow-hidden flex flex-col"
      style={{ height: panel === 'intro' ? 'auto' : '520px' }}>

      {/* ── Header ──────────────────────────────────────────────────────────── */}
      <div
        className="px-5 py-4 text-white flex items-center justify-between shrink-0"
        style={{ background: primary }}
      >
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-white/20 flex items-center justify-center">
            <MessageCircle size={17} />
          </div>
          <div>
            <p className="font-semibold text-[14px]">{business?.name ?? 'Live Chat'}</p>
            {panel === 'chat' && (
              <div className="flex items-center gap-1.5 mt-0.5">
                <span className={['w-1.5 h-1.5 rounded-full', connected ? 'bg-white' : 'bg-white/40'].join(' ')} />
                <span className="text-[11px] text-white/80">
                  {loading ? 'Connecting…' : connected ? 'Online' : 'Offline'}
                </span>
              </div>
            )}
          </div>
        </div>
        <div className="flex items-center gap-1">
          <button onClick={() => setPanel('closed')}
            className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-white/10"
            aria-label="Minimize">
            <Minus size={17} />
          </button>
          <button onClick={handleClose}
            className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-white/10"
            aria-label="Close chat">
            <X size={17} />
          </button>
        </div>
      </div>

      {/* ── Intro form ──────────────────────────────────────────────────────── */}
      {panel === 'intro' && (
        <form onSubmit={handleIntroSubmit} className="p-5 space-y-4">
          {/* Anonymous warning */}
          <div className="bg-gold-light border border-gold/30 rounded-[12px] px-4 py-3 flex items-start gap-3">
            <AlertCircle size={14} className="text-gold-deep mt-0.5 shrink-0" />
            <div>
              <p className="text-[12.5px] font-semibold text-ink">Chat not saved after you leave</p>
              <p className="text-[12px] text-slate mt-0.5 leading-relaxed">
                This chat is tied to your browser. If you clear your data or use a different device you'll lose the history.{' '}
                <a href="/login" className="text-gold-deep font-semibold hover:underline">
                  Sign in for persistent chats →
                </a>
              </p>
            </div>
          </div>

          {/* Name */}
          <div>
            <label className="block text-[13px] font-semibold text-ink mb-1.5">
              Your name <span className="text-red">*</span>
            </label>
            <div className="relative">
              <User size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate pointer-events-none" />
              <input
                type="text"
                value={introName}
                onChange={e => setIntroName(e.target.value)}
                placeholder="e.g. Faith Wanjiru"
                autoFocus
                className="w-full pl-9 pr-4 py-2.5 border border-sand rounded-[9px] text-[13.5px] text-ink focus:outline-none focus:border-ink transition-colors"
              />
            </div>
          </div>

          {/* Phone (optional) */}
          <div>
            <label className="block text-[13px] font-semibold text-ink mb-1.5">
              Phone number <span className="text-slate font-normal">(optional)</span>
            </label>
            <div className="relative">
              <Phone size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate pointer-events-none" />
              <input
                type="tel"
                value={introPhone}
                onChange={e => setIntroPhone(e.target.value)}
                placeholder="+254 712 345 678"
                className="w-full pl-9 pr-4 py-2.5 border border-sand rounded-[9px] text-[13.5px] text-ink focus:outline-none focus:border-ink transition-colors"
              />
            </div>
            <p className="text-[11.5px] text-slate mt-1">Helps the store reach you if you get disconnected.</p>
          </div>

          {introError && (
            <p className="text-[12.5px] text-red font-medium">{introError}</p>
          )}

          <button
            type="submit"
            disabled={introSubmitting || !introName.trim()}
            className="w-full flex items-center justify-center gap-2 py-3 text-white font-semibold text-[14px] rounded-[10px] hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
            style={{ background: primary }}
          >
            {introSubmitting
              ? <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              : <><ArrowRight size={15} /> Start chatting</>
            }
          </button>
        </form>
      )}

      {/* ── Chat panel ──────────────────────────────────────────────────────── */}
      {panel === 'chat' && (
        <>
          {/* Anonymous session warning (dismissible, shown once) */}
          {showWarning && (
            <div className="bg-gold-light border-b border-gold/30 px-4 py-2.5 flex items-start gap-2.5 shrink-0">
              <AlertCircle size={13} className="text-gold-deep mt-0.5 shrink-0" />
              <p className="text-[11.5px] text-ink flex-1 leading-relaxed">
                Chat history is saved in this browser only.{' '}
                <a href="/login" className="text-gold-deep font-semibold hover:underline">Sign in</a>
                {' '}for persistent history.
              </p>
              <button onClick={dismissWarning} className="text-slate hover:text-ink shrink-0">
                <X size={13} />
              </button>
            </div>
          )}

          {/* Visitor identity strip */}
          {visitor?.name && (
            <div className="px-4 py-2 border-b border-sand bg-ivory/50 shrink-0">
              <p className="text-[11.5px] text-slate">
                Chatting as <strong className="text-ink">{visitor.name}</strong>
                {' · '}
                <button
                  onClick={handleClose}
                  className="text-slate hover:text-ink underline text-[11px]"
                >
                  not you?
                </button>
              </p>
            </div>
          )}

          {/* Messages */}
          <div className="flex-1 overflow-y-auto bg-ivory px-4 py-5 space-y-3">
            {loading && messages.length === 0 && (
              <p className="text-center text-slate text-[12px] py-6">Starting chat…</p>
            )}
            {!loading && messages.length === 0 && (
              <div className="text-center py-8">
                <MessageCircle size={28} className="text-sand-dark mx-auto mb-3" />
                <p className="text-[13px] text-slate">Send a message to start the conversation.</p>
              </div>
            )}
            {messages.map(msg => (
              <div key={msg.id} className={['flex', msg.sender === 'customer' ? 'justify-end' : 'justify-start'].join(' ')}>
                <div
                  className={[
                    'max-w-[78%] px-4 py-2.5 text-[13px] leading-relaxed whitespace-pre-wrap',
                    msg.sender === 'customer'
                      ? 'text-white rounded-2xl rounded-br-md'
                      : 'bg-white text-ink border border-sand rounded-2xl rounded-bl-md',
                  ].join(' ')}
                  style={msg.sender === 'customer' ? { background: primary } : undefined}
                >
                  {msg.text}
                  <p className={['text-[10px] mt-1', msg.sender === 'customer' ? 'text-white/70' : 'text-slate'].join(' ')}>
                    {msg.time}
                  </p>
                </div>
              </div>
            ))}
            <div ref={bottomRef} />
          </div>

          {/* Composer */}
          <div className="border-t border-sand bg-white p-3 shrink-0">
            {wsUnavailable ? (
              <div className="py-3 px-1 text-center space-y-2">
                <p className="text-[12.5px] text-slate leading-snug">
                  Live chat is temporarily unavailable.
                </p>
                {business?.contact.whatsapp ? (
                  <a
                    href={`https://wa.me/${business.contact.whatsapp.replace(/\D/g, '')}?text=Hi! I'd like to chat with you.`}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center justify-center gap-2 py-2.5 text-[13px] font-semibold text-white rounded-[9px] bg-green hover:bg-green/80 transition-colors"
                  >
                    💬 Message on WhatsApp instead
                  </a>
                ) : (
                  <a
                    href={`${basePath}/contact`}
                    className="flex items-center justify-center gap-2 py-2.5 text-[13px] font-semibold rounded-[9px] border border-sand hover:border-ink transition-colors"
                  >
                    Send us a message →
                  </a>
                )}
              </div>
            ) : (
              <>
                <div className="flex items-end gap-2">
                  <textarea
                    ref={inputRef}
                    value={message}
                    onChange={e => setMessage(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder={connected ? 'Type a message…' : 'Connecting…'}
                    rows={1}
                    disabled={!connected}
                    className="flex-1 resize-none bg-ivory border border-sand rounded-xl px-3.5 py-2.5 text-[13px] text-ink placeholder:text-slate focus:outline-none focus:border-ink max-h-24 disabled:opacity-60"
                  />
                  <button
                    onClick={handleSend}
                    disabled={!message.trim() || !connected}
                    className="w-10 h-10 rounded-xl text-white flex items-center justify-center shrink-0 transition-opacity disabled:opacity-40"
                    style={{ background: primary }}
                    aria-label="Send"
                  >
                    <Send size={16} />
                  </button>
                </div>
                <p className="text-[10px] text-slate text-center mt-2">
                  Enter to send · Shift+Enter for new line
                </p>
              </>
            )}
          </div>
        </>
      )}
    </div>
  )
}
