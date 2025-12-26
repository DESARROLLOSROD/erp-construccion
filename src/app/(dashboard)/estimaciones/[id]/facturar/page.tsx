'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, FileText, CheckCircle, AlertTriangle } from 'lucide-react'

export default function FacturarEstimacionPage({ params }: { params: { id: string } }) {
    const router = useRouter()
    const { id } = params

    const [estimacion, setEstimacion] = useState<any>(null)
    const [loading, setLoading] = useState(true)
    const [processing, setProcessing] = useState(false)

    const [formData, setFormData] = useState({
        metodoPago: 'PPD',
        formaPago: '99',
        usoCfdi: 'G03'
    })

    useEffect(() => {
        fetch(`/api/estimaciones/${id}`)
            .then(res => res.json())
            .then(data => {
                if (data) setEstimacion(data)
                setLoading(false)
            })
            .catch(e => console.error(e))
    }, [id])

    const handleEmitir = async () => {
        setProcessing(true)
        try {
            // 1. Create Draft
            const draftRes = await fetch('/api/facturacion', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    clienteId: estimacion.obra.clienteId, // Requires clienteId in Estimacion->Obra->Cliente relation. If missing, we need to fail or select. Ideally populated.
                    estimacionId: id,
                    ...formData
                })
            })

            if (!draftRes.ok) throw new Error('Error al crear borrador')
            const draft = await draftRes.json()

            // 2. Timbrar
            const timbrarRes = await fetch('/api/facturacion', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id: draft.data.id, action: 'TIMBRAR' })
            })

            if (!timbrarRes.ok) throw new Error('Error al timbrar factura')

            alert('Factura emitida y timbrada correctamente')
            router.push('/estimaciones')

        } catch (error: any) {
            alert(error.message)
        } finally {
            setProcessing(false)
        }
    }

    if (loading) return <div>Cargando...</div>

    return (
        <div className="max-w-4xl mx-auto p-6">
            <div className="mb-6 flex items-center gap-4">
                <Link href={`/estimaciones/${id}`} className="p-2 hover:bg-gray-100 rounded-full">
                    <ArrowLeft className="w-5 h-5" />
                </Link>
                <h1 className="text-2xl font-bold">Emitir Factura (CFDI 4.0)</h1>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Review Data */}
                <div className="bg-white p-6 rounded-xl shadow-sm border space-y-4">
                    <h3 className="font-bold text-gray-900 border-b pb-2">Datos de Origen</h3>
                    <div>
                        <label className="text-xs text-gray-500 uppercase">Estimación</label>
                        <div className="font-medium">#{estimacion.numero} - {estimacion.periodo}</div>
                    </div>
                    <div>
                        <label className="text-xs text-gray-500 uppercase">Obra</label>
                        <div className="font-medium">{estimacion.obra?.nombre}</div>
                    </div>
                    <div>
                        <label className="text-xs text-gray-500 uppercase">Cliente (Receptor)</label>
                        <div className="font-medium">{estimacion.obra?.cliente?.razonSocial || 'No asignado'}</div>
                        <div className="text-sm text-gray-500">{estimacion.obra?.cliente?.rfc}</div>
                    </div>

                    <div className="pt-4 border-t">
                        <div className="flex justify-between font-bold text-lg">
                            <span>Total a Facturar</span>
                            <span>${Number(estimacion.importeNeto).toLocaleString('es-MX')}</span>
                        </div>
                    </div>
                </div>

                {/* Fiscal Options */}
                <div className="bg-white p-6 rounded-xl shadow-sm border space-y-4">
                    <h3 className="font-bold text-gray-900 border-b pb-2">Datos Fiscales</h3>

                    <div>
                        <label className="block text-sm font-medium mb-1">Método de Pago</label>
                        <select
                            className="w-full border rounded p-2"
                            value={formData.metodoPago}
                            onChange={e => setFormData({ ...formData, metodoPago: e.target.value })}
                        >
                            <option value="PUE">PUE - Pago en una sola exhibición</option>
                            <option value="PPD">PPD - Pago en parcialidades o diferido</option>
                        </select>
                    </div>

                    <div>
                        <label className="block text-sm font-medium mb-1">Forma de Pago</label>
                        <select
                            className="w-full border rounded p-2"
                            value={formData.formaPago}
                            onChange={e => setFormData({ ...formData, formaPago: e.target.value })}
                        >
                            <option value="01">01 - Efectivo</option>
                            <option value="03">03 - Transferencia electrónica</option>
                            <option value="99">99 - Por definir</option>
                        </select>
                    </div>

                    <div>
                        <label className="block text-sm font-medium mb-1">Uso de CFDI</label>
                        <select
                            className="w-full border rounded p-2"
                            value={formData.usoCfdi}
                            onChange={e => setFormData({ ...formData, usoCfdi: e.target.value })}
                        >
                            <option value="G03">G03 - Gastos en general</option>
                            <option value="I01">I01 - Construcciones</option>
                            <option value="D04">D04 - Donativos</option>
                        </select>
                    </div>

                    <div className="mt-8">
                        <div className="bg-blue-50 text-blue-800 p-4 rounded text-sm mb-4 flex gap-2">
                            <AlertTriangle className="w-5 h-5 flex-shrink-0" />
                            <p>Esta acción generará un folio fiscal (UUID) de prueba. No tiene validez oficial ante el SAT.</p>
                        </div>

                        <button
                            onClick={handleEmitir}
                            disabled={processing}
                            className="w-full bg-slate-900 text-white py-3 rounded-lg hover:bg-slate-800 font-bold flex justify-center items-center gap-2"
                        >
                            {processing ? 'Timbrando...' : (
                                <>
                                    <FileText className="w-5 h-5" /> Timbrar Factura
                                </>
                            )}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    )
}
