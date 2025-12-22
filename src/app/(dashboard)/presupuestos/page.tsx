import { redirect } from "next/navigation"
import { prisma } from "@/lib/prisma"
import { createServerClient } from "@/lib/supabase"
import { PresupuestosView } from "./presupuestos-view"
import { PresupuestoConTotales } from "@/types/presupuesto"
import { ObraListItem } from "@/types/obra"

export default async function PresupuestosPage() {
    const supabase = createServerClient()
    const { data: { session } } = await supabase.auth.getSession()

    if (!session) {
        redirect('/login')
    }

    const usuario = await prisma.usuario.findUnique({
        where: { authId: session.user.id },
        include: { empresas: true }
    })

    if (!usuario || usuario.empresas.length === 0) {
        redirect('/login')
    }

    const empresaId = usuario.empresas[0].empresaId

    // Obtener presupuestos con sus conceptos y obras
    const presupuestosRaw = await prisma.presupuesto.findMany({
        where: {
            obra: { empresaId }
        },
        include: {
            obra: {
                select: {
                    id: true,
                    codigo: true,
                    nombre: true,
                }
            },
            conceptos: {
                include: {
                    unidad: {
                        select: {
                            id: true,
                            nombre: true,
                            abreviatura: true,
                        }
                    }
                }
            }
        },
        orderBy: { updatedAt: 'desc' }
    })

    // Convertir Decimals y calcular totales
    const presupuestos: PresupuestoConTotales[] = presupuestosRaw.map(p => {
        const conceptosConverted = p.conceptos.map(c => ({
            ...c,
            cantidad: Number(c.cantidad),
            precioUnitario: Number(c.precioUnitario),
            importe: Number(c.importe),
        }))

        const importeTotal = conceptosConverted.reduce((sum, c) => sum + c.importe, 0)

        return {
            ...p,
            conceptos: conceptosConverted,
            totalConceptos: conceptosConverted.length,
            importeTotal,
        }
    })

    // Obtener obras para el formulario
    const obrasRaw = await prisma.obra.findMany({
        where: {
            empresaId,
            estado: { in: ['COTIZACION', 'CONTRATADA', 'EN_PROCESO'] }
        },
        include: {
            cliente: {
                select: {
                    id: true,
                    rfc: true,
                    razonSocial: true,
                }
            }
        },
        orderBy: { codigo: 'asc' }
    })

    const obras: ObraListItem[] = obrasRaw.map(obra => ({
        ...obra,
        montoContrato: Number(obra.montoContrato),
        anticipoPct: Number(obra.anticipoPct),
        retencionPct: Number(obra.retencionPct),
    }))

    // Obtener unidades para los conceptos
    const unidades = await prisma.unidad.findMany({
        where: { empresaId },
        orderBy: { nombre: 'asc' }
    })

    return (
        <PresupuestosView
            presupuestos={presupuestos}
            obras={obras}
            unidades={unidades}
        />
    )
}
