"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { PresupuestoConTotales } from "@/types/presupuesto"
import { ObraListItem } from "@/types/obra"
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
import { PresupuestoForm } from "@/components/presupuestos/PresupuestoForm"
import { Plus, FileText, Eye, CheckCircle2, Circle, Building2 } from "lucide-react"

interface PresupuestosViewProps {
    presupuestos: PresupuestoConTotales[]
    obras: ObraListItem[]
    unidades: Array<{ id: string; nombre: string; abreviatura: string }>
}

export function PresupuestosView({ presupuestos: initialPresupuestos, obras, unidades }: PresupuestosViewProps) {
    const router = useRouter()
    const [presupuestos, setPresupuestos] = useState(initialPresupuestos)
    const [isDialogOpen, setIsDialogOpen] = useState(false)
    const [editingPresupuesto, setEditingPresupuesto] = useState<PresupuestoConTotales | null>(null)

    const formatCurrency = (value: number) => {
        return new Intl.NumberFormat('es-MX', {
            style: 'currency',
            currency: 'MXN',
            minimumFractionDigits: 2,
        }).format(value)
    }

    const handleOpenDialog = (presupuesto?: PresupuestoConTotales) => {
        setEditingPresupuesto(presupuesto || null)
        setIsDialogOpen(true)
    }

    const handleCloseDialog = () => {
        setIsDialogOpen(false)
        setEditingPresupuesto(null)
    }

    const handleSubmit = async (data: any) => {
        try {
            if (editingPresupuesto) {
                const response = await fetch(`/api/presupuestos/${editingPresupuesto.id}`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(data),
                })

                if (!response.ok) {
                    const errorText = await response.text()
                    throw new Error(errorText)
                }
            } else {
                const response = await fetch('/api/presupuestos', {
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
            console.error('Error al guardar presupuesto:', error)
            alert(error instanceof Error ? error.message : 'Error al guardar presupuesto')
        }
    }

    const handleViewPresupuesto = (id: string) => {
        router.push(`/presupuestos/${id}`)
    }

    // Estadísticas
    const totalPresupuestos = presupuestos.length
    const presupuestosVigentes = presupuestos.filter(p => p.esVigente).length
    const totalImporte = presupuestos
        .filter(p => p.esVigente)
        .reduce((sum, p) => sum + p.importeTotal, 0)

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Presupuestos</h1>
                    <p className="text-muted-foreground">
                        Gestiona los presupuestos de tus obras
                    </p>
                </div>
                <Button onClick={() => handleOpenDialog()}>
                    <Plus className="h-4 w-4 mr-2" />
                    Nuevo Presupuesto
                </Button>
            </div>

            {/* Estadísticas */}
            <div className="grid gap-4 md:grid-cols-3">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">
                            Total Presupuestos
                        </CardTitle>
                        <FileText className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{totalPresupuestos}</div>
                        <p className="text-xs text-muted-foreground">
                            Presupuestos registrados
                        </p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">
                            Presupuestos Vigentes
                        </CardTitle>
                        <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{presupuestosVigentes}</div>
                        <p className="text-xs text-muted-foreground">
                            Actualmente activos
                        </p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">
                            Importe Total Vigente
                        </CardTitle>
                        <Building2 className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{formatCurrency(totalImporte)}</div>
                        <p className="text-xs text-muted-foreground">
                            De presupuestos vigentes
                        </p>
                    </CardContent>
                </Card>
            </div>

            {/* Tabla de presupuestos */}
            <Card>
                <CardHeader>
                    <CardTitle>Lista de Presupuestos</CardTitle>
                    <CardDescription>
                        Administra y consulta los presupuestos de todas las obras
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    {presupuestos.length === 0 ? (
                        <div className="text-center py-12 bg-slate-50 rounded-lg border-2 border-dashed">
                            <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                            <p className="text-muted-foreground">No hay presupuestos registrados</p>
                            <p className="text-sm text-muted-foreground mt-1">
                                Crea tu primer presupuesto para comenzar
                            </p>
                        </div>
                    ) : (
                        <div className="rounded-md border">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Obra</TableHead>
                                        <TableHead>Presupuesto</TableHead>
                                        <TableHead className="text-center">Versión</TableHead>
                                        <TableHead className="text-center">Vigente</TableHead>
                                        <TableHead className="text-right">Conceptos</TableHead>
                                        <TableHead className="text-right">Importe Total</TableHead>
                                        <TableHead className="text-right">Acciones</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {presupuestos.map((presupuesto) => (
                                        <TableRow key={presupuesto.id}>
                                            <TableCell>
                                                <div>
                                                    <div className="font-medium">
                                                        {presupuesto.obra?.codigo}
                                                    </div>
                                                    <div className="text-sm text-muted-foreground truncate max-w-xs">
                                                        {presupuesto.obra?.nombre}
                                                    </div>
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <div>
                                                    <div className="font-medium">
                                                        {presupuesto.nombre}
                                                    </div>
                                                    {presupuesto.descripcion && (
                                                        <div className="text-sm text-muted-foreground truncate max-w-xs">
                                                            {presupuesto.descripcion}
                                                        </div>
                                                    )}
                                                </div>
                                            </TableCell>
                                            <TableCell className="text-center">
                                                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-slate-100 text-slate-800">
                                                    v{presupuesto.version}
                                                </span>
                                            </TableCell>
                                            <TableCell className="text-center">
                                                {presupuesto.esVigente ? (
                                                    <div title="Presupuesto vigente">
                                                        <CheckCircle2 className="h-5 w-5 text-green-600 mx-auto" />
                                                    </div>
                                                ) : (
                                                    <div title="No vigente">
                                                        <Circle className="h-5 w-5 text-slate-300 mx-auto" />
                                                    </div>
                                                )}
                                            </TableCell>
                                            <TableCell className="text-right">
                                                <span className="font-medium">
                                                    {presupuesto.totalConceptos}
                                                </span>
                                            </TableCell>
                                            <TableCell className="text-right font-semibold">
                                                {formatCurrency(presupuesto.importeTotal)}
                                            </TableCell>
                                            <TableCell className="text-right">
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    onClick={() => handleViewPresupuesto(presupuesto.id)}
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

            {/* Dialog para crear/editar presupuesto */}
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogContent className="max-w-2xl">
                    <DialogHeader>
                        <DialogTitle>
                            {editingPresupuesto ? 'Editar Presupuesto' : 'Nuevo Presupuesto'}
                        </DialogTitle>
                        <DialogDescription>
                            {editingPresupuesto
                                ? 'Modifica los datos del presupuesto'
                                : 'Crea un nuevo presupuesto para una obra'}
                        </DialogDescription>
                    </DialogHeader>

                    <PresupuestoForm
                        presupuesto={editingPresupuesto || undefined}
                        obras={obras}
                        onSubmit={handleSubmit}
                        onCancel={handleCloseDialog}
                    />
                </DialogContent>
            </Dialog>
        </div>
    )
}
