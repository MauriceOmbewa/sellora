/**
 * File upload service — Integration #11
 * POST /api/v1/upload/image/ (requires authentication)
 *
 * The backend processes every upload through Pillow:
 *   - Decodes and validates the image
 *   - Enforces aspect ratio 1:2 – 2:1
 *   - Downscales to ≤ 2000 px on either axis
 *   - Re-encodes as WebP @ quality 85
 *   - Caps raw input at 5 MB and processed output at 2 MB
 *
 * The frontend mirrors the same constraints so users get instant feedback
 * without waiting for a round-trip.
 *
 * Returns: { success: true, data: { url: "https://..." } }
 * folder hint: 'products' | 'logos' | 'hero' | 'uploads'
 */

import { uploadFile } from './api'

export type UploadFolder = 'products' | 'logos' | 'hero' | 'uploads'

interface UploadResponse {
  success: boolean
  data: { url: string }
}

// ── Constraints (must match backend) ─────────────────────────────────────────

/** Maximum raw file size accepted by the backend */
export const MAX_FILE_MB   = 5
export const MAX_FILE_BYTES = MAX_FILE_MB * 1024 * 1024

/** Aspect ratio limits: 1:2 portrait → 2:1 landscape */
export const MIN_ASPECT = 0.5   // 1:2
export const MAX_ASPECT = 2.0   // 2:1

/** Maximum pixel dimension on either axis (backend will downscale above this) */
export const MAX_DIMENSION_PX = 2000

/** Maximum number of images per product */
export const MAX_PRODUCT_IMAGES = 8

const ALLOWED_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif']

// ── Sync validation (type + size only — no async) ────────────────────────────

export interface ValidationResult {
  ok: boolean
  error?: string
}

/**
 * Fast synchronous validation — checks MIME type and raw file size only.
 * Call this first to fail immediately on obviously invalid files.
 */
export function validateFileSync(file: File): ValidationResult {
  if (!ALLOWED_TYPES.includes(file.type)) {
    return { ok: false, error: `Unsupported format. Use JPEG, PNG, WebP, or GIF.` }
  }
  if (file.size > MAX_FILE_BYTES) {
    return {
      ok: false,
      error: `File is too large (${(file.size / 1024 / 1024).toFixed(1)} MB). Maximum is ${MAX_FILE_MB} MB.`,
    }
  }
  return { ok: true }
}

/**
 * Full async validation — also checks image dimensions and aspect ratio.
 * Uses `createImageBitmap` which is supported in all modern browsers.
 * Falls back gracefully if the API is unavailable (e.g. some older Safari).
 *
 * Returns a user-facing error string or null if valid.
 */
export async function validateImageAsync(file: File): Promise<string | null> {
  // Fast checks first
  const sync = validateFileSync(file)
  if (!sync.ok) return sync.error!

  // Dimension + aspect ratio check via createImageBitmap
  if (typeof createImageBitmap === 'function') {
    try {
      const bmp = await createImageBitmap(file)
      const { width: w, height: h } = bmp
      bmp.close()

      const ratio = w / h

      if (ratio < MIN_ASPECT || ratio > MAX_ASPECT) {
        const ratioStr = ratio < 1
          ? `1:${(1 / ratio).toFixed(1)}`
          : `${ratio.toFixed(1)}:1`
        return (
          `Image shape (${w}×${h} px, ratio ${ratioStr}) is too extreme. ` +
          `Use a roughly square or moderate landscape/portrait image ` +
          `(width:height between 1:2 and 2:1).`
        )
      }
    } catch {
      // createImageBitmap failed (corrupt file or unsupported) — let the backend catch it
    }
  }

  return null
}

// ── Upload ────────────────────────────────────────────────────────────────────

export const uploadService = {
  /**
   * Upload a single image and return its CDN URL.
   * Throws ApiError on failure.
   */
  async uploadImage(file: File, folder: UploadFolder = 'uploads'): Promise<string> {
    const formData = new FormData()
    formData.append('file', file)
    formData.append('folder', folder)

    const res = await uploadFile('/api/v1/upload/image/', formData) as UploadResponse
    return res.data.url
  },

  /**
   * Legacy sync validate — kept for backward-compat with any existing callers.
   * Prefer validateImageAsync for new code.
   */
  validate(file: File): string | null {
    const result = validateFileSync(file)
    return result.ok ? null : result.error!
  },
}
