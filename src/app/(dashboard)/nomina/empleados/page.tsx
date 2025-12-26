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

interface Empleado {
    id: string
    nombre: string
    puesto: string
    salarioDiario: number
    telefono?: string
    activo: boolean
}

export default function EmpleadosPage() {
    const [empleados, setEmpleados] = useState<Empleado[]>([])
    const [loading, setLoading] = useState(true)
    const [dialogOpen, setDialogOpen] = useState(false)
    const { toast } = useToast()

    const [formData, setFormData] = useState({
        nombre: '',
        puesto: '',
        salarioDiario: '',
        telefono: '',
    })

    useEffect(() => {
        fetchEmpleados()
    }, [])

    const fetchEmpleados = async () => {
        try {
            const res = await fetch('/api/nomina/empleados')
            if (!res.ok) throw new Error('Error al cargar empleados')
            const data = await res.json()
            setEmpleados(data)
        } catch (error) {
            toast({
                title: 'Error',
                description: 'No se pudieron cargar los empleados',
                variant: 'destructive',
            })
        } finally {
            setLoading(false)
        }
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()

        try {
            const res = await fetch('/api/nomina/empleados', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    ...formData,
                    salarioDiario: parseFloat(formData.salarioDiario),
                }),
            })

            if (!res.ok) throw new Error('Error al crear empleado')

            toast({
                title: 'Éxito',
                description: 'Empleado creado correctamente',
            })

            setDialogOpen(false)
            setFormData({ nombre: '', puesto: '', salarioDiario: '', telefono: '' })
            fetchEmpleados()
        } catch (error) {
            toast({
                title: 'Error',
                description: 'No se pudo crear el empleado',
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
                    <h1 className="text-3xl font-bold">Empleados</h1>
                    <p className="text-muted-foreground">Catálogo de trabajadores</p>
                </div>

                <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                    <DialogTrigger asChild>
                        <Button>
                            <Plus className="mr-2 h-4 w-4" />
                            Nuevo Empleado
                        </Button>
                    </DialogTrigger>
                    <DialogContent>
                        <form onSubmit={handleSubmit}>
                            <DialogHeader>
                                <DialogTitle>Nuevo Empleado</DialogTitle>
                                <DialogDescription>
                                    Registra un nuevo trabajador en el sistema
                                </DialogDescription>
                            </DialogHeader>

                            <div className="grid gap-4 py-4">
                                <div className="grid gap-2">
                                    <Label htmlFor="nombre">Nombre Completo</Label>
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
                                    <Label htmlFor="puesto">Puesto</Label>
                                    <Input
                                        id="puesto"
                                        placeholder="Ej. Albañil, Fierrero, Ayudante"
                                        value={formData.puesto}
                                        onChange={(e) =>
                                            setFormData({ ...formData, puesto: e.target.value })
                                        }
                                        required
                                    />
                                </div>

                                <div className="grid gap-2">
                                    <Label htmlFor="salarioDiario">Salario Diario</Label>
                                    <Input
                                        id="salarioDiario"
                                        type="number"
                                        step="0.01"
                                        value={formData.salarioDiario}
                                        onChange={(e) =>
                                            setFormData({ ...formData, salarioDiario: e.target.value })
                                        }
                                        required
                                    />
                                </div>

                                <div className="grid gap-2">
                                    <Label htmlFor="telefono">Teléfono (Opcional)</Label>
                                    <Input
                                        id="telefono"
                                        value={formData.telefono}
                                        onChange={(e) =>
                                            setFormData({ ...formData, telefono: e.target.value })
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
                    <CardTitle>Lista de Empleados</CardTitle>
                    <CardDescription>
                        {empleados.length} empleado(s) registrado(s)
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Nombre</TableHead>
                                <TableHead>Puesto</TableHead>
                                <TableHead>Salario Diario</TableHead>
                                <TableHead>Teléfono</TableHead>
                                <TableHead>Estado</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {empleados.map((empleado) => (
                                <TableRow key={empleado.id}>
                                    <TableCell className="font-medium">{empleado.nombre}</TableCell>
                                    <TableCell>{empleado.puesto}</TableCell>
                                    <TableCell>${empleado.salarioDiario.toFixed(2)}</TableCell>
                                    <TableCell>{empleado.telefono || '-'}</TableCell>
                                    <TableCell>
                                        <span
                                            className={`px-2 py-1 rounded text-xs ${empleado.activo
                                                    ? 'bg-green-100 text-green-800'
                                                    : 'bg-gray-100 text-gray-800'
                                                }`}
                                        >
                                            {empleado.activo ? 'Activo' : 'Inactivo'}
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
