import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import {
  withRole,
  handleApiError,
  successResponse,
  errorResponse,
  verifyResourceOwnership,
} from '@/lib/api-utils'
import { productoUpdateSchema, validateSchema, idSchema } from '@/lib/validations'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  return withRole(['ADMIN', 'COMPRAS', 'VENTAS', 'OBRAS', 'USUARIO'], async (req, context) => {
    try {
      // Validar ID
      const productoId = validateSchema(idSchema, params.id)

      // Verificar propiedad y obtener producto
      const isOwner = await verifyResourceOwnership(productoId, context.empresaId, 'producto')
      if (!isOwner) {
        return errorResponse('Producto no encontrado', 404)
      }

      const producto = await prisma.producto.findUnique({
        where: { id: productoId },
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

      if (!producto) {
        return errorResponse('Producto no encontrado', 404)
      }

      // Convertir Decimals
      const productoConverted = {
        ...producto,
        precioCompra: Number(producto.precioCompra),
        precioVenta: Number(producto.precioVenta),
        stockMinimo: Number(producto.stockMinimo),
        stockActual: Number(producto.stockActual),
      }

      return successResponse(productoConverted)
    } catch (error) {
      return handleApiError(error)
    }
  })(request, {} as any)
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  return withRole(['ADMIN', 'COMPRAS'], async (req, context) => {
    try {
      // Validar ID
      const productoId = validateSchema(idSchema, params.id)

      // Verificar propiedad
      const isOwner = await verifyResourceOwnership(productoId, context.empresaId, 'producto')
      if (!isOwner) {
        return errorResponse('Producto no encontrado', 404)
      }

      const body = await req.json()

      // Validar datos con Zod
      const validatedData = validateSchema(productoUpdateSchema, body)

      // Si está cambiando el código, validar que no exista otro
      if (validatedData.codigo) {
        const existing = await prisma.producto.findFirst({
          where: {
            empresaId: context.empresaId,
            codigo: validatedData.codigo,
            activo: true,
            NOT: { id: productoId }
          }
        })

        if (existing) {
          return errorResponse('Ya existe otro producto activo con este código', 409)
        }
      }

      // Preparar datos para actualización (solo campos presentes)
      const updateData: any = {}

      if (validatedData.codigo !== undefined) updateData.codigo = validatedData.codigo
      if (validatedData.descripcion !== undefined) updateData.descripcion = validatedData.descripcion
      if (validatedData.categoriaId !== undefined) updateData.categoriaId = validatedData.categoriaId
      if (validatedData.unidadId !== undefined) updateData.unidadId = validatedData.unidadId
      if (validatedData.claveSat !== undefined) updateData.claveSat = validatedData.claveSat
      if (validatedData.claveUnidadSat !== undefined) updateData.claveUnidadSat = validatedData.claveUnidadSat
      if (validatedData.precioCompra !== undefined) updateData.precioCompra = validatedData.precioCompra
      if (validatedData.precioVenta !== undefined) updateData.precioVenta = validatedData.precioVenta
      if (validatedData.esServicio !== undefined) updateData.esServicio = validatedData.esServicio
      if (validatedData.controlStock !== undefined) updateData.controlStock = validatedData.controlStock
      if (validatedData.stockMinimo !== undefined) updateData.stockMinimo = validatedData.stockMinimo
      if (validatedData.stockActual !== undefined) updateData.stockActual = validatedData.stockActual

      const producto = await prisma.producto.update({
        where: { id: productoId },
        data: updateData,
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

      return successResponse(productoConverted)
    } catch (error) {
      return handleApiError(error)
    }
  })(request, {} as any)
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  return withRole(['ADMIN'], async (req, context) => {
    try {
      // Validar ID
      const productoId = validateSchema(idSchema, params.id)

      // Verificar propiedad
      const isOwner = await verifyResourceOwnership(productoId, context.empresaId, 'producto')
      if (!isOwner) {
        return errorResponse('Producto no encontrado', 404)
      }

      // Soft delete (cambiar a inactivo)
      const producto = await prisma.producto.update({
        where: { id: productoId },
        data: { activo: false }
      })

      // Convertir Decimals
      const productoConverted = {
        ...producto,
        precioCompra: Number(producto.precioCompra),
        precioVenta: Number(producto.precioVenta),
        stockMinimo: Number(producto.stockMinimo),
        stockActual: Number(producto.stockActual),
      }

      return successResponse(productoConverted)
    } catch (error) {
      return handleApiError(error)
    }
  })(request, {} as any)
}
