import { EstadoObra, TipoContrato } from '@prisma/client'

export interface Obra {
  id: string
  empresaId: string
  codigo: string
  nombre: string
  descripcion?: string | null
  ubicacion?: string | null
  estado: EstadoObra
  tipoContrato: TipoContrato

  // Fechas
  fechaInicio?: Date | null
  fechaFinProgramada?: Date | null
  fechaFinReal?: Date | null

  // Montos
  montoContrato: number
  anticipoPct: number
  retencionPct: number

  // Cliente
  clienteId?: string | null

  createdAt: Date
  updatedAt: Date

  // Relaciones opcionales
  cliente?: {
    id: string
    rfc: string
    razonSocial: string
    nombreComercial?: string | null
  } | null
}

export interface CreateObraInput {
  codigo: string
  nombre: string
  descripcion?: string
  ubicacion?: string
  estado?: EstadoObra
  tipoContrato?: TipoContrato
  fechaInicio?: Date | string
  fechaFinProgramada?: Date | string
  montoContrato?: number
  anticipoPct?: number
  retencionPct?: number
  clienteId?: string
}

export interface UpdateObraInput extends Partial<CreateObraInput> {
  fechaFinReal?: Date | string
}

// Estadísticas de obra
export interface ObraStats {
  totalObras: number
  obrasPorEstado: {
    estado: EstadoObra
    count: number
  }[]
  montoContratadoTotal: number
  montoEnProceso: number
}

// Vista resumida para listas
export interface ObraListItem extends Omit<Obra, 'cliente'> {
  cliente?: {
    id: string
    rfc: string
    razonSocial: string
    nombreComercial?: string | null
  } | null
  _count?: {
    presupuestos: number
    estimaciones: number
    contratos: number
  }
}
