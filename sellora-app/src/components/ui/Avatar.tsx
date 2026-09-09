import React from 'react'

interface AvatarProps {
  name: string
  image?: string
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl'
  className?: string
  color?: string
}

const sizeClasses = {
  xs: 'w-6 h-6 text-[10px]',
  sm: 'w-8 h-8 text-[11px]',
  md: 'w-9 h-9 text-[12px]',
  lg: 'w-11 h-11 text-[14px]',
  xl: 'w-14 h-14 text-[17px]',
}

function getInitials(name: string): string {
  return name
    .split(' ')
    .slice(0, 2)
    .map(n => n[0])
    .join('')
    .toUpperCase()
}

const bgColors = [
  'bg-gold-light text-gold-deep',
  'bg-green-light text-green',
  'bg-blue-light text-blue',
  'bg-sand text-ink',
  'bg-red-light text-red',
]

function getColorIndex(name: string): number {
  let hash = 0
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash)
  return Math.abs(hash) % bgColors.length
}

export function Avatar({ name, image, size = 'md', className = '', color }: AvatarProps) {
  const colorClass = color ?? bgColors[getColorIndex(name)]

  return (
    <div
      className={[
        'rounded-full flex items-center justify-center font-semibold font-serif shrink-0 overflow-hidden',
        sizeClasses[size],
        !image ? colorClass : '',
        className,
      ].join(' ')}
      aria-label={name}
    >
      {image ? (
        <img src={image} alt={name} className="w-full h-full object-cover" />
      ) : (
        getInitials(name)
      )}
    </div>
  )
}
