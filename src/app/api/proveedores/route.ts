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
import { proveedorQuerySchema, proveedorCreateSchema, validateSchema } from '@/lib/validations'

export async function GET(request: NextRequest) {
  return withRole(['ADMIN', 'COMPRAS', 'CONTADOR', 'USUARIO'], async (req, context) => {
    try {
      const { searchParams } = new URL(req.url)

      const query = validateSchema(proveedorQuerySchema, {
        activo: searchParams.get('activo'),
        page: searchParams.get('page') || '1',
        limit: searchParams.get('limit') || '20',
      })

      const { skip, take } = getPaginationParams(query.page as number, query.limit as number)

      const where: any = {
        empresaId: context.empresaId,
      }

      if (query.activo !== undefined) {
        where.activo = query.activo
      }

      const [proveedores, total] = await Promise.all([
        prisma.proveedor.findMany({
          where,
          orderBy: { updatedAt: 'desc' },
          skip,
          take,
        }),
        prisma.proveedor.count({ where })
      ])

      const response = createPaginatedResponse(proveedores, total, query.page as number, query.limit as number)
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
      const validatedData = validateSchema(proveedorCreateSchema, body)

      const existing = await prisma.proveedor.findFirst({
        where: {
          empresaId: context.empresaId,
          rfc: validatedData.rfc,
          activo: true
        }
      })

      if (existing) {
        return NextResponse.json(
          { error: 'Ya existe un proveedor activo con este RFC' },
          { status: 409 }
        )
      }

      const proveedor = await prisma.proveedor.create({
        data: {
          empresaId: context.empresaId,
          codigo: validatedData.codigo,
          rfc: validatedData.rfc,
          razonSocial: validatedData.razonSocial,
          nombreComercial: validatedData.nombreComercial,
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
          banco: validatedData.banco,
          cuenta: validatedData.cuenta,
          clabe: validatedData.clabe,
        }
      })

      return createdResponse(proveedor)
    } catch (error) {
      return handleApiError(error)
    }
  })(request, {} as any)
}
