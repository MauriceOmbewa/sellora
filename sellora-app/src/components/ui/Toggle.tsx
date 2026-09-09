import React from 'react'

interface ToggleProps {
  checked: boolean
  onChange: (checked: boolean) => void
  label?: string
  helpText?: string
  disabled?: boolean
  size?: 'sm' | 'md'
}

export function Toggle({ checked, onChange, label, helpText, disabled = false, size = 'md' }: ToggleProps) {
  const trackSize = size === 'sm' ? 'w-8 h-4' : 'w-10 h-5'
  const thumbSize = size === 'sm' ? 'w-3 h-3' : 'w-3.5 h-3.5'
  const thumbTranslate = size === 'sm'
    ? (checked ? 'translate-x-4' : 'translate-x-0.5')
    : (checked ? 'translate-x-5' : 'translate-x-0.5')

  return (
    <label className={['flex items-start gap-3', disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'].join(' ')}>
      <div className="relative shrink-0 mt-0.5">
        <input
          type="checkbox"
          checked={checked}
          onChange={e => onChange(e.target.checked)}
          disabled={disabled}
          className="sr-only"
        />
        <div
          className={[
            trackSize,
            'rounded-full transition-colors duration-200',
            checked ? 'bg-ink' : 'bg-sand-dark',
          ].join(' ')}
        />
        <div
          className={[
            thumbSize,
            'absolute top-0.5 rounded-full bg-white shadow-sm',
            'transition-transform duration-200',
            thumbTranslate,
          ].join(' ')}
        />
      </div>
      {(label || helpText) && (
        <div className="flex-1">
          {label && <p className="text-[14px] font-medium text-ink">{label}</p>}
          {helpText && <p className="text-[12.5px] text-slate mt-0.5">{helpText}</p>}
        </div>
      )}
    </label>
  )
}
