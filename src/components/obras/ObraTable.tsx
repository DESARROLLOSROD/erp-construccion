"use client"

import { ObraListItem } from "@/types/obra"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Pencil, Eye } from "lucide-react"
import { ESTADO_OBRA_LABELS, ESTADO_OBRA_COLORS, TIPO_CONTRATO_LABELS } from "@/types"

interface ObraTableProps {
    obras: ObraListItem[]
    onEdit: (obra: ObraListItem) => void
    onView?: (obra: ObraListItem) => void
}

export function ObraTable({ obras, onEdit, onView }: ObraTableProps) {
    const formatCurrency = (value: number) => {
        return new Intl.NumberFormat('es-MX', {
            style: 'currency',
            currency: 'MXN',
            minimumFractionDigits: 2,
        }).format(value)
    }

    const formatDate = (date: Date | null | undefined) => {
        if (!date) return '-'
        return new Date(date).toLocaleDateString('es-MX', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        })
    }

    if (obras.length === 0) {
        return (
            <div className="text-center py-12 bg-slate-50 rounded-lg border-2 border-dashed">
                <p className="text-muted-foreground">No hay obras registradas</p>
                <p className="text-sm text-muted-foreground mt-1">
                    Crea tu primera obra para comenzar
                </p>
            </div>
        )
    }

    return (
        <div className="rounded-md border">
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead>Código</TableHead>
                        <TableHead>Nombre</TableHead>
                        <TableHead>Cliente</TableHead>
                        <TableHead>Tipo</TableHead>
                        <TableHead>Estado</TableHead>
                        <TableHead className="text-right">Monto</TableHead>
                        <TableHead>Inicio</TableHead>
                        <TableHead className="text-right">Acciones</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {obras.map((obra) => (
                        <TableRow key={obra.id}>
                            <TableCell className="font-mono text-sm">
                                {obra.codigo}
                            </TableCell>
                            <TableCell>
                                <div className="max-w-xs">
                                    <div className="font-medium truncate">{obra.nombre}</div>
                                    {obra.ubicacion && (
                                        <div className="text-xs text-muted-foreground truncate">
                                            {obra.ubicacion}
                                        </div>
                                    )}
                                </div>
                            </TableCell>
                            <TableCell>
                                <div className="max-w-xs truncate">
                                    {obra.cliente
                                        ? (obra.cliente.nombreComercial || obra.cliente.razonSocial)
                                        : <span className="text-muted-foreground">-</span>
                                    }
                                </div>
                            </TableCell>
                            <TableCell>
                                <span className="text-xs">
                                    {TIPO_CONTRATO_LABELS[obra.tipoContrato]}
                                </span>
                            </TableCell>
                            <TableCell>
                                <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${ESTADO_OBRA_COLORS[obra.estado]}`}>
                                    {ESTADO_OBRA_LABELS[obra.estado]}
                                </span>
                            </TableCell>
                            <TableCell className="text-right font-medium">
                                {formatCurrency(Number(obra.montoContrato))}
                            </TableCell>
                            <TableCell className="text-sm text-muted-foreground">
                                {formatDate(obra.fechaInicio)}
                            </TableCell>
                            <TableCell className="text-right">
                                <div className="flex justify-end gap-2">
                                    {onView && (
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            onClick={() => onView(obra)}
                                            title="Ver detalle"
                                        >
                                            <Eye className="h-4 w-4" />
                                        </Button>
                                    )}
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        onClick={() => onEdit(obra)}
                                        title="Editar"
                                    >
                                        <Pencil className="h-4 w-4" />
                                    </Button>
                                </div>
                            </TableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
        </div>
    )
}
