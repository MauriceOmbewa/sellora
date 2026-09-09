import React from 'react'
import { Button } from './Button'

interface EmptyStateProps {
  icon?: React.ReactNode
  title: string
  description?: string
  action?: {
    label: string
    onClick: () => void
  }
  secondaryAction?: {
    label: string
    onClick: () => void
  }
  className?: string
}

export function EmptyState({
  icon,
  title,
  description,
  action,
  secondaryAction,
  className = '',
}: EmptyStateProps) {
  return (
    <div
      className={[
        'flex flex-col items-center justify-center text-center py-16 px-6',
        className,
      ].join(' ')}
    >
      {icon && (
        <div className="w-14 h-14 rounded-[14px] bg-ivory border border-sand flex items-center justify-center text-slate mb-4">
          {icon}
        </div>
      )}
      <h3 className="font-serif text-[18px] font-medium text-ink mb-2">{title}</h3>
      {description && (
        <p className="text-[14px] text-slate max-w-xs leading-relaxed mb-6">{description}</p>
      )}
      {!description && action && <div className="mb-6" />}
      <div className="flex gap-3 flex-wrap justify-center">
        {action && (
          <Button variant="primary" onClick={action.onClick}>
            {action.label}
          </Button>
        )}
        {secondaryAction && (
          <Button variant="outline" onClick={secondaryAction.onClick}>
            {secondaryAction.label}
          </Button>
        )}
      </div>
    </div>
  )
}
