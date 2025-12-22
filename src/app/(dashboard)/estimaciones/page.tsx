import { redirect } from "next/navigation"
import { prisma } from "@/lib/prisma"
import { createServerClient } from "@/lib/supabase"
import { EstimacionesView } from "./estimaciones-view"
import { EstimacionConTotales } from "@/types/estimacion"
import { ObraListItem } from "@/types/obra"
import { Presupuesto } from "@/types/presupuesto"

export default async function EstimacionesPage() {
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

    // Obtener estimaciones con sus conceptos
    const estimacionesRaw = await prisma.estimacion.findMany({
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
                }
            }
        },
        orderBy: { numero: 'desc' }
    })

    // Convertir Decimals y calcular totales
    const estimaciones: EstimacionConTotales[] = estimacionesRaw.map(e => {
        const conceptosConverted = e.conceptos.map(c => ({
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

        return {
            ...e,
            conceptos: conceptosConverted,
            totalConceptos: conceptosConverted.length,
            importeSubtotal,
            importeIVA,
            importeRetencion,
            importeNeto,
            importeTotal: importeSubtotal,
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

    // Obtener presupuestos (solo vigentes)
    const presupuestos: Presupuesto[] = await prisma.presupuesto.findMany({
        where: {
            obra: { empresaId },
            esVigente: true
        },
        orderBy: { updatedAt: 'desc' }
    })

    return (
        <EstimacionesView
            estimaciones={estimaciones}
            obras={obras}
            presupuestos={presupuestos}
        />
    )
}
