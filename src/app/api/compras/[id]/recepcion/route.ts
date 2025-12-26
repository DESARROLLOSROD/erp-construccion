import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import {
    withRole,
    handleApiError,
    successResponse,
} from '@/lib/api-utils'
import { z } from 'zod'

const recepcionSchema = z.object({
    items: z.array(z.object({
        detalleId: z.string(),
        cantidad: z.number().positive(),
    })),
    notas: z.string().optional()
})

export async function POST(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    return withRole(['ADMIN', 'COMPRAS', 'ALMACEN'], async (req, context) => {
        try {
            const { id } = params
            const body = await req.json()
            const data = recepcionSchema.parse(body)

            const orden = await prisma.ordenCompra.findUnique({
                where: { id },
                include: { details: false } // No need to include details here, we select below or use ID check
            })

            if (!orden || orden.empresaId !== context.empresaId) {
                return NextResponse.json({ error: 'Orden no encontrada' }, { status: 404 })
            }

            if (orden.estado === 'CANCELADA' || orden.estado === 'BORRADOR') {
                return NextResponse.json({ error: 'Estado de orden inválido para recibir' }, { status: 400 })
            }

            // Transaction: Update DetalleOC, Create MovimientoInventario, Update Producto Stock
            await prisma.$transaction(async (tx) => {
                let allCompleted = true;

                for (const item of data.items) {
                    const detalle = await tx.detalleOrdenCompra.findUnique({
                        where: { id: item.detalleId }
                    })

                    if (!detalle || detalle.ordenCompraId !== id) {
                        throw new Error(`Detalle inválido: ${item.detalleId}`)
                    }

                    // Update Detalle Recibido
                    await tx.detalleOrdenCompra.update({
                        where: { id: item.detalleId },
                        data: {
                            cantidadRecibida: { increment: item.cantidad }
                        }
                    })

                    // Create Movimiento Inventario
                    await tx.movimientoInventario.create({
                        data: {
                            productoId: detalle.productoId,
                            tipo: 'COMPRA',
                            cantidad: item.cantidad,
                            costoUnitario: detalle.precioUnitario,
                            referencia: `OC-${orden.folio}`,
                            observaciones: data.notas,
                            fecha: new Date(),
                        }
                    })

                    // Update Product Stock
                    await tx.producto.update({
                        where: { id: detalle.productoId },
                        data: {
                            stockActual: { increment: item.cantidad },
                            // Optionally update precioCompra (Last Purchase Price)
                            precioCompra: detalle.precioUnitario
                        }
                    })
                }

                // Helper to check if ALL details are fully received to mark as COMPLETADA
                // Retrieving fresh details inside transaction
                const finalDetails = await tx.detalleOrdenCompra.findMany({
                    where: { ordenCompraId: id }
                })

                const isFullyReceived = finalDetails.every(d => Number(d.cantidadRecibida) >= Number(d.cantidad))

                await tx.ordenCompra.update({
                    where: { id },
                    data: {
                        estado: isFullyReceived ? 'COMPLETADA' : 'PARCIAL'
                    }
                })
            })

            return successResponse({ message: 'Recepción procesada correctamente' })

        } catch (error: any) {
            return handleApiError(error)
        }
    })(request, {} as any)
}
