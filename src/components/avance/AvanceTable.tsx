"use client"

import { useState } from 'react'
import { AvanceConcepto } from '@/types/avance'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Progress } from '@/components/ui/progress'
import { Edit2, Save, X, TrendingUp, TrendingDown } from 'lucide-react'

interface AvanceTableProps {
  conceptos: AvanceConcepto[]
  onActualizar?: (conceptoId: string, cantidadEjecutada: number) => Promise<void>
  readonly?: boolean
}

export function AvanceTable({ conceptos, onActualizar, readonly = false }: AvanceTableProps) {
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editValue, setEditValue] = useState<string>('')
  const [isUpdating, setIsUpdating] = useState(false)

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('es-MX', {
      style: 'currency',
      currency: 'MXN',
      minimumFractionDigits: 2,
    }).format(value)
  }

  const formatNumber = (value: number, decimals = 2) => {
    return new Intl.NumberFormat('es-MX', {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals,
    }).format(value)
  }

  const handleEdit = (concepto: AvanceConcepto) => {
    setEditingId(concepto.conceptoPresupuestoId)
    setEditValue(concepto.cantidadEjecutada.toString())
  }

  const handleCancel = () => {
    setEditingId(null)
    setEditValue('')
  }

  const handleSave = async (concepto: AvanceConcepto) => {
    if (!onActualizar) return

    const newValue = parseFloat(editValue)
    if (isNaN(newValue) || newValue < 0) {
      alert('Por favor ingresa una cantidad válida')
      return
    }

    if (newValue > concepto.cantidadPresupuesto) {
      alert('La cantidad ejecutada no puede exceder la cantidad presupuestada')
      return
    }

    setIsUpdating(true)
    try {
      await onActualizar(concepto.conceptoPresupuestoId, newValue)
      setEditingId(null)
      setEditValue('')
    } catch (error) {
      console.error('Error al actualizar:', error)
      alert('Error al actualizar el avance')
    } finally {
      setIsUpdating(false)
    }
  }

  const getProgressColor = (porcentaje: number) => {
    if (porcentaje === 0) return 'bg-slate-200'
    if (porcentaje < 25) return 'bg-red-500'
    if (porcentaje < 50) return 'bg-orange-500'
    if (porcentaje < 75) return 'bg-yellow-500'
    if (porcentaje < 100) return 'bg-blue-500'
    return 'bg-green-500'
  }

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[100px]">Clave</TableHead>
            <TableHead>Descripción</TableHead>
            <TableHead className="text-center w-[80px]">Unidad</TableHead>
            <TableHead className="text-right w-[120px]">Cant. Presup.</TableHead>
            <TableHead className="text-right w-[120px]">P.U.</TableHead>
            <TableHead className="text-right w-[140px]">Importe Presup.</TableHead>
            <TableHead className="text-right w-[120px]">Cant. Ejecutada</TableHead>
            <TableHead className="text-right w-[140px]">Importe Ejecutado</TableHead>
            <TableHead className="text-center w-[200px]">Avance</TableHead>
            {!readonly && <TableHead className="text-center w-[100px]">Acciones</TableHead>}
          </TableRow>
        </TableHeader>
        <TableBody>
          {conceptos.length === 0 ? (
            <TableRow>
              <TableCell colSpan={readonly ? 9 : 10} className="text-center py-8 text-muted-foreground">
                No hay conceptos en este presupuesto
              </TableCell>
            </TableRow>
          ) : (
            conceptos.map((concepto) => {
              const isEditing = editingId === concepto.conceptoPresupuestoId
              const porcentaje = concepto.porcentajeAvance

              return (
                <TableRow key={concepto.conceptoPresupuestoId}>
                  <TableCell className="font-mono text-sm">{concepto.clave}</TableCell>
                  <TableCell>
                    <div className="max-w-md">
                      <p className="text-sm truncate">{concepto.descripcion}</p>
                    </div>
                  </TableCell>
                  <TableCell className="text-center text-sm">{concepto.unidad || '-'}</TableCell>
                  <TableCell className="text-right font-medium">
                    {formatNumber(concepto.cantidadPresupuesto, 2)}
                  </TableCell>
                  <TableCell className="text-right text-sm text-muted-foreground">
                    {formatCurrency(concepto.precioUnitario)}
                  </TableCell>
                  <TableCell className="text-right font-semibold">
                    {formatCurrency(concepto.importePresupuesto)}
                  </TableCell>
                  <TableCell className="text-right">
                    {isEditing ? (
                      <Input
                        type="number"
                        step="0.01"
                        value={editValue}
                        onChange={(e) => setEditValue(e.target.value)}
                        className="w-24 text-right"
                        autoFocus
                        disabled={isUpdating}
                      />
                    ) : (
                      <span className={`font-medium ${porcentaje > 0 ? 'text-blue-600' : ''}`}>
                        {formatNumber(concepto.cantidadEjecutada, 2)}
                      </span>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    <span className={`font-semibold ${porcentaje > 0 ? 'text-blue-600' : ''}`}>
                      {formatCurrency(concepto.importeEjecutado)}
                    </span>
                  </TableCell>
                  <TableCell>
                    <div className="space-y-1">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-muted-foreground">
                          {formatNumber(porcentaje, 1)}%
                        </span>
                        {porcentaje === 100 ? (
                          <TrendingUp className="h-3 w-3 text-green-600" />
                        ) : porcentaje === 0 ? (
                          <TrendingDown className="h-3 w-3 text-slate-400" />
                        ) : null}
                      </div>
                      <Progress value={porcentaje} className="h-2" />
                    </div>
                  </TableCell>
                  {!readonly && (
                    <TableCell className="text-center">
                      {isEditing ? (
                        <div className="flex gap-1 justify-center">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleSave(concepto)}
                            disabled={isUpdating}
                            title="Guardar"
                          >
                            <Save className="h-4 w-4 text-green-600" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={handleCancel}
                            disabled={isUpdating}
                            title="Cancelar"
                          >
                            <X className="h-4 w-4 text-red-600" />
                          </Button>
                        </div>
                      ) : (
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleEdit(concepto)}
                          title="Editar cantidad ejecutada"
                        >
                          <Edit2 className="h-4 w-4" />
                        </Button>
                      )}
                    </TableCell>
                  )}
                </TableRow>
              )
            })
          )}
        </TableBody>
      </Table>
    </div>
  )
}
