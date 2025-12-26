'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Building2, Save, ArrowRight, FileText, Upload } from 'lucide-react'

export default function NuevaEmpresaPage() {
    const router = useRouter()
    const [loading, setLoading] = useState(false)
    const [extracting, setExtracting] = useState(false)
    const [formData, setFormData] = useState({
        nombre: '',
        rfc: '',
        razonSocial: '',
        regimenFiscal: '',
        codigoPostal: '',
        direccion: ''
    })

    const handlePDFUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (!file) return

        setExtracting(true)
        try {
            const formData = new FormData()
            formData.append('file', file)

            const res = await fetch('/api/empresa/extract-csf', {
                method: 'POST',
                body: formData,
            })

            if (!res.ok) {
                const err = await res.json()
                throw new Error(err.error || 'Error al procesar PDF')
            }

            const { data } = await res.json()

            // Auto-fill form with extracted data
            setFormData(prev => ({
                ...prev,
                nombre: data.razonSocial.substring(0, 50) || prev.nombre,
                rfc: data.rfc || prev.rfc,
                razonSocial: data.razonSocial || prev.razonSocial,
                regimenFiscal: data.regimenFiscal || prev.regimenFiscal,
                codigoPostal: data.codigoPostal || prev.codigoPostal,
                direccion: data.direccion || prev.direccion,
            }))

            alert('✅ Datos extraídos correctamente. Revisa y confirma la información.')
        } catch (error: any) {
            alert('❌ ' + error.message)
        } finally {
            setExtracting(false)
            // Reset file input
            e.target.value = ''
        }
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)
        try {
            const res = await fetch('/api/empresas', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData)
            })

            if (!res.ok) {
                const err = await res.json()
                throw new Error(err.error || 'Error al crear empresa')
            }

            // Force refresh/redirect to pick up new context
            window.location.href = '/dashboard'

        } catch (error: any) {
            alert(error.message)
            setLoading(false)
        }
    }

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
            <div className="sm:mx-auto sm:w-full sm:max-w-md">
                <div className="flex justify-center">
                    <div className="bg-slate-900 p-3 rounded-xl">
                        <Building2 className="w-8 h-8 text-white" />
                    </div>
                </div>
                <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
                    Registra tu Empresa
                </h2>
                <p className="mt-2 text-center text-sm text-gray-600">
                    Para comenzar a operar, necesitamos los datos fiscales básicos de tu organización.
                </p>
            </div>

            <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
                <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
                    {/* PDF Upload Section */}
                    <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                        <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-2">
                                <FileText className="h-5 w-5 text-blue-600" />
                                <h3 className="text-sm font-medium text-blue-900">Cargar Constancia de Situación Fiscal</h3>
                            </div>
                        </div>
                        <p className="text-xs text-blue-700 mb-3">Sube tu CSF del SAT para llenar automáticamente el formulario</p>
                        <label className="cursor-pointer">
                            <div className="flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md text-sm font-medium transition-colors">
                                <Upload className="h-4 w-4" />
                                {extracting ? 'Procesando...' : 'Seleccionar PDF'}
                            </div>
                            <input
                                type="file"
                                accept=".pdf"
                                onChange={handlePDFUpload}
                                disabled={extracting}
                                className="hidden"
                            />
                        </label>
                    </div>

                    <form className="space-y-6" onSubmit={handleSubmit}>
                        <div>
                            <label className="block text-sm font-medium text-gray-700">
                                Nombre Comercial (Corto)
                            </label>
                            <div className="mt-1">
                                <input
                                    type="text"
                                    required
                                    className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-slate-500 focus:border-slate-500 sm:text-sm"
                                    placeholder="Ej. Constructora del Norte"
                                    value={formData.nombre}
                                    onChange={e => setFormData({ ...formData, nombre: e.target.value })}
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700">
                                RFC
                            </label>
                            <div className="mt-1">
                                <input
                                    type="text"
                                    required
                                    maxLength={13}
                                    className="uppercase appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-slate-500 focus:border-slate-500 sm:text-sm"
                                    placeholder="XAXX010101000"
                                    value={formData.rfc}
                                    onChange={e => setFormData({ ...formData, rfc: e.target.value.toUpperCase() })}
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700">
                                Razón Social
                            </label>
                            <div className="mt-1">
                                <input
                                    type="text"
                                    required
                                    className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-slate-500 focus:border-slate-500 sm:text-sm"
                                    placeholder="Ej. CONSTRUCTORA DEL NORTE S.A. DE C.V."
                                    value={formData.razonSocial}
                                    onChange={e => setFormData({ ...formData, razonSocial: e.target.value })}
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700">
                                Régimen Fiscal
                            </label>
                            <div className="mt-1">
                                <input
                                    type="text"
                                    className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-slate-500 focus:border-slate-500 sm:text-sm"
                                    placeholder="Ej. 601 - General de Ley Personas Morales"
                                    value={formData.regimenFiscal}
                                    onChange={e => setFormData({ ...formData, regimenFiscal: e.target.value })}
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700">
                                    Código Postal
                                </label>
                                <div className="mt-1">
                                    <input
                                        type="text"
                                        maxLength={5}
                                        className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-slate-500 focus:border-slate-500 sm:text-sm"
                                        placeholder="12345"
                                        value={formData.codigoPostal}
                                        onChange={e => setFormData({ ...formData, codigoPostal: e.target.value })}
                                    />
                                </div>
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700">
                                Dirección Fiscal
                            </label>
                            <div className="mt-1">
                                <textarea
                                    rows={2}
                                    className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-slate-500 focus:border-slate-500 sm:text-sm"
                                    placeholder="Calle, número, colonia, ciudad, estado"
                                    value={formData.direccion}
                                    onChange={e => setFormData({ ...formData, direccion: e.target.value })}
                                />
                            </div>
                        </div>

                        <div>
                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-slate-900 hover:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-slate-500 disabled:opacity-50"
                            >
                                {loading ? 'Registrando...' : 'Registrar y Continuar'}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    )
}
