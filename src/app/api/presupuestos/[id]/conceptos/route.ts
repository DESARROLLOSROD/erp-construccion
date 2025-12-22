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
            }
        })

        if (!presupuesto) {
            return new NextResponse('Presupuesto no encontrado', { status: 404 })
        }

        const conceptos = await prisma.conceptoPresupuesto.findMany({
            where: { presupuestoId: params.id },
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
        })

        // Convertir Decimals
        const conceptosConverted = conceptos.map(c => ({
            ...c,
            cantidad: Number(c.cantidad),
            precioUnitario: Number(c.precioUnitario),
            importe: Number(c.importe),
        }))

        return NextResponse.json(conceptosConverted)
    } catch (error) {
        console.error('[CONCEPTOS_GET]', error)
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

        const body = await request.json()
        const { clave, descripcion, unidadId, cantidad, precioUnitario } = body

        if (!clave || !descripcion || cantidad === undefined || precioUnitario === undefined) {
            return new NextResponse('Clave, Descripción, Cantidad y Precio Unitario son requeridos', { status: 400 })
        }

        // Calcular importe
        const importe = cantidad * precioUnitario

        const concepto = await prisma.conceptoPresupuesto.create({
            data: {
                presupuestoId: params.id,
                clave: clave.toUpperCase(),
                descripcion,
                unidadId: unidadId || null,
                cantidad,
                precioUnitario,
                importe,
            },
            include: {
                unidad: {
                    select: {
                        id: true,
                        nombre: true,
                        abreviatura: true,
                    }
                }
            }
        })

        const conceptoConverted = {
            ...concepto,
            cantidad: Number(concepto.cantidad),
            precioUnitario: Number(concepto.precioUnitario),
            importe: Number(concepto.importe),
        }

        return NextResponse.json(conceptoConverted)
    } catch (error) {
        console.error('[CONCEPTOS_POST]', error)
        return new NextResponse('Internal Error', { status: 500 })
    }
}
