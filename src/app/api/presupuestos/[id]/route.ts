import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import {
  withRole,
  handleApiError,
  successResponse,
  errorResponse,
} from '@/lib/api-utils'
import { presupuestoUpdateSchema, validateSchema, idSchema } from '@/lib/validations'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  return withRole(['ADMIN', 'OBRAS', 'CONTADOR', 'USUARIO'], async (req, context) => {
    try {
      // Validar ID
      const presupuestoId = validateSchema(idSchema, params.id)

      // Buscar presupuesto verificando que pertenece a la empresa
      const presupuesto = await prisma.presupuesto.findFirst({
        where: {
          id: presupuestoId,
          obra: {
            empresaId: context.empresaId
          }
        },
        include: {
          obra: {
            select: {
              id: true,
              codigo: true,
              nombre: true,
              estado: true,
              montoContrato: true,
            }
          },
          conceptos: {
            include: {
              unidad: {
                select: {
                  id: true,
                  nombre: true,
                  abreviatura: true,
                }
              }
            },
            orderBy: { clave: 'asc' }
          }
        }
      })

      if (!presupuesto) {
        return errorResponse('Presupuesto no encontrado', 404)
      }

      // Convertir Decimals y calcular totales
      const conceptosConverted = presupuesto.conceptos.map(c => ({
        ...c,
        cantidad: Number(c.cantidad),
        precioUnitario: Number(c.precioUnitario),
        importe: Number(c.importe),
      }))

      const importeTotal = conceptosConverted.reduce((sum, c) => sum + c.importe, 0)

      const presupuestoConverted = {
        ...presupuesto,
        obra: {
          ...presupuesto.obra,
          montoContrato: Number(presupuesto.obra.montoContrato)
        },
        conceptos: conceptosConverted,
        totalConceptos: conceptosConverted.length,
        importeTotal,
      }

      return successResponse(presupuestoConverted)
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
      const presupuestoId = validateSchema(idSchema, params.id)

      // Verificar que el presupuesto pertenezca a la empresa
      const presupuestoExistente = await prisma.presupuesto.findFirst({
        where: {
          id: presupuestoId,
          obra: {
            empresaId: context.empresaId
          }
        }
      })

      if (!presupuestoExistente) {
        return errorResponse('Presupuesto no encontrado', 404)
      }

      const body = await req.json()
      const validatedData = validateSchema(presupuestoUpdateSchema, body)

      // Si se marca como vigente, desmarcar los demás de la misma obra
      if (validatedData.esVigente && !presupuestoExistente.esVigente) {
        await prisma.presupuesto.updateMany({
          where: {
            obraId: presupuestoExistente.obraId,
            esVigente: true,
            id: { not: presupuestoId }
          },
          data: { esVigente: false }
        })
      }

      // Preparar datos para actualización (solo campos presentes)
      const updateData: any = {}
      if (validatedData.version !== undefined) updateData.version = validatedData.version
      if (validatedData.nombre !== undefined) updateData.nombre = validatedData.nombre
      if (validatedData.descripcion !== undefined) updateData.descripcion = validatedData.descripcion
      if (validatedData.esVigente !== undefined) updateData.esVigente = validatedData.esVigente

      const presupuesto = await prisma.presupuesto.update({
        where: { id: presupuestoId },
        data: updateData,
        include: {
          obra: {
            select: {
              id: true,
              codigo: true,
              nombre: true,
              estado: true,
            }
          }
        }
      })

      return successResponse(presupuesto)
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
      const presupuestoId = validateSchema(idSchema, params.id)

      // Verificar que el presupuesto pertenezca a la empresa
      const presupuesto = await prisma.presupuesto.findFirst({
        where: {
          id: presupuestoId,
          obra: {
            empresaId: context.empresaId
          }
        }
      })

      if (!presupuesto) {
        return errorResponse('Presupuesto no encontrado', 404)
      }

      // Verificar si tiene estimaciones asociadas a través de conceptos
      const conceptosConEstimaciones = await prisma.conceptoEstimacion.findFirst({
        where: {
          conceptoPresupuesto: {
            presupuestoId
          }
        }
      })

      if (conceptosConEstimaciones) {
        return errorResponse(
          'No se puede eliminar el presupuesto porque tiene estimaciones asociadas',
          400
        )
      }

      // Eliminar conceptos en cascada (aunque Prisma lo hace automáticamente con onDelete: Cascade)
      await prisma.conceptoPresupuesto.deleteMany({
        where: { presupuestoId }
      })

      // Eliminar presupuesto
      await prisma.presupuesto.delete({
        where: { id: presupuestoId }
      })

      return successResponse({ message: 'Presupuesto eliminado correctamente' })
    } catch (error) {
      return handleApiError(error)
    }
  })(request, {} as any)
}
