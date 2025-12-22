"use client"

import { useState } from "react"
import { ObraListItem } from "@/types/obra"
import { ObraTable } from "@/components/obras/ObraTable"
import { ObraForm } from "@/components/obras/ObraForm"
import { Button } from "@/components/ui/button"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import { Plus, HardHat } from "lucide-react"

interface ObrasViewProps {
    initialObras: ObraListItem[]
}

export function ObrasView({ initialObras }: ObrasViewProps) {
    const [obras, setObras] = useState(initialObras)
    const [isDialogOpen, setIsDialogOpen] = useState(false)
    const [selectedObra, setSelectedObra] = useState<ObraListItem | null>(null)

    const handleEdit = (obra: ObraListItem) => {
        setSelectedObra(obra)
        setIsDialogOpen(true)
    }

    const handleNew = () => {
        setSelectedObra(null)
        setIsDialogOpen(true)
    }

    const handleSuccess = () => {
        setIsDialogOpen(false)
        setSelectedObra(null)
        // Recargar obras
        window.location.reload()
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
                        <HardHat className="h-6 w-6" />
                        Obras
                    </h1>
                    <p className="text-muted-foreground">
                        Gestiona tus proyectos de construcción
                    </p>
                </div>
                <Button onClick={handleNew}>
                    <Plus className="h-4 w-4 mr-2" />
                    Nueva Obra
                </Button>
            </div>

            {/* Estadísticas rápidas */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="bg-white p-4 rounded-lg border">
                    <div className="text-sm text-muted-foreground">Total Obras</div>
                    <div className="text-2xl font-bold mt-1">{obras.length}</div>
                </div>
                <div className="bg-white p-4 rounded-lg border">
                    <div className="text-sm text-muted-foreground">En Proceso</div>
                    <div className="text-2xl font-bold mt-1 text-green-600">
                        {obras.filter(o => o.estado === 'EN_PROCESO').length}
                    </div>
                </div>
                <div className="bg-white p-4 rounded-lg border">
                    <div className="text-sm text-muted-foreground">Contratadas</div>
                    <div className="text-2xl font-bold mt-1 text-blue-600">
                        {obras.filter(o => o.estado === 'CONTRATADA').length}
                    </div>
                </div>
                <div className="bg-white p-4 rounded-lg border">
                    <div className="text-sm text-muted-foreground">Terminadas</div>
                    <div className="text-2xl font-bold mt-1 text-purple-600">
                        {obras.filter(o => o.estado === 'TERMINADA').length}
                    </div>
                </div>
            </div>

            {/* Tabla */}
            <div className="bg-white rounded-lg border">
                <ObraTable obras={obras} onEdit={handleEdit} />
            </div>

            {/* Dialog para crear/editar */}
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle>
                            {selectedObra ? "Editar Obra" : "Nueva Obra"}
                        </DialogTitle>
                        <DialogDescription>
                            {selectedObra
                                ? "Modifica la información de la obra"
                                : "Completa los datos para crear una nueva obra"}
                        </DialogDescription>
                    </DialogHeader>
                    <ObraForm
                        initialData={selectedObra as any}
                        onSuccess={handleSuccess}
                    />
                </DialogContent>
            </Dialog>
        </div>
    )
}
