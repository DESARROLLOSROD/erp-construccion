'use client'

import { useState, useEffect } from 'react'
import { Plus, Package, TrendingDown, TrendingUp } from 'lucide-react'
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
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select'
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table'
import { useToast } from '@/hooks/use-toast'

interface Movimiento {
    id: string
    tipo: string
    productoId: string
    cantidad: number
    fecha: string
    referencia?: string
    producto?: {
        codigo: string
        nombre: string
    }
}

export default function InventarioPage() {
    const [movimientos, setMovimientos] = useState<Movimiento[]>([])
    const [productos, setProductos] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const [dialogOpen, setDialogOpen] = useState(false)
    const { toast } = useToast()

    const [formData, setFormData] = useState({
        tipo: 'ENTRADA',
        productoId: '',
        cantidad: '',
        referencia: '',
    })

    useEffect(() => {
        fetchMovimientos()
        fetchProductos()
    }, [])

    const fetchMovimientos = async () => {
        try {
            const res = await fetch('/api/inventario/movimientos')
            if (!res.ok) throw new Error('Error al cargar movimientos')
            const data = await res.json()
            setMovimientos(data)
        } catch (error) {
            toast({
                title: 'Error',
                description: 'No se pudieron cargar los movimientos',
                variant: 'destructive',
            })
        } finally {
            setLoading(false)
        }
    }

    const fetchProductos = async () => {
        try {
            const res = await fetch('/api/productos')
            if (!res.ok) throw new Error('Error al cargar productos')
            const data = await res.json()
            setProductos(data)
        } catch (error) {
            console.error(error)
        }
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()

        try {
            const res = await fetch('/api/inventario/movimientos', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    ...formData,
                    cantidad: parseFloat(formData.cantidad),
                }),
            })

            if (!res.ok) throw new Error('Error al crear movimiento')

            toast({
                title: 'Éxito',
                description: 'Movimiento registrado correctamente',
            })

            setDialogOpen(false)
            setFormData({ tipo: 'ENTRADA', productoId: '', cantidad: '', referencia: '' })
            fetchMovimientos()
        } catch (error) {
            toast({
                title: 'Error',
                description: 'No se pudo registrar el movimiento',
                variant: 'destructive',
            })
        }
    }

    const entradas = movimientos.filter((m) => m.tipo === 'ENTRADA')
    const salidas = movimientos.filter((m) => m.tipo === 'SALIDA')

    if (loading) {
        return <div className="p-8">Cargando...</div>
    }

    return (
        <div className="p-8 space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold">Inventario</h1>
                    <p className="text-muted-foreground">Control de entradas y salidas</p>
                </div>

                <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                    <DialogTrigger asChild>
                        <Button>
                            <Plus className="mr-2 h-4 w-4" />
                            Nuevo Movimiento
                        </Button>
                    </DialogTrigger>
                    <DialogContent>
                        <form onSubmit={handleSubmit}>
                            <DialogHeader>
                                <DialogTitle>Registrar Movimiento</DialogTitle>
                                <DialogDescription>
                                    Registra una entrada o salida de inventario
                                </DialogDescription>
                            </DialogHeader>

                            <div className="grid gap-4 py-4">
                                <div className="grid gap-2">
                                    <Label htmlFor="tipo">Tipo de Movimiento</Label>
                                    <Select
                                        value={formData.tipo}
                                        onValueChange={(value) =>
                                            setFormData({ ...formData, tipo: value })
                                        }
                                    >
                                        <SelectTrigger>
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="ENTRADA">Entrada</SelectItem>
                                            <SelectItem value="SALIDA">Salida</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>

                                <div className="grid gap-2">
                                    <Label htmlFor="productoId">Producto</Label>
                                    <Select
                                        value={formData.productoId}
                                        onValueChange={(value) =>
                                            setFormData({ ...formData, productoId: value })
                                        }
                                    >
                                        <SelectTrigger>
                                            <SelectValue placeholder="Selecciona un producto" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {productos.map((producto) => (
                                                <SelectItem key={producto.id} value={producto.id}>
                                                    {producto.codigo} - {producto.nombre}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>

                                <div className="grid gap-2">
                                    <Label htmlFor="cantidad">Cantidad</Label>
                                    <Input
                                        id="cantidad"
                                        type="number"
                                        step="0.01"
                                        value={formData.cantidad}
                                        onChange={(e) =>
                                            setFormData({ ...formData, cantidad: e.target.value })
                                        }
                                        required
                                    />
                                </div>

                                <div className="grid gap-2">
                                    <Label htmlFor="referencia">Referencia (Opcional)</Label>
                                    <Input
                                        id="referencia"
                                        placeholder="Ej. OC-123, Salida a Obra X"
                                        value={formData.referencia}
                                        onChange={(e) =>
                                            setFormData({ ...formData, referencia: e.target.value })
                                        }
                                    />
                                </div>
                            </div>

                            <DialogFooter>
                                <Button type="submit">Registrar</Button>
                            </DialogFooter>
                        </form>
                    </DialogContent>
                </Dialog>
            </div>

            <div className="grid gap-4 md:grid-cols-3">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">
                            Total Movimientos
                        </CardTitle>
                        <Package className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{movimientos.length}</div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Entradas</CardTitle>
                        <TrendingUp className="h-4 w-4 text-green-600" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-green-600">{entradas.length}</div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Salidas</CardTitle>
                        <TrendingDown className="h-4 w-4 text-red-600" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-red-600">{salidas.length}</div>
                    </CardContent>
                </Card>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Movimientos de Inventario</CardTitle>
                    <CardDescription>Historial de entradas y salidas</CardDescription>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Fecha</TableHead>
                                <TableHead>Tipo</TableHead>
                                <TableHead>Producto</TableHead>
                                <TableHead>Cantidad</TableHead>
                                <TableHead>Referencia</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {movimientos.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={5} className="text-center h-24 text-muted-foreground">
                                        No hay movimientos registrados
                                    </TableCell>
                                </TableRow>
                            ) : (
                                movimientos.map((movimiento) => (
                                    <TableRow key={movimiento.id}>
                                        <TableCell>
                                            {new Date(movimiento.fecha).toLocaleDateString('es-MX')}
                                        </TableCell>
                                        <TableCell>
                                            <span
                                                className={`px-2 py-1 rounded text-xs ${movimiento.tipo === 'ENTRADA'
                                                        ? 'bg-green-100 text-green-800'
                                                        : 'bg-red-100 text-red-800'
                                                    }`}
                                            >
                                                {movimiento.tipo}
                                            </span>
                                        </TableCell>
                                        <TableCell>
                                            <div>
                                                <div className="font-medium">{movimiento.producto?.nombre}</div>
                                                <div className="text-xs text-muted-foreground">
                                                    {movimiento.producto?.codigo}
                                                </div>
                                            </div>
                                        </TableCell>
                                        <TableCell className="font-semibold">
                                            {movimiento.cantidad}
                                        </TableCell>
                                        <TableCell className="text-muted-foreground">
                                            {movimiento.referencia || '-'}
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </div>
    )
}
