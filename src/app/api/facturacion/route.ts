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
const facturaSchema = z.object({
    clienteId: z.string().min(1, 'Cliente requerido'),
    estimacionId: z.string().min(1, 'Estimacion requerida'),
    metodoPago: z.string().default('PPD'),
    formaPago: z.string().default('99'),
    usoCfdi: z.string().default('G03'),
})

// Mock PAC Timbrado Service
const mockTimbrar = async (facturaId: string) => {
    // Simulate delay
    await new Promise(r => setTimeout(r, 1000))
    // Generate Fiscal UUID
    return {
        uuid: crypto.randomUUID().toUpperCase(),
        serie: 'A',
        folio: Math.floor(Math.random() * 10000)
    }
}

export async function GET(request: NextRequest) {
    return withRole(['ADMIN', 'CONTADOR', 'VENTAS'], async (req, context) => {
        try {
            const { searchParams } = new URL(req.url)
            const page = parseInt(searchParams.get('page') || '1')
            const limit = parseInt(searchParams.get('limit') || '20')

            const { skip, take } = getPaginationParams(page, limit)

            const where: any = {
                empresaId: context.empresaId
            }

            const [facturas, total] = await Promise.all([
                prisma.factura.findMany({
                    where,
                    include: {
                        cliente: { select: { razonSocial: true, rfc: true } },
                        estimacion: { select: { numero: true, obra: { select: { nombre: true } } } }
                    },
                    orderBy: { fecha: 'desc' },
                    skip,
                    take
                }),
                prisma.factura.count({ where })
            ])

            return successResponse(createPaginatedResponse(facturas, total, page, limit))
        } catch (error) {
            return handleApiError(error)
        }
    })(request, {} as any)
}

export async function POST(request: NextRequest) {
    return withRole(['ADMIN', 'CONTADOR'], async (req, context) => {
        try {
            const body = await req.json()
            const data = facturaSchema.parse(body)

            // Fetch Estimacion to get amounts
            const estimacion = await prisma.estimacion.findUnique({
                where: { id: data.estimacionId },
                include: { conceptos: { include: { conceptoPresupuesto: true } } }
            })

            if (!estimacion || estimacion.obra.empresaId !== context.empresaId) {
                return NextResponse.json({ error: 'Estimación no encontrada' }, { status: 404 })
            }

            // Check if already invoiced
            // Implicitly handled if 1:1 relation constraint exists or logic check
            // We made estimacionId optional/unique in Factura? No, one-to-many?
            // Let's check manually
            const existing = await prisma.factura.findFirst({
                where: { estimacionId: data.estimacionId, estado: { not: 'CANCELADA' } }
            })
            if (existing) {
                return NextResponse.json({ error: 'La estimación ya tiene una factura activa' }, { status: 400 })
            }

            // Create Draft Invoice
            const factura = await prisma.factura.create({
                data: {
                    empresaId: context.empresaId,
                    clienteId: data.clienteId,
                    estimacionId: data.estimacionId,
                    folio: 0, // Placeholder
                    formaPago: data.formaPago,
                    metodoPago: data.metodoPago,
                    usoCfdi: data.usoCfdi,
                    subtotal: estimacion.importeNeto, // Using imported value. Ideally calculate from concepts
                    iva: Number(estimacion.importeNeto) * 0.16, // Simplified logic. Real tax calculation is complex
                    total: Number(estimacion.importeNeto) * 1.16,
                    estado: 'BORRADOR',
                    detalles: {
                        create: estimacion.conceptos.map(c => ({
                            claveSat: '84111506', // Servicios de facturación de obras (Generic)
                            descripcion: c.conceptoPresupuesto.descripcion,
                            cantidad: c.cantidadEjecutada,
                            valorUnitario: c.conceptoPresupuesto.precioUnitario,
                            importe: c.importe
                        }))
                    }
                }
            })

            return createdResponse(factura)

        } catch (error) {
            return handleApiError(error)
        }
    })(request, {} as any)
}

export async function PUT(request: NextRequest) {
    return withRole(['ADMIN', 'CONTADOR'], async (req, context) => {
        try {
            const body = await req.json()
            const { id, action } = body

            if (action === 'TIMBRAR') {
                const factura = await prisma.factura.findUnique({ where: { id } })
                if (!factura) return NextResponse.json({ error: 'No encontrado' }, { status: 404 })

                // Simulate Timbrado
                const timbre = await mockTimbrar(id)

                const updated = await prisma.factura.update({
                    where: { id },
                    data: {
                        uuid: timbre.uuid,
                        serie: timbre.serie,
                        folio: timbre.folio,
                        estado: 'TIMBRADA'
                    }
                })

                // Update Estimacion Status
                if (factura.estimacionId) {
                    await prisma.estimacion.update({
                        where: { id: factura.estimacionId },
                        data: { estado: 'FACTURADA' }
                    })
                }

                return successResponse(updated)
            }

            return NextResponse.json({ error: 'Acción inválida' }, { status: 400 })
        } catch (error) {
            return handleApiError(error)
        }
    })(request, {} as any)
}
