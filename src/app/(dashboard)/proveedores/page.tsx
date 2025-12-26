'use client'

import { useState, useEffect } from 'react'
import { Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/components/ui/card'
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table'
import { useToast } from '@/hooks/use-toast'

interface Proveedor {
    id: string
    nombre: string
    rfc?: string
    email?: string
    telefono?: string
    direccion?: string
    activo: boolean
}

export default function ProveedoresPage() {
    const [proveedores, setProveedores] = useState<Proveedor[]>([])
    const [loading, setLoading] = useState(true)
    const [dialogOpen, setDialogOpen] = useState(false)
    const { toast } = useToast()

    const [formData, setFormData] = useState({
        nombre: '',
        rfc: '',
        email: '',
        telefono: '',
        direccion: '',
    })

    useEffect(() => {
        fetchProveedores()
    }, [])

    const fetchProveedores = async () => {
        try {
            const res = await fetch('/api/proveedores')
            if (!res.ok) throw new Error('Error al cargar proveedores')
            const data = await res.json()
            setProveedores(data)
        } catch (error) {
            toast({
                title: 'Error',
                description: 'No se pudieron cargar los proveedores',
                variant: 'destructive',
            })
        } finally {
            setLoading(false)
        }
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()

        try {
            const res = await fetch('/api/proveedores', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData),
            })

            if (!res.ok) throw new Error('Error al crear proveedor')

            toast({
                title: 'Éxito',
                description: 'Proveedor creado correctamente',
            })

            setDialogOpen(false)
            setFormData({ nombre: '', rfc: '', email: '', telefono: '', direccion: '' })
            fetchProveedores()
        } catch (error) {
            toast({
                title: 'Error',
                description: 'No se pudo crear el proveedor',
                variant: 'destructive',
            })
        }
    }

    if (loading) {
        return <div className="p-8">Cargando...</div>
    }

    return (
        <div className="p-8 space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold">Proveedores</h1>
                    <p className="text-muted-foreground">Gestión de proveedores</p>
                </div>

                <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                    <DialogTrigger asChild>
                        <Button>
                            <Plus className="mr-2 h-4 w-4" />
                            Nuevo Proveedor
                        </Button>
                    </DialogTrigger>
                    <DialogContent>
                        <form onSubmit={handleSubmit}>
                            <DialogHeader>
                                <DialogTitle>Nuevo Proveedor</DialogTitle>
                                <DialogDescription>
                                    Registra un nuevo proveedor en el sistema
                                </DialogDescription>
                            </DialogHeader>

                            <div className="grid gap-4 py-4">
                                <div className="grid gap-2">
                                    <Label htmlFor="nombre">Nombre / Razón Social *</Label>
                                    <Input
                                        id="nombre"
                                        value={formData.nombre}
                                        onChange={(e) =>
                                            setFormData({ ...formData, nombre: e.target.value })
                                        }
                                        required
                                    />
                                </div>

                                <div className="grid gap-2">
                                    <Label htmlFor="rfc">RFC</Label>
                                    <Input
                                        id="rfc"
                                        value={formData.rfc}
                                        onChange={(e) =>
                                            setFormData({ ...formData, rfc: e.target.value })
                                        }
                                    />
                                </div>

                                <div className="grid gap-2">
                                    <Label htmlFor="email">Email</Label>
                                    <Input
                                        id="email"
                                        type="email"
                                        value={formData.email}
                                        onChange={(e) =>
                                            setFormData({ ...formData, email: e.target.value })
                                        }
                                    />
                                </div>

                                <div className="grid gap-2">
                                    <Label htmlFor="telefono">Teléfono</Label>
                                    <Input
                                        id="telefono"
                                        value={formData.telefono}
                                        onChange={(e) =>
                                            setFormData({ ...formData, telefono: e.target.value })
                                        }
                                    />
                                </div>

                                <div className="grid gap-2">
                                    <Label htmlFor="direccion">Dirección</Label>
                                    <Input
                                        id="direccion"
                                        value={formData.direccion}
                                        onChange={(e) =>
                                            setFormData({ ...formData, direccion: e.target.value })
                                        }
                                    />
                                </div>
                            </div>

                            <DialogFooter>
                                <Button type="submit">Guardar</Button>
                            </DialogFooter>
                        </form>
                    </DialogContent>
                </Dialog>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Lista de Proveedores</CardTitle>
                    <CardDescription>
                        {proveedores.length} proveedor(es) registrado(s)
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Nombre</TableHead>
                                <TableHead>RFC</TableHead>
                                <TableHead>Email</TableHead>
                                <TableHead>Teléfono</TableHead>
                                <TableHead>Estado</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {proveedores.map((proveedor) => (
                                <TableRow key={proveedor.id}>
                                    <TableCell className="font-medium">{proveedor.nombre}</TableCell>
                                    <TableCell>{proveedor.rfc || '-'}</TableCell>
                                    <TableCell>{proveedor.email || '-'}</TableCell>
                                    <TableCell>{proveedor.telefono || '-'}</TableCell>
                                    <TableCell>
                                        <span
                                            className={`px-2 py-1 rounded text-xs ${proveedor.activo
                                                    ? 'bg-green-100 text-green-800'
                                                    : 'bg-gray-100 text-gray-800'
                                                }`}
                                        >
                                            {proveedor.activo ? 'Activo' : 'Inactivo'}
                                        </span>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </div>
    )
}
