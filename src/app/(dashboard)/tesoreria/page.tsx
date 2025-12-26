'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import {
    Wallet,
    ArrowUpRight,
    ArrowDownLeft,
    Plus,
    Landmark,
    CreditCard,
    DollarSign
} from 'lucide-react'

interface Cuenta {
    id: string
    alias: string
    banco: string
    numeroCuenta: string
    saldo: number
}

interface Transaccion {
    id: string
    fecha: string
    tipo: 'INGRESO' | 'EGRESO'
    monto: number
    concepto: string
    referencia: string
    cuenta: { alias: string }
}

export default function TesoreriaPage() {
    const [cuentas, setCuentas] = useState<Cuenta[]>([])
    const [movimientos, setMovimientos] = useState<Transaccion[]>([])
    const [loading, setLoading] = useState(true)
    const [showModal, setShowModal] = useState(false)

    // New Account Form
    const [newAccount, setNewAccount] = useState({ alias: '', banco: '', numeroCuenta: '', saldoInicial: 0 })

    useEffect(() => {
        fetchData()
    }, [])

    const fetchData = async () => {
        setLoading(true)
        try {
            const [accRes, movRes] = await Promise.all([
                fetch('/api/tesoreria/cuentas'),
                fetch('/api/tesoreria/transacciones?limit=10')
            ])
            const accData = await accRes.json()
            const movData = await movRes.json()

            if (accData.data) setCuentas(accData.data)
            if (movData.data?.data) setMovimientos(movData.data.data)
        } catch (e) {
            console.error(e)
        } finally {
            setLoading(false)
        }
    }

    const handleCreateAccount = async (e: React.FormEvent) => {
        e.preventDefault()
        try {
            const res = await fetch('/api/tesoreria/cuentas', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(newAccount)
            })
            if (res.ok) {
                setShowModal(false)
                setNewAccount({ alias: '', banco: '', numeroCuenta: '', saldoInicial: 0 })
                fetchData()
            } else {
                alert('Error al crear cuenta')
            }
        } catch (e) {
            console.error(e)
        }
    }

    const saldoTotal = cuentas.reduce((sum, c) => sum + Number(c.saldo), 0)

    return (
        <div className="p-6 max-w-7xl mx-auto space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900">Tesorería</h1>
                    <p className="text-gray-500">Gestión de bancos y flujo de efectivo</p>
                </div>
                <div className="flex gap-2">
                    <button
                        onClick={() => setShowModal(true)}
                        className="bg-white border text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-50 flex items-center gap-2"
                    >
                        <Plus className="w-4 h-4" /> Nueva Cuenta
                    </button>
                    <Link href="/tesoreria/cobros" className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 flex items-center gap-2">
                        <ArrowDownLeft className="w-4 h-4" /> Registrar Ingreso
                    </Link>
                    <Link href="/tesoreria/pagos" className="bg-slate-900 text-white px-4 py-2 rounded-lg hover:bg-slate-800 flex items-center gap-2">
                        <ArrowUpRight className="w-4 h-4" /> Realizar Pago
                    </Link>
                </div>
            </div>

            {/* Resumen Global */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-xl p-6 text-white shadow-lg">
                    <div className="flex items-center gap-3 mb-4 opacity-80">
                        <Wallet className="w-6 h-6" />
                        <span className="font-medium">Saldo Total Disponible</span>
                    </div>
                    <div className="text-4xl font-bold">
                        ${saldoTotal.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                    </div>
                    <p className="mt-2 text-sm opacity-60">En {cuentas.length} cuentas bancarias</p>
                </div>

                {/* Cuentas Cards */}
                {cuentas.map(cuenta => (
                    <div key={cuenta.id} className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 flex flex-col justify-between hover:shadow-md transition-shadow">
                        <div className="flex justify-between items-start">
                            <div>
                                <div className="font-bold text-gray-900">{cuenta.alias}</div>
                                <div className="text-sm text-gray-500 flex items-center gap-1 mt-1">
                                    <Landmark className="w-3 h-3" /> {cuenta.banco}
                                </div>
                            </div>
                            <CreditCard className="w-8 h-8 text-gray-200" />
                        </div>
                        <div className="mt-6">
                            <div className="text-sm text-gray-400 mb-1">Saldo</div>
                            <div className="text-2xl font-semibold text-gray-900">
                                ${Number(cuenta.saldo).toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                            </div>
                            <div className="text-xs text-gray-400 mt-2 font-mono">
                                **** {cuenta.numeroCuenta.slice(-4)}
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Transacciones Recientes */}
            <div className="bg-white rounded-xl shadow-sm border p-6">
                <h3 className="font-bold text-lg text-gray-900 mb-4">Movimientos Recientes</h3>
                {movimientos.length === 0 ? (
                    <div className="text-center py-8 text-gray-400">Sin movimientos registrados</div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm text-left">
                            <thead className="bg-gray-50 text-gray-500">
                                <tr>
                                    <th className="p-3">Fecha</th>
                                    <th className="p-3">Concepto</th>
                                    <th className="p-3">Cuenta</th>
                                    <th className="p-3 text-right">Monto</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y">
                                {movimientos.map(mov => (
                                    <tr key={mov.id} className="hover:bg-gray-50">
                                        <td className="p-3 text-gray-500">
                                            {new Date(mov.fecha).toLocaleDateString()}
                                        </td>
                                        <td className="p-3">
                                            <div className="font-medium text-gray-900">{mov.concepto}</div>
                                            {mov.referencia && <div className="text-xs text-gray-400">{mov.referencia}</div>}
                                        </td>
                                        <td className="p-3 text-gray-500">{mov.cuenta.alias}</td>
                                        <td className={`p-3 text-right font-medium ${mov.tipo === 'INGRESO' ? 'text-green-600' : 'text-red-600'}`}>
                                            {mov.tipo === 'INGRESO' ? '+' : '-'}${Number(mov.monto).toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* Modal Nueva Cuenta */}
            {showModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-xl shadow-lg w-full max-w-md p-6">
                        <h3 className="text-xl font-bold mb-4">Registrar Cuenta Bancaria</h3>
                        <form onSubmit={handleCreateAccount} className="space-y-4">
                            <div>
                                <label className="text-sm font-medium">Bancos / Alias</label>
                                <input
                                    className="w-full border rounded-lg p-2"
                                    placeholder="Ej. Banamex Maestra"
                                    required
                                    value={newAccount.alias}
                                    onChange={e => setNewAccount({ ...newAccount, alias: e.target.value })}
                                />
                            </div>
                            <div>
                                <label className="text-sm font-medium">Institución</label>
                                <input
                                    className="w-full border rounded-lg p-2"
                                    placeholder="Ej. BANAMEX"
                                    required
                                    value={newAccount.banco}
                                    onChange={e => setNewAccount({ ...newAccount, banco: e.target.value })}
                                />
                            </div>
                            <div>
                                <label className="text-sm font-medium">Número de Cuenta</label>
                                <input
                                    className="w-full border rounded-lg p-2"
                                    placeholder="10 dígitos o CLABE"
                                    required
                                    value={newAccount.numeroCuenta}
                                    onChange={e => setNewAccount({ ...newAccount, numeroCuenta: e.target.value })}
                                />
                            </div>
                            <div>
                                <label className="text-sm font-medium">Saldo Inicial (Apertura)</label>
                                <input
                                    type="number"
                                    className="w-full border rounded-lg p-2"
                                    placeholder="0.00"
                                    required
                                    value={newAccount.saldoInicial}
                                    onChange={e => setNewAccount({ ...newAccount, saldoInicial: parseFloat(e.target.value) })}
                                />
                            </div>
                            <div className="flex justify-end gap-2 mt-6">
                                <button type="button" onClick={() => setShowModal(false)} className="px-4 py-2 hover:bg-gray-100 rounded">Cancelar</button>
                                <button type="submit" className="px-4 py-2 bg-slate-900 text-white rounded">Guardar</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    )
}
