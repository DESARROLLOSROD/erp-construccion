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

        // Verificar que el presupuesto pertenezca a una obra de la empresa
        const presupuesto = await prisma.presupuesto.findFirst({
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
                conceptos: {
                    include: {
                        unidad: {
                            select: {
                                id: true,
                                nombre: true,
                                abreviatura: true,
                            }
                        }
                    },
                    orderBy: { clave: 'asc' }
                }
            }
        })

        if (!presupuesto) {
            return new NextResponse('Presupuesto no encontrado', { status: 404 })
        }

        // Convertir Decimals y calcular totales
        const conceptosConverted = presupuesto.conceptos.map(c => ({
            ...c,
            cantidad: Number(c.cantidad),
            precioUnitario: Number(c.precioUnitario),
            importe: Number(c.importe),
        }))

        const importeTotal = conceptosConverted.reduce((sum, c) => sum + c.importe, 0)

        const presupuestoConverted = {
            ...presupuesto,
            conceptos: conceptosConverted,
            totalConceptos: conceptosConverted.length,
            importeTotal,
        }

        return NextResponse.json(presupuestoConverted)
    } catch (error) {
        console.error('[PRESUPUESTO_GET]', error)
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

        // Verificar que el presupuesto pertenezca a una obra de la empresa
        const presupuestoExistente = await prisma.presupuesto.findFirst({
            where: {
                id: params.id,
                obra: { empresaId }
            }
        })

        if (!presupuestoExistente) {
            return new NextResponse('Presupuesto no encontrado', { status: 404 })
        }

        const body = await request.json()
        const { version, nombre, descripcion, esVigente } = body

        // Si se marca como vigente, desmarcar los demás
        if (esVigente && !presupuestoExistente.esVigente) {
            await prisma.presupuesto.updateMany({
                where: {
                    obraId: presupuestoExistente.obraId,
                    esVigente: true,
                    id: { not: params.id }
                },
                data: { esVigente: false }
            })
        }

        const presupuesto = await prisma.presupuesto.update({
            where: { id: params.id },
            data: {
                ...(version !== undefined && { version }),
                ...(nombre && { nombre }),
                ...(descripcion !== undefined && { descripcion }),
                ...(esVigente !== undefined && { esVigente }),
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
        console.error('[PRESUPUESTO_PUT]', error)
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

        // Verificar que el presupuesto pertenezca a una obra de la empresa
        const presupuesto = await prisma.presupuesto.findFirst({
            where: {
                id: params.id,
                obra: { empresaId }
            }
        })

        if (!presupuesto) {
            return new NextResponse('Presupuesto no encontrado', { status: 404 })
        }

        // Eliminar primero los conceptos
        await prisma.conceptoPresupuesto.deleteMany({
            where: { presupuestoId: params.id }
        })

        // Luego eliminar el presupuesto
        await prisma.presupuesto.delete({
            where: { id: params.id }
        })

        return new NextResponse(null, { status: 204 })
    } catch (error) {
        console.error('[PRESUPUESTO_DELETE]', error)
        return new NextResponse('Internal Error', { status: 500 })
    }
}
