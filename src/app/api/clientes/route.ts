import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import {
  withRole,
  handleApiError,
  successResponse,
  createdResponse,
  getPaginationParams,
  createPaginatedResponse,
} from '@/lib/api-utils'
import { clienteQuerySchema, clienteCreateSchema, validateSchema } from '@/lib/validations'

export async function GET(request: NextRequest) {
  return withRole(['ADMIN', 'VENTAS', 'CONTADOR', 'USUARIO'], async (req, context) => {
    try {
      const { searchParams } = new URL(req.url)

      // Validar parámetros de query
      const query = validateSchema(clienteQuerySchema, {
        activo: searchParams.get('activo'),
        page: searchParams.get('page') || '1',
        limit: searchParams.get('limit') || '20',
      })

      const { skip, take } = getPaginationParams(query.page as number, query.limit as number)

      // Construir filtros
      const where: any = {
        empresaId: context.empresaId,
      }

      if (query.activo !== undefined) {
        where.activo = query.activo
      }

      // Obtener clientes con paginación
      const [clientes, total] = await Promise.all([
        prisma.cliente.findMany({
          where,
          orderBy: { updatedAt: 'desc' },
          skip,
          take,
        }),
        prisma.cliente.count({ where })
      ])

      const response = createPaginatedResponse(clientes, total, query.page as number, query.limit as number)
      return successResponse(response)
    } catch (error) {
      return handleApiError(error)
    }
  })(request, {} as any)
}

export async function POST(request: NextRequest) {
  return withRole(['ADMIN', 'VENTAS'], async (req, context) => {
    try {
      const body = await req.json()

      // Validar datos con Zod
      const validatedData = validateSchema(clienteCreateSchema, body)

      // Validar duplicados de RFC
      const existing = await prisma.cliente.findFirst({
        where: {
          empresaId: context.empresaId,
          rfc: validatedData.rfc,
          activo: true
        }
      })

      if (existing) {
        return NextResponse.json(
          { error: 'Ya existe un cliente activo con este RFC' },
          { status: 409 }
        )
      }

      // Crear cliente
      const cliente = await prisma.cliente.create({
        data: {
          empresaId: context.empresaId,
          codigo: validatedData.codigo,
          rfc: validatedData.rfc,
          razonSocial: validatedData.razonSocial,
          nombreComercial: validatedData.nombreComercial,
          regimenFiscal: validatedData.regimenFiscal,
          usoCfdi: validatedData.usoCfdi,
          calle: validatedData.calle,
          numExterior: validatedData.numExterior,
          numInterior: validatedData.numInterior,
          colonia: validatedData.colonia,
          codigoPostal: validatedData.codigoPostal,
          municipio: validatedData.municipio,
          estado: validatedData.estado,
          pais: validatedData.pais,
          email: validatedData.email,
          telefono: validatedData.telefono,
          contacto: validatedData.contacto,
        }
      })

      return createdResponse(cliente)
    } catch (error) {
      return handleApiError(error)
    }
  })(request, {} as any)
}
