'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  ArrowLeft,
  ArrowRight,
  Building2,
  Calendar,
  FileText,
  Check,
  Plus,
  Trash2,
  Search,
} from 'lucide-react'

interface Obra {
  id: string
  codigo: string
  nombre: string
  estado: string
  montoContrato: number
  anticipoPct: number
  retencionPct: number
  cliente: {
    razonSocial: string
    nombreComercial: string | null
  } | null
}

interface Presupuesto {
  id: string
  version: number
  nombre: string
  esVigente: boolean
  totalConceptos: number
  importeTotal: number
}

interface ConceptoPresupuesto {
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

interface ConceptoEstimacion {
  conceptoPresupuestoId: string
  cantidadEjecutada: number
  cantidadAcumulada: number
  importe: number
  // Extended info for display
  clave: string
  descripcion: string
  unidad: string
  precioUnitario: number
}

export default function NuevaEstimacionPage() {
  const router = useRouter()
  const [step, setStep] = useState(1)
  const [loading, setLoading] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  // Step 1: Select Obra
  const [obras, setObras] = useState<Obra[]>([])
  const [loadingObras, setLoadingObras] = useState(true)
  const [obraSearch, setObraSearch] = useState('')
  const [selectedObra, setSelectedObra] = useState<Obra | null>(null)

  // Step 2: Basic Information
  const [numero, setNumero] = useState('')
  const [periodo, setPeriodo] = useState('')
  const [fechaCorte, setFechaCorte] = useState('')
  const [presupuestos, setPresupuestos] = useState<Presupuesto[]>([])
  const [selectedPresupuesto, setSelectedPresupuesto] = useState<Presupuesto | null>(null)

  // Step 3: Conceptos
  const [conceptosPresupuesto, setConceptosPresupuesto] = useState<ConceptoPresupuesto[]>([])
  const [conceptosEstimacion, setConceptosEstimacion] = useState<ConceptoEstimacion[]>([])
  const [searchConcepto, setSearchConcepto] = useState('')

  // Calculated totals
  const [importeBruto, setImporteBruto] = useState(0)
  const [amortizacion, setAmortizacion] = useState(0)
  const [retencion, setRetencion] = useState(0)
  const [importeNeto, setImporteNeto] = useState(0)

  // Fetch obras on mount
  useEffect(() => {
    fetchObras()
  }, [])

  const fetchObras = async () => {
    try {
      setLoadingObras(true)
      const response = await fetch('/api/obras?estado=EN_PROCESO&limit=100')
      if (!response.ok) throw new Error('Error al cargar obras')

      const data = await response.json()
      setObras(data.data.data || [])
    } catch (error) {
      console.error('Error:', error)
      alert('Error al cargar obras')
    } finally {
      setLoadingObras(false)
    }
  }

  const fetchPresupuestos = async (obraId: string) => {
    try {
      setLoading(true)
      const response = await fetch(`/api/presupuestos?obraId=${obraId}`)
      if (!response.ok) throw new Error('Error al cargar presupuestos')

      const data = await response.json()
      const presupuestos = data.data.data || []
      setPresupuestos(presupuestos)

      // Auto-select vigente presupuesto
      const vigente = presupuestos.find((p: Presupuesto) => p.esVigente)
      if (vigente) {
        setSelectedPresupuesto(vigente)
      }
    } catch (error) {
      console.error('Error:', error)
      alert('Error al cargar presupuestos')
    } finally {
      setLoading(false)
    }
  }

  const fetchConceptosPresupuesto = async (presupuestoId: string) => {
    try {
      setLoading(true)
      const response = await fetch(`/api/presupuestos/${presupuestoId}/conceptos`)
      if (!response.ok) throw new Error('Error al cargar conceptos')

      const data = await response.json()
      setConceptosPresupuesto(data || [])
    } catch (error) {
      console.error('Error:', error)
      alert('Error al cargar conceptos del presupuesto')
    } finally {
      setLoading(false)
    }
  }

  const handleSelectObra = (obra: Obra) => {
    setSelectedObra(obra)
    fetchPresupuestos(obra.id)
  }

  const handleNextStep = () => {
    if (step === 1 && !selectedObra) {
      alert('Por favor selecciona una obra')
      return
    }

    if (step === 2) {
      if (!numero || !periodo || !fechaCorte || !selectedPresupuesto) {
        alert('Por favor completa todos los campos')
        return
      }
      fetchConceptosPresupuesto(selectedPresupuesto.id)
    }

    setStep(step + 1)
  }

  const handlePrevStep = () => {
    setStep(step - 1)
  }

  const addConcepto = (concepto: ConceptoPresupuesto) => {
    // Check if already added
    if (conceptosEstimacion.some(c => c.conceptoPresupuestoId === concepto.id)) {
      alert('Este concepto ya fue agregado')
      return
    }

    const newConcepto: ConceptoEstimacion = {
      conceptoPresupuestoId: concepto.id,
      cantidadEjecutada: 0,
      cantidadAcumulada: 0,
      importe: 0,
      clave: concepto.clave,
      descripcion: concepto.descripcion,
      unidad: concepto.unidad?.abreviatura || '-',
      precioUnitario: concepto.precioUnitario,
    }

    setConceptosEstimacion([...conceptosEstimacion, newConcepto])
  }

  const removeConcepto = (conceptoId: string) => {
    setConceptosEstimacion(conceptosEstimacion.filter(c => c.conceptoPresupuestoId !== conceptoId))
  }

  const updateConcepto = (conceptoId: string, field: string, value: number) => {
    setConceptosEstimacion(
      conceptosEstimacion.map(c => {
        if (c.conceptoPresupuestoId === conceptoId) {
          const updated = { ...c, [field]: value }

          // Auto-calculate importe
          if (field === 'cantidadEjecutada') {
            updated.importe = value * c.precioUnitario
            // Also update accumulated if needed
            if (value > updated.cantidadAcumulada) {
              updated.cantidadAcumulada = value
            }
          }

          if (field === 'cantidadAcumulada' && value < updated.cantidadEjecutada) {
            updated.cantidadEjecutada = value
            updated.importe = value * c.precioUnitario
          }

          return updated
        }
        return c
      })
    )
  }

  // Recalculate totals when conceptos change
  useEffect(() => {
    const bruto = conceptosEstimacion.reduce((sum, c) => sum + c.importe, 0)
    const amort = bruto * ((selectedObra?.anticipoPct || 0) / 100)
    const ret = bruto * ((selectedObra?.retencionPct || 0) / 100)
    const neto = bruto - amort - ret

    setImporteBruto(bruto)
    setAmortizacion(amort)
    setRetencion(ret)
    setImporteNeto(neto)
  }, [conceptosEstimacion, selectedObra])

  const handleSubmit = async () => {
    if (!selectedObra || !selectedPresupuesto) {
      alert('Datos incompletos')
      return
    }

    if (conceptosEstimacion.length === 0) {
      alert('Debes agregar al menos un concepto')
      return
    }

    try {
      setSubmitting(true)

      // Create estimacion
      const estimacionResponse = await fetch('/api/estimaciones', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          obraId: selectedObra.id,
          numero: parseInt(numero),
          periodo,
          fechaCorte: new Date(fechaCorte).toISOString(),
          importeBruto,
          amortizacion,
          retencion,
          importeNeto,
        }),
      })

      if (!estimacionResponse.ok) {
        const error = await estimacionResponse.json()
        throw new Error(error.error || 'Error al crear estimación')
      }

      const estimacionData = await estimacionResponse.json()
      const estimacionId = estimacionData.data.id

      // Add conceptos
      for (const concepto of conceptosEstimacion) {
        const conceptoResponse = await fetch(`/api/estimaciones/${estimacionId}/conceptos`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            conceptoPresupuestoId: concepto.conceptoPresupuestoId,
            cantidadEjecutada: concepto.cantidadEjecutada,
            cantidadAcumulada: concepto.cantidadAcumulada,
            importe: concepto.importe,
          }),
        })

        if (!conceptoResponse.ok) {
          console.error('Error al agregar concepto:', concepto.clave)
        }
      }

      alert('Estimación creada exitosamente')
      router.push(`/estimaciones/${estimacionId}`)
    } catch (error: any) {
      console.error('Error:', error)
      alert(error.message || 'Error al crear la estimación')
    } finally {
      setSubmitting(false)
    }
  }

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('es-MX', {
      style: 'currency',
      currency: 'MXN',
    }).format(value)
  }

  const formatNumber = (value: number, decimals: number = 2) => {
    return new Intl.NumberFormat('es-MX', {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals,
    }).format(value)
  }

  const filteredObras = obras.filter(obra => {
    const searchLower = obraSearch.toLowerCase()
    return (
      obra.codigo.toLowerCase().includes(searchLower) ||
      obra.nombre.toLowerCase().includes(searchLower)
    )
  })

  const filteredConceptos = conceptosPresupuesto.filter(concepto => {
    const searchLower = searchConcepto.toLowerCase()
    return (
      concepto.clave.toLowerCase().includes(searchLower) ||
      concepto.descripcion.toLowerCase().includes(searchLower)
    )
  })

  return (
    <div className="p-6 max-w-6xl mx-auto">
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
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Nueva Estimación</h1>
        <p className="text-gray-600">Completa los siguientes pasos para crear una estimación</p>
      </div>

      {/* Progress Steps */}
      <div className="mb-8">
        <div className="flex items-center justify-between max-w-3xl mx-auto">
          {[1, 2, 3].map((stepNum) => (
            <div key={stepNum} className="flex items-center flex-1">
              <div
                className={`flex items-center justify-center w-10 h-10 rounded-full border-2 ${
                  step >= stepNum
                    ? 'bg-blue-600 border-blue-600 text-white'
                    : 'bg-white border-gray-300 text-gray-400'
                }`}
              >
                {step > stepNum ? <Check className="w-5 h-5" /> : stepNum}
              </div>
              {stepNum < 3 && (
                <div
                  className={`flex-1 h-0.5 mx-2 ${
                    step > stepNum ? 'bg-blue-600' : 'bg-gray-300'
                  }`}
                />
              )}
            </div>
          ))}
        </div>
        <div className="flex items-center justify-between max-w-3xl mx-auto mt-2">
          <span className={`text-sm ${step >= 1 ? 'text-blue-600 font-medium' : 'text-gray-500'}`}>
            Seleccionar Obra
          </span>
          <span className={`text-sm ${step >= 2 ? 'text-blue-600 font-medium' : 'text-gray-500'}`}>
            Información Básica
          </span>
          <span className={`text-sm ${step >= 3 ? 'text-blue-600 font-medium' : 'text-gray-500'}`}>
            Agregar Conceptos
          </span>
        </div>
      </div>

      {/* Step Content */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        {/* Step 1: Select Obra */}
        {step === 1 && (
          <div>
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Seleccionar Obra</h2>

            {/* Search */}
            <div className="mb-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="text"
                  placeholder="Buscar obra por código o nombre..."
                  value={obraSearch}
                  onChange={(e) => setObraSearch(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>

            {/* Obras List */}
            {loadingObras ? (
              <div className="text-center py-8">
                <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                <p className="text-gray-600 mt-4">Cargando obras...</p>
              </div>
            ) : filteredObras.length === 0 ? (
              <div className="text-center py-8">
                <Building2 className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600">No se encontraron obras en proceso</p>
              </div>
            ) : (
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {filteredObras.map((obra) => (
                  <button
                    key={obra.id}
                    onClick={() => handleSelectObra(obra)}
                    className={`w-full text-left p-4 border rounded-lg transition-colors ${
                      selectedObra?.id === obra.id
                        ? 'border-blue-600 bg-blue-50'
                        : 'border-gray-200 hover:border-blue-300 hover:bg-gray-50'
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="font-semibold text-gray-900">
                          {obra.codigo} - {obra.nombre}
                        </div>
                        {obra.cliente && (
                          <div className="text-sm text-gray-600 mt-1">
                            {obra.cliente.nombreComercial || obra.cliente.razonSocial}
                          </div>
                        )}
                        <div className="text-sm text-gray-500 mt-1">
                          Contrato: {formatCurrency(obra.montoContrato)}
                        </div>
                      </div>
                      {selectedObra?.id === obra.id && (
                        <Check className="w-6 h-6 text-blue-600" />
                      )}
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Step 2: Basic Information */}
        {step === 2 && (
          <div>
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Información Básica</h2>

            {/* Selected Obra Info */}
            {selectedObra && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
                <div className="flex items-start gap-3">
                  <Building2 className="w-5 h-5 text-blue-600 mt-0.5" />
                  <div>
                    <p className="font-medium text-gray-900">
                      {selectedObra.codigo} - {selectedObra.nombre}
                    </p>
                    <p className="text-sm text-gray-600">
                      Anticipo: {formatNumber(selectedObra.anticipoPct)}% • Retención:{' '}
                      {formatNumber(selectedObra.retencionPct)}%
                    </p>
                  </div>
                </div>
              </div>
            )}

            <div className="space-y-4">
              {/* Numero */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Número de Estimación *
                </label>
                <input
                  type="number"
                  value={numero}
                  onChange={(e) => setNumero(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="1"
                  min="1"
                />
              </div>

              {/* Periodo */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Período *
                </label>
                <input
                  type="text"
                  value={periodo}
                  onChange={(e) => setPeriodo(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Enero 2025"
                />
              </div>

              {/* Fecha Corte */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Fecha de Corte *
                </label>
                <input
                  type="date"
                  value={fechaCorte}
                  onChange={(e) => setFechaCorte(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              {/* Presupuesto Selection */}
              {presupuestos.length > 0 && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Presupuesto *
                  </label>
                  <select
                    value={selectedPresupuesto?.id || ''}
                    onChange={(e) => {
                      const pres = presupuestos.find(p => p.id === e.target.value)
                      setSelectedPresupuesto(pres || null)
                    }}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="">Selecciona un presupuesto</option>
                    {presupuestos.map((pres) => (
                      <option key={pres.id} value={pres.id}>
                        {pres.nombre} (v{pres.version}) {pres.esVigente && '- VIGENTE'} -{' '}
                        {pres.totalConceptos} conceptos - {formatCurrency(pres.importeTotal)}
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Step 3: Add Conceptos */}
        {step === 3 && (
          <div>
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Agregar Conceptos</h2>

            {/* Totals Summary */}
            <div className="grid grid-cols-4 gap-4 mb-6">
              <div className="bg-blue-50 rounded-lg p-3">
                <p className="text-xs text-gray-600 mb-1">Bruto</p>
                <p className="text-lg font-bold text-gray-900">{formatCurrency(importeBruto)}</p>
              </div>
              <div className="bg-orange-50 rounded-lg p-3">
                <p className="text-xs text-gray-600 mb-1">Amortización</p>
                <p className="text-lg font-bold text-orange-600">{formatCurrency(amortizacion)}</p>
              </div>
              <div className="bg-red-50 rounded-lg p-3">
                <p className="text-xs text-gray-600 mb-1">Retención</p>
                <p className="text-lg font-bold text-red-600">{formatCurrency(retencion)}</p>
              </div>
              <div className="bg-green-50 rounded-lg p-3 border-2 border-green-200">
                <p className="text-xs text-gray-600 mb-1">Neto</p>
                <p className="text-lg font-bold text-green-600">{formatCurrency(importeNeto)}</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-6">
              {/* Available Conceptos */}
              <div>
                <h3 className="text-sm font-semibold text-gray-900 mb-3">
                  Conceptos Disponibles ({filteredConceptos.length})
                </h3>

                {/* Search */}
                <div className="mb-3">
                  <input
                    type="text"
                    placeholder="Buscar..."
                    value={searchConcepto}
                    onChange={(e) => setSearchConcepto(e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div className="border border-gray-200 rounded-lg max-h-96 overflow-y-auto">
                  {loading ? (
                    <div className="text-center py-8">
                      <div className="inline-block animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
                    </div>
                  ) : filteredConceptos.length === 0 ? (
                    <div className="text-center py-8 text-gray-500 text-sm">
                      No hay conceptos disponibles
                    </div>
                  ) : (
                    <div className="divide-y divide-gray-200">
                      {filteredConceptos.map((concepto) => (
                        <div
                          key={concepto.id}
                          className="p-3 hover:bg-gray-50 flex items-start justify-between gap-2"
                        >
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-gray-900 truncate">
                              {concepto.clave}
                            </p>
                            <p className="text-xs text-gray-600 line-clamp-2">
                              {concepto.descripcion}
                            </p>
                            <p className="text-xs text-gray-500 mt-1">
                              {formatNumber(concepto.cantidad, 4)} {concepto.unidad?.abreviatura} × {formatCurrency(concepto.precioUnitario)}
                            </p>
                          </div>
                          <button
                            onClick={() => addConcepto(concepto)}
                            disabled={conceptosEstimacion.some(c => c.conceptoPresupuestoId === concepto.id)}
                            className="flex-shrink-0 p-1 text-blue-600 hover:bg-blue-100 rounded disabled:opacity-30 disabled:cursor-not-allowed"
                            title="Agregar concepto"
                          >
                            <Plus className="w-4 h-4" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Selected Conceptos */}
              <div>
                <h3 className="text-sm font-semibold text-gray-900 mb-3">
                  Conceptos Agregados ({conceptosEstimacion.length})
                </h3>

                <div className="border border-gray-200 rounded-lg max-h-96 overflow-y-auto">
                  {conceptosEstimacion.length === 0 ? (
                    <div className="text-center py-8 text-gray-500 text-sm">
                      Agrega conceptos desde la lista de la izquierda
                    </div>
                  ) : (
                    <div className="divide-y divide-gray-200">
                      {conceptosEstimacion.map((concepto) => (
                        <div key={concepto.conceptoPresupuestoId} className="p-3">
                          <div className="flex items-start justify-between gap-2 mb-2">
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium text-gray-900">{concepto.clave}</p>
                              <p className="text-xs text-gray-600 truncate">{concepto.descripcion}</p>
                            </div>
                            <button
                              onClick={() => removeConcepto(concepto.conceptoPresupuestoId)}
                              className="flex-shrink-0 p-1 text-red-600 hover:bg-red-100 rounded"
                              title="Eliminar concepto"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>

                          <div className="grid grid-cols-2 gap-2">
                            <div>
                              <label className="text-xs text-gray-600">Cant. Ejecutada</label>
                              <input
                                type="number"
                                value={concepto.cantidadEjecutada}
                                onChange={(e) =>
                                  updateConcepto(
                                    concepto.conceptoPresupuestoId,
                                    'cantidadEjecutada',
                                    parseFloat(e.target.value) || 0
                                  )
                                }
                                step="0.0001"
                                min="0"
                                className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-blue-500"
                              />
                            </div>
                            <div>
                              <label className="text-xs text-gray-600">Cant. Acumulada</label>
                              <input
                                type="number"
                                value={concepto.cantidadAcumulada}
                                onChange={(e) =>
                                  updateConcepto(
                                    concepto.conceptoPresupuestoId,
                                    'cantidadAcumulada',
                                    parseFloat(e.target.value) || 0
                                  )
                                }
                                step="0.0001"
                                min="0"
                                className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-blue-500"
                              />
                            </div>
                          </div>

                          <div className="mt-2 text-right">
                            <span className="text-xs text-gray-600">Importe: </span>
                            <span className="text-sm font-semibold text-green-600">
                              {formatCurrency(concepto.importe)}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Navigation Buttons */}
        <div className="flex justify-between mt-8 pt-6 border-t border-gray-200">
          <button
            onClick={handlePrevStep}
            disabled={step === 1}
            className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <ArrowLeft className="w-4 h-4" />
            Anterior
          </button>

          {step < 3 ? (
            <button
              onClick={handleNextStep}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Siguiente
              <ArrowRight className="w-4 h-4" />
            </button>
          ) : (
            <button
              onClick={handleSubmit}
              disabled={submitting || conceptosEstimacion.length === 0}
              className="flex items-center gap-2 px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {submitting ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  Creando...
                </>
              ) : (
                <>
                  <Check className="w-4 h-4" />
                  Crear Estimación
                </>
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
