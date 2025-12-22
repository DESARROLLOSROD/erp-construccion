import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { createServerClient } from '@/lib/supabase'
import { generarAvancePDF } from '@/lib/pdf-generator'

// GET /api/presupuestos/[id]/avance/pdf - Generar PDF del avance
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = createServerClient()
    const { data: { session } } = await supabase.auth.getSession()

    if (!session) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const usuario = await prisma.usuario.findUnique({
      where: { authId: session.user.id },
      include: { empresas: true }
    })

    if (!usuario || usuario.empresas.length === 0) {
      return NextResponse.json({ error: 'Usuario sin empresa' }, { status: 403 })
    }

    const empresaId = usuario.empresas[0].empresaId

    // Obtener empresa
    const empresa = await prisma.empresa.findUnique({
      where: { id: empresaId }
    })

    if (!empresa) {
      return NextResponse.json({ error: 'Empresa no encontrada' }, { status: 404 })
    }

    // Obtener presupuesto y avance
    const presupuesto = await prisma.presupuesto.findFirst({
      where: {
        id: params.id,
        obra: { empresaId }
      },
      include: {
        obra: {
          select: {
            codigo: true,
            nombre: true,
          }
        },
        conceptos: {
          include: {
            unidad: {
              select: {
                abreviatura: true
              }
            }
          },
          orderBy: { clave: 'asc' }
        }
      }
    })

    if (!presupuesto) {
      return NextResponse.json({ error: 'Presupuesto no encontrado' }, { status: 404 })
    }

    // Calcular avance (mismo cálculo que en GET /api/presupuestos/[id]/avance)
    const conceptos = presupuesto.conceptos.map(concepto => {
      const cantidadPresupuesto = Number(concepto.cantidad)
      const precioUnitario = Number(concepto.precioUnitario)
      const importePresupuesto = Number(concepto.importe)

      const cantidadEjecutada = 0 // TODO: obtener de BD
      const importeEjecutado = cantidadEjecutada * precioUnitario

      const cantidadPendiente = cantidadPresupuesto - cantidadEjecutada
      const importePendiente = importePresupuesto - importeEjecutado
      const porcentajeAvance = cantidadPresupuesto > 0
        ? (cantidadEjecutada / cantidadPresupuesto) * 100
        : 0

      return {
        conceptoPresupuestoId: concepto.id,
        clave: concepto.clave,
        descripcion: concepto.descripcion,
        unidad: concepto.unidad?.abreviatura || null,
        cantidadPresupuesto,
        precioUnitario,
        importePresupuesto,
        cantidadEjecutada,
        importeEjecutado,
        cantidadPendiente,
        importePendiente,
        porcentajeAvance
      }
    })

    const importePresupuesto = conceptos.reduce((sum, c) => sum + c.importePresupuesto, 0)
    const importeEjecutado = conceptos.reduce((sum, c) => sum + c.importeEjecutado, 0)
    const importePendiente = importePresupuesto - importeEjecutado
    const porcentajeAvanceGeneral = importePresupuesto > 0
      ? (importeEjecutado / importePresupuesto) * 100
      : 0

    const avance = {
      conceptos,
      totales: {
        importePresupuesto,
        importeEjecutado,
        importePendiente,
        porcentajeAvanceGeneral
      }
    }

    // Generar PDF
    const pdf = generarAvancePDF(
      avance,
      {
        nombre: empresa.nombre,
        rfc: empresa.rfc,
        razonSocial: empresa.razonSocial,
      },
      {
        codigo: presupuesto.obra.codigo,
        nombre: presupuesto.obra.nombre,
      },
      {
        nombre: presupuesto.nombre,
        version: presupuesto.version
      }
    )

    const pdfBuffer = Buffer.from(pdf.output('arraybuffer'))
    const filename = `Avance_${presupuesto.obra.codigo}_v${presupuesto.version}.pdf`

    return new NextResponse(pdfBuffer, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${filename}"`,
      },
    })
  } catch (error) {
    console.error('Error al generar PDF de avance:', error)
    return NextResponse.json(
      { error: 'Error al generar PDF del avance' },
      { status: 500 }
    )
  }
}
