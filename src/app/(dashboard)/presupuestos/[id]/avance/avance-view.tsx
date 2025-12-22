"use client"

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { ResumenAvance } from '@/types/avance'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { AvanceTable } from '@/components/avance/AvanceTable'
import { ArrowLeft, TrendingUp, DollarSign, AlertCircle, CheckCircle2, Download } from 'lucide-react'
import Link from 'next/link'

interface AvanceViewProps {
  presupuesto: {
    id: string
    nombre: string
    version: number
    esVigente: boolean
    obra: {
      id: string
      codigo: string
      nombre: string
      estado: string
    }
  }
}

export function AvanceView({ presupuesto }: AvanceViewProps) {
  const router = useRouter()
  const [avance, setAvance] = useState<ResumenAvance | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isDownloading, setIsDownloading] = useState(false)

  useEffect(() => {
    fetchAvance()
  }, [presupuesto.id])

  const fetchAvance = async () => {
    setIsLoading(true)
    setError(null)
    try {
      const response = await fetch(`/api/presupuestos/${presupuesto.id}/avance`)
      if (!response.ok) {
        throw new Error('Error al cargar el avance')
      }
      const data = await response.json()
      setAvance(data)
    } catch (err) {
      console.error('Error:', err)
      setError('Error al cargar el avance del presupuesto')
    } finally {
      setIsLoading(false)
    }
  }

  const handleActualizarAvance = async (conceptoId: string, cantidadEjecutada: number) => {
    try {
      const response = await fetch(`/api/presupuestos/${presupuesto.id}/avance`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          conceptoPresupuestoId: conceptoId,
          cantidadEjecutada
        })
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Error al actualizar')
      }

      // Recargar avance
      await fetchAvance()
    } catch (err) {
      console.error('Error:', err)
      throw err
    }
  }

  const handleDownloadPDF = async () => {
    setIsDownloading(true)
    try {
      const response = await fetch(`/api/presupuestos/${presupuesto.id}/avance/pdf`)
      if (!response.ok) {
        throw new Error('Error al generar PDF')
      }

      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `Avance_${presupuesto.obra.codigo}_v${presupuesto.version}.pdf`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
    } catch (error) {
      console.error('Error al descargar PDF:', error)
      alert('Error al generar el PDF')
    } finally {
      setIsDownloading(false)
    }
  }

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('es-MX', {
      style: 'currency',
      currency: 'MXN',
      minimumFractionDigits: 2,
    }).format(value)
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-slate-900 mx-auto mb-4"></div>
          <p className="text-muted-foreground">Cargando avance...</p>
        </div>
      </div>
    )
  }

  if (error || !avance) {
    return (
      <div className="p-8">
        <div className="bg-red-50 border-l-4 border-red-400 p-4">
          <p className="text-sm text-red-700">{error || 'Error al cargar el avance'}</p>
          <Button onClick={fetchAvance} className="mt-4" variant="outline">
            Reintentar
          </Button>
        </div>
      </div>
    )
  }

  const totales = avance.totales
  const porcentajeAvance = totales.porcentajeAvanceGeneral

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href={`/presupuestos/${presupuesto.id}`}>
            <Button variant="outline" size="icon">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">
              Avance de Obra
            </h1>
            <p className="text-lg text-muted-foreground">
              {presupuesto.obra.codigo} - {presupuesto.obra.nombre}
            </p>
            <div className="flex items-center gap-2 mt-1">
              <span className="text-sm text-muted-foreground">
                Presupuesto: {presupuesto.nombre} (v{presupuesto.version})
              </span>
              {presupuesto.esVigente && (
                <div title="Presupuesto vigente">
                  <CheckCircle2 className="h-4 w-4 text-green-600" />
                </div>
              )}
            </div>
          </div>
        </div>
        <Button
          variant="secondary"
          onClick={handleDownloadPDF}
          disabled={isDownloading}
        >
          <Download className="h-4 w-4 mr-2" />
          {isDownloading ? 'Generando...' : 'Descargar PDF'}
        </Button>
      </div>

      {/* Resumen de Avance */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Importe Presupuestado
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(totales.importePresupuesto)}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <TrendingUp className="h-4 w-4" />
              Importe Ejecutado
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              {formatCurrency(totales.importeEjecutado)}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Importe Pendiente
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">
              {formatCurrency(totales.importePendiente)}
            </div>
          </CardContent>
        </Card>

        <Card className={`${
          porcentajeAvance >= 100 ? 'bg-green-50' :
          porcentajeAvance >= 75 ? 'bg-blue-50' :
          porcentajeAvance >= 50 ? 'bg-yellow-50' :
          'bg-slate-50'
        }`}>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <DollarSign className="h-4 w-4" />
              Avance General
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className={`text-3xl font-bold ${
              porcentajeAvance >= 100 ? 'text-green-600' :
              porcentajeAvance >= 75 ? 'text-blue-600' :
              porcentajeAvance >= 50 ? 'text-yellow-600' :
              'text-slate-600'
            }`}>
              {porcentajeAvance.toFixed(1)}%
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Alerta si no es vigente */}
      {!presupuesto.esVigente && (
        <Card className="border-amber-200 bg-amber-50">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <AlertCircle className="h-5 w-5 text-amber-600" />
              <div>
                <p className="font-medium text-amber-900">Presupuesto no vigente</p>
                <p className="text-sm text-amber-700">
                  Este presupuesto no está marcado como vigente. Los cambios se guardarán pero no afectarán reportes oficiales.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Tabla de Avance */}
      <Card>
        <CardHeader>
          <CardTitle>Detalle de Avance por Concepto</CardTitle>
          <CardDescription>
            Registra la cantidad ejecutada de cada concepto para calcular el avance de la obra
          </CardDescription>
        </CardHeader>
        <CardContent>
          <AvanceTable
            conceptos={avance.conceptos}
            onActualizar={handleActualizarAvance}
          />
        </CardContent>
      </Card>

      {/* Nota informativa */}
      <Card className="border-blue-200 bg-blue-50">
        <CardContent className="pt-6">
          <div className="flex items-start gap-3">
            <AlertCircle className="h-5 w-5 text-blue-600 mt-0.5" />
            <div className="text-sm text-blue-900">
              <p className="font-medium mb-1">Nota sobre el avance de obra</p>
              <ul className="list-disc list-inside space-y-1 text-blue-700">
                <li>La cantidad ejecutada no puede exceder la cantidad presupuestada</li>
                <li>El avance se calcula automáticamente al guardar las cantidades</li>
                <li>Los importes ejecutados se calculan multiplicando cantidad ejecutada × precio unitario</li>
                <li>El porcentaje de avance general se calcula sobre el importe total presupuestado</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
