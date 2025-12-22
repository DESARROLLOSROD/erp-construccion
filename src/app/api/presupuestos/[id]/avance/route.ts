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

        // Verificar que el presupuesto pertenezca a una obra de la empresa
        const presupuesto = await prisma.presupuesto.findFirst({
            where: {
                id: params.id,
                obra: { empresaId }
            },
            include: {
                conceptos: {
                    include: {
                        unidad: true
                    },
                    orderBy: { clave: 'asc' }
                }
            }
        })

        if (!presupuesto) {
            return new NextResponse('Presupuesto no encontrado', { status: 404 })
        }

        // Obtener todas las estimaciones de la obra
        const estimaciones = await prisma.estimacion.findMany({
            where: {
                obraId: presupuesto.obraId
            },
            include: {
                conceptos: true
            }
        })

        // Calcular avance por concepto
        const avance = presupuesto.conceptos.map(concepto => {
            // Sumar cantidades ejecutadas de todas las estimaciones
            const cantidadAcumulada = estimaciones.reduce((sum, est) => {
                const conceptoEst = est.conceptos.find(c => c.conceptoPresupuestoId === concepto.id)
                return sum + (conceptoEst ? Number(conceptoEst.cantidadEjecutada) : 0)
            }, 0)

            const cantidadPresupuesto = Number(concepto.cantidad)
            const cantidadPendiente = cantidadPresupuesto - cantidadAcumulada
            const porcentajeAvance = cantidadPresupuesto > 0 ? (cantidadAcumulada / cantidadPresupuesto) * 100 : 0

            const precioUnitario = Number(concepto.precioUnitario)
            const importePresupuesto = cantidadPresupuesto * precioUnitario
            const importeEjecutado = cantidadAcumulada * precioUnitario
            const importePendiente = cantidadPendiente * precioUnitario

            return {
                presupuestoId: presupuesto.id,
                conceptoPresupuestoId: concepto.id,
                clave: concepto.clave,
                descripcion: concepto.descripcion,
                unidad: concepto.unidad ? {
                    id: concepto.unidad.id,
                    nombre: concepto.unidad.nombre,
                    abreviatura: concepto.unidad.abreviatura,
                } : null,
                precioUnitario,
                cantidadPresupuesto,
                cantidadAcumulada,
                cantidadPendiente,
                porcentajeAvance,
                importePresupuesto,
                importeEjecutado,
                importePendiente,
            }
        })

        return NextResponse.json(avance)
    } catch (error) {
        console.error('[PRESUPUESTO_AVANCE_GET]', error)
        return new NextResponse('Internal Error', { status: 500 })
    }
}
