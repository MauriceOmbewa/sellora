import { useEffect, useRef, useState } from 'react'
import { MessageCircle, Send, X, Minus } from 'lucide-react'
import { useStorefront } from '@/context/StorefrontContext'
import {
  createOrGetChatVisitor,
  createOrGetChatConversation,
  getChatMessages,
} from '@/services/chatService'

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

const VISITOR_STORAGE_KEY = 'sellora_chat_visitor_id'

export default function LiveChatWidget() {
  const { business } = useStorefront()

  const [open, setOpen] = useState(false)
  const [message, setMessage] = useState('')
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [visitor, setVisitor] = useState<ChatVisitor | null>(null)
  const [conversation, setConversation] =
    useState<ChatConversation | null>(null)

  const [loading, setLoading] = useState(false)
  const [connected, setConnected] = useState(false)

  const socketRef = useRef<WebSocket | null>(null)

  const primary =
    business?.theme.primaryColor ?? '#C79A3D'

  const slug = business?.slug

  const formatTime = (date: string) => {
    return new Date(date).toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  const mapMessage = (message: {
    id: string
    sender_type: 'visitor' | 'business'
    content: string
    created_at: string
  }): ChatMessage => {
    return {
      id: message.id,
      sender:
        message.sender_type === 'visitor'
          ? 'customer'
          : 'business',
      text: message.content,
      time: formatTime(message.created_at),
    }
  }

  const connectWebSocket = (
    conversationId: string,
    visitorId: string,
  ) => {
    if (socketRef.current) {
      socketRef.current.close()
    }

    const apiBaseUrl =
      import.meta.env.VITE_API_BASE_URL ??
      'http://localhost:8000'

    const apiUrl = new URL(apiBaseUrl)

    const protocol =
      apiUrl.protocol === 'https:' ? 'wss:' : 'ws:'

    const socket = new WebSocket(
      `${protocol}//${apiUrl.host}/ws/chat/${conversationId}/`,
    )

    socket.onopen = () => {
      socket.send(
        JSON.stringify({
          type: 'auth',
          role: 'visitor',
          visitor_id: visitorId,
        }),
      )
    }

    socket.onmessage = event => {
      try {
        const data = JSON.parse(event.data)

        if (data.type === 'auth.success') {
          setConnected(true)
          return
        }

        if (data.type === 'chat.message') {
          const incomingMessage = mapMessage(
            data.message,
          )

          setMessages(prev => {
            const alreadyExists = prev.some(
              existingMessage =>
                existingMessage.id ===
                incomingMessage.id,
            )

            if (alreadyExists) {
              return prev
            }

            return [...prev, incomingMessage]
          })

          return
        }

        if (data.type === 'error') {
          console.error(
            'Live chat error:',
            data.message,
          )
        }
      } catch (error) {
        console.error(
          'Failed to process chat message:',
          error,
        )
      }
    }

    socket.onclose = () => {
      setConnected(false)
    }

    socket.onerror = error => {
      console.error(
        'Live chat WebSocket error:',
        error,
      )

      setConnected(false)
    }

    socketRef.current = socket
  }

  const initializeChat = async () => {
    if (!slug || conversation || loading) {
      return
    }

    try {
      setLoading(true)

      const storedVisitorId =
        localStorage.getItem(VISITOR_STORAGE_KEY) || undefined

      const visitorData =
        await createOrGetChatVisitor(
          slug,
          storedVisitorId ?? undefined,
        )

      setVisitor(visitorData)

      localStorage.setItem(
        VISITOR_STORAGE_KEY,
        visitorData.id,
      )

      const conversationData =
        await createOrGetChatConversation(
          slug,
          visitorData.id,
        )

      setConversation(conversationData)

      const chatMessages =
        await getChatMessages(
          slug,
          conversationData.id,
          visitorData.id,
        )

      setMessages(
        chatMessages.map(message =>
          mapMessage(message),
        ),
      )

      connectWebSocket(
        conversationData.id,
        visitorData.id,
      )
    } catch (error) {
      console.error(
        'Failed to initialize live chat:',
        error,
      )
    } finally {
      setLoading(false)
    }
  }

  const sendMessage = () => {
    const trimmed = message.trim()

    if (!trimmed) {
      return
    }

    if (
      !socketRef.current ||
      socketRef.current.readyState !==
        WebSocket.OPEN
    ) {
      console.error(
        'Live chat is not connected.',
      )
      return
    }

    socketRef.current.send(
      JSON.stringify({
        type: 'message',
        content: trimmed,
      }),
    )

    setMessage('')
  }

  const handleKeyDown = (
    e: React.KeyboardEvent<HTMLTextAreaElement>,
  ) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  }

  useEffect(() => {
    if (!open || !slug) {
      return
    }

    initializeChat()

    return () => {
      if (socketRef.current) {
        socketRef.current.close()
        socketRef.current = null
      }

      setConnected(false)
    }
  }, [open, slug])

  return (
    <>
      {/* ── Chat Window ─────────────────────────────────────────────── */}
      {open && (
        <div className="fixed bottom-24 right-5 sm:right-6 z-50 w-[calc(100vw-40px)] max-w-[380px] h-[520px] bg-white rounded-2xl border border-sand shadow-2xl overflow-hidden flex flex-col">

          {/* Header */}
          <div
            className="px-5 py-4 text-white flex items-center justify-between shrink-0"
            style={{ background: primary }}
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center">
                <MessageCircle size={19} />
              </div>

              <div>
                <p className="font-semibold text-[14px]">
                  {business?.name ?? 'Live Chat'}
                </p>

                <div className="flex items-center gap-1.5 mt-0.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-white" />

                  <span className="text-[11px] text-white/80">
                    {loading
                      ? 'Connecting...'
                      : connected
                        ? 'Online'
                        : 'Offline'}
                  </span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-1">
              <button
                onClick={() => setOpen(false)}
                className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-white/10 transition-colors"
                aria-label="Minimize chat"
              >
                <Minus size={17} />
              </button>

              <button
                onClick={() => setOpen(false)}
                className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-white/10 transition-colors"
                aria-label="Close chat"
              >
                <X size={17} />
              </button>
            </div>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto bg-ivory px-4 py-5 space-y-3">
            {messages.length === 0 && (
              <div className="text-center text-slate text-[12px] py-6">
                {loading
                  ? 'Starting chat...'
                  : 'No messages yet.'}
              </div>
            )}

            {messages.map(msg => (
              <div
                key={msg.id}
                className={`flex ${
                  msg.sender === 'customer'
                    ? 'justify-end'
                    : 'justify-start'
                }`}
              >
                <div
                  className={`max-w-[78%] ${
                    msg.sender === 'customer'
                      ? 'text-white rounded-2xl rounded-br-md'
                      : 'bg-white text-ink border border-sand rounded-2xl rounded-bl-md'
                  } px-4 py-2.5`}
                  style={
                    msg.sender === 'customer'
                      ? { background: primary }
                      : undefined
                  }
                >
                  <p className="text-[13px] leading-relaxed whitespace-pre-wrap">
                    {msg.text}
                  </p>

                  <p
                    className={`text-[10px] mt-1 ${
                      msg.sender === 'customer'
                        ? 'text-white/70'
                        : 'text-slate'
                    }`}
                  >
                    {msg.time}
                  </p>
                </div>
              </div>
            ))}
          </div>

          {/* Message input */}
          <div className="border-t border-sand bg-white p-3 shrink-0">
            <div className="flex items-end gap-2">
              <textarea
                value={message}
                onChange={e =>
                  setMessage(e.target.value)
                }
                onKeyDown={handleKeyDown}
                placeholder={
                  connected
                    ? 'Type a message...'
                    : 'Connecting...'
                }
                rows={1}
                disabled={!connected}
                className="flex-1 resize-none bg-ivory border border-sand rounded-xl px-3.5 py-2.5 text-[13px] text-ink placeholder:text-slate focus:outline-none focus:border-ink max-h-24 disabled:opacity-60"
              />

              <button
                onClick={sendMessage}
                disabled={
                  !message.trim() || !connected
                }
                className="w-10 h-10 rounded-xl text-white flex items-center justify-center shrink-0 transition-opacity disabled:opacity-40"
                style={{ background: primary }}
                aria-label="Send message"
              >
                <Send size={16} />
              </button>
            </div>

            <p className="text-[10px] text-slate text-center mt-2">
              Press Enter to send · Shift + Enter for a new line
            </p>
          </div>
        </div>
      )}

      {/* ── Floating Chat Button ───────────────────────────────────── */}
      {!open && (
        <button
          onClick={() => setOpen(true)}
          className="fixed bottom-5 right-5 sm:right-6 z-50 w-14 h-14 rounded-full text-white shadow-lg flex items-center justify-center hover:scale-105 transition-transform"
          style={{ background: primary }}
          aria-label="Open live chat"
        >
          <MessageCircle size={23} />

          {/* Online indicator */}
          <span className="absolute top-0.5 right-0.5 w-3.5 h-3.5 rounded-full bg-green border-2 border-white" />
        </button>
      )}
    </>
  )
}
