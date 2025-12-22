export interface Presupuesto {
  id: string
  obraId: string
  version: number
  nombre: string
  descripcion?: string | null
  esVigente: boolean
  createdAt: Date
  updatedAt: Date

  // Relaciones opcionales
  obra?: {
    id: string
    codigo: string
    nombre: string
  }
  conceptos?: ConceptoPresupuesto[]
}

export interface ConceptoPresupuesto {
  id: string
  presupuestoId: string
  clave: string
  descripcion: string
  unidadId?: string | null
  cantidad: number
  precioUnitario: number
  importe: number
  createdAt: Date
  updatedAt: Date

  // Relaciones opcionales
  unidad?: {
    id: string
    nombre: string
    abreviatura: string
  } | null
}

export interface CreatePresupuestoInput {
  obraId: string
  version?: number
  nombre: string
  descripcion?: string
  esVigente?: boolean
}

export interface UpdatePresupuestoInput extends Partial<CreatePresupuestoInput> {}

export interface CreateConceptoInput {
  presupuestoId: string
  clave: string
  descripcion: string
  unidadId?: string
  cantidad: number
  precioUnitario: number
}

export interface UpdateConceptoInput extends Partial<Omit<CreateConceptoInput, 'presupuestoId'>> {}

export interface PresupuestoConTotales extends Presupuesto {
  totalConceptos: number
  importeTotal: number
  conceptos?: ConceptoPresupuesto[]
}
