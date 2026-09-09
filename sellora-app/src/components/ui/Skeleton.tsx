import React from 'react'

interface SkeletonProps {
  className?: string
  width?: string | number
  height?: string | number
  rounded?: boolean
}

export function Skeleton({ className = '', width, height, rounded = false }: SkeletonProps) {
  return (
    <div
      className={[
        'skeleton',
        rounded ? 'rounded-full' : 'rounded-[8px]',
        className,
      ].join(' ')}
      style={{ width, height }}
      aria-hidden="true"
    />
  )
}

export function SkeletonText({ lines = 3, className = '' }: { lines?: number; className?: string }) {
  return (
    <div className={['space-y-2', className].join(' ')} aria-hidden="true">
      {Array.from({ length: lines }).map((_, i) => (
        <Skeleton
          key={i}
          height={14}
          className={i === lines - 1 ? 'w-3/5' : 'w-full'}
        />
      ))}
    </div>
  )
}

export function SkeletonCard({ className = '' }: { className?: string }) {
  return (
    <div className={['bg-white border border-sand rounded-[14px] p-5', className].join(' ')} aria-hidden="true">
      <div className="flex items-start gap-3 mb-4">
        <Skeleton width={40} height={40} className="rounded-[10px] shrink-0" />
        <div className="flex-1 space-y-2">
          <Skeleton height={14} className="w-2/3" />
          <Skeleton height={12} className="w-1/2" />
        </div>
      </div>
      <SkeletonText lines={3} />
    </div>
  )
}
