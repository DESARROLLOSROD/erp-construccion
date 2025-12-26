'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Save, Trash2, Plus, Search } from 'lucide-react'

interface Product {
    id: string
    codigo: string
    descripcion: string
    precioCompra: number
    unidad: { abreviatura: string }
}

interface DetailRow {
    productoId: string
    codigo: string
    descripcion: string
    unidad: string
    cantidad: number
    precioUnitario: number
    importe: number
}

export default function NuevaCompraPage() {
    const router = useRouter()
    const [loading, setLoading] = useState(false)
    const [proveedores, setProveedores] = useState<any[]>([])
    const [obras, setObras] = useState<any[]>([])
    const [productos, setProductos] = useState<Product[]>([])

    // Form State
    const [formData, setFormData] = useState({
        proveedorId: '',
        obraId: '',
        fecha: new Date().toISOString().split('T')[0],
        fechaEntrega: '',
        notas: ''
    })

    const [detalles, setDetalles] = useState<DetailRow[]>([])
    const [showProductModal, setShowProductModal] = useState(false)

    // Load Catalogs on Mount
    useEffect(() => {
        const fetchCatalogs = async () => {
            try {
                const [provRes, prodRes, obraRes] = await Promise.all([
                    fetch('/api/proveedores?limit=100'),
                    fetch('/api/productos?limit=100'),
                    fetch('/api/obras?limit=100')
                ])
                const provData = await provRes.json()
                const prodData = await prodRes.json()
                const obraData = await obraRes.json()

                if (provData.data) setProveedores(provData.data.data)
                if (prodData.data) setProductos(prodData.data.data)
                if (obraData.data) setObras(obraData.data.data)
            } catch (e) {
                console.error("Error loading catalogs", e)
            }
        }
        fetchCatalogs()
    }, [])

    const handleAddProduct = (prod: Product) => {
        setDetalles(prev => [
            ...prev,
            {
                productoId: prod.id,
                codigo: prod.codigo,
                descripcion: prod.descripcion,
                unidad: prod.unidad?.abreviatura || 'PZA',
                cantidad: 1,
                precioUnitario: Number(prod.precioCompra || 0),
                importe: Number(prod.precioCompra || 0)
            }
        ])
        setShowProductModal(false)
    }

    const updateRow = (index: number, field: keyof DetailRow, value: number) => {
        setDetalles(prev => {
            const newRows = [...prev]
            const row = { ...newRows[index] }

            if (field === 'cantidad') row.cantidad = value
            if (field === 'precioUnitario') row.precioUnitario = value

            row.importe = row.cantidad * row.precioUnitario
            newRows[index] = row
            return newRows
        })
    }

    const removeRow = (index: number) => {
        setDetalles(prev => prev.filter((_, i) => i !== index))
    }

    const calculateTotals = () => {
        const subtotal = detalles.reduce((sum, row) => sum + row.importe, 0)
        const iva = subtotal * 0.16
        const total = subtotal + iva
        return { subtotal, iva, total }
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (detalles.length === 0) return alert('Agrega al menos un producto')

        setLoading(true)
        try {
            const payload = {
                ...formData,
                obraId: formData.obraId || undefined,
                fechaEntrega: formData.fechaEntrega || undefined,
                detalles: detalles.map(d => ({
                    productoId: d.productoId,
                    cantidad: d.cantidad,
                    precioUnitario: d.precioUnitario
                }))
            }

            const res = await fetch('/api/compras', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            })

            if (!res.ok) {
                const err = await res.json()
                throw new Error(err.error || 'Error al guardar')
            }

            const data = await res.json()
            router.push(`/compras/${data.data.id}`)
        } catch (error: any) {
            alert(error.message)
        } finally {
            setLoading(false)
        }
    }

    const { subtotal, iva, total } = calculateTotals()

    return (
        <div className="p-6 max-w-7xl mx-auto">
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-4">
                    <Link href="/compras" className="p-2 hover:bg-gray-100 rounded-full text-gray-600">
                        <ArrowLeft className="w-5 h-5" />
                    </Link>
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900">Nueva Orden de Compra</h1>
                        <p className="text-gray-500 text-sm">Crear borrador de orden</p>
                    </div>
                </div>
                <button
                    onClick={handleSubmit}
                    disabled={loading}
                    className="flex items-center gap-2 bg-slate-900 text-white px-6 py-2 rounded-lg hover:bg-slate-800 disabled:opacity-50"
                >
                    <Save className="w-4 h-4" />
                    {loading ? 'Guardando...' : 'Guardar Orden'}
                </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Main Form */}
                <div className="lg:col-span-2 space-y-6">
                    {/* General Info Card */}
                    <div className="bg-white p-6 rounded-lg shadow-sm border">
                        <h3 className="font-semibold text-gray-900 mb-4 border-b pb-2">Información General</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Proveedor *</label>
                                <select
                                    required
                                    className="w-full border rounded-lg p-2 bg-gray-50"
                                    value={formData.proveedorId}
                                    onChange={e => setFormData({ ...formData, proveedorId: e.target.value })}
                                >
                                    <option value="">Seleccione...</option>
                                    {proveedores.map(p => (
                                        <option key={p.id} value={p.id}>{p.nombreComercial || p.razonSocial}</option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Obra (Opcional)</label>
                                <select
                                    className="w-full border rounded-lg p-2 bg-gray-50"
                                    value={formData.obraId}
                                    onChange={e => setFormData({ ...formData, obraId: e.target.value })}
                                >
                                    <option value="">-- Inventario General --</option>
                                    {obras.map(o => (
                                        <option key={o.id} value={o.id}>{o.codigo} - {o.nombre}</option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Fecha Emisión *</label>
                                <input
                                    type="date"
                                    required
                                    className="w-full border rounded-lg p-2"
                                    value={formData.fecha}
                                    onChange={e => setFormData({ ...formData, fecha: e.target.value })}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Fecha Entrega</label>
                                <input
                                    type="date"
                                    className="w-full border rounded-lg p-2"
                                    value={formData.fechaEntrega}
                                    onChange={e => setFormData({ ...formData, fechaEntrega: e.target.value })}
                                />
                            </div>
                            <div className="md:col-span-2">
                                <label className="block text-sm font-medium text-gray-700 mb-1">Notas</label>
                                <textarea
                                    rows={2}
                                    className="w-full border rounded-lg p-2"
                                    value={formData.notas}
                                    onChange={e => setFormData({ ...formData, notas: e.target.value })}
                                />
                            </div>
                        </div>
                    </div>

                    {/* Items Card */}
                    <div className="bg-white p-6 rounded-lg shadow-sm border min-h-[400px]">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="font-semibold text-gray-900 border-b pb-2">Partidas</h3>
                            <button
                                type="button"
                                onClick={() => setShowProductModal(true)}
                                className="text-sm text-blue-600 hover:bg-blue-50 px-3 py-1 rounded"
                            >
                                + Agregar Producto
                            </button>
                        </div>

                        {detalles.length === 0 ? (
                            <div className="text-center py-12 text-gray-400 border-2 border-dashed rounded-lg">
                                No hay productos agregados.
                            </div>
                        ) : (
                            <div className="overflow-x-auto">
                                <table className="w-full text-sm">
                                    <thead className="bg-gray-50 text-gray-500">
                                        <tr>
                                            <th className="px-3 py-2 text-left">Código</th>
                                            <th className="px-3 py-2 text-left">Descripción</th>
                                            <th className="px-3 py-2 text-right w-24">Cant.</th>
                                            <th className="px-3 py-2 text-right w-32">P. Unitario</th>
                                            <th className="px-3 py-2 text-right">Importe</th>
                                            <th className="px-3 py-2 w-10"></th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y">
                                        {detalles.map((row, idx) => (
                                            <tr key={idx}>
                                                <td className="px-3 py-2">{row.codigo}</td>
                                                <td className="px-3 py-2">{row.descripcion}</td>
                                                <td className="px-3 py-2">
                                                    <input
                                                        type="number"
                                                        min="0.01"
                                                        step="0.01"
                                                        className="w-full text-right border rounded p-1"
                                                        value={row.cantidad}
                                                        onChange={e => updateRow(idx, 'cantidad', parseFloat(e.target.value))}
                                                    />
                                                </td>
                                                <td className="px-3 py-2">
                                                    <input
                                                        type="number"
                                                        min="0"
                                                        step="0.01"
                                                        className="w-full text-right border rounded p-1"
                                                        value={row.precioUnitario}
                                                        onChange={e => updateRow(idx, 'precioUnitario', parseFloat(e.target.value))}
                                                    />
                                                </td>
                                                <td className="px-3 py-2 text-right font-medium">
                                                    ${row.importe.toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                                </td>
                                                <td className="px-3 py-2 text-center">
                                                    <button onClick={() => removeRow(idx)} className="text-red-400 hover:text-red-600">
                                                        <Trash2 className="w-4 h-4" />
                                                    </button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>
                </div>

                {/* Totals Sidebar */}
                <div className="space-y-6">
                    <div className="bg-white p-6 rounded-lg shadow-sm border sticky top-6">
                        <h3 className="font-semibold text-gray-900 mb-4">Resumen</h3>
                        <div className="space-y-3 text-sm">
                            <div className="flex justify-between text-gray-600">
                                <span>Subtotal</span>
                                <span>${subtotal.toLocaleString('es-MX', { minimumFractionDigits: 2 })}</span>
                            </div>
                            <div className="flex justify-between text-gray-600">
                                <span>IVA (16%)</span>
                                <span>${iva.toLocaleString('es-MX', { minimumFractionDigits: 2 })}</span>
                            </div>
                            <div className="flex justify-between font-bold text-lg text-gray-900 border-t pt-3 mt-3">
                                <span>Total</span>
                                <span>${total.toLocaleString('es-MX', { minimumFractionDigits: 2 })}</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Product Search Modal */}
            {showProductModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl h-[500px] flex flex-col">
                        <div className="p-4 border-b flex justify-between items-center">
                            <h3 className="font-semibold text-lg">Seleccionar Producto</h3>
                            <button onClick={() => setShowProductModal(false)} className="text-gray-500 hover:text-gray-700">✕</button>
                        </div>
                        <div className="p-4 border-b bg-gray-50">
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                <input
                                    className="w-full pl-9 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    placeholder="Buscar producto..."
                                />
                            </div>
                        </div>
                        <div className="flex-1 overflow-y-auto p-2">
                            {productos.map(prod => (
                                <div
                                    key={prod.id}
                                    onClick={() => handleAddProduct(prod)}
                                    className="p-3 hover:bg-blue-50 cursor-pointer border-b last:border-0 flex justify-between items-center group"
                                >
                                    <div>
                                        <div className="font-medium text-gray-900">{prod.descripcion}</div>
                                        <div className="text-xs text-gray-500">Cod: {prod.codigo} · {prod.unidad?.abreviatura}</div>
                                    </div>
                                    <div className="text-right">
                                        <span className="text-sm font-medium text-green-700">${prod.precioCompra}</span>
                                        <Plus className="w-5 h-5 text-gray-400 group-hover:text-blue-600 ml-4 inline-block" />
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}
