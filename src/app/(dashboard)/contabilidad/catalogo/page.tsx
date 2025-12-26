'use client'

import { useState, useEffect } from 'react'
import { Button, Input } from '@/components/ui'
import {
    Table, TableBody, TableCell, TableHead, TableHeader, TableRow
} from '@/components/ui/table'
import { Plus, Search, FolderTree } from 'lucide-react'
import { useRouter } from 'next/navigation'

interface Cuenta {
    id: string
    codigo: string
    nombre: string
    tipo: string
    nivel: number
    activo: boolean
}

export default function CatalogoCuentasPage() {
    const [cuentas, setCuentas] = useState<Cuenta[]>([])
    const [loading, setLoading] = useState(true)
    const [filter, setFilter] = useState('')
    const router = useRouter()

    const fetchCuentas = async () => {
        try {
            const res = await fetch('/api/contabilidad/cuentas')
            const data = await res.json()
            if (res.ok) setCuentas(data.data || data)
        } catch (error) {
            console.error(error)
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        fetchCuentas()
    }, [])

    const filtered = cuentas.filter(c =>
        c.codigo.includes(filter) || c.nombre.toLowerCase().includes(filter.toLowerCase())
    )

    // MVP Add Account - In real app, use a Dialog/Form
    const handleAdd = async () => {
        const codigo = prompt('Código (ej. 100-01):')
        if (!codigo) return
        const nombre = prompt('Nombre:')
        if (!nombre) return
        const tipo = prompt('Tipo (ACTIVO, PASIVO, CAPITAL, INGRESOS, EGRESOS):', 'ACTIVO')

        try {
            const res = await fetch('/api/contabilidad/cuentas', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    codigo,
                    nombre,
                    tipo: tipo?.toUpperCase(),
                    nivel: 1 // Default level 1 for MVP
                })
            })
            if (res.ok) {
                fetchCuentas()
            } else {
                alert('Error al crear cuenta')
            }
        } catch (e) {
            alert('Error')
        }
    }

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h1 className="text-2xl font-bold flex items-center gap-2">
                    <FolderTree className="h-6 w-6" /> Catálogo de Cuentas
                </h1>
                <Button onClick={handleAdd} className="gap-2">
                    <Plus className="h-4 w-4" /> Nueva Cuenta
                </Button>
            </div>

            <div className="flex items-center space-x-2 bg-white p-2 rounded border">
                <Search className="h-4 w-4 text-gray-400" />
                <input
                    className="flex-1 outline-none text-sm"
                    placeholder="Buscar por código o nombre..."
                    value={filter}
                    onChange={e => setFilter(e.target.value)}
                />
            </div>

            <div className="bg-white rounded-md border shadow-sm">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Código</TableHead>
                            <TableHead>Nombre</TableHead>
                            <TableHead>Tipo</TableHead>
                            <TableHead>Nivel</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {loading ? (
                            <TableRow>
                                <TableCell colSpan={4} className="text-center h-24">
                                    Cargando...
                                </TableCell>
                            </TableRow>
                        ) : filtered.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={4} className="text-center h-24 text-gray-500">
                                    No hay cuentas registradas.
                                </TableCell>
                            </TableRow>
                        ) : (
                            filtered.map((cuenta) => (
                                <TableRow key={cuenta.id}>
                                    <TableCell className="font-mono">{cuenta.codigo}</TableCell>
                                    <TableCell>
                                        <span style={{ marginLeft: `${(cuenta.nivel - 1) * 20}px` }}>
                                            {cuenta.nombre}
                                        </span>
                                    </TableCell>
                                    <TableCell>{cuenta.tipo}</TableCell>
                                    <TableCell>{cuenta.nivel}</TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </div>
        </div>
    )
}
