import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'

export function generarReporteEjecutivoPDF(data: any) {
    const doc = new jsPDF()
    const pageWidth = doc.internal.pageSize.width
    let yPos = 20
    const today = new Date().toLocaleDateString('es-MX', { dateStyle: 'long' })

    // Encabezado
    doc.setFontSize(18)
    doc.setFont('helvetica', 'bold')
    doc.text('Reporte Ejecutivo Mensual', pageWidth / 2, yPos, { align: 'center' })

    yPos += 7
    doc.setFontSize(10)
    doc.setFont('helvetica', 'normal')
    doc.text(`Generado el: ${today}`, pageWidth / 2, yPos, { align: 'center' })

    yPos += 15

    // 1. Resumen Financiero (Mes Actual)
    doc.setFontSize(14)
    doc.setFont('helvetica', 'bold')
    doc.text('Resumen Financiero (Mes Actual)', 14, yPos)
    yPos += 8

    if (data.resumenMes) {
        const { ingresos, egresos, utilidad } = data.resumenMes
        autoTable(doc, {
            startY: yPos,
            head: [['Concepto', 'Monto']],
            body: [
                ['Ingresos Totales', `$${ingresos.toLocaleString('es-MX')}`],
                ['Egresos Totales', `$${egresos.toLocaleString('es-MX')}`],
                ['Utilidad Neta', `$${utilidad.toLocaleString('es-MX')}`],
            ],
            theme: 'grid',
            headStyles: { fillColor: [22, 163, 74] } // Green
        })
        yPos = (doc as any).lastAutoTable.finalY + 15
    }

    // 2. Histórico (Tabla Simple)
    doc.text('Histórico de Flujo de Efectivo (6 Meses)', 14, yPos)
    yPos += 5

    // Transformar datos para tabla
    const historyBody = data.financialHistory.map((h: any) => [
        h.mes,
        `$${h.ingresos.toLocaleString('es-MX')}`,
        `$${h.egresos.toLocaleString('es-MX')}`,
        `$${h.utilidad.toLocaleString('es-MX')}`
    ])

    autoTable(doc, {
        startY: yPos,
        head: [['Mes', 'Ingresos', 'Egresos', 'Utilidad']],
        body: historyBody,
        theme: 'striped'
    })
    yPos = (doc as any).lastAutoTable.finalY + 15

    // 3. Alertas de Inventario
    doc.setFontSize(14)
    doc.text('Alertas de Stock Bajo', 14, yPos)
    yPos += 5

    if (data.alertasInventario.length > 0) {
        const alertasBody = data.alertasInventario.map((p: any) => [
            p.codigo,
            p.nombre,
            p.stockActual,
            p.stockMinimo
        ])

        autoTable(doc, {
            startY: yPos,
            head: [['Código', 'Producto', 'Stock Actual', 'Mínimo']],
            body: alertasBody,
            theme: 'grid',
            headStyles: { fillColor: [220, 38, 38] } // Red
        })
    } else {
        doc.setFontSize(10)
        doc.setFont('helvetica', 'italic')
        doc.text('No hay alertas de stock bajo.', 14, yPos + 10)
        yPos += 10
    }

    yPos = (doc as any).lastAutoTable ? (doc as any).lastAutoTable.finalY + 15 : yPos + 15

    // 4. Obras Activas
    doc.setFontSize(14)
    doc.setFont('helvetica', 'bold')
    doc.text('Obras en Proceso Recientes', 14, yPos)
    yPos += 5

    if (data.obrasActivas.length > 0) {
        const obrasBody = data.obrasActivas.map((o: any) => [
            o.nombre,
            o.cliente?.nombreComercial || 'N/A',
            o.fechaFinProgramada ? new Date(o.fechaFinProgramada).toLocaleDateString() : 'Pendiente'
        ])

        autoTable(doc, {
            startY: yPos,
            head: [['Obra', 'Cliente', 'Fecha Entrega']],
            body: obrasBody,
            theme: 'striped',
            headStyles: { fillColor: [37, 99, 235] } // Blue
        })
    } else {
        doc.setFontSize(10)
        doc.setFont('helvetica', 'italic')
        doc.text('No hay obras activas recientes.', 14, yPos + 10)
    }

    doc.save(`Reporte_Ejecutivo_${today.replace(/ /g, '_')}.pdf`)
}
