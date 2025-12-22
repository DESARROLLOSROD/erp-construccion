"use client"

import { useState } from "react"
import { Proveedor } from "@/types/proveedor"
import { ProveedorTable } from "@/components/proveedores/ProveedorTable"
import { ProveedorForm } from "@/components/proveedores/ProveedorForm"
import { Button } from "@/components/ui/button"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import { Plus, Truck } from "lucide-react"

interface ProveedoresViewProps {
    initialProveedores: Proveedor[]
}

export function ProveedoresView({ initialProveedores }: ProveedoresViewProps) {
    const [proveedores, setProveedores] = useState(initialProveedores)
    const [isDialogOpen, setIsDialogOpen] = useState(false)
    const [selectedProveedor, setSelectedProveedor] = useState<Proveedor | null>(null)

    const handleEdit = (proveedor: Proveedor) => {
        setSelectedProveedor(proveedor)
        setIsDialogOpen(true)
    }

    const handleNew = () => {
        setSelectedProveedor(null)
        setIsDialogOpen(true)
    }

    const handleSuccess = () => {
        setIsDialogOpen(false)
        setSelectedProveedor(null)
        window.location.reload()
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
                        <Truck className="h-6 w-6" />
                        Proveedores
                    </h1>
                    <p className="text-muted-foreground">
                        Gestiona tu catálogo de proveedores
                    </p>
                </div>
                <Button onClick={handleNew}>
                    <Plus className="h-4 w-4 mr-2" />
                    Nuevo Proveedor
                </Button>
            </div>

            {/* Estadísticas rápidas */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-white p-4 rounded-lg border">
                    <div className="text-sm text-muted-foreground">Total Proveedores</div>
                    <div className="text-2xl font-bold mt-1">{proveedores.length}</div>
                </div>
                <div className="bg-white p-4 rounded-lg border">
                    <div className="text-sm text-muted-foreground">Activos</div>
                    <div className="text-2xl font-bold mt-1 text-green-600">
                        {proveedores.filter(p => p.activo).length}
                    </div>
                </div>
                <div className="bg-white p-4 rounded-lg border">
                    <div className="text-sm text-muted-foreground">Con Datos Bancarios</div>
                    <div className="text-2xl font-bold mt-1 text-blue-600">
                        {proveedores.filter(p => p.clabe).length}
                    </div>
                </div>
            </div>

            {/* Tabla */}
            <div className="bg-white rounded-lg border">
                <ProveedorTable proveedores={proveedores} onEdit={handleEdit} />
            </div>

            {/* Dialog para crear/editar */}
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle>
                            {selectedProveedor ? "Editar Proveedor" : "Nuevo Proveedor"}
                        </DialogTitle>
                        <DialogDescription>
                            {selectedProveedor
                                ? "Modifica la información del proveedor"
                                : "Completa los datos para crear un nuevo proveedor"}
                        </DialogDescription>
                    </DialogHeader>
                    <ProveedorForm
                        initialData={selectedProveedor || undefined}
                        onSuccess={handleSuccess}
                    />
                </DialogContent>
            </Dialog>
        </div>
    )
}
