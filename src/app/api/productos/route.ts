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
        const categoriaId = searchParams.get('categoriaId')
        const esServicio = searchParams.get('esServicio')

        const productos = await prisma.producto.findMany({
            where: {
                empresaId,
                activo: true,
                ...(categoriaId && { categoriaId }),
                ...(esServicio !== null && { esServicio: esServicio === 'true' }),
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
            },
            orderBy: { codigo: 'asc' }
        })

        // Convertir Decimals a números
        const productosConverted = productos.map(p => ({
            ...p,
            precioCompra: Number(p.precioCompra),
            precioVenta: Number(p.precioVenta),
            stockMinimo: Number(p.stockMinimo),
            stockActual: Number(p.stockActual),
        }))

        return NextResponse.json(productosConverted)
    } catch (error) {
        console.error('[PRODUCTOS_GET]', error)
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
            descripcion,
            categoriaId,
            unidadId,
            claveSat,
            claveUnidadSat,
            precioCompra,
            precioVenta,
            esServicio,
            controlStock,
            stockMinimo,
            stockActual
        } = body

        if (!codigo || !descripcion) {
            return new NextResponse('Código y Descripción son requeridos', { status: 400 })
        }

        // Validar duplicados de código
        const existing = await prisma.producto.findFirst({
            where: {
                empresaId,
                codigo: codigo.toUpperCase(),
            }
        })

        if (existing) {
            return new NextResponse('Ya existe un producto con este código', { status: 409 })
        }

        const producto = await prisma.producto.create({
            data: {
                empresaId,
                codigo: codigo.toUpperCase(),
                descripcion,
                categoriaId: categoriaId || null,
                unidadId: unidadId || null,
                claveSat,
                claveUnidadSat,
                precioCompra: precioCompra || 0,
                precioVenta: precioVenta || 0,
                esServicio: esServicio || false,
                controlStock: controlStock !== undefined ? controlStock : true,
                stockMinimo: stockMinimo || 0,
                stockActual: stockActual || 0,
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

        // Convertir Decimals
        const productoConverted = {
            ...producto,
            precioCompra: Number(producto.precioCompra),
            precioVenta: Number(producto.precioVenta),
            stockMinimo: Number(producto.stockMinimo),
            stockActual: Number(producto.stockActual),
        }

        return NextResponse.json(productoConverted)
    } catch (error) {
        console.error('[PRODUCTOS_POST]', error)
        return new NextResponse('Internal Error', { status: 500 })
    }
}
