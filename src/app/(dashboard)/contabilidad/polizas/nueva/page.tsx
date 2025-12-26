'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui'
import {
    Table, TableBody, TableCell, TableHead, TableHeader, TableRow
} from '@/components/ui/table'
import { Trash2, Plus, ArrowLeft, Save } from 'lucide-react'

// Simple Account Search Component could be here, but using select for MVP
interface Cuenta {
    id: string; codigo: string; nombre: string;
}

export default function NuevaPolizaPage() {
    const router = useRouter()
    const [cuentas, setCuentas] = useState<Cuenta[]>([])

    // Form State
    const [tipo, setTipo] = useState('DIARIO')
    const [fecha, setFecha] = useState(new Date().toISOString().split('T')[0])
    const [concepto, setConcepto] = useState('')

    const [detalles, setDetalles] = useState([
        { cuentaId: '', descripcion: '', debe: 0, haber: 0 },
        { cuentaId: '', descripcion: '', debe: 0, haber: 0 }
    ])

    useEffect(() => {
        fetch('/api/contabilidad/cuentas')
            .then(res => res.json())
            .then(res => {
                if (res.data) setCuentas(res.data)
            })
    }, [])

    const addRow = () => {
        setDetalles([...detalles, { cuentaId: '', descripcion: '', debe: 0, haber: 0 }])
    }

    const removeRow = (index: number) => {
        const newDetalles = [...detalles]
        newDetalles.splice(index, 1)
        setDetalles(newDetalles)
    }

    const updateRow = (index: number, field: string, value: any) => {
        const newDetalles = [...detalles]
        newDetalles[index] = { ...newDetalles[index], [field]: value }
        setDetalles(newDetalles)
    }

    // Totals
    const totalDebe = details => details.reduce((sum, d) => sum + Number(d.debe || 0), 0)
    const totalHaber = details => details.reduce((sum, d) => sum + Number(d.haber || 0), 0)

    const sumDebe = totalDebe(detalles)
    const sumHaber = totalHaber(detalles)
    const difference = sumDebe - sumHaber
    const isSquared = Math.abs(difference) < 0.01

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!isSquared) {
            alert('La póliza no cuadra')
            return
        }

        try {
            const res = await fetch('/api/contabilidad/polizas', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    tipo,
                    fecha: new Date(fecha).toISOString(),
                    concepto,
                    detalles: detalles.filter(d => d.cuentaId) // Remove empty
                })
            })

            if (res.ok) {
                alert('Póliza guardada')
                router.push('/contabilidad/polizas')
            } else {
                const err = await res.json()
                alert(err.error || 'Error al guardar')
            }
        } catch (error) {
            alert('Error al guardar')
        }
    }

    return (
        <div className="max-w-5xl mx-auto space-y-6 pb-20">
            <div className="flex items-center gap-4 border-b pb-4">
                <Button variant="ghost" size="icon" onClick={() => router.back()}>
                    <ArrowLeft className="h-4 w-4" />
                </Button>
                <div>
                    <h1 className="text-2xl font-bold">Nueva Póliza</h1>
                    <p className="text-gray-500 text-sm">Registro de movimientos contables</p>
                </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">

                {/* Header Fields */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 bg-white p-4 rounded border">
                    <div>
                        <label className="block text-sm font-medium mb-1">Tipo</label>
                        <select
                            className="w-full border rounded p-2"
                            value={tipo}
                            onChange={e => setTipo(e.target.value)}
                        >
                            <option value="DIARIO">Diario</option>
                            <option value="INGRESO">Ingreso</option>
                            <option value="EGRESO">Egreso</option>
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-medium mb-1">Fecha</label>
                        <input
                            type="date"
                            className="w-full border rounded p-2"
                            value={fecha}
                            onChange={e => setFecha(e.target.value)}
                            required
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium mb-1">Concepto General</label>
                        <input
                            type="text"
                            className="w-full border rounded p-2"
                            value={concepto}
                            onChange={e => setConcepto(e.target.value)}
                            required
                        />
                    </div>
                </div>

                {/* Details Table */}
                <div className="bg-white rounded border overflow-hidden">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead className="w-[30%]">Cuenta</TableHead>
                                <TableHead className="w-[30%]">Descripción (Opcional)</TableHead>
                                <TableHead className="text-right w-[15%]">Debe</TableHead>
                                <TableHead className="text-right w-[15%]">Haber</TableHead>
                                <TableHead className="w-[5%]"></TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {detalles.map((row, index) => (
                                <TableRow key={index}>
                                    <TableCell>
                                        <select
                                            className="w-full border rounded p-1 text-sm bg-transparent"
                                            value={row.cuentaId}
                                            onChange={e => updateRow(index, 'cuentaId', e.target.value)}
                                            required
                                        >
                                            <option value="">Seleccionar...</option>
                                            {cuentas.map(c => (
                                                <option key={c.id} value={c.id}>
                                                    {c.codigo} - {c.nombre}
                                                </option>
                                            ))}
                                        </select>
                                    </TableCell>
                                    <TableCell>
                                        <input
                                            className="w-full border-b p-1 text-sm outline-none"
                                            value={row.descripcion}
                                            onChange={e => updateRow(index, 'descripcion', e.target.value)}
                                            placeholder="Detalle del movimiento"
                                        />
                                    </TableCell>
                                    <TableCell>
                                        <input
                                            type="number"
                                            step="0.01"
                                            className="w-full text-right border-b p-1 text-sm outline-none bg-blue-50/50"
                                            value={row.debe}
                                            onChange={e => updateRow(index, 'debe', Number(e.target.value))}
                                            onFocus={e => e.target.select()}
                                        />
                                    </TableCell>
                                    <TableCell>
                                        <input
                                            type="number"
                                            step="0.01"
                                            className="w-full text-right border-b p-1 text-sm outline-none bg-red-50/50"
                                            value={row.haber}
                                            onChange={e => updateRow(index, 'haber', Number(e.target.value))}
                                            onFocus={e => e.target.select()}
                                        />
                                    </TableCell>
                                    <TableCell>
                                        <Button
                                            type="button"
                                            variant="ghost"
                                            size="icon"
                                            className="h-8 w-8 text-red-500"
                                            onClick={() => removeRow(index)}
                                        >
                                            <Trash2 className="h-4 w-4" />
                                        </Button>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>

                    <div className="p-2 border-t">
                        <Button type="button" variant="ghost" onClick={addRow} className="gap-2 text-sm text-blue-600">
                            <Plus className="h-4 w-4" /> Agregar Movimiento
                        </Button>
                    </div>
                </div>

                {/* Footer Totals */}
                <div className="flex justify-end gap-8 bg-slate-50 p-4 rounded border text-sm font-medium">
                    <div className="text-right">
                        <div className="text-gray-500">Total Debe</div>
                        <div className="text-lg text-blue-700">{sumDebe.toLocaleString('es-MX', { style: 'currency', currency: 'MXN' })}</div>
                    </div>
                    <div className="text-right">
                        <div className="text-gray-500">Total Haber</div>
                        <div className="text-lg text-red-700">{sumHaber.toLocaleString('es-MX', { style: 'currency', currency: 'MXN' })}</div>
                    </div>
                    <div className="text-right border-l pl-8">
                        <div className="text-gray-500">Diferencia</div>
                        <div className={`text-lg ${isSquared ? 'text-green-600' : 'text-red-600 font-bold'}`}>
                            {difference.toLocaleString('es-MX', { style: 'currency', currency: 'MXN' })}
                        </div>
                    </div>
                </div>

                <div className="flex justify-end pt-4">
                    <Button
                        type="submit"
                        disabled={!isSquared}
                        className={`w-[200px] ${!isSquared ? 'opacity-50 cursor-not-allowed' : ''}`}
                    >
                        <Save className="mr-2 h-4 w-4" /> Guardar Póliza
                    </Button>
                </div>

            </form>
        </div>
    )
}
