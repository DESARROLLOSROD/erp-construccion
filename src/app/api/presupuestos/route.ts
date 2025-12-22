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

        const presupuestos = await prisma.presupuesto.findMany({
            where: {
                obra: { empresaId },
                ...(obraId && { obraId }),
            },
            include: {
                obra: {
                    select: {
                        id: true,
                        codigo: true,
                        nombre: true,
                    }
                },
                conceptos: {
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
            orderBy: { updatedAt: 'desc' }
        })

        // Convertir Decimals y agregar totales
        const presupuestosConverted = presupuestos.map(p => {
            const conceptosConverted = p.conceptos.map(c => ({
                ...c,
                cantidad: Number(c.cantidad),
                precioUnitario: Number(c.precioUnitario),
                importe: Number(c.importe),
            }))

            const importeTotal = conceptosConverted.reduce((sum, c) => sum + c.importe, 0)

            return {
                ...p,
                conceptos: conceptosConverted,
                totalConceptos: conceptosConverted.length,
                importeTotal,
            }
        })

        return NextResponse.json(presupuestosConverted)
    } catch (error) {
        console.error('[PRESUPUESTOS_GET]', error)
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

        const { obraId, version, nombre, descripcion, esVigente } = body

        if (!obraId || !nombre) {
            return new NextResponse('ObraId y Nombre son requeridos', { status: 400 })
        }

        // Verificar que la obra pertenezca a la empresa
        const obra = await prisma.obra.findFirst({
            where: { id: obraId, empresaId }
        })

        if (!obra) {
            return new NextResponse('Obra no encontrada o no pertenece a tu empresa', { status: 404 })
        }

        // Si esVigente es true, marcar otros como no vigentes
        if (esVigente) {
            await prisma.presupuesto.updateMany({
                where: { obraId, esVigente: true },
                data: { esVigente: false }
            })
        }

        const presupuesto = await prisma.presupuesto.create({
            data: {
                obraId,
                version: version || 1,
                nombre,
                descripcion,
                esVigente: esVigente !== undefined ? esVigente : true,
            },
            include: {
                obra: {
                    select: {
                        id: true,
                        codigo: true,
                        nombre: true,
                    }
                }
            }
        })

        return NextResponse.json(presupuesto)
    } catch (error) {
        console.error('[PRESUPUESTOS_POST]', error)
        return new NextResponse('Internal Error', { status: 500 })
    }
}
