import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { createServerClient } from '@/lib/supabase'

export async function GET(
    request: Request,
    { params }: { params: { id: string } }
) {
    try {
        const supabase = createServerClient()
        const { data: { session } } = await supabase.auth.getSession()

        if (!session) {
            return new NextResponse('Unauthorized', { status: 401 })
        }

        const usuario = await prisma.usuario.findUnique({
            where: { authId: session.user.id },
            include: { empresas: true }
        })

        if (!usuario || usuario.empresas.length === 0) {
            return new NextResponse('Usuario no asignado a ninguna empresa', { status: 403 })
        }

        const empresaId = usuario.empresas[0].empresaId

        // Verificar que la estimación pertenezca a una obra de la empresa
        const estimacion = await prisma.estimacion.findFirst({
            where: {
                id: params.id,
                obra: { empresaId }
            },
            include: {
                obra: {
                    select: {
                        id: true,
                        codigo: true,
                        nombre: true,
                    }
                },
                presupuesto: {
                    select: {
                        id: true,
                        version: true,
                        nombre: true,
                    }
                },
                conceptos: {
                    include: {
                        conceptoPresupuesto: {
                            include: {
                                unidad: {
                                    select: {
                                        id: true,
                                        nombre: true,
                                        abreviatura: true,
                                    }
                                }
                            }
                        }
                    },
                    orderBy: {
                        conceptoPresupuesto: {
                            clave: 'asc'
                        }
                    }
                }
            }
        })

        if (!estimacion) {
            return new NextResponse('Estimación no encontrada', { status: 404 })
        }

        // Convertir Decimals y calcular totales
        const conceptosConverted = estimacion.conceptos.map(c => ({
            ...c,
            cantidadEjecutada: Number(c.cantidadEjecutada),
            cantidadAcumulada: Number(c.cantidadAcumulada),
            importe: Number(c.importe),
            conceptoPresupuesto: c.conceptoPresupuesto ? {
                ...c.conceptoPresupuesto,
                cantidad: Number(c.conceptoPresupuesto.cantidad),
                precioUnitario: Number(c.conceptoPresupuesto.precioUnitario),
            } : undefined
        }))

        const importeSubtotal = conceptosConverted.reduce((sum, c) => sum + c.importe, 0)
        const importeIVA = importeSubtotal * 0.16
        const importeRetencion = importeSubtotal * 0.05
        const importeNeto = importeSubtotal + importeIVA - importeRetencion

        const estimacionConverted = {
            ...estimacion,
            conceptos: conceptosConverted,
            totalConceptos: conceptosConverted.length,
            importeSubtotal,
            importeIVA,
            importeRetencion,
            importeNeto,
            importeTotal: importeSubtotal,
        }

        return NextResponse.json(estimacionConverted)
    } catch (error) {
        console.error('[ESTIMACION_GET]', error)
        return new NextResponse('Internal Error', { status: 500 })
    }
}

export async function PUT(
    request: Request,
    { params }: { params: { id: string } }
) {
    try {
        const supabase = createServerClient()
        const { data: { session } } = await supabase.auth.getSession()

        if (!session) {
            return new NextResponse('Unauthorized', { status: 401 })
        }

        const usuario = await prisma.usuario.findUnique({
            where: { authId: session.user.id },
            include: { empresas: true }
        })

        if (!usuario || usuario.empresas.length === 0) {
            return new NextResponse('Usuario no asignado a ninguna empresa', { status: 403 })
        }

        const empresaId = usuario.empresas[0].empresaId

        // Verificar que la estimación pertenezca a una obra de la empresa
        const estimacionExistente = await prisma.estimacion.findFirst({
            where: {
                id: params.id,
                obra: { empresaId }
            }
        })

        if (!estimacionExistente) {
            return new NextResponse('Estimación no encontrada', { status: 404 })
        }

        const body = await request.json()
        const { numero, periodo, fechaInicio, fechaFin, descripcion, estado } = body

        const estimacion = await prisma.estimacion.update({
            where: { id: params.id },
            data: {
                ...(numero !== undefined && { numero }),
                ...(periodo && { periodo }),
                ...(fechaInicio && { fechaInicio: new Date(fechaInicio) }),
                ...(fechaFin && { fechaFin: new Date(fechaFin) }),
                ...(descripcion !== undefined && { descripcion }),
                ...(estado && { estado }),
            },
            include: {
                obra: {
                    select: {
                        id: true,
                        codigo: true,
                        nombre: true,
                    }
                },
                presupuesto: {
                    select: {
                        id: true,
                        version: true,
                        nombre: true,
                    }
                }
            }
        })

        return NextResponse.json(estimacion)
    } catch (error) {
        console.error('[ESTIMACION_PUT]', error)
        return new NextResponse('Internal Error', { status: 500 })
    }
}

export async function DELETE(
    request: Request,
    { params }: { params: { id: string } }
) {
    try {
        const supabase = createServerClient()
        const { data: { session } } = await supabase.auth.getSession()

        if (!session) {
            return new NextResponse('Unauthorized', { status: 401 })
        }

        const usuario = await prisma.usuario.findUnique({
            where: { authId: session.user.id },
            include: { empresas: true }
        })

        if (!usuario || usuario.empresas.length === 0) {
            return new NextResponse('Usuario no asignado a ninguna empresa', { status: 403 })
        }

        const empresaId = usuario.empresas[0].empresaId

        // Verificar que la estimación pertenezca a una obra de la empresa
        const estimacion = await prisma.estimacion.findFirst({
            where: {
                id: params.id,
                obra: { empresaId }
            }
        })

        if (!estimacion) {
            return new NextResponse('Estimación no encontrada', { status: 404 })
        }

        // No permitir eliminar estimaciones facturadas
        if (estimacion.estado === 'FACTURADA') {
            return new NextResponse('No se puede eliminar una estimación facturada', { status: 400 })
        }

        // Eliminar primero los conceptos
        await prisma.conceptoEstimacion.deleteMany({
            where: { estimacionId: params.id }
        })

        // Luego eliminar la estimación
        await prisma.estimacion.delete({
            where: { id: params.id }
        })

        return new NextResponse(null, { status: 204 })
    } catch (error) {
        console.error('[ESTIMACION_DELETE]', error)
        return new NextResponse('Internal Error', { status: 500 })
    }
}
