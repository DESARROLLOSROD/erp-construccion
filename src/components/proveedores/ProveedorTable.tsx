"use client"

import { Proveedor } from "@/types/proveedor"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Pencil, Trash2 } from "lucide-react"

interface ProveedorTableProps {
    proveedores: Proveedor[]
    onEdit: (proveedor: Proveedor) => void
    onDelete?: (proveedor: Proveedor) => void
}

export function ProveedorTable({ proveedores, onEdit, onDelete }: ProveedorTableProps) {
    if (proveedores.length === 0) {
        return (
            <div className="text-center py-12 bg-slate-50 rounded-lg border-2 border-dashed">
                <p className="text-muted-foreground">No hay proveedores registrados</p>
                <p className="text-sm text-muted-foreground mt-1">
                    Crea tu primer proveedor para comenzar
                </p>
            </div>
        )
    }

    return (
        <div className="rounded-md border">
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead>RFC</TableHead>
                        <TableHead>Razón Social</TableHead>
                        <TableHead>Contacto</TableHead>
                        <TableHead>Email</TableHead>
                        <TableHead>Teléfono</TableHead>
                        <TableHead>Banco</TableHead>
                        <TableHead className="text-right">Acciones</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {proveedores.map((proveedor) => (
                        <TableRow key={proveedor.id}>
                            <TableCell className="font-mono text-sm">
                                {proveedor.rfc}
                            </TableCell>
                            <TableCell>
                                <div className="max-w-xs">
                                    <div className="font-medium truncate">
                                        {proveedor.nombreComercial || proveedor.razonSocial}
                                    </div>
                                    {proveedor.nombreComercial && (
                                        <div className="text-xs text-muted-foreground truncate">
                                            {proveedor.razonSocial}
                                        </div>
                                    )}
                                </div>
                            </TableCell>
                            <TableCell>
                                {proveedor.contacto || <span className="text-muted-foreground">-</span>}
                            </TableCell>
                            <TableCell>
                                {proveedor.email || <span className="text-muted-foreground">-</span>}
                            </TableCell>
                            <TableCell>
                                {proveedor.telefono || <span className="text-muted-foreground">-</span>}
                            </TableCell>
                            <TableCell>
                                {proveedor.banco || <span className="text-muted-foreground">-</span>}
                            </TableCell>
                            <TableCell className="text-right">
                                <div className="flex justify-end gap-2">
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        onClick={() => onEdit(proveedor)}
                                        title="Editar"
                                    >
                                        <Pencil className="h-4 w-4" />
                                    </Button>
                                    {onDelete && (
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            onClick={() => onDelete(proveedor)}
                                            title="Eliminar"
                                            className="text-red-600 hover:text-red-700 hover:bg-red-50"
                                        >
                                            <Trash2 className="h-4 w-4" />
                                        </Button>
                                    )}
                                </div>
                            </TableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
        </div>
    )
}
