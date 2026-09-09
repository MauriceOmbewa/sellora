import React from 'react'

type BadgeVariant =
  | 'default'
  | 'success'
  | 'warning'
  | 'danger'
  | 'info'
  | 'gold'
  | 'outline'
  | 'new'
  | 'best-seller'
  | 'sale'
  | 'limited'

interface BadgeProps {
  variant?: BadgeVariant
  children: React.ReactNode
  className?: string
  dot?: boolean
}

const variantClasses: Record<BadgeVariant, string> = {
  default:    'bg-sand text-ink',
  success:    'bg-green-light text-green',
  warning:    'bg-gold-light text-gold-deep',
  danger:     'bg-red-light text-red',
  info:       'bg-blue-light text-blue',
  gold:       'bg-gold text-ink',
  outline:    'bg-transparent border border-sand text-slate',
  'new':      'bg-blue-light text-blue',
  'best-seller': 'bg-gold-light text-gold-deep',
  'sale':     'bg-red-light text-red',
  'limited':  'bg-ink text-ivory',
}

export function Badge({ variant = 'default', children, className = '', dot }: BadgeProps) {
  return (
    <span
      className={[
        'inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-semibold leading-tight whitespace-nowrap',
        variantClasses[variant],
        className,
      ]
        .filter(Boolean)
        .join(' ')}
    >
      {dot && (
        <span
          className={[
            'w-1.5 h-1.5 rounded-full shrink-0',
            variant === 'success' ? 'bg-green' :
            variant === 'warning' || variant === 'gold' || variant === 'best-seller' ? 'bg-gold-deep' :
            variant === 'danger' || variant === 'sale' ? 'bg-red' :
            variant === 'info' || variant === 'new' ? 'bg-blue' :
            'bg-current',
          ].join(' ')}
        />
      )}
      {children}
    </span>
  )
}
