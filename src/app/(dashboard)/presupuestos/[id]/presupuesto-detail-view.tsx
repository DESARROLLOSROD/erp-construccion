"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { PresupuestoConTotales } from "@/types/presupuesto"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ConceptoTable } from "@/components/presupuestos/ConceptoTable"
import { ArrowLeft, Building2, FileText, CheckCircle2, Circle, Calendar, Edit } from "lucide-react"
import Link from "next/link"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import { PresupuestoForm } from "@/components/presupuestos/PresupuestoForm"
import { ObraListItem } from "@/types/obra"

interface PresupuestoDetailViewProps {
    presupuesto: PresupuestoConTotales
    unidades: Array<{ id: string; nombre: string; abreviatura: string }>
}

export function PresupuestoDetailView({ presupuesto: initialPresupuesto, unidades }: PresupuestoDetailViewProps) {
    const router = useRouter()
    const [presupuesto, setPresupuesto] = useState(initialPresupuesto)
    const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)

    const formatDate = (date: Date) => {
        return new Intl.DateTimeFormat('es-MX', {
            dateStyle: 'medium',
        }).format(new Date(date))
    }

    const handleAddConcepto = async (data: any) => {
        try {
            const response = await fetch(`/api/presupuestos/${presupuesto.id}/conceptos`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data),
            })

            if (!response.ok) {
                const errorText = await response.text()
                throw new Error(errorText)
            }

            router.refresh()
        } catch (error) {
            console.error('Error al agregar concepto:', error)
            alert(error instanceof Error ? error.message : 'Error al agregar concepto')
        }
    }

    const handleEditPresupuesto = async (data: any) => {
        try {
            const response = await fetch(`/api/presupuestos/${presupuesto.id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data),
            })

            if (!response.ok) {
                const errorText = await response.text()
                throw new Error(errorText)
            }

            setIsEditDialogOpen(false)
            router.refresh()
        } catch (error) {
            console.error('Error al actualizar presupuesto:', error)
            alert(error instanceof Error ? error.message : 'Error al actualizar presupuesto')
        }
    }

    // Mock obras array para el form (solo necesitamos la obra actual ya que no se puede cambiar)
    const obras: ObraListItem[] = presupuesto.obra ? [{
        ...presupuesto.obra,
        empresaId: '',
        clienteId: '',
        tipoContrato: 'PRECIO_ALZADO' as const,
        estado: 'EN_PROCESO' as const,
        montoContrato: 0,
        anticipoPct: 0,
        retencionPct: 0,
        fechaInicio: null,
        fechaFinProgramada: null,
        fechaFinReal: null,
        createdAt: new Date(),
        updatedAt: new Date(),
    }] : []

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <Link href="/presupuestos">
                        <Button variant="outline" size="icon">
                            <ArrowLeft className="h-4 w-4" />
                        </Button>
                    </Link>
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight">
                            {presupuesto.nombre}
                        </h1>
                        <p className="text-muted-foreground">
                            Detalles y conceptos del presupuesto
                        </p>
                    </div>
                </div>
                <Button variant="outline" onClick={() => setIsEditDialogOpen(true)}>
                    <Edit className="h-4 w-4 mr-2" />
                    Editar Presupuesto
                </Button>
            </div>

            {/* Información del presupuesto */}
            <div className="grid gap-4 md:grid-cols-2">
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Building2 className="h-5 w-5" />
                            Información de la Obra
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2">
                        <div>
                            <span className="text-sm font-medium text-muted-foreground">Código:</span>
                            <p className="text-base font-semibold">{presupuesto.obra?.codigo}</p>
                        </div>
                        <div>
                            <span className="text-sm font-medium text-muted-foreground">Nombre:</span>
                            <p className="text-base">{presupuesto.obra?.nombre}</p>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <FileText className="h-5 w-5" />
                            Detalles del Presupuesto
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2">
                        <div className="flex items-center justify-between">
                            <div>
                                <span className="text-sm font-medium text-muted-foreground">Versión:</span>
                                <p className="text-base font-semibold">v{presupuesto.version}</p>
                            </div>
                            <div className="flex items-center gap-2">
                                {presupuesto.esVigente ? (
                                    <>
                                        <CheckCircle2 className="h-5 w-5 text-green-600" />
                                        <span className="text-sm font-medium text-green-600">Vigente</span>
                                    </>
                                ) : (
                                    <>
                                        <Circle className="h-5 w-5 text-slate-400" />
                                        <span className="text-sm text-muted-foreground">No vigente</span>
                                    </>
                                )}
                            </div>
                        </div>
                        {presupuesto.descripcion && (
                            <div>
                                <span className="text-sm font-medium text-muted-foreground">Descripción:</span>
                                <p className="text-sm">{presupuesto.descripcion}</p>
                            </div>
                        )}
                        <div className="flex items-center gap-4 text-xs text-muted-foreground pt-2">
                            <div className="flex items-center gap-1">
                                <Calendar className="h-3 w-3" />
                                <span>Creado: {formatDate(presupuesto.createdAt)}</span>
                            </div>
                            <div className="flex items-center gap-1">
                                <Calendar className="h-3 w-3" />
                                <span>Actualizado: {formatDate(presupuesto.updatedAt)}</span>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Conceptos */}
            <Card>
                <CardHeader>
                    <CardTitle>Conceptos</CardTitle>
                    <CardDescription>
                        Partidas y conceptos incluidos en este presupuesto
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <ConceptoTable
                        conceptos={presupuesto.conceptos || []}
                        unidades={unidades}
                        onAdd={handleAddConcepto}
                    />
                </CardContent>
            </Card>

            {/* Dialog para editar presupuesto */}
            <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
                <DialogContent className="max-w-2xl">
                    <DialogHeader>
                        <DialogTitle>Editar Presupuesto</DialogTitle>
                        <DialogDescription>
                            Modifica los datos del presupuesto
                        </DialogDescription>
                    </DialogHeader>

                    <PresupuestoForm
                        presupuesto={presupuesto}
                        obras={obras}
                        onSubmit={handleEditPresupuesto}
                        onCancel={() => setIsEditDialogOpen(false)}
                    />
                </DialogContent>
            </Dialog>
        </div>
    )
}
