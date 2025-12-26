import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { cookies } from 'next/headers'
import { createServerClient } from '@supabase/ssr'

export async function GET(
    req: NextRequest,
    { params }: { params: { id: string } }
) {
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

        const periodo = await prisma.periodoNomina.findUnique({
            where: { id: params.id },
            include: {
                obra: true,
                detalles: {
                    include: { empleado: true },
                    orderBy: { empleado: { nombre: 'asc' } },
                },
            },
        })

        if (!periodo) {
            return NextResponse.json({ error: 'Periodo no encontrado' }, { status: 404 })
        }

        return NextResponse.json(periodo)
    } catch (error) {
        console.error('Error fetching periodo:', error)
        return NextResponse.json({ error: 'Error al obtener periodo' }, { status: 500 })
    }
}

export async function PUT(
    req: NextRequest,
    { params }: { params: { id: string } }
) {
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

        const body = await req.json()
        const { detalles, estado } = body

        // Update or create detalles
        if (detalles && Array.isArray(detalles)) {
            for (const detalle of detalles) {
                const importeBase = Number(detalle.diasTrabajados) * Number(detalle.salarioDiario)
                const totalPagar = importeBase + Number(detalle.extras || 0) - Number(detalle.deducciones || 0)

                if (detalle.id) {
                    await prisma.detalleNomina.update({
                        where: { id: detalle.id },
                        data: {
                            diasTrabajados: detalle.diasTrabajados,
                            salarioDiario: detalle.salarioDiario,
                            importeBase,
                            extras: detalle.extras || 0,
                            deducciones: detalle.deducciones || 0,
                            totalPagar,
                            notas: detalle.notas,
                        },
                    })
                } else {
                    await prisma.detalleNomina.create({
                        data: {
                            periodoNominaId: params.id,
                            empleadoId: detalle.empleadoId,
                            diasTrabajados: detalle.diasTrabajados,
                            salarioDiario: detalle.salarioDiario,
                            importeBase,
                            extras: detalle.extras || 0,
                            deducciones: detalle.deducciones || 0,
                            totalPagar,
                            notas: detalle.notas,
                        },
                    })
                }
            }
        }

        // Calculate total
        const allDetalles = await prisma.detalleNomina.findMany({
            where: { periodoNominaId: params.id },
        })

        const total = allDetalles.reduce((sum, d) => sum + Number(d.totalPagar), 0)

        const periodo = await prisma.periodoNomina.update({
            where: { id: params.id },
            data: {
                total,
                estado: estado || undefined,
            },
            include: {
                obra: true,
                detalles: {
                    include: { empleado: true },
                },
            },
        })

        return NextResponse.json(periodo)
    } catch (error) {
        console.error('Error updating periodo:', error)
        return NextResponse.json({ error: 'Error al actualizar periodo' }, { status: 500 })
    }
}
