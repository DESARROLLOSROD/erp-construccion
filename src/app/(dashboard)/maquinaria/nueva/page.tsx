'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Save, Truck } from 'lucide-react'

export default function NuevaMaquinariaPage() {
    const router = useRouter()
    const [submitting, setSubmitting] = useState(false)

    const [formData, setFormData] = useState({
        codigo: '',
        descripcion: '',
        marca: '',
        modelo: '',
        serie: '',
        anio: new Date().getFullYear(),
        costoHora: 0,
        costoRentaDia: 0,
        horometroActual: 0,
        estado: 'DISPONIBLE'
    })

    // Basic "hook form" replacement for simplicity in this artifact
    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target
        setFormData(prev => ({
            ...prev,
            [name]: e.target.type === 'number' ? parseFloat(value) || 0 : value
        }))
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setSubmitting(true)

        try {
            const response = await fetch('/api/maquinaria', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData)
            })

            if (!response.ok) {
                const error = await response.json()
                throw new Error(error.error || 'Error al guardar')
            }

            router.push('/maquinaria')
        } catch (error: any) {
            alert(error.message)
        } finally {
            setSubmitting(false)
        }
    }

    return (
        <div className="p-6 max-w-3xl mx-auto">
            <div className="mb-6">
                <Link
                    href="/maquinaria"
                    className="inline-flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900 mb-2"
                >
                    <ArrowLeft className="w-4 h-4" />
                    Volver al catálogo
                </Link>
                <h1 className="text-3xl font-bold text-gray-900">Registrar Equipo</h1>
            </div>

            <div className="bg-white rounded-lg shadow-sm p-6">
                <form onSubmit={handleSubmit} className="space-y-6">

                    <div className="flex items-center gap-4 p-4 bg-blue-50 rounded-lg text-blue-800 mb-6">
                        <Truck className="w-6 h-6" />
                        <div>
                            <p className="font-medium">Información del Equipo</p>
                            <p className="text-sm opacity-80">Ingresa los datos técnicos y económicos.</p>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="col-span-1">
                            <label className="block text-sm font-medium text-gray-700 mb-1">Código Económico *</label>
                            <input
                                type="text"
                                name="codigo"
                                required
                                placeholder="Ej. R-01"
                                value={formData.codigo}
                                onChange={handleChange}
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                            />
                        </div>

                        <div className="col-span-1">
                            {/* Serial number placeholder spot */}
                            <label className="block text-sm font-medium text-gray-700 mb-1">No. Serie</label>
                            <input
                                type="text"
                                name="serie"
                                value={formData.serie}
                                onChange={handleChange}
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                            />
                        </div>

                        <div className="col-span-2">
                            <label className="block text-sm font-medium text-gray-700 mb-1">Descripción *</label>
                            <input
                                type="text"
                                name="descripcion"
                                required
                                placeholder="Ej. Retroexcavadora John Deere 310L"
                                value={formData.descripcion}
                                onChange={handleChange}
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Marca</label>
                            <input
                                type="text"
                                name="marca"
                                value={formData.marca}
                                onChange={handleChange}
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Modelo</label>
                            <input
                                type="text"
                                name="modelo"
                                value={formData.modelo}
                                onChange={handleChange}
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Año</label>
                            <input
                                type="number"
                                name="anio"
                                value={formData.anio}
                                onChange={handleChange}
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Horómetro Inicial</label>
                            <input
                                type="number"
                                name="horometroActual"
                                step="0.1"
                                value={formData.horometroActual}
                                onChange={handleChange}
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                            />
                        </div>
                    </div>

                    <div className="border-t pt-6 mt-6">
                        <h3 className="text-lg font-medium text-gray-900 mb-4">Costos y Tarifas</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Costo Hora (Interno)</label>
                                <div className="relative">
                                    <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">$</span>
                                    <input
                                        type="number"
                                        name="costoHora"
                                        step="0.01"
                                        min="0"
                                        value={formData.costoHora}
                                        onChange={handleChange}
                                        className="w-full pl-8 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Costo Renta Día (Externo)</label>
                                <div className="relative">
                                    <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">$</span>
                                    <input
                                        type="number"
                                        name="costoRentaDia"
                                        step="0.01"
                                        min="0"
                                        value={formData.costoRentaDia}
                                        onChange={handleChange}
                                        className="w-full pl-8 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                    />
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="flex justify-end gap-3 pt-6">
                        <button
                            type="button"
                            onClick={() => router.back()}
                            className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                        >
                            Cancelar
                        </button>
                        <button
                            type="submit"
                            disabled={submitting}
                            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2"
                        >
                            <Save className="w-4 h-4" />
                            {submitting ? 'Guardando...' : 'Guardar Equipo'}
                        </button>
                    </div>

                </form>
            </div>
        </div>
    )
}
