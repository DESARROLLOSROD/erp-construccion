import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import {
    withRole,
    handleApiError,
    successResponse,
    createdResponse,
    getPaginationParams,
    createPaginatedResponse,
} from '@/lib/api-utils'
import { z } from 'zod'

const transaccionSchema = z.object({
    cuentaId: z.string().min(1, 'Cuenta requerida'),
    tipo: z.enum(['INGRESO', 'EGRESO']),
    monto: z.number().positive('Monto debe ser positivo'),
    fecha: z.string().or(z.date()),
    concepto: z.string().min(1, 'Concepto requerido'),
    referencia: z.string().optional(),
    ordenCompraId: z.string().optional(),
    estimacionId: z.string().optional()
})

export async function GET(request: NextRequest) {
    return withRole(['ADMIN', 'CONTADOR', 'COMPRAS'], async (req, context) => {
        try {
            const { searchParams } = new URL(req.url)
            const page = parseInt(searchParams.get('page') || '1')
            const limit = parseInt(searchParams.get('limit') || '20')
            const cuentaId = searchParams.get('cuentaId')

            const { skip, take } = getPaginationParams(page, limit)

            const where: any = {
                cuenta: { empresaId: context.empresaId }
            }

            if (cuentaId) where.cuentaId = cuentaId

            const [movimientos, total] = await Promise.all([
                prisma.transaccion.findMany({
                    where,
                    include: {
                        cuenta: { select: { alias: true, banco: true } },
                        ordenCompra: { select: { folio: true, proveedor: { select: { nombreComercial: true } } } },
                        estimacion: { select: { numero: true, obra: { select: { nombre: true } } } }
                    },
                    orderBy: { fecha: 'desc' },
                    skip,
                    take
                }),
                prisma.transaccion.count({ where })
            ])

            return successResponse(createPaginatedResponse(movimientos, total, page, limit))
        } catch (error) {
            return handleApiError(error)
        }
    })(request, {} as any)
}

export async function POST(request: NextRequest) {
    return withRole(['ADMIN', 'CONTADOR'], async (req, context) => {
        try {
            const body = await req.json()
            const data = transaccionSchema.parse(body)

            // Get Account to check balance and ownership
            const cuenta = await prisma.cuentaBancaria.findUnique({
                where: { id: data.cuentaId }
            })

            if (!cuenta || cuenta.empresaId !== context.empresaId) {
                return NextResponse.json({ error: 'Cuenta no encontrada' }, { status: 404 })
            }

            // Validate Funds for Expense
            if (data.tipo === 'EGRESO' && Number(cuenta.saldo) < data.monto) {
                return NextResponse.json({ error: 'Fondos insuficientes en la cuenta' }, { status: 400 })
            }

            // Transaction: Create Movimiento, Update Saldo Cuenta, Update OC/Estimacion (if exists)
            const result = await prisma.$transaction(async (tx) => {
                // 1. Create Transaction
                const transaccion = await tx.transaccion.create({
                    data: {
                        cuentaId: data.cuentaId,
                        tipo: data.tipo,
                        monto: data.monto,
                        fecha: new Date(data.fecha),
                        concepto: data.concepto,
                        referencia: data.referencia,
                        ordenCompraId: data.ordenCompraId,
                        estimacionId: data.estimacionId
                    }
                })

                // 2. Update Account Balance
                const nuevoSaldo = data.tipo === 'INGRESO'
                    ? Number(cuenta.saldo) + data.monto
                    : Number(cuenta.saldo) - data.monto

                await tx.cuentaBancaria.update({
                    where: { id: data.cuentaId },
                    data: { saldo: nuevoSaldo }
                })

                // 3. Update Order Payment (if linked - EGRESO)
                if (data.ordenCompraId && data.tipo === 'EGRESO') {
                    const oc = await tx.ordenCompra.findUnique({ where: { id: data.ordenCompraId } })
                    if (oc) {
                        const nuevoPagado = Number(oc.pagado) + data.monto
                        const total = Number(oc.total)
                        await tx.ordenCompra.update({
                            where: { id: data.ordenCompraId },
                            data: {
                                pagado: nuevoPagado,
                                saldo: total - nuevoPagado,
                                estado: total - nuevoPagado <= 0.01 ? 'COMPLETADA' : 'PARCIAL'
                            }
                        })
                    }
                }

                // 4. Update Estimacion Payment (if linked - INGRESO)
                if (data.estimacionId && data.tipo === 'INGRESO') {
                    const est = await tx.estimacion.findUnique({ where: { id: data.estimacionId } })
                    if (est) {
                        const nuevoPagado = Number(est.pagado) + data.monto
                        const total = Number(est.importeNeto)
                        await tx.estimacion.update({
                            where: { id: data.estimacionId },
                            data: {
                                pagado: nuevoPagado,
                                saldo: total - nuevoPagado,
                                estado: total - nuevoPagado <= 0.01 ? 'PAGADA' : 'FACTURADA'
                            }
                        })
                    }
                }

                return transaccion
            })

            return createdResponse(result)

        } catch (error) {
            return handleApiError(error)
        }
    })(request, {} as any)
}
