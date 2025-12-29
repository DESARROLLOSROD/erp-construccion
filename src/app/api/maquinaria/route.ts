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
import { z } from 'zod'

// Validation Schemas
const maquinariaCreateSchema = z.object({
    codigo: z.string().min(1, 'El código es requerido'),
    descripcion: z.string().min(1, 'La descripción es requerida'),
    marca: z.string().optional(),
    modelo: z.string().optional(),
    serie: z.string().optional(),
    anio: z.number().int().optional(),
    estado: z.enum(['DISPONIBLE', 'EN_OBRA', 'MANTENIMIENTO', 'REPARACION', 'BAJA']).default('DISPONIBLE'),
    costoHora: z.number().optional(),
    costoRentaDia: z.number().optional(),
    horometroActual: z.number().optional(),
    ubicacionActual: z.string().optional(),
})

const maquinariaQuerySchema = z.object({
    search: z.string().optional(),
    estado: z.string().optional(),
    page: z.string().optional(),
    limit: z.string().optional(),
})

export async function GET(request: NextRequest) {
    return withRole(['ADMIN', 'OBRAS', 'CONTADOR', 'USUARIO'], async (req, context) => {
        try {
            const { searchParams } = new URL(req.url)

            const query = {
                search: searchParams.get('search'),
                estado: searchParams.get('estado'),
                page: searchParams.get('page') || '1',
                limit: searchParams.get('limit') || '20',
            }

            const { skip, take } = getPaginationParams(parseInt(query.page), parseInt(query.limit))

            // Build filters
            const where: any = {
                empresaId: context.empresaId,
            }

            if (query.search) {
                where.OR = [
                    { codigo: { contains: query.search, mode: 'insensitive' } },
                    { descripcion: { contains: query.search, mode: 'insensitive' } },
                    { marca: { contains: query.search, mode: 'insensitive' } },
                    { modelo: { contains: query.search, mode: 'insensitive' } },
                ]
            }

            if (query.estado && query.estado !== 'TODOS') {
                where.estado = query.estado
            }

            const [maquinaria, total] = await Promise.all([
                prisma.maquinaria.findMany({
                    where,
                    orderBy: { createdAt: 'desc' },
                    skip,
                    take,
                }),
                prisma.maquinaria.count({ where })
            ])

            const response = createPaginatedResponse(maquinaria, total, parseInt(query.page), parseInt(query.limit))
            return successResponse(response)
        } catch (error) {
            return handleApiError(error)
        }
    })(request, {} as any)
}

export async function POST(request: NextRequest) {
    return withRole(['ADMIN', 'OBRAS'], async (req, context) => {
        try {
            const body = await req.json()
            console.log('[POST /api/maquinaria] Body:', body)
            console.log('[POST /api/maquinaria] Context:', context)

            const validatedData = maquinariaCreateSchema.parse(body)

            // Check for duplicate code
            const existing = await prisma.maquinaria.findFirst({
                where: {
                    empresaId: context.empresaId,
                    codigo: validatedData.codigo
                }
            })

            if (existing) {
                return NextResponse.json(
                    { error: `El código ${validatedData.codigo} ya existe` },
                    { status: 409 }
                )
            }

            const maquinaria = await prisma.maquinaria.create({
                data: {
                    ...validatedData,
                    empresaId: context.empresaId,
                }
            })

            return createdResponse(maquinaria)
        } catch (error) {
            return handleApiError(error)
        }
    })(request, {} as any)
}
