import React from 'react'

interface PageHeaderProps {
  title: string
  subtitle?: string
  actions?: React.ReactNode
  breadcrumb?: { label: string; href?: string }[]
  className?: string
}

export function PageHeader({ title, subtitle, actions, breadcrumb, className = '' }: PageHeaderProps) {
  return (
    <div className={['flex flex-col gap-1 sm:flex-row sm:items-start sm:justify-between mb-6', className].join(' ')}>
      <div>
        {breadcrumb && breadcrumb.length > 0 && (
          <div className="flex items-center gap-1.5 mb-2">
            {breadcrumb.map((crumb, i) => (
              <React.Fragment key={i}>
                {i > 0 && <span className="text-[12px] text-slate">/</span>}
                {crumb.href ? (
                  <a href={crumb.href} className="text-[12px] text-slate hover:text-ink transition-colors">
                    {crumb.label}
                  </a>
                ) : (
                  <span className="text-[12px] text-slate">{crumb.label}</span>
                )}
              </React.Fragment>
            ))}
          </div>
        )}
        <h1 className="font-serif text-[24px] font-medium text-ink leading-tight">{title}</h1>
        {subtitle && <p className="text-[14px] text-slate mt-1">{subtitle}</p>}
      </div>
      {actions && (
        <div className="flex items-center gap-2.5 shrink-0 mt-3 sm:mt-0">{actions}</div>
      )}
    </div>
  )
}
