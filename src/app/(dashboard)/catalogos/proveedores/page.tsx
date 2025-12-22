import { prisma } from '@/lib/prisma'
import { createServerClient } from '@/lib/supabase'
import { ProveedoresView } from './proveedores-view'
import { redirect } from 'next/navigation'

export const metadata = {
    title: 'Proveedores | ERP Construcción',
}

export default async function ProveedoresPage() {
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
                    <p className="text-sm text-yellow-700">
                        Tu usuario no está asignado a ninguna empresa activa. Contacta al administrador.
                    </p>
                </div>
            </div>
        )
    }

    const empresaId = usuario.empresas[0].empresaId

    const proveedores = await prisma.proveedor.findMany({
        where: {
            empresaId,
            activo: true
        },
        orderBy: { updatedAt: 'desc' },
    })

    return <ProveedoresView initialProveedores={proveedores} />
}
