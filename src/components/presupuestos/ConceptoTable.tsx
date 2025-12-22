"use client"

import { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { ConceptoPresupuesto } from "@/types/presupuesto"
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
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Pencil, Trash2, Plus, FileText } from "lucide-react"

const conceptoSchema = z.object({
    clave: z.string().min(1, "La clave es requerida"),
    descripcion: z.string().min(1, "La descripción es requerida"),
    unidadId: z.string().optional(),
    cantidad: z.coerce.number().min(0, "La cantidad debe ser mayor o igual a 0"),
    precioUnitario: z.coerce.number().min(0, "El precio debe ser mayor o igual a 0"),
})

type ConceptoFormValues = z.infer<typeof conceptoSchema>

interface ConceptoTableProps {
    conceptos: ConceptoPresupuesto[]
    unidades: Array<{ id: string; nombre: string; abreviatura: string }>
    onAdd: (data: ConceptoFormValues) => Promise<void>
    onEdit?: (id: string, data: ConceptoFormValues) => Promise<void>
    onDelete?: (id: string) => Promise<void>
    readonly?: boolean
}

export function ConceptoTable({
    conceptos,
    unidades,
    onAdd,
    onEdit,
    onDelete,
    readonly = false,
}: ConceptoTableProps) {
    const [isDialogOpen, setIsDialogOpen] = useState(false)
    const [editingConcepto, setEditingConcepto] = useState<ConceptoPresupuesto | null>(null)

    const form = useForm<ConceptoFormValues>({
        resolver: zodResolver(conceptoSchema),
        defaultValues: {
            clave: "",
            descripcion: "",
            unidadId: "",
            cantidad: 0,
            precioUnitario: 0,
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

    const handleOpenDialog = (concepto?: ConceptoPresupuesto) => {
        if (concepto) {
            setEditingConcepto(concepto)
            form.reset({
                clave: concepto.clave,
                descripcion: concepto.descripcion,
                unidadId: concepto.unidadId || "",
                cantidad: concepto.cantidad,
                precioUnitario: concepto.precioUnitario,
            })
        } else {
            setEditingConcepto(null)
            form.reset({
                clave: "",
                descripcion: "",
                unidadId: "",
                cantidad: 0,
                precioUnitario: 0,
            })
        }
        setIsDialogOpen(true)
    }

    const handleCloseDialog = () => {
        setIsDialogOpen(false)
        setEditingConcepto(null)
        form.reset()
    }

    const handleSubmit = async (data: ConceptoFormValues) => {
        try {
            if (editingConcepto && onEdit) {
                await onEdit(editingConcepto.id, data)
            } else {
                await onAdd(data)
            }
            handleCloseDialog()
        } catch (error) {
            console.error('Error al guardar concepto:', error)
        }
    }

    const handleDelete = async (id: string) => {
        if (onDelete && confirm('¿Estás seguro de eliminar este concepto?')) {
            await onDelete(id)
        }
    }

    const totalImporte = conceptos.reduce((sum, c) => sum + c.importe, 0)

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <div>
                    <h3 className="text-lg font-semibold">Conceptos del Presupuesto</h3>
                    <p className="text-sm text-muted-foreground">
                        {conceptos.length} concepto{conceptos.length !== 1 ? 's' : ''} registrado{conceptos.length !== 1 ? 's' : ''}
                    </p>
                </div>
                {!readonly && (
                    <Button onClick={() => handleOpenDialog()}>
                        <Plus className="h-4 w-4 mr-2" />
                        Agregar Concepto
                    </Button>
                )}
            </div>

            {conceptos.length === 0 ? (
                <div className="text-center py-12 bg-slate-50 rounded-lg border-2 border-dashed">
                    <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <p className="text-muted-foreground">No hay conceptos en este presupuesto</p>
                    {!readonly && (
                        <p className="text-sm text-muted-foreground mt-1">
                            Agrega el primer concepto para comenzar
                        </p>
                    )}
                </div>
            ) : (
                <>
                    <div className="rounded-md border">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead className="w-[120px]">Clave</TableHead>
                                    <TableHead>Descripción</TableHead>
                                    <TableHead className="w-[100px]">Unidad</TableHead>
                                    <TableHead className="text-right w-[120px]">Cantidad</TableHead>
                                    <TableHead className="text-right w-[140px]">P. Unitario</TableHead>
                                    <TableHead className="text-right w-[140px]">Importe</TableHead>
                                    {!readonly && <TableHead className="text-right w-[100px]">Acciones</TableHead>}
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {conceptos.map((concepto) => (
                                    <TableRow key={concepto.id}>
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
                                            {formatNumber(concepto.cantidad)}
                                        </TableCell>
                                        <TableCell className="text-right font-medium">
                                            {formatCurrency(concepto.precioUnitario)}
                                        </TableCell>
                                        <TableCell className="text-right font-semibold">
                                            {formatCurrency(concepto.importe)}
                                        </TableCell>
                                        {!readonly && (
                                            <TableCell className="text-right">
                                                <div className="flex justify-end gap-2">
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        onClick={() => handleOpenDialog(concepto)}
                                                        title="Editar"
                                                    >
                                                        <Pencil className="h-4 w-4" />
                                                    </Button>
                                                    {onDelete && (
                                                        <Button
                                                            variant="ghost"
                                                            size="icon"
                                                            onClick={() => handleDelete(concepto.id)}
                                                            title="Eliminar"
                                                        >
                                                            <Trash2 className="h-4 w-4 text-destructive" />
                                                        </Button>
                                                    )}
                                                </div>
                                            </TableCell>
                                        )}
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </div>

                    {/* Totales */}
                    <div className="flex justify-end">
                        <div className="bg-slate-50 rounded-lg p-4 min-w-[300px]">
                            <div className="flex justify-between items-center">
                                <span className="text-lg font-semibold">Total Presupuesto:</span>
                                <span className="text-2xl font-bold text-primary">
                                    {formatCurrency(totalImporte)}
                                </span>
                            </div>
                        </div>
                    </div>
                </>
            )}

            {/* Dialog para agregar/editar concepto */}
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogContent className="max-w-2xl">
                    <DialogHeader>
                        <DialogTitle>
                            {editingConcepto ? 'Editar Concepto' : 'Agregar Concepto'}
                        </DialogTitle>
                        <DialogDescription>
                            {editingConcepto
                                ? 'Modifica los datos del concepto'
                                : 'Ingresa los datos del nuevo concepto'}
                        </DialogDescription>
                    </DialogHeader>

                    <Form {...form}>
                        <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <FormField
                                    control={form.control}
                                    name="clave"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Clave</FormLabel>
                                            <FormControl>
                                                <Input
                                                    placeholder="ej: CON-001"
                                                    {...field}
                                                />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />

                                <FormField
                                    control={form.control}
                                    name="unidadId"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Unidad (Opcional)</FormLabel>
                                            <Select
                                                onValueChange={field.onChange}
                                                defaultValue={field.value}
                                            >
                                                <FormControl>
                                                    <SelectTrigger>
                                                        <SelectValue placeholder="Selecciona unidad" />
                                                    </SelectTrigger>
                                                </FormControl>
                                                <SelectContent>
                                                    {unidades.map((unidad) => (
                                                        <SelectItem key={unidad.id} value={unidad.id}>
                                                            {unidad.abreviatura} - {unidad.nombre}
                                                        </SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            </div>

                            <FormField
                                control={form.control}
                                name="descripcion"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Descripción</FormLabel>
                                        <FormControl>
                                            <Textarea
                                                placeholder="Descripción detallada del concepto..."
                                                rows={3}
                                                {...field}
                                            />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <div className="grid grid-cols-3 gap-4">
                                <FormField
                                    control={form.control}
                                    name="cantidad"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Cantidad</FormLabel>
                                            <FormControl>
                                                <Input
                                                    type="number"
                                                    step="0.01"
                                                    min="0"
                                                    {...field}
                                                />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />

                                <FormField
                                    control={form.control}
                                    name="precioUnitario"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Precio Unitario</FormLabel>
                                            <FormControl>
                                                <Input
                                                    type="number"
                                                    step="0.01"
                                                    min="0"
                                                    {...field}
                                                />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />

                                <FormItem>
                                    <FormLabel>Importe</FormLabel>
                                    <div className="h-10 px-3 py-2 bg-slate-100 rounded-md border flex items-center">
                                        <span className="font-medium">
                                            {formatCurrency(
                                                (form.watch('cantidad') || 0) * (form.watch('precioUnitario') || 0)
                                            )}
                                        </span>
                                    </div>
                                </FormItem>
                            </div>

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
                                    {form.formState.isSubmitting
                                        ? "Guardando..."
                                        : editingConcepto
                                        ? "Actualizar"
                                        : "Agregar"}
                                </Button>
                            </DialogFooter>
                        </form>
                    </Form>
                </DialogContent>
            </Dialog>
        </div>
    )
}
