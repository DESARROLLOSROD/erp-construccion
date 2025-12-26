'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  ArrowLeft,
  Edit,
  Trash2,
  FileText,
  CheckCircle,
  XCircle,
  Clock,
  DollarSign,
  Building2,
  Calendar,
  TrendingUp,
} from 'lucide-react'

interface ConceptoEstimacion {
  id: string
  cantidadEjecutada: number
  cantidadAcumulada: number
  importe: number
  conceptoPresupuesto: {
    id: string
    clave: string
    descripcion: string
    cantidad: number
    precioUnitario: number
    importe: number
    unidad: {
      id: string
      nombre: string
      abreviatura: string
    } | null
  }
}

interface Estimacion {
  id: string
  numero: number
  periodo: string
  fechaCorte: string
  estado: 'BORRADOR' | 'ENVIADA' | 'APROBADA' | 'FACTURADA' | 'PAGADA' | 'RECHAZADA'
  importeBruto: number
  amortizacion: number
  retencion: number
  importeNeto: number
  createdAt: string
  updatedAt: string
  obra: {
    id: string
    codigo: string
    nombre: string
    montoContrato: number
    anticipoPct: number
    retencionPct: number
    cliente: {
      razonSocial: string
      nombreComercial: string | null
    } | null
  }
  conceptos: ConceptoEstimacion[]
}

const ESTADO_COLORS = {
  BORRADOR: 'bg-gray-100 text-gray-800',
  ENVIADA: 'bg-blue-100 text-blue-800',
  APROBADA: 'bg-green-100 text-green-800',
  FACTURADA: 'bg-purple-100 text-purple-800',
  PAGADA: 'bg-emerald-100 text-emerald-800',
  RECHAZADA: 'bg-red-100 text-red-800',
}

const ESTADO_ICONS = {
  BORRADOR: Clock,
  ENVIADA: FileText,
  APROBADA: CheckCircle,
  FACTURADA: DollarSign,
  PAGADA: CheckCircle,
  RECHAZADA: XCircle,
}

export default function EstimacionDetailPage() {
  const params = useParams()
  const router = useRouter()
  const [estimacion, setEstimacion] = useState<Estimacion | null>(null)
  const [loading, setLoading] = useState(true)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [deleting, setDeleting] = useState(false)

  useEffect(() => {
    fetchEstimacion()
  }, [params.id])

  const fetchEstimacion = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/estimaciones/${params.id}`)
      if (!response.ok) throw new Error('Error al cargar estimación')

      const data = await response.json()
      setEstimacion(data.data)
    } catch (error) {
      console.error('Error:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async () => {
    try {
      setDeleting(true)
      const response = await fetch(`/api/estimaciones/${params.id}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Error al eliminar')
      }

      router.push('/estimaciones')
    } catch (error: any) {
      console.error('Error:', error)
      alert(error.message || 'Error al eliminar la estimación')
    } finally {
      setDeleting(false)
      setShowDeleteConfirm(false)
    }
  }

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('es-MX', {
      style: 'currency',
      currency: 'MXN',
    }).format(value)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-MX', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    })
  }

  const formatNumber = (value: number, decimals: number = 2) => {
    return new Intl.NumberFormat('es-MX', {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals,
    }).format(value)
  }

  if (loading) {
    return (
      <div className="p-6">
        <div className="text-center py-12">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <p className="text-gray-600 mt-4">Cargando estimación...</p>
        </div>
      </div>
    )
  }

  if (!estimacion) {
    return (
      <div className="p-6">
        <div className="text-center py-12">
          <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600">Estimación no encontrada</p>
          <Link
            href="/estimaciones"
            className="mt-4 inline-flex items-center gap-2 text-blue-600 hover:text-blue-700"
          >
            <ArrowLeft className="w-4 h-4" />
            Volver a estimaciones
          </Link>
        </div>
      </div>
    )
  }

  const Icon = ESTADO_ICONS[estimacion.estado]

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Breadcrumb */}
      <div className="mb-6">
        <Link
          href="/estimaciones"
          className="inline-flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900"
        >
          <ArrowLeft className="w-4 h-4" />
          Volver a estimaciones
        </Link>
      </div>

      {/* Header */}
      <div className="mb-6">
        <div className="flex justify-between items-start">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <h1 className="text-3xl font-bold text-gray-900">
                Estimación #{estimacion.numero}
              </h1>
              <span
                className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium ${
                  ESTADO_COLORS[estimacion.estado]
                }`}
              >
                <Icon className="w-4 h-4" />
                {estimacion.estado}
              </span>
            </div>
            <p className="text-gray-600">
              Período: {estimacion.periodo} • Corte: {formatDate(estimacion.fechaCorte)}
            </p>
          </div>

          {/* Actions */}
          {estimacion.estado === 'BORRADOR' && (
            <div className="flex gap-2">
              <button
                onClick={() => router.push(`/estimaciones/${estimacion.id}/editar`)}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                <Edit className="w-4 h-4" />
                Editar
              </button>
              <button
                onClick={() => setShowDeleteConfirm(true)}
                className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
              >
                <Trash2 className="w-4 h-4" />
                Eliminar
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Obra Info Card */}
      <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
        <div className="flex items-start gap-4">
          <div className="p-3 bg-blue-100 rounded-lg">
            <Building2 className="w-6 h-6 text-blue-600" />
          </div>
          <div className="flex-1">
            <h2 className="text-lg font-semibold text-gray-900 mb-1">
              {estimacion.obra.codigo} - {estimacion.obra.nombre}
            </h2>
            {estimacion.obra.cliente && (
              <p className="text-sm text-gray-600">
                Cliente: {estimacion.obra.cliente.nombreComercial || estimacion.obra.cliente.razonSocial}
              </p>
            )}
            <div className="grid grid-cols-3 gap-4 mt-4">
              <div>
                <p className="text-xs text-gray-500">Monto Contrato</p>
                <p className="text-sm font-semibold text-gray-900">
                  {formatCurrency(estimacion.obra.montoContrato)}
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-500">Anticipo</p>
                <p className="text-sm font-semibold text-gray-900">
                  {formatNumber(estimacion.obra.anticipoPct)}%
                </p>
              </div>
              <div>
                <p className="text-xs text-gray-500">Retención</p>
                <p className="text-sm font-semibold text-gray-900">
                  {formatNumber(estimacion.obra.retencionPct)}%
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-lg shadow-sm p-4">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm text-gray-600">Importe Bruto</p>
            <TrendingUp className="w-5 h-5 text-blue-600" />
          </div>
          <p className="text-2xl font-bold text-gray-900">
            {formatCurrency(estimacion.importeBruto)}
          </p>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-4">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm text-gray-600">Amortización</p>
            <DollarSign className="w-5 h-5 text-orange-600" />
          </div>
          <p className="text-2xl font-bold text-orange-600">
            {formatCurrency(estimacion.amortizacion)}
          </p>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-4">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm text-gray-600">Retención</p>
            <DollarSign className="w-5 h-5 text-red-600" />
          </div>
          <p className="text-2xl font-bold text-red-600">
            {formatCurrency(estimacion.retencion)}
          </p>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-4 border-2 border-green-200">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm text-gray-600">Importe Neto</p>
            <CheckCircle className="w-5 h-5 text-green-600" />
          </div>
          <p className="text-2xl font-bold text-green-600">
            {formatCurrency(estimacion.importeNeto)}
          </p>
        </div>
      </div>

      {/* Conceptos Table */}
      <div className="bg-white rounded-lg shadow-sm overflow-hidden mb-6">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">
            Conceptos Ejecutados ({estimacion.conceptos.length})
          </h2>
        </div>

        {estimacion.conceptos.length === 0 ? (
          <div className="text-center py-12">
            <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600">No hay conceptos en esta estimación</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Clave
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Descripción
                  </th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Unidad
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Cant. Presup.
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Cant. Ejecutada
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Cant. Acumulada
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    P.U.
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Importe
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    % Avance
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {estimacion.conceptos.map((concepto) => {
                  const porcentajeAvance =
                    (concepto.cantidadAcumulada / concepto.conceptoPresupuesto.cantidad) * 100
                  return (
                    <tr key={concepto.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {concepto.conceptoPresupuesto.clave}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900 max-w-xs">
                        {concepto.conceptoPresupuesto.descripcion}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-center text-sm text-gray-600">
                        {concepto.conceptoPresupuesto.unidad?.abreviatura || '-'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm text-gray-900">
                        {formatNumber(concepto.conceptoPresupuesto.cantidad, 4)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium text-blue-600">
                        {formatNumber(concepto.cantidadEjecutada, 4)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-semibold text-gray-900">
                        {formatNumber(concepto.cantidadAcumulada, 4)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm text-gray-900">
                        {formatCurrency(concepto.conceptoPresupuesto.precioUnitario)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-semibold text-green-600">
                        {formatCurrency(concepto.importe)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm">
                        <span
                          className={`inline-flex px-2 py-1 rounded text-xs font-medium ${
                            porcentajeAvance >= 100
                              ? 'bg-green-100 text-green-800'
                              : porcentajeAvance >= 75
                              ? 'bg-blue-100 text-blue-800'
                              : porcentajeAvance >= 50
                              ? 'bg-yellow-100 text-yellow-800'
                              : 'bg-gray-100 text-gray-800'
                          }`}
                        >
                          {formatNumber(porcentajeAvance, 1)}%
                        </span>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
              <tfoot className="bg-gray-50">
                <tr>
                  <td colSpan={7} className="px-6 py-4 text-right text-sm font-semibold text-gray-900">
                    Total:
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-bold text-green-600">
                    {formatCurrency(estimacion.conceptos.reduce((sum, c) => sum + c.importe, 0))}
                  </td>
                  <td></td>
                </tr>
              </tfoot>
            </table>
          </div>
        )}
      </div>

      {/* Metadata */}
      <div className="bg-gray-50 rounded-lg p-4">
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <span className="text-gray-600">Creado:</span>{' '}
            <span className="text-gray-900">{formatDate(estimacion.createdAt)}</span>
          </div>
          <div>
            <span className="text-gray-600">Última actualización:</span>{' '}
            <span className="text-gray-900">{formatDate(estimacion.updatedAt)}</span>
          </div>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Confirmar eliminación</h3>
            <p className="text-gray-600 mb-6">
              ¿Estás seguro de que deseas eliminar la estimación #{estimacion.numero}? Esta acción no
              se puede deshacer.
            </p>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                disabled={deleting}
                className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleDelete}
                disabled={deleting}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50"
              >
                {deleting ? 'Eliminando...' : 'Eliminar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
