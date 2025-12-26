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

// Validation Schemas
const ordenCompraCreateSchema = z.object({
    proveedorId: z.string().min(1, 'El proveedor es requerido'),
    obraId: z.string().optional(),
    fecha: z.string().or(z.date()),
    fechaEntrega: z.string().or(z.date()).optional(),
    notas: z.string().optional(),
    detalles: z.array(z.object({
        productoId: z.string().min(1, 'El producto es requerido'),
        cantidad: z.number().positive('La cantidad debe ser mayor a 0'),
        precioUnitario: z.number().min(0, 'El precio no puede ser negativo'),
    })).min(1, 'Debe agregar al menos un producto')
})

export async function GET(request: NextRequest) {
    return withRole(['ADMIN', 'COMPRAS', 'CONTADOR', 'OBRAS'], async (req, context) => {
        try {
            const { searchParams } = new URL(req.url)
            const page = parseInt(searchParams.get('page') || '1')
            const limit = parseInt(searchParams.get('limit') || '20')
            const estado = searchParams.get('estado')
            const search = searchParams.get('search')

            const { skip, take } = getPaginationParams(page, limit)

            const where: any = {
                empresaId: context.empresaId,
            }

            if (estado && estado !== 'TODOS') {
                where.estado = estado
            }

            if (search) {
                where.OR = [
                    { proveedor: { razonSocial: { contains: search, mode: 'insensitive' } } },
                    { proveedor: { nombreComercial: { contains: search, mode: 'insensitive' } } },
                    // Note: Folio is int, filtering by string search on int requires casting or exact match logic
                    // Simple generic search usually targets text fields.
                ]
                // Check if search is a number for folio
                if (!isNaN(Number(search))) {
                    // where.folio = Number(search)  <-- Can't mix with OR easily in simple prisma without explicit structure
                    // Easier to just keep text search for now or add specific folio filter
                    where.OR.push({ folio: Number(search) })
                }
            }

            const [ordenes, total] = await Promise.all([
                prisma.ordenCompra.findMany({
                    where,
                    include: {
                        proveedor: { select: { nombreComercial: true, razonSocial: true } },
                        obra: { select: { nombre: true, codigo: true } },
                        _count: { select: { detalles: true } }
                    },
                    orderBy: { folio: 'desc' },
                    skip,
                    take,
                }),
                prisma.ordenCompra.count({ where })
            ])

            const response = createPaginatedResponse(ordenes, total, page, limit)
            return successResponse(response)
        } catch (error) {
            return handleApiError(error)
        }
    })(request, {} as any)
}

export async function POST(request: NextRequest) {
    return withRole(['ADMIN', 'COMPRAS'], async (req, context) => {
        try {
            const body = await req.json()
            const data = ordenCompraCreateSchema.parse(body)

            // Get next Folio for this Empresa
            const lastOC = await prisma.ordenCompra.findFirst({
                where: { empresaId: context.empresaId },
                orderBy: { folio: 'desc' },
                select: { folio: true }
            })
            const nextFolio = (lastOC?.folio || 0) + 1

            // Calculate totals
            let subtotal = 0
            const detallesData = data.detalles.map(d => {
                const importe = d.cantidad * d.precioUnitario
                subtotal += importe
                return {
                    productoId: d.productoId,
                    cantidad: d.cantidad,
                    precioUnitario: d.precioUnitario,
                    importe
                }
            })

            const iva = subtotal * 0.16 // Hardcoded 16% for MX
            const total = subtotal + iva

            const ordenCompra = await prisma.ordenCompra.create({
                data: {
                    empresaId: context.empresaId,
                    proveedorId: data.proveedorId,
                    obraId: data.obraId,
                    folio: nextFolio,
                    fecha: new Date(data.fecha),
                    fechaEntrega: data.fechaEntrega ? new Date(data.fechaEntrega) : undefined,
                    estado: 'BORRADOR',
                    subtotal,
                    iva,
                    total,
                    notas: data.notas,
                    detalles: {
                        create: detallesData
                    }
                }
            })

            return createdResponse(ordenCompra)

        } catch (error) {
            return handleApiError(error)
        }
    })(request, {} as any)
}
