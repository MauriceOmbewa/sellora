/**
 * ProductImageUploader
 *
 * Multi-image upload panel for the product edit form.
 *
 * Features:
 *  - Up to MAX_PRODUCT_IMAGES (8) images per product
 *  - Per-file async validation: MIME type, 5 MB size, aspect ratio 1:2–2:1
 *  - Individual upload progress per slot (uploading spinner overlay)
 *  - Drag-to-reorder via HTML5 drag-and-drop
 *  - First image is the primary (shown with a "Main" pill)
 *  - Clear inline error messages per rejected file
 *  - Accepts multiple files at once from the file picker
 *  - Accessible labels and keyboard removal
 */

import { useRef, useState, useCallback, useId } from 'react'
import { Upload, X, GripVertical, AlertCircle, ImageIcon, Loader2 } from 'lucide-react'
import {
  validateImageAsync,
  uploadService,
  MAX_PRODUCT_IMAGES,
  MAX_FILE_MB,
} from '@/services/uploadService'

// ── Types ─────────────────────────────────────────────────────────────────────

interface ImageSlot {
  /** Stable local key — never changes even when reordered */
  key: string
  /** Committed URL (from the backend) — null while uploading */
  url: string | null
  uploading: boolean
  error: string | null
  /** Local object URL used for preview before the real URL arrives */
  previewUrl: string | null
}

interface Props {
  /** Current committed image URLs (from form state) */
  images: string[]
  /** Called whenever the committed URL list changes */
  onChange: (images: string[]) => void
  /** Folder hint passed to the upload API */
  folder?: 'products' | 'logos' | 'hero' | 'uploads'
  disabled?: boolean
}

// ── Helpers ───────────────────────────────────────────────────────────────────

let keyCounter = 0
function nextKey() { return `img-${++keyCounter}` }

function urlsToSlots(urls: string[]): ImageSlot[] {
  return urls.map(url => ({
    key:        nextKey(),
    url,
    uploading:  false,
    error:      null,
    previewUrl: null,
  }))
}

// ── Component ─────────────────────────────────────────────────────────────────

export function ProductImageUploader({
  images,
  onChange,
  folder = 'products',
  disabled = false,
}: Props) {
  const inputId    = useId()
  const fileRef    = useRef<HTMLInputElement>(null)
  const dragKey    = useRef<string | null>(null)
  const overKey    = useRef<string | null>(null)

  // Internal slot state — includes uploading + error per slot
  const [slots, setSlots] = useState<ImageSlot[]>(() => urlsToSlots(images))
  // Per-file rejection messages (files that failed validation before upload)
  const [rejections, setRejections] = useState<string[]>([])

  // Sync committed URLs upward whenever slots with real URLs change
  const commitUrls = useCallback((nextSlots: ImageSlot[]) => {
    const committed = nextSlots
      .filter(s => s.url !== null && !s.uploading)
      .map(s => s.url!)
    onChange(committed)
    return nextSlots
  }, [onChange])

  // ── File selection ─────────────────────────────────────────────────────────

  const handleFiles = useCallback(async (files: FileList | File[]) => {
    const arr = Array.from(files)
    const newRejections: string[] = []

    setSlots(prev => {
      const available = MAX_PRODUCT_IMAGES - prev.filter(s => !s.error).length
      if (available <= 0) {
        newRejections.push(
          `You've reached the ${MAX_PRODUCT_IMAGES}-image limit. Remove an image to add more.`,
        )
        return prev
      }
      return prev
    })

    // Validate all files first (async), build accepted list
    const accepted: { file: File; key: string; previewUrl: string }[] = []

    for (const file of arr) {
      const error = await validateImageAsync(file)
      if (error) {
        newRejections.push(`"${file.name}": ${error}`)
        continue
      }
      accepted.push({
        file,
        key:        nextKey(),
        previewUrl: URL.createObjectURL(file),
      })
    }

    if (newRejections.length) setRejections(newRejections)

    if (!accepted.length) return

    // Add placeholder slots immediately so the grid updates
    setSlots(prev => {
      const available = MAX_PRODUCT_IMAGES - prev.filter(s => !s.error).length
      const toAdd = accepted.slice(0, available)
      const placeholders: ImageSlot[] = toAdd.map(a => ({
        key:        a.key,
        url:        null,
        uploading:  true,
        error:      null,
        previewUrl: a.previewUrl,
      }))
      return [...prev, ...placeholders]
    })

    // Upload each accepted file and update its slot
    for (const { file, key, previewUrl } of accepted) {
      try {
        const url = await uploadService.uploadImage(file, folder)
        URL.revokeObjectURL(previewUrl)
        setSlots(prev => {
          const next = prev.map(s =>
            s.key === key ? { ...s, url, uploading: false, previewUrl: null } : s,
          )
          return commitUrls(next) as ImageSlot[]
        })
      } catch (err: unknown) {
        URL.revokeObjectURL(previewUrl)
        const msg = err instanceof Error ? err.message : 'Upload failed'
        setSlots(prev =>
          prev.map(s =>
            s.key === key
              ? { ...s, uploading: false, error: msg, previewUrl: null }
              : s,
          ),
        )
      }
    }

    // Reset file input so the same file can be re-selected after an error
    if (fileRef.current) fileRef.current.value = ''
  }, [folder, commitUrls])

  // ── Remove ─────────────────────────────────────────────────────────────────

  const removeSlot = useCallback((key: string) => {
    setSlots(prev => {
      const slot = prev.find(s => s.key === key)
      if (slot?.previewUrl) URL.revokeObjectURL(slot.previewUrl)
      const next = prev.filter(s => s.key !== key)
      return commitUrls(next) as ImageSlot[]
    })
  }, [commitUrls])

  // ── Drag-to-reorder ────────────────────────────────────────────────────────

  const onDragStart = (key: string) => { dragKey.current = key }

  const onDragOver = (e: React.DragEvent, key: string) => {
    e.preventDefault()
    overKey.current = key
  }

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault()
    const from = dragKey.current
    const to   = overKey.current
    if (!from || !to || from === to) return
    setSlots(prev => {
      const fromIdx = prev.findIndex(s => s.key === from)
      const toIdx   = prev.findIndex(s => s.key === to)
      if (fromIdx === -1 || toIdx === -1) return prev
      const next = [...prev]
      const [item] = next.splice(fromIdx, 1)
      next.splice(toIdx, 0, item)
      return commitUrls(next) as ImageSlot[]
    })
    dragKey.current  = null
    overKey.current  = null
  }

  // ── Render ─────────────────────────────────────────────────────────────────

  const activeSlots = slots.filter(s => !s.error)
  const canAdd      = activeSlots.length < MAX_PRODUCT_IMAGES && !disabled

  return (
    <div className="space-y-3">
      {/* Rejection errors */}
      {rejections.length > 0 && (
        <div className="bg-red-light border border-red/20 rounded-[10px] p-3 space-y-1">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <AlertCircle size={14} className="text-red shrink-0" />
              <p className="text-[12.5px] font-semibold text-red">
                {rejections.length === 1 ? '1 file was rejected' : `${rejections.length} files were rejected`}
              </p>
            </div>
            <button
              onClick={() => setRejections([])}
              className="text-red/60 hover:text-red"
              aria-label="Dismiss errors"
            >
              <X size={13} />
            </button>
          </div>
          {rejections.map((r, i) => (
            <p key={i} className="text-[12px] text-red/80 ml-5 leading-snug">{r}</p>
          ))}
        </div>
      )}

      {/* Image grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
        {activeSlots.map((slot, index) => (
          <div
            key={slot.key}
            draggable={!slot.uploading && !disabled}
            onDragStart={() => onDragStart(slot.key)}
            onDragOver={e => onDragOver(e, slot.key)}
            onDrop={onDrop}
            className={[
              'relative aspect-square rounded-[12px] overflow-hidden border bg-ivory group',
              slot.uploading ? 'border-sand' : 'border-sand hover:border-ink/30 cursor-grab active:cursor-grabbing',
            ].join(' ')}
          >
            {/* Image / preview */}
            {(slot.url || slot.previewUrl) && (
              <img
                src={slot.url ?? slot.previewUrl!}
                alt={`Product image ${index + 1}`}
                className={['w-full h-full object-cover transition-opacity', slot.uploading ? 'opacity-40' : ''].join(' ')}
              />
            )}

            {/* Empty placeholder */}
            {!slot.url && !slot.previewUrl && !slot.uploading && (
              <div className="w-full h-full flex items-center justify-center">
                <ImageIcon size={24} className="text-sand-dark" />
              </div>
            )}

            {/* Upload spinner overlay */}
            {slot.uploading && (
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-white/60 gap-2">
                <Loader2 size={20} className="animate-spin text-ink" />
                <span className="text-[11px] font-medium text-ink">Uploading…</span>
              </div>
            )}

            {/* Primary badge */}
            {index === 0 && slot.url && !slot.uploading && (
              <div className="absolute top-1.5 left-1.5 px-2 py-0.5 bg-ink text-ivory text-[9px] font-bold rounded-full">
                Main
              </div>
            )}

            {/* Drag handle hint */}
            {!slot.uploading && !disabled && (
              <div className="absolute top-1.5 right-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                <div className="w-5 h-5 bg-white/90 rounded-full flex items-center justify-center shadow-sm">
                  <GripVertical size={11} className="text-slate" />
                </div>
              </div>
            )}

            {/* Remove button */}
            {!slot.uploading && !disabled && (
              <button
                onClick={() => removeSlot(slot.key)}
                className="absolute bottom-1.5 right-1.5 w-6 h-6 bg-white/90 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow-sm hover:bg-red hover:text-white"
                aria-label={`Remove image ${index + 1}`}
              >
                <X size={11} className="text-red group-hover:text-white" />
              </button>
            )}
          </div>
        ))}

        {/* Add-image button */}
        {canAdd && (
          <label
            htmlFor={inputId}
            className={[
              'aspect-square rounded-[12px] border-2 border-dashed border-sand',
              'flex flex-col items-center justify-center gap-2',
              'cursor-pointer hover:border-ink/40 hover:bg-sand/30 transition-colors',
              activeSlots.some(s => s.uploading) ? 'pointer-events-none opacity-50' : '',
            ].join(' ')}
          >
            <Upload size={18} className="text-slate" />
            <span className="text-[11px] font-medium text-slate text-center leading-tight px-2">
              {activeSlots.length === 0 ? 'Add images' : 'Add more'}
            </span>
            <span className="text-[10px] text-slate/60">
              {activeSlots.length}/{MAX_PRODUCT_IMAGES}
            </span>
          </label>
        )}

        {/* Cap reached indicator */}
        {!canAdd && !disabled && (
          <div className="aspect-square rounded-[12px] border border-sand bg-ivory flex flex-col items-center justify-center gap-1.5 opacity-60">
            <ImageIcon size={18} className="text-slate" />
            <span className="text-[10px] text-slate text-center leading-tight px-2">
              {MAX_PRODUCT_IMAGES} image limit reached
            </span>
          </div>
        )}
      </div>

      {/* Hidden file input — accepts multiple */}
      <input
        id={inputId}
        ref={fileRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/gif"
        multiple
        className="hidden"
        disabled={!canAdd || disabled}
        onChange={e => {
          if (e.target.files?.length) {
            setRejections([])
            handleFiles(e.target.files)
          }
        }}
      />

      {/* Helper text */}
      <p className="text-[12px] text-slate">
        JPEG, PNG, WebP or GIF · max {MAX_FILE_MB} MB per image · up to {MAX_PRODUCT_IMAGES} images ·
        width:height must be between 1:2 and 2:1 · drag images to reorder
      </p>
    </div>
  )
}
