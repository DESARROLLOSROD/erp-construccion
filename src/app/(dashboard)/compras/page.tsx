'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import {
    Plus,
    Search,
    Filter,
    FileText,
    Truck,
    AlertCircle,
    CheckCircle,
    Clock
} from 'lucide-react'
import { useRouter, useSearchParams } from 'next/navigation'

interface OrdenCompra {
    id: string
    folio: number
    fecha: string
    proveedor: {
        nombreComercial: string
        razonSocial: string
    }
    obra?: {
        nombre: string
    }
    total: number
    estado: string
    _count: {
        detalles: number
    }
}

const ESTADOS = [
    { value: 'TODOS', label: 'Todos' },
    { value: 'BORRADOR', label: 'Borrador' },
    { value: 'ENVIADA', label: 'Enviada' },
    { value: 'PARCIAL', label: 'Recibida Parcial' },
    { value: 'COMPLETADA', label: 'Completada' },
    { value: 'CANCELADA', label: 'Cancelada' },
]

export default function ComprasPage() {
    const router = useRouter()
    const searchParams = useSearchParams()
    const [ordenes, setOrdenes] = useState<OrdenCompra[]>([])
    const [loading, setLoading] = useState(true)
    const [filterEstado, setFilterEstado] = useState(searchParams.get('estado') || 'TODOS')
    const [searchTerm, setSearchTerm] = useState('')

    useEffect(() => {
        fetchOrdenes()
    }, [filterEstado])

    const fetchOrdenes = async () => {
        setLoading(true)
        try {
            let url = `/api/compras?limit=50&estado=${filterEstado}`
            if (searchTerm) url += `&search=${encodeURIComponent(searchTerm)}`

            const res = await fetch(url)
            const data = await res.json()
            if (data.data && data.data.data) {
                setOrdenes(data.data.data)
            }
        } catch (error) {
            console.error(error)
        } finally {
            setLoading(false)
        }
    }

    // Debounce search
    useEffect(() => {
        const timer = setTimeout(() => {
            if (searchTerm) fetchOrdenes()
        }, 500)
        return () => clearTimeout(timer)
    }, [searchTerm])

    const getStatusBadge = (estado: string) => {
        const styles: Record<string, string> = {
            BORRADOR: 'bg-gray-100 text-gray-800',
            ENVIADA: 'bg-blue-100 text-blue-800',
            PARCIAL: 'bg-orange-100 text-orange-800',
            COMPLETADA: 'bg-green-100 text-green-800',
            CANCELADA: 'bg-red-100 text-red-800',
        }

        const icons: Record<string, any> = {
            BORRADOR: FileText,
            ENVIADA: Truck,
            PARCIAL: Clock,
            COMPLETADA: CheckCircle,
            CANCELADA: AlertCircle,
        }

        const Icon = icons[estado] || FileText

        return (
            <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium ${styles[estado] || 'bg-gray-100'}`}>
                <Icon className="w-3 h-3" />
                {estado}
            </span>
        )
    }

    return (
        <div className="p-6 max-w-7xl mx-auto">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900">Ordenes de Compra</h1>
                    <p className="text-gray-500 mt-1">Gestión de compras e inventario</p>
                </div>
                <Link
                    href="/compras/nueva"
                    className="inline-flex items-center gap-2 bg-slate-900 text-white px-4 py-2 rounded-lg hover:bg-slate-800 transition-colors"
                >
                    <Plus className="w-4 h-4" />
                    Nueva Orden
                </Link>
            </div>

            {/* Filters */}
            <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-100 mb-6 flex flex-col sm:flex-row gap-4 items-center">
                <div className="relative flex-1 w-full">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                        type="text"
                        placeholder="Buscar por proveedor o folio..."
                        className="w-full pl-9 pr-4 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
                <div className="flex items-center gap-2 w-full sm:w-auto overflow-x-auto">
                    <Filter className="w-4 h-4 text-gray-500" />
                    <div className="flex gap-1">
                        {ESTADOS.map((est) => (
                            <button
                                key={est.value}
                                onClick={() => setFilterEstado(est.value)}
                                className={`px-3 py-1.5 rounded-md text-xs font-medium whitespace-nowrap transition-colors ${filterEstado === est.value
                                        ? 'bg-slate-900 text-white'
                                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                                    }`}
                            >
                                {est.label}
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            {/* Table */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-100 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left">
                        <thead className="bg-gray-50 text-gray-500 font-medium border-b">
                            <tr>
                                <th className="px-6 py-3">Folio</th>
                                <th className="px-6 py-3">Proveedor</th>
                                <th className="px-6 py-3">Obra / Destino</th>
                                <th className="px-6 py-3">Fecha</th>
                                <th className="px-6 py-3 text-right">Total</th>
                                <th className="px-6 py-3 text-center">Estado</th>
                                <th className="px-6 py-3"></th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {loading ? (
                                <tr>
                                    <td colSpan={7} className="px-6 py-12 text-center text-gray-500">
                                        Cargando ordenes...
                                    </td>
                                </tr>
                            ) : ordenes.length === 0 ? (
                                <tr>
                                    <td colSpan={7} className="px-6 py-12 text-center text-gray-500">
                                        No se encontraron ordenes
                                    </td>
                                </tr>
                            ) : (
                                ordenes.map((orden) => (
                                    <tr key={orden.id} className="hover:bg-gray-50 transition-colors group">
                                        <td className="px-6 py-4 font-medium text-gray-900">
                                            OC-{orden.folio.toString().padStart(4, '0')}
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="font-medium text-gray-900">{orden.proveedor.nombreComercial || orden.proveedor.razonSocial}</div>
                                            <div className="text-xs text-gray-500">{orden._count.detalles} articulos</div>
                                        </td>
                                        <td className="px-6 py-4 text-gray-600">
                                            {orden.obra ? (
                                                <span className="inline-flex items-center gap-1 bg-gray-100 px-2 py-0.5 rounded text-xs">
                                                    {orden.obra.nombre}
                                                </span>
                                            ) : (
                                                <span className="text-gray-400 italic">Inventario General</span>
                                            )}
                                        </td>
                                        <td className="px-6 py-4 text-gray-500">
                                            {new Date(orden.fecha).toLocaleDateString()}
                                        </td>
                                        <td className="px-6 py-4 text-right font-medium text-gray-900">
                                            ${Number(orden.total).toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                                        </td>
                                        <td className="px-6 py-4 text-center">
                                            {getStatusBadge(orden.estado)}
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <Link
                                                href={`/compras/${orden.id}`}
                                                className="text-blue-600 hover:text-blue-800 font-medium text-xs opacity-0 group-hover:opacity-100 transition-opacity"
                                            >
                                                Ver Detalle →
                                            </Link>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    )
}
