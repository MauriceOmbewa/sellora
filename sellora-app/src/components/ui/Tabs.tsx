import React from 'react'

interface Tab {
  id: string
  label: string
  icon?: React.ReactNode
  badge?: string | number
}

interface TabsProps {
  tabs: Tab[]
  activeTab: string
  onChange: (id: string) => void
  variant?: 'pill' | 'underline' | 'bordered'
  className?: string
}

export function Tabs({ tabs, activeTab, onChange, variant = 'pill', className = '' }: TabsProps) {
  if (variant === 'underline') {
    return (
      <div className={['flex gap-0 border-b border-sand', className].join(' ')}>
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => onChange(tab.id)}
            className={[
              'flex items-center gap-2 px-4 py-3 text-[14px] font-medium border-b-2 -mb-px transition-colors',
              activeTab === tab.id
                ? 'border-ink text-ink'
                : 'border-transparent text-slate hover:text-ink hover:border-sand-dark',
            ].join(' ')}
          >
            {tab.icon}
            {tab.label}
            {tab.badge != null && (
              <span className={[
                'text-[11px] font-semibold px-1.5 py-0.5 rounded-full',
                activeTab === tab.id ? 'bg-ink text-ivory' : 'bg-sand text-slate',
              ].join(' ')}>
                {tab.badge}
              </span>
            )}
          </button>
        ))}
      </div>
    )
  }

  if (variant === 'bordered') {
    return (
      <div className={['flex gap-2', className].join(' ')}>
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => onChange(tab.id)}
            className={[
              'flex items-center gap-2 px-4 py-2 text-[13.5px] font-semibold rounded-[8px] border transition-colors',
              activeTab === tab.id
                ? 'bg-ink text-ivory border-ink'
                : 'bg-white text-slate border-sand hover:border-ink hover:text-ink',
            ].join(' ')}
          >
            {tab.icon}
            {tab.label}
          </button>
        ))}
      </div>
    )
  }

  // pill (default)
  return (
    <div className={['inline-flex bg-ivory border border-sand rounded-[9px] p-1 gap-1', className].join(' ')}>
      {tabs.map(tab => (
        <button
          key={tab.id}
          onClick={() => onChange(tab.id)}
          className={[
            'flex items-center gap-1.5 px-3 py-1.5 text-[13px] font-semibold rounded-[7px] transition-all',
            activeTab === tab.id
              ? 'bg-white text-ink shadow-sm'
              : 'text-slate hover:text-ink',
          ].join(' ')}
        >
          {tab.icon}
          {tab.label}
          {tab.badge != null && (
            <span className="text-[10px] font-bold bg-red text-white px-1.5 py-0.5 rounded-full">
              {tab.badge}
            </span>
          )}
        </button>
      ))}
    </div>
  )
}
