import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import {
  withRole,
  handleApiError,
  successResponse,
  verifyResourceOwnership,
} from '@/lib/api-utils'
import { z } from 'zod'

// Schema helper just for simple updates
const updateSchema = z.object({
  numero: z.number().optional(),
  periodo: z.string().optional(),
  fechaCorte: z.string().or(z.date()).optional(),
  estado: z.enum(['BORRADOR', 'ENVIADA', 'APROBADA', 'FACTURADA', 'PAGADA', 'RECHAZADA']).optional(),
  importeBruto: z.number().optional(),
  amortizacion: z.number().optional(),
  retencion: z.number().optional(),
  importeNeto: z.number().optional(),
})

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  return withRole(['ADMIN', 'OBRAS', 'CONTADOR', 'USUARIO'], async (req, context) => {
    try {
      const { id } = params

      const estimacion = await prisma.estimacion.findUnique({
        where: { id },
        include: {
          obra: {
            select: {
              id: true,
              codigo: true,
              nombre: true,
              empresaId: true,
              montoContrato: true,
              anticipoPct: true,
              retencionPct: true,
              cliente: {
                select: {
                  razonSocial: true,
                  nombreComercial: true,
                  rfc: true,
                  direccion: true,
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
            }
          }
        }
      })

      if (!estimacion) {
        return NextResponse.json({ error: 'Estimación no encontrada' }, { status: 404 })
      }

      // Verify ownership
      if (estimacion.obra.empresaId !== context.empresaId) {
        return NextResponse.json({ error: 'No tienes acceso a esta estimación' }, { status: 403 })
      }

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
  return withRole(['ADMIN', 'OBRAS'], async (req, context) => {
    try {
      const { id } = params

      const estimacion = await prisma.estimacion.findUnique({
        where: { id },
        select: { id: true, estado: true, obra: { select: { empresaId: true } } }
      })

      if (!estimacion) {
        return NextResponse.json({ error: 'Estimación no encontrada' }, { status: 404 })
      }

      if (estimacion.obra.empresaId !== context.empresaId) {
        return NextResponse.json({ error: 'No tienes acceso a esta estimación' }, { status: 403 })
      }

      if (estimacion.estado !== 'BORRADOR') {
        return NextResponse.json({ error: 'Solo se pueden eliminar estimaciones en BORRADOR' }, { status: 400 })
      }

      await prisma.estimacion.delete({
        where: { id }
      })

      return successResponse({ message: 'Estimación eliminada' })
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
      const { id } = params
      const body = await req.json()

      // Validate body simple
      const validatedData = updateSchema.parse(body)

      const estimacion = await prisma.estimacion.findUnique({
        where: { id },
        select: { id: true, estado: true, obra: { select: { empresaId: true } } }
      })

      if (!estimacion) {
        return NextResponse.json({ error: 'Estimación no encontrada' }, { status: 404 })
      }

      if (estimacion.obra.empresaId !== context.empresaId) {
        return NextResponse.json({ error: 'No tienes acceso a esta estimación' }, { status: 403 })
      }

      // Logic checks
      // If updating status, verify transition logic (can be expanded)
      // For now, allow direct update if role permits.

      const updated = await prisma.estimacion.update({
        where: { id },
        data: {
          ...validatedData,
          fechaCorte: validatedData.fechaCorte ? new Date(validatedData.fechaCorte) : undefined
        }
      })

      return successResponse(updated)
    } catch (error) {
      return handleApiError(error)
    }
  })(request, {} as any)
}
