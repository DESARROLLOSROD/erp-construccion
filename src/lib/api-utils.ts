import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase'
import { prisma } from '@/lib/prisma'
import { ValidationError } from '@/lib/validations'
import { Prisma } from '@prisma/client'

// ============================================
// TIPOS
// ============================================

export type ApiHandler<T = any> = (
  req: NextRequest,
  context: ApiContext
) => Promise<NextResponse<T>>

export interface ApiContext {
  empresaId: string
  usuarioId: string
  rol: string
  params?: Record<string, string>
}

export interface PaginationParams {
  page: number
  limit: number
}

export interface PaginatedResponse<T> {
  data: T[]
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
  }
}

// ============================================
// MIDDLEWARE DE AUTENTICACIÓN
// ============================================

/**
 * Obtiene el contexto de autenticación del usuario
 * Valida sesión y pertenencia a empresa
 */
export async function getApiContext(req: NextRequest): Promise<ApiContext | null> {
  try {
    const supabase = createServerClient()
    const { data: { session } } = await supabase.auth.getSession()

    if (!session) {
      return null
    }

    // Buscar usuario y su empresa
    const usuario = await prisma.usuario.findUnique({
      where: { authId: session.user.id },
      include: {
        empresas: {
          where: { activo: true },
          include: { empresa: true }
        }
      }
    })

    if (!usuario || usuario.empresas.length === 0) {
      return null
    }

    // Por ahora usar la primera empresa activa
    const usuarioEmpresa = usuario.empresas[0]

    return {
      empresaId: usuarioEmpresa.empresaId,
      usuarioId: usuario.id,
      rol: usuarioEmpresa.rol,
    }
  } catch (error) {
    console.error('[getApiContext] Error:', error)
    return null
  }
}

/**
 * Middleware que protege rutas API con autenticación
 */
export function withAuth(handler: ApiHandler): ApiHandler {
  return async (req: NextRequest, { params }: any) => {
    const context = await getApiContext(req)

    if (!context) {
      return NextResponse.json(
        { error: 'No autorizado. Sesión inválida o expirada.' },
        { status: 401 }
      )
    }

    // Agregar params al contexto si existen
    if (params) {
      context.params = params
    }

    return handler(req, context)
  }
}

// ============================================
// AUTORIZACIÓN POR ROL
// ============================================

export type RolPermitido = 'ADMIN' | 'CONTADOR' | 'VENTAS' | 'COMPRAS' | 'OBRAS' | 'USUARIO'

/**
 * Verifica si el rol del usuario tiene permiso
 */
export function hasPermission(userRol: string, rolesPermitidos: RolPermitido[]): boolean {
  // ADMIN siempre tiene acceso
  if (userRol === 'ADMIN') return true

  return rolesPermitidos.includes(userRol as RolPermitido)
}

/**
 * Middleware que valida permisos por rol
 */
export function withRole(rolesPermitidos: RolPermitido[], handler: ApiHandler): ApiHandler {
  return withAuth(async (req: NextRequest, context: ApiContext) => {
    if (!hasPermission(context.rol, rolesPermitidos)) {
      return NextResponse.json(
        { error: `Acceso denegado. Requiere uno de estos roles: ${rolesPermitidos.join(', ')}` },
        { status: 403 }
      )
    }

    return handler(req, context)
  })
}

// ============================================
// MANEJO DE ERRORES
// ============================================

/**
 * Maneja errores de API de forma consistente
 */
export function handleApiError(error: unknown): NextResponse {
  console.error('[API Error]', error)

  // Error de validación (Zod)
  if (error instanceof ValidationError) {
    return NextResponse.json(
      {
        error: error.message,
        details: error.errors
      },
      { status: 400 }
    )
  }

  // Error de Prisma - Unique constraint
  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    if (error.code === 'P2002') {
      const field = (error.meta?.target as string[])?.join(', ') || 'campo'
      return NextResponse.json(
        { error: `Ya existe un registro con ese ${field}` },
        { status: 409 }
      )
    }

    if (error.code === 'P2025') {
      return NextResponse.json(
        { error: 'Registro no encontrado' },
        { status: 404 }
      )
    }

    if (error.code === 'P2003') {
      return NextResponse.json(
        { error: 'Referencia inválida. Verifica que los IDs existan.' },
        { status: 400 }
      )
    }
  }

  // Error estándar de JavaScript
  if (error instanceof Error) {
    // No exponer detalles internos en producción
    const message = process.env.NODE_ENV === 'development'
      ? error.message
      : 'Error interno del servidor'

    return NextResponse.json(
      { error: message },
      { status: 500 }
    )
  }

  // Error desconocido
  return NextResponse.json(
    { error: 'Error interno del servidor' },
    { status: 500 }
  )
}

// ============================================
// PAGINACIÓN
// ============================================

/**
 * Calcula skip y take para paginación de Prisma
 */
export function getPaginationParams(page: number, limit: number) {
  const skip = (page - 1) * limit
  const take = limit

  return { skip, take }
}

/**
 * Crea respuesta paginada
 */
export function createPaginatedResponse<T>(
  data: T[],
  total: number,
  page: number,
  limit: number
): PaginatedResponse<T> {
  return {
    data,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit)
    }
  }
}

// ============================================
// CONVERSIÓN DE DATOS
// ============================================

/**
 * Convierte Decimal de Prisma a number para JSON
 */
export function decimalToNumber(value: any): number {
  if (value === null || value === undefined) return 0
  return typeof value === 'object' && 'toNumber' in value
    ? value.toNumber()
    : Number(value)
}

/**
 * Convierte recursivamente todos los Decimal en un objeto a numbers
 */
export function convertDecimalsToNumbers<T>(obj: T): T {
  if (obj === null || obj === undefined) return obj

  if (Array.isArray(obj)) {
    return obj.map(item => convertDecimalsToNumbers(item)) as any
  }

  if (typeof obj === 'object') {
    // Si es un Decimal de Prisma
    if ('toNumber' in obj && typeof (obj as any).toNumber === 'function') {
      return (obj as any).toNumber()
    }

    // Convertir recursivamente propiedades del objeto
    const converted: any = {}
    for (const [key, value] of Object.entries(obj)) {
      converted[key] = convertDecimalsToNumbers(value)
    }
    return converted
  }

  return obj
}

// ============================================
// HELPERS DE RESPUESTA
// ============================================

/**
 * Respuesta exitosa estándar
 */
export function successResponse<T>(data: T, status = 200): NextResponse<T> {
  return NextResponse.json(convertDecimalsToNumbers(data), { status })
}

/**
 * Respuesta de error estándar
 */
export function errorResponse(message: string, status = 400): NextResponse {
  return NextResponse.json({ error: message }, { status })
}

/**
 * Respuesta de creación exitosa
 */
export function createdResponse<T>(data: T): NextResponse<T> {
  return successResponse(data, 201)
}

/**
 * Respuesta de eliminación exitosa
 */
export function deletedResponse(): NextResponse {
  return NextResponse.json({ message: 'Eliminado exitosamente' }, { status: 200 })
}

// ============================================
// VALIDACIÓN DE PERMISOS DE RECURSOS
// ============================================

/**
 * Verifica que un recurso pertenezca a la empresa del usuario
 */
export async function verifyResourceOwnership(
  resourceId: string,
  empresaId: string,
  model: 'obra' | 'cliente' | 'proveedor' | 'producto' | 'presupuesto'
): Promise<boolean> {
  try {
    let count = 0

    switch (model) {
      case 'obra':
        count = await prisma.obra.count({
          where: { id: resourceId, empresaId }
        })
        break
      case 'cliente':
        count = await prisma.cliente.count({
          where: { id: resourceId, empresaId }
        })
        break
      case 'proveedor':
        count = await prisma.proveedor.count({
          where: { id: resourceId, empresaId }
        })
        break
      case 'producto':
        count = await prisma.producto.count({
          where: { id: resourceId, empresaId }
        })
        break
      case 'presupuesto':
        count = await prisma.presupuesto.count({
          where: {
            id: resourceId,
            obra: { empresaId }
          }
        })
        break
    }

    return count > 0
  } catch (error) {
    console.error('[verifyResourceOwnership] Error:', error)
    return false
  }
}
