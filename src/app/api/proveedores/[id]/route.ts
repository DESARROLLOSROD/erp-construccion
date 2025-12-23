import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import {
  withRole,
  handleApiError,
  successResponse,
  errorResponse,
  verifyResourceOwnership,
} from '@/lib/api-utils'
import { proveedorUpdateSchema, validateSchema, idSchema } from '@/lib/validations'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  return withRole(['ADMIN', 'COMPRAS', 'CONTADOR', 'USUARIO'], async (req, context) => {
    try {
      // Validar ID
      const proveedorId = validateSchema(idSchema, params.id)

      // Verificar propiedad y obtener proveedor
      const isOwner = await verifyResourceOwnership(proveedorId, context.empresaId, 'proveedor')
      if (!isOwner) {
        return errorResponse('Proveedor no encontrado', 404)
      }

      const proveedor = await prisma.proveedor.findUnique({
        where: { id: proveedorId }
      })

      if (!proveedor) {
        return errorResponse('Proveedor no encontrado', 404)
      }

      return successResponse(proveedor)
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
      const proveedorId = validateSchema(idSchema, params.id)

      // Verificar propiedad
      const isOwner = await verifyResourceOwnership(proveedorId, context.empresaId, 'proveedor')
      if (!isOwner) {
        return errorResponse('Proveedor no encontrado', 404)
      }

      const body = await req.json()

      // Validar datos con Zod
      const validatedData = validateSchema(proveedorUpdateSchema, body)

      // Si está cambiando el RFC, validar que no exista otro
      if (validatedData.rfc) {
        const existing = await prisma.proveedor.findFirst({
          where: {
            empresaId: context.empresaId,
            rfc: validatedData.rfc,
            activo: true,
            NOT: { id: proveedorId }
          }
        })

        if (existing) {
          return errorResponse('Ya existe otro proveedor activo con este RFC', 409)
        }
      }

      // Preparar datos para actualización (solo campos presentes)
      const updateData: any = {}

      if (validatedData.codigo !== undefined) updateData.codigo = validatedData.codigo
      if (validatedData.rfc !== undefined) updateData.rfc = validatedData.rfc
      if (validatedData.razonSocial !== undefined) updateData.razonSocial = validatedData.razonSocial
      if (validatedData.nombreComercial !== undefined) updateData.nombreComercial = validatedData.nombreComercial
      if (validatedData.calle !== undefined) updateData.calle = validatedData.calle
      if (validatedData.numExterior !== undefined) updateData.numExterior = validatedData.numExterior
      if (validatedData.numInterior !== undefined) updateData.numInterior = validatedData.numInterior
      if (validatedData.colonia !== undefined) updateData.colonia = validatedData.colonia
      if (validatedData.codigoPostal !== undefined) updateData.codigoPostal = validatedData.codigoPostal
      if (validatedData.municipio !== undefined) updateData.municipio = validatedData.municipio
      if (validatedData.estado !== undefined) updateData.estado = validatedData.estado
      if (validatedData.pais !== undefined) updateData.pais = validatedData.pais
      if (validatedData.email !== undefined) updateData.email = validatedData.email
      if (validatedData.telefono !== undefined) updateData.telefono = validatedData.telefono
      if (validatedData.contacto !== undefined) updateData.contacto = validatedData.contacto
      if (validatedData.banco !== undefined) updateData.banco = validatedData.banco
      if (validatedData.cuenta !== undefined) updateData.cuenta = validatedData.cuenta
      if (validatedData.clabe !== undefined) updateData.clabe = validatedData.clabe

      const proveedor = await prisma.proveedor.update({
        where: { id: proveedorId },
        data: updateData,
      })

      return successResponse(proveedor)
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
      const proveedorId = validateSchema(idSchema, params.id)

      // Verificar propiedad
      const isOwner = await verifyResourceOwnership(proveedorId, context.empresaId, 'proveedor')
      if (!isOwner) {
        return errorResponse('Proveedor no encontrado', 404)
      }

      // Soft delete (cambiar a inactivo)
      const proveedor = await prisma.proveedor.update({
        where: { id: proveedorId },
        data: { activo: false }
      })

      return successResponse(proveedor)
    } catch (error) {
      return handleApiError(error)
    }
  })(request, {} as any)
}
