import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import {
    withRole,
    handleApiError,
    successResponse,
    createdResponse,
} from '@/lib/api-utils'
import { z } from 'zod'

const createAsignacionSchema = z.object({
    obraId: z.string().min(1, 'La obra es requerida'),
    fechaInicio: z.string().or(z.date()),
    horometroInicio: z.number().optional(),
    observaciones: z.string().optional(),
})

const finishAsignacionSchema = z.object({
    fechaFin: z.string().or(z.date()),
    horometroFin: z.number().optional(),
    observaciones: z.string().optional(),
})

// GET assignments for a specific machine
export async function GET(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    return withRole(['ADMIN', 'OBRAS', 'CONTADOR', 'USUARIO'], async (req, context) => {
        try {
            const { id } = params
            const asignaciones = await prisma.asignacionMaquinaria.findMany({
                where: { maquinariaId: id },
                include: {
                    obra: {
                        select: { id: true, nombre: true, codigo: true }
                    }
                },
                orderBy: { fechaInicio: 'desc' }
            })

            return successResponse(asignaciones)
        } catch (error) {
            return handleApiError(error)
        }
    })(request, {} as any)
}

// POST: Create new assignment (Check-out)
export async function POST(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    return withRole(['ADMIN', 'OBRAS'], async (req, context) => {
        try {
            const { id } = params
            const body = await req.json()
            const data = createAsignacionSchema.parse(body)

            // 1. Verify Machine exists and is AVAILABLE
            const maquinaria = await prisma.maquinaria.findUnique({
                where: { id },
            })

            if (!maquinaria) {
                return NextResponse.json({ error: 'Maquinaria no encontrada' }, { status: 404 })
            }

            if (maquinaria.empresaId !== context.empresaId) {
                return NextResponse.json({ error: 'No tienes acceso' }, { status: 403 })
            }

            if (maquinaria.estado !== 'DISPONIBLE') {
                return NextResponse.json({ error: 'La maquinaria no está DISPONIBLE' }, { status: 400 })
            }

            // 2. Verify Obra
            const obra = await prisma.obra.findUnique({
                where: { id: data.obraId },
                select: { id: true, nombre: true, empresaId: true }
            })

            if (!obra || obra.empresaId !== context.empresaId) {
                return NextResponse.json({ error: 'Obra inválida' }, { status: 400 })
            }

            // 3. Transaction: Create Assignment + Update Machine
            const result = await prisma.$transaction(async (tx) => {
                // Create Assignment
                const asignacion = await tx.asignacionMaquinaria.create({
                    data: {
                        maquinariaId: id,
                        obraId: data.obraId,
                        fechaInicio: new Date(data.fechaInicio),
                        horometroInicio: data.horometroInicio || maquinaria.horometroActual,
                        activo: true,
                        observaciones: data.observaciones,
                    }
                })

                // Update Machine Status
                await tx.maquinaria.update({
                    where: { id },
                    data: {
                        estado: 'EN_OBRA',
                        ubicacionActual: obra.nombre,
                        // Update horometer if provided and greater
                        horometroActual: (data.horometroInicio && data.horometroInicio > Number(maquinaria.horometroActual))
                            ? data.horometroInicio
                            : undefined
                    }
                })

                return asignacion
            })

            return createdResponse(result)

        } catch (error) {
            return handleApiError(error)
        }
    })(request, {} as any)
}

// PUT: Finish assignment (Check-in) - This usually targets a specific assignment ID, 
// strictly strictly speaking it should be /api/asignaciones/[id], but we can handle "close active" here 
// or require the body to identify which one, or simply close the active one for this machine.
export async function PUT(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    return withRole(['ADMIN', 'OBRAS'], async (req, context) => {
        try {
            const { id } = params
            const body = await req.json()
            const data = finishAsignacionSchema.parse(body)

            // Find active assignment
            const activeAsignacion = await prisma.asignacionMaquinaria.findFirst({
                where: {
                    maquinariaId: id,
                    activo: true
                }
            })

            if (!activeAsignacion) {
                return NextResponse.json({ error: 'No hay asignación activa para finalizar' }, { status: 404 })
            }

            const maquinaria = await prisma.maquinaria.findUnique({ where: { id } })
            if (!maquinaria) return NextResponse.json({ error: 'Error interno' }, { status: 500 })

            // Transaction
            const result = await prisma.$transaction(async (tx) => {
                // Update Assignment
                const updatedAsignacion = await tx.asignacionMaquinaria.update({
                    where: { id: activeAsignacion.id },
                    data: {
                        activo: false,
                        fechaFin: new Date(data.fechaFin),
                        horometroFin: data.horometroFin,
                        observaciones: data.observaciones ? `${activeAsignacion.observaciones || ''} \nCierre: ${data.observaciones}` : undefined
                    }
                })

                // Update Machine
                await tx.maquinaria.update({
                    where: { id },
                    data: {
                        estado: 'DISPONIBLE',
                        ubicacionActual: 'Patio Central', // Default or leave previous? best to reset or specific
                        horometroActual: (data.horometroFin && data.horometroFin > Number(maquinaria.horometroActual))
                            ? data.horometroFin
                            : undefined
                    }
                })

                return updatedAsignacion
            })

            return successResponse(result)

        } catch (error) {
            return handleApiError(error)
        }
    })(request, {} as any)
}
