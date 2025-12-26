'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { BookOpen, FileText, Plus, TrendingUp } from 'lucide-react'

export default function ContabilidadPage() {
    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold">Contabilidad</h1>
                <p className="text-muted-foreground">Gestión contable y pólizas</p>
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {/* Catálogo de Cuentas */}
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">
                            Catálogo de Cuentas
                        </CardTitle>
                        <BookOpen className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <p className="text-xs text-muted-foreground mb-4">
                            Gestiona tu plan de cuentas contables
                        </p>
                        <Link href="/contabilidad/catalogo">
                            <Button variant="outline" className="w-full">
                                Ver Catálogo
                            </Button>
                        </Link>
                    </CardContent>
                </Card>

                {/* Pólizas */}
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">
                            Pólizas Contables
                        </CardTitle>
                        <FileText className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <p className="text-xs text-muted-foreground mb-4">
                            Registra asientos de diario, ingresos y egresos
                        </p>
                        <div className="flex gap-2">
                            <Link href="/contabilidad/polizas" className="flex-1">
                                <Button variant="outline" className="w-full">
                                    Ver Pólizas
                                </Button>
                            </Link>
                            <Link href="/contabilidad/polizas/nueva">
                                <Button size="icon">
                                    <Plus className="h-4 w-4" />
                                </Button>
                            </Link>
                        </div>
                    </CardContent>
                </Card>

                {/* Reportes (Placeholder) */}
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">
                            Reportes Contables
                        </CardTitle>
                        <TrendingUp className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <p className="text-xs text-muted-foreground mb-4">
                            Balance general, estado de resultados
                        </p>
                        <Button variant="outline" className="w-full" disabled>
                            Próximamente
                        </Button>
                    </CardContent>
                </Card>
            </div>

            {/* Quick Actions */}
            <Card>
                <CardHeader>
                    <CardTitle>Acciones Rápidas</CardTitle>
                </CardHeader>
                <CardContent className="grid gap-2">
                    <Link href="/contabilidad/polizas/nueva">
                        <Button className="w-full justify-start" variant="outline">
                            <Plus className="mr-2 h-4 w-4" />
                            Nueva Póliza
                        </Button>
                    </Link>
                    <Link href="/contabilidad/catalogo">
                        <Button className="w-full justify-start" variant="outline">
                            <BookOpen className="mr-2 h-4 w-4" />
                            Agregar Cuenta Contable
                        </Button>
                    </Link>
                </CardContent>
            </Card>
        </div>
    )
}
