import { redirect, notFound } from "next/navigation"
import { prisma } from "@/lib/prisma"
import { createServerClient } from "@/lib/supabase"
import { PresupuestoDetailView } from "./presupuesto-detail-view"
import { PresupuestoConTotales } from "@/types/presupuesto"

export default async function PresupuestoDetailPage({ params }: { params: { id: string } }) {
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

    // Obtener presupuesto con conceptos
    const presupuestoRaw = await prisma.presupuesto.findFirst({
        where: {
            id: params.id,
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
                },
                orderBy: { clave: 'asc' }
            }
        }
    })

    if (!presupuestoRaw) {
        notFound()
    }

    // Convertir Decimals
    const conceptosConverted = presupuestoRaw.conceptos.map(c => ({
        ...c,
        cantidad: Number(c.cantidad),
        precioUnitario: Number(c.precioUnitario),
        importe: Number(c.importe),
    }))

    const importeTotal = conceptosConverted.reduce((sum, c) => sum + c.importe, 0)

    const presupuesto: PresupuestoConTotales = {
        ...presupuestoRaw,
        conceptos: conceptosConverted,
        totalConceptos: conceptosConverted.length,
        importeTotal,
    }

    // Obtener unidades para el formulario de conceptos
    const unidades = await prisma.unidad.findMany({
        where: { empresaId },
        orderBy: { nombre: 'asc' }
    })

    return (
        <PresupuestoDetailView
            presupuesto={presupuesto}
            unidades={unidades}
        />
    )
}
