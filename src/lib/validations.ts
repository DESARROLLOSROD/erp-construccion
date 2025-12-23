import { z } from 'zod'

// ============================================
// VALIDACIONES COMUNES
// ============================================

export const empresaIdSchema = z.string().cuid()
export const idSchema = z.string().cuid()

// Validación de RFC mexicano
export const rfcSchema = z
  .string()
  .min(12, 'RFC debe tener al menos 12 caracteres')
  .max(13, 'RFC debe tener máximo 13 caracteres')
  .transform(val => val.toUpperCase())
  .pipe(z.string().regex(/^([A-ZÑ&]{3,4})(\d{6})([A-Z\d]{3})$/, 'RFC inválido'))

// Validación de CLABE bancaria
export const clabeSchema = z
  .string()
  .length(18, 'CLABE debe tener 18 dígitos')
  .regex(/^\d{18}$/, 'CLABE debe contener solo números')
  .optional()

// Validación de código postal mexicano
export const codigoPostalSchema = z
  .string()
  .length(5, 'Código postal debe tener 5 dígitos')
  .regex(/^\d{5}$/, 'Código postal inválido')
  .optional()

// Validación de email
export const emailSchema = z
  .string()
  .email('Email inválido')
  .toLowerCase()
  .optional()

// Validación de teléfono mexicano
export const telefonoSchema = z
  .string()
  .min(10, 'Teléfono debe tener al menos 10 dígitos')
  .max(15, 'Teléfono debe tener máximo 15 dígitos')
  .regex(/^[\d\s\-\(\)\+]+$/, 'Teléfono inválido')
  .optional()

// Validación de decimal positivo
export const decimalPositiveSchema = z
  .number()
  .nonnegative('El valor debe ser positivo o cero')

// Validación de porcentaje (0-100)
export const porcentajeSchema = z
  .number()
  .min(0, 'Porcentaje debe ser mínimo 0')
  .max(100, 'Porcentaje debe ser máximo 100')

// ============================================
// OBRAS
// ============================================

export const obraCreateSchema = z.object({
  codigo: z.string().min(1, 'Código es requerido').max(50),
  nombre: z.string().min(1, 'Nombre es requerido').max(200),
  descripcion: z.string().max(1000).optional(),
  ubicacion: z.string().max(500).optional(),
  estado: z.enum(['COTIZACION', 'CONTRATADA', 'EN_PROCESO', 'SUSPENDIDA', 'TERMINADA', 'CANCELADA']).default('EN_PROCESO'),
  tipoContrato: z.enum(['PRECIO_ALZADO', 'PRECIOS_UNITARIOS', 'ADMINISTRACION', 'MIXTO']).default('PRECIO_ALZADO'),
  fechaInicio: z.string().datetime().optional().nullable(),
  fechaFinProgramada: z.string().datetime().optional().nullable(),
  fechaFinReal: z.string().datetime().optional().nullable(),
  montoContrato: decimalPositiveSchema.default(0),
  anticipoPct: porcentajeSchema.default(0),
  retencionPct: porcentajeSchema.default(0),
  clienteId: z.string().cuid().optional().nullable(),
})

export const obraUpdateSchema = obraCreateSchema.partial()

export const obraQuerySchema = z.object({
  estado: z.enum(['COTIZACION', 'CONTRATADA', 'EN_PROCESO', 'SUSPENDIDA', 'TERMINADA', 'CANCELADA']).optional(),
  clienteId: z.string().cuid().optional(),
  page: z.preprocess((val) => val || 1, z.number().int().positive()),
  limit: z.preprocess((val) => val || 20, z.number().int().positive().max(100)),
})

// ============================================
// CLIENTES
// ============================================

export const clienteCreateSchema = z.object({
  codigo: z.string().max(50).optional(),
  rfc: rfcSchema,
  razonSocial: z.string().min(1, 'Razón social es requerida').max(200),
  nombreComercial: z.string().max(200).optional(),
  regimenFiscal: z.string().max(10).optional(),
  usoCfdi: z.string().max(10).default('G03'),
  // Dirección fiscal
  calle: z.string().max(200).optional(),
  numExterior: z.string().max(20).optional(),
  numInterior: z.string().max(20).optional(),
  colonia: z.string().max(100).optional(),
  codigoPostal: codigoPostalSchema,
  municipio: z.string().max(100).optional(),
  estado: z.string().max(100).optional(),
  pais: z.string().max(3).default('MEX'),
  // Contacto
  email: emailSchema,
  telefono: telefonoSchema,
  contacto: z.string().max(200).optional(),
})

export const clienteUpdateSchema = clienteCreateSchema.partial()

export const clienteQuerySchema = z.object({
  activo: z.coerce.boolean().optional(),
  page: z.preprocess((val) => val || 1, z.number().int().positive()),
  limit: z.preprocess((val) => val || 20, z.number().int().positive().max(100)),
})

// ============================================
// PROVEEDORES
// ============================================

export const proveedorCreateSchema = z.object({
  codigo: z.string().max(50).optional(),
  rfc: rfcSchema,
  razonSocial: z.string().min(1, 'Razón social es requerida').max(200),
  nombreComercial: z.string().max(200).optional(),
  // Dirección
  calle: z.string().max(200).optional(),
  numExterior: z.string().max(20).optional(),
  numInterior: z.string().max(20).optional(),
  colonia: z.string().max(100).optional(),
  codigoPostal: codigoPostalSchema,
  municipio: z.string().max(100).optional(),
  estado: z.string().max(100).optional(),
  pais: z.string().max(3).default('MEX'),
  // Contacto
  email: emailSchema,
  telefono: telefonoSchema,
  contacto: z.string().max(200).optional(),
  // Bancario
  banco: z.string().max(100).optional(),
  cuenta: z.string().max(50).optional(),
  clabe: clabeSchema,
})

export const proveedorUpdateSchema = proveedorCreateSchema.partial()

export const proveedorQuerySchema = z.object({
  activo: z.coerce.boolean().optional(),
  page: z.preprocess((val) => val || 1, z.number().int().positive()),
  limit: z.preprocess((val) => val || 20, z.number().int().positive().max(100)),
})

// ============================================
// PRODUCTOS
// ============================================

export const productoCreateSchema = z.object({
  codigo: z.string().min(1, 'Código es requerido').max(50),
  descripcion: z.string().min(1, 'Descripción es requerida').max(500),
  categoriaId: z.string().cuid().optional().nullable(),
  unidadId: z.string().cuid().optional().nullable(),
  claveSat: z.string().max(20).optional(),
  claveUnidadSat: z.string().max(20).optional(),
  precioCompra: decimalPositiveSchema.default(0),
  precioVenta: decimalPositiveSchema.default(0),
  esServicio: z.boolean().default(false),
  controlStock: z.boolean().default(true),
  stockMinimo: decimalPositiveSchema.default(0),
  stockActual: decimalPositiveSchema.default(0),
})

export const productoUpdateSchema = productoCreateSchema.partial()

export const productoQuerySchema = z.object({
  activo: z.coerce.boolean().optional(),
  categoriaId: z.string().cuid().optional(),
  esServicio: z.coerce.boolean().optional(),
  page: z.preprocess((val) => val || 1, z.number().int().positive()),
  limit: z.preprocess((val) => val || 20, z.number().int().positive().max(100)),
})

// ============================================
// PRESUPUESTOS
// ============================================

export const presupuestoCreateSchema = z.object({
  obraId: z.string().cuid(),
  version: z.number().int().positive().default(1),
  nombre: z.string().min(1, 'Nombre es requerido').max(200),
  descripcion: z.string().max(1000).optional(),
  esVigente: z.boolean().default(true),
})

export const presupuestoUpdateSchema = presupuestoCreateSchema.partial().omit({ obraId: true })

export const presupuestoQuerySchema = z.object({
  obraId: z.string().cuid().optional(),
  esVigente: z.coerce.boolean().optional(),
  page: z.preprocess((val) => val || 1, z.number().int().positive()),
  limit: z.preprocess((val) => val || 20, z.number().int().positive().max(100)),
})

// ============================================
// CONCEPTOS PRESUPUESTO
// ============================================

const conceptoPresupuestoBaseSchema = z.object({
  clave: z.string().min(1, 'Clave es requerida').max(50),
  descripcion: z.string().min(1, 'Descripción es requerida').max(500),
  unidadId: z.string().cuid().optional().nullable(),
  cantidad: decimalPositiveSchema,
  precioUnitario: decimalPositiveSchema,
})

export const conceptoPresupuestoCreateSchema = conceptoPresupuestoBaseSchema.refine(
  (data) => data.cantidad > 0,
  { message: 'Cantidad debe ser mayor a cero', path: ['cantidad'] }
)

export const conceptoPresupuestoUpdateSchema = conceptoPresupuestoBaseSchema.partial()

// ============================================
// ESTIMACIONES
// ============================================

const estimacionBaseSchema = z.object({
  obraId: z.string().cuid(),
  numero: z.number().int().positive(),
  periodo: z.string().regex(/^\d{4}-\d{2}$/, 'Período debe tener formato YYYY-MM'),
  fechaCorte: z.string().datetime(),
  estado: z.enum(['BORRADOR', 'ENVIADA', 'APROBADA', 'FACTURADA', 'PAGADA', 'RECHAZADA']).default('BORRADOR'),
  importeBruto: decimalPositiveSchema,
  amortizacion: decimalPositiveSchema.default(0),
  retencion: decimalPositiveSchema.default(0),
  importeNeto: decimalPositiveSchema,
})

export const estimacionCreateSchema = estimacionBaseSchema.refine(
  (data) => data.importeNeto <= data.importeBruto,
  { message: 'Importe neto no puede ser mayor al bruto', path: ['importeNeto'] }
)

export const estimacionUpdateSchema = estimacionBaseSchema.partial().omit({ obraId: true, numero: true })

export const estimacionQuerySchema = z.object({
  obraId: z.string().cuid().optional(),
  estado: z.enum(['BORRADOR', 'ENVIADA', 'APROBADA', 'FACTURADA', 'PAGADA', 'RECHAZADA']).optional(),
  periodo: z.string().regex(/^\d{4}-\d{2}$/).optional(),
  page: z.preprocess((val) => val || 1, z.number().int().positive()),
  limit: z.preprocess((val) => val || 20, z.number().int().positive().max(100)),
})

// ============================================
// CONCEPTOS ESTIMACIÓN
// ============================================

const conceptoEstimacionBaseSchema = z.object({
  estimacionId: z.string().cuid(),
  conceptoPresupuestoId: z.string().cuid(),
  cantidadEjecutada: decimalPositiveSchema,
  cantidadAcumulada: decimalPositiveSchema,
  importe: decimalPositiveSchema,
})

export const conceptoEstimacionCreateSchema = conceptoEstimacionBaseSchema.refine(
  (data) => data.cantidadAcumulada >= data.cantidadEjecutada,
  { message: 'Cantidad acumulada debe ser mayor o igual a ejecutada', path: ['cantidadAcumulada'] }
)

export const conceptoEstimacionUpdateSchema = conceptoEstimacionBaseSchema.partial().omit({ estimacionId: true })

// ============================================
// BÚSQUEDA GLOBAL
// ============================================

export const busquedaQuerySchema = z.object({
  q: z.string().min(1, 'Término de búsqueda es requerido').max(100),
  tipo: z.enum(['obras', 'clientes', 'proveedores', 'productos', 'presupuestos', 'all']).default('all'),
  limit: z.coerce.number().int().positive().max(50).default(10),
})

// ============================================
// UTILIDADES
// ============================================

/**
 * Valida un esquema y retorna los datos validados o lanza un error
 */
export function validateSchema<T>(schema: z.ZodSchema<T>, data: unknown): T {
  const result = schema.safeParse(data)
  if (!result.success) {
    const errors = result.error.errors.map(err => ({
      path: err.path.join('.'),
      message: err.message
    }))
    throw new ValidationError('Error de validación', errors)
  }
  return result.data
}

/**
 * Error personalizado para validaciones
 */
export class ValidationError extends Error {
  constructor(
    message: string,
    public errors: Array<{ path: string; message: string }>
  ) {
    super(message)
    this.name = 'ValidationError'
  }
}
