import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'

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
    cliente?: string
}

interface ConceptoEstimacion {
    clave: string
    descripcion: string
    unidad: string
    cantidadEjecutada: number
    cantidadAcumulada: number
    precioUnitario: number
    importe: number
}

interface EstimacionData {
    numero: number
    periodo: string
    fechaCorte: Date | string
    importeBruto: number
    amortizacion: number
    retencion: number
    importeNeto: number
    conceptos: ConceptoEstimacion[]
}

export function generarEstimacionPDF(
    estimacion: EstimacionData,
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

    yPos += 10
    doc.setLineWidth(0.5)
    doc.line(15, yPos, pageWidth - 15, yPos)

    // ========== TÍTULO DEL DOCUMENTO ==========
    yPos += 10
    doc.setFontSize(16)
    doc.setFont('helvetica', 'bold')
    doc.text(`ESTIMACIÓN DE OBRA No. ${estimacion.numero}`, pageWidth / 2, yPos, { align: 'center' })

    // ========== INFORMACIÓN GENERAL ==========
    yPos += 10
    doc.setFontSize(10)
    doc.setFont('helvetica', 'normal')

    const leftColumnX = 15
    const rightColumnX = pageWidth / 2 + 10

    // Columna Izquierda (Obra)
    doc.setFont('helvetica', 'bold')
    doc.text('Datos de la Obra:', leftColumnX, yPos)
    yPos += 5

    doc.setFontSize(9)
    doc.setFont('helvetica', 'bold')
    doc.text('Obra:', leftColumnX, yPos)
    doc.setFont('helvetica', 'normal')
    doc.text(obra.codigo, leftColumnX + 15, yPos)

    yPos += 5
    doc.setFont('helvetica', 'bold')
    doc.text('Nombre:', leftColumnX, yPos)
    doc.setFont('helvetica', 'normal')
    // Multiline support for long names
    const obraNombre = doc.splitTextToSize(obra.nombre, (pageWidth / 2) - 30)
    doc.text(obraNombre, leftColumnX + 15, yPos)
    yPos += (obraNombre.length * 4) + 1

    if (obra.cliente) {
        doc.setFont('helvetica', 'bold')
        doc.text('Cliente:', leftColumnX, yPos)
        doc.setFont('helvetica', 'normal')
        const clienteNombre = doc.splitTextToSize(obra.cliente, (pageWidth / 2) - 30)
        doc.text(clienteNombre, leftColumnX + 15, yPos)
    }

    // Reset Y for Right Column
    let rightYPos = yPos - ((obraNombre.length * 4) + 1) - 5 // Back to 'Datos de la Obra' line roughly
    if (rightYPos < 40) rightYPos = 50 // Fallback safety

    // Columna Derecha (Estimación)
    // We'll just put it below for safer layout to avoid overlapping if names are too long, 
    // or use a grid. Let's stack them for simplicity and robustness.

    yPos += 10
    doc.setFontSize(10)
    doc.setFont('helvetica', 'bold')
    doc.text('Datos de la Estimación:', leftColumnX, yPos)
    yPos += 5

    const infoEstimacion = [
        ['Período:', estimacion.periodo],
        ['Fecha de Corte:', new Date(estimacion.fechaCorte).toLocaleDateString('es-MX', { dateStyle: 'long' })],
    ]

    doc.setFontSize(9)
    infoEstimacion.forEach(([label, value]) => {
        doc.setFont('helvetica', 'bold')
        doc.text(label, leftColumnX, yPos)
        doc.setFont('helvetica', 'normal')
        doc.text(String(value), leftColumnX + 30, yPos)
        yPos += 5
    })

    yPos += 5

    // ========== TABLA DE CONCEPTOS ==========
    const tableData = estimacion.conceptos.map(concepto => [
        concepto.clave,
        concepto.descripcion,
        concepto.unidad,
        concepto.cantidadEjecutada.toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 4 }),
        concepto.cantidadAcumulada.toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 4 }),
        concepto.precioUnitario.toLocaleString('es-MX', { style: 'currency', currency: 'MXN' }),
        concepto.importe.toLocaleString('es-MX', { style: 'currency', currency: 'MXN' }),
    ])

    autoTable(doc, {
        startY: yPos,
        head: [['Clave', 'Descripción', 'Unid.', 'Cant. Elec.', 'Cant. Acum.', 'P.U.', 'Importe']],
        body: tableData,
        theme: 'striped',
        headStyles: {
            fillColor: [37, 99, 235], // blue-600
            textColor: 255,
            fontStyle: 'bold',
            fontSize: 8,
            halign: 'center'
        },
        bodyStyles: {
            fontSize: 7,
        },
        columnStyles: {
            0: { cellWidth: 15, halign: 'center' }, // Clave
            1: { cellWidth: 'auto' }, // Descripción
            2: { cellWidth: 12, halign: 'center' }, // Unidad
            3: { cellWidth: 20, halign: 'right' }, // Cant. Ejec
            4: { cellWidth: 20, halign: 'right' }, // Cant. Acum
            5: { cellWidth: 22, halign: 'right' }, // P.U.
            6: { cellWidth: 25, halign: 'right' }, // Importe
        },
        didDrawPage: (data) => {
            // Footer con paginación
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

    // ========== RESUMEN FINANCIERO ==========
    const finalY = (doc as any).lastAutoTable.finalY || yPos + 50

    // Usar un cuadro para el resumen en la derecha
    const summaryWidth = 80
    const summaryX = pageWidth - summaryWidth - 15
    let summaryY = finalY + 10

    // Check if we need a new page
    if (summaryY + 40 > doc.internal.pageSize.height) {
        doc.addPage()
        summaryY = 20
    }

    doc.setFontSize(10)

    // Importe Bruto
    doc.setFont('helvetica', 'normal')
    doc.text('Importe Estimado:', summaryX, summaryY)
    doc.setFont('helvetica', 'bold')
    doc.text(estimacion.importeBruto.toLocaleString('es-MX', { style: 'currency', currency: 'MXN' }), pageWidth - 15, summaryY, { align: 'right' })

    summaryY += 7
    // Amortización
    doc.setFont('helvetica', 'normal')
    doc.setTextColor(234, 88, 12) // Orange-like for PDF? Just keep black or grey
    doc.setTextColor(0)
    doc.text('(-) Amortización Anticipo:', summaryX, summaryY)
    doc.text(estimacion.amortizacion.toLocaleString('es-MX', { style: 'currency', currency: 'MXN' }), pageWidth - 15, summaryY, { align: 'right' })

    summaryY += 7
    // Retención
    doc.text('(-) Retención Garantía:', summaryX, summaryY)
    doc.text(estimacion.retencion.toLocaleString('es-MX', { style: 'currency', currency: 'MXN' }), pageWidth - 15, summaryY, { align: 'right' })

    summaryY += 2
    doc.setLineWidth(0.5)
    doc.line(summaryX, summaryY + 2, pageWidth - 15, summaryY + 2)
    summaryY += 8

    // Neto
    doc.setFontSize(12)
    doc.setFont('helvetica', 'bold')
    doc.text('TOTAL A PAGAR:', summaryX, summaryY)
    doc.text(estimacion.importeNeto.toLocaleString('es-MX', { style: 'currency', currency: 'MXN' }), pageWidth - 15, summaryY, { align: 'right' })

    // ========== FIRMAS ==========
    let signY = summaryY + 40
    // Check page break
    if (signY + 30 > doc.internal.pageSize.height) {
        doc.addPage()
        signY = 40
    }

    const signWidth = 60
    const gap = (pageWidth - (signWidth * 2) - 30) / 2 // Center two signatures

    doc.setLineWidth(0.5)
    doc.line(15 + gap, signY, 15 + gap + signWidth, signY) // Firma 1
    doc.line(pageWidth - 15 - gap - signWidth, signY, pageWidth - 15 - gap, signY) // Firma 2

    doc.setFontSize(9)
    doc.setFont('helvetica', 'normal')
    doc.text('ELABORÓ', 15 + gap + (signWidth / 2), signY + 5, { align: 'center' })
    doc.text('AUTORIZÓ', pageWidth - 15 - gap - (signWidth / 2), signY + 5, { align: 'center' })

    return doc
}
