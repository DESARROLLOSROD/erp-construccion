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
import { Producto } from "@/types/producto"
import { Categoria } from "@/types/categoria"
import { Unidad } from "@/types/unidad"

const formSchema = z.object({
    codigo: z.string().min(1, "El código es requerido").max(50, "Máximo 50 caracteres"),
    descripcion: z.string().min(3, "La descripción es requerida").max(500, "Máximo 500 caracteres"),
    categoriaId: z.string().optional(),
    unidadId: z.string().optional(),
    claveSat: z.string().optional(),
    claveUnidadSat: z.string().optional(),
    precioCompra: z.coerce.number().min(0, "Debe ser positivo").default(0),
    precioVenta: z.coerce.number().min(0, "Debe ser positivo").default(0),
    esServicio: z.boolean().default(false),
    controlStock: z.boolean().default(true),
    stockMinimo: z.coerce.number().min(0, "Debe ser positivo").default(0),
    stockActual: z.coerce.number().min(0, "Debe ser positivo").default(0),
})

interface ProductoFormProps {
    initialData?: Producto
    onSuccess?: () => void
}

export function ProductoForm({ initialData, onSuccess }: ProductoFormProps) {
    const router = useRouter()
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [categorias, setCategorias] = useState<Categoria[]>([])
    const [unidades, setUnidades] = useState<Unidad[]>([])
    const [loadingCatalogos, setLoadingCatalogos] = useState(true)

    // Cargar catálogos
    useEffect(() => {
        async function fetchCatalogos() {
            try {
                const [catRes, uniRes] = await Promise.all([
                    fetch('/api/categorias'),
                    fetch('/api/unidades')
                ])

                if (catRes.ok) {
                    const catData = await catRes.json()
                    setCategorias(catData)
                }

                if (uniRes.ok) {
                    const uniData = await uniRes.json()
                    setUnidades(uniData)
                }
            } catch (err) {
                console.error('Error al cargar catálogos:', err)
            } finally {
                setLoadingCatalogos(false)
            }
        }
        fetchCatalogos()
    }, [])

    const form = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema),
        defaultValues: initialData ? {
            codigo: initialData.codigo,
            descripcion: initialData.descripcion,
            categoriaId: initialData.categoriaId || "",
            unidadId: initialData.unidadId || "",
            claveSat: initialData.claveSat || "",
            claveUnidadSat: initialData.claveUnidadSat || "",
            precioCompra: Number(initialData.precioCompra),
            precioVenta: Number(initialData.precioVenta),
            esServicio: initialData.esServicio,
            controlStock: initialData.controlStock,
            stockMinimo: Number(initialData.stockMinimo),
            stockActual: Number(initialData.stockActual),
        } : {
            codigo: "",
            descripcion: "",
            categoriaId: "",
            unidadId: "",
            claveSat: "",
            claveUnidadSat: "",
            precioCompra: 0,
            precioVenta: 0,
            esServicio: false,
            controlStock: true,
            stockMinimo: 0,
            stockActual: 0,
        },
    })

    const esServicio = form.watch("esServicio")
    const controlStock = form.watch("controlStock")

    async function onSubmit(values: z.infer<typeof formSchema>) {
        setLoading(true)
        setError(null)

        try {
            const url = initialData
                ? `/api/productos/${initialData.id}`
                : `/api/productos`

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
                throw new Error(msg || "Error al guardar producto")
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
                                    <FormLabel>Código *</FormLabel>
                                    <FormControl>
                                        <Input placeholder="PROD-001" {...field} />
                                    </FormControl>
                                    <FormDescription>Código interno único</FormDescription>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <FormField
                            control={form.control}
                            name="descripcion"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Descripción *</FormLabel>
                                    <FormControl>
                                        <Input placeholder="Cemento gris 50kg" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <FormField
                            control={form.control}
                            name="categoriaId"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Categoría</FormLabel>
                                    <FormControl>
                                        <select
                                            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                                            {...field}
                                            disabled={loadingCatalogos}
                                        >
                                            <option value="">Sin categoría</option>
                                            {categorias.map((cat) => (
                                                <option key={cat.id} value={cat.id}>
                                                    {cat.nombre}
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
                            name="unidadId"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Unidad de Medida</FormLabel>
                                    <FormControl>
                                        <select
                                            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                                            {...field}
                                            disabled={loadingCatalogos}
                                        >
                                            <option value="">Sin unidad</option>
                                            {unidades.map((uni) => (
                                                <option key={uni.id} value={uni.id}>
                                                    {uni.nombre} ({uni.abreviatura})
                                                </option>
                                            ))}
                                        </select>
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <FormField
                            control={form.control}
                            name="esServicio"
                            render={({ field }) => (
                                <FormItem className="flex items-center space-x-2 space-y-0">
                                    <FormControl>
                                        <input
                                            type="checkbox"
                                            className="h-4 w-4 rounded border-gray-300"
                                            checked={field.value}
                                            onChange={field.onChange}
                                        />
                                    </FormControl>
                                    <div>
                                        <FormLabel className="font-normal cursor-pointer">
                                            Es un servicio (no es producto físico)
                                        </FormLabel>
                                    </div>
                                </FormItem>
                            )}
                        />

                        {!esServicio && (
                            <FormField
                                control={form.control}
                                name="controlStock"
                                render={({ field }) => (
                                    <FormItem className="flex items-center space-x-2 space-y-0">
                                        <FormControl>
                                            <input
                                                type="checkbox"
                                                className="h-4 w-4 rounded border-gray-300"
                                                checked={field.value}
                                                onChange={field.onChange}
                                            />
                                        </FormControl>
                                        <div>
                                            <FormLabel className="font-normal cursor-pointer">
                                                Controlar inventario
                                            </FormLabel>
                                        </div>
                                    </FormItem>
                                )}
                            />
                        )}
                    </div>
                </div>

                {/* Precios */}
                <div className="space-y-4">
                    <h3 className="text-sm font-medium border-b pb-2">Precios</h3>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <FormField
                            control={form.control}
                            name="precioCompra"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Precio de Compra</FormLabel>
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
                            name="precioVenta"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Precio de Venta</FormLabel>
                                    <FormControl>
                                        <Input type="number" step="0.01" placeholder="0.00" {...field} />
                                    </FormControl>
                                    <FormDescription>MXN</FormDescription>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                    </div>
                </div>

                {/* Inventario */}
                {!esServicio && controlStock && (
                    <div className="space-y-4">
                        <h3 className="text-sm font-medium border-b pb-2">Control de Inventario</h3>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <FormField
                                control={form.control}
                                name="stockMinimo"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Stock Mínimo</FormLabel>
                                        <FormControl>
                                            <Input type="number" step="0.01" placeholder="0" {...field} />
                                        </FormControl>
                                        <FormDescription>Alerta de reorden</FormDescription>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <FormField
                                control={form.control}
                                name="stockActual"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Stock Actual</FormLabel>
                                        <FormControl>
                                            <Input type="number" step="0.01" placeholder="0" {...field} />
                                        </FormControl>
                                        <FormDescription>Existencia actual</FormDescription>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>
                    </div>
                )}

                {/* SAT */}
                <div className="space-y-4">
                    <h3 className="text-sm font-medium border-b pb-2">Información SAT (Opcional)</h3>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <FormField
                            control={form.control}
                            name="claveSat"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Clave SAT Producto/Servicio</FormLabel>
                                    <FormControl>
                                        <Input placeholder="01010101" {...field} />
                                    </FormControl>
                                    <FormDescription>Para facturación electrónica</FormDescription>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <FormField
                            control={form.control}
                            name="claveUnidadSat"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Clave SAT Unidad</FormLabel>
                                    <FormControl>
                                        <Input placeholder="H87" {...field} />
                                    </FormControl>
                                    <FormDescription>Para facturación electrónica</FormDescription>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                    </div>
                </div>

                <div className="flex justify-end space-x-2 pt-4">
                    <Button type="submit" disabled={loading}>
                        {loading ? "Guardando..." : initialData ? "Actualizar Producto" : "Crear Producto"}
                    </Button>
                </div>
            </form>
        </Form>
    )
}
