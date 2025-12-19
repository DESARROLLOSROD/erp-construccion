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

        const cliente = await prisma.cliente.findFirst({
            where: {
                id: params.id,
                empresaId
            }
        })

        if (!cliente) {
            return new NextResponse('Cliente no encontrado', { status: 404 })
        }

        return NextResponse.json(cliente)
    } catch (error) {
        console.error('[CLIENTE_GET_ID]', error)
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
        const body = await request.json()

        // Verificar que el cliente exista y pertenezca a la empresa
        const existing = await prisma.cliente.findFirst({
            where: { id: params.id, empresaId }
        })

        if (!existing) {
            return new NextResponse('Cliente no encontrado', { status: 404 })
        }

        const cliente = await prisma.cliente.update({
            where: { id: params.id },
            data: {
                codigo: body.codigo,
                rfc: body.rfc?.toUpperCase(),
                razonSocial: body.razonSocial,
                nombreComercial: body.nombreComercial,
                regimenFiscal: body.regimenFiscal,
                usoCfdi: body.usoCfdi,
                calle: body.calle,
                numExterior: body.numExterior,
                numInterior: body.numInterior,
                colonia: body.colonia,
                codigoPostal: body.codigoPostal,
                municipio: body.municipio,
                estado: body.estado,
                pais: body.pais,
                email: body.email,
                telefono: body.telefono,
                contacto: body.contacto,
                // No permitimos cambiar empresaId ni createdAt
            }
        })

        return NextResponse.json(cliente)
    } catch (error) {
        console.error('[CLIENTE_PUT]', error)
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

        // Verificar existencia
        const existing = await prisma.cliente.findFirst({
            where: { id: params.id, empresaId }
        })

        if (!existing) {
            return new NextResponse('Cliente no encontrado', { status: 404 })
        }

        // Soft delete
        const cliente = await prisma.cliente.update({
            where: { id: params.id },
            data: { activo: false }
        })

        return NextResponse.json(cliente)
    } catch (error) {
        console.error('[CLIENTE_DELETE]', error)
        return new NextResponse('Internal Error', { status: 500 })
    }
}
