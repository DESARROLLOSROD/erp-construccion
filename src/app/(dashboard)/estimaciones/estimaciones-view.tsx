"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { EstimacionConTotales } from "@/types/estimacion"
import { ObraListItem } from "@/types/obra"
import { Presupuesto } from "@/types/presupuesto"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import { EstimacionForm } from "@/components/estimaciones/EstimacionForm"
import { Plus, FileText, Eye, Clock, CheckCircle2, XCircle } from "lucide-react"

interface EstimacionesViewProps {
    estimaciones: EstimacionConTotales[]
    obras: ObraListItem[]
    presupuestos: Presupuesto[]
}

const estadoLabels = {
    BORRADOR: 'Borrador',
    PENDIENTE: 'Pendiente',
    APROBADA: 'Aprobada',
    FACTURADA: 'Facturada',
    CANCELADA: 'Cancelada',
}

const estadoColors = {
    BORRADOR: 'bg-slate-100 text-slate-800',
    PENDIENTE: 'bg-yellow-100 text-yellow-800',
    APROBADA: 'bg-green-100 text-green-800',
    FACTURADA: 'bg-blue-100 text-blue-800',
    CANCELADA: 'bg-red-100 text-red-800',
}

export function EstimacionesView({ estimaciones: initialEstimaciones, obras, presupuestos }: EstimacionesViewProps) {
    const router = useRouter()
    const [estimaciones, setEstimaciones] = useState(initialEstimaciones)
    const [isDialogOpen, setIsDialogOpen] = useState(false)
    const [editingEstimacion, setEditingEstimacion] = useState<EstimacionConTotales | null>(null)

    const formatCurrency = (value: number) => {
        return new Intl.NumberFormat('es-MX', {
            style: 'currency',
            currency: 'MXN',
            minimumFractionDigits: 2,
        }).format(value)
    }

    const formatDate = (date: Date) => {
        return new Intl.DateTimeFormat('es-MX', {
            dateStyle: 'medium',
        }).format(new Date(date))
    }

    const handleOpenDialog = (estimacion?: EstimacionConTotales) => {
        setEditingEstimacion(estimacion || null)
        setIsDialogOpen(true)
    }

    const handleCloseDialog = () => {
        setIsDialogOpen(false)
        setEditingEstimacion(null)
    }

    const handleSubmit = async (data: any) => {
        try {
            if (editingEstimacion) {
                const response = await fetch(`/api/estimaciones/${editingEstimacion.id}`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(data),
                })

                if (!response.ok) {
                    const errorText = await response.text()
                    throw new Error(errorText)
                }
            } else {
                const response = await fetch('/api/estimaciones', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(data),
                })

                if (!response.ok) {
                    const errorText = await response.text()
                    throw new Error(errorText)
                }
            }

            handleCloseDialog()
            router.refresh()
        } catch (error) {
            console.error('Error al guardar estimación:', error)
            alert(error instanceof Error ? error.message : 'Error al guardar estimación')
        }
    }

    const handleViewEstimacion = (id: string) => {
        router.push(`/estimaciones/${id}`)
    }

    // Estadísticas
    const totalEstimaciones = estimaciones.length
    const estimacionesPendientes = estimaciones.filter(e => e.estado === 'PENDIENTE').length
    const estimacionesAprobadas = estimaciones.filter(e => e.estado === 'APROBADA').length
    const totalImporte = estimaciones
        .filter(e => e.estado !== 'CANCELADA')
        .reduce((sum, e) => sum + e.importeNeto, 0)

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Estimaciones</h1>
                    <p className="text-muted-foreground">
                        Gestiona las estimaciones y avances de obra
                    </p>
                </div>
                <Button onClick={() => handleOpenDialog()}>
                    <Plus className="h-4 w-4 mr-2" />
                    Nueva Estimación
                </Button>
            </div>

            {/* Estadísticas */}
            <div className="grid gap-4 md:grid-cols-4">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">
                            Total Estimaciones
                        </CardTitle>
                        <FileText className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{totalEstimaciones}</div>
                        <p className="text-xs text-muted-foreground">
                            Estimaciones registradas
                        </p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">
                            Pendientes
                        </CardTitle>
                        <Clock className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{estimacionesPendientes}</div>
                        <p className="text-xs text-muted-foreground">
                            En revisión
                        </p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">
                            Aprobadas
                        </CardTitle>
                        <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{estimacionesAprobadas}</div>
                        <p className="text-xs text-muted-foreground">
                            Listas para facturar
                        </p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">
                            Importe Total
                        </CardTitle>
                        <FileText className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{formatCurrency(totalImporte)}</div>
                        <p className="text-xs text-muted-foreground">
                            Monto neto total
                        </p>
                    </CardContent>
                </Card>
            </div>

            {/* Tabla de estimaciones */}
            <Card>
                <CardHeader>
                    <CardTitle>Lista de Estimaciones</CardTitle>
                    <CardDescription>
                        Administra y consulta las estimaciones de avance de obra
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    {estimaciones.length === 0 ? (
                        <div className="text-center py-12 bg-slate-50 rounded-lg border-2 border-dashed">
                            <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                            <p className="text-muted-foreground">No hay estimaciones registradas</p>
                            <p className="text-sm text-muted-foreground mt-1">
                                Crea tu primera estimación para comenzar
                            </p>
                        </div>
                    ) : (
                        <div className="rounded-md border">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead className="w-[80px]">Núm.</TableHead>
                                        <TableHead>Obra</TableHead>
                                        <TableHead>Periodo</TableHead>
                                        <TableHead>Fechas</TableHead>
                                        <TableHead className="text-center">Estado</TableHead>
                                        <TableHead className="text-right">Conceptos</TableHead>
                                        <TableHead className="text-right">Importe Neto</TableHead>
                                        <TableHead className="text-right">Acciones</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {estimaciones.map((estimacion) => (
                                        <TableRow key={estimacion.id}>
                                            <TableCell className="font-bold">
                                                #{estimacion.numero}
                                            </TableCell>
                                            <TableCell>
                                                <div>
                                                    <div className="font-medium">
                                                        {estimacion.obra?.codigo}
                                                    </div>
                                                    <div className="text-sm text-muted-foreground truncate max-w-xs">
                                                        {estimacion.obra?.nombre}
                                                    </div>
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <div className="font-medium">
                                                    {estimacion.periodo}
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <div className="text-sm">
                                                    <div>{formatDate(estimacion.fechaInicio)}</div>
                                                    <div className="text-muted-foreground">
                                                        al {formatDate(estimacion.fechaFin)}
                                                    </div>
                                                </div>
                                            </TableCell>
                                            <TableCell className="text-center">
                                                <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                                                    estadoColors[estimacion.estado as keyof typeof estadoColors]
                                                }`}>
                                                    {estadoLabels[estimacion.estado as keyof typeof estadoLabels]}
                                                </span>
                                            </TableCell>
                                            <TableCell className="text-right">
                                                <span className="font-medium">
                                                    {estimacion.totalConceptos}
                                                </span>
                                            </TableCell>
                                            <TableCell className="text-right font-semibold">
                                                {formatCurrency(estimacion.importeNeto)}
                                            </TableCell>
                                            <TableCell className="text-right">
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    onClick={() => handleViewEstimacion(estimacion.id)}
                                                    title="Ver detalles"
                                                >
                                                    <Eye className="h-4 w-4" />
                                                </Button>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Dialog para crear/editar estimación */}
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogContent className="max-w-2xl">
                    <DialogHeader>
                        <DialogTitle>
                            {editingEstimacion ? 'Editar Estimación' : 'Nueva Estimación'}
                        </DialogTitle>
                        <DialogDescription>
                            {editingEstimacion
                                ? 'Modifica los datos de la estimación'
                                : 'Crea una nueva estimación de avance de obra'}
                        </DialogDescription>
                    </DialogHeader>

                    <EstimacionForm
                        estimacion={editingEstimacion || undefined}
                        obras={obras}
                        presupuestos={presupuestos}
                        onSubmit={handleSubmit}
                        onCancel={handleCloseDialog}
                    />
                </DialogContent>
            </Dialog>
        </div>
    )
}
