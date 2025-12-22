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

        const categorias = await prisma.categoria.findMany({
            where: { empresaId },
            orderBy: { nombre: 'asc' }
        })

        return NextResponse.json(categorias)
    } catch (error) {
        console.error('[CATEGORIAS_GET]', error)
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

        const { nombre, descripcion, color } = body

        if (!nombre) {
            return new NextResponse('Nombre es requerido', { status: 400 })
        }

        // Validar duplicados
        const existing = await prisma.categoria.findFirst({
            where: {
                empresaId,
                nombre,
            }
        })

        if (existing) {
            return new NextResponse('Ya existe una categoría con este nombre', { status: 409 })
        }

        const categoria = await prisma.categoria.create({
            data: {
                empresaId,
                nombre,
                descripcion,
                color,
            }
        })

        return NextResponse.json(categoria)
    } catch (error) {
        console.error('[CATEGORIAS_POST]', error)
        return new NextResponse('Internal Error', { status: 500 })
    }
}
