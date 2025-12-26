'use client'

import { useState, useEffect } from 'react'
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { TrendingUp, TrendingDown, AlertCircle, Building2 } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { FileDown } from 'lucide-react'
import { generarReporteEjecutivoPDF } from '@/lib/pdf/reportes-pdf'

export default function ReportesDashboard() {
    const [data, setData] = useState<any>(null)
    const [loading, setLoading] = useState(true)

    // ... fetch effect ... (same as before)

    useEffect(() => {
        fetch('/api/reportes/dashboard')
            .then(res => res.json())
            .then(res => {
                if (res.data) setData(res.data)
                setLoading(false)
            })
            .catch(err => {
                console.error(err)
                setLoading(false)
            })
    }, [])

    if (loading) return <div className="p-8">Calculando reportes...</div>
    if (!data) return <div className="p-8">No hay datos disponibles</div>

    const { financialHistory, resumenMes, alertasInventario, obrasActivas } = data

    const formatCurrency = (val: number) =>
        new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(val)

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h1 className="text-3xl font-bold tracking-tight text-slate-900">Reportes Ejecutivos</h1>
                <Button
                    onClick={() => generarReporteEjecutivoPDF(data)}
                    className="gap-2"
                >
                    <FileDown className="w-4 h-4" />
                    Descargar PDF
                </Button>
            </div>

            {/* 1. Monthly Summary Cards */}
            <div className="grid gap-4 md:grid-cols-3">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Ingresos (Mes Actual)</CardTitle>
                        <TrendingUp className="h-4 w-4 text-green-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-green-600">{formatCurrency(resumenMes?.ingresos || 0)}</div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Egresos (Mes Actual)</CardTitle>
                        <TrendingDown className="h-4 w-4 text-red-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-red-600">{formatCurrency(resumenMes?.egresos || 0)}</div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Utilidad Neta</CardTitle>
                        <div className={`h-2 w-2 rounded-full ${resumenMes?.utilidad >= 0 ? 'bg-green-500' : 'bg-red-500'}`} />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{formatCurrency(resumenMes?.utilidad || 0)}</div>
                        <p className="text-xs text-muted-foreground">Calculado sobre flujo de efectivo reales</p>
                    </CardContent>
                </Card>
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">

                {/* 2. Main Chart */}
                <Card className="col-span-4">
                    <CardHeader>
                        <CardTitle>Flujo de Efectivo (Últimos 6 Meses)</CardTitle>
                    </CardHeader>
                    <CardContent className="pl-2">
                        <div className="h-[300px]">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={financialHistory}>
                                    <CartesianGrid strokeDasharray="3 3" />
                                    <XAxis dataKey="mes" fontSize={12} tickLine={false} axisLine={false} />
                                    <YAxis
                                        fontSize={12}
                                        tickLine={false}
                                        axisLine={false}
                                        tickFormatter={(value) => `$${value / 1000}k`}
                                    />
                                    <Tooltip
                                        formatter={(value: number) => formatCurrency(value)}
                                        contentStyle={{ borderRadius: '8px' }}
                                    />
                                    <Legend />
                                    <Bar dataKey="ingresos" name="Ingresos" fill="#16a34a" radius={[4, 4, 0, 0]} />
                                    <Bar dataKey="egresos" name="Egresos" fill="#dc2626" radius={[4, 4, 0, 0]} />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </CardContent>
                </Card>

                {/* 3. Alerts & Side Lists */}
                <div className="col-span-3 space-y-4">

                    {/* Inventory Alerts */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2 text-base">
                                <AlertCircle className="w-4 h-4 text-orange-500" /> Alertas de Inventario
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            {alertasInventario.length === 0 ? (
                                <p className="text-sm text-gray-500">No hay productos con stock bajo.</p>
                            ) : (
                                <div className="space-y-3">
                                    {alertasInventario.map((p: any) => (
                                        <div key={p.id} className="flex justify-between items-center text-sm border-b pb-2 last:border-0 last:pb-0">
                                            <div>
                                                <div className="font-medium">{p.nombre}</div>
                                                <div className="text-xs text-gray-500 font-mono">{p.codigo}</div>
                                            </div>
                                            <div className="text-right">
                                                <div className="font-bold text-red-600">{Number(p.stockActual)}</div>
                                                <div className="text-xs text-gray-400">Min: {Number(p.stockMinimo)}</div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    {/* Active Works */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2 text-base">
                                <Building2 className="w-4 h-4 text-blue-500" /> Obras Activas Recientes
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-3">
                                {obrasActivas.map((o: any) => (
                                    <div key={o.id} className="text-sm border-b pb-2 last:border-0 last:pb-0">
                                        <div className="font-medium">{o.nombre}</div>
                                        <div className="flex justify-between text-xs text-gray-500 mt-1">
                                            <span>{o.cliente?.nombreComercial || 'Sin cliente'}</span>
                                            <span>Entrega: {o.fechaFinProgramada ? new Date(o.fechaFinProgramada).toLocaleDateString() : 'Pendiente'}</span>
                                        </div>
                                    </div>
                                ))}
                                {obrasActivas.length === 0 && <p className="text-sm text-gray-500">No hay obras en proceso.</p>}
                            </div>
                        </CardContent>
                    </Card>

                </div>
            </div>
        </div>
    )
}
