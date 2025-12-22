"use client"

import { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Plus, FileText, CheckCircle2 } from "lucide-react"

interface ConceptoEstimacion {
    id: string
    conceptoPresupuestoId: string
    cantidadEjecutada: number
    cantidadAcumulada: number
    importe: number
    conceptoPresupuesto?: {
        id: string
        clave: string
        descripcion: string
        cantidad: number
        precioUnitario: number
        unidad?: {
            id: string
            nombre: string
            abreviatura: string
        } | null
    }
}

interface AvanceConcepto {
    conceptoPresupuestoId: string
    clave: string
    descripcion: string
    unidad: { abreviatura: string } | null
    precioUnitario: number
    cantidadPresupuesto: number
    cantidadAcumulada: number
    cantidadPendiente: number
    porcentajeAvance: number
}

const conceptoSchema = z.object({
    cantidadEjecutada: z.coerce.number().min(0, "La cantidad debe ser mayor o igual a 0"),
})

type ConceptoFormValues = z.infer<typeof conceptoSchema>

interface ConceptoEstimacionTableProps {
    conceptos: ConceptoEstimacion[]
    avanceConceptos: AvanceConcepto[]
    onAdd: (conceptoPresupuestoId: string, cantidadEjecutada: number) => Promise<void>
    readonly?: boolean
}

export function ConceptoEstimacionTable({
    conceptos,
    avanceConceptos,
    onAdd,
    readonly = false,
}: ConceptoEstimacionTableProps) {
    const [isDialogOpen, setIsDialogOpen] = useState(false)
    const [selectedConcepto, setSelectedConcepto] = useState<AvanceConcepto | null>(null)

    const form = useForm<ConceptoFormValues>({
        resolver: zodResolver(conceptoSchema),
        defaultValues: {
            cantidadEjecutada: 0,
        },
    })

    const formatCurrency = (value: number) => {
        return new Intl.NumberFormat('es-MX', {
            style: 'currency',
            currency: 'MXN',
            minimumFractionDigits: 2,
        }).format(value)
    }

    const formatNumber = (value: number) => {
        return new Intl.NumberFormat('es-MX', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
        }).format(value)
    }

    const handleOpenDialog = (concepto: AvanceConcepto) => {
        setSelectedConcepto(concepto)
        form.reset({
            cantidadEjecutada: 0,
        })
        setIsDialogOpen(true)
    }

    const handleCloseDialog = () => {
        setIsDialogOpen(false)
        setSelectedConcepto(null)
        form.reset()
    }

    const handleSubmit = async (data: ConceptoFormValues) => {
        if (!selectedConcepto) return

        try {
            await onAdd(selectedConcepto.conceptoPresupuestoId, data.cantidadEjecutada)
            handleCloseDialog()
        } catch (error) {
            console.error('Error al agregar concepto:', error)
        }
    }

    const totalImporte = conceptos.reduce((sum, c) => sum + c.importe, 0)
    const totalSubtotal = totalImporte
    const totalIVA = totalSubtotal * 0.16
    const totalRetencion = totalSubtotal * 0.05
    const totalNeto = totalSubtotal + totalIVA - totalRetencion

    // Combinar conceptos agregados con avance
    const conceptosConAvance = avanceConceptos.map(avance => {
        const conceptoEstimacion = conceptos.find(c => c.conceptoPresupuestoId === avance.conceptoPresupuestoId)
        return {
            ...avance,
            agregado: !!conceptoEstimacion,
            cantidadEjecutadaEstimacion: conceptoEstimacion?.cantidadEjecutada || 0,
            importeEstimacion: conceptoEstimacion?.importe || 0,
        }
    })

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <div>
                    <h3 className="text-lg font-semibold">Conceptos de la Estimación</h3>
                    <p className="text-sm text-muted-foreground">
                        {conceptos.length} concepto{conceptos.length !== 1 ? 's' : ''} agregado{conceptos.length !== 1 ? 's' : ''}
                    </p>
                </div>
            </div>

            {conceptosConAvance.length === 0 ? (
                <div className="text-center py-12 bg-slate-50 rounded-lg border-2 border-dashed">
                    <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <p className="text-muted-foreground">No hay conceptos en el presupuesto</p>
                </div>
            ) : (
                <>
                    <div className="rounded-md border">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead className="w-[100px]">Clave</TableHead>
                                    <TableHead>Descripción</TableHead>
                                    <TableHead className="w-[80px]">Unidad</TableHead>
                                    <TableHead className="text-right w-[100px]">P. Unit.</TableHead>
                                    <TableHead className="text-right w-[100px]">Presup.</TableHead>
                                    <TableHead className="text-right w-[100px]">Acum.</TableHead>
                                    <TableHead className="text-right w-[100px]">Esta Est.</TableHead>
                                    <TableHead className="text-right w-[100px]">Importe</TableHead>
                                    <TableHead className="text-center w-[80px]">%</TableHead>
                                    {!readonly && <TableHead className="text-right w-[100px]">Acciones</TableHead>}
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {conceptosConAvance.map((concepto) => (
                                    <TableRow key={concepto.conceptoPresupuestoId}>
                                        <TableCell className="font-mono text-sm font-medium">
                                            {concepto.clave}
                                        </TableCell>
                                        <TableCell>
                                            <div className="max-w-md">
                                                {concepto.descripcion}
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            {concepto.unidad ? (
                                                <span className="text-sm">
                                                    {concepto.unidad.abreviatura}
                                                </span>
                                            ) : (
                                                <span className="text-muted-foreground">-</span>
                                            )}
                                        </TableCell>
                                        <TableCell className="text-right font-medium">
                                            {formatCurrency(concepto.precioUnitario)}
                                        </TableCell>
                                        <TableCell className="text-right">
                                            {formatNumber(concepto.cantidadPresupuesto)}
                                        </TableCell>
                                        <TableCell className="text-right">
                                            {formatNumber(concepto.cantidadAcumulada)}
                                        </TableCell>
                                        <TableCell className="text-right font-medium">
                                            {concepto.agregado ? (
                                                <span className="text-blue-600">
                                                    {formatNumber(concepto.cantidadEjecutadaEstimacion)}
                                                </span>
                                            ) : (
                                                <span className="text-muted-foreground">-</span>
                                            )}
                                        </TableCell>
                                        <TableCell className="text-right font-semibold">
                                            {concepto.agregado ? (
                                                formatCurrency(concepto.importeEstimacion)
                                            ) : (
                                                <span className="text-muted-foreground">-</span>
                                            )}
                                        </TableCell>
                                        <TableCell className="text-center">
                                            <div className="flex items-center justify-center gap-1">
                                                <span className={`text-xs font-medium ${
                                                    concepto.porcentajeAvance >= 100
                                                        ? 'text-green-600'
                                                        : concepto.porcentajeAvance >= 50
                                                        ? 'text-yellow-600'
                                                        : 'text-slate-600'
                                                }`}>
                                                    {concepto.porcentajeAvance.toFixed(0)}%
                                                </span>
                                                {concepto.porcentajeAvance >= 100 && (
                                                    <CheckCircle2 className="h-3 w-3 text-green-600" />
                                                )}
                                            </div>
                                        </TableCell>
                                        {!readonly && (
                                            <TableCell className="text-right">
                                                {!concepto.agregado && concepto.cantidadPendiente > 0 && (
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        onClick={() => handleOpenDialog(concepto)}
                                                    >
                                                        <Plus className="h-4 w-4 mr-1" />
                                                        Agregar
                                                    </Button>
                                                )}
                                                {concepto.agregado && (
                                                    <span className="text-xs text-green-600 flex items-center justify-end gap-1">
                                                        <CheckCircle2 className="h-3 w-3" />
                                                        Agregado
                                                    </span>
                                                )}
                                            </TableCell>
                                        )}
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </div>

                    {/* Totales */}
                    {conceptos.length > 0 && (
                        <div className="flex justify-end">
                            <div className="bg-slate-50 rounded-lg p-4 min-w-[350px] space-y-2">
                                <div className="flex justify-between items-center text-sm">
                                    <span className="font-medium">Subtotal:</span>
                                    <span className="font-semibold">{formatCurrency(totalSubtotal)}</span>
                                </div>
                                <div className="flex justify-between items-center text-sm">
                                    <span className="font-medium">IVA (16%):</span>
                                    <span className="font-semibold">{formatCurrency(totalIVA)}</span>
                                </div>
                                <div className="flex justify-between items-center text-sm">
                                    <span className="font-medium">Retención (5%):</span>
                                    <span className="font-semibold text-red-600">-{formatCurrency(totalRetencion)}</span>
                                </div>
                                <div className="border-t pt-2 flex justify-between items-center">
                                    <span className="text-lg font-semibold">Total Neto:</span>
                                    <span className="text-2xl font-bold text-primary">
                                        {formatCurrency(totalNeto)}
                                    </span>
                                </div>
                            </div>
                        </div>
                    )}
                </>
            )}

            {/* Dialog para agregar concepto */}
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Agregar Concepto a Estimación</DialogTitle>
                        <DialogDescription>
                            {selectedConcepto && (
                                <div className="mt-2 space-y-1">
                                    <p className="font-medium">{selectedConcepto.clave} - {selectedConcepto.descripcion}</p>
                                    <p className="text-sm">Precio unitario: {formatCurrency(selectedConcepto.precioUnitario)}</p>
                                    <p className="text-sm">Cantidad presupuestada: {formatNumber(selectedConcepto.cantidadPresupuesto)}</p>
                                    <p className="text-sm">Cantidad acumulada: {formatNumber(selectedConcepto.cantidadAcumulada)}</p>
                                    <p className="text-sm font-semibold text-green-600">
                                        Cantidad pendiente: {formatNumber(selectedConcepto.cantidadPendiente)}
                                    </p>
                                </div>
                            )}
                        </DialogDescription>
                    </DialogHeader>

                    <Form {...form}>
                        <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
                            <FormField
                                control={form.control}
                                name="cantidadEjecutada"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Cantidad Ejecutada en esta Estimación</FormLabel>
                                        <FormControl>
                                            <Input
                                                type="number"
                                                step="0.01"
                                                min="0"
                                                max={selectedConcepto?.cantidadPendiente}
                                                {...field}
                                            />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            {selectedConcepto && form.watch('cantidadEjecutada') > 0 && (
                                <div className="bg-blue-50 border border-blue-200 rounded-md p-3">
                                    <p className="text-sm font-medium text-blue-900">Importe calculado:</p>
                                    <p className="text-xl font-bold text-blue-600">
                                        {formatCurrency(form.watch('cantidadEjecutada') * selectedConcepto.precioUnitario)}
                                    </p>
                                </div>
                            )}

                            <DialogFooter>
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={handleCloseDialog}
                                >
                                    Cancelar
                                </Button>
                                <Button
                                    type="submit"
                                    disabled={form.formState.isSubmitting}
                                >
                                    {form.formState.isSubmitting ? "Agregando..." : "Agregar Concepto"}
                                </Button>
                            </DialogFooter>
                        </form>
                    </Form>
                </DialogContent>
            </Dialog>
        </div>
    )
}
