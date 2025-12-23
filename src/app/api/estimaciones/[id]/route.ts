import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import {
  withRole,
  handleApiError,
  successResponse,
  errorResponse,
} from '@/lib/api-utils'
import { estimacionUpdateSchema, validateSchema, idSchema } from '@/lib/validations'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  return withRole(['ADMIN', 'OBRAS', 'CONTADOR', 'USUARIO'], async (req, context) => {
    try {
      // Validar ID
      const estimacionId = validateSchema(idSchema, params.id)

      const estimacion = await prisma.estimacion.findFirst({
        where: {
          id: estimacionId,
          obra: { empresaId: context.empresaId }
        },
        include: {
          obra: {
            select: {
              id: true,
              codigo: true,
              nombre: true,
              montoContrato: true,
              anticipoPct: true,
              retencionPct: true,
              cliente: {
                select: {
                  razonSocial: true,
                  nombreComercial: true,
                }
              }
            }
          },
          conceptos: {
            include: {
              conceptoPresupuesto: {
                include: {
                  unidad: true
                }
              }
            },
            orderBy: {
              conceptoPresupuesto: {
                clave: 'asc'
              }
            }
          }
        }
      })

      if (!estimacion) {
        return errorResponse('Estimación no encontrada', 404)
      }

      return successResponse(estimacion)
    } catch (error) {
      return handleApiError(error)
    }
  })(request, {} as any)
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  return withRole(['ADMIN', 'OBRAS', 'CONTADOR'], async (req, context) => {
    try {
      // Validar ID
      const estimacionId = validateSchema(idSchema, params.id)

      // Verificar que la estimación pertenezca a la empresa
      const existing = await prisma.estimacion.findFirst({
        where: {
          id: estimacionId,
          obra: { empresaId: context.empresaId }
        }
      })

      if (!existing) {
        return errorResponse('Estimación no encontrada', 404)
      }

      // Solo se pueden editar estimaciones en estado BORRADOR
      if (existing.estado !== 'BORRADOR') {
        return errorResponse('Solo se pueden editar estimaciones en estado BORRADOR', 400)
      }

      const body = await req.json()

      // Validar datos con Zod
      const validatedData = validateSchema(estimacionUpdateSchema, body)

      // Preparar datos para actualización
      const updateData: any = {}

      if (validatedData.periodo !== undefined) updateData.periodo = validatedData.periodo
      if (validatedData.fechaCorte !== undefined) {
        updateData.fechaCorte = new Date(validatedData.fechaCorte)
      }
      if (validatedData.estado !== undefined) updateData.estado = validatedData.estado
      if (validatedData.importeBruto !== undefined) updateData.importeBruto = validatedData.importeBruto
      if (validatedData.amortizacion !== undefined) updateData.amortizacion = validatedData.amortizacion
      if (validatedData.retencion !== undefined) updateData.retencion = validatedData.retencion

      // Recalcular importe neto si cambiaron los montos
      if (validatedData.importeBruto !== undefined ||
          validatedData.amortizacion !== undefined ||
          validatedData.retencion !== undefined) {
        const importeBruto = validatedData.importeBruto ?? Number(existing.importeBruto)
        const amortizacion = validatedData.amortizacion ?? Number(existing.amortizacion)
        const retencion = validatedData.retencion ?? Number(existing.retencion)

        updateData.importeNeto = importeBruto - amortizacion - retencion
      }

      const estimacion = await prisma.estimacion.update({
        where: { id: estimacionId },
        data: updateData,
        include: {
          obra: {
            select: {
              id: true,
              codigo: true,
              nombre: true,
            }
          }
        }
      })

      return successResponse(estimacion)
    } catch (error) {
      return handleApiError(error)
    }
  })(request, {} as any)
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  return withRole(['ADMIN', 'CONTADOR'], async (req, context) => {
    try {
      // Validar ID
      const estimacionId = validateSchema(idSchema, params.id)

      // Verificar que la estimación pertenezca a la empresa
      const existing = await prisma.estimacion.findFirst({
        where: {
          id: estimacionId,
          obra: { empresaId: context.empresaId }
        }
      })

      if (!existing) {
        return errorResponse('Estimación no encontrada', 404)
      }

      // Solo se pueden eliminar estimaciones en estado BORRADOR
      if (existing.estado !== 'BORRADOR') {
        return errorResponse('Solo se pueden eliminar estimaciones en estado BORRADOR', 400)
      }

      // Eliminar estimación (cascade eliminará conceptos)
      await prisma.estimacion.delete({
        where: { id: estimacionId }
      })

      return successResponse({ message: 'Estimación eliminada exitosamente' })
    } catch (error) {
      return handleApiError(error)
    }
  })(request, {} as any)
}
