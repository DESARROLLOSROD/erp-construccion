'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui'
import {
    Table, TableBody, TableCell, TableHead, TableHeader, TableRow
} from '@/components/ui/table'
import { Plus, FileText } from 'lucide-react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

export default function PolizasPage() {
    const [polizas, setPolizas] = useState<any[]>([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        fetch('/api/contabilidad/polizas')
            .then(res => res.json())
            .then(res => {
                if (res.data) setPolizas(res.data)
                setLoading(false)
            })
            .catch(err => setLoading(false))
    }, [])

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h1 className="text-2xl font-bold flex items-center gap-2">
                    <FileText className="h-6 w-6" /> Pólizas Contables
                </h1>
                <Link href="/contabilidad/polizas/nueva">
                    <Button className="gap-2">
                        <Plus className="h-4 w-4" /> Nueva Póliza
                    </Button>
                </Link>
            </div>

            <div className="bg-white rounded-md border shadow-sm">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead className="w-[100px]">Folio</TableHead>
                            <TableHead>Tipo</TableHead>
                            <TableHead>Fecha</TableHead>
                            <TableHead>Concepto</TableHead>
                            <TableHead className="text-right">Total</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {loading ? (
                            <TableRow>
                                <TableCell colSpan={5} className="text-center h-24">
                                    Cargando...
                                </TableCell>
                            </TableRow>
                        ) : polizas.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={5} className="text-center h-24 text-gray-500">
                                    No hay pólizas registradas.
                                </TableCell>
                            </TableRow>
                        ) : (
                            polizas.map((poliza) => {
                                // Calculate total from details
                                const total = poliza.detalles?.reduce((sum: number, d: any) => sum + Number(d.debe), 0) || 0
                                return (
                                    <TableRow key={poliza.id}>
                                        <TableCell className="font-mono">{poliza.tipo.substring(0, 1)}-{poliza.folio}</TableCell>
                                        <TableCell>{poliza.tipo}</TableCell>
                                        <TableCell>{new Date(poliza.fecha).toLocaleDateString()}</TableCell>
                                        <TableCell>{poliza.concepto}</TableCell>
                                        <TableCell className="text-right">
                                            {new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(total)}
                                        </TableCell>
                                    </TableRow>
                                )
                            })
                        )}
                    </TableBody>
                </Table>
            </div>
        </div>
    )
}
