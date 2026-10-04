import { api } from '@/services/api'

export interface ChatVisitor {
  id: string
  name: string
  email: string
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

export async function createOrGetChatVisitor(
  slug: string,
  visitorId?: string,
  name = '',
  email = '',
): Promise<ChatVisitor> {
  const body: {
    visitor_id?: string
    name: string
    email: string
  } = {
    name,
    email,
  }

  if (visitorId && visitorId !== 'undefined') {
    body.visitor_id = visitorId
  }

  const response = await api.post<ApiResponse<ChatVisitor>>(
    `/api/v1/store/${slug}/chat/visitor/`,
    body,
  )

  return response.data
}

export async function createOrGetChatConversation(
  slug: string,
  visitorId: string,
): Promise<ChatConversation> {
  const response = await api.post<ApiResponse<ChatConversation>>(
    `/api/v1/store/${slug}/chat/conversation/`,
    {
      visitor_id: visitorId,
    },
  )

  return response.data
}

export async function getChatConversation(
  slug: string,
  visitorId: string,
): Promise<ChatConversation | null> {
  const response = await api.get<ApiResponse<ChatConversation | null>>(
    `/api/v1/store/${slug}/chat/conversation/?visitor_id=${encodeURIComponent(visitorId)}`,
  )

  return response.data
}

export async function getChatMessages(
  slug: string,
  conversationId: string,
  visitorId: string,
): Promise<ChatMessage[]> {
  const response = await api.get<ApiResponse<ChatMessage[]>>(
    `/api/v1/store/${slug}/chat/conversation/${conversationId}/messages/?visitor_id=${encodeURIComponent(visitorId)}`,
  )

  return response.data
}

export async function getBusinessChatConversations(
  businessId: string,
): Promise<ChatConversation[]> {
  const response = await api.get<ApiResponse<ChatConversation[]>>(
    `/api/v1/businesses/${businessId}/chat/conversations/`,
  )

  return response.data
}

export async function getBusinessChatConversation(
  businessId: string,
  conversationId: string,
): Promise<ChatConversation> {
  const response = await api.get<ApiResponse<ChatConversation>>(
    `/api/v1/businesses/${businessId}/chat/conversations/${conversationId}/`,
  )

  return response.data
}