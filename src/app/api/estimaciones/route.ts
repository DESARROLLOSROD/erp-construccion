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
import { estimacionQuerySchema, estimacionCreateSchema, validateSchema } from '@/lib/validations'

export async function GET(request: NextRequest) {
  return withRole(['ADMIN', 'OBRAS', 'CONTADOR', 'USUARIO'], async (req, context) => {
    try {
      const { searchParams } = new URL(req.url)

      // Validar parámetros de query
      const query = validateSchema(estimacionQuerySchema, {
        obraId: searchParams.get('obraId'),
        estado: searchParams.get('estado'),
        periodo: searchParams.get('periodo'),
        page: searchParams.get('page') || '1',
        limit: searchParams.get('limit') || '20',
      })

      const { skip, take } = getPaginationParams(query.page as number, query.limit as number)

      // Construir filtros
      const where: any = {
        obra: {
          empresaId: context.empresaId,
        },
      }

      if (query.obraId) {
        // Verificar que la obra pertenezca a la empresa
        const isOwner = await verifyResourceOwnership(
          query.obraId,
          context.empresaId,
          'obra'
        )
        if (!isOwner) {
          return NextResponse.json(
            { error: 'Obra no encontrada o no pertenece a tu empresa' },
            { status: 404 }
          )
        }
        where.obraId = query.obraId
      }

      if (query.estado) {
        where.estado = query.estado
      }

      if (query.periodo) {
        where.periodo = query.periodo
      }

      // Obtener estimaciones con paginación
      const [estimaciones, total] = await Promise.all([
        prisma.estimacion.findMany({
          where,
          include: {
            obra: {
              select: {
                id: true,
                codigo: true,
                nombre: true,
                cliente: {
                  select: {
                    razonSocial: true,
                    nombreComercial: true,
                  }
                }
              }
            },
            _count: {
              select: {
                conceptos: true,
              }
            }
          },
          orderBy: [
            { obraId: 'asc' },
            { numero: 'desc' }
          ],
          skip,
          take,
        }),
        prisma.estimacion.count({ where })
      ])

      const response = createPaginatedResponse(estimaciones, total, query.page as number, query.limit as number)
      return successResponse(response)
    } catch (error) {
      return handleApiError(error)
    }
  })(request, {} as any)
}

export async function POST(request: NextRequest) {
  return withRole(['ADMIN', 'OBRAS', 'CONTADOR'], async (req, context) => {
    try {
      const body = await req.json()

      // Validar datos con Zod
      const validatedData = validateSchema(estimacionCreateSchema, body)

      // Verificar que la obra pertenezca a la empresa
      const isOwner = await verifyResourceOwnership(
        validatedData.obraId,
        context.empresaId,
        'obra'
      )
      if (!isOwner) {
        return NextResponse.json(
          { error: 'Obra no encontrada o no pertenece a tu empresa' },
          { status: 404 }
        )
      }

      // Validar que no exista una estimación con el mismo número para esta obra
      const existing = await prisma.estimacion.findFirst({
        where: {
          obraId: validatedData.obraId,
          numero: validatedData.numero,
        }
      })

      if (existing) {
        return NextResponse.json(
          { error: `Ya existe una estimación ${validatedData.numero} para esta obra` },
          { status: 409 }
        )
      }

      // Obtener información de la obra para calcular amortización y retención
      const obra = await prisma.obra.findUnique({
        where: { id: validatedData.obraId },
        select: { anticipoPct: true, retencionPct: true }
      })

      if (!obra) {
        return NextResponse.json(
          { error: 'Obra no encontrada' },
          { status: 404 }
        )
      }

      // Calcular amortización y retención si no se proporcionaron
      let amortizacion = validatedData.amortizacion || 0
      let retencion = validatedData.retencion || 0

      if (amortizacion === 0 && Number(obra.anticipoPct) > 0) {
        amortizacion = validatedData.importeBruto * (Number(obra.anticipoPct) / 100)
      }

      if (retencion === 0 && Number(obra.retencionPct) > 0) {
        retencion = validatedData.importeBruto * (Number(obra.retencionPct) / 100)
      }

      // Recalcular importe neto
      const importeNeto = validatedData.importeBruto - amortizacion - retencion

      // Crear estimación
      const estimacion = await prisma.estimacion.create({
        data: {
          obraId: validatedData.obraId,
          numero: validatedData.numero,
          periodo: validatedData.periodo,
          fechaCorte: new Date(validatedData.fechaCorte),
          estado: validatedData.estado,
          importeBruto: validatedData.importeBruto,
          amortizacion,
          retencion,
          importeNeto,
        },
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

      return createdResponse(estimacion)
    } catch (error) {
      return handleApiError(error)
    }
  })(request, {} as any)
}
