import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import {
    withRole,
    handleApiError,
    successResponse,
} from '@/lib/api-utils'
import { z } from 'zod'

export async function GET(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    return withRole(['ADMIN', 'COMPRAS', 'CONTADOR', 'OBRAS'], async (req, context) => {
        try {
            const { id } = params
            const orden = await prisma.ordenCompra.findUnique({
                where: { id },
                include: {
                    proveedor: true,
                    obra: { select: { id: true, nombre: true, codigo: true } },
                    detalles: {
                        include: {
                            producto: { select: { id: true, codigo: true, descripcion: true, unidad: true } }
                        }
                    }
                }
            })

            if (!orden) return NextResponse.json({ error: 'Orden de compra no encontrada' }, { status: 404 })
            if (orden.empresaId !== context.empresaId) return NextResponse.json({ error: 'No tienes acceso' }, { status: 403 })

            return successResponse(orden)
        } catch (error) {
            return handleApiError(error)
        }
    })(request, {} as any)
}

// PUT to update ONLY if BORRADOR, or special status changes
export async function PUT(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    return withRole(['ADMIN', 'COMPRAS'], async (req, context) => {
        try {
            const { id } = params
            const body = await req.json()

            const orden = await prisma.ordenCompra.findUnique({ where: { id } })
            if (!orden || orden.empresaId !== context.empresaId) {
                return NextResponse.json({ error: 'Orden no encontrada' }, { status: 404 })
            }

            // If just changing status to SENT
            if (body.action === 'SEND') {
                if (orden.estado !== 'BORRADOR') return NextResponse.json({ error: 'Solo borradores pueden enviarse' }, { status: 400 })

                const updated = await prisma.ordenCompra.update({
                    where: { id },
                    data: { estado: 'ENVIADA' }
                })
                return successResponse(updated)
            }

            // If updating content, MUST be BORRADOR
            if (orden.estado !== 'BORRADOR') {
                return NextResponse.json({ error: 'No se puede editar una orden enviada o procesada' }, { status: 400 })
            }

            // Simple update logic (header only for now for simplicity, or complex replace details)
            // For this step, we focus on header updates.
            // Ideally 'detalles' update requires diffing or replace-all transaction.
            // We will assume UI sends just header updates or we implement full replace later if needed.
            // Allowing Notes update in any state? Maybe. for now strict.

            const updated = await prisma.ordenCompra.update({
                where: { id },
                data: {
                    fecha: body.fecha ? new Date(body.fecha) : undefined,
                    fechaEntrega: body.fechaEntrega ? new Date(body.fechaEntrega) : undefined,
                    notas: body.notas,
                    // If recalculating totals is needed, it implies details changed.
                }
            })

            return successResponse(updated)

        } catch (error) {
            return handleApiError(error)
        }
    })(request, {} as any)
}

// DELETE (Cancel)
export async function DELETE(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    return withRole(['ADMIN', 'COMPRAS'], async (req, context) => {
        try {
            const { id } = params

            const orden = await prisma.ordenCompra.findUnique({ where: { id } })
            if (!orden || orden.empresaId !== context.empresaId) {
                return NextResponse.json({ error: 'Orden no encontrada' }, { status: 404 })
            }

            if (orden.estado === 'COMPLETADA' || orden.estado === 'PARCIAL') {
                return NextResponse.json({ error: 'No se puede cancelar una orden con recepciones' }, { status: 400 })
            }

            // If borrador -> Hard Delete? Or just Cancel status.
            // Usually Cancel status is safer for audit.
            const updated = await prisma.ordenCompra.update({
                where: { id },
                data: { estado: 'CANCELADA' }
            })

            return successResponse(updated)

        } catch (error) {
            return handleApiError(error)
        }
    })(request, {} as any)
}
