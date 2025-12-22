import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { createServerClient } from '@/lib/supabase'
import { AvanceConcepto, ResumenAvance } from '@/types/avance'

// GET /api/presupuestos/[id]/avance - Obtener avance del presupuesto
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

    // Verificar que el presupuesto existe y pertenece a la empresa
    const presupuesto = await prisma.presupuesto.findFirst({
      where: {
        id: params.id,
        obra: { empresaId }
      },
      include: {
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

    // Por ahora, la cantidad ejecutada se simula como 0
    // En una implementación completa, esto vendría de un modelo ConceptoEjecutado o similar
    const conceptos: AvanceConcepto[] = presupuesto.conceptos.map(concepto => {
      const cantidadPresupuesto = Number(concepto.cantidad)
      const precioUnitario = Number(concepto.precioUnitario)
      const importePresupuesto = Number(concepto.importe)

      // TODO: Obtener cantidad ejecutada real de la base de datos
      const cantidadEjecutada = 0
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

    // Calcular totales
    const importePresupuesto = conceptos.reduce((sum, c) => sum + c.importePresupuesto, 0)
    const importeEjecutado = conceptos.reduce((sum, c) => sum + c.importeEjecutado, 0)
    const importePendiente = importePresupuesto - importeEjecutado
    const porcentajeAvanceGeneral = importePresupuesto > 0
      ? (importeEjecutado / importePresupuesto) * 100
      : 0

    const resumen: ResumenAvance = {
      presupuestoId: presupuesto.id,
      presupuestoNombre: presupuesto.nombre,
      presupuestoVersion: presupuesto.version,
      conceptos,
      totales: {
        importePresupuesto,
        importeEjecutado,
        importePendiente,
        porcentajeAvanceGeneral
      }
    }

    return NextResponse.json(resumen)
  } catch (error) {
    console.error('Error al obtener avance:', error)
    return NextResponse.json(
      { error: 'Error al obtener avance del presupuesto' },
      { status: 500 }
    )
  }
}

// PUT /api/presupuestos/[id]/avance - Actualizar cantidad ejecutada
// Nota: En una implementación completa, esto actualizaría un modelo ConceptoEjecutado
// Por ahora solo retorna éxito para preparar la UI
export async function PUT(
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

    // Verificar que el presupuesto existe
    const presupuesto = await prisma.presupuesto.findFirst({
      where: {
        id: params.id,
        obra: { empresaId }
      }
    })

    if (!presupuesto) {
      return NextResponse.json({ error: 'Presupuesto no encontrado' }, { status: 404 })
    }

    const body = await request.json()
    const { conceptoPresupuestoId, cantidadEjecutada } = body

    if (!conceptoPresupuestoId || cantidadEjecutada === undefined) {
      return NextResponse.json(
        { error: 'conceptoPresupuestoId y cantidadEjecutada son requeridos' },
        { status: 400 }
      )
    }

    // Verificar que el concepto existe y pertenece al presupuesto
    const concepto = await prisma.conceptoPresupuesto.findFirst({
      where: {
        id: conceptoPresupuestoId,
        presupuestoId: params.id
      }
    })

    if (!concepto) {
      return NextResponse.json({ error: 'Concepto no encontrado' }, { status: 404 })
    }

    // Validar que cantidad ejecutada no exceda cantidad presupuesto
    if (cantidadEjecutada > Number(concepto.cantidad)) {
      return NextResponse.json(
        { error: 'La cantidad ejecutada no puede exceder la cantidad presupuestada' },
        { status: 400 }
      )
    }

    // TODO: Aquí se guardaría en un modelo ConceptoEjecutado
    // Por ahora solo retornamos éxito
    return NextResponse.json({
      success: true,
      message: 'Avance actualizado correctamente',
      data: {
        conceptoPresupuestoId,
        cantidadEjecutada
      }
    })
  } catch (error) {
    console.error('Error al actualizar avance:', error)
    return NextResponse.json(
      { error: 'Error al actualizar avance' },
      { status: 500 }
    )
  }
}
