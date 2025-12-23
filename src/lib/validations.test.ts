import { describe, it, expect } from 'vitest'
import {
  rfcSchema,
  clabeSchema,
  codigoPostalSchema,
  emailSchema,
  telefonoSchema,
  decimalPositiveSchema,
  porcentajeSchema,
  obraCreateSchema,
  clienteCreateSchema,
  validateSchema,
  ValidationError,
} from './validations'

describe('rfcSchema', () => {
  it('should validate correct RFC', () => {
    expect(rfcSchema.parse('VECJ880326XXX')).toBe('VECJ880326XXX')
    expect(rfcSchema.parse('ABC123456XXX')).toBe('ABC123456XXX')
  })

  it('should transform to uppercase', () => {
    expect(rfcSchema.parse('vecj880326xxx')).toBe('VECJ880326XXX')
  })

  it('should reject invalid RFC', () => {
    expect(() => rfcSchema.parse('INVALID')).toThrow()
    expect(() => rfcSchema.parse('ABC')).toThrow()
    expect(() => rfcSchema.parse('12345678901234')).toThrow()
  })

  it('should accept Ñ in RFC', () => {
    expect(rfcSchema.parse('SEÑ123456XXX')).toBe('SEÑ123456XXX')
  })
})

describe('clabeSchema', () => {
  it('should validate correct CLABE', () => {
    expect(clabeSchema.parse('123456789012345678')).toBe('123456789012345678')
  })

  it('should reject invalid CLABE length', () => {
    expect(() => clabeSchema.parse('12345')).toThrow()
    expect(() => clabeSchema.parse('1234567890123456789')).toThrow()
  })

  it('should reject non-numeric CLABE', () => {
    expect(() => clabeSchema.parse('12345678901234567A')).toThrow()
  })

  it('should accept undefined', () => {
    expect(clabeSchema.parse(undefined)).toBeUndefined()
  })
})

describe('codigoPostalSchema', () => {
  it('should validate correct postal code', () => {
    expect(codigoPostalSchema.parse('01000')).toBe('01000')
    expect(codigoPostalSchema.parse('99999')).toBe('99999')
  })

  it('should reject invalid length', () => {
    expect(() => codigoPostalSchema.parse('1234')).toThrow()
    expect(() => codigoPostalSchema.parse('123456')).toThrow()
  })

  it('should reject non-numeric', () => {
    expect(() => codigoPostalSchema.parse('0100A')).toThrow()
  })

  it('should accept undefined', () => {
    expect(codigoPostalSchema.parse(undefined)).toBeUndefined()
  })
})

describe('emailSchema', () => {
  it('should validate correct emails', () => {
    expect(emailSchema.parse('test@example.com')).toBe('test@example.com')
    expect(emailSchema.parse('user.name@domain.co.mx')).toBe('user.name@domain.co.mx')
  })

  it('should transform to lowercase', () => {
    expect(emailSchema.parse('TEST@EXAMPLE.COM')).toBe('test@example.com')
  })

  it('should reject invalid emails', () => {
    expect(() => emailSchema.parse('invalid')).toThrow()
    expect(() => emailSchema.parse('test@')).toThrow()
    expect(() => emailSchema.parse('@example.com')).toThrow()
  })

  it('should accept undefined', () => {
    expect(emailSchema.parse(undefined)).toBeUndefined()
  })
})

describe('telefonoSchema', () => {
  it('should validate correct phone numbers', () => {
    expect(telefonoSchema.parse('5512345678')).toBe('5512345678')
    expect(telefonoSchema.parse('55-1234-5678')).toBe('55-1234-5678')
    expect(telefonoSchema.parse('+52551234567')).toBe('+52551234567')
  })

  it('should reject too short numbers', () => {
    expect(() => telefonoSchema.parse('123')).toThrow()
  })

  it('should reject too long numbers', () => {
    expect(() => telefonoSchema.parse('1234567890123456')).toThrow()
  })

  it('should reject invalid characters', () => {
    expect(() => telefonoSchema.parse('55-1234-ABCD')).toThrow()
  })

  it('should accept undefined', () => {
    expect(telefonoSchema.parse(undefined)).toBeUndefined()
  })
})

describe('decimalPositiveSchema', () => {
  it('should validate positive numbers', () => {
    expect(decimalPositiveSchema.parse(0)).toBe(0)
    expect(decimalPositiveSchema.parse(100)).toBe(100)
    expect(decimalPositiveSchema.parse(0.01)).toBe(0.01)
  })

  it('should reject negative numbers', () => {
    expect(() => decimalPositiveSchema.parse(-1)).toThrow()
    expect(() => decimalPositiveSchema.parse(-0.01)).toThrow()
  })
})

describe('porcentajeSchema', () => {
  it('should validate percentage in range', () => {
    expect(porcentajeSchema.parse(0)).toBe(0)
    expect(porcentajeSchema.parse(50)).toBe(50)
    expect(porcentajeSchema.parse(100)).toBe(100)
  })

  it('should reject out of range', () => {
    expect(() => porcentajeSchema.parse(-1)).toThrow()
    expect(() => porcentajeSchema.parse(101)).toThrow()
  })
})

describe('obraCreateSchema', () => {
  it('should validate valid obra data', () => {
    const validData = {
      codigo: 'OB-001',
      nombre: 'Obra Test',
      montoContrato: 1000000,
      anticipoPct: 30,
      retencionPct: 5,
    }
    expect(() => obraCreateSchema.parse(validData)).not.toThrow()
  })

  it('should apply default values', () => {
    const minData = {
      codigo: 'OB-001',
      nombre: 'Obra Test',
    }
    const result = obraCreateSchema.parse(minData)
    expect(result.estado).toBe('EN_PROCESO')
    expect(result.tipoContrato).toBe('PRECIO_ALZADO')
    expect(result.montoContrato).toBe(0)
    expect(result.anticipoPct).toBe(0)
    expect(result.retencionPct).toBe(0)
  })

  it('should reject missing required fields', () => {
    expect(() => obraCreateSchema.parse({})).toThrow()
    expect(() => obraCreateSchema.parse({ codigo: 'OB-001' })).toThrow()
    expect(() => obraCreateSchema.parse({ nombre: 'Test' })).toThrow()
  })

  it('should reject invalid percentage values', () => {
    const data = {
      codigo: 'OB-001',
      nombre: 'Obra Test',
      anticipoPct: 150, // Invalid
    }
    expect(() => obraCreateSchema.parse(data)).toThrow()
  })
})

describe('clienteCreateSchema', () => {
  it('should validate valid cliente data', () => {
    const validData = {
      rfc: 'VECJ880326XXX',
      razonSocial: 'Test SA de CV',
      codigoPostal: '01000',
    }
    expect(() => clienteCreateSchema.parse(validData)).not.toThrow()
  })

  it('should apply default values', () => {
    const minData = {
      rfc: 'VECJ880326XXX',
      razonSocial: 'Test SA de CV',
    }
    const result = clienteCreateSchema.parse(minData)
    expect(result.usoCfdi).toBe('G03')
    expect(result.pais).toBe('MEX')
  })

  it('should validate RFC format', () => {
    const data = {
      rfc: 'INVALID',
      razonSocial: 'Test SA de CV',
    }
    expect(() => clienteCreateSchema.parse(data)).toThrow()
  })

  it('should transform RFC to uppercase', () => {
    const data = {
      rfc: 'vecj880326xxx',
      razonSocial: 'Test SA de CV',
    }
    const result = clienteCreateSchema.parse(data)
    expect(result.rfc).toBe('VECJ880326XXX')
  })
})

describe('validateSchema', () => {
  it('should return validated data on success', () => {
    const result = validateSchema(rfcSchema, 'VECJ880326XXX')
    expect(result).toBe('VECJ880326XXX')
  })

  it('should throw ValidationError on failure', () => {
    try {
      validateSchema(rfcSchema, 'INVALID')
      expect.fail('Should have thrown ValidationError')
    } catch (error) {
      expect(error).toBeInstanceOf(ValidationError)
      expect((error as ValidationError).errors.length).toBeGreaterThan(0)
      expect((error as ValidationError).errors[0]).toHaveProperty('path')
      expect((error as ValidationError).errors[0]).toHaveProperty('message')
    }
  })

  it('should provide detailed error information', () => {
    try {
      validateSchema(obraCreateSchema, {})
      expect.fail('Should have thrown ValidationError')
    } catch (error) {
      expect(error).toBeInstanceOf(ValidationError)
      expect((error as ValidationError).errors.length).toBeGreaterThan(0)
    }
  })
})
