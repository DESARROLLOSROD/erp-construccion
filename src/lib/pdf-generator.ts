import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'
import { PresupuestoConTotales } from '@/types/presupuesto'

interface EmpresaInfo {
  nombre: string
  rfc: string
  razonSocial: string
  direccion?: string
  telefono?: string
  email?: string
}

interface ObraInfo {
  codigo: string
  nombre: string
  ubicacion?: string
}

export function generarPresupuestoPDF(
  presupuesto: PresupuestoConTotales,
  empresa: EmpresaInfo,
  obra: ObraInfo
) {
  const doc = new jsPDF()
  const pageWidth = doc.internal.pageSize.width
  let yPos = 20

  // Configurar fuente
  doc.setFont('helvetica')

  // ========== ENCABEZADO ==========
  doc.setFontSize(18)
  doc.setFont('helvetica', 'bold')
  doc.text(empresa.nombre, pageWidth / 2, yPos, { align: 'center' })

  yPos += 7
  doc.setFontSize(10)
  doc.setFont('helvetica', 'normal')
  doc.text(empresa.razonSocial, pageWidth / 2, yPos, { align: 'center' })

  yPos += 5
  doc.setFontSize(9)
  doc.text(`RFC: ${empresa.rfc}`, pageWidth / 2, yPos, { align: 'center' })

  if (empresa.direccion) {
    yPos += 5
    doc.text(empresa.direccion, pageWidth / 2, yPos, { align: 'center' })
  }

  if (empresa.telefono || empresa.email) {
    yPos += 5
    const contacto = [empresa.telefono, empresa.email].filter(Boolean).join(' | ')
    doc.text(contacto, pageWidth / 2, yPos, { align: 'center' })
  }

  yPos += 10
  doc.setLineWidth(0.5)
  doc.line(15, yPos, pageWidth - 15, yPos)

  // ========== TÍTULO DEL DOCUMENTO ==========
  yPos += 10
  doc.setFontSize(16)
  doc.setFont('helvetica', 'bold')
  doc.text('PRESUPUESTO DE OBRA', pageWidth / 2, yPos, { align: 'center' })

  // ========== INFORMACIÓN DEL PRESUPUESTO ==========
  yPos += 10
  doc.setFontSize(10)
  doc.setFont('helvetica', 'normal')

  const infoPresupuesto = [
    ['Obra:', obra.codigo],
    ['Nombre:', obra.nombre],
    ['Ubicación:', obra.ubicacion || 'No especificada'],
    ['Presupuesto:', presupuesto.nombre],
    ['Versión:', `v${presupuesto.version}`],
    ['Estado:', presupuesto.esVigente ? 'VIGENTE' : 'No vigente'],
    ['Fecha:', new Date().toLocaleDateString('es-MX', { dateStyle: 'long' })],
  ]

  doc.setFont('helvetica', 'bold')
  infoPresupuesto.forEach(([label, value]) => {
    doc.text(label, 15, yPos)
    doc.setFont('helvetica', 'normal')
    doc.text(value, 50, yPos)
    doc.setFont('helvetica', 'bold')
    yPos += 6
  })

  yPos += 5

  // ========== TABLA DE CONCEPTOS ==========
  const tableData = presupuesto.conceptos?.map(concepto => [
    concepto.clave,
    concepto.descripcion,
    concepto.unidad?.abreviatura || '-',
    concepto.cantidad.toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
    concepto.precioUnitario.toLocaleString('es-MX', { style: 'currency', currency: 'MXN' }),
    concepto.importe.toLocaleString('es-MX', { style: 'currency', currency: 'MXN' }),
  ]) || []

  autoTable(doc, {
    startY: yPos,
    head: [['Clave', 'Descripción', 'Unidad', 'Cantidad', 'P.U.', 'Importe']],
    body: tableData,
    theme: 'striped',
    headStyles: {
      fillColor: [71, 85, 105], // slate-600
      textColor: 255,
      fontStyle: 'bold',
      fontSize: 9,
    },
    bodyStyles: {
      fontSize: 8,
    },
    columnStyles: {
      0: { cellWidth: 20, halign: 'center' }, // Clave
      1: { cellWidth: 'auto' }, // Descripción
      2: { cellWidth: 15, halign: 'center' }, // Unidad
      3: { cellWidth: 25, halign: 'right' }, // Cantidad
      4: { cellWidth: 30, halign: 'right' }, // P.U.
      5: { cellWidth: 35, halign: 'right' }, // Importe
    },
    foot: [[
      { content: 'TOTAL PRESUPUESTO', colSpan: 5, styles: { halign: 'right', fontStyle: 'bold' } },
      {
        content: presupuesto.importeTotal.toLocaleString('es-MX', { style: 'currency', currency: 'MXN' }),
        styles: { halign: 'right', fontStyle: 'bold', fillColor: [71, 85, 105], textColor: 255 }
      }
    ]],
    footStyles: {
      fontSize: 10,
      fillColor: [241, 245, 249], // slate-100
      textColor: [15, 23, 42], // slate-900
    },
    didDrawPage: (data) => {
      // Pie de página
      const pageCount = (doc as any).internal.getNumberOfPages()
      const currentPage = (doc as any).internal.getCurrentPageInfo().pageNumber

      doc.setFontSize(8)
      doc.setFont('helvetica', 'normal')
      doc.setTextColor(100)
      doc.text(
        `Página ${currentPage} de ${pageCount}`,
        pageWidth / 2,
        doc.internal.pageSize.height - 10,
        { align: 'center' }
      )

      doc.text(
        `Generado el ${new Date().toLocaleString('es-MX')}`,
        15,
        doc.internal.pageSize.height - 10
      )
    }
  })

  // ========== NOTAS FINALES ==========
  const finalY = (doc as any).lastAutoTable.finalY || yPos + 50

  if (presupuesto.descripcion) {
    doc.setFontSize(9)
    doc.setFont('helvetica', 'bold')
    doc.text('Observaciones:', 15, finalY + 10)
    doc.setFont('helvetica', 'normal')

    const observaciones = doc.splitTextToSize(presupuesto.descripcion, pageWidth - 30)
    doc.text(observaciones, 15, finalY + 16)
  }

  return doc
}

export function generarAvancePDF(
  avance: any,
  empresa: EmpresaInfo,
  obra: ObraInfo,
  presupuesto: { nombre: string; version: number }
) {
  const doc = new jsPDF()
  const pageWidth = doc.internal.pageSize.width
  let yPos = 20

  // Encabezado similar
  doc.setFontSize(18)
  doc.setFont('helvetica', 'bold')
  doc.text(empresa.nombre, pageWidth / 2, yPos, { align: 'center' })

  yPos += 7
  doc.setFontSize(10)
  doc.setFont('helvetica', 'normal')
  doc.text(empresa.razonSocial, pageWidth / 2, yPos, { align: 'center' })

  yPos += 5
  doc.setFontSize(9)
  doc.text(`RFC: ${empresa.rfc}`, pageWidth / 2, yPos, { align: 'center' })

  yPos += 10
  doc.setLineWidth(0.5)
  doc.line(15, yPos, pageWidth - 15, yPos)

  // Título
  yPos += 10
  doc.setFontSize(16)
  doc.setFont('helvetica', 'bold')
  doc.text('AVANCE DE OBRA', pageWidth / 2, yPos, { align: 'center' })

  // Información
  yPos += 10
  doc.setFontSize(10)
  doc.setFont('helvetica', 'normal')

  const info = [
    ['Obra:', obra.codigo],
    ['Nombre:', obra.nombre],
    ['Presupuesto:', `${presupuesto.nombre} (v${presupuesto.version})`],
    ['Fecha de Corte:', new Date().toLocaleDateString('es-MX', { dateStyle: 'long' })],
  ]

  doc.setFont('helvetica', 'bold')
  info.forEach(([label, value]) => {
    doc.text(label, 15, yPos)
    doc.setFont('helvetica', 'normal')
    doc.text(value, 50, yPos)
    doc.setFont('helvetica', 'bold')
    yPos += 6
  })

  yPos += 5

  // Tabla de avance
  const tableData = avance.conceptos.map((concepto: any) => [
    concepto.clave,
    concepto.descripcion,
    concepto.unidad || '-',
    concepto.cantidadPresupuesto.toLocaleString('es-MX', { minimumFractionDigits: 2 }),
    concepto.cantidadEjecutada.toLocaleString('es-MX', { minimumFractionDigits: 2 }),
    concepto.cantidadPendiente.toLocaleString('es-MX', { minimumFractionDigits: 2 }),
    `${concepto.porcentajeAvance.toFixed(1)}%`,
    concepto.importeEjecutado.toLocaleString('es-MX', { style: 'currency', currency: 'MXN' }),
  ])

  autoTable(doc, {
    startY: yPos,
    head: [['Clave', 'Descripción', 'Unid', 'Presup.', 'Ejecut.', 'Pend.', '%', 'Importe Ejec.']],
    body: tableData,
    theme: 'striped',
    headStyles: {
      fillColor: [71, 85, 105],
      textColor: 255,
      fontStyle: 'bold',
      fontSize: 8,
    },
    bodyStyles: {
      fontSize: 7,
    },
    columnStyles: {
      0: { cellWidth: 18, halign: 'center' },
      1: { cellWidth: 'auto' },
      2: { cellWidth: 12, halign: 'center' },
      3: { cellWidth: 22, halign: 'right' },
      4: { cellWidth: 22, halign: 'right' },
      5: { cellWidth: 22, halign: 'right' },
      6: { cellWidth: 15, halign: 'center' },
      7: { cellWidth: 30, halign: 'right' },
    },
    foot: [[
      { content: `TOTAL - Avance: ${avance.totales.porcentajeAvanceGeneral.toFixed(1)}%`, colSpan: 7, styles: { halign: 'right', fontStyle: 'bold' } },
      {
        content: avance.totales.importeEjecutado.toLocaleString('es-MX', { style: 'currency', currency: 'MXN' }),
        styles: { halign: 'right', fontStyle: 'bold', fillColor: [71, 85, 105], textColor: 255 }
      }
    ]],
    didDrawPage: (data) => {
      const pageCount = (doc as any).internal.getNumberOfPages()
      const currentPage = (doc as any).internal.getCurrentPageInfo().pageNumber

      doc.setFontSize(8)
      doc.setTextColor(100)
      doc.text(
        `Página ${currentPage} de ${pageCount}`,
        pageWidth / 2,
        doc.internal.pageSize.height - 10,
        { align: 'center' }
      )
    }
  })

  return doc
}
