import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import {
  withRole,
  handleApiError,
  successResponse,
  errorResponse,
  verifyResourceOwnership,
} from '@/lib/api-utils'
import { clienteUpdateSchema, validateSchema, idSchema } from '@/lib/validations'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  return withRole(['ADMIN', 'VENTAS', 'CONTADOR', 'USUARIO'], async (req, context) => {
    try {
      // Validar ID
      const clienteId = validateSchema(idSchema, params.id)

      // Verificar propiedad y obtener cliente
      const isOwner = await verifyResourceOwnership(clienteId, context.empresaId, 'cliente')
      if (!isOwner) {
        return errorResponse('Cliente no encontrado', 404)
      }

      const cliente = await prisma.cliente.findUnique({
        where: { id: clienteId },
        include: {
          obras: {
            select: {
              id: true,
              codigo: true,
              nombre: true,
              estado: true,
            },
            take: 10,
            orderBy: { updatedAt: 'desc' }
          }
        }
      })

      if (!cliente) {
        return errorResponse('Cliente no encontrado', 404)
      }

      return successResponse(cliente)
    } catch (error) {
      return handleApiError(error)
    }
  })(request, {} as any)
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  return withRole(['ADMIN', 'VENTAS'], async (req, context) => {
    try {
      // Validar ID
      const clienteId = validateSchema(idSchema, params.id)

      // Verificar propiedad
      const isOwner = await verifyResourceOwnership(clienteId, context.empresaId, 'cliente')
      if (!isOwner) {
        return errorResponse('Cliente no encontrado', 404)
      }

      const body = await req.json()

      // Validar datos con Zod
      const validatedData = validateSchema(clienteUpdateSchema, body)

      // Si está cambiando el RFC, validar que no exista otro
      if (validatedData.rfc) {
        const existing = await prisma.cliente.findFirst({
          where: {
            empresaId: context.empresaId,
            rfc: validatedData.rfc,
            activo: true,
            NOT: { id: clienteId }
          }
        })

        if (existing) {
          return errorResponse('Ya existe otro cliente activo con este RFC', 409)
        }
      }

      // Preparar datos para actualización (solo campos presentes)
      const updateData: any = {}

      if (validatedData.codigo !== undefined) updateData.codigo = validatedData.codigo
      if (validatedData.rfc !== undefined) updateData.rfc = validatedData.rfc
      if (validatedData.razonSocial !== undefined) updateData.razonSocial = validatedData.razonSocial
      if (validatedData.nombreComercial !== undefined) updateData.nombreComercial = validatedData.nombreComercial
      if (validatedData.regimenFiscal !== undefined) updateData.regimenFiscal = validatedData.regimenFiscal
      if (validatedData.usoCfdi !== undefined) updateData.usoCfdi = validatedData.usoCfdi
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

      const cliente = await prisma.cliente.update({
        where: { id: clienteId },
        data: updateData,
      })

      return successResponse(cliente)
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
      const clienteId = validateSchema(idSchema, params.id)

      // Verificar propiedad
      const isOwner = await verifyResourceOwnership(clienteId, context.empresaId, 'cliente')
      if (!isOwner) {
        return errorResponse('Cliente no encontrado', 404)
      }

      // Soft delete (cambiar a inactivo)
      const cliente = await prisma.cliente.update({
        where: { id: clienteId },
        data: { activo: false }
      })

      return successResponse(cliente)
    } catch (error) {
      return handleApiError(error)
    }
  })(request, {} as any)
}
