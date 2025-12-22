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
import { Switch } from "@/components/ui/switch"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { Presupuesto } from "@/types/presupuesto"
import { ObraListItem } from "@/types/obra"

const formSchema = z.object({
    obraId: z.string().min(1, "La obra es requerida"),
    version: z.coerce.number().int().min(1, "La versión debe ser al menos 1").default(1),
    nombre: z.string().min(1, "El nombre es requerido"),
    descripcion: z.string().optional(),
    esVigente: z.boolean().default(true),
})

type FormValues = z.infer<typeof formSchema>

interface PresupuestoFormProps {
    presupuesto?: Presupuesto
    obras: ObraListItem[]
    onSubmit: (data: FormValues) => Promise<void>
    onCancel: () => void
}

export function PresupuestoForm({
    presupuesto,
    obras,
    onSubmit,
    onCancel,
}: PresupuestoFormProps) {
    const form = useForm<FormValues>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            obraId: presupuesto?.obraId || "",
            version: presupuesto?.version || 1,
            nombre: presupuesto?.nombre || "",
            descripcion: presupuesto?.descripcion || "",
            esVigente: presupuesto?.esVigente ?? true,
        },
    })

    useEffect(() => {
        if (presupuesto) {
            form.reset({
                obraId: presupuesto.obraId,
                version: presupuesto.version,
                nombre: presupuesto.nombre,
                descripcion: presupuesto.descripcion || "",
                esVigente: presupuesto.esVigente,
            })
        }
    }, [presupuesto, form])

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
                                    disabled={!!presupuesto}
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
                                    {presupuesto && "La obra no puede cambiarse después de crear el presupuesto"}
                                </FormDescription>
                                <FormMessage />
                            </FormItem>
                        )}
                    />

                    <div className="grid grid-cols-2 gap-4">
                        <FormField
                            control={form.control}
                            name="version"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Versión</FormLabel>
                                    <FormControl>
                                        <Input
                                            type="number"
                                            min="1"
                                            {...field}
                                        />
                                    </FormControl>
                                    <FormDescription>
                                        Número de versión del presupuesto
                                    </FormDescription>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <FormField
                            control={form.control}
                            name="esVigente"
                            render={({ field }) => (
                                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                                    <div className="space-y-0.5">
                                        <FormLabel className="text-base">
                                            Presupuesto Vigente
                                        </FormLabel>
                                        <FormDescription>
                                            Marcar como presupuesto activo
                                        </FormDescription>
                                    </div>
                                    <FormControl>
                                        <Switch
                                            checked={field.value}
                                            onCheckedChange={field.onChange}
                                        />
                                    </FormControl>
                                </FormItem>
                            )}
                        />
                    </div>

                    <FormField
                        control={form.control}
                        name="nombre"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Nombre del Presupuesto</FormLabel>
                                <FormControl>
                                    <Input
                                        placeholder="ej: Presupuesto Base, Presupuesto Ampliación, etc."
                                        {...field}
                                    />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />

                    <FormField
                        control={form.control}
                        name="descripcion"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Descripción (Opcional)</FormLabel>
                                <FormControl>
                                    <Textarea
                                        placeholder="Descripción adicional del presupuesto..."
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
                            : presupuesto
                            ? "Actualizar Presupuesto"
                            : "Crear Presupuesto"}
                    </Button>
                </div>
            </form>
        </Form>
    )
}
