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

        const proveedor = await prisma.proveedor.findFirst({
            where: {
                id: params.id,
                empresaId
            }
        })

        if (!proveedor) {
            return new NextResponse('Proveedor no encontrado', { status: 404 })
        }

        return NextResponse.json(proveedor)
    } catch (error) {
        console.error('[PROVEEDOR_GET_ID]', error)
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

        // Verificar que el proveedor exista y pertenezca a la empresa
        const existing = await prisma.proveedor.findFirst({
            where: { id: params.id, empresaId }
        })

        if (!existing) {
            return new NextResponse('Proveedor no encontrado', { status: 404 })
        }

        const proveedor = await prisma.proveedor.update({
            where: { id: params.id },
            data: {
                codigo: body.codigo,
                rfc: body.rfc?.toUpperCase(),
                razonSocial: body.razonSocial,
                nombreComercial: body.nombreComercial,
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
                banco: body.banco,
                cuenta: body.cuenta,
                clabe: body.clabe,
            }
        })

        return NextResponse.json(proveedor)
    } catch (error) {
        console.error('[PROVEEDOR_PUT]', error)
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
        const existing = await prisma.proveedor.findFirst({
            where: { id: params.id, empresaId }
        })

        if (!existing) {
            return new NextResponse('Proveedor no encontrado', { status: 404 })
        }

        // Soft delete
        const proveedor = await prisma.proveedor.update({
            where: { id: params.id },
            data: { activo: false }
        })

        return NextResponse.json(proveedor)
    } catch (error) {
        console.error('[PROVEEDOR_DELETE]', error)
        return new NextResponse('Internal Error', { status: 500 })
    }
}
