import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import {
    withRole,
    handleApiError,
    successResponse,
    createdResponse,
} from '@/lib/api-utils'

export async function GET(request: NextRequest) {
    return withRole(['ADMIN', 'CONTADOR', 'OBRAS'], async (req, context) => {
        try {
            const periodos = await prisma.periodoNomina.findMany({
                where: { empresaId: context.empresaId },
                include: {
                    obra: { select: { nombre: true } },
                    detalles: { include: { empleado: true } },
                },
                orderBy: [
                    { anio: 'desc' },
                    { semana: 'desc' }
                ],
            })

            return successResponse(periodos)
        } catch (error) {
            return handleApiError(error)
        }
    })(request, {} as any)
}

export async function POST(request: NextRequest) {
    return withRole(['ADMIN', 'CONTADOR'], async (req, context) => {
        try {
            const body = await req.json()
            const { tipoPeriodo, semana, quincena, mes, anio, fechaInicio, fechaFin, obraId } = body

            const periodo = await prisma.periodoNomina.create({
                data: {
                    empresaId: context.empresaId,
                    tipoPeriodo,
                    semana: semana || null,
                    quincena: quincena || null,
                    mes: mes || null,
                    anio,
                    fechaInicio: new Date(fechaInicio),
                    fechaFin: new Date(fechaFin),
                    obraId: obraId || null,
                },
            })

            return createdResponse(periodo)
        } catch (error) {
            return handleApiError(error)
        }
    })(request, {} as any)
}
