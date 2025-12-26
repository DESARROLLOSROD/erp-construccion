import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { cookies } from 'next/headers'
import { createServerClient } from '@supabase/ssr'

export async function GET(req: NextRequest) {
    try {
        const cookieStore = cookies()
        const supabase = createServerClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
            {
                cookies: {
                    get(name: string) {
                        return cookieStore.get(name)?.value
                    },
                },
            }
        )

        const {
            data: { session },
        } = await supabase.auth.getSession()
        if (!session) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

        const userEmpresa = await prisma.usuarioEmpresa.findFirst({
            where: { usuario: { authId: session.user.id }, activo: true },
        })

        if (!userEmpresa) {
            return NextResponse.json({ error: 'Usuario sin empresa' }, { status: 403 })
        }

        const empleados = await prisma.empleado.findMany({
            where: { empresaId: userEmpresa.empresaId },
            orderBy: { nombre: 'asc' },
        })

        return NextResponse.json(empleados)
    } catch (error) {
        console.error('Error fetching empleados:', error)
        return NextResponse.json({ error: 'Error al obtener empleados' }, { status: 500 })
    }
}

export async function POST(req: NextRequest) {
    try {
        const cookieStore = cookies()
        const supabase = createServerClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
            {
                cookies: {
                    get(name: string) {
                        return cookieStore.get(name)?.value
                    },
                },
            }
        )

        const {
            data: { session },
        } = await supabase.auth.getSession()
        if (!session) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

        const userEmpresa = await prisma.usuarioEmpresa.findFirst({
            where: { usuario: { authId: session.user.id }, activo: true },
        })

        if (!userEmpresa) {
            return NextResponse.json({ error: 'Usuario sin empresa' }, { status: 403 })
        }

        const body = await req.json()
        const { nombre, puesto, salarioDiario, telefono } = body

        const empleado = await prisma.empleado.create({
            data: {
                empresaId: userEmpresa.empresaId,
                nombre,
                puesto,
                salarioDiario,
                telefono,
            },
        })

        return NextResponse.json(empleado)
    } catch (error) {
        console.error('Error creating empleado:', error)
        return NextResponse.json({ error: 'Error al crear empleado' }, { status: 500 })
    }
}
