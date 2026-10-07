import { api } from '@/services/api'

export interface ChatVisitor {
  id: string
  name: string
  email: string
  phone: string
  created_at: string
}

export interface ChatMessage {
  id: string
  sender_type: 'visitor' | 'business'
  content: string
  is_read: boolean
  created_at: string
}

export interface ChatConversation {
  id: string
  visitor: ChatVisitor
  status: 'open' | 'closed'
  last_message_at: string | null
  created_at: string
  messages?: ChatMessage[]
}

interface ApiResponse<T> {
  success: boolean
  data: T
}

// ── Storefront / visitor-side ─────────────────────────────────────────────────

/**
 * Create or retrieve a chat visitor for this storefront.
 * Pass `visitorId` (from localStorage) to restore an existing session.
 * `name` and `phone` are stored on the visitor record for the admin to see.
 */
export async function createOrGetChatVisitor(
  slug: string,
  visitorId?: string,
  name = '',
  phone = '',
): Promise<ChatVisitor> {
  const body: Record<string, string> = { name, phone }
  if (visitorId && visitorId !== 'undefined') body.visitor_id = visitorId

  const res = await api.post<ApiResponse<ChatVisitor>>(
    `/api/v1/store/${slug}/chat/visitor/`,
    body,
    { public: true },
  )
  return res.data
}

export async function createOrGetChatConversation(
  slug: string,
  visitorId: string,
): Promise<ChatConversation> {
  const res = await api.post<ApiResponse<ChatConversation>>(
    `/api/v1/store/${slug}/chat/conversation/`,
    { visitor_id: visitorId },
    { public: true },
  )
  return res.data
}

export async function getChatConversation(
  slug: string,
  visitorId: string,
): Promise<ChatConversation | null> {
  const res = await api.get<ApiResponse<ChatConversation | null>>(
    `/api/v1/store/${slug}/chat/conversation/?visitor_id=${encodeURIComponent(visitorId)}`,
    { public: true },
  )
  return res.data
}

export async function getChatMessages(
  slug: string,
  conversationId: string,
  visitorId: string,
): Promise<ChatMessage[]> {
  const res = await api.get<ApiResponse<ChatMessage[]>>(
    `/api/v1/store/${slug}/chat/conversation/${conversationId}/messages/?visitor_id=${encodeURIComponent(visitorId)}`,
    { public: true },
  )
  return res.data
}

// ── Business / admin side ─────────────────────────────────────────────────────

export async function getBusinessChatConversations(
  businessId: string,
): Promise<ChatConversation[]> {
  const res = await api.get<ApiResponse<ChatConversation[]>>(
    `/api/v1/businesses/${businessId}/chat/conversations/`,
  )
  return res.data
}

export async function getBusinessChatConversation(
  businessId: string,
  conversationId: string,
): Promise<ChatConversation> {
  const res = await api.get<ApiResponse<ChatConversation>>(
    `/api/v1/businesses/${businessId}/chat/conversations/${conversationId}/`,
  )
  return res.data
}

/**
 * POST /api/v1/businesses/{id}/chat/conversations/{convId}/read/
 * Marks all unread visitor messages in the conversation as read.
 */
export async function markConversationRead(
  businessId: string,
  conversationId: string,
): Promise<void> {
  await api.post<ApiResponse<{ marked_read: number }>>(
    `/api/v1/businesses/${businessId}/chat/conversations/${conversationId}/read/`,
  )
}

/**
 * Build the WebSocket URL for the business-wide notification socket.
 * This socket connects to a per-business group so the admin receives
 * new_conversation_message events even when not viewing a conversation.
 *
 * We reuse the conversation socket endpoint but authenticate as business;
 * the consumer will join both the conversation group AND the business group.
 * For the notification socket we pass a sentinel conversation ID that the
 * backend resolves to the business-wide group only.
 *
 * IMPLEMENTATION NOTE:
 * The simplest approach with the current consumer is to open a WebSocket
 * to any open conversation (just to authenticate and join the business group).
 * The consumer adds the business to business_{id} group on auth regardless of
 * which conversation the socket was opened for.
 *
 * This function is not an API call — it just builds the URL.
 */
export function buildBusinessWsUrl(conversationId: string): string {
  const base   = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:8000'
  const parsed = new URL(base)
  const proto  = parsed.protocol === 'https:' ? 'wss:' : 'ws:'
  return `${proto}//${parsed.host}/ws/chat/${conversationId}/`
}
