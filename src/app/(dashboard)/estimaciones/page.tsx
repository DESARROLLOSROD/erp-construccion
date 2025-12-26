'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Plus, Search, FileText, CheckCircle, XCircle, Clock, DollarSign } from 'lucide-react'

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
  obra: {
    id: string
    codigo: string
    nombre: string
  }
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

export default function EstimacionesPage() {
  const [estimaciones, setEstimaciones] = useState<Estimacion[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [estadoFilter, setEstadoFilter] = useState<string>('')

  useEffect(() => {
    fetchEstimaciones()
  }, [])

  const fetchEstimaciones = async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams()
      if (estadoFilter) params.append('estado', estadoFilter)

      const response = await fetch(`/api/estimaciones?${params}`)
      if (!response.ok) throw new Error('Error al cargar estimaciones')

      const data = await response.json()
      setEstimaciones(data.data || [])
    } catch (error) {
      console.error('Error:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchEstimaciones()
  }, [estadoFilter])

  const filteredEstimaciones = estimaciones.filter(est => {
    const searchLower = searchTerm.toLowerCase()
    return (
      est.numero.toString().includes(searchLower) ||
      est.periodo.toLowerCase().includes(searchLower) ||
      est.obra.codigo.toLowerCase().includes(searchLower) ||
      est.obra.nombre.toLowerCase().includes(searchLower)
    )
  })

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('es-MX', {
      style: 'currency',
      currency: 'MXN'
    }).format(value)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-MX', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }

  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Estimaciones</h1>
            <p className="text-gray-600 mt-1">Gestiona las estimaciones de avance de obra</p>
          </div>
          <Link
            href="/estimaciones/nueva"
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Plus className="w-5 h-5" />
            Nueva Estimación
          </Link>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow-sm p-4 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Buscar por número, período u obra..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          {/* Estado Filter */}
          <div>
            <select
              value={estadoFilter}
              onChange={(e) => setEstadoFilter(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">Todos los estados</option>
              <option value="BORRADOR">Borrador</option>
              <option value="ENVIADA">Enviada</option>
              <option value="APROBADA">Aprobada</option>
              <option value="FACTURADA">Facturada</option>
              <option value="PAGADA">Pagada</option>
              <option value="RECHAZADA">Rechazada</option>
            </select>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-lg shadow-sm overflow-hidden">
        {loading ? (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <p className="text-gray-600 mt-4">Cargando estimaciones...</p>
          </div>
        ) : filteredEstimaciones.length === 0 ? (
          <div className="text-center py-12">
            <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600">No se encontraron estimaciones</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Estimación
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Obra
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Período
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Fecha Corte
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Estado
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Importe Bruto
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Importe Neto
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Acciones
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredEstimaciones.map((estimacion) => {
                  const Icon = ESTADO_ICONS[estimacion.estado]
                  return (
                    <tr key={estimacion.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">
                          #{estimacion.numero}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-900">{estimacion.obra.codigo}</div>
                        <div className="text-sm text-gray-500 truncate max-w-xs">
                          {estimacion.obra.nombre}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{estimacion.periodo}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {formatDate(estimacion.fechaCorte)}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            ESTADO_COLORS[estimacion.estado]
                          }`}
                        >
                          <Icon className="w-3 h-3" />
                          {estimacion.estado}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium text-gray-900">
                        {formatCurrency(estimacion.importeBruto)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-semibold text-green-600">
                        {formatCurrency(estimacion.importeNeto)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <Link
                          href={`/estimaciones/${estimacion.id}`}
                          className="text-blue-600 hover:text-blue-900"
                        >
                          Ver detalles
                        </Link>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Summary Cards */}
      {!loading && filteredEstimaciones.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-6">
          <div className="bg-white rounded-lg shadow-sm p-4">
            <div className="text-sm text-gray-600 mb-1">Total Estimaciones</div>
            <div className="text-2xl font-bold text-gray-900">
              {filteredEstimaciones.length}
            </div>
          </div>
          <div className="bg-white rounded-lg shadow-sm p-4">
            <div className="text-sm text-gray-600 mb-1">Importe Total Bruto</div>
            <div className="text-2xl font-bold text-gray-900">
              {formatCurrency(
                filteredEstimaciones.reduce((sum, est) => sum + est.importeBruto, 0)
              )}
            </div>
          </div>
          <div className="bg-white rounded-lg shadow-sm p-4">
            <div className="text-sm text-gray-600 mb-1">Importe Total Neto</div>
            <div className="text-2xl font-bold text-green-600">
              {formatCurrency(
                filteredEstimaciones.reduce((sum, est) => sum + est.importeNeto, 0)
              )}
            </div>
          </div>
          <div className="bg-white rounded-lg shadow-sm p-4">
            <div className="text-sm text-gray-600 mb-1">Pagadas</div>
            <div className="text-2xl font-bold text-emerald-600">
              {filteredEstimaciones.filter(est => est.estado === 'PAGADA').length}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
