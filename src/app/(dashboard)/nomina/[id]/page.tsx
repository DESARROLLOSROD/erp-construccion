'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { ArrowLeft, Save, CheckCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/components/ui/card'
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
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select'
import { useToast } from '@/hooks/use-toast'

interface DetalleNomina {
    id?: string
    empleadoId: string
    empleado?: { nombre: string; salarioDiario: number }
    diasTrabajados: number
    salarioDiario: number
    importeBase: number
    extras: number
    deducciones: number
    totalPagar: number
    notas?: string
}

interface PeriodoNomina {
    id: string
    tipoPeriodo: string
    semana?: number
    quincena?: number
    mes?: number
    anio: number
    fechaInicio: string
    fechaFin: string
    estado: string
    total: number
    obra?: { nombre: string }
    detalles: DetalleNomina[]
}

export default function NominaDetallePage() {
    const params = useParams()
    const router = useRouter()
    const { toast } = useToast()
    const [periodo, setPeriodo] = useState<PeriodoNomina | null>(null)
    const [empleados, setEmpleados] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)

    useEffect(() => {
        fetchPeriodo()
        fetchEmpleados()
    }, [params.id])

    const fetchPeriodo = async () => {
        try {
            const res = await fetch(`/api/nomina/periodos/${params.id}`)
            if (!res.ok) throw new Error('Error al cargar periodo')
            const data = await res.json()
            setPeriodo(data)
        } catch (error) {
            toast({
                title: 'Error',
                description: 'No se pudo cargar el periodo',
                variant: 'destructive',
            })
        } finally {
            setLoading(false)
        }
    }

    const fetchEmpleados = async () => {
        try {
            const res = await fetch('/api/nomina/empleados')
            if (!res.ok) throw new Error('Error al cargar empleados')
            const data = await res.json()
            setEmpleados(data)
        } catch (error) {
            console.error(error)
        }
    }

    const handleAddEmpleado = (empleadoId: string) => {
        const empleado = empleados.find((e) => e.id === empleadoId)
        if (!empleado || !periodo) return

        const nuevoDetalle: DetalleNomina = {
            empleadoId: empleado.id,
            empleado: { nombre: empleado.nombre, salarioDiario: empleado.salarioDiario },
            diasTrabajados: 6,
            salarioDiario: empleado.salarioDiario,
            importeBase: empleado.salarioDiario * 6,
            extras: 0,
            deducciones: 0,
            totalPagar: empleado.salarioDiario * 6,
        }

        setPeriodo({
            ...periodo,
            detalles: [...periodo.detalles, nuevoDetalle],
        })
    }

    const handleUpdateDetalle = (index: number, field: string, value: any) => {
        if (!periodo) return

        const detalles = [...periodo.detalles]
        const detalle = { ...detalles[index] }

        if (field === 'diasTrabajados') {
            detalle.diasTrabajados = parseFloat(value) || 0
            detalle.importeBase = detalle.diasTrabajados * detalle.salarioDiario
        } else if (field === 'extras') {
            detalle.extras = parseFloat(value) || 0
        } else if (field === 'deducciones') {
            detalle.deducciones = parseFloat(value) || 0
        } else if (field === 'notas') {
            detalle.notas = value
        }

        detalle.totalPagar = detalle.importeBase + detalle.extras - detalle.deducciones
        detalles[index] = detalle

        setPeriodo({ ...periodo, detalles })
    }

    const handleSave = async () => {
        if (!periodo) return

        setSaving(true)
        try {
            const res = await fetch(`/api/nomina/periodos/${params.id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ detalles: periodo.detalles }),
            })

            if (!res.ok) throw new Error('Error al guardar')

            toast({
                title: 'Éxito',
                description: 'Nómina guardada correctamente',
            })

            fetchPeriodo()
        } catch (error) {
            toast({
                title: 'Error',
                description: 'No se pudo guardar la nómina',
                variant: 'destructive',
            })
        } finally {
            setSaving(false)
        }
    }

    const handleCerrar = async () => {
        if (!periodo) return

        setSaving(true)
        try {
            const res = await fetch(`/api/nomina/periodos/${params.id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ detalles: periodo.detalles, estado: 'CERRADA' }),
            })

            if (!res.ok) throw new Error('Error al cerrar')

            toast({
                title: 'Éxito',
                description: 'Nómina cerrada correctamente',
            })

            router.push('/nomina')
        } catch (error) {
            toast({
                title: 'Error',
                description: 'No se pudo cerrar la nómina',
                variant: 'destructive',
            })
        } finally {
            setSaving(false)
        }
    }

    if (loading || !periodo) {
        return <div className="p-8">Cargando...</div>
    }

    const empleadosDisponibles = empleados.filter(
        (e) => !periodo.detalles.some((d) => d.empleadoId === e.id)
    )

    const totalGeneral = periodo.detalles.reduce((sum, d) => sum + d.totalPagar, 0)

    return (
        <div className="p-8 space-y-6">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <Button variant="ghost" size="icon" onClick={() => router.back()}>
                        <ArrowLeft className="h-4 w-4" />
                    </Button>
                    <div>
                        <h1 className="text-3xl font-bold">
                            {periodo.tipoPeriodo === 'SEMANAL' && `Semana ${periodo.semana}`}
                            {periodo.tipoPeriodo === 'QUINCENAL' && `Quincena ${periodo.quincena}`}
                            {periodo.tipoPeriodo === 'MENSUAL' && `Mes ${periodo.mes}`}
                            {' - '}{periodo.anio}
                        </h1>
                        <p className="text-muted-foreground">
                            {new Date(periodo.fechaInicio).toLocaleDateString()} -{' '}
                            {new Date(periodo.fechaFin).toLocaleDateString()}
                        </p>
                    </div>
                </div>

                <div className="flex gap-2">
                    <Button onClick={handleSave} disabled={saving || periodo.estado === 'CERRADA'}>
                        <Save className="mr-2 h-4 w-4" />
                        Guardar
                    </Button>
                    {periodo.estado === 'BORRADOR' && (
                        <Button onClick={handleCerrar} disabled={saving} variant="default">
                            <CheckCircle className="mr-2 h-4 w-4" />
                            Cerrar Nómina
                        </Button>
                    )}
                </div>
            </div>

            {periodo.estado === 'BORRADOR' && empleadosDisponibles.length > 0 && (
                <Card>
                    <CardHeader>
                        <CardTitle>Agregar Empleado</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <Select onValueChange={handleAddEmpleado}>
                            <SelectTrigger>
                                <SelectValue placeholder="Selecciona un empleado" />
                            </SelectTrigger>
                            <SelectContent>
                                {empleadosDisponibles.map((emp) => (
                                    <SelectItem key={emp.id} value={emp.id}>
                                        {emp.nombre} - ${emp.salarioDiario}/día
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </CardContent>
                </Card>
            )}

            <Card>
                <CardHeader>
                    <CardTitle>Detalles de Nómina</CardTitle>
                    <CardDescription>
                        Total a pagar: ${totalGeneral.toFixed(2)}
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Empleado</TableHead>
                                <TableHead>Días</TableHead>
                                <TableHead>Salario/Día</TableHead>
                                <TableHead>Importe Base</TableHead>
                                <TableHead>Extras</TableHead>
                                <TableHead>Deducciones</TableHead>
                                <TableHead>Total</TableHead>
                                <TableHead>Notas</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {periodo.detalles.map((detalle, index) => (
                                <TableRow key={index}>
                                    <TableCell className="font-medium">
                                        {detalle.empleado?.nombre}
                                    </TableCell>
                                    <TableCell>
                                        <Input
                                            type="number"
                                            step="0.5"
                                            value={detalle.diasTrabajados}
                                            onChange={(e) =>
                                                handleUpdateDetalle(index, 'diasTrabajados', e.target.value)
                                            }
                                            disabled={periodo.estado === 'CERRADA'}
                                            className="w-20"
                                        />
                                    </TableCell>
                                    <TableCell>${detalle.salarioDiario.toFixed(2)}</TableCell>
                                    <TableCell>${detalle.importeBase.toFixed(2)}</TableCell>
                                    <TableCell>
                                        <Input
                                            type="number"
                                            step="0.01"
                                            value={detalle.extras}
                                            onChange={(e) =>
                                                handleUpdateDetalle(index, 'extras', e.target.value)
                                            }
                                            disabled={periodo.estado === 'CERRADA'}
                                            className="w-24"
                                        />
                                    </TableCell>
                                    <TableCell>
                                        <Input
                                            type="number"
                                            step="0.01"
                                            value={detalle.deducciones}
                                            onChange={(e) =>
                                                handleUpdateDetalle(index, 'deducciones', e.target.value)
                                            }
                                            disabled={periodo.estado === 'CERRADA'}
                                            className="w-24"
                                        />
                                    </TableCell>
                                    <TableCell className="font-semibold">
                                        ${detalle.totalPagar.toFixed(2)}
                                    </TableCell>
                                    <TableCell>
                                        <Input
                                            value={detalle.notas || ''}
                                            onChange={(e) =>
                                                handleUpdateDetalle(index, 'notas', e.target.value)
                                            }
                                            disabled={periodo.estado === 'CERRADA'}
                                            placeholder="Notas..."
                                            className="w-32"
                                        />
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
