import React from 'react'
import { Search, X } from 'lucide-react'

interface SearchInputProps {
  value: string
  onChange: (value: string) => void
  placeholder?: string
  className?: string
}

export function SearchInput({ value, onChange, placeholder = 'Search...', className = '' }: SearchInputProps) {
  return (
    <div className={['relative', className].join(' ')}>
      <Search
        size={15}
        className="absolute left-3 top-1/2 -translate-y-1/2 text-slate pointer-events-none"
      />
      <input
        type="search"
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        className={[
          'w-full bg-white border border-sand rounded-[9px] text-[13.5px] text-ink placeholder:text-slate/70',
          'pl-9 pr-8 py-2.5',
          'focus:outline-none focus:ring-2 focus:ring-gold/30 focus:border-gold',
          'hover:border-sand-dark transition-colors',
        ].join(' ')}
      />
      {value && (
        <button
          onClick={() => onChange('')}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-slate hover:text-ink"
          aria-label="Clear search"
        >
          <X size={13} />
        </button>
      )}
    </div>
  )
}
