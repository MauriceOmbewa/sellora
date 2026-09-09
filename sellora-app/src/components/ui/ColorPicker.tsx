import { useState } from 'react'

interface ColorPickerProps {
  value: string
  onChange: (color: string) => void
  label?: string
  presets?: string[]
}

const defaultPresets = [
  '#171B21', '#C79A3D', '#3F6B4F', '#2563EB',
  '#7C3AED', '#DC2626', '#EA580C', '#0891B2',
  '#BE185D', '#047857', '#92400E', '#1E40AF',
]

export function ColorPicker({ value, onChange, label, presets = defaultPresets }: ColorPickerProps) {
  const [inputVal, setInputVal] = useState(value)

  const handleInput = (v: string) => {
    setInputVal(v)
    if (/^#[0-9A-Fa-f]{6}$/.test(v)) onChange(v)
  }

  return (
    <div>
      {label && <label className="block text-[13px] font-semibold text-ink mb-1.5">{label}</label>}
      <div className="flex items-center gap-3 mb-3">
        <div
          className="w-10 h-10 rounded-[9px] border border-sand shadow-sm shrink-0 cursor-pointer relative overflow-hidden"
          style={{ background: value }}
        >
          <input
            type="color"
            value={value}
            onChange={e => { onChange(e.target.value); setInputVal(e.target.value) }}
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
            aria-label="Pick color"
          />
        </div>
        <input
          type="text"
          value={inputVal}
          onChange={e => handleInput(e.target.value)}
          onBlur={() => setInputVal(value)}
          className="w-full bg-white border border-sand rounded-[8px] px-3 py-2 text-[13.5px] font-mono text-ink focus:outline-none focus:ring-2 focus:ring-gold/30 focus:border-gold"
          placeholder="#000000"
          aria-label="Color hex value"
        />
      </div>
      <div className="flex flex-wrap gap-2">
        {presets.map(preset => (
          <button
            key={preset}
            onClick={() => { onChange(preset); setInputVal(preset) }}
            className={[
              'w-6 h-6 rounded-full border-2 transition-all',
              value.toLowerCase() === preset.toLowerCase()
                ? 'border-ink scale-110'
                : 'border-transparent hover:scale-110',
            ].join(' ')}
            style={{ background: preset }}
            aria-label={preset}
            title={preset}
          />
        ))}
      </div>
    </div>
  )
}
