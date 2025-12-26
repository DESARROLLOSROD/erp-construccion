import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import {
  withRole,
  handleApiError,
  successResponse,
  createdResponse,
  errorResponse,
  getPaginationParams,
  createPaginatedResponse,
} from '@/lib/api-utils'
import { presupuestoQuerySchema, presupuestoCreateSchema, validateSchema } from '@/lib/validations'

export async function GET(request: NextRequest) {
  return withRole(['ADMIN', 'OBRAS', 'CONTADOR', 'USUARIO'], async (req, context) => {
    try {
      const { searchParams } = new URL(req.url)

      // Validar parámetros de query
      const query = validateSchema(presupuestoQuerySchema, {
        obraId: searchParams.get('obraId'),
        esVigente: searchParams.get('esVigente'),
        page: searchParams.get('page') || '1',
        limit: searchParams.get('limit') || '20',
      })

      const { skip, take } = getPaginationParams(query.page as number, query.limit as number)

      // Construir filtros
      const where: any = {
        obra: {
          empresaId: context.empresaId
        }
      }

      if (query.obraId) where.obraId = query.obraId
      if (query.esVigente !== undefined) where.esVigente = query.esVigente

      const [presupuestos, total] = await Promise.all([
        prisma.presupuesto.findMany({
          where,
          include: {
            obra: {
              select: {
                id: true,
                codigo: true,
                nombre: true,
                estado: true,
              }
            },
            _count: {
              select: {
                conceptos: true
              }
            }
          },
          orderBy: { updatedAt: 'desc' },
          skip,
          take,
        }),
        prisma.presupuesto.count({ where })
      ])

      // Calcular totales para cada presupuesto
      const presupuestosConTotales = await Promise.all(
        presupuestos.map(async (p) => {
          const conceptos = await prisma.conceptoPresupuesto.findMany({
            where: { presupuestoId: p.id },
            select: { importe: true }
          })

          const importeTotal = conceptos.reduce((sum, c) => sum + Number(c.importe), 0)

          return {
            ...p,
            totalConceptos: p._count.conceptos,
            importeTotal,
          }
        })
      )

      const response = createPaginatedResponse(presupuestosConTotales, total, query.page as number, query.limit as number)
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
      const validatedData = validateSchema(presupuestoCreateSchema, body)

      // Verificar que la obra pertenezca a la empresa
      const obra = await prisma.obra.findFirst({
        where: {
          id: validatedData.obraId,
          empresaId: context.empresaId
        }
      })

      if (!obra) {
        return errorResponse('Obra no encontrada o no pertenece a tu empresa', 404)
      }

      // Si esVigente es true, marcar otros presupuestos de la obra como no vigentes
      if (validatedData.esVigente) {
        await prisma.presupuesto.updateMany({
          where: {
            obraId: validatedData.obraId,
            esVigente: true
          },
          data: { esVigente: false }
        })
      }

      const presupuesto = await prisma.presupuesto.create({
        data: {
          obraId: validatedData.obraId,
          version: validatedData.version,
          nombre: validatedData.nombre,
          descripcion: validatedData.descripcion,
          esVigente: validatedData.esVigente,
        },
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

      return createdResponse(presupuesto)
    } catch (error) {
      return handleApiError(error)
    }
  })(request, {} as any)
}
