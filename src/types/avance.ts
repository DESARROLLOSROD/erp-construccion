// Tipos para el módulo de Avance de Obra

export interface AvanceConcepto {
  conceptoPresupuestoId: string
  clave: string
  descripcion: string
  unidad: string | null
  cantidadPresupuesto: number
  precioUnitario: number
  importePresupuesto: number
  cantidadEjecutada: number
  importeEjecutado: number
  cantidadPendiente: number
  importePendiente: number
  porcentajeAvance: number
}

export interface ResumenAvance {
  presupuestoId: string
  presupuestoNombre: string
  presupuestoVersion: number
  conceptos: AvanceConcepto[]
  totales: {
    importePresupuesto: number
    importeEjecutado: number
    importePendiente: number
    porcentajeAvanceGeneral: number
  }
}

export interface ActualizarAvanceInput {
  conceptoPresupuestoId: string
  cantidadEjecutada: number
}
