'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft, PackageMinus, Building2, Box } from 'lucide-react'

// Simple Types
interface Producto { id: string; nombre: string; codigo: string; stockActual: number }
interface Obra { id: string; nombre: string }

export default function SalidaInventarioPage() {
    const router = useRouter()
    const [productos, setProductos] = useState<Producto[]>([])
    const [obras, setObras] = useState<Obra[]>([])

    const [form, setForm] = useState({
        productoId: '',
        obraId: '',
        cantidad: '',
        observaciones: ''
    })

    const [loading, setLoading] = useState(true)
    const [submitting, setSubmitting] = useState(false)

    useEffect(() => {
        Promise.all([
            fetch('/api/catalogos/productos').then(res => res.json()), // Assuming this exists or similar
            fetch('/api/obras').then(res => res.json())
        ]).then(([prodRes, obraRes]) => {
            if (prodRes.data) setProductos(prodRes.data)
            if (obraRes.data) setObras(obraRes.data)
            setLoading(false)
        }).catch(err => {
            console.error(err)
            setLoading(false)
        })
    }, [])

    const selectedProduct = productos.find(p => p.id === form.productoId)

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setSubmitting(true)

        try {
            const res = await fetch('/api/inventario/movimientos', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    tipo: 'SALIDA_OBRA',
                    productoId: form.productoId,
                    obraId: form.obraId,
                    cantidad: Number(form.cantidad),
                    observaciones: form.observaciones
                })
            })

            const data = await res.json()

            if (!res.ok) {
                throw new Error(data.error || 'Error al registrar salida')
            }

            alert('Salida registrada correctamente')
            router.push('/inventario') // Or back to list
        } catch (error: any) {
            alert(error.message)
        } finally {
            setSubmitting(false)
        }
    }

    if (loading) return <div className="p-8">Cargando catálogos...</div>

    return (
        <div className="max-w-2xl mx-auto p-6">
            <h1 className="text-2xl font-bold mb-6 flex items-center gap-2">
                <PackageMinus className="w-6 h-6" /> Registrar Salida de Almacén
            </h1>

            <div className="bg-white p-6 rounded-xl shadow-sm border">
                <form onSubmit={handleSubmit} className="space-y-4">

                    {/* Producto */}
                    <div>
                        <label className="block text-sm font-medium mb-1">Producto</label>
                        <select
                            className="w-full border rounded p-2"
                            value={form.productoId}
                            onChange={e => setForm({ ...form, productoId: e.target.value })}
                            required
                        >
                            <option value="">Seleccione un producto</option>
                            {productos.map(p => (
                                <option key={p.id} value={p.id}>
                                    {p.codigo} - {p.nombre} (Stock: {Number(p.stockActual)})
                                </option>
                            ))}
                        </select>
                    </div>

                    {/* Info Stock */}
                    {selectedProduct && (
                        <div className="bg-slate-50 p-3 rounded text-sm flex justify-between">
                            <span className="text-gray-600">Stock Disponible:</span>
                            <span className={`font-bold ${Number(selectedProduct.stockActual) <= 0 ? 'text-red-500' : 'text-green-600'}`}>
                                {Number(selectedProduct.stockActual)}
                            </span>
                        </div>
                    )}

                    {/* Obra Destino */}
                    <div>
                        <label className="block text-sm font-medium mb-1">Obra Destino</label>
                        <select
                            className="w-full border rounded p-2"
                            value={form.obraId}
                            onChange={e => setForm({ ...form, obraId: e.target.value })}
                            required
                        >
                            <option value="">Seleccione la obra</option>
                            {obras.map(o => (
                                <option key={o.id} value={o.id}>{o.nombre}</option>
                            ))}
                        </select>
                    </div>

                    {/* Cantidad */}
                    <div>
                        <label className="block text-sm font-medium mb-1">Cantidad a Enviar</label>
                        <input
                            type="number"
                            step="0.01"
                            className="w-full border rounded p-2"
                            value={form.cantidad}
                            onChange={e => setForm({ ...form, cantidad: e.target.value })}
                            required
                            min="0.0001"
                        />
                    </div>

                    {/* Notas */}
                    <div>
                        <label className="block text-sm font-medium mb-1">Observaciones</label>
                        <textarea
                            className="w-full border rounded p-2"
                            rows={3}
                            value={form.observaciones}
                            onChange={e => setForm({ ...form, observaciones: e.target.value })}
                            placeholder="Ej. Material solicitado por Arq. Juan"
                        />
                    </div>

                    <div className="pt-4 flex gap-3">
                        <button
                            type="button"
                            onClick={() => router.back()}
                            className="px-4 py-2 border rounded hover:bg-gray-50"
                        >
                            Cancelar
                        </button>
                        <button
                            type="submit"
                            disabled={submitting}
                            className="flex-1 bg-slate-900 text-white px-4 py-2 rounded hover:bg-slate-800 disabled:opacity-50"
                        >
                            {submitting ? 'Registrando...' : 'Registrar Salida'}
                        </button>
                    </div>

                </form>
            </div>
        </div>
    )
}
