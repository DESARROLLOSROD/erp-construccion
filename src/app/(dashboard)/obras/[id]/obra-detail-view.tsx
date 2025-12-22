"use client"

import { useRouter } from "next/navigation"
import { Obra } from "@/types/obra"
import { PresupuestoConTotales } from "@/types/presupuesto"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import { ArrowLeft, Building2, User, Calendar, DollarSign, FileText, CheckCircle2, Circle, Eye } from "lucide-react"
import Link from "next/link"

interface ObraDetailViewProps {
    obra: Obra
    presupuestos: PresupuestoConTotales[]
}

const estadoColors = {
    COTIZACION: 'bg-yellow-100 text-yellow-800',
    CONTRATADA: 'bg-blue-100 text-blue-800',
    EN_PROCESO: 'bg-green-100 text-green-800',
    SUSPENDIDA: 'bg-orange-100 text-orange-800',
    TERMINADA: 'bg-slate-100 text-slate-800',
    CANCELADA: 'bg-red-100 text-red-800',
}

const estadoLabels = {
    COTIZACION: 'Cotización',
    CONTRATADA: 'Contratada',
    EN_PROCESO: 'En Proceso',
    SUSPENDIDA: 'Suspendida',
    TERMINADA: 'Terminada',
    CANCELADA: 'Cancelada',
}

const tipoContratoLabels = {
    PRECIO_ALZADO: 'Precio Alzado',
    PRECIOS_UNITARIOS: 'Precios Unitarios',
    ADMINISTRACION: 'Administración',
    MIXTO: 'Mixto',
}

export function ObraDetailView({ obra, presupuestos }: ObraDetailViewProps) {
    const router = useRouter()

    const formatCurrency = (value: number) => {
        return new Intl.NumberFormat('es-MX', {
            style: 'currency',
            currency: 'MXN',
            minimumFractionDigits: 2,
        }).format(value)
    }

    const formatDate = (date: Date | null | undefined) => {
        if (!date) return 'No definida'
        return new Intl.DateTimeFormat('es-MX', {
            dateStyle: 'medium',
        }).format(new Date(date))
    }

    const presupuestoVigente = presupuestos.find(p => p.esVigente)
    const montoAnticipo = (obra.montoContrato * obra.anticipoPct) / 100

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <Link href="/obras">
                        <Button variant="outline" size="icon">
                            <ArrowLeft className="h-4 w-4" />
                        </Button>
                    </Link>
                    <div>
                        <div className="flex items-center gap-2">
                            <h1 className="text-3xl font-bold tracking-tight">
                                {obra.codigo}
                            </h1>
                            <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                                estadoColors[obra.estado as keyof typeof estadoColors]
                            }`}>
                                {estadoLabels[obra.estado as keyof typeof estadoLabels]}
                            </span>
                        </div>
                        <p className="text-lg text-muted-foreground">
                            {obra.nombre}
                        </p>
                    </div>
                </div>
            </div>

            {/* Información General */}
            <div className="grid gap-4 md:grid-cols-2">
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Building2 className="h-5 w-5" />
                            Información de la Obra
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                        {obra.descripcion && (
                            <div>
                                <span className="text-sm font-medium text-muted-foreground">Descripción:</span>
                                <p className="text-sm">{obra.descripcion}</p>
                            </div>
                        )}
                        {obra.ubicacion && (
                            <div>
                                <span className="text-sm font-medium text-muted-foreground">Ubicación:</span>
                                <p className="text-sm">{obra.ubicacion}</p>
                            </div>
                        )}
                        <div>
                            <span className="text-sm font-medium text-muted-foreground">Tipo de Contrato:</span>
                            <p className="text-base font-semibold">
                                {tipoContratoLabels[obra.tipoContrato as keyof typeof tipoContratoLabels]}
                            </p>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <User className="h-5 w-5" />
                            Cliente
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2">
                        {obra.cliente ? (
                            <>
                                <div>
                                    <span className="text-sm font-medium text-muted-foreground">Razón Social:</span>
                                    <p className="text-base font-semibold">{obra.cliente.razonSocial}</p>
                                </div>
                                {obra.cliente.nombreComercial && (
                                    <div>
                                        <span className="text-sm font-medium text-muted-foreground">Nombre Comercial:</span>
                                        <p className="text-sm">{obra.cliente.nombreComercial}</p>
                                    </div>
                                )}
                                <div>
                                    <span className="text-sm font-medium text-muted-foreground">RFC:</span>
                                    <p className="text-sm font-mono">{obra.cliente.rfc}</p>
                                </div>
                            </>
                        ) : (
                            <p className="text-sm text-muted-foreground">Sin cliente asignado</p>
                        )}
                    </CardContent>
                </Card>
            </div>

            {/* Información Financiera */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <DollarSign className="h-5 w-5" />
                        Información Financiera
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="grid gap-4 md:grid-cols-4">
                        <div className="bg-blue-50 rounded-lg p-4">
                            <p className="text-sm font-medium text-blue-600">Monto Contrato</p>
                            <p className="text-2xl font-bold text-blue-600">{formatCurrency(obra.montoContrato)}</p>
                        </div>
                        <div className="bg-green-50 rounded-lg p-4">
                            <p className="text-sm font-medium text-green-600">Anticipo ({obra.anticipoPct}%)</p>
                            <p className="text-2xl font-bold text-green-600">{formatCurrency(montoAnticipo)}</p>
                        </div>
                        <div className="bg-orange-50 rounded-lg p-4">
                            <p className="text-sm font-medium text-orange-600">Retención</p>
                            <p className="text-2xl font-bold text-orange-600">{obra.retencionPct}%</p>
                        </div>
                        <div className="bg-slate-50 rounded-lg p-4">
                            <p className="text-sm font-medium text-slate-600">Presupuesto Vigente</p>
                            <p className="text-2xl font-bold text-slate-600">
                                {presupuestoVigente ? formatCurrency(presupuestoVigente.importeTotal) : 'N/A'}
                            </p>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Fechas */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Calendar className="h-5 w-5" />
                        Calendario de la Obra
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="grid gap-4 md:grid-cols-3">
                        <div>
                            <span className="text-sm font-medium text-muted-foreground">Fecha de Inicio:</span>
                            <p className="text-base font-semibold">{formatDate(obra.fechaInicio)}</p>
                        </div>
                        <div>
                            <span className="text-sm font-medium text-muted-foreground">Fecha Programada de Término:</span>
                            <p className="text-base font-semibold">{formatDate(obra.fechaFinProgramada)}</p>
                        </div>
                        <div>
                            <span className="text-sm font-medium text-muted-foreground">Fecha Real de Término:</span>
                            <p className="text-base font-semibold">{formatDate(obra.fechaFinReal)}</p>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Presupuestos */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <FileText className="h-5 w-5" />
                        Presupuestos de la Obra
                    </CardTitle>
                    <CardDescription>
                        Versiones de presupuesto para esta obra
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    {presupuestos.length === 0 ? (
                        <div className="text-center py-12 bg-slate-50 rounded-lg border-2 border-dashed">
                            <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                            <p className="text-muted-foreground">No hay presupuestos para esta obra</p>
                            <p className="text-sm text-muted-foreground mt-1">
                                Crea un presupuesto desde el módulo de presupuestos
                            </p>
                        </div>
                    ) : (
                        <div className="rounded-md border">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Nombre</TableHead>
                                        <TableHead className="text-center">Versión</TableHead>
                                        <TableHead className="text-center">Vigente</TableHead>
                                        <TableHead className="text-right">Conceptos</TableHead>
                                        <TableHead className="text-right">Importe Total</TableHead>
                                        <TableHead className="text-right">Acciones</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {presupuestos.map((presupuesto) => (
                                        <TableRow key={presupuesto.id}>
                                            <TableCell>
                                                <div>
                                                    <div className="font-medium">{presupuesto.nombre}</div>
                                                    {presupuesto.descripcion && (
                                                        <div className="text-sm text-muted-foreground truncate max-w-xs">
                                                            {presupuesto.descripcion}
                                                        </div>
                                                    )}
                                                </div>
                                            </TableCell>
                                            <TableCell className="text-center">
                                                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-slate-100 text-slate-800">
                                                    v{presupuesto.version}
                                                </span>
                                            </TableCell>
                                            <TableCell className="text-center">
                                                {presupuesto.esVigente ? (
                                                    <div title="Presupuesto vigente">
                                                        <CheckCircle2 className="h-5 w-5 text-green-600 mx-auto" />
                                                    </div>
                                                ) : (
                                                    <div title="No vigente">
                                                        <Circle className="h-5 w-5 text-slate-300 mx-auto" />
                                                    </div>
                                                )}
                                            </TableCell>
                                            <TableCell className="text-right">
                                                <span className="font-medium">{presupuesto.totalConceptos}</span>
                                            </TableCell>
                                            <TableCell className="text-right font-semibold">
                                                {formatCurrency(presupuesto.importeTotal)}
                                            </TableCell>
                                            <TableCell className="text-right">
                                                <Link href={`/presupuestos/${presupuesto.id}`}>
                                                    <Button variant="ghost" size="icon" title="Ver presupuesto">
                                                        <Eye className="h-4 w-4" />
                                                    </Button>
                                                </Link>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    )
}
