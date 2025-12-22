"use client"

import { useEffect } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { Button } from "@/components/ui/button"
import {
    Form,
    FormControl,
    FormDescription,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { Estimacion } from "@/types/estimacion"
import { ObraListItem } from "@/types/obra"
import { Presupuesto } from "@/types/presupuesto"

const formSchema = z.object({
    obraId: z.string().min(1, "La obra es requerida"),
    presupuestoId: z.string().min(1, "El presupuesto es requerido"),
    numero: z.coerce.number().int().min(1, "El número debe ser al menos 1").optional(),
    periodo: z.string().min(1, "El periodo es requerido"),
    fechaInicio: z.string().min(1, "La fecha de inicio es requerida"),
    fechaFin: z.string().min(1, "La fecha de fin es requerida"),
    descripcion: z.string().optional(),
    estado: z.enum(['BORRADOR', 'PENDIENTE', 'APROBADA', 'FACTURADA', 'CANCELADA']).default('BORRADOR'),
})

type FormValues = z.infer<typeof formSchema>

interface EstimacionFormProps {
    estimacion?: Estimacion
    obras: ObraListItem[]
    presupuestos: Presupuesto[]
    onSubmit: (data: FormValues) => Promise<void>
    onCancel: () => void
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

export function EstimacionForm({
    estimacion,
    obras,
    presupuestos,
    onSubmit,
    onCancel,
}: EstimacionFormProps) {
    const form = useForm<FormValues>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            obraId: estimacion?.obraId || "",
            presupuestoId: estimacion?.presupuestoId || "",
            numero: estimacion?.numero,
            periodo: estimacion?.periodo || "",
            fechaInicio: estimacion?.fechaInicio ? new Date(estimacion.fechaInicio).toISOString().split('T')[0] : "",
            fechaFin: estimacion?.fechaFin ? new Date(estimacion.fechaFin).toISOString().split('T')[0] : "",
            descripcion: estimacion?.descripcion || "",
            estado: estimacion?.estado || 'BORRADOR',
        },
    })

    const selectedObraId = form.watch('obraId')

    // Filtrar presupuestos por obra seleccionada
    const presupuestosFiltrados = selectedObraId
        ? presupuestos.filter(p => p.obraId === selectedObraId)
        : []

    useEffect(() => {
        if (estimacion) {
            form.reset({
                obraId: estimacion.obraId,
                presupuestoId: estimacion.presupuestoId,
                numero: estimacion.numero,
                periodo: estimacion.periodo,
                fechaInicio: new Date(estimacion.fechaInicio).toISOString().split('T')[0],
                fechaFin: new Date(estimacion.fechaFin).toISOString().split('T')[0],
                descripcion: estimacion.descripcion || "",
                estado: estimacion.estado,
            })
        }
    }, [estimacion, form])

    const handleSubmit = async (data: FormValues) => {
        await onSubmit(data)
        form.reset()
    }

    return (
        <Form {...form}>
            <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
                {/* Sección: Información General */}
                <div className="space-y-4">
                    <div className="border-b pb-2">
                        <h3 className="text-lg font-semibold">Información General</h3>
                    </div>

                    <FormField
                        control={form.control}
                        name="obraId"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Obra</FormLabel>
                                <Select
                                    onValueChange={field.onChange}
                                    defaultValue={field.value}
                                    disabled={!!estimacion}
                                >
                                    <FormControl>
                                        <SelectTrigger>
                                            <SelectValue placeholder="Selecciona una obra" />
                                        </SelectTrigger>
                                    </FormControl>
                                    <SelectContent>
                                        {obras.map((obra) => (
                                            <SelectItem key={obra.id} value={obra.id}>
                                                {obra.codigo} - {obra.nombre}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                                <FormDescription>
                                    {estimacion && "La obra no puede cambiarse después de crear la estimación"}
                                </FormDescription>
                                <FormMessage />
                            </FormItem>
                        )}
                    />

                    <FormField
                        control={form.control}
                        name="presupuestoId"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Presupuesto</FormLabel>
                                <Select
                                    onValueChange={field.onChange}
                                    defaultValue={field.value}
                                    disabled={!!estimacion || !selectedObraId}
                                >
                                    <FormControl>
                                        <SelectTrigger>
                                            <SelectValue placeholder="Selecciona un presupuesto" />
                                        </SelectTrigger>
                                    </FormControl>
                                    <SelectContent>
                                        {presupuestosFiltrados.map((presupuesto) => (
                                            <SelectItem key={presupuesto.id} value={presupuesto.id}>
                                                v{presupuesto.version} - {presupuesto.nombre}
                                                {presupuesto.esVigente && ' (Vigente)'}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                                <FormDescription>
                                    {!selectedObraId && "Selecciona primero una obra"}
                                    {estimacion && "El presupuesto no puede cambiarse después de crear la estimación"}
                                </FormDescription>
                                <FormMessage />
                            </FormItem>
                        )}
                    />

                    <div className="grid grid-cols-2 gap-4">
                        <FormField
                            control={form.control}
                            name="numero"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Número de Estimación</FormLabel>
                                    <FormControl>
                                        <Input
                                            type="number"
                                            min="1"
                                            placeholder="Automático"
                                            {...field}
                                        />
                                    </FormControl>
                                    <FormDescription>
                                        Si se deja vacío, se asignará automáticamente
                                    </FormDescription>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <FormField
                            control={form.control}
                            name="estado"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Estado</FormLabel>
                                    <Select
                                        onValueChange={field.onChange}
                                        defaultValue={field.value}
                                    >
                                        <FormControl>
                                            <SelectTrigger>
                                                <SelectValue />
                                            </SelectTrigger>
                                        </FormControl>
                                        <SelectContent>
                                            {Object.entries(estadoLabels).map(([value, label]) => (
                                                <SelectItem key={value} value={value}>
                                                    {label}
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
                        name="periodo"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Periodo</FormLabel>
                                <FormControl>
                                    <Input
                                        placeholder="ej: Enero 2024, Quincena 1 Dic 2024"
                                        {...field}
                                    />
                                </FormControl>
                                <FormDescription>
                                    Descripción del periodo que cubre esta estimación
                                </FormDescription>
                                <FormMessage />
                            </FormItem>
                        )}
                    />

                    <div className="grid grid-cols-2 gap-4">
                        <FormField
                            control={form.control}
                            name="fechaInicio"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Fecha de Inicio</FormLabel>
                                    <FormControl>
                                        <Input type="date" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <FormField
                            control={form.control}
                            name="fechaFin"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Fecha de Fin</FormLabel>
                                    <FormControl>
                                        <Input type="date" {...field} />
                                    </FormControl>
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
                                <FormLabel>Descripción (Opcional)</FormLabel>
                                <FormControl>
                                    <Textarea
                                        placeholder="Descripción adicional de los trabajos ejecutados..."
                                        rows={3}
                                        {...field}
                                    />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                </div>

                {/* Botones */}
                <div className="flex justify-end gap-2 pt-4 border-t">
                    <Button
                        type="button"
                        variant="outline"
                        onClick={onCancel}
                    >
                        Cancelar
                    </Button>
                    <Button
                        type="submit"
                        disabled={form.formState.isSubmitting}
                    >
                        {form.formState.isSubmitting
                            ? "Guardando..."
                            : estimacion
                            ? "Actualizar Estimación"
                            : "Crear Estimación"}
                    </Button>
                </div>
            </form>
        </Form>
    )
}
