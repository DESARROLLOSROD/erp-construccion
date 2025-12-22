import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { createServerClient } from '@/lib/supabase'

export async function GET(request: Request) {
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

        // Obtener parámetros de query
        const { searchParams } = new URL(request.url)
        const obraId = searchParams.get('obraId')
        const presupuestoId = searchParams.get('presupuestoId')

        const estimaciones = await prisma.estimacion.findMany({
            where: {
                obra: { empresaId },
                ...(obraId && { obraId }),
                ...(presupuestoId && { presupuestoId }),
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
                    }
                }
            },
            orderBy: { numero: 'desc' }
        })

        // Convertir Decimals y calcular totales
        const estimacionesConverted = estimaciones.map(e => {
            const conceptosConverted = e.conceptos.map(c => ({
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
            const importeRetencion = importeSubtotal * 0.05 // 5% retención típica en construcción
            const importeNeto = importeSubtotal + importeIVA - importeRetencion

            return {
                ...e,
                conceptos: conceptosConverted,
                totalConceptos: conceptosConverted.length,
                importeSubtotal,
                importeIVA,
                importeRetencion,
                importeNeto,
                importeTotal: importeSubtotal,
            }
        })

        return NextResponse.json(estimacionesConverted)
    } catch (error) {
        console.error('[ESTIMACIONES_GET]', error)
        return new NextResponse('Internal Error', { status: 500 })
    }
}

export async function POST(request: Request) {
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
        const body = await request.json()

        const { obraId, presupuestoId, numero, periodo, fechaInicio, fechaFin, descripcion, estado } = body

        if (!obraId || !presupuestoId || !periodo || !fechaInicio || !fechaFin) {
            return new NextResponse('ObraId, PresupuestoId, Periodo, FechaInicio y FechaFin son requeridos', { status: 400 })
        }

        // Verificar que la obra pertenezca a la empresa
        const obra = await prisma.obra.findFirst({
            where: { id: obraId, empresaId }
        })

        if (!obra) {
            return new NextResponse('Obra no encontrada o no pertenece a tu empresa', { status: 404 })
        }

        // Verificar que el presupuesto pertenezca a la obra
        const presupuesto = await prisma.presupuesto.findFirst({
            where: { id: presupuestoId, obraId }
        })

        if (!presupuesto) {
            return new NextResponse('Presupuesto no encontrado o no pertenece a la obra', { status: 404 })
        }

        // Si no se proporciona número, obtener el siguiente
        let numeroEstimacion = numero
        if (!numeroEstimacion) {
            const ultimaEstimacion = await prisma.estimacion.findFirst({
                where: { obraId },
                orderBy: { numero: 'desc' }
            })
            numeroEstimacion = (ultimaEstimacion?.numero || 0) + 1
        }

        const estimacion = await prisma.estimacion.create({
            data: {
                obraId,
                presupuestoId,
                numero: numeroEstimacion,
                periodo,
                fechaInicio: new Date(fechaInicio),
                fechaFin: new Date(fechaFin),
                descripcion,
                estado: estado || 'BORRADOR',
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
        console.error('[ESTIMACIONES_POST]', error)
        return new NextResponse('Internal Error', { status: 500 })
    }
}
