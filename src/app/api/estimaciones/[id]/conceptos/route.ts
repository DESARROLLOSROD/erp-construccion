import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import {
  withRole,
  handleApiError,
  successResponse,
  createdResponse,
  errorResponse,
} from '@/lib/api-utils'
import { conceptoEstimacionCreateSchema, validateSchema, idSchema } from '@/lib/validations'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  return withRole(['ADMIN', 'OBRAS', 'CONTADOR', 'USUARIO'], async (req, context) => {
    try {
      // Validar ID
      const estimacionId = validateSchema(idSchema, params.id)

      // Verificar que la estimación pertenezca a la empresa
      const estimacion = await prisma.estimacion.findFirst({
        where: {
          id: estimacionId,
          obra: { empresaId: context.empresaId }
        }
      })

      if (!estimacion) {
        return errorResponse('Estimación no encontrada', 404)
      }

      // Obtener conceptos de la estimación
      const conceptos = await prisma.conceptoEstimacion.findMany({
        where: { estimacionId },
        include: {
          conceptoPresupuesto: {
            include: {
              unidad: true,
              presupuesto: {
                select: {
                  id: true,
                  version: true,
                  nombre: true,
                }
              }
            }
          }
        },
        orderBy: {
          conceptoPresupuesto: {
            clave: 'asc'
          }
        }
      })

      return successResponse(conceptos)
    } catch (error) {
      return handleApiError(error)
    }
  })(request, {} as any)
}

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  return withRole(['ADMIN', 'OBRAS', 'CONTADOR'], async (req, context) => {
    try {
      // Validar ID
      const estimacionId = validateSchema(idSchema, params.id)

      // Verificar que la estimación pertenezca a la empresa
      const estimacion = await prisma.estimacion.findFirst({
        where: {
          id: estimacionId,
          obra: { empresaId: context.empresaId }
        }
      })

      if (!estimacion) {
        return errorResponse('Estimación no encontrada', 404)
      }

      // Solo se pueden agregar conceptos a estimaciones en BORRADOR
      if (estimacion.estado !== 'BORRADOR') {
        return errorResponse('Solo se pueden agregar conceptos a estimaciones en estado BORRADOR', 400)
      }

      const body = await req.json()

      // Validar datos con Zod
      const validatedData = validateSchema(conceptoEstimacionCreateSchema, {
        ...body,
        estimacionId
      })

      // Verificar que el concepto de presupuesto existe y pertenece a la obra
      const conceptoPresupuesto = await prisma.conceptoPresupuesto.findFirst({
        where: {
          id: validatedData.conceptoPresupuestoId,
          presupuesto: {
            obraId: estimacion.obraId
          }
        }
      })

      if (!conceptoPresupuesto) {
        return errorResponse('Concepto de presupuesto no encontrado o no pertenece a la obra', 404)
      }

      // Validar que la cantidad acumulada no exceda la cantidad presupuestada
      if (validatedData.cantidadAcumulada > Number(conceptoPresupuesto.cantidad)) {
        return errorResponse(
          `La cantidad acumulada (${validatedData.cantidadAcumulada}) no puede exceder la cantidad presupuestada (${conceptoPresupuesto.cantidad})`,
          400
        )
      }

      // Verificar que no exista ya un concepto para este presupuesto en esta estimación
      const existing = await prisma.conceptoEstimacion.findFirst({
        where: {
          estimacionId,
          conceptoPresupuestoId: validatedData.conceptoPresupuestoId
        }
      })

      if (existing) {
        return errorResponse('Este concepto ya fue agregado a la estimación', 409)
      }

      // Calcular importe si no se proporcionó
      let importe = validatedData.importe
      if (importe === 0) {
        importe = validatedData.cantidadEjecutada * Number(conceptoPresupuesto.precioUnitario)
      }

      // Crear concepto de estimación
      const conceptoEstimacion = await prisma.conceptoEstimacion.create({
        data: {
          estimacionId,
          conceptoPresupuestoId: validatedData.conceptoPresupuestoId,
          cantidadEjecutada: validatedData.cantidadEjecutada,
          cantidadAcumulada: validatedData.cantidadAcumulada,
          importe,
        },
        include: {
          conceptoPresupuesto: {
            include: {
              unidad: true
            }
          }
        }
      })

      // Actualizar importe bruto de la estimación
      const nuevoImporteBruto = Number(estimacion.importeBruto) + importe

      // Recalcular montos
      const obra = await prisma.obra.findUnique({
        where: { id: estimacion.obraId },
        select: { anticipoPct: true, retencionPct: true }
      })

      const amortizacion = nuevoImporteBruto * (Number(obra?.anticipoPct || 0) / 100)
      const retencion = nuevoImporteBruto * (Number(obra?.retencionPct || 0) / 100)
      const importeNeto = nuevoImporteBruto - amortizacion - retencion

      await prisma.estimacion.update({
        where: { id: estimacionId },
        data: {
          importeBruto: nuevoImporteBruto,
          amortizacion,
          retencion,
          importeNeto,
        }
      })

      return createdResponse(conceptoEstimacion)
    } catch (error) {
      return handleApiError(error)
    }
  })(request, {} as any)
}
