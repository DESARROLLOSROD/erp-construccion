import { prisma } from '@/lib/prisma'
import { createServerClient } from '@/lib/supabase'
import { ProductosView } from './productos-view'
import { redirect } from 'next/navigation'

export const metadata = {
    title: 'Productos | ERP Construcción',
}

export default async function ProductosPage() {
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

    const productosRaw = await prisma.producto.findMany({
        where: {
            empresaId,
            activo: true
        },
        include: {
            categoria: {
                select: {
                    id: true,
                    nombre: true,
                    color: true,
                }
            },
            unidad: {
                select: {
                    id: true,
                    nombre: true,
                    abreviatura: true,
                }
            }
        },
        orderBy: { codigo: 'asc' },
    })

    // Convertir Decimals a números
    const productos = productosRaw.map(p => ({
        ...p,
        precioCompra: Number(p.precioCompra),
        precioVenta: Number(p.precioVenta),
        stockMinimo: Number(p.stockMinimo),
        stockActual: Number(p.stockActual),
    }))

    return <ProductosView initialProductos={productos} />
}
