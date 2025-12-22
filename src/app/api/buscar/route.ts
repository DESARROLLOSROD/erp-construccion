import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { createServerClient } from '@/lib/supabase'

export interface ResultadoBusqueda {
  tipo: 'obra' | 'cliente' | 'presupuesto' | 'producto' | 'proveedor'
  id: string
  titulo: string
  subtitulo: string
  url: string
  metadata?: Record<string, any>
}

// GET /api/buscar?q=termino
export async function GET(request: NextRequest) {
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

    // Obtener término de búsqueda
    const searchParams = request.nextUrl.searchParams
    const query = searchParams.get('q')

    if (!query || query.trim().length === 0) {
      return NextResponse.json({ resultados: [] })
    }

    const termino = query.trim().toLowerCase()

    // Buscar en paralelo en todas las entidades
    const [obras, clientes, presupuestos, productos, proveedores] = await Promise.all([
      // Buscar obras
      prisma.obra.findMany({
        where: {
          empresaId,
          OR: [
            { codigo: { contains: termino, mode: 'insensitive' } },
            { nombre: { contains: termino, mode: 'insensitive' } },
            { ubicacion: { contains: termino, mode: 'insensitive' } },
          ]
        },
        select: {
          id: true,
          codigo: true,
          nombre: true,
          ubicacion: true,
          estado: true,
          montoContrato: true,
        },
        take: 5,
        orderBy: { updatedAt: 'desc' }
      }),

      // Buscar clientes
      prisma.cliente.findMany({
        where: {
          empresaId,
          activo: true,
          OR: [
            { rfc: { contains: termino, mode: 'insensitive' } },
            { razonSocial: { contains: termino, mode: 'insensitive' } },
            { nombreComercial: { contains: termino, mode: 'insensitive' } },
          ]
        },
        select: {
          id: true,
          rfc: true,
          razonSocial: true,
          nombreComercial: true,
        },
        take: 5,
        orderBy: { updatedAt: 'desc' }
      }),

      // Buscar presupuestos
      prisma.presupuesto.findMany({
        where: {
          obra: { empresaId },
          OR: [
            { nombre: { contains: termino, mode: 'insensitive' } },
            { descripcion: { contains: termino, mode: 'insensitive' } },
            { obra: { codigo: { contains: termino, mode: 'insensitive' } } },
            { obra: { nombre: { contains: termino, mode: 'insensitive' } } },
          ]
        },
        select: {
          id: true,
          nombre: true,
          version: true,
          esVigente: true,
          obra: {
            select: {
              codigo: true,
              nombre: true,
            }
          }
        },
        take: 5,
        orderBy: { updatedAt: 'desc' }
      }),

      // Buscar productos
      prisma.producto.findMany({
        where: {
          empresaId,
          activo: true,
          OR: [
            { codigo: { contains: termino, mode: 'insensitive' } },
            { descripcion: { contains: termino, mode: 'insensitive' } },
          ]
        },
        select: {
          id: true,
          codigo: true,
          descripcion: true,
          precioVenta: true,
          unidad: {
            select: {
              abreviatura: true
            }
          }
        },
        take: 5,
        orderBy: { updatedAt: 'desc' }
      }),

      // Buscar proveedores
      prisma.proveedor.findMany({
        where: {
          empresaId,
          activo: true,
          OR: [
            { rfc: { contains: termino, mode: 'insensitive' } },
            { razonSocial: { contains: termino, mode: 'insensitive' } },
            { nombreComercial: { contains: termino, mode: 'insensitive' } },
          ]
        },
        select: {
          id: true,
          rfc: true,
          razonSocial: true,
          nombreComercial: true,
        },
        take: 5,
        orderBy: { updatedAt: 'desc' }
      }),
    ])

    // Transformar resultados a formato común
    const resultados: ResultadoBusqueda[] = [
      ...obras.map(obra => ({
        tipo: 'obra' as const,
        id: obra.id,
        titulo: `${obra.codigo} - ${obra.nombre}`,
        subtitulo: obra.ubicacion || 'Sin ubicación',
        url: `/obras/${obra.id}`,
        metadata: {
          estado: obra.estado,
          monto: Number(obra.montoContrato)
        }
      })),

      ...clientes.map(cliente => ({
        tipo: 'cliente' as const,
        id: cliente.id,
        titulo: cliente.nombreComercial || cliente.razonSocial,
        subtitulo: `RFC: ${cliente.rfc}`,
        url: `/catalogos/clientes`,
        metadata: {
          razonSocial: cliente.razonSocial
        }
      })),

      ...presupuestos.map(presupuesto => ({
        tipo: 'presupuesto' as const,
        id: presupuesto.id,
        titulo: `${presupuesto.nombre} (v${presupuesto.version})`,
        subtitulo: `${presupuesto.obra.codigo} - ${presupuesto.obra.nombre}`,
        url: `/presupuestos/${presupuesto.id}`,
        metadata: {
          esVigente: presupuesto.esVigente
        }
      })),

      ...productos.map(producto => ({
        tipo: 'producto' as const,
        id: producto.id,
        titulo: `${producto.codigo} - ${producto.descripcion}`,
        subtitulo: `Precio: ${Number(producto.precioVenta).toLocaleString('es-MX', { style: 'currency', currency: 'MXN' })}`,
        url: `/catalogos/productos`,
        metadata: {
          precio: Number(producto.precioVenta),
          unidad: producto.unidad?.abreviatura
        }
      })),

      ...proveedores.map(proveedor => ({
        tipo: 'proveedor' as const,
        id: proveedor.id,
        titulo: proveedor.nombreComercial || proveedor.razonSocial,
        subtitulo: `RFC: ${proveedor.rfc}`,
        url: `/catalogos/proveedores`,
        metadata: {
          razonSocial: proveedor.razonSocial
        }
      })),
    ]

    return NextResponse.json({ resultados })
  } catch (error) {
    console.error('Error en búsqueda:', error)
    return NextResponse.json(
      { error: 'Error al realizar la búsqueda' },
      { status: 500 }
    )
  }
}
