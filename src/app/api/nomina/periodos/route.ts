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

        const periodos = await prisma.periodoNomina.findMany({
            where: { empresaId: userEmpresa.empresaId },
            include: {
                obra: { select: { nombre: true } },
                detalles: { include: { empleado: true } },
            },
            orderBy: [{ anio: 'desc' }, { semana: 'desc' }],
        })

        return NextResponse.json(periodos)
    } catch (error) {
        console.error('Error fetching periodos:', error)
        return NextResponse.json({ error: 'Error al obtener periodos' }, { status: 500 })
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
        const { tipoPeriodo, semana, quincena, mes, anio, fechaInicio, fechaFin, obraId } = body

        const periodo = await prisma.periodoNomina.create({
            data: {
                empresaId: userEmpresa.empresaId,
                tipoPeriodo,
                semana: semana || null,
                quincena: quincena || null,
                mes: mes || null,
                anio,
                fechaInicio: new Date(fechaInicio),
                fechaFin: new Date(fechaFin),
                obraId: obraId || null,
            },
        })

        return NextResponse.json(periodo)
    } catch (error) {
        console.error('Error creating periodo:', error)
        return NextResponse.json({ error: 'Error al crear periodo' }, { status: 500 })
    }
}
