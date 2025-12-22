"use client"

import { useState } from "react"
import { ProductoListItem } from "@/types/producto"
import { ProductoTable } from "@/components/productos/ProductoTable"
import { ProductoForm } from "@/components/productos/ProductoForm"
import { Button } from "@/components/ui/button"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import { Plus, Package, AlertTriangle } from "lucide-react"

interface ProductosViewProps {
    initialProductos: ProductoListItem[]
}

export function ProductosView({ initialProductos }: ProductosViewProps) {
    const [productos, setProductos] = useState(initialProductos)
    const [isDialogOpen, setIsDialogOpen] = useState(false)
    const [selectedProducto, setSelectedProducto] = useState<ProductoListItem | null>(null)

    const handleEdit = (producto: ProductoListItem) => {
        setSelectedProducto(producto)
        setIsDialogOpen(true)
    }

    const handleNew = () => {
        setSelectedProducto(null)
        setIsDialogOpen(true)
    }

    const handleSuccess = () => {
        setIsDialogOpen(false)
        setSelectedProducto(null)
        window.location.reload()
    }

    const productosCount = productos.filter(p => !p.esServicio).length
    const serviciosCount = productos.filter(p => p.esServicio).length
    const stockBajoCount = productos.filter(p =>
        !p.esServicio && p.controlStock && p.stockActual < p.stockMinimo
    ).length

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
                        <Package className="h-6 w-6" />
                        Productos y Servicios
                    </h1>
                    <p className="text-muted-foreground">
                        Gestiona tu catálogo de productos y servicios
                    </p>
                </div>
                <Button onClick={handleNew}>
                    <Plus className="h-4 w-4 mr-2" />
                    Nuevo Producto
                </Button>
            </div>

            {/* Estadísticas rápidas */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="bg-white p-4 rounded-lg border">
                    <div className="text-sm text-muted-foreground">Total</div>
                    <div className="text-2xl font-bold mt-1">{productos.length}</div>
                </div>
                <div className="bg-white p-4 rounded-lg border">
                    <div className="text-sm text-muted-foreground">Productos</div>
                    <div className="text-2xl font-bold mt-1 text-blue-600">
                        {productosCount}
                    </div>
                </div>
                <div className="bg-white p-4 rounded-lg border">
                    <div className="text-sm text-muted-foreground">Servicios</div>
                    <div className="text-2xl font-bold mt-1 text-purple-600">
                        {serviciosCount}
                    </div>
                </div>
                <div className="bg-white p-4 rounded-lg border">
                    <div className="text-sm text-muted-foreground flex items-center gap-1">
                        Stock Bajo
                        {stockBajoCount > 0 && (
                            <AlertTriangle className="h-4 w-4 text-amber-500" />
                        )}
                    </div>
                    <div className={`text-2xl font-bold mt-1 ${
                        stockBajoCount > 0 ? 'text-amber-600' : 'text-green-600'
                    }`}>
                        {stockBajoCount}
                    </div>
                </div>
            </div>

            {/* Tabla */}
            <div className="bg-white rounded-lg border">
                <ProductoTable productos={productos} onEdit={handleEdit} />
            </div>

            {/* Dialog para crear/editar */}
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle>
                            {selectedProducto ? "Editar Producto" : "Nuevo Producto"}
                        </DialogTitle>
                        <DialogDescription>
                            {selectedProducto
                                ? "Modifica la información del producto o servicio"
                                : "Completa los datos para crear un nuevo producto o servicio"}
                        </DialogDescription>
                    </DialogHeader>
                    <ProductoForm
                        initialData={selectedProducto as any}
                        onSuccess={handleSuccess}
                    />
                </DialogContent>
            </Dialog>
        </div>
    )
}
