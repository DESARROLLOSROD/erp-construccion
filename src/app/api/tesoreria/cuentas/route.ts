import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import {
    withRole,
    handleApiError,
    successResponse,
    createdResponse,
} from '@/lib/api-utils'
import { z } from 'zod'

const cuentaSchema = z.object({
    alias: z.string().min(1, 'Alias requerido'),
    banco: z.string().min(1, 'Nombre del banco requerido'),
    numeroCuenta: z.string().min(10, 'Número de cuenta inválido'),
    clabe: z.string().len(18, 'CLABE debe tener 18 dígitos').optional().or(z.literal('')),
    moneda: z.string().default('MXN'),
    saldoInicial: z.number().optional().default(0)
})

export async function GET(request: NextRequest) {
    return withRole(['ADMIN', 'CONTADOR', 'COMPRAS'], async (req, context) => {
        try {
            const cuentas = await prisma.cuentaBancaria.findMany({
                where: { empresaId: context.empresaId, activo: true },
                orderBy: { updatedAt: 'desc' }
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

            const cuenta = await prisma.cuentaBancaria.create({
                data: {
                    empresaId: context.empresaId,
                    alias: data.alias,
                    banco: data.banco,
                    numeroCuenta: data.numeroCuenta,
                    clabe: data.clabe || null,
                    moneda: data.moneda,
                    saldo: data.saldoInicial,
                }
            })

            return createdResponse(cuenta)
        } catch (error) {
            return handleApiError(error)
        }
    })(request, {} as any)
}
