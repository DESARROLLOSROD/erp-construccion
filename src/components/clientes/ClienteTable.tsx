"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow
} from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Edit, Trash2 } from "lucide-react"
import { Cliente } from "@/types/cliente"
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogFooter
} from "@/components/ui/dialog"

interface ClienteTableProps {
    clientes: Cliente[]
    onEdit: (cliente: Cliente) => void
}

export function ClienteTable({ clientes, onEdit }: ClienteTableProps) {
    const router = useRouter()
    const [deletingId, setDeletingId] = useState<string | null>(null)

    // Estado para el diálogo de confirmación
    const [confirmOpen, setConfirmOpen] = useState(false)
    const [selectedForDelete, setSelectedForDelete] = useState<string | null>(null)

    const confirmDelete = (id: string) => {
        setSelectedForDelete(id)
        setConfirmOpen(true)
    }

    const handleDelete = async () => {
        if (!selectedForDelete) return

        setDeletingId(selectedForDelete)
        try {
            const res = await fetch(`/api/clientes/${selectedForDelete}`, {
                method: "DELETE"
            })

            if (!res.ok) throw new Error("Error al eliminar")

            router.refresh()
            setConfirmOpen(false)
        } catch (error) {
            console.error(error)
            alert("Error al eliminar cliente")
        } finally {
            setDeletingId(null)
            setSelectedForDelete(null)
        }
    }

    return (
        <>
            <div className="rounded-md border">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>RFC</TableHead>
                            <TableHead>Razón Social</TableHead>
                            <TableHead>Email</TableHead>
                            <TableHead>Teléfono</TableHead>
                            <TableHead className="text-right">Acciones</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {clientes.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={5} className="h-24 text-center">
                                    No hay clientes registrados.
                                </TableCell>
                            </TableRow>
                        ) : (
                            clientes.map((cliente) => (
                                <TableRow key={cliente.id}>
                                    <TableCell className="font-medium">{cliente.rfc}</TableCell>
                                    <TableCell>{cliente.razonSocial}</TableCell>
                                    <TableCell>{cliente.email || "-"}</TableCell>
                                    <TableCell>{cliente.telefono || "-"}</TableCell>
                                    <TableCell className="text-right space-x-2">
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            onClick={() => onEdit(cliente)}
                                        >
                                            <Edit className="h-4 w-4" />
                                        </Button>
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className="text-red-500 hover:text-red-700 hover:bg-red-50"
                                            onClick={() => confirmDelete(cliente.id)}
                                            disabled={deletingId === cliente.id}
                                        >
                                            <Trash2 className="h-4 w-4" />
                                        </Button>
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </div>

            <Dialog open={confirmOpen} onOpenChange={setConfirmOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>¿Estás seguro?</DialogTitle>
                        <DialogDescription>
                            Esta acción marcará al cliente como inactivo. Podrás reactivarlo contactando a soporte.
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setConfirmOpen(false)}>
                            Cancelar
                        </Button>
                        <Button
                            variant="destructive"
                            onClick={handleDelete}
                            disabled={!!deletingId}
                        >
                            {deletingId ? "Eliminando..." : "Eliminar"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    )
}
