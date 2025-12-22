import { prisma } from '@/lib/prisma'
import { createServerClient } from '@/lib/supabase'
import { ObrasView } from './obras-view'
import { redirect } from 'next/navigation'

export const metadata = {
    title: 'Obras | ERP Construcción',
}

export default async function ObrasPage() {
    const supabase = createServerClient()
    const { data: { session } } = await supabase.auth.getSession()

    if (!session) {
        redirect('/login')
    }

    // Obtener contexto de empresa
    const usuario = await prisma.usuario.findUnique({
        where: { authId: session.user.id },
        include: { empresas: true }
    })

    if (!usuario || usuario.empresas.length === 0) {
        return (
            <div className="p-8">
                <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4">
                    <div className="flex">
                        <div className="ml-3">
                            <p className="text-sm text-yellow-700">
                                Tu usuario no está asignado a ninguna empresa activa. Contacta al administrador.
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        )
    }

    const empresaId = usuario.empresas[0].empresaId

    const obrasRaw = await prisma.obra.findMany({
        where: {
            empresaId,
        },
        include: {
            cliente: {
                select: {
                    id: true,
                    rfc: true,
                    razonSocial: true,
                    nombreComercial: true,
                }
            },
            _count: {
                select: {
                    presupuestos: true,
                    estimaciones: true,
                    contratos: true,
                }
            }
        },
        orderBy: { updatedAt: 'desc' },
    })

    // Convertir Decimals a números
    const obras = obrasRaw.map(obra => ({
        ...obra,
        montoContrato: Number(obra.montoContrato),
        anticipoPct: Number(obra.anticipoPct),
        retencionPct: Number(obra.retencionPct),
    }))

    return <ObrasView initialObras={obras} />
}
