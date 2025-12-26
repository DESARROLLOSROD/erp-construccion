import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import {
    withRole,
    handleApiError,
    successResponse,
    createdResponse,
    getPaginationParams,
    createPaginatedResponse,
    convertDecimalsToNumbers
} from '@/lib/api-utils'
import { z } from 'zod'

const detalleSchema = z.object({
    cuentaId: z.string(),
    descripcion: z.string().optional(),
    debe: z.number().min(0),
    haber: z.number().min(0)
})

const polizaSchema = z.object({
    tipo: z.enum(['DIARIO', 'INGRESO', 'EGRESO']),
    fecha: z.string().datetime(),
    concepto: z.string().min(1, 'Concepto requerido'),
    detalles: z.array(detalleSchema).min(2, 'Debe haber al menos 2 movimientos')
})

export async function GET(request: NextRequest) {
    return withRole(['ADMIN', 'CONTADOR'], async (req, context) => {
        try {
            const { searchParams } = new URL(req.url)
            const page = parseInt(searchParams.get('page') || '1')
            const limit = parseInt(searchParams.get('limit') || '20')
            const { skip, take } = getPaginationParams(page, limit)

            const [polizas, total] = await Promise.all([
                prisma.poliza.findMany({
                    where: { empresaId: context.empresaId },
                    include: {
                        detalles: { include: { cuenta: true } }
                    },
                    orderBy: { fecha: 'desc' },
                    skip,
                    take
                }),
                prisma.poliza.count({ where: { empresaId: context.empresaId } })
            ])

            return successResponse(createPaginatedResponse(polizas, total, page, limit))
        } catch (error) {
            return handleApiError(error)
        }
    })(request, {} as any)
}

export async function POST(request: NextRequest) {
    return withRole(['ADMIN', 'CONTADOR'], async (req, context) => {
        try {
            const body = await req.json()
            const data = polizaSchema.parse(body)

            // Validate Balance (Cuadre)
            const totalDebe = data.detalles.reduce((sum, d) => sum + d.debe, 0)
            const totalHaber = data.detalles.reduce((sum, d) => sum + d.haber, 0)

            // Allow simplified check with small epsilon for float precision
            if (Math.abs(totalDebe - totalHaber) > 0.01) {
                return NextResponse.json({
                    error: `La póliza no cuadra. Debe: ${totalDebe}, Haber: ${totalHaber}, Diferencia: ${totalDebe - totalHaber}`
                }, { status: 400 })
            }

            const result = await prisma.$transaction(async (tx) => {
                // Get next folio
                const lastPoliza = await tx.poliza.findFirst({
                    where: { empresaId: context.empresaId, tipo: data.tipo },
                    orderBy: { folio: 'desc' }
                })
                const nextFolio = (lastPoliza?.folio || 0) + 1

                const poliza = await tx.poliza.create({
                    data: {
                        empresaId: context.empresaId,
                        tipo: data.tipo,
                        folio: nextFolio,
                        fecha: new Date(data.fecha),
                        concepto: data.concepto,
                        detalles: {
                            create: data.detalles.map(d => ({
                                cuentaId: d.cuentaId,
                                descripcion: d.descripcion,
                                // Ensure using string or decimal is handled by ORM, generally passing number is fine if configured
                                debe: d.debe,
                                haber: d.haber
                            }))
                        }
                    },
                    include: { detalles: true }
                })
                return poliza
            })

            return createdResponse(result)

        } catch (error) {
            return handleApiError(error)
        }
    })(request, {} as any)
}
