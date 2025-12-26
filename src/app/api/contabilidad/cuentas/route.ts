import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import {
    withRole,
    handleApiError,
    successResponse,
    createdResponse
} from '@/lib/api-utils'
import { z } from 'zod'

const cuentaSchema = z.object({
    codigo: z.string().min(1, 'Código requerido'),
    nombre: z.string().min(1, 'Nombre requerido'),
    tipo: z.enum(['ACTIVO', 'PASIVO', 'CAPITAL', 'INGRESOS', 'EGRESOS', 'ORDEN']),
    nivel: z.number().int().min(1),
    padreId: z.string().optional()
})

export async function GET(request: NextRequest) {
    return withRole(['ADMIN', 'CONTADOR'], async (req, context) => {
        try {
            const cuentas = await prisma.cuentaContable.findMany({
                where: { empresaId: context.empresaId, activo: true },
                orderBy: { codigo: 'asc' }
            })
            return successResponse(cuentas)
        } catch (error) {
            return handleApiError(error)
        }
    })(request, {} as any)
}

export async function POST(request: NextRequest) {
    return withRole(['ADMIN', 'CONTADOR'], async (req, context) => {
        try {
            const body = await req.json()
            const data = cuentaSchema.parse(body)

            const cuenta = await prisma.cuentaContable.create({
                data: {
                    ...data,
                    empresaId: context.empresaId
                }
            })
            return createdResponse(cuenta)
        } catch (error) {
            return handleApiError(error)
        }
    })(request, {} as any)
}
