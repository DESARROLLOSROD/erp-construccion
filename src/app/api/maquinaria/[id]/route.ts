import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import {
    withRole,
    handleApiError,
    successResponse,
} from '@/lib/api-utils'
import { z } from 'zod'

const maquinariaUpdateSchema = z.object({
    codigo: z.string().optional(),
    descripcion: z.string().optional(),
    marca: z.string().optional(),
    modelo: z.string().optional(),
    serie: z.string().optional(),
    anio: z.number().int().optional(),
    estado: z.enum(['DISPONIBLE', 'EN_OBRA', 'MANTENIMIENTO', 'REPARACION', 'BAJA']).optional(),
    costoHora: z.number().optional(),
    costoRentaDia: z.number().optional(),
    horometroActual: z.number().optional(),
    ubicacionActual: z.string().optional(),
})

export async function GET(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    return withRole(['ADMIN', 'OBRAS', 'CONTADOR', 'USUARIO'], async (req, context) => {
        try {
            const { id } = params

            const maquinaria = await prisma.maquinaria.findUnique({
                where: { id },
                include: {
                    registrosUso: {
                        take: 5,
                        orderBy: { fecha: 'desc' }
                    },
                    mantenimientos: {
                        take: 5,
                        orderBy: { fechaProgramada: 'desc' }
                    },
                    asignaciones: {
                        where: { activo: true },
                        include: { obra: { select: { nombre: true, codigo: true } } }
                    }
                }
            })

            if (!maquinaria) {
                return NextResponse.json({ error: 'Equipo no encontrado' }, { status: 404 })
            }

            if (maquinaria.empresaId !== context.empresaId) {
                return NextResponse.json({ error: 'No tienes acceso a este equipo' }, { status: 403 })
            }

            return successResponse(maquinaria)
        } catch (error) {
            return handleApiError(error)
        }
    })(request, {} as any)
}

export async function PUT(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    return withRole(['ADMIN', 'OBRAS'], async (req, context) => {
        try {
            const { id } = params
            const body = await req.json()
            const validatedData = maquinariaUpdateSchema.parse(body)

            const maquinaria = await prisma.maquinaria.findUnique({
                where: { id },
                select: { empresaId: true }
            })

            if (!maquinaria) {
                return NextResponse.json({ error: 'Equipo no encontrado' }, { status: 404 })
            }

            if (maquinaria.empresaId !== context.empresaId) {
                return NextResponse.json({ error: 'No tienes acceso a este equipo' }, { status: 403 })
            }

            const updated = await prisma.maquinaria.update({
                where: { id },
                data: validatedData
            })

            return successResponse(updated)
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
            const { id } = params

            const maquinaria = await prisma.maquinaria.findUnique({
                where: { id },
                select: { empresaId: true }
            })

            if (!maquinaria) {
                return NextResponse.json({ error: 'Equipo no encontrado' }, { status: 404 })
            }

            if (maquinaria.empresaId !== context.empresaId) {
                return NextResponse.json({ error: 'No tienes acceso a este equipo' }, { status: 403 })
            }

            await prisma.maquinaria.delete({
                where: { id }
            })

            return successResponse({ message: 'Equipo eliminado' })
        } catch (error) {
            return handleApiError(error)
        }
    })(request, {} as any)
}
