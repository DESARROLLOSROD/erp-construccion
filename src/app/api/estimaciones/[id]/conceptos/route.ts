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
            }
        })

        if (!estimacion) {
            return new NextResponse('Estimación no encontrada', { status: 404 })
        }

        const conceptos = await prisma.conceptoEstimacion.findMany({
            where: { estimacionId: params.id },
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
        })

        // Convertir Decimals
        const conceptosConverted = conceptos.map(c => ({
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

        return NextResponse.json(conceptosConverted)
    } catch (error) {
        console.error('[CONCEPTOS_ESTIMACION_GET]', error)
        return new NextResponse('Internal Error', { status: 500 })
    }
}

export async function POST(
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

        const body = await request.json()
        const { conceptoPresupuestoId, cantidadEjecutada } = body

        if (!conceptoPresupuestoId || cantidadEjecutada === undefined) {
            return new NextResponse('ConceptoPresupuestoId y CantidadEjecutada son requeridos', { status: 400 })
        }

        // Obtener el concepto del presupuesto para validar y calcular
        const conceptoPresupuesto = await prisma.conceptoPresupuesto.findUnique({
            where: { id: conceptoPresupuestoId }
        })

        if (!conceptoPresupuesto) {
            return new NextResponse('Concepto de presupuesto no encontrado', { status: 404 })
        }

        // Calcular cantidad acumulada (sumar cantidad de estimaciones anteriores)
        const estimacionesAnteriores = await prisma.estimacion.findMany({
            where: {
                obraId: estimacion.obraId,
                numero: { lt: estimacion.numero }
            },
            include: {
                conceptos: {
                    where: { conceptoPresupuestoId }
                }
            }
        })

        const cantidadAcumuladaAnterior = estimacionesAnteriores.reduce((sum, est) => {
            const concepto = est.conceptos[0]
            return sum + (concepto ? Number(concepto.cantidadEjecutada) : 0)
        }, 0)

        const cantidadAcumulada = cantidadAcumuladaAnterior + cantidadEjecutada

        // Validar que no exceda la cantidad presupuestada
        if (cantidadAcumulada > Number(conceptoPresupuesto.cantidad)) {
            return new NextResponse(
                `La cantidad acumulada (${cantidadAcumulada}) excede la cantidad presupuestada (${conceptoPresupuesto.cantidad})`,
                { status: 400 }
            )
        }

        // Calcular importe
        const importe = cantidadEjecutada * Number(conceptoPresupuesto.precioUnitario)

        const concepto = await prisma.conceptoEstimacion.create({
            data: {
                estimacionId: params.id,
                conceptoPresupuestoId,
                cantidadEjecutada,
                cantidadAcumulada,
                importe,
            },
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
        })

        const conceptoConverted = {
            ...concepto,
            cantidadEjecutada: Number(concepto.cantidadEjecutada),
            cantidadAcumulada: Number(concepto.cantidadAcumulada),
            importe: Number(concepto.importe),
            conceptoPresupuesto: concepto.conceptoPresupuesto ? {
                ...concepto.conceptoPresupuesto,
                cantidad: Number(concepto.conceptoPresupuesto.cantidad),
                precioUnitario: Number(concepto.conceptoPresupuesto.precioUnitario),
            } : undefined
        }

        return NextResponse.json(conceptoConverted)
    } catch (error) {
        console.error('[CONCEPTOS_ESTIMACION_POST]', error)
        return new NextResponse('Internal Error', { status: 500 })
    }
}
