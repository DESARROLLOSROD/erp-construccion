import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import {
  withRole,
  handleApiError,
  successResponse,
  errorResponse,
  verifyResourceOwnership,
} from '@/lib/api-utils'
import { obraUpdateSchema, validateSchema, idSchema } from '@/lib/validations'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  return withRole(['ADMIN', 'OBRAS', 'VENTAS', 'USUARIO'], async (req, context) => {
    try {
      // Validar ID
      const obraId = validateSchema(idSchema, params.id)

      // Verificar propiedad y obtener obra
      const isOwner = await verifyResourceOwnership(obraId, context.empresaId, 'obra')
      if (!isOwner) {
        return errorResponse('Obra no encontrada', 404)
      }

      const obra = await prisma.obra.findUnique({
        where: { id: obraId },
        include: {
          cliente: {
            select: {
              id: true,
              rfc: true,
              razonSocial: true,
              nombreComercial: true,
            }
          },
          presupuestos: {
            where: { esVigente: true },
            select: {
              id: true,
              version: true,
              nombre: true,
            }
          },
          contratos: {
            select: {
              id: true,
              numero: true,
              montoOriginal: true,
              montoActual: true,
            }
          },
          estimaciones: {
            select: {
              id: true,
              numero: true,
              estado: true,
              importeNeto: true,
            },
            orderBy: { numero: 'desc' },
            take: 5
          }
        }
      })

      if (!obra) {
        return errorResponse('Obra no encontrada', 404)
      }

      return successResponse(obra)
    } catch (error) {
      return handleApiError(error)
    }
  })(request, {} as any)
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  return withRole(['ADMIN', 'OBRAS'], async (req, context) => {
    try {
      // Validar ID
      const obraId = validateSchema(idSchema, params.id)

      // Verificar propiedad
      const isOwner = await verifyResourceOwnership(obraId, context.empresaId, 'obra')
      if (!isOwner) {
        return errorResponse('Obra no encontrada', 404)
      }

      const body = await req.json()

      // Validar datos con Zod
      const validatedData = validateSchema(obraUpdateSchema, body)

      // Validar cliente si se proporciona
      if (validatedData.clienteId) {
        const isClienteOwner = await verifyResourceOwnership(
          validatedData.clienteId,
          context.empresaId,
          'cliente'
        )
        if (!isClienteOwner) {
          return errorResponse('Cliente no encontrado o no pertenece a tu empresa', 404)
        }
      }

      // Preparar datos para actualización
      const updateData: any = {}

      if (validatedData.codigo !== undefined) updateData.codigo = validatedData.codigo.toUpperCase()
      if (validatedData.nombre !== undefined) updateData.nombre = validatedData.nombre
      if (validatedData.descripcion !== undefined) updateData.descripcion = validatedData.descripcion
      if (validatedData.ubicacion !== undefined) updateData.ubicacion = validatedData.ubicacion
      if (validatedData.estado !== undefined) updateData.estado = validatedData.estado
      if (validatedData.tipoContrato !== undefined) updateData.tipoContrato = validatedData.tipoContrato
      if (validatedData.fechaInicio !== undefined) {
        updateData.fechaInicio = validatedData.fechaInicio ? new Date(validatedData.fechaInicio) : null
      }
      if (validatedData.fechaFinProgramada !== undefined) {
        updateData.fechaFinProgramada = validatedData.fechaFinProgramada ? new Date(validatedData.fechaFinProgramada) : null
      }
      if (validatedData.fechaFinReal !== undefined) {
        updateData.fechaFinReal = validatedData.fechaFinReal ? new Date(validatedData.fechaFinReal) : null
      }
      if (validatedData.montoContrato !== undefined) updateData.montoContrato = validatedData.montoContrato
      if (validatedData.anticipoPct !== undefined) updateData.anticipoPct = validatedData.anticipoPct
      if (validatedData.retencionPct !== undefined) updateData.retencionPct = validatedData.retencionPct
      if (validatedData.clienteId !== undefined) updateData.clienteId = validatedData.clienteId || null

      const obra = await prisma.obra.update({
        where: { id: obraId },
        data: updateData,
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

      return successResponse(obra)
    } catch (error) {
      return handleApiError(error)
    }
  })(request, {} as any)
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  return withRole(['ADMIN'], async (req, context) => {
    try {
      // Validar ID
      const obraId = validateSchema(idSchema, params.id)

      // Verificar propiedad
      const isOwner = await verifyResourceOwnership(obraId, context.empresaId, 'obra')
      if (!isOwner) {
        return errorResponse('Obra no encontrada', 404)
      }

      // Cambiar estado a CANCELADA en lugar de eliminar (soft delete)
      const obra = await prisma.obra.update({
        where: { id: obraId },
        data: { estado: 'CANCELADA' }
      })

      return successResponse(obra)
    } catch (error) {
      return handleApiError(error)
    }
  })(request, {} as any)
}
