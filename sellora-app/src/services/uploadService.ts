/**
 * File upload service — Integration #11
 * POST /api/v1/upload/image/ (requires authentication)
 *
 * Allowed: image/jpeg, image/png, image/webp, image/gif — max 10MB
 * Returns: { success: true, data: { url: "https://..." } }
 *
 * folder hint: 'products' | 'logos' | 'hero' | 'uploads'
 */

import { uploadFile } from './api'

export type UploadFolder = 'products' | 'logos' | 'hero' | 'uploads'

interface UploadResponse {
  success: boolean
  data: { url: string }
}

export const uploadService = {
  /**
   * Upload an image file and return its URL.
   * Throws ApiError on failure (wrong type, too large, auth error).
   */
  async uploadImage(file: File, folder: UploadFolder = 'uploads'): Promise<string> {
    const formData = new FormData()
    formData.append('file', file)
    formData.append('folder', folder)

    const res = await uploadFile('/api/v1/upload/image/', formData) as UploadResponse
    return res.data.url
  },

  /** Validate file locally before uploading (saves a round-trip on obvious errors) */
  validate(file: File): string | null {
    const ALLOWED = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif']
    const MAX_MB   = 10

    if (!ALLOWED.includes(file.type)) {
      return `Unsupported file type. Allowed: JPEG, PNG, WebP, GIF.`
    }
    if (file.size > MAX_MB * 1024 * 1024) {
      return `File is too large. Maximum size is ${MAX_MB}MB.`
    }
    return null
  },
}
