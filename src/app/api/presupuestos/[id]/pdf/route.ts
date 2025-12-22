import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { createServerClient } from '@/lib/supabase'
import { generarPresupuestoPDF } from '@/lib/pdf-generator'

// GET /api/presupuestos/[id]/pdf - Generar PDF del presupuesto
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

    // Obtener contexto de empresa
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

    // Obtener presupuesto completo
    const presupuesto = await prisma.presupuesto.findFirst({
      where: {
        id: params.id,
        obra: { empresaId }
      },
      include: {
        obra: {
          select: {
            id: true,
            codigo: true,
            nombre: true,
            ubicacion: true,
          }
        },
        conceptos: {
          include: {
            unidad: {
              select: {
                id: true,
                nombre: true,
                abreviatura: true,
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

    // Convertir Decimals a Numbers
    const conceptosConverted = presupuesto.conceptos.map(c => ({
      ...c,
      cantidad: Number(c.cantidad),
      precioUnitario: Number(c.precioUnitario),
      importe: Number(c.importe),
    }))

    const importeTotal = conceptosConverted.reduce((sum, c) => sum + c.importe, 0)

    const presupuestoData = {
      ...presupuesto,
      conceptos: conceptosConverted,
      importeTotal,
      totalConceptos: conceptosConverted.length
    }

    // Generar PDF
    const pdf = generarPresupuestoPDF(
      presupuestoData,
      {
        nombre: empresa.nombre,
        rfc: empresa.rfc,
        razonSocial: empresa.razonSocial,
        direccion: empresa.direccion || undefined,
        telefono: empresa.telefono || undefined,
        email: empresa.email || undefined,
      },
      {
        codigo: presupuesto.obra.codigo,
        nombre: presupuesto.obra.nombre,
        ubicacion: presupuesto.obra.ubicacion || undefined,
      }
    )

    // Convertir a buffer
    const pdfBuffer = Buffer.from(pdf.output('arraybuffer'))

    // Crear nombre de archivo
    const filename = `Presupuesto_${presupuesto.obra.codigo}_v${presupuesto.version}.pdf`

    // Retornar PDF
    return new NextResponse(pdfBuffer, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${filename}"`,
      },
    })
  } catch (error) {
    console.error('Error al generar PDF:', error)
    return NextResponse.json(
      { error: 'Error al generar PDF del presupuesto' },
      { status: 500 }
    )
  }
}
