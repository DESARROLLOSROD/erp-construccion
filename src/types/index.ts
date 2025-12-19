// Tipos generados desde Prisma se importan así:
// import { Empresa, Usuario, Obra } from '@prisma/client'

// Tipos auxiliares para el frontend

export type ActionResult<T = void> = {
  success: boolean
  data?: T
  error?: string
}

export type PaginatedResult<T> = {
  items: T[]
  total: number
  page: number
  pageSize: number
  totalPages: number
}

export type SelectOption = {
  value: string
  label: string
}

// Estado de formularios
export type FormState = 'idle' | 'loading' | 'success' | 'error'

// Filtros comunes
export type DateRange = {
  from: Date
  to: Date
}

export type SortDirection = 'asc' | 'desc'

export type SortConfig = {
  field: string
  direction: SortDirection
}

// Sesión del usuario
export type UserSession = {
  usuario: {
    id: string
    email: string
    nombre: string
    apellidos: string | null
  }
  empresa: {
    id: string
    nombre: string
    rfc: string
  } | null
  rol: 'ADMIN' | 'CONTADOR' | 'VENTAS' | 'COMPRAS' | 'OBRAS' | 'USUARIO'
}

// Estadísticas del dashboard
export type DashboardStats = {
  obrasActivas: number
  obrasTerminadas: number
  montoContratado: number
  montoPorCobrar: number
  clientesActivos: number
  proveedoresActivos: number
}

// Estados de obra para UI
export const ESTADO_OBRA_LABELS: Record<string, string> = {
  COTIZACION: 'Cotización',
  CONTRATADA: 'Contratada',
  EN_PROCESO: 'En proceso',
  SUSPENDIDA: 'Suspendida',
  TERMINADA: 'Terminada',
  CANCELADA: 'Cancelada',
}

export const ESTADO_OBRA_COLORS: Record<string, string> = {
  COTIZACION: 'bg-gray-100 text-gray-800',
  CONTRATADA: 'bg-blue-100 text-blue-800',
  EN_PROCESO: 'bg-green-100 text-green-800',
  SUSPENDIDA: 'bg-yellow-100 text-yellow-800',
  TERMINADA: 'bg-purple-100 text-purple-800',
  CANCELADA: 'bg-red-100 text-red-800',
}

// Tipos de contrato para UI
export const TIPO_CONTRATO_LABELS: Record<string, string> = {
  PRECIO_ALZADO: 'Precio alzado',
  PRECIOS_UNITARIOS: 'Precios unitarios',
  ADMINISTRACION: 'Administración',
  MIXTO: 'Mixto',
}

// Roles para UI
export const ROL_LABELS: Record<string, string> = {
  ADMIN: 'Administrador',
  CONTADOR: 'Contador',
  VENTAS: 'Ventas',
  COMPRAS: 'Compras',
  OBRAS: 'Obras',
  USUARIO: 'Usuario',
}
