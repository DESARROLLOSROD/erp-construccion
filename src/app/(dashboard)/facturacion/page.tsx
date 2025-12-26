'use client'

import { useState, useEffect } from 'react'
import { FileText, Calendar, DollarSign } from 'lucide-react'
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/components/ui/card'
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table'
import { useToast } from '@/hooks/use-toast'

interface Factura {
    id: string
    folio: string
    fecha: string
    clienteId: string
    subtotal: number
    iva: number
    total: number
    estado: string
    uuid?: string
    estimacion?: {
        numero: number
        obra: { nombre: string }
    }
}

export default function FacturacionPage() {
    const [facturas, setFacturas] = useState<Factura[]>([])
    const [loading, setLoading] = useState(true)
    const { toast } = useToast()

    useEffect(() => {
        fetchFacturas()
    }, [])

    const fetchFacturas = async () => {
        try {
            const res = await fetch('/api/facturacion')
            if (!res.ok) throw new Error('Error al cargar facturas')
            const data = await res.json()
            setFacturas(data)
        } catch (error) {
            toast({
                title: 'Error',
                description: 'No se pudieron cargar las facturas',
                variant: 'destructive',
            })
        } finally {
            setLoading(false)
        }
    }

    if (loading) {
        return <div className="p-8">Cargando...</div>
    }

    const totalFacturado = facturas.reduce((sum, f) => sum + f.total, 0)

    return (
        <div className="p-8 space-y-6">
            <div>
                <h1 className="text-3xl font-bold">Facturación</h1>
                <p className="text-muted-foreground">Facturas emitidas (CFDI 4.0)</p>
            </div>

            <div className="grid gap-4 md:grid-cols-3">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">
                            Total Facturado
                        </CardTitle>
                        <DollarSign className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">
                            ${totalFacturado.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">
                            Facturas Emitidas
                        </CardTitle>
                        <FileText className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{facturas.length}</div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">
                            Este Mes
                        </CardTitle>
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">
                            {facturas.filter((f) => {
                                const fecha = new Date(f.fecha)
                                const hoy = new Date()
                                return (
                                    fecha.getMonth() === hoy.getMonth() &&
                                    fecha.getFullYear() === hoy.getFullYear()
                                )
                            }).length}
                        </div>
                    </CardContent>
                </Card>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Facturas Emitidas</CardTitle>
                    <CardDescription>
                        Historial de facturas generadas
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Folio</TableHead>
                                <TableHead>Fecha</TableHead>
                                <TableHead>Obra / Estimación</TableHead>
                                <TableHead>Subtotal</TableHead>
                                <TableHead>IVA</TableHead>
                                <TableHead>Total</TableHead>
                                <TableHead>UUID</TableHead>
                                <TableHead>Estado</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {facturas.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={8} className="text-center h-24 text-muted-foreground">
                                        No hay facturas emitidas
                                    </TableCell>
                                </TableRow>
                            ) : (
                                facturas.map((factura) => (
                                    <TableRow key={factura.id}>
                                        <TableCell className="font-mono">{factura.folio}</TableCell>
                                        <TableCell>
                                            {new Date(factura.fecha).toLocaleDateString('es-MX')}
                                        </TableCell>
                                        <TableCell>
                                            {factura.estimacion ? (
                                                <div>
                                                    <div className="font-medium">
                                                        {factura.estimacion.obra.nombre}
                                                    </div>
                                                    <div className="text-xs text-muted-foreground">
                                                        Estimación #{factura.estimacion.numero}
                                                    </div>
                                                </div>
                                            ) : (
                                                '-'
                                            )}
                                        </TableCell>
                                        <TableCell>
                                            ${factura.subtotal.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                                        </TableCell>
                                        <TableCell>
                                            ${factura.iva.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                                        </TableCell>
                                        <TableCell className="font-semibold">
                                            ${factura.total.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                                        </TableCell>
                                        <TableCell>
                                            {factura.uuid ? (
                                                <span className="text-xs font-mono">{factura.uuid.substring(0, 8)}...</span>
                                            ) : (
                                                <span className="text-xs text-muted-foreground">Pendiente</span>
                                            )}
                                        </TableCell>
                                        <TableCell>
                                            <span
                                                className={`px-2 py-1 rounded text-xs ${factura.estado === 'TIMBRADA'
                                                        ? 'bg-green-100 text-green-800'
                                                        : factura.estado === 'CANCELADA'
                                                            ? 'bg-red-100 text-red-800'
                                                            : 'bg-yellow-100 text-yellow-800'
                                                    }`}
                                            >
                                                {factura.estado}
                                            </span>
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </div>
    )
}
