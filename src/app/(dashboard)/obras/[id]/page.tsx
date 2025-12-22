import { redirect, notFound } from "next/navigation"
import { prisma } from "@/lib/prisma"
import { createServerClient } from "@/lib/supabase"
import { ObraDetailView } from "./obra-detail-view"
import { Obra } from "@/types/obra"
import { PresupuestoConTotales } from "@/types/presupuesto"

export default async function ObraDetailPage({ params }: { params: { id: string } }) {
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

    // Obtener obra
    const obraRaw = await prisma.obra.findFirst({
        where: {
            id: params.id,
            empresaId
        },
        include: {
            cliente: {
                select: {
                    id: true,
                    rfc: true,
                    razonSocial: true,
                    nombreComercial: true,
                }
            }
        }
    })

    if (!obraRaw) {
        notFound()
    }

    const obra: Obra = {
        ...obraRaw,
        montoContrato: Number(obraRaw.montoContrato),
        anticipoPct: Number(obraRaw.anticipoPct),
        retencionPct: Number(obraRaw.retencionPct),
    }

    // Obtener presupuestos de la obra
    const presupuestosRaw = await prisma.presupuesto.findMany({
        where: {
            obraId: params.id
        },
        include: {
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
        orderBy: { version: 'desc' }
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

    return (
        <ObraDetailView
            obra={obra}
            presupuestos={presupuestos}
        />
    )
}
