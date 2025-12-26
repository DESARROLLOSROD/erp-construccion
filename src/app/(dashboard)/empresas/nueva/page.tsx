'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Building2, Save, ArrowRight } from 'lucide-react'

export default function NuevaEmpresaPage() {
    const router = useRouter()
    const [loading, setLoading] = useState(false)
    const [formData, setFormData] = useState({
        nombre: '',
        rfc: '',
        razonSocial: '',
        regimenFiscal: '',
        codigoPostal: ''
    })

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

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700">
                                    Código Postal
                                </label>
                                <div className="mt-1">
                                    <input
                                        type="text"
                                        className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-slate-500 focus:border-slate-500 sm:text-sm"
                                        value={formData.codigoPostal}
                                        onChange={e => setFormData({ ...formData, codigoPostal: e.target.value })}
                                    />
                                </div>
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
