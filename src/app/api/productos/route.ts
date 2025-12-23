import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import {
  withRole,
  handleApiError,
  successResponse,
  createdResponse,
  errorResponse,
  getPaginationParams,
  createPaginatedResponse,
} from '@/lib/api-utils'
import { productoQuerySchema, productoCreateSchema, validateSchema } from '@/lib/validations'

export async function GET(request: NextRequest) {
  return withRole(['ADMIN', 'COMPRAS', 'VENTAS', 'OBRAS', 'USUARIO'], async (req, context) => {
    try {
      const { searchParams } = new URL(req.url)

      const query = validateSchema(productoQuerySchema, {
        activo: searchParams.get('activo'),
        categoriaId: searchParams.get('categoriaId'),
        esServicio: searchParams.get('esServicio'),
        page: searchParams.get('page') || '1',
        limit: searchParams.get('limit') || '20',
      })

      const { skip, take } = getPaginationParams(query.page as number, query.limit as number)

      const where: any = {
        empresaId: context.empresaId,
      }

      if (query.activo !== undefined) where.activo = query.activo
      if (query.categoriaId) where.categoriaId = query.categoriaId
      if (query.esServicio !== undefined) where.esServicio = query.esServicio

      const [productos, total] = await Promise.all([
        prisma.producto.findMany({
          where,
          include: {
            categoria: {
              select: {
                id: true,
                nombre: true,
                color: true,
              }
            },
            unidad: {
              select: {
                id: true,
                nombre: true,
                abreviatura: true,
              }
            }
          },
          orderBy: { codigo: 'asc' },
          skip,
          take,
        }),
        prisma.producto.count({ where })
      ])

      // Convertir Decimals a números
      const productosConverted = productos.map(p => ({
        ...p,
        precioCompra: Number(p.precioCompra),
        precioVenta: Number(p.precioVenta),
        stockMinimo: Number(p.stockMinimo),
        stockActual: Number(p.stockActual),
      }))

      const response = createPaginatedResponse(productosConverted, total, query.page as number, query.limit as number)
      return successResponse(response)
    } catch (error) {
      return handleApiError(error)
    }
  })(request, {} as any)
}

export async function POST(request: NextRequest) {
  return withRole(['ADMIN', 'COMPRAS'], async (req, context) => {
    try {
      const body = await req.json()
      const validatedData = validateSchema(productoCreateSchema, body)

      // Validar duplicados de código
      const existing = await prisma.producto.findFirst({
        where: {
          empresaId: context.empresaId,
          codigo: validatedData.codigo,
          activo: true
        }
      })

      if (existing) {
        return errorResponse('Ya existe un producto activo con este código', 409)
      }

      const producto = await prisma.producto.create({
        data: {
          empresaId: context.empresaId,
          codigo: validatedData.codigo,
          descripcion: validatedData.descripcion,
          categoriaId: validatedData.categoriaId,
          unidadId: validatedData.unidadId,
          claveSat: validatedData.claveSat,
          claveUnidadSat: validatedData.claveUnidadSat,
          precioCompra: validatedData.precioCompra,
          precioVenta: validatedData.precioVenta,
          esServicio: validatedData.esServicio,
          controlStock: validatedData.controlStock,
          stockMinimo: validatedData.stockMinimo,
          stockActual: validatedData.stockActual,
        },
        include: {
          categoria: {
            select: {
              id: true,
              nombre: true,
              color: true,
            }
          },
          unidad: {
            select: {
              id: true,
              nombre: true,
              abreviatura: true,
            }
          }
        }
      })

      // Convertir Decimals
      const productoConverted = {
        ...producto,
        precioCompra: Number(producto.precioCompra),
        precioVenta: Number(producto.precioVenta),
        stockMinimo: Number(producto.stockMinimo),
        stockActual: Number(producto.stockActual),
      }

      return createdResponse(productoConverted)
    } catch (error) {
      return handleApiError(error)
    }
  })(request, {} as any)
}
