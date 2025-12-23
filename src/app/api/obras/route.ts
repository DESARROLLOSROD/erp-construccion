import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import {
  withRole,
  handleApiError,
  successResponse,
  createdResponse,
  getPaginationParams,
  createPaginatedResponse,
  verifyResourceOwnership,
} from '@/lib/api-utils'
import { obraQuerySchema, obraCreateSchema, validateSchema } from '@/lib/validations'

export async function GET(request: NextRequest) {
  return withRole(['ADMIN', 'OBRAS', 'VENTAS', 'USUARIO'], async (req, context) => {
    try {
      const { searchParams } = new URL(req.url)

      // Validar parámetros de query
      const query = validateSchema(obraQuerySchema, {
        estado: searchParams.get('estado'),
        clienteId: searchParams.get('clienteId'),
        page: searchParams.get('page') || '1',
        limit: searchParams.get('limit') || '20',
      })

      const { skip, take } = getPaginationParams(query.page as number, query.limit as number)

      // Construir filtros
      const where: any = {
        empresaId: context.empresaId,
      }

      if (query.estado) {
        where.estado = query.estado
      }

      if (query.clienteId) {
        // Verificar que el cliente pertenezca a la empresa
        const isOwner = await verifyResourceOwnership(
          query.clienteId,
          context.empresaId,
          'cliente'
        )
        if (!isOwner) {
          return NextResponse.json(
            { error: 'Cliente no encontrado o no pertenece a tu empresa' },
            { status: 404 }
          )
        }
        where.clienteId = query.clienteId
      }

      // Obtener obras con paginación
      const [obras, total] = await Promise.all([
        prisma.obra.findMany({
          where,
          include: {
            cliente: {
              select: {
                id: true,
                rfc: true,
                razonSocial: true,
                nombreComercial: true,
              }
            },
            _count: {
              select: {
                presupuestos: true,
                estimaciones: true,
                contratos: true,
              }
            }
          },
          orderBy: { updatedAt: 'desc' },
          skip,
          take,
        }),
        prisma.obra.count({ where })
      ])

      const response = createPaginatedResponse(obras, total, query.page as number, query.limit as number)
      return successResponse(response)
    } catch (error) {
      return handleApiError(error)
    }
  })(request, {} as any)
}

export async function POST(request: NextRequest) {
  return withRole(['ADMIN', 'OBRAS'], async (req, context) => {
    try {
      const body = await req.json()

      // Validar datos con Zod
      const validatedData = validateSchema(obraCreateSchema, body)

      // Validar duplicados de código
      const existing = await prisma.obra.findFirst({
        where: {
          empresaId: context.empresaId,
          codigo: validatedData.codigo,
        }
      })

      if (existing) {
        return NextResponse.json(
          { error: 'Ya existe una obra con este código' },
          { status: 409 }
        )
      }

      // Validar que el cliente pertenezca a la misma empresa
      if (validatedData.clienteId) {
        const isOwner = await verifyResourceOwnership(
          validatedData.clienteId,
          context.empresaId,
          'cliente'
        )
        if (!isOwner) {
          return NextResponse.json(
            { error: 'Cliente no encontrado o no pertenece a tu empresa' },
            { status: 404 }
          )
        }
      }

      // Crear obra
      const obra = await prisma.obra.create({
        data: {
          empresaId: context.empresaId,
          codigo: validatedData.codigo.toUpperCase(),
          nombre: validatedData.nombre,
          descripcion: validatedData.descripcion,
          ubicacion: validatedData.ubicacion,
          estado: validatedData.estado,
          tipoContrato: validatedData.tipoContrato,
          fechaInicio: validatedData.fechaInicio ? new Date(validatedData.fechaInicio) : null,
          fechaFinProgramada: validatedData.fechaFinProgramada ? new Date(validatedData.fechaFinProgramada) : null,
          fechaFinReal: validatedData.fechaFinReal ? new Date(validatedData.fechaFinReal) : null,
          montoContrato: validatedData.montoContrato,
          anticipoPct: validatedData.anticipoPct,
          retencionPct: validatedData.retencionPct,
          clienteId: validatedData.clienteId || null,
        },
        include: {
          cliente: {
            select: {
              id: true,
              rfc: true,
              razonSocial: true,
              nombreComercial: true,
            }
          }
        }
      })

      return createdResponse(obra)
    } catch (error) {
      return handleApiError(error)
    }
  })(request, {} as any)
}
