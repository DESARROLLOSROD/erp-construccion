export interface Estimacion {
  id: string
  obraId: string
  presupuestoId: string
  numero: number
  periodo: string
  fechaInicio: Date
  fechaFin: Date
  descripcion?: string | null
  estado: EstadoEstimacion
  createdAt: Date
  updatedAt: Date

  // Relaciones opcionales
  obra?: {
    id: string
    codigo: string
    nombre: string
  }
  presupuesto?: {
    id: string
    version: number
    nombre: string
  }
  conceptos?: ConceptoEstimacion[]
}

export enum EstadoEstimacion {
  BORRADOR = 'BORRADOR',
  PENDIENTE = 'PENDIENTE',
  APROBADA = 'APROBADA',
  FACTURADA = 'FACTURADA',
  CANCELADA = 'CANCELADA'
}

export interface ConceptoEstimacion {
  id: string
  estimacionId: string
  conceptoPresupuestoId: string
  cantidadEjecutada: number
  cantidadAcumulada: number
  importe: number
  createdAt: Date
  updatedAt: Date

  // Relaciones opcionales
  conceptoPresupuesto?: {
    id: string
    clave: string
    descripcion: string
    cantidad: number
    precioUnitario: number
    unidad?: {
      id: string
      nombre: string
      abreviatura: string
    } | null
  }
}

export interface CreateEstimacionInput {
  obraId: string
  presupuestoId: string
  numero?: number
  periodo: string
  fechaInicio: Date | string
  fechaFin: Date | string
  descripcion?: string
  estado?: EstadoEstimacion
}

export interface UpdateEstimacionInput extends Partial<CreateEstimacionInput> {
  estado?: EstadoEstimacion
}

export interface CreateConceptoEstimacionInput {
  conceptoPresupuestoId: string
  cantidadEjecutada: number
}

export interface UpdateConceptoEstimacionInput {
  cantidadEjecutada?: number
}

export interface EstimacionConTotales extends Estimacion {
  totalConceptos: number
  importeTotal: number
  importeSubtotal: number
  importeIVA: number
  importeRetencion: number
  importeNeto: number
  conceptos?: ConceptoEstimacion[]
}

// Para el resumen de avance de obra
export interface AvanceObra {
  presupuestoId: string
  conceptoPresupuestoId: string
  clave: string
  descripcion: string
  cantidadPresupuesto: number
  cantidadAcumulada: number
  cantidadPendiente: number
  porcentajeAvance: number
  importePresupuesto: number
  importeEjecutado: number
  importePendiente: number
}
