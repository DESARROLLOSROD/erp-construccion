'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import {
    Plus,
    Search,
    Filter,
    MoreVertical,
    Truck,
    AlertCircle,
    CheckCircle,
    Wrench,
    XCircle,
} from 'lucide-react'

interface Maquinaria {
    id: string
    codigo: string
    descripcion: string
    marca: string | null
    modelo: string | null
    estado: 'DISPONIBLE' | 'EN_OBRA' | 'MANTENIMIENTO' | 'REPARACION' | 'BAJA'
    ubicacionActual: string | null
    horometroActual: number
}

const ESTADO_CONFIG = {
    DISPONIBLE: { color: 'bg-green-100 text-green-800', icon: CheckCircle, label: 'Disponible' },
    EN_OBRA: { color: 'bg-blue-100 text-blue-800', icon: Truck, label: 'En Obra' },
    MANTENIMIENTO: { color: 'bg-yellow-100 text-yellow-800', icon: Wrench, label: 'Mantenimiento' },
    REPARACION: { color: 'bg-orange-100 text-orange-800', icon: AlertCircle, label: 'Reparación' },
    BAJA: { color: 'bg-red-100 text-red-800', icon: XCircle, label: 'Baja' },
}

export default function MaquinariaPage() {
    const [maquinaria, setMaquinaria] = useState<Maquinaria[]>([])
    const [loading, setLoading] = useState(true)
    const [searchTerm, setSearchTerm] = useState('')
    const [filterEstado, setFilterEstado] = useState('TODOS')

    useEffect(() => {
        fetchMaquinaria()
    }, [filterEstado]) // Refetch when filter changes

    // Debounce search could be added, for now simple effect
    useEffect(() => {
        const timer = setTimeout(() => {
            fetchMaquinaria()
        }, 500)
        return () => clearTimeout(timer)
    }, [searchTerm])

    const fetchMaquinaria = async () => {
        try {
            setLoading(true)
            const params = new URLSearchParams()
            if (searchTerm) params.append('search', searchTerm)
            if (filterEstado !== 'TODOS') params.append('estado', filterEstado)

            const response = await fetch(`/api/maquinaria?${params.toString()}`)
            if (!response.ok) throw new Error('Error cargando maquinaria')

            const data = await response.json()
            // Support both { data: [...] } and { data: { data: [...] } } structures
            const resultList = data.data?.data || data.data || []
            setMaquinaria(Array.isArray(resultList) ? resultList : [])
        } catch (error) {
            console.error('Error fetching maquinaria:', error)
            setMaquinaria([])
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="p-6 max-w-7xl mx-auto">
            {/* Header ... */}
            <div className="flex flex-col md:flex-row md:items-center justify-between mb-6 gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900">Maquinaria y Equipo</h1>
                    <p className="text-gray-600">Gestión de flota y mantenimiento</p>
                </div>
                <Link
                    href="/maquinaria/nueva"
                    className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                    <Plus className="w-4 h-4" />
                    Nuevo Equipo
                </Link>
            </div>

            {/* Filters */}
            <div className="bg-white rounded-lg shadow-sm p-4 mb-6">
                <div className="flex flex-col md:flex-row gap-4">
                    <div className="flex-1 relative">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                        <input
                            type="text"
                            placeholder="Buscar por código, descripción, marca..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 max-w-md"
                        />
                    </div>

                    <div className="flex items-center gap-2">
                        <Filter className="w-4 h-4 text-gray-500" />
                        <select
                            value={filterEstado}
                            onChange={(e) => setFilterEstado(e.target.value)}
                            className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-blue-500"
                        >
                            <option value="TODOS">Todos los estados</option>
                            <option value="DISPONIBLE">Disponible</option>
                            <option value="EN_OBRA">En Obra</option>
                            <option value="MANTENIMIENTO">Mantenimiento</option>
                            <option value="REPARACION">Reparación</option>
                            <option value="BAJA">Baja</option>
                        </select>
                    </div>
                </div>
            </div>

            {/* Grid/Table */}
            {loading ? (
                <div className="text-center py-12">Cargando...</div>
            ) : (!maquinaria || maquinaria.length === 0) ? (
                <div className="text-center py-12 bg-white rounded-lg shadow-sm">
                    <Truck className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                    <p className="text-gray-500">No se encontraron equipos</p>
                </div>
            ) : (
                <div className="bg-white rounded-lg shadow-sm overflow-hidden">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Código</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Descripción</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Marca / Modelo</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Ubicación</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Horómetro</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Estado</th>
                                <th className="relative px-6 py-3"><span className="sr-only">Acciones</span></th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {maquinaria.map((equipo) => {
                                const EstadoConfig = ESTADO_CONFIG[equipo.estado] || ESTADO_CONFIG.DISPONIBLE
                                const Icon = EstadoConfig.icon

                                return (
                                    <tr key={equipo.id} className="hover:bg-gray-50 group">
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="text-sm font-bold text-gray-900">{equipo.codigo}</div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="text-sm text-gray-900">{equipo.descripcion}</div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="text-sm text-gray-600">
                                                {equipo.marca} {equipo.modelo}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="text-sm text-gray-600">
                                                {equipo.ubicacionActual || '-'}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="text-sm font-mono text-gray-900">
                                                {equipo.horometroActual.toLocaleString('es-MX')} h
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium ${EstadoConfig.color}`}>
                                                <Icon className="w-3.5 h-3.5" />
                                                {EstadoConfig.label}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                            <Link
                                                href={`/maquinaria/${equipo.id}`}
                                                className="text-blue-600 hover:text-blue-900"
                                            >
                                                Ver detalles
                                            </Link>
                                        </td>
                                    </tr>
                                )
                            })}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    )
}
