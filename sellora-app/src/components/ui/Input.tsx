import React from 'react'

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string
  helpText?: string
  error?: string
  icon?: React.ReactNode
  iconRight?: React.ReactNode
  fullWidth?: boolean
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ label, helpText, error, icon, iconRight, fullWidth = true, className = '', id, ...props }, ref) => {
    const inputId = id ?? label?.toLowerCase().replace(/\s+/g, '-')

    return (
      <div className={fullWidth ? 'w-full' : ''}>
        {label && (
          <label htmlFor={inputId} className="block text-[13px] font-semibold text-ink mb-1.5">
            {label}
          </label>
        )}
        <div className="relative">
          {icon && (
            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate pointer-events-none">
              {icon}
            </div>
          )}
          <input
            ref={ref}
            id={inputId}
            className={[
              'w-full bg-white border rounded-[8px] text-[14px] text-ink placeholder:text-slate/70',
              'px-3.5 py-2.5 transition-all duration-150',
              'focus:outline-none focus:ring-2 focus:ring-gold/30 focus:border-gold',
              error ? 'border-red focus:ring-red/20 focus:border-red' : 'border-sand hover:border-sand-dark',
              icon ? 'pl-9' : '',
              iconRight ? 'pr-9' : '',
              'disabled:bg-ivory disabled:cursor-not-allowed disabled:opacity-70',
              className,
            ]
              .filter(Boolean)
              .join(' ')}
            {...props}
          />
          {iconRight && (
            <div className="absolute right-3 top-1/2 -translate-y-1/2 text-slate">
              {iconRight}
            </div>
          )}
        </div>
        {error && <p className="mt-1.5 text-[12px] text-red font-medium">{error}</p>}
        {helpText && !error && <p className="mt-1.5 text-[12px] text-slate">{helpText}</p>}
      </div>
    )
  }
)

Input.displayName = 'Input'

// Textarea
interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string
  helpText?: string
  error?: string
  fullWidth?: boolean
}

export const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ label, helpText, error, fullWidth = true, className = '', id, ...props }, ref) => {
    const inputId = id ?? label?.toLowerCase().replace(/\s+/g, '-')

    return (
      <div className={fullWidth ? 'w-full' : ''}>
        {label && (
          <label htmlFor={inputId} className="block text-[13px] font-semibold text-ink mb-1.5">
            {label}
          </label>
        )}
        <textarea
          ref={ref}
          id={inputId}
          className={[
            'w-full bg-white border rounded-[8px] text-[14px] text-ink placeholder:text-slate/70',
            'px-3.5 py-2.5 transition-all duration-150 resize-none',
            'focus:outline-none focus:ring-2 focus:ring-gold/30 focus:border-gold',
            error ? 'border-red focus:ring-red/20 focus:border-red' : 'border-sand hover:border-sand-dark',
            'disabled:bg-ivory disabled:cursor-not-allowed',
            className,
          ]
            .filter(Boolean)
            .join(' ')}
          {...props}
        />
        {error && <p className="mt-1.5 text-[12px] text-red font-medium">{error}</p>}
        {helpText && !error && <p className="mt-1.5 text-[12px] text-slate">{helpText}</p>}
      </div>
    )
  }
)

Textarea.displayName = 'Textarea'

// Select
interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string
  helpText?: string
  error?: string
  fullWidth?: boolean
  options: { value: string; label: string }[]
  placeholder?: string
}

export const Select = React.forwardRef<HTMLSelectElement, SelectProps>(
  ({ label, helpText, error, fullWidth = true, options, placeholder, className = '', id, ...props }, ref) => {
    const inputId = id ?? label?.toLowerCase().replace(/\s+/g, '-')

    return (
      <div className={fullWidth ? 'w-full' : ''}>
        {label && (
          <label htmlFor={inputId} className="block text-[13px] font-semibold text-ink mb-1.5">
            {label}
          </label>
        )}
        <select
          ref={ref}
          id={inputId}
          className={[
            'w-full bg-white border rounded-[8px] text-[14px] text-ink',
            'px-3.5 py-2.5 transition-all duration-150 appearance-none',
            'focus:outline-none focus:ring-2 focus:ring-gold/30 focus:border-gold',
            error ? 'border-red' : 'border-sand hover:border-sand-dark',
            'disabled:bg-ivory disabled:cursor-not-allowed',
            className,
          ]
            .filter(Boolean)
            .join(' ')}
          {...props}
        >
          {placeholder && <option value="">{placeholder}</option>}
          {options.map(opt => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
        {error && <p className="mt-1.5 text-[12px] text-red font-medium">{error}</p>}
        {helpText && !error && <p className="mt-1.5 text-[12px] text-slate">{helpText}</p>}
      </div>
    )
  }
)

Select.displayName = 'Select'
