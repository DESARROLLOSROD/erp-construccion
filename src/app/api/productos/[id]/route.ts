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

        const producto = await prisma.producto.findFirst({
            where: {
                id: params.id,
                empresaId
            },
            include: {
                categoria: true,
                unidad: true,
            }
        })

        if (!producto) {
            return new NextResponse('Producto no encontrado', { status: 404 })
        }

        const productoConverted = {
            ...producto,
            precioCompra: Number(producto.precioCompra),
            precioVenta: Number(producto.precioVenta),
            stockMinimo: Number(producto.stockMinimo),
            stockActual: Number(producto.stockActual),
        }

        return NextResponse.json(productoConverted)
    } catch (error) {
        console.error('[PRODUCTO_GET_ID]', error)
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

        // Verificar que el producto exista y pertenezca a la empresa
        const existing = await prisma.producto.findFirst({
            where: { id: params.id, empresaId }
        })

        if (!existing) {
            return new NextResponse('Producto no encontrado', { status: 404 })
        }

        const producto = await prisma.producto.update({
            where: { id: params.id },
            data: {
                codigo: body.codigo?.toUpperCase(),
                descripcion: body.descripcion,
                categoriaId: body.categoriaId || null,
                unidadId: body.unidadId || null,
                claveSat: body.claveSat,
                claveUnidadSat: body.claveUnidadSat,
                precioCompra: body.precioCompra,
                precioVenta: body.precioVenta,
                esServicio: body.esServicio,
                controlStock: body.controlStock,
                stockMinimo: body.stockMinimo,
                stockActual: body.stockActual,
            },
            include: {
                categoria: {
                    select: {
                        id: true,
                        nombre: true,
                        color: true,
                    }
                },
                unidad: {
                    select: {
                        id: true,
                        nombre: true,
                        abreviatura: true,
                    }
                }
            }
        })

        const productoConverted = {
            ...producto,
            precioCompra: Number(producto.precioCompra),
            precioVenta: Number(producto.precioVenta),
            stockMinimo: Number(producto.stockMinimo),
            stockActual: Number(producto.stockActual),
        }

        return NextResponse.json(productoConverted)
    } catch (error) {
        console.error('[PRODUCTO_PUT]', error)
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
        const existing = await prisma.producto.findFirst({
            where: { id: params.id, empresaId }
        })

        if (!existing) {
            return new NextResponse('Producto no encontrado', { status: 404 })
        }

        // Soft delete
        const producto = await prisma.producto.update({
            where: { id: params.id },
            data: { activo: false }
        })

        return NextResponse.json(producto)
    } catch (error) {
        console.error('[PRODUCTO_DELETE]', error)
        return new NextResponse('Internal Error', { status: 500 })
    }
}
