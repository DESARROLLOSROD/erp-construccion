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

interface Producto {
    id: string
    codigo: string
    nombre: string
    descripcion?: string
    unidadId?: string
    precioUnitario: number
    activo: boolean
    unidad?: { nombre: string }
}

export default function ProductosPage() {
    const [productos, setProductos] = useState<Producto[]>([])
    const [loading, setLoading] = useState(true)
    const [dialogOpen, setDialogOpen] = useState(false)
    const { toast } = useToast()

    const [formData, setFormData] = useState({
        codigo: '',
        nombre: '',
        descripcion: '',
        precioUnitario: '',
    })

    useEffect(() => {
        fetchProductos()
    }, [])

    const fetchProductos = async () => {
        try {
            const res = await fetch('/api/productos')
            if (!res.ok) throw new Error('Error al cargar productos')
            const data = await res.json()
            setProductos(data)
        } catch (error) {
            toast({
                title: 'Error',
                description: 'No se pudieron cargar los productos',
                variant: 'destructive',
            })
        } finally {
            setLoading(false)
        }
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()

        try {
            const res = await fetch('/api/productos', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    ...formData,
                    precioUnitario: parseFloat(formData.precioUnitario),
                }),
            })

            if (!res.ok) throw new Error('Error al crear producto')

            toast({
                title: 'Éxito',
                description: 'Producto creado correctamente',
            })

            setDialogOpen(false)
            setFormData({ codigo: '', nombre: '', descripcion: '', precioUnitario: '' })
            fetchProductos()
        } catch (error) {
            toast({
                title: 'Error',
                description: 'No se pudo crear el producto',
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
                    <h1 className="text-3xl font-bold">Productos</h1>
                    <p className="text-muted-foreground">Catálogo de productos y materiales</p>
                </div>

                <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                    <DialogTrigger asChild>
                        <Button>
                            <Plus className="mr-2 h-4 w-4" />
                            Nuevo Producto
                        </Button>
                    </DialogTrigger>
                    <DialogContent>
                        <form onSubmit={handleSubmit}>
                            <DialogHeader>
                                <DialogTitle>Nuevo Producto</DialogTitle>
                                <DialogDescription>
                                    Registra un nuevo producto en el catálogo
                                </DialogDescription>
                            </DialogHeader>

                            <div className="grid gap-4 py-4">
                                <div className="grid gap-2">
                                    <Label htmlFor="codigo">Código *</Label>
                                    <Input
                                        id="codigo"
                                        value={formData.codigo}
                                        onChange={(e) =>
                                            setFormData({ ...formData, codigo: e.target.value })
                                        }
                                        required
                                    />
                                </div>

                                <div className="grid gap-2">
                                    <Label htmlFor="nombre">Nombre *</Label>
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
                                    <Label htmlFor="descripcion">Descripción</Label>
                                    <Input
                                        id="descripcion"
                                        value={formData.descripcion}
                                        onChange={(e) =>
                                            setFormData({ ...formData, descripcion: e.target.value })
                                        }
                                    />
                                </div>

                                <div className="grid gap-2">
                                    <Label htmlFor="precioUnitario">Precio Unitario *</Label>
                                    <Input
                                        id="precioUnitario"
                                        type="number"
                                        step="0.01"
                                        value={formData.precioUnitario}
                                        onChange={(e) =>
                                            setFormData({ ...formData, precioUnitario: e.target.value })
                                        }
                                        required
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
                    <CardTitle>Catálogo de Productos</CardTitle>
                    <CardDescription>
                        {productos.length} producto(s) registrado(s)
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Código</TableHead>
                                <TableHead>Nombre</TableHead>
                                <TableHead>Descripción</TableHead>
                                <TableHead>Precio</TableHead>
                                <TableHead>Estado</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {productos.map((producto) => (
                                <TableRow key={producto.id}>
                                    <TableCell className="font-mono">{producto.codigo}</TableCell>
                                    <TableCell className="font-medium">{producto.nombre}</TableCell>
                                    <TableCell>{producto.descripcion || '-'}</TableCell>
                                    <TableCell>${producto.precioUnitario.toFixed(2)}</TableCell>
                                    <TableCell>
                                        <span
                                            className={`px-2 py-1 rounded text-xs ${producto.activo
                                                    ? 'bg-green-100 text-green-800'
                                                    : 'bg-gray-100 text-gray-800'
                                                }`}
                                        >
                                            {producto.activo ? 'Activo' : 'Inactivo'}
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
