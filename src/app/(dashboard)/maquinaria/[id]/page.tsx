'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import {
    ArrowLeft,
    Truck,
    MapPin,
    Clock,
    Wrench,
    Activity,
    Trash2,
    Plus,
    X,
    CheckCircle,
    AlertCircle
} from 'lucide-react'

// Types
interface MaquinariaDetail {
    id: string
    codigo: string
    descripcion: string
    marca: string
    modelo: string
    anio: number
    serie: string
    estado: string
    horometroActual: number
    ubicacionActual: string
    costoHora: number
    costoRentaDia: number
    registrosUso: any[]
    asignaciones: any[]
    mantenimientos: any[]
}

interface ObraSimple {
    id: string
    nombre: string
    codigo: string
}

const TABS = [
    { id: 'general', label: 'General', icon: Truck },
    { id: 'asignaciones', label: 'Asignaciones', icon: MapPin },
    { id: 'bitacora', label: 'Bitácora Uso', icon: Activity },
    { id: 'mantenimiento', label: 'Mantenimiento', icon: Wrench },
]

export default function MaquinariaDetailPage() {
    const params = useParams()
    const router = useRouter()
    const [activeTab, setActiveTab] = useState('general')
    const [equipo, setEquipo] = useState<MaquinariaDetail | null>(null)
    const [loading, setLoading] = useState(true)

    // Modal States
    const [showAssignModal, setShowAssignModal] = useState(false)
    const [obras, setObras] = useState<ObraSimple[]>([])
    const [assignForm, setAssignForm] = useState({
        obraId: '',
        fechaInicio: new Date().toISOString().split('T')[0],
        horometroInicio: 0,
        observaciones: ''
    })
    const [submitting, setSubmitting] = useState(false)

    // End Assignment State
    const [showEndAssignModal, setShowEndAssignModal] = useState(false)
    const [endAssignForm, setEndAssignForm] = useState({
        fechaFin: new Date().toISOString().split('T')[0],
        horometroFin: 0,
        observaciones: ''
    })


    useEffect(() => {
        fetchEquipo()
        if (activeTab === 'asignaciones') {
            fetchObras()
        }
    }, [params.id, activeTab])

    const fetchEquipo = async () => {
        try {
            const response = await fetch(`/api/maquinaria/${params.id}`)
            if (!response.ok) throw new Error('Error al cargar equipo')
            const data = await response.json()
            setEquipo(data.data)

            // Init forms with current data
            if (data.data) {
                setAssignForm(prev => ({ ...prev, horometroInicio: data.data.horometroActual }))
                setEndAssignForm(prev => ({ ...prev, horometroFin: data.data.horometroActual }))
            }
        } catch (error) {
            console.error(error)
        } finally {
            setLoading(false)
        }
    }

    const fetchObras = async () => {
        if (obras.length > 0) return
        try {
            const res = await fetch('/api/obras?limit=100') // Adjust if simple list endpoint exists
            const data = await res.json()
            if (data.data && data.data.data) {
                setObras(data.data.data)
            }
        } catch (e) {
            console.error("Error fetching obras", e)
        }
    }

    const handleDelete = async () => {
        if (!confirm('¿Estás seguro de eliminar este equipo?')) return
        try {
            const res = await fetch(`/api/maquinaria/${params.id}`, { method: 'DELETE' })
            if (res.ok) router.push('/maquinaria')
        } catch (error) {
            console.error(error)
            alert('Error al eliminar')
        }
    }

    const handleAssignSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setSubmitting(true)
        try {
            const res = await fetch(`/api/maquinaria/${params.id}/asignaciones`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(assignForm)
            })
            if (!res.ok) {
                const err = await res.json()
                throw new Error(err.error || 'Error al asignar')
            }
            setShowAssignModal(false)
            fetchEquipo()
        } catch (error: any) {
            alert(error.message)
        } finally {
            setSubmitting(false)
        }
    }

    const handleEndAssignSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setSubmitting(true)
        try {
            const res = await fetch(`/api/maquinaria/${params.id}/asignaciones`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(endAssignForm)
            })
            if (!res.ok) {
                const err = await res.json()
                throw new Error(err.error || 'Error al finalizar asignación')
            }
            setShowEndAssignModal(false)
            fetchEquipo()
        } catch (error: any) {
            alert(error.message)
        } finally {
            setSubmitting(false)
        }
    }

    if (loading) return <div className="p-8 text-center">Cargando...</div>
    if (!equipo) return <div className="p-8 text-center">Equipo no encontrado</div>

    const activeAssignment = equipo.asignaciones?.find((a: any) => a.activo)

    return (
        <div className="p-6 max-w-7xl mx-auto">
            <div className="mb-6">
                <Link
                    href="/maquinaria"
                    className="inline-flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900 mb-2"
                >
                    <ArrowLeft className="w-4 h-4" />
                    Volver a equipos
                </Link>
                <div className="flex justify-between items-start">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
                            {equipo.codigo}
                            <span className="text-lg font-normal text-gray-500">{equipo.descripcion}</span>
                        </h1>
                        <div className="flex gap-4 mt-2 text-sm text-gray-600">
                            <span className="flex items-center gap-1"><Truck className="w-4 h-4" /> {equipo.marca} {equipo.modelo}</span>
                            <span className="flex items-center gap-1"><Clock className="w-4 h-4" /> {equipo.horometroActual} hrs</span>
                            <span className={`px-2 py-0.5 rounded text-white ${equipo.estado === 'DISPONIBLE' ? 'bg-green-600' : echip.estado === 'EN_OBRA' ? 'bg-blue-600' : 'bg-gray-600'}`}>
                                {equipo.estado}
                            </span>
                        </div>
                    </div>

                    <div className="flex gap-2">
                        {equipo.estado === 'DISPONIBLE' && (
                            <button
                                onClick={() => setShowAssignModal(true)}
                                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center gap-2"
                            >
                                <MapPin className="w-4 h-4" />
                                Asignar a Obra
                            </button>
                        )}
                        {equipo.estado === 'EN_OBRA' && (
                            <button
                                onClick={() => setShowEndAssignModal(true)}
                                className="bg-orange-600 text-white px-4 py-2 rounded-lg hover:bg-orange-700 flex items-center gap-2"
                            >
                                <CheckCircle className="w-4 h-4" />
                                Finalizar Asignación
                            </button>
                        )}
                        <button
                            onClick={handleDelete}
                            className="text-red-600 hover:bg-red-50 p-2 rounded-lg border border-red-200"
                        >
                            <Trash2 className="w-5 h-5" />
                        </button>
                    </div>
                </div>
            </div>

            {/* KPI Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
                <div className="bg-white p-4 rounded-lg shadow-sm">
                    <div className="text-gray-500 text-sm mb-1">Ubicación Actual</div>
                    <div className="font-semibold text-blue-800">{equipo.ubicacionActual || 'Sin asignar'}</div>
                </div>
                <div className="bg-white p-4 rounded-lg shadow-sm">
                    <div className="text-gray-500 text-sm mb-1">Horómetro</div>
                    <div className="font-semibold text-xl">{equipo.horometroActual} h</div>
                </div>
                <div className="bg-white p-4 rounded-lg shadow-sm">
                    <div className="text-gray-500 text-sm mb-1">Próximo Mantenimiento</div>
                    <div className="font-semibold text-orange-600">--</div>
                </div>
                <div className="bg-white p-4 rounded-lg shadow-sm">
                    <div className="text-gray-500 text-sm mb-1">Costo Hora</div>
                    <div className="font-semibold text-green-600">${equipo.costoHora}</div>
                </div>
            </div>

            {/* Tabs */}
            <div className="border-b border-gray-200 mb-6">
                <nav className="-mb-px flex space-x-8">
                    {TABS.map((tab) => {
                        const Icon = tab.icon
                        const isActive = activeTab === tab.id
                        return (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id)}
                                className={`
                  whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm flex items-center gap-2
                  ${isActive
                                        ? 'border-blue-500 text-blue-600'
                                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}
                `}
                            >
                                <Icon className="w-4 h-4" />
                                {tab.label}
                            </button>
                        )
                    })}
                </nav>
            </div>

            {/* Content */}
            <div className="bg-white rounded-lg shadow-sm p-6 min-h-[400px]">
                {activeTab === 'general' && (
                    <div className="grid grid-cols-2 gap-x-12 gap-y-6">
                        <div>
                            <h3 className="font-semibold text-gray-900 border-b pb-2 mb-4">Datos Técnicos</h3>
                            <dl className="space-y-3">
                                <div className="grid grid-cols-2">
                                    <dt className="text-sm text-gray-500">Marca</dt>
                                    <dd className="text-sm font-medium">{equipo.marca || '-'}</dd>
                                </div>
                                <div className="grid grid-cols-2">
                                    <dt className="text-sm text-gray-500">Modelo</dt>
                                    <dd className="text-sm font-medium">{equipo.modelo || '-'}</dd>
                                </div>
                                <div className="grid grid-cols-2">
                                    <dt className="text-sm text-gray-500">Año</dt>
                                    <dd className="text-sm font-medium">{equipo.anio || '-'}</dd>
                                </div>
                                <div className="grid grid-cols-2">
                                    <dt className="text-sm text-gray-500">No. Serie</dt>
                                    <dd className="text-sm font-medium">{equipo.serie || '-'}</dd>
                                </div>
                            </dl>
                        </div>

                        <div>
                            <h3 className="font-semibold text-gray-900 border-b pb-2 mb-4">Costos</h3>
                            <dl className="space-y-3">
                                <div className="grid grid-cols-2">
                                    <dt className="text-sm text-gray-500">Costo Hora Operación</dt>
                                    <dd className="text-sm font-medium">${equipo.costoHora}</dd>
                                </div>
                                <div className="grid grid-cols-2">
                                    <dt className="text-sm text-gray-500">Costo Renta Día</dt>
                                    <dd className="text-sm font-medium">${equipo.costoRentaDia}</dd>
                                </div>
                            </dl>
                        </div>
                    </div>
                )}

                {activeTab === 'asignaciones' && (
                    <div>
                        <div className="flex justify-between mb-4 items-center">
                            <h3 className="font-semibold text-lg">Historial de Asignaciones</h3>
                            {equipo.estado === 'DISPONIBLE' && (
                                <button
                                    onClick={() => setShowAssignModal(true)}
                                    className="text-sm bg-blue-50 text-blue-700 px-3 py-1 rounded hover:bg-blue-100"
                                >
                                    + Nueva Asignación
                                </button>
                            )}
                        </div>
                        {equipo.asignaciones?.length === 0 ? (
                            <div className="text-center py-12 bg-gray-50 rounded">
                                <MapPin className="w-8 h-8 mx-auto text-gray-300 mb-2" />
                                <p className="text-gray-500">No hay asignaciones registradas.</p>
                            </div>
                        ) : (
                            <div className="overflow-hidden border rounded-lg">
                                <table className="min-w-full divide-y divide-gray-200">
                                    <thead className="bg-gray-50">
                                        <tr>
                                            <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Obra</th>
                                            <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Inicio</th>
                                            <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Fin</th>
                                            <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Horas</th>
                                            <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Estado</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-200">
                                        {equipo.asignaciones.map((asig: any) => (
                                            <tr key={asig.id}>
                                                <td className="px-4 py-3 text-sm font-medium text-gray-900">{asig.obra.nombre}</td>
                                                <td className="px-4 py-3 text-sm text-gray-500">
                                                    {new Date(asig.fechaInicio).toLocaleDateString()} <br />
                                                    <span className="text-xs">H: {asig.horometroInicio}</span>
                                                </td>
                                                <td className="px-4 py-3 text-sm text-gray-500">
                                                    {asig.activo ? '-' : new Date(asig.fechaFin).toLocaleDateString()} <br />
                                                    {!asig.activo && <span className="text-xs">H: {asig.horometroFin}</span>}
                                                </td>
                                                <td className="px-4 py-3 text-sm text-gray-900">
                                                    {!asig.activo && asig.horometroFin ? (asig.horometroFin - asig.horometroInicio).toFixed(1) : '-'}
                                                </td>
                                                <td className="px-4 py-3 text-sm">
                                                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${asig.activo ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
                                                        {asig.activo ? 'Vigente' : 'Finalizada'}
                                                    </span>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>
                )}

                {/* ... other tabs ... */}
                {(activeTab === 'bitacora' || activeTab === 'mantenimiento') && (
                    <div className="text-center py-12 text-gray-500">
                        <Wrench className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                        <p>Módulo en desarrollo.</p>
                    </div>
                )}
            </div>

            {/* Assign Modal */}
            {showAssignModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
                        <div className="p-4 border-b flex justify-between items-center">
                            <h3 className="font-semibold text-lg">Asignar Equipo a Obra</h3>
                            <button onClick={() => setShowAssignModal(false)}><X className="w-5 h-5 text-gray-500" /></button>
                        </div>
                        <form onSubmit={handleAssignSubmit} className="p-4 space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Obra *</label>
                                <select
                                    required
                                    className="w-full border rounded-lg p-2"
                                    value={assignForm.obraId}
                                    onChange={(e) => setAssignForm({ ...assignForm, obraId: e.target.value })}
                                >
                                    <option value="">Seleccione una obra...</option>
                                    {obras.map(obra => (
                                        <option key={obra.id} value={obra.id}>{obra.codigo} - {obra.nombre}</option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Fecha Inicio *</label>
                                <input
                                    type="date"
                                    required
                                    className="w-full border rounded-lg p-2"
                                    value={assignForm.fechaInicio}
                                    onChange={(e) => setAssignForm({ ...assignForm, fechaInicio: e.target.value })}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Horómetro Salida</label>
                                <input
                                    type="number"
                                    step="0.1"
                                    className="w-full border rounded-lg p-2"
                                    value={assignForm.horometroInicio}
                                    onChange={(e) => setAssignForm({ ...assignForm, horometroInicio: parseFloat(e.target.value) })}
                                />
                                <p className="text-xs text-gray-500 mt-1">Actual: {equipo.horometroActual}</p>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Observaciones</label>
                                <textarea
                                    className="w-full border rounded-lg p-2"
                                    rows={3}
                                    value={assignForm.observaciones}
                                    onChange={(e) => setAssignForm({ ...assignForm, observaciones: e.target.value })}
                                />
                            </div>
                            <div className="flex justify-end gap-2 mt-4">
                                <button
                                    type="button"
                                    onClick={() => setShowAssignModal(false)}
                                    className="px-4 py-2 text-gray-600 hover:bg-gray-50 rounded"
                                >
                                    Cancelar
                                </button>
                                <button
                                    type="submit"
                                    disabled={submitting}
                                    className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
                                >
                                    {submitting ? 'Guardando...' : 'Asignar'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* End Assign Modal */}
            {showEndAssignModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
                        <div className="p-4 border-b flex justify-between items-center">
                            <h3 className="font-semibold text-lg">Finalizar Asignación</h3>
                            <button onClick={() => setShowEndAssignModal(false)}><X className="w-5 h-5 text-gray-500" /></button>
                        </div>
                        <div className="p-4 bg-yellow-50 text-sm text-yellow-800">
                            El equipo se marcará como <strong>DISPONIBLE</strong> y regresará a la base.
                        </div>
                        <form onSubmit={handleEndAssignSubmit} className="p-4 space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Fecha Fin *</label>
                                <input
                                    type="date"
                                    required
                                    className="w-full border rounded-lg p-2"
                                    value={endAssignForm.fechaFin}
                                    onChange={(e) => setEndAssignForm({ ...endAssignForm, fechaFin: e.target.value })}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Horómetro Regreso</label>
                                <input
                                    type="number"
                                    step="0.1"
                                    className="w-full border rounded-lg p-2"
                                    value={endAssignForm.horometroFin}
                                    onChange={(e) => setEndAssignForm({ ...endAssignForm, horometroFin: parseFloat(e.target.value) })}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Observaciones Cierre</label>
                                <textarea
                                    className="w-full border rounded-lg p-2"
                                    rows={3}
                                    value={endAssignForm.observaciones}
                                    onChange={(e) => setEndAssignForm({ ...endAssignForm, observaciones: e.target.value })}
                                />
                            </div>
                            <div className="flex justify-end gap-2 mt-4">
                                <button
                                    type="button"
                                    onClick={() => setShowEndAssignModal(false)}
                                    className="px-4 py-2 text-gray-600 hover:bg-gray-50 rounded"
                                >
                                    Cancelar
                                </button>
                                <button
                                    type="submit"
                                    disabled={submitting}
                                    className="px-4 py-2 bg-orange-600 text-white rounded hover:bg-orange-700 disabled:opacity-50"
                                >
                                    {submitting ? 'Guardando...' : 'Finalizar'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

        </div>
    )
}
