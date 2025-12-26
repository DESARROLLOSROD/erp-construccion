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

// Schema validation
const movimientoSchema = z.object({
    productoId: z.string().min(1, 'Producto requerido'),
    obraId: z.string().optional(), // Required for SALIDA_OBRA
    tipo: z.enum(['ENTRADA', 'SALIDA_OBRA', 'DEVOLUCION_OBRA', 'AJUSTE_POSITIVO', 'AJUSTE_NEGATIVO']),
    cantidad: z.number().min(0.0001, 'La cantidad debe ser mayor a 0'),
    costoUnitario: z.number().optional(), // Optional, falls back to current cost
    observaciones: z.string().optional(),
})

export async function GET(request: NextRequest) {
    return withRole(['ADMIN', 'ALMACEN', 'OBRAS'], async (req, context) => {
        try {
            const { searchParams } = new URL(req.url)
            const page = parseInt(searchParams.get('page') || '1')
            const limit = parseInt(searchParams.get('limit') || '20')
            const productoId = searchParams.get('productoId')

            const { skip, take } = getPaginationParams(page, limit)

            const where: any = {
                producto: { empresaId: context.empresaId }
            }

            if (productoId) {
                where.productoId = productoId
            }

            const [movimientos, total] = await Promise.all([
                prisma.movimientoInventario.findMany({
                    where,
                    include: {
                        producto: { select: { nombre: true, codigo: true } },
                        obra: { select: { nombre: true, codigo: true } }
                    },
                    orderBy: { fecha: 'desc' },
                    skip,
                    take
                }),
                prisma.movimientoInventario.count({ where })
            ])

            return successResponse(createPaginatedResponse(movimientos, total, page, limit))
        } catch (error) {
            return handleApiError(error)
        }
    })(request, {} as any)
}

export async function POST(request: NextRequest) {
    return withRole(['ADMIN', 'ALMACEN'], async (req, context) => {
        try {
            const body = await req.json()
            const data = movimientoSchema.parse(body)

            // Get Product
            const producto = await prisma.producto.findUnique({
                where: { id: data.productoId }
            })

            if (!producto || producto.empresaId !== context.empresaId) {
                return NextResponse.json({ error: 'Producto no encontrado' }, { status: 404 })
            }

            // Check Stock for Outward movements
            const isSalida = ['SALIDA_OBRA', 'AJUSTE_NEGATIVO'].includes(data.tipo)
            if (isSalida && Number(producto.stockActual) < data.cantidad) {
                return NextResponse.json({
                    error: `Stock insuficiente. Disponible: ${producto.stockActual}`
                }, { status: 400 })
            }

            // Validation for Obra
            if (data.tipo === 'SALIDA_OBRA' && !data.obraId) {
                return NextResponse.json({ error: 'Obra requerida para salidas a obra' }, { status: 400 })
            }

            // Transaction: Update Stock + Log Movement
            const result = await prisma.$transaction(async (tx) => {
                // 1. Create Log
                const movimiento = await tx.movimientoInventario.create({
                    data: {
                        productoId: data.productoId,
                        // If Obra is provided, link it
                        obraId: data.obraId ? data.obraId : undefined,
                        tipo: data.tipo,
                        cantidad: data.cantidad,
                        // Use provided cost or current weighted_average (simulated as purchase price for now if not tracked)
                        costoUnitario: data.costoUnitario || producto.precioCompra,
                        observaciones: data.observaciones
                    }
                })

                // 2. Update Stock
                let newStock = Number(producto.stockActual)
                if (isSalida) {
                    newStock -= data.cantidad
                } else {
                    newStock += data.cantidad
                }

                await tx.producto.update({
                    where: { id: producto.id },
                    data: { stockActual: newStock }
                })

                return movimiento
            })

            return createdResponse(result)

        } catch (error) {
            return handleApiError(error)
        }
    })(request, {} as any)
}
