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

        const unidades = await prisma.unidad.findMany({
            where: { empresaId },
            orderBy: { nombre: 'asc' }
        })

        return NextResponse.json(unidades)
    } catch (error) {
        console.error('[UNIDADES_GET]', error)
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

        const { nombre, abreviatura, claveSat } = body

        if (!nombre || !abreviatura) {
            return new NextResponse('Nombre y Abreviatura son requeridos', { status: 400 })
        }

        // Validar duplicados
        const existing = await prisma.unidad.findFirst({
            where: {
                empresaId,
                abreviatura: abreviatura.toUpperCase(),
            }
        })

        if (existing) {
            return new NextResponse('Ya existe una unidad con esta abreviatura', { status: 409 })
        }

        const unidad = await prisma.unidad.create({
            data: {
                empresaId,
                nombre,
                abreviatura: abreviatura.toUpperCase(),
                claveSat,
            }
        })

        return NextResponse.json(unidad)
    } catch (error) {
        console.error('[UNIDADES_POST]', error)
        return new NextResponse('Internal Error', { status: 500 })
    }
}
