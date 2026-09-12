/**
 * Sellora API client
 *
 * Single Axios-style fetch wrapper that:
 *   - Attaches the Bearer access token from localStorage to every request
 *   - Automatically refreshes the access token on 401 (single-flight, no retry storms)
 *   - Exposes typed helper methods: get, post, patch, put, delete
 *
 * All API calls in service files should use this client — never raw fetch.
 */

const BASE_URL = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:8000'

// ── Token storage ─────────────────────────────────────────────────────────────

const TOKEN_KEY = 'sellora_access'
const REFRESH_KEY = 'sellora_refresh'

export const tokenStorage = {
  getAccess: (): string | null => localStorage.getItem(TOKEN_KEY),
  getRefresh: (): string | null => localStorage.getItem(REFRESH_KEY),
  setTokens: (access: string, refresh: string) => {
    localStorage.setItem(TOKEN_KEY, access)
    localStorage.setItem(REFRESH_KEY, refresh)
  },
  setAccess: (access: string) => localStorage.setItem(TOKEN_KEY, access),
  clear: () => {
    localStorage.removeItem(TOKEN_KEY)
    localStorage.removeItem(REFRESH_KEY)
  },
}

// ── API error ─────────────────────────────────────────────────────────────────

export class ApiError extends Error {
  status: number
  detail: string
  data?: unknown

  constructor(status: number, detail: string, data?: unknown) {
    super(detail)
    this.name = 'ApiError'
    this.status = status
    this.detail = detail
    this.data = data
  }
}

// ── Token refresh (single-flight) ─────────────────────────────────────────────

let refreshPromise: Promise<string> | null = null

async function refreshAccessToken(): Promise<string> {
  if (refreshPromise) return refreshPromise

  refreshPromise = (async () => {
    const refresh = tokenStorage.getRefresh()
    if (!refresh) throw new ApiError(401, 'No refresh token')

    const res = await fetch(`${BASE_URL}/api/v1/auth/token/refresh/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refresh }),
    })

    if (!res.ok) {
      tokenStorage.clear()
      throw new ApiError(401, 'Session expired. Please sign in again.')
    }

    const json = await res.json()
    const newAccess: string = json.access
    tokenStorage.setAccess(newAccess)
    return newAccess
  })()

  try {
    return await refreshPromise
  } finally {
    refreshPromise = null
  }
}

// ── Core request function ─────────────────────────────────────────────────────

interface RequestOptions {
  method?: 'GET' | 'POST' | 'PATCH' | 'PUT' | 'DELETE'
  body?: unknown
  headers?: Record<string, string>
  /** Skip auth header (for public endpoints) */
  public?: boolean
  /** Already retried after token refresh — don't retry again */
  _retried?: boolean
}

async function request<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const { method = 'GET', body, headers: extraHeaders = {}, _retried = false } = options

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...extraHeaders,
  }

  if (!options.public) {
    const token = tokenStorage.getAccess()
    if (token) headers['Authorization'] = `Bearer ${token}`
  }

  const res = await fetch(`${BASE_URL}${path}`, {
    method,
    headers,
    body: body !== undefined ? JSON.stringify(body) : undefined,
  })

  // Auto-refresh on 401 (once)
  if (res.status === 401 && !_retried && !options.public) {
    try {
      const newToken = await refreshAccessToken()
      headers['Authorization'] = `Bearer ${newToken}`
      const retried = await fetch(`${BASE_URL}${path}`, {
        method,
        headers,
        body: body !== undefined ? JSON.stringify(body) : undefined,
      })
      if (!retried.ok) {
        const errData = await retried.json().catch(() => ({}))
        throw new ApiError(retried.status, errData?.detail ?? 'Request failed', errData)
      }
      if (retried.status === 204) return undefined as T
      return retried.json() as Promise<T>
    } catch {
      // Refresh failed — clear tokens so AuthContext picks up unauthenticated state
      tokenStorage.clear()
      throw new ApiError(401, 'Session expired. Please sign in again.')
    }
  }

  if (!res.ok) {
    const errData = await res.json().catch(() => ({}))
    throw new ApiError(
      res.status,
      errData?.detail ?? errData?.message ?? `HTTP ${res.status}`,
      errData,
    )
  }

  if (res.status === 204) return undefined as T
  return res.json() as Promise<T>
}

// ── Multipart form upload (images) ────────────────────────────────────────────

export async function uploadFile(path: string, formData: FormData): Promise<unknown> {
  const token = tokenStorage.getAccess()
  const headers: Record<string, string> = {}
  if (token) headers['Authorization'] = `Bearer ${token}`

  const res = await fetch(`${BASE_URL}${path}`, {
    method: 'POST',
    headers,
    body: formData,
  })

  if (!res.ok) {
    const errData = await res.json().catch(() => ({}))
    throw new ApiError(res.status, errData?.detail ?? 'Upload failed', errData)
  }
  return res.json()
}

// ── Typed helpers ─────────────────────────────────────────────────────────────

export const api = {
  get: <T>(path: string, opts?: Omit<RequestOptions, 'method' | 'body'>) =>
    request<T>(path, { ...opts, method: 'GET' }),

  post: <T>(path: string, body?: unknown, opts?: Omit<RequestOptions, 'method'>) =>
    request<T>(path, { ...opts, method: 'POST', body }),

  patch: <T>(path: string, body?: unknown, opts?: Omit<RequestOptions, 'method'>) =>
    request<T>(path, { ...opts, method: 'PATCH', body }),

  put: <T>(path: string, body?: unknown, opts?: Omit<RequestOptions, 'method'>) =>
    request<T>(path, { ...opts, method: 'PUT', body }),

  delete: <T>(path: string, opts?: Omit<RequestOptions, 'method' | 'body'>) =>
    request<T>(path, { ...opts, method: 'DELETE' }),
}
