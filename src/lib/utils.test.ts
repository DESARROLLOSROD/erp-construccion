import { describe, it, expect } from 'vitest'
import {
  formatCurrency,
  formatDate,
  formatDateTime,
  slugify,
  truncate,
  isValidRFC,
  formatRFC,
  calculateProgress,
} from './utils'

describe('formatCurrency', () => {
  it('should format number as Mexican currency', () => {
    expect(formatCurrency(1000)).toBe('$1,000.00')
    expect(formatCurrency(1234.56)).toBe('$1,234.56')
    expect(formatCurrency(0)).toBe('$0.00')
  })

  it('should format string numbers', () => {
    expect(formatCurrency('1000')).toBe('$1,000.00')
    expect(formatCurrency('1234.56')).toBe('$1,234.56')
  })

  it('should handle negative numbers', () => {
    expect(formatCurrency(-1000)).toContain('-')
  })
})

describe('slugify', () => {
  it('should convert text to slug', () => {
    expect(slugify('Hello World')).toBe('hello-world')
    expect(slugify('México DF')).toBe('mexico-df')
    expect(slugify('Año 2024')).toBe('ano-2024')
  })

  it('should remove special characters', () => {
    expect(slugify('Hello@World!')).toBe('hello-world')
    expect(slugify('Test#123')).toBe('test-123')
  })

  it('should handle multiple spaces', () => {
    expect(slugify('Hello   World')).toBe('hello-world')
  })

  it('should remove leading and trailing dashes', () => {
    expect(slugify('-Hello World-')).toBe('hello-world')
  })
})

describe('truncate', () => {
  it('should truncate long text', () => {
    expect(truncate('Hello World', 5)).toBe('Hello...')
    expect(truncate('Test', 10)).toBe('Test')
  })

  it('should handle exact length', () => {
    expect(truncate('Hello', 5)).toBe('Hello')
  })

  it('should handle empty strings', () => {
    expect(truncate('', 5)).toBe('')
  })
})

describe('isValidRFC', () => {
  it('should validate correct RFC for individuals (13 chars)', () => {
    expect(isValidRFC('VECJ880326XXX')).toBe(true)
    expect(isValidRFC('GACJ901215XYZ')).toBe(true)
  })

  it('should validate correct RFC for companies (12 chars)', () => {
    expect(isValidRFC('ABC123456XXX')).toBe(true)
    expect(isValidRFC('XYZ010101AAA')).toBe(true)
  })

  it('should reject invalid RFC', () => {
    expect(isValidRFC('INVALID')).toBe(false)
    expect(isValidRFC('ABC')).toBe(false)
    expect(isValidRFC('12345678901234')).toBe(false)
    expect(isValidRFC('')).toBe(false)
  })

  it('should handle lowercase RFC', () => {
    expect(isValidRFC('vecj880326xxx')).toBe(true)
  })

  it('should accept Ñ in RFC', () => {
    expect(isValidRFC('SEÑ123456XXX')).toBe(true)
  })
})

describe('formatRFC', () => {
  it('should convert RFC to uppercase', () => {
    expect(formatRFC('vecj880326xxx')).toBe('VECJ880326XXX')
  })

  it('should remove spaces', () => {
    expect(formatRFC('VECJ 880326 XXX')).toBe('VECJ880326XXX')
  })

  it('should handle already formatted RFC', () => {
    expect(formatRFC('VECJ880326XXX')).toBe('VECJ880326XXX')
  })
})

describe('calculateProgress', () => {
  it('should calculate percentage correctly', () => {
    expect(calculateProgress(50, 100)).toBe(50)
    expect(calculateProgress(25, 100)).toBe(25)
    expect(calculateProgress(75, 100)).toBe(75)
  })

  it('should handle zero total', () => {
    expect(calculateProgress(50, 0)).toBe(0)
  })

  it('should handle zero current', () => {
    expect(calculateProgress(0, 100)).toBe(0)
  })

  it('should round to nearest integer', () => {
    expect(calculateProgress(33, 100)).toBe(33)
    expect(calculateProgress(66, 100)).toBe(66)
    expect(calculateProgress(1, 3)).toBe(33) // 33.333... rounds to 33
  })

  it('should handle 100% completion', () => {
    expect(calculateProgress(100, 100)).toBe(100)
  })

  it('should handle over 100%', () => {
    expect(calculateProgress(150, 100)).toBe(150)
  })
})
