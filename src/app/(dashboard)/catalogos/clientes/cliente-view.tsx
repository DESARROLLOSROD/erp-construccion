"use client"

import { useState } from "react"
import { Cliente } from "@/types/cliente"
import { ClienteTable } from "@/components/clientes/ClienteTable"
import { ClienteForm } from "@/components/clientes/ClienteForm"
import { Button } from "@/components/ui/button"
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger
} from "@/components/ui/dialog"
import { Plus } from "lucide-react"

interface ClientesViewProps {
    initialClientes: Cliente[]
}

export function ClientesView({ initialClientes }: ClientesViewProps) {
    const [open, setOpen] = useState(false)
    const [selectedCliente, setSelectedCliente] = useState<Cliente | undefined>(undefined)

    const handleEdit = (cliente: Cliente) => {
        setSelectedCliente(cliente)
        setOpen(true)
    }

    const handleCreate = () => {
        setSelectedCliente(undefined)
        setOpen(true)
    }

    const handleSuccess = () => {
        setOpen(false)
        // Optional: Refresh local state if not relying solely on router.refresh()
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Clientes</h1>
                    <p className="text-muted-foreground">
                        Gestiona los clientes de la empresa.
                    </p>
                </div>
                <Button onClick={handleCreate}>
                    <Plus className="mr-2 h-4 w-4" /> Nuevo Cliente
                </Button>
            </div>

            <ClienteTable
                clientes={initialClientes}
                onEdit={handleEdit}
            />

            <Dialog open={open} onOpenChange={setOpen}>
                <DialogContent className="max-w-2xl">
                    <DialogHeader>
                        <DialogTitle>
                            {selectedCliente ? "Editar Cliente" : "Nuevo Cliente"}
                        </DialogTitle>
                    </DialogHeader>
                    <ClienteForm
                        initialData={selectedCliente}
                        onSuccess={handleSuccess}
                    />
                </DialogContent>
            </Dialog>
        </div>
    )
}
