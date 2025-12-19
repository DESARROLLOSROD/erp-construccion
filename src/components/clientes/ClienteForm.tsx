"use client"

import { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { useRouter } from "next/navigation" // Correct import for App Router
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Cliente, CreateClienteInput } from "@/types/cliente"

const formSchema = z.object({
    rfc: z.string().min(12, "El RFC debe tener al menos 12 caracteres").max(13, "El RFC debe tener máximo 13 caracteres"),
    razonSocial: z.string().min(3, "La razón social es requerida"),
    nombreComercial: z.string().optional(),
    email: z.string().email("Email inválido").optional().or(z.literal("")),
    telefono: z.string().optional(),
    contacto: z.string().optional(),
    calle: z.string().optional(),
    numExterior: z.string().optional(),
    colonia: z.string().optional(),
    codigoPostal: z.string().optional(),
    municipio: z.string().optional(),
    estado: z.string().optional(),
    pais: z.string().default("MEX"),
})

interface ClienteFormProps {
    initialData?: Cliente
    onSuccess?: () => void
}

export function ClienteForm({ initialData, onSuccess }: ClienteFormProps) {
    const router = useRouter()
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)

    const form = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema),
        defaultValues: initialData || {
            rfc: "",
            razonSocial: "",
            nombreComercial: "",
            email: "",
            telefono: "",
            contacto: "",
            calle: "",
            numExterior: "",
            colonia: "",
            codigoPostal: "",
            municipio: "",
            estado: "",
            pais: "MEX",
        },
    })

    async function onSubmit(values: z.infer<typeof formSchema>) {
        setLoading(true)
        setError(null)

        try {
            const url = initialData
                ? `/api/clientes/${initialData.id}`
                : `/api/clientes`

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
                throw new Error(msg || "Error al guardar cliente")
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
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                {error && (
                    <div className="p-3 text-sm text-red-500 bg-red-50 rounded-md">
                        {error}
                    </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                        control={form.control}
                        name="rfc"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>RFC *</FormLabel>
                                <FormControl>
                                    <Input placeholder="XAXX010101000" {...field} />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />

                    <FormField
                        control={form.control}
                        name="razonSocial"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Razón Social *</FormLabel>
                                <FormControl>
                                    <Input placeholder="Empresa S.A. de C.V." {...field} />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />

                    <FormField
                        control={form.control}
                        name="nombreComercial"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Nombre Comercial</FormLabel>
                                <FormControl>
                                    <Input placeholder="Mi Empresa" {...field} />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />

                    <FormField
                        control={form.control}
                        name="email"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Email</FormLabel>
                                <FormControl>
                                    <Input type="email" placeholder="contacto@empresa.com" {...field} />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />

                    <FormField
                        control={form.control}
                        name="telefono"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Teléfono</FormLabel>
                                <FormControl>
                                    <Input placeholder="55 1234 5678" {...field} />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                </div>

                <div className="border-t pt-4">
                    <h3 className="text-sm font-medium mb-3">Dirección</h3>
                    <div className="grid grid-cols-2 gap-4">
                        <FormField
                            control={form.control}
                            name="calle"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Calle</FormLabel>
                                    <FormControl>
                                        <Input {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <FormField
                            control={form.control}
                            name="numExterior"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>No. Ext</FormLabel>
                                    <FormControl>
                                        <Input {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <FormField
                            control={form.control}
                            name="codigoPostal"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>C.P.</FormLabel>
                                    <FormControl>
                                        <Input {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <FormField
                            control={form.control}
                            name="colonia"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Colonia</FormLabel>
                                    <FormControl>
                                        <Input {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                    </div>
                </div>

                <div className="flex justify-end space-x-2 pt-4">
                    <Button type="submit" disabled={loading}>
                        {loading ? "Guardando..." : "Guardar Cliente"}
                    </Button>
                </div>
            </form>
        </Form>
    )
}
