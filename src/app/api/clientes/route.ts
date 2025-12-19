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

        const clientes = await prisma.cliente.findMany({
            where: {
                empresaId,
                activo: true
            },
            orderBy: { updatedAt: 'desc' }
        })

        return NextResponse.json(clientes)
    } catch (error) {
        console.error('[CLIENTES_GET]', error)
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

        const {
            codigo,
            rfc,
            razonSocial,
            nombreComercial,
            regimenFiscal,
            usoCfdi,
            calle,
            numExterior,
            numInterior,
            colonia,
            codigoPostal,
            municipio,
            estado,
            pais,
            email,
            telefono,
            contacto
        } = body

        if (!rfc || !razonSocial) {
            return new NextResponse('RFC y Razón Social son requeridos', { status: 400 })
        }

        // Validar duplicados
        const existing = await prisma.cliente.findFirst({
            where: {
                empresaId,
                rfc,
                activo: true
            }
        })

        if (existing) {
            return new NextResponse('Ya existe un cliente activo con este RFC', { status: 409 })
        }

        const cliente = await prisma.cliente.create({
            data: {
                empresaId,
                codigo,
                rfc: rfc.toUpperCase(),
                razonSocial,
                nombreComercial,
                regimenFiscal,
                usoCfdi,
                calle,
                numExterior,
                numInterior,
                colonia,
                codigoPostal,
                municipio,
                estado,
                pais: pais || 'MEX',
                email,
                telefono,
                contacto
            }
        })

        return NextResponse.json(cliente)
    } catch (error) {
        console.error('[CLIENTES_POST]', error)
        return new NextResponse('Internal Error', { status: 500 })
    }
}
