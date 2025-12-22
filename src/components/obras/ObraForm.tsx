"use client"

import { useState, useEffect } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { useRouter } from "next/navigation"
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
    FormDescription
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Obra, CreateObraInput } from "@/types/obra"
import { Cliente } from "@/types/cliente"

const formSchema = z.object({
    codigo: z.string().min(1, "El código es requerido").max(20, "Máximo 20 caracteres"),
    nombre: z.string().min(3, "El nombre es requerido").max(200, "Máximo 200 caracteres"),
    descripcion: z.string().optional(),
    ubicacion: z.string().optional(),
    estado: z.enum(['COTIZACION', 'CONTRATADA', 'EN_PROCESO', 'SUSPENDIDA', 'TERMINADA', 'CANCELADA']).default('EN_PROCESO'),
    tipoContrato: z.enum(['PRECIO_ALZADO', 'PRECIOS_UNITARIOS', 'ADMINISTRACION', 'MIXTO']).default('PRECIO_ALZADO'),
    fechaInicio: z.string().optional(),
    fechaFinProgramada: z.string().optional(),
    montoContrato: z.coerce.number().min(0, "El monto debe ser positivo").default(0),
    anticipoPct: z.coerce.number().min(0, "Mínimo 0").max(100, "Máximo 100").default(0),
    retencionPct: z.coerce.number().min(0, "Mínimo 0").max(100, "Máximo 100").default(0),
    clienteId: z.string().optional(),
})

interface ObraFormProps {
    initialData?: Obra
    onSuccess?: () => void
}

export function ObraForm({ initialData, onSuccess }: ObraFormProps) {
    const router = useRouter()
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [clientes, setClientes] = useState<Cliente[]>([])
    const [loadingClientes, setLoadingClientes] = useState(true)

    // Cargar clientes
    useEffect(() => {
        async function fetchClientes() {
            try {
                const res = await fetch('/api/clientes')
                if (res.ok) {
                    const data = await res.json()
                    setClientes(data)
                }
            } catch (err) {
                console.error('Error al cargar clientes:', err)
            } finally {
                setLoadingClientes(false)
            }
        }
        fetchClientes()
    }, [])

    const form = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema),
        defaultValues: initialData ? {
            codigo: initialData.codigo,
            nombre: initialData.nombre,
            descripcion: initialData.descripcion || "",
            ubicacion: initialData.ubicacion || "",
            estado: initialData.estado,
            tipoContrato: initialData.tipoContrato,
            fechaInicio: initialData.fechaInicio ? new Date(initialData.fechaInicio).toISOString().split('T')[0] : "",
            fechaFinProgramada: initialData.fechaFinProgramada ? new Date(initialData.fechaFinProgramada).toISOString().split('T')[0] : "",
            montoContrato: Number(initialData.montoContrato),
            anticipoPct: Number(initialData.anticipoPct),
            retencionPct: Number(initialData.retencionPct),
            clienteId: initialData.clienteId || "",
        } : {
            codigo: "",
            nombre: "",
            descripcion: "",
            ubicacion: "",
            estado: "EN_PROCESO",
            tipoContrato: "PRECIO_ALZADO",
            fechaInicio: "",
            fechaFinProgramada: "",
            montoContrato: 0,
            anticipoPct: 0,
            retencionPct: 0,
            clienteId: "",
        },
    })

    async function onSubmit(values: z.infer<typeof formSchema>) {
        setLoading(true)
        setError(null)

        try {
            const url = initialData
                ? `/api/obras/${initialData.id}`
                : `/api/obras`

            const method = initialData ? "PUT" : "POST"

            const res = await fetch(url, {
                method,
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(values),
            })

            if (!res.ok) {
                const msg = await res.text()
                throw new Error(msg || "Error al guardar obra")
            }

            router.refresh()
            form.reset()
            if (onSuccess) onSuccess()
        } catch (err: any) {
            console.error(err)
            setError(err.message)
        } finally {
            setLoading(false)
        }
    }

    return (
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                {error && (
                    <div className="p-3 text-sm text-red-500 bg-red-50 rounded-md">
                        {error}
                    </div>
                )}

                {/* Información básica */}
                <div className="space-y-4">
                    <h3 className="text-sm font-medium border-b pb-2">Información General</h3>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <FormField
                            control={form.control}
                            name="codigo"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Código de Obra *</FormLabel>
                                    <FormControl>
                                        <Input placeholder="OBR-2024-001" {...field} />
                                    </FormControl>
                                    <FormDescription>Código único interno</FormDescription>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <FormField
                            control={form.control}
                            name="nombre"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Nombre de la Obra *</FormLabel>
                                    <FormControl>
                                        <Input placeholder="Torre Residencial..." {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <FormField
                            control={form.control}
                            name="clienteId"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Cliente</FormLabel>
                                    <FormControl>
                                        <select
                                            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                                            {...field}
                                            disabled={loadingClientes}
                                        >
                                            <option value="">Seleccionar cliente...</option>
                                            {clientes.map((cliente) => (
                                                <option key={cliente.id} value={cliente.id}>
                                                    {cliente.nombreComercial || cliente.razonSocial}
                                                </option>
                                            ))}
                                        </select>
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <FormField
                            control={form.control}
                            name="ubicacion"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Ubicación</FormLabel>
                                    <FormControl>
                                        <Input placeholder="Ciudad, Estado" {...field} />
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
                                <FormLabel>Descripción</FormLabel>
                                <FormControl>
                                    <textarea
                                        className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                                        placeholder="Descripción detallada del proyecto..."
                                        {...field}
                                    />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                </div>

                {/* Tipo y Estado */}
                <div className="space-y-4">
                    <h3 className="text-sm font-medium border-b pb-2">Tipo y Estado</h3>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <FormField
                            control={form.control}
                            name="tipoContrato"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Tipo de Contrato</FormLabel>
                                    <FormControl>
                                        <select
                                            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                                            {...field}
                                        >
                                            <option value="PRECIO_ALZADO">Precio Alzado</option>
                                            <option value="PRECIOS_UNITARIOS">Precios Unitarios</option>
                                            <option value="ADMINISTRACION">Administración</option>
                                            <option value="MIXTO">Mixto</option>
                                        </select>
                                    </FormControl>
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
                                    <FormControl>
                                        <select
                                            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                                            {...field}
                                        >
                                            <option value="COTIZACION">Cotización</option>
                                            <option value="CONTRATADA">Contratada</option>
                                            <option value="EN_PROCESO">En Proceso</option>
                                            <option value="SUSPENDIDA">Suspendida</option>
                                            <option value="TERMINADA">Terminada</option>
                                            <option value="CANCELADA">Cancelada</option>
                                        </select>
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                    </div>
                </div>

                {/* Fechas */}
                <div className="space-y-4">
                    <h3 className="text-sm font-medium border-b pb-2">Fechas</h3>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                            name="fechaFinProgramada"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Fecha de Término Programada</FormLabel>
                                    <FormControl>
                                        <Input type="date" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                    </div>
                </div>

                {/* Montos */}
                <div className="space-y-4">
                    <h3 className="text-sm font-medium border-b pb-2">Información Financiera</h3>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <FormField
                            control={form.control}
                            name="montoContrato"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Monto de Contrato</FormLabel>
                                    <FormControl>
                                        <Input type="number" step="0.01" placeholder="0.00" {...field} />
                                    </FormControl>
                                    <FormDescription>MXN</FormDescription>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <FormField
                            control={form.control}
                            name="anticipoPct"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Anticipo %</FormLabel>
                                    <FormControl>
                                        <Input type="number" step="0.01" min="0" max="100" placeholder="0" {...field} />
                                    </FormControl>
                                    <FormDescription>Porcentaje de anticipo</FormDescription>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <FormField
                            control={form.control}
                            name="retencionPct"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Retención %</FormLabel>
                                    <FormControl>
                                        <Input type="number" step="0.01" min="0" max="100" placeholder="0" {...field} />
                                    </FormControl>
                                    <FormDescription>Fondo de garantía</FormDescription>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                    </div>
                </div>

                <div className="flex justify-end space-x-2 pt-4">
                    <Button type="submit" disabled={loading}>
                        {loading ? "Guardando..." : initialData ? "Actualizar Obra" : "Crear Obra"}
                    </Button>
                </div>
            </form>
        </Form>
    )
}
