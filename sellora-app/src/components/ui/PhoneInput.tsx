import React, { useEffect, useMemo, useRef, useState } from 'react'
import { Check, ChevronDown, Search } from 'lucide-react'

export interface Country {
  code: string
  name: string
  dialCode: string
  flag: string
}

export interface PhoneInputProps {
  label?: string
  value: string
  onChange: (value: string) => void
  onNormalizedChange?: (value: string) => void
  error?: string
  disabled?: boolean
  placeholder?: string
  defaultCountry?: string
  required?: boolean
}

/*
 * Country list.
 *
 * You can expand this list to include every country supported by Sellora.
 */
const countries: Country[] = [
  { code: 'KE', name: 'Kenya', dialCode: '+254', flag: '🇰🇪' },
  { code: 'UG', name: 'Uganda', dialCode: '+256', flag: '🇺🇬' },
  { code: 'TZ', name: 'Tanzania', dialCode: '+255', flag: '🇹🇿' },
  { code: 'RW', name: 'Rwanda', dialCode: '+250', flag: '🇷🇼' },
  { code: 'BI', name: 'Burundi', dialCode: '+257', flag: '🇧🇮' },
  { code: 'SS', name: 'South Sudan', dialCode: '+211', flag: '🇸🇸' },
  { code: 'ET', name: 'Ethiopia', dialCode: '+251', flag: '🇪🇹' },
  { code: 'SO', name: 'Somalia', dialCode: '+252', flag: '🇸🇴' },
  { code: 'ZA', name: 'South Africa', dialCode: '+27', flag: '🇿🇦' },
  { code: 'NG', name: 'Nigeria', dialCode: '+234', flag: '🇳🇬' },
  { code: 'GH', name: 'Ghana', dialCode: '+233', flag: '🇬🇭' },
  { code: 'EG', name: 'Egypt', dialCode: '+20', flag: '🇪🇬' },
  { code: 'IN', name: 'India', dialCode: '+91', flag: '🇮🇳' },
  { code: 'CN', name: 'China', dialCode: '+86', flag: '🇨🇳' },
  { code: 'JP', name: 'Japan', dialCode: '+81', flag: '🇯🇵' },
  { code: 'AE', name: 'United Arab Emirates', dialCode: '+971', flag: '🇦🇪' },
  { code: 'SA', name: 'Saudi Arabia', dialCode: '+966', flag: '🇸🇦' },
  { code: 'GB', name: 'United Kingdom', dialCode: '+44', flag: '🇬🇧' },
  { code: 'US', name: 'United States', dialCode: '+1', flag: '🇺🇸' },
  { code: 'CA', name: 'Canada', dialCode: '+1', flag: '🇨🇦' },
  { code: 'AU', name: 'Australia', dialCode: '+61', flag: '🇦🇺' },
  { code: 'DE', name: 'Germany', dialCode: '+49', flag: '🇩🇪' },
  { code: 'FR', name: 'France', dialCode: '+33', flag: '🇫🇷' },
  { code: 'IT', name: 'Italy', dialCode: '+39', flag: '🇮🇹' },
  { code: 'ES', name: 'Spain', dialCode: '+34', flag: '🇪🇸' },
  { code: 'NL', name: 'Netherlands', dialCode: '+31', flag: '🇳🇱' },
  { code: 'BR', name: 'Brazil', dialCode: '+55', flag: '🇧🇷' },
  { code: 'MX', name: 'Mexico', dialCode: '+52', flag: '🇲🇽' },
]

const getDialCodeDigits = (dialCode: string) =>
  dialCode.replace(/\D/g, '')

/*
 * Converts what the user pasted/typed into the local number
 * that should be displayed in the input.
 *
 * Examples:
 *
 * +254712345678 -> 712345678
 * 254712345678  -> 712345678
 * 0712345678    -> 0712345678
 * 712345678     -> 712345678
 */
const cleanInputForCountry = (
  input: string,
  country: Country
): string => {
  let digits = input.replace(/\D/g, '')

  const countryCode = getDialCodeDigits(country.dialCode)

  /*
   * If the user pasted an international number,
   * remove the country code.
   */
  if (
    digits.startsWith(countryCode) &&
    digits.length > countryCode.length
  ) {
    digits = digits.slice(countryCode.length)

    /*
     * If the international number contains an extra
     * leading zero after the country code, remove it.
     *
     * Example:
     *
     * 2540712345678 -> 712345678
     *
     * This is intentionally generic and applies to
     * every selected country.
     */
    if (digits.startsWith('0')) {
      digits = digits.slice(1)
    }
  }

  return digits
}

/*
 * Converts the local number into the format expected
 * by the backend/M-PESA.
 *
 * Examples:
 *
 * 0712345678 -> 254712345678
 * 712345678  -> 254712345678
 * 123456789  -> 254123456789
 */
export const normalizePhone = (
  value: string,
  country: Country
): string => {
  let digits = value.replace(/\D/g, '')

  const countryCode = getDialCodeDigits(country.dialCode)

  /*
   * Remove the country code if it was supplied
   * as part of the value.
   */
  if (
    digits.startsWith(countryCode) &&
    digits.length > countryCode.length
  ) {
    digits = digits.slice(countryCode.length)
  }

  /*
   * Convert local numbers beginning with 0
   * into international format.
   *
   * Example:
   *
   * 0712345678
   *      ↓
   * 712345678
   */
  if (digits.startsWith('0')) {
    digits = digits.slice(1)
  }

  return `${countryCode}${digits}`
}

/*
 * Validate the local number.
 *
 * Rules for EVERY country:
 *
 * Starts with 0:
 *   exactly 10 digits
 *
 * Starts with 1-9:
 *   exactly 9 digits
 */
export const validatePhone = (
  value: string,
  country: Country
): string => {
  const digits = value.replace(/\D/g, '')

  if (!digits) {
    return 'Phone number is required'
  }

  /*
   * Number starts with 0:
   * must contain exactly 10 digits.
   */
  if (digits.startsWith('0')) {
    if (digits.length !== 10) {
      return 'Enter a valid 10-digit phone number'
    }

    return ''
  }

  /*
   * Number starts with 1-9:
   * must contain exactly 9 digits.
   */
  if (digits.length !== 9) {
    return 'Enter a valid 9-digit phone number'
  }

  return ''
}

export default function PhoneInput({
  label,
  value,
  onChange,
  onNormalizedChange,
  error,
  disabled = false,
  placeholder = '712 345 678',
  defaultCountry = 'KE',
  required = false,
}: PhoneInputProps) {
  const [selectedCountry, setSelectedCountry] = useState<Country>(
    () =>
      countries.find(country => country.code === defaultCountry) ??
      countries[0]
  )

  const [open, setOpen] = useState(false)
  const [search, setSearch] = useState('')

  const containerRef = useRef<HTMLDivElement>(null)

  /*
   * Close dropdown when clicking outside.
   */
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [])

  /*
   * Notify parent about the normalized number.
   */
  useEffect(() => {
    if (onNormalizedChange) {
      onNormalizedChange(
        normalizePhone(value, selectedCountry)
      )
    }
  }, [value, selectedCountry, onNormalizedChange])

  /*
   * Filter countries based on search.
   */
  const filteredCountries = useMemo(() => {
    const query = search.toLowerCase().trim()

    if (!query) {
      return countries
    }

    return countries.filter(country =>
      country.name.toLowerCase().includes(query) ||
      country.dialCode.includes(query) ||
      country.code.toLowerCase().includes(query)
    )
  }, [search])

  /*
   * Country selection.
   *
   * IMPORTANT:
   * We deliberately do NOT modify the phone number here.
   *
   * Example:
   *
   * Kenya +254 | 712345678
   *
   * change country to:
   *
   * Uganda +256 | 712345678
   *
   * The number stays 712345678.
   *
   * Only normalization changes:
   *
   * Kenya  -> 254712345678
   * Uganda -> 256712345678
   */
  const handleCountryChange = (country: Country) => {
    setSelectedCountry(country)
    setOpen(false)
    setSearch('')
  }

  /*
   * Handle phone number typing.
   *
   * Rules for EVERY country:
   *
   * - Only digits are accepted.
   * - Starts with 0 -> maximum 10 digits.
   * - Starts with 1-9 -> maximum 9 digits.
   */
  const handleInputChange = (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    let digits = event.target.value.replace(/\D/g, '')

    /*
     * Remove an international country code if pasted.
     */
    digits = cleanInputForCountry(
      digits,
      selectedCountry
    )

    /*
     * Apply the same length rule to EVERY country.
     *
     * 0XXXXXXXXX -> 10 digits
     * 1XXXXXXXX  -> 9 digits
     * 2XXXXXXXX  -> 9 digits
     * ...
     * 9XXXXXXXX  -> 9 digits
     */
    if (digits.startsWith('0')) {
      digits = digits.slice(0, 10)
    } else if (digits.length > 0) {
      digits = digits.slice(0, 9)
    }

    onChange(digits)
  }

  return (
    <div
      ref={containerRef}
      className="w-full"
    >
      {label && (
        <label className="block text-[13px] font-medium text-ink mb-1.5">
          {label}
          {required && !label.includes('*') ? ' *' : ''}
        </label>
      )}

      <div className="relative">
        {/*
         * Main phone input row.
         *
         * Same height/border/radius as the normal Input component.
         */}
        <div
          className={[
            'flex w-full h-11 rounded-[10px] border bg-white overflow-visible transition-all',
            error
              ? 'border-red-400 focus-within:border-red-500'
              : 'border-sand focus-within:border-ink',
            disabled
              ? 'bg-slate-50 opacity-60 cursor-not-allowed'
              : '',
          ].join(' ')}
        >
          {/* Country selector */}
          <button
            type="button"
            disabled={disabled}
            onClick={() => setOpen(prev => !prev)}
            className={[
              'h-full shrink-0 flex items-center gap-2 px-3',
              'border-r border-sand',
              'text-[13px] text-ink',
              'hover:bg-ivory/60 transition-colors',
              'rounded-l-[10px]',
              'focus:outline-none',
              disabled ? 'cursor-not-allowed' : 'cursor-pointer',
            ].join(' ')}
          >
            <span className="text-[19px] leading-none">
              {selectedCountry.flag}
            </span>

            <span className="hidden sm:inline whitespace-nowrap">
              {selectedCountry.name}
            </span>

            <span className="text-slate whitespace-nowrap">
              {selectedCountry.dialCode}
            </span>

            <ChevronDown
              size={15}
              className={[
                'text-slate transition-transform',
                open ? 'rotate-180' : '',
              ].join(' ')}
            />
          </button>

          {/* Phone number input */}
          <input
            type="tel"
            inputMode="numeric"
            autoComplete="tel-national"
            disabled={disabled}
            value={value}
            onChange={handleInputChange}
            placeholder={placeholder}
            className={[
              'flex-1 min-w-0 h-full px-3',
              'bg-transparent',
              'text-[13.5px] text-ink',
              'placeholder:text-slate/60',
              'outline-none',
              'rounded-r-[10px]',
              disabled ? 'cursor-not-allowed' : '',
            ].join(' ')}
          />
        </div>

        {/*
         * Country dropdown.
         *
         * max-h prevents it from covering the entire screen.
         * overflow-y-auto makes the country list scrollable.
         */}
        {open && !disabled && (
          <div
            className="
              absolute
              left-0
              top-[calc(100%+6px)]
              z-50
              w-full
              min-w-[280px]
              max-w-[360px]
              bg-white
              border
              border-sand
              rounded-[12px]
              shadow-lg
              overflow-hidden
            "
          >
            {/* Search */}
            <div className="p-2 border-b border-sand bg-white">
              <div className="relative">
                <Search
                  size={15}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-slate"
                />

                <input
                  type="text"
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  placeholder="Search country..."
                  autoFocus
                  className="
                    w-full
                    h-9
                    pl-9
                    pr-3
                    rounded-[8px]
                    border
                    border-sand
                    bg-ivory/40
                    text-[13px]
                    text-ink
                    placeholder:text-slate/60
                    outline-none
                    focus:border-ink
                  "
                />
              </div>
            </div>

            {/* Scrollable country list */}
            <div className="max-h-[280px] overflow-y-auto overscroll-contain py-1">
              {filteredCountries.length > 0 ? (
                filteredCountries.map(country => {
                  const selected =
                    country.code === selectedCountry.code

                  return (
                    <button
                      key={country.code}
                      type="button"
                      onClick={() => handleCountryChange(country)}
                      className={[
                        'w-full flex items-center gap-3',
                        'px-3 py-2.5',
                        'text-left',
                        'text-[13px]',
                        'transition-colors',
                        selected
                          ? 'bg-ivory'
                          : 'hover:bg-ivory/60',
                      ].join(' ')}
                    >
                      <span className="text-[20px] leading-none shrink-0">
                        {country.flag}
                      </span>

                      <span className="flex-1 text-ink">
                        {country.name}
                      </span>

                      <span className="text-slate text-[12.5px]">
                        {country.dialCode}
                      </span>

                      {selected && (
                        <Check
                          size={15}
                          className="text-ink shrink-0"
                        />
                      )}
                    </button>
                  )
                })
              ) : (
                <div className="px-4 py-6 text-center text-[13px] text-slate">
                  No countries found
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {error && (
        <p className="mt-1.5 text-[12px] text-red-500">
          {error}
        </p>
      )}
    </div>
  )
}