"use client"

import { ProductoListItem } from "@/types/producto"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Pencil, Package, AlertTriangle } from "lucide-react"

interface ProductoTableProps {
    productos: ProductoListItem[]
    onEdit: (producto: ProductoListItem) => void
}

export function ProductoTable({ productos, onEdit }: ProductoTableProps) {
    const formatCurrency = (value: number) => {
        return new Intl.NumberFormat('es-MX', {
            style: 'currency',
            currency: 'MXN',
            minimumFractionDigits: 2,
        }).format(value)
    }

    const formatNumber = (value: number) => {
        return new Intl.NumberFormat('es-MX', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
        }).format(value)
    }

    if (productos.length === 0) {
        return (
            <div className="text-center py-12 bg-slate-50 rounded-lg border-2 border-dashed">
                <Package className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">No hay productos registrados</p>
                <p className="text-sm text-muted-foreground mt-1">
                    Crea tu primer producto para comenzar
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
                        <TableHead>Descripción</TableHead>
                        <TableHead>Categoría</TableHead>
                        <TableHead>Unidad</TableHead>
                        <TableHead>Tipo</TableHead>
                        <TableHead className="text-right">P. Compra</TableHead>
                        <TableHead className="text-right">P. Venta</TableHead>
                        <TableHead className="text-right">Stock</TableHead>
                        <TableHead className="text-right">Acciones</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {productos.map((producto) => {
                        const stockBajo = producto.controlStock &&
                                         producto.stockActual < producto.stockMinimo

                        return (
                            <TableRow key={producto.id}>
                                <TableCell className="font-mono text-sm font-medium">
                                    {producto.codigo}
                                </TableCell>
                                <TableCell>
                                    <div className="max-w-xs truncate">
                                        {producto.descripcion}
                                    </div>
                                </TableCell>
                                <TableCell>
                                    {producto.categoria ? (
                                        <span
                                            className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium"
                                            style={{
                                                backgroundColor: producto.categoria.color ? `${producto.categoria.color}20` : '#f1f5f9',
                                                color: producto.categoria.color || '#64748b'
                                            }}
                                        >
                                            {producto.categoria.nombre}
                                        </span>
                                    ) : (
                                        <span className="text-muted-foreground">-</span>
                                    )}
                                </TableCell>
                                <TableCell>
                                    {producto.unidad ? (
                                        <span className="text-sm">
                                            {producto.unidad.abreviatura}
                                        </span>
                                    ) : (
                                        <span className="text-muted-foreground">-</span>
                                    )}
                                </TableCell>
                                <TableCell>
                                    <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                                        producto.esServicio
                                            ? 'bg-purple-100 text-purple-800'
                                            : 'bg-blue-100 text-blue-800'
                                    }`}>
                                        {producto.esServicio ? 'Servicio' : 'Producto'}
                                    </span>
                                </TableCell>
                                <TableCell className="text-right font-medium">
                                    {formatCurrency(producto.precioCompra)}
                                </TableCell>
                                <TableCell className="text-right font-medium">
                                    {formatCurrency(producto.precioVenta)}
                                </TableCell>
                                <TableCell className="text-right">
                                    {producto.esServicio ? (
                                        <span className="text-muted-foreground">N/A</span>
                                    ) : producto.controlStock ? (
                                        <div className="flex items-center justify-end gap-1">
                                            {stockBajo && (
                                                <div title="Stock bajo">
                                                    <AlertTriangle className="h-4 w-4 text-amber-500" />
                                                </div>
                                            )}
                                            <span className={stockBajo ? 'text-amber-600 font-medium' : ''}>
                                                {formatNumber(producto.stockActual)}
                                            </span>
                                        </div>
                                    ) : (
                                        <span className="text-muted-foreground">-</span>
                                    )}
                                </TableCell>
                                <TableCell className="text-right">
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        onClick={() => onEdit(producto)}
                                        title="Editar"
                                    >
                                        <Pencil className="h-4 w-4" />
                                    </Button>
                                </TableCell>
                            </TableRow>
                        )
                    })}
                </TableBody>
            </Table>
        </div>
    )
}
