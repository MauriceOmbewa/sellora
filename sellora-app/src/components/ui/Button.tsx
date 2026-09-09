import React from 'react'
import { Loader2 } from 'lucide-react'

type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger' | 'gold'
type ButtonSize = 'sm' | 'md' | 'lg'

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant
  size?: ButtonSize
  loading?: boolean
  icon?: React.ReactNode
  iconRight?: React.ReactNode
  fullWidth?: boolean
  children?: React.ReactNode
}

const variantClasses: Record<ButtonVariant, string> = {
  primary:
    'bg-ink text-ivory border-ink hover:bg-ink-soft active:bg-ink-soft',
  secondary:
    'bg-ivory text-ink border-sand hover:border-ink hover:bg-white',
  outline:
    'bg-transparent text-ink border-sand hover:border-ink hover:bg-ivory',
  ghost:
    'bg-transparent text-ink border-transparent hover:bg-sand/60',
  danger:
    'bg-red text-white border-red hover:bg-red/90 active:bg-red/80',
  gold:
    'bg-gold text-ink border-gold hover:bg-gold-deep active:bg-gold-deep',
}

const sizeClasses: Record<ButtonSize, string> = {
  sm: 'px-3 py-1.5 text-[13px] gap-1.5 rounded-[7px]',
  md: 'px-4 py-2.5 text-[14px] gap-2 rounded-[8px]',
  lg: 'px-6 py-3.5 text-[15px] gap-2.5 rounded-[9px]',
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      variant = 'primary',
      size = 'md',
      loading = false,
      icon,
      iconRight,
      fullWidth = false,
      children,
      className = '',
      disabled,
      ...props
    },
    ref
  ) => {
    const isDisabled = disabled || loading

    return (
      <button
        ref={ref}
        disabled={isDisabled}
        className={[
          'inline-flex items-center justify-center font-semibold border',
          'transition-all duration-150 cursor-pointer select-none',
          'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold',
          'disabled:opacity-50 disabled:cursor-not-allowed',
          variantClasses[variant],
          sizeClasses[size],
          fullWidth ? 'w-full' : '',
          className,
        ]
          .filter(Boolean)
          .join(' ')}
        {...props}
      >
        {loading ? (
          <Loader2 size={size === 'sm' ? 13 : 15} className="animate-spin shrink-0" />
        ) : icon ? (
          <span className="shrink-0">{icon}</span>
        ) : null}
        {children}
        {!loading && iconRight && <span className="shrink-0 ml-auto">{iconRight}</span>}
      </button>
    )
  }
)

Button.displayName = 'Button'
