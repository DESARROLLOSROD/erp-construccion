import { redirect, notFound } from "next/navigation"
import { prisma } from "@/lib/prisma"
import { createServerClient } from "@/lib/supabase"
import { EstimacionDetailView } from "./estimacion-detail-view"
import { EstimacionConTotales } from "@/types/estimacion"

export default async function EstimacionDetailPage({ params }: { params: { id: string } }) {
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

    // Obtener estimación con conceptos
    const estimacionRaw = await prisma.estimacion.findFirst({
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
            presupuesto: {
                select: {
                    id: true,
                    version: true,
                    nombre: true,
                }
            },
            conceptos: {
                include: {
                    conceptoPresupuesto: {
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
                orderBy: {
                    conceptoPresupuesto: {
                        clave: 'asc'
                    }
                }
            }
        }
    })

    if (!estimacionRaw) {
        notFound()
    }

    // Convertir Decimals
    const conceptosConverted = estimacionRaw.conceptos.map(c => ({
        ...c,
        cantidadEjecutada: Number(c.cantidadEjecutada),
        cantidadAcumulada: Number(c.cantidadAcumulada),
        importe: Number(c.importe),
        conceptoPresupuesto: c.conceptoPresupuesto ? {
            ...c.conceptoPresupuesto,
            cantidad: Number(c.conceptoPresupuesto.cantidad),
            precioUnitario: Number(c.conceptoPresupuesto.precioUnitario),
        } : undefined
    }))

    const importeSubtotal = conceptosConverted.reduce((sum, c) => sum + c.importe, 0)
    const importeIVA = importeSubtotal * 0.16
    const importeRetencion = importeSubtotal * 0.05
    const importeNeto = importeSubtotal + importeIVA - importeRetencion

    const estimacion: EstimacionConTotales = {
        ...estimacionRaw,
        conceptos: conceptosConverted,
        totalConceptos: conceptosConverted.length,
        importeSubtotal,
        importeIVA,
        importeRetencion,
        importeNeto,
        importeTotal: importeSubtotal,
    }

    return (
        <EstimacionDetailView
            estimacion={estimacion}
        />
    )
}
