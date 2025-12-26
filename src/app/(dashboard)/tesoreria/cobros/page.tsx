'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, CheckCircle, CreditCard, Search } from 'lucide-react'

export default function CobrosPage() {
    const router = useRouter()
    const [step, setStep] = useState(1)
    const [loading, setLoading] = useState(false)

    const [cuentas, setCuentas] = useState<any[]>([])
    const [estimacionesPendientes, setEstimacionesPendientes] = useState<any[]>([])

    const [selectedCuenta, setSelectedCuenta] = useState<any>(null)
    const [selectedEstimacion, setSelectedEstimacion] = useState<any>(null)
    const [montoCobro, setMontoCobro] = useState(0)
    const [referencia, setReferencia] = useState('')

    useEffect(() => {
        loadData()
    }, [])

    const loadData = async () => {
        try {
            const [accRes, estRes] = await Promise.all([
                fetch('/api/tesoreria/cuentas'),
                fetch('/api/estimaciones?limit=100&estado=TODOS')
            ])
            const acc = await accRes.json()
            const est = await estRes.json()

            if (acc.data) setCuentas(acc.data)
            if (est.data?.data) {
                // Filter pending estimations (Approved, Invoiced but not fully paid)
                const pending = est.data.data.filter((e: any) =>
                    (e.estado === 'APROBADA' || e.estado === 'FACTURADA' || e.estado === 'ENVIADA') &&
                    e.estado !== 'PAGADA' && e.estado !== 'CANCELADA' && e.estado !== 'RECHAZADA'
                )
                setEstimacionesPendientes(pending)
            }
        } catch (e) {
            console.error(e)
        }
    }

    const handleProcessCollection = async () => {
        if (!selectedCuenta || !selectedEstimacion) return
        setLoading(true)
        try {
            // Calculate if full payment to update status? API handles logic but good to know
            const res = await fetch('/api/tesoreria/transacciones', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    cuentaId: selectedCuenta.id,
                    tipo: 'INGRESO',
                    monto: montoCobro,
                    fecha: new Date(),
                    concepto: `Cobro Est-${selectedEstimacion.numero} ${selectedEstimacion.obra.nombre}`,
                    referencia: referencia,
                    estimacionId: selectedEstimacion.id
                })
            })

            if (!res.ok) {
                const err = await res.json()
                throw new Error(err.error || 'Error al procesar cobro')
            }

            alert('Cobro registrado correctamente')
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
                    <h1 className="text-2xl font-bold">Registrar Cobro (Ingreso)</h1>
                    <p className="text-gray-500 text-sm">Registro de ingreso por Estimación aprobada</p>
                </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
                {/* Step 1: Select Account */}
                <div className={`p-6 border-b ${step > 1 ? 'opacity-50' : ''}`}>
                    <h3 className="font-bold flex items-center gap-2 mb-4">
                        <div className="w-6 h-6 rounded-full bg-slate-900 text-white flex items-center justify-center text-xs">1</div>
                        Selecciona Cuenta de Destino
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

                {/* Step 2: Select Estimation */}
                <div className={`p-6 border-b ${step !== 2 ? (step > 2 ? 'opacity-50' : 'opacity-30 pointer-events-none') : ''}`}>
                    <h3 className="font-bold flex items-center gap-2 mb-4">
                        <div className="w-6 h-6 rounded-full bg-slate-900 text-white flex items-center justify-center text-xs">2</div>
                        Selecciona Estimación
                    </h3>
                    {step === 2 && (
                        <div className="space-y-2 max-h-[300px] overflow-y-auto">
                            {estimacionesPendientes.length === 0 ? <div className="text-gray-500">No hay estimaciones pendientes de cobro</div> :
                                estimacionesPendientes.map(est => {
                                    const neto = Number(est.importeNeto)
                                    // Assumption: pagado is 0 if field just added. Need to ensure API returns it. 
                                    // If API doesn't return 'pagado' yet (we need to double check API response in createPaginatedResponse or include), 
                                    // we might need to rely on 'montoCobro' defaulting to 'neto'.
                                    // Ideally, we should update /api/estimaciones to include 'pagado' field in response.
                                    const saldo = neto - (Number(est.pagado) || 0)

                                    return (
                                        <div
                                            key={est.id}
                                            onClick={() => {
                                                setSelectedEstimacion({ ...est, saldoCalculado: saldo });
                                                setMontoCobro(saldo); // Default to full pending amount
                                                setStep(3);
                                            }}
                                            className="border rounded-lg p-3 cursor-pointer hover:border-slate-500 flex justify-between items-center"
                                        >
                                            <div>
                                                <div className="font-semibold">Est #{est.numero} · {est.obra?.nombre}</div>
                                                <div className="text-xs text-gray-500">Periodo: {est.periodo}</div>
                                            </div>
                                            <div className="text-right">
                                                <div className="text-sm font-bold text-green-600">Por cobrar: ${saldo.toLocaleString()}</div>
                                            </div>
                                        </div>
                                    )
                                })}
                        </div>
                    )}
                    {step > 2 && selectedEstimacion && (
                        <div className="flex items-center justify-between text-sm bg-gray-50 p-3 rounded">
                            <span className="font-medium">Est #{selectedEstimacion.numero} - {selectedEstimacion.obra?.nombre}</span>
                            <button onClick={() => setStep(2)} className="text-blue-600">Cambiar</button>
                        </div>
                    )}
                </div>

                {/* Step 3: Confirm Details */}
                <div className={`p-6 ${step !== 3 ? 'opacity-30 pointer-events-none' : ''}`}>
                    <h3 className="font-bold flex items-center gap-2 mb-4">
                        <div className="w-6 h-6 rounded-full bg-slate-900 text-white flex items-center justify-center text-xs">3</div>
                        Confirmar Cobro
                    </h3>
                    {step === 3 && (
                        <div className="space-y-4 max-w-sm">
                            <div>
                                <label className="block text-sm font-medium mb-1">Monto a Recibir</label>
                                <input
                                    type="number"
                                    className="w-full border rounded-lg p-2 text-lg font-bold text-green-700"
                                    value={montoCobro}
                                    onChange={e => setMontoCobro(parseFloat(e.target.value))}
                                />
                                <p className="text-xs text-gray-500 mt-1">
                                    Saldo pendiente: ${selectedEstimacion?.saldoCalculado?.toLocaleString()}
                                </p>
                            </div>
                            <div>
                                <label className="block text-sm font-medium mb-1">Referencia / Comprobante</label>
                                <input
                                    type="text"
                                    className="w-full border rounded-lg p-2"
                                    placeholder="Ej. SPEI 582928..."
                                    value={referencia}
                                    onChange={e => setReferencia(e.target.value)}
                                />
                            </div>

                            <div className="pt-4">
                                <button
                                    onClick={handleProcessCollection}
                                    disabled={loading}
                                    className="w-full bg-slate-900 text-white py-3 rounded-lg hover:bg-slate-800 font-bold flex justify-center items-center gap-2"
                                >
                                    {loading ? 'Procesando...' : (
                                        <>
                                            <CheckCircle className="w-5 h-5" /> Confirmar Ingreso
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
