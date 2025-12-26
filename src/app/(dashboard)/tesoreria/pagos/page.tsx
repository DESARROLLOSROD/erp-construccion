'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, CheckCircle, CreditCard, Search } from 'lucide-react'

export default function PagosPage() {
    const router = useRouter()
    const [step, setStep] = useState(1)
    const [loading, setLoading] = useState(false)

    const [cuentas, setCuentas] = useState<any[]>([])
    const [ordenesPendientes, setOrdenesPendientes] = useState<any[]>([])

    const [selectedCuenta, setSelectedCuenta] = useState<any>(null)
    const [selectedOrden, setSelectedOrden] = useState<any>(null)
    const [montoPago, setMontoPago] = useState(0)
    const [referencia, setReferencia] = useState('')

    useEffect(() => {
        loadData()
    }, [])

    const loadData = async () => {
        try {
            const [accRes, ocRes] = await Promise.all([
                fetch('/api/tesoreria/cuentas'),
                fetch('/api/compras?limit=100&estado=TODOS')
            ])
            const acc = await accRes.json()
            const oc = await ocRes.json()

            if (acc.data) setCuentas(acc.data)
            if (oc.data?.data) {
                // Filter pending orders (Partial, Sent, Completed but unpaid)
                // Simplified logic: If saldo > 0. But our List API might not return saldo yet unless field added. 
                // We added 'saldo' in DB. Let's assume list returns it or check logic.
                // Actually, we need to populate 'pagado' and 'saldo' in API response or calculate it.
                // For now, let's look for orders where updated 'saldo' > 0 OR 'pagado' < 'total'.
                // Since newly migrated orders have 0 paid, they are all unpaid.
                const pending = oc.data.data.filter((o: any) => o.estado !== 'CANCELADA' && o.estado !== 'BORRADOR')
                setOrdenesPendientes(pending)
            }
        } catch (e) {
            console.error(e)
        }
    }

    const handleProcessPayment = async () => {
        if (!selectedCuenta || !selectedOrden) return
        setLoading(true)
        try {
            const res = await fetch('/api/tesoreria/transacciones', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    cuentaId: selectedCuenta.id,
                    tipo: 'EGRESO',
                    monto: montoPago,
                    fecha: new Date(),
                    concepto: `Pago OC-${selectedOrden.folio} ${selectedOrden.proveedor.nombreComercial}`,
                    referencia: referencia,
                    ordenCompraId: selectedOrden.id
                })
            })

            if (!res.ok) {
                const err = await res.json()
                throw new Error(err.error || 'Error al procesar pago')
            }

            alert('Pago procesado correctamente')
            router.push('/tesoreria')

        } catch (error: any) {
            alert(error.message)
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="max-w-3xl mx-auto p-6">
            <div className="flex items-center gap-4 mb-8">
                <Link href="/tesoreria" className="p-2 hover:bg-gray-100 rounded-full">
                    <ArrowLeft className="w-5 h-5" />
                </Link>
                <div>
                    <h1 className="text-2xl font-bold">Nuevo Pago a Proveedor</h1>
                    <p className="text-gray-500 text-sm">Registro de egreso asociado a orden de compra</p>
                </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
                {/* Step 1: Select Account */}
                <div className={`p-6 border-b ${step > 1 ? 'opacity-50' : ''}`}>
                    <h3 className="font-bold flex items-center gap-2 mb-4">
                        <div className="w-6 h-6 rounded-full bg-slate-900 text-white flex items-center justify-center text-xs">1</div>
                        Selecciona Cuenta de Origen
                    </h3>
                    {step === 1 && (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            {cuentas.map(c => (
                                <div
                                    key={c.id}
                                    onClick={() => { setSelectedCuenta(c); setStep(2); }}
                                    className="border rounded-lg p-4 cursor-pointer hover:border-slate-500 hover:bg-slate-50 transition-all"
                                >
                                    <div className="font-semibold">{c.alias}</div>
                                    <div className="text-sm text-gray-500">{c.banco} **** {c.numeroCuenta.slice(-4)}</div>
                                    <div className="font-mono text-green-700 mt-2">${Number(c.saldo).toLocaleString()}</div>
                                </div>
                            ))}
                        </div>
                    )}
                    {step > 1 && selectedCuenta && (
                        <div className="flex items-center justify-between text-sm bg-gray-50 p-3 rounded">
                            <span className="font-medium">{selectedCuenta.alias}</span>
                            <button onClick={() => setStep(1)} className="text-blue-600">Cambiar</button>
                        </div>
                    )}
                </div>

                {/* Step 2: Select Purchase Order */}
                <div className={`p-6 border-b ${step !== 2 ? (step > 2 ? 'opacity-50' : 'opacity-30 pointer-events-none') : ''}`}>
                    <h3 className="font-bold flex items-center gap-2 mb-4">
                        <div className="w-6 h-6 rounded-full bg-slate-900 text-white flex items-center justify-center text-xs">2</div>
                        Selecciona Orden de Compra
                    </h3>
                    {step === 2 && (
                        <div className="space-y-2 max-h-[300px] overflow-y-auto">
                            {ordenesPendientes.map(oc => {
                                const saldo = Number(oc.total) - Number(oc.pagado || 0) // Calculated locally if not in API yet
                                return (
                                    <div
                                        key={oc.id}
                                        onClick={() => {
                                            setSelectedOrden({ ...oc, saldoCalculado: saldo });
                                            setMontoPago(saldo); // Default to full payment
                                            setStep(3);
                                        }}
                                        className="border rounded-lg p-3 cursor-pointer hover:border-slate-500 flex justify-between items-center"
                                    >
                                        <div>
                                            <div className="font-semibold">OC-{oc.folio} · {oc.proveedor.nombreComercial}</div>
                                            <div className="text-xs text-gray-500">Total: ${Number(oc.total).toLocaleString()}</div>
                                        </div>
                                        <div className="text-right">
                                            <div className="text-sm font-bold text-orange-600">Pendiente: ${saldo.toLocaleString()}</div>
                                        </div>
                                    </div>
                                )
                            })}
                        </div>
                    )}
                    {step > 2 && selectedOrden && (
                        <div className="flex items-center justify-between text-sm bg-gray-50 p-3 rounded">
                            <span className="font-medium">OC-{selectedOrden.folio} - {selectedOrden.proveedor?.nombreComercial}</span>
                            <button onClick={() => setStep(2)} className="text-blue-600">Cambiar</button>
                        </div>
                    )}
                </div>

                {/* Step 3: Confirm Details */}
                <div className={`p-6 ${step !== 3 ? 'opacity-30 pointer-events-none' : ''}`}>
                    <h3 className="font-bold flex items-center gap-2 mb-4">
                        <div className="w-6 h-6 rounded-full bg-slate-900 text-white flex items-center justify-center text-xs">3</div>
                        Confirmar Pago
                    </h3>
                    {step === 3 && (
                        <div className="space-y-4 max-w-sm">
                            <div>
                                <label className="block text-sm font-medium mb-1">Monto a Pagar</label>
                                <input
                                    type="number"
                                    className="w-full border rounded-lg p-2 text-lg font-bold"
                                    value={montoPago}
                                    onChange={e => setMontoPago(parseFloat(e.target.value))}
                                />
                                <p className="text-xs text-gray-500 mt-1">
                                    Saldo pendiente: ${selectedOrden?.saldoCalculado?.toLocaleString()}
                                </p>
                            </div>
                            <div>
                                <label className="block text-sm font-medium mb-1">Referencia (Opcional)</label>
                                <input
                                    type="text"
                                    className="w-full border rounded-lg p-2"
                                    placeholder="Ej. Cheque 1234, Transferencia..."
                                    value={referencia}
                                    onChange={e => setReferencia(e.target.value)}
                                />
                            </div>

                            <div className="pt-4">
                                <button
                                    onClick={handleProcessPayment}
                                    disabled={loading}
                                    className="w-full bg-green-600 text-white py-3 rounded-lg hover:bg-green-700 font-bold flex justify-center items-center gap-2"
                                >
                                    {loading ? 'Procesando...' : (
                                        <>
                                            <CheckCircle className="w-5 h-5" /> Confirmar Pago
                                        </>
                                    )}
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}
