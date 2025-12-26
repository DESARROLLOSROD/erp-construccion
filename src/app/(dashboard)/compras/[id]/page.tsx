'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import {
    ArrowLeft,
    Truck,
    CheckCircle,
    AlertCircle,
    FileText,
    Printer,
    ChevronDown,
    Box,
    X
} from 'lucide-react'

interface Detalle {
    id: string
    producto: { codigo: string, descripcion: string, unidad?: { abreviatura: string } }
    cantidad: number
    cantidadRecibida: number
    precioUnitario: number
    importe: number
}

interface OrdenCompra {
    id: string
    folio: number
    fecha: string
    fechaEntrega?: string
    proveedor: { razonSocial: string, nombreComercial: string, rfc: string, email: string }
    obra?: { nombre: string }
    estado: string
    notas?: string
    subtotal: number
    iva: number
    total: number
    detalles: Detalle[]
}

export default function DetalleCompraPage() {
    const params = useParams()
    const router = useRouter()
    const [orden, setOrden] = useState<OrdenCompra | null>(null)
    const [loading, setLoading] = useState(true)
    const [showReceptionModal, setShowReceptionModal] = useState(false)
    const [receptionForm, setReceptionForm] = useState<{ detalleId: string, cantidad: number }[]>([])
    const [processing, setProcessing] = useState(false)

    useEffect(() => {
        fetchOrden()
    }, [])

    const fetchOrden = async () => {
        try {
            const res = await fetch(`/api/compras/${params.id}`)
            if (!res.ok) throw new Error('Error loading')
            const data = await res.json()
            setOrden(data.data)

            // Init reception form with remaining quantities
            if (data.data) {
                setReceptionForm(data.data.detalles.map((d: Detalle) => ({
                    detalleId: d.id,
                    cantidad: Math.max(0, d.cantidad - d.cantidadRecibida)
                })))
            }
        } catch (e) {
            console.error(e)
        } finally {
            setLoading(false)
        }
    }

    const handleStatusChange = async (action: 'SEND' | 'CANCEL') => {
        if (!confirm(action === 'SEND' ? '¿Marcar como ENVIADA?' : '¿CANCELAR orden?')) return

        try {
            const method = action === 'CANCEL' ? 'DELETE' : 'PUT'
            const body = action === 'SEND' ? JSON.stringify({ action: 'SEND' }) : undefined

            const res = await fetch(`/api/compras/${params.id}`, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body
            })

            if (res.ok) fetchOrden()
            else alert('Error al actualizar estado')
        } catch (e) {
            console.error(e)
        }
    }

    const handleReceptionSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setProcessing(true)
        try {
            const itemsToReceive = receptionForm.filter(i => i.cantidad > 0)
            if (itemsToReceive.length === 0) return alert('Ingrese cantidades a recibir')

            const res = await fetch(`/api/compras/${params.id}/recepcion`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    items: itemsToReceive,
                    notas: 'Recepción desde Web'
                })
            })

            if (!res.ok) {
                const err = await res.json()
                throw new Error(err.error || 'Error al recibir')
            }

            setShowReceptionModal(false)
            fetchOrden()
            alert('Recepción procesada correctamente. Stock actualizado.')
        } catch (error: any) {
            alert(error.message)
        } finally {
            setProcessing(false)
        }
    }

    const updateReceptionQty = (detalleId: string, qty: number) => {
        setReceptionForm(prev => prev.map(item =>
            item.detalleId === detalleId ? { ...item, cantidad: qty } : item
        ))
    }

    if (loading) return <div className="p-8 text-center text-gray-500">Cargando...</div>
    if (!orden) return <div className="p-8 text-center text-red-500">No encontrada</div>

    return (
        <div className="p-6 max-w-7xl mx-auto">
            {/* Header operations */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
                <Link
                    href="/compras"
                    className="inline-flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900"
                >
                    <ArrowLeft className="w-4 h-4" />
                    Volver a Compras
                </Link>

                <div className="flex gap-2">
                    {orden.estado === 'BORRADOR' && (
                        <button
                            onClick={() => handleStatusChange('SEND')}
                            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center gap-2"
                        >
                            <Truck className="w-4 h-4" /> Enviar a Proveedor
                        </button>
                    )}
                    {(orden.estado === 'ENVIADA' || orden.estado === 'PARCIAL') && (
                        <button
                            onClick={() => setShowReceptionModal(true)}
                            className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 flex items-center gap-2"
                        >
                            <Box className="w-4 h-4" /> Recibir Mercancía
                        </button>
                    )}
                    {orden.estado === 'BORRADOR' && (
                        <button
                            onClick={() => handleStatusChange('CANCEL')}
                            className="bg-white border border-red-200 text-red-600 px-4 py-2 rounded-lg hover:bg-red-50"
                        >
                            Cancelar
                        </button>
                    )}
                    <button className="bg-white border border-gray-300 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-50 flex items-center gap-2">
                        <Printer className="w-4 h-4" /> PDF
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Main Content */}
                <div className="lg:col-span-2 space-y-6">
                    <div className="bg-white rounded-lg shadow-sm border p-6">
                        <div className="flex justify-between items-start mb-6 border-b pb-4">
                            <div>
                                <h1 className="text-2xl font-bold text-gray-900">Orden #{orden.folio}</h1>
                                <p className="text-gray-500">
                                    {new Date(orden.fecha).toLocaleDateString()} ·
                                    <span className={`ml-2 px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100`}>{orden.estado}</span>
                                </p>
                            </div>
                            <div className="text-right">
                                <div className="text-sm text-gray-500">Destino</div>
                                <div className="font-medium">{orden.obra?.nombre || 'Almacén Central'}</div>
                            </div>
                        </div>

                        {/* Proveedor Info */}
                        <div className="grid grid-cols-2 gap-4 mb-6 text-sm">
                            <div>
                                <span className="text-gray-500 block">Proveedor</span>
                                <span className="font-medium text-lg">{orden.proveedor.nombreComercial || orden.proveedor.razonSocial}</span>
                                <div>{orden.proveedor.rfc}</div>
                                <div>{orden.proveedor.email}</div>
                            </div>
                            <div className="text-right">
                                <span className="text-gray-500 block">Fecha Entrega Est.</span>
                                <span className="font-medium">{orden.fechaEntrega ? new Date(orden.fechaEntrega).toLocaleDateString() : 'Por definir'}</span>
                            </div>
                        </div>

                        {/* Table Items */}
                        <h3 className="font-semibold text-gray-900 mb-2">Detalles</h3>
                        <div className="overflow-x-auto border rounded-lg">
                            <table className="w-full text-sm">
                                <thead className="bg-gray-50 text-gray-500">
                                    <tr>
                                        <th className="px-4 py-2 text-left">Código</th>
                                        <th className="px-4 py-2 text-left">Descripción</th>
                                        <th className="px-4 py-2 text-right">Cant.</th>
                                        <th className="px-4 py-2 text-right">Recibido</th>
                                        <th className="px-4 py-2 text-right">Precio</th>
                                        <th className="px-4 py-2 text-right">Importe</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y">
                                    {orden.detalles.map(d => (
                                        <tr key={d.id}>
                                            <td className="px-4 py-3">{d.producto.codigo}</td>
                                            <td className="px-4 py-3">{d.producto.descripcion}</td>
                                            <td className="px-4 py-3 text-right font-medium">{d.cantidad} {d.producto.unidad?.abreviatura}</td>
                                            <td className="px-4 py-3 text-right">
                                                <span className={`${d.cantidadRecibida >= d.cantidad ? 'text-green-600 font-medium' : 'text-orange-500'}`}>
                                                    {d.cantidadRecibida}
                                                </span>
                                            </td>
                                            <td className="px-4 py-3 text-right">${Number(d.precioUnitario).toFixed(2)}</td>
                                            <td className="px-4 py-3 text-right">${Number(d.importe).toFixed(2)}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        {orden.notas && (
                            <div className="mt-4 p-3 bg-yellow-50 text-yellow-800 text-sm rounded">
                                <strong>Notas:</strong> {orden.notas}
                            </div>
                        )}
                    </div>
                </div>

                {/* Sidebar Totals */}
                <div className="space-y-6">
                    <div className="bg-white p-6 rounded-lg shadow-sm border sticky top-6">
                        <h3 className="font-semibold text-gray-900 mb-4">Resumen Financiero</h3>
                        <div className="space-y-3 text-sm">
                            <div className="flex justify-between text-gray-600">
                                <span>Subtotal</span>
                                <span>${Number(orden.subtotal).toLocaleString('es-MX', { minimumFractionDigits: 2 })}</span>
                            </div>
                            <div className="flex justify-between text-gray-600">
                                <span>IVA (16%)</span>
                                <span>${Number(orden.iva).toLocaleString('es-MX', { minimumFractionDigits: 2 })}</span>
                            </div>
                            <div className="flex justify-between font-bold text-lg text-gray-900 border-t pt-3 mt-3">
                                <span>Total</span>
                                <span>${Number(orden.total).toLocaleString('es-MX', { minimumFractionDigits: 2 })}</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Reception Modal */}
            {showReceptionModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] flex flex-col">
                        <div className="p-4 border-b flex justify-between items-center bg-gray-50">
                            <h3 className="font-semibold text-lg">Recibir Mercancia - OC #{orden.folio}</h3>
                            <button onClick={() => setShowReceptionModal(false)}><X className="w-5 h-5" /></button>
                        </div>

                        <div className="p-4 flex-1 overflow-y-auto">
                            <div className="mb-4 text-sm text-gray-600">
                                <AlertCircle className="w-4 h-4 inline mr-1 text-blue-500" />
                                Confirme las cantidades físicas recibidas. Esto aumentará el stock en inventario.
                            </div>

                            <form id="reception-form" onSubmit={handleReceptionSubmit}>
                                <table className="w-full text-sm border">
                                    <thead className="bg-gray-100">
                                        <tr>
                                            <th className="p-2 text-left">Producto</th>
                                            <th className="p-2 text-right">Solicitado</th>
                                            <th className="p-2 text-right">Pendiente</th>
                                            <th className="p-2 text-right w-32">Recibir Ahora</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y">
                                        {orden.detalles.map(d => {
                                            const formItem = receptionForm.find(r => r.detalleId === d.id)
                                            const pending = Math.max(0, d.cantidad - d.cantidadRecibida)

                                            if (pending <= 0) return null // Hide completed items? Or show disabled.

                                            return (
                                                <tr key={d.id}>
                                                    <td className="p-2">
                                                        <div className="font-medium">{d.producto.descripcion}</div>
                                                        <div className="text-xs text-gray-500">{d.producto.codigo}</div>
                                                    </td>
                                                    <td className="p-2 text-right text-gray-600">{d.cantidad}</td>
                                                    <td className="p-2 text-right font-medium text-orange-600">{pending}</td>
                                                    <td className="p-2">
                                                        <input
                                                            type="number"
                                                            min="0"
                                                            step="0.01"
                                                            max={pending}
                                                            className="w-full border rounded p-1 text-right"
                                                            value={formItem?.cantidad || 0}
                                                            onChange={(e) => updateReceptionQty(d.id, parseFloat(e.target.value))}
                                                        />
                                                    </td>
                                                </tr>
                                            )
                                        })}
                                    </tbody>
                                </table>
                            </form>
                        </div>

                        <div className="p-4 border-t bg-gray-50 flex justify-end gap-2">
                            <button
                                onClick={() => setShowReceptionModal(false)}
                                className="px-4 py-2 text-gray-600 hover:bg-gray-200 rounded"
                            >
                                Cancelar
                            </button>
                            <button
                                form="reception-form"
                                type="submit"
                                disabled={processing}
                                className="px-4 py-2 bg-green-600 text-white hover:bg-green-700 rounded shadow-sm disabled:opacity-50"
                            >
                                {processing ? 'Procesando...' : 'Confirmar Recepción'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}
