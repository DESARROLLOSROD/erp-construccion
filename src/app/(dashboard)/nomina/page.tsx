'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Plus, Calendar } from 'lucide-react'
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

interface PeriodoNomina {
    id: string
    semana: number
    anio: number
    fechaInicio: string
    fechaFin: string
    estado: string
    total: number
    obra?: { nombre: string }
    detalles: any[]
}

export default function NominaPage() {
    const [periodos, setPeriodos] = useState<PeriodoNomina[]>([])
    const [loading, setLoading] = useState(true)
    const [dialogOpen, setDialogOpen] = useState(false)
    const router = useRouter()
    const { toast } = useToast()

    const [formData, setFormData] = useState({
        tipoPeriodo: 'SEMANAL',
        semana: '',
        quincena: '',
        mes: '',
        anio: new Date().getFullYear().toString(),
        fechaInicio: '',
        fechaFin: '',
    })

    useEffect(() => {
        fetchPeriodos()
    }, [])

    const fetchPeriodos = async () => {
        try {
            const res = await fetch('/api/nomina/periodos')
            if (!res.ok) throw new Error('Error al cargar periodos')
            const data = await res.json()
            setPeriodos(data)
        } catch (error) {
            toast({
                title: 'Error',
                description: 'No se pudieron cargar los periodos',
                variant: 'destructive',
            })
        } finally {
            setLoading(false)
        }
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()

        const payload: any = {
            tipoPeriodo: formData.tipoPeriodo,
            anio: parseInt(formData.anio),
            fechaInicio: formData.fechaInicio,
            fechaFin: formData.fechaFin,
        }

        if (formData.tipoPeriodo === 'SEMANAL' && formData.semana) {
            payload.semana = parseInt(formData.semana)
        } else if (formData.tipoPeriodo === 'QUINCENAL' && formData.quincena) {
            payload.quincena = parseInt(formData.quincena)
        } else if (formData.tipoPeriodo === 'MENSUAL' && formData.mes) {
            payload.mes = parseInt(formData.mes)
        }

        try {
            const res = await fetch('/api/nomina/periodos', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
            })

            if (!res.ok) throw new Error('Error al crear periodo')

            const periodo = await res.json()

            toast({
                title: 'Éxito',
                description: 'Periodo creado correctamente',
            })

            setDialogOpen(false)
            router.push(`/nomina/${periodo.id}`)
        } catch (error) {
            toast({
                title: 'Error',
                description: 'No se pudo crear el periodo',
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
                    <h1 className="text-3xl font-bold">Nómina (Rayas)</h1>
                    <p className="text-muted-foreground">Gestión de pagos semanales</p>
                </div>

                <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                    <DialogTrigger asChild>
                        <Button>
                            <Plus className="mr-2 h-4 w-4" />
                            Nueva Semana
                        </Button>
                    </DialogTrigger>
                    <DialogContent>
                        <form onSubmit={handleSubmit}>
                            <DialogHeader>
                                <DialogTitle>Nueva Semana de Nómina</DialogTitle>
                                <DialogDescription>
                                    Crea un nuevo periodo para capturar asistencias
                                </DialogDescription>
                            </DialogHeader>

                            <div className="grid gap-4 py-4">
                                <div className="grid gap-2">
                                    <Label htmlFor="tipoPeriodo">Tipo de Periodo</Label>
                                    <select
                                        id="tipoPeriodo"
                                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background"
                                        value={formData.tipoPeriodo}
                                        onChange={(e) =>
                                            setFormData({ ...formData, tipoPeriodo: e.target.value })
                                        }
                                    >
                                        <option value="SEMANAL">Semanal</option>
                                        <option value="QUINCENAL">Quincenal</option>
                                        <option value="MENSUAL">Mensual</option>
                                    </select>
                                </div>

                                {formData.tipoPeriodo === 'SEMANAL' && (
                                    <div className="grid gap-2">
                                        <Label htmlFor="semana">Semana (1-52)</Label>
                                        <Input
                                            id="semana"
                                            type="number"
                                            min="1"
                                            max="52"
                                            value={formData.semana}
                                            onChange={(e) =>
                                                setFormData({ ...formData, semana: e.target.value })
                                            }
                                            required
                                        />
                                    </div>
                                )}

                                {formData.tipoPeriodo === 'QUINCENAL' && (
                                    <div className="grid gap-2">
                                        <Label htmlFor="quincena">Quincena (1-24)</Label>
                                        <Input
                                            id="quincena"
                                            type="number"
                                            min="1"
                                            max="24"
                                            value={formData.quincena}
                                            onChange={(e) =>
                                                setFormData({ ...formData, quincena: e.target.value })
                                            }
                                            required
                                        />
                                    </div>
                                )}

                                {formData.tipoPeriodo === 'MENSUAL' && (
                                    <div className="grid gap-2">
                                        <Label htmlFor="mes">Mes (1-12)</Label>
                                        <Input
                                            id="mes"
                                            type="number"
                                            min="1"
                                            max="12"
                                            value={formData.mes}
                                            onChange={(e) =>
                                                setFormData({ ...formData, mes: e.target.value })
                                            }
                                            required
                                        />
                                    </div>
                                )}

                                <div className="grid gap-2">
                                    <Label htmlFor="anio">Año</Label>
                                    <Input
                                        id="anio"
                                        type="number"
                                        value={formData.anio}
                                        onChange={(e) =>
                                            setFormData({ ...formData, anio: e.target.value })
                                        }
                                        required
                                    />
                                </div>

                                <div className="grid gap-2">
                                    <Label htmlFor="fechaInicio">Fecha Inicio</Label>
                                    <Input
                                        id="fechaInicio"
                                        type="date"
                                        value={formData.fechaInicio}
                                        onChange={(e) =>
                                            setFormData({ ...formData, fechaInicio: e.target.value })
                                        }
                                        required
                                    />
                                </div>

                                <div className="grid gap-2">
                                    <Label htmlFor="fechaFin">Fecha Fin</Label>
                                    <Input
                                        id="fechaFin"
                                        type="date"
                                        value={formData.fechaFin}
                                        onChange={(e) =>
                                            setFormData({ ...formData, fechaFin: e.target.value })
                                        }
                                        required
                                    />
                                </div>
                            </div>

                            <DialogFooter>
                                <Button type="submit">Crear Periodo</Button>
                            </DialogFooter>
                        </form>
                    </DialogContent>
                </Dialog>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Periodos de Nómina</CardTitle>
                    <CardDescription>
                        {periodos.length} periodo(s) registrado(s)
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Periodo</TableHead>
                                <TableHead>Fechas</TableHead>
                                <TableHead>Trabajadores</TableHead>
                                <TableHead>Total</TableHead>
                                <TableHead>Estado</TableHead>
                                <TableHead>Acciones</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {periodos.map((periodo) => (
                                <TableRow key={periodo.id}>
                                    <TableCell className="font-medium">
                                        <div className="flex items-center gap-2">
                                            <Calendar className="h-4 w-4 text-muted-foreground" />
                                            {periodo.tipoPeriodo === 'SEMANAL' && `Semana ${periodo.semana}`}
                                            {periodo.tipoPeriodo === 'QUINCENAL' && `Quincena ${periodo.quincena}`}
                                            {periodo.tipoPeriodo === 'MENSUAL' && `Mes ${periodo.mes}`}
                                            {' - '}{periodo.anio}
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        {new Date(periodo.fechaInicio).toLocaleDateString()} -{' '}
                                        {new Date(periodo.fechaFin).toLocaleDateString()}
                                    </TableCell>
                                    <TableCell>{periodo.detalles.length}</TableCell>
                                    <TableCell className="font-semibold">
                                        ${periodo.total.toFixed(2)}
                                    </TableCell>
                                    <TableCell>
                                        <span
                                            className={`px-2 py-1 rounded text-xs ${periodo.estado === 'CERRADA'
                                                ? 'bg-blue-100 text-blue-800'
                                                : periodo.estado === 'PAGADA'
                                                    ? 'bg-green-100 text-green-800'
                                                    : 'bg-yellow-100 text-yellow-800'
                                                }`}
                                        >
                                            {periodo.estado}
                                        </span>
                                    </TableCell>
                                    <TableCell>
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() => router.push(`/nomina/${periodo.id}`)}
                                        >
                                            Ver Detalle
                                        </Button>
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
