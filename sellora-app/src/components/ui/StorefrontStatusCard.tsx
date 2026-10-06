/**
 * StorefrontStatusCard
 *
 * Reusable card shown on both the Overview and Storefront management pages.
 *
 * Live state   — green dot, full URL, Copy link, Share buttons
 * Offline state — grey dot, explanation of what "offline" means,
 *                 optional CTA to go publish (or call a publish handler)
 *
 * Props:
 *   slug         – business slug used to build the URL
 *   name         – business name used in share text
 *   isPublished  – drives which state is rendered
 *   isLoading    – show skeleton while settings load
 *   onPublish    – if provided, show "Go live" button calling this handler
 *   publishHref  – if provided, "Go live" is a link (navigate to storefront page)
 *   publishing   – spinner on the publish button
 */

import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Globe, Copy, Share2, Check, ExternalLink,
  EyeOff, ArrowRight,
} from 'lucide-react'
import { Skeleton } from '@/components/ui/Skeleton'

const SAAS_DOMAIN = import.meta.env.VITE_SAAS_DOMAIN ?? ''

export function buildStorefrontUrl(slug: string): string {
  if (SAAS_DOMAIN) return `https://${slug}.${SAAS_DOMAIN}`
  return `${window.location.origin}/store/${slug}`
}

interface Props {
  slug:         string
  name:         string
  isPublished:  boolean
  isLoading?:   boolean
  /** Inline publish handler (used from StorefrontMgmtPage) */
  onPublish?:   () => void
  /** Navigation target for the publish CTA (used from OverviewPage) */
  publishHref?: string
  publishing?:  boolean
}

export function StorefrontStatusCard({
  slug,
  name,
  isPublished,
  isLoading  = false,
  onPublish,
  publishHref,
  publishing = false,
}: Props) {
  const navigate                = useNavigate()
  const url                     = buildStorefrontUrl(slug)
  const [copied, setCopied]     = useState(false)
  const [canShare]              = useState(() => typeof navigator.share === 'function')

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(url)
    } catch {
      const el = document.createElement('textarea')
      el.value = url
      document.body.appendChild(el)
      el.select()
      document.execCommand('copy')
      document.body.removeChild(el)
    }
    setCopied(true)
    setTimeout(() => setCopied(false), 2200)
  }

  const handleShare = async () => {
    if (canShare) {
      try {
        await navigator.share({ title: `${name} — Sellora Store`, text: `Shop at ${name} on Sellora`, url })
        return
      } catch { /* cancelled */ }
    }
    await handleCopy()
  }

  const handlePublishCta = () => {
    if (onPublish) { onPublish(); return }
    if (publishHref) navigate(publishHref)
  }

  // ── Skeleton ────────────────────────────────────────────────────────────────
  if (isLoading) {
    return (
      <div className="bg-white border border-sand rounded-[14px] p-5 space-y-3">
        <Skeleton className="h-4 w-32 rounded" />
        <Skeleton className="h-9 rounded-[10px]" />
        <div className="flex gap-2">
          <Skeleton className="flex-1 h-10 rounded-[9px]" />
          <Skeleton className="flex-1 h-10 rounded-[9px]" />
        </div>
      </div>
    )
  }

  // ── Live state ──────────────────────────────────────────────────────────────
  if (isPublished) {
    return (
      <div className="bg-white border border-sand rounded-[14px] p-5 space-y-3">
        {/* Header */}
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-green animate-pulse shrink-0" />
          <h3 className="font-serif text-[17px] font-medium text-ink">Your store is live</h3>
        </div>

        {/* URL row */}
        <div className="flex items-center gap-2 bg-ivory border border-sand rounded-[10px] px-3 py-2.5">
          <Globe size={13} className="text-slate shrink-0" />
          <span className="text-[13px] text-ink font-medium truncate flex-1 select-all">{url}</span>
          <a
            href={url}
            target="_blank"
            rel="noreferrer"
            className="text-slate hover:text-ink transition-colors shrink-0"
            aria-label="Open store in new tab"
          >
            <ExternalLink size={13} />
          </a>
        </div>

        {/* Action buttons */}
        <div className="flex gap-2">
          <button
            onClick={handleCopy}
            className={[
              'flex-1 flex items-center justify-center gap-2 py-2.5 rounded-[9px]',
              'text-[13px] font-semibold border transition-all',
              copied
                ? 'bg-green-light border-green/30 text-green'
                : 'bg-white border-sand text-ink hover:border-ink',
            ].join(' ')}
            aria-label="Copy store URL"
          >
            {copied ? <Check size={13} /> : <Copy size={13} />}
            {copied ? 'Copied!' : 'Copy link'}
          </button>

          <button
            onClick={handleShare}
            className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-ink text-ivory rounded-[9px] text-[13px] font-semibold hover:bg-ink-soft transition-colors"
            aria-label="Share store"
          >
            <Share2 size={13} />
            {canShare ? 'Share' : 'Copy & share'}
          </button>
        </div>
      </div>
    )
  }

  // ── Offline state ───────────────────────────────────────────────────────────
  return (
    <div className="bg-white border border-sand rounded-[14px] p-5 space-y-3">
      {/* Header */}
      <div className="flex items-center gap-2">
        <span className="w-2 h-2 rounded-full bg-slate shrink-0" />
        <h3 className="font-serif text-[17px] font-medium text-ink">Your store is offline</h3>
      </div>

      {/* Explanation */}
      <div className="bg-sand/60 border border-sand rounded-[10px] px-4 py-3 space-y-1.5">
        <div className="flex items-start gap-2.5">
          <EyeOff size={14} className="text-slate mt-0.5 shrink-0" />
          <div>
            <p className="text-[13px] font-semibold text-ink">Not visible to customers</p>
            <p className="text-[12.5px] text-slate leading-relaxed mt-0.5">
              While offline, your storefront cannot be visited. Customers who follow your store link
              will see a "store not available" message. Orders cannot be placed.
            </p>
          </div>
        </div>
      </div>

      {/* Publish CTA */}
      {(onPublish || publishHref) && (
        <button
          onClick={handlePublishCta}
          disabled={publishing}
          className={[
            'w-full flex items-center justify-center gap-2 py-3 rounded-[9px]',
            'text-[13.5px] font-semibold bg-gold text-ink hover:bg-gold-deep transition-colors',
            publishing ? 'opacity-60 cursor-not-allowed' : '',
          ].join(' ')}
        >
          {publishing ? (
            <span className="w-4 h-4 border-2 border-ink/20 border-t-ink rounded-full animate-spin" />
          ) : (
            <ArrowRight size={14} />
          )}
          {publishing ? 'Publishing…' : 'Make store live'}
        </button>
      )}
    </div>
  )
}
