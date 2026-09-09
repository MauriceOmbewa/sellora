import React from 'react'

interface CardProps {
  children: React.ReactNode
  className?: string
  padding?: 'none' | 'sm' | 'md' | 'lg'
  hover?: boolean
  as?: React.ElementType
  onClick?: () => void
}

const paddingClasses = {
  none: '',
  sm: 'p-4',
  md: 'p-5',
  lg: 'p-6',
}

export function Card({
  children,
  className = '',
  padding = 'md',
  hover = false,
  as: Tag = 'div',
  onClick,
}: CardProps) {
  return (
    <Tag
      onClick={onClick}
      className={[
        'bg-white border border-sand rounded-[14px]',
        paddingClasses[padding],
        hover ? 'transition-all duration-150 hover:border-ink/20 hover:-translate-y-px cursor-pointer' : '',
        onClick ? 'cursor-pointer' : '',
        className,
      ]
        .filter(Boolean)
        .join(' ')}
    >
      {children}
    </Tag>
  )
}

interface CardHeaderProps {
  title: string
  subtitle?: string
  action?: React.ReactNode
  className?: string
}

export function CardHeader({ title, subtitle, action, className = '' }: CardHeaderProps) {
  return (
    <div className={['flex items-start justify-between gap-4 mb-5', className].join(' ')}>
      <div>
        <h3 className="font-serif text-[17px] font-medium text-ink">{title}</h3>
        {subtitle && <p className="text-[13px] text-slate mt-0.5">{subtitle}</p>}
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  )
}
