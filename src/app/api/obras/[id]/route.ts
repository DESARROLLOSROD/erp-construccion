import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { createServerClient } from '@/lib/supabase'

export async function GET(
    request: Request,
    { params }: { params: { id: string } }
) {
    try {
        const supabase = createServerClient()
        const { data: { session } } = await supabase.auth.getSession()

        if (!session) {
            return new NextResponse('Unauthorized', { status: 401 })
        }

        const usuario = await prisma.usuario.findUnique({
            where: { authId: session.user.id },
            include: { empresas: true }
        })

        if (!usuario || usuario.empresas.length === 0) {
            return new NextResponse('Usuario no asignado a ninguna empresa', { status: 403 })
        }

        const empresaId = usuario.empresas[0].empresaId

        const obra = await prisma.obra.findFirst({
            where: {
                id: params.id,
                empresaId
            },
            include: {
                cliente: {
                    select: {
                        id: true,
                        rfc: true,
                        razonSocial: true,
                        nombreComercial: true,
                    }
                },
                presupuestos: {
                    where: { esVigente: true },
                    select: {
                        id: true,
                        version: true,
                        nombre: true,
                    }
                },
                contratos: {
                    select: {
                        id: true,
                        numero: true,
                        montoOriginal: true,
                        montoActual: true,
                    }
                },
                estimaciones: {
                    select: {
                        id: true,
                        numero: true,
                        estado: true,
                        importeNeto: true,
                    },
                    orderBy: { numero: 'desc' },
                    take: 5
                }
            }
        })

        if (!obra) {
            return new NextResponse('Obra no encontrada', { status: 404 })
        }

        return NextResponse.json(obra)
    } catch (error) {
        console.error('[OBRA_GET_ID]', error)
        return new NextResponse('Internal Error', { status: 500 })
    }
}

export async function PUT(
    request: Request,
    { params }: { params: { id: string } }
) {
    try {
        const supabase = createServerClient()
        const { data: { session } } = await supabase.auth.getSession()

        if (!session) {
            return new NextResponse('Unauthorized', { status: 401 })
        }

        const usuario = await prisma.usuario.findUnique({
            where: { authId: session.user.id },
            include: { empresas: true }
        })

        if (!usuario || usuario.empresas.length === 0) {
            return new NextResponse('Usuario no asignado a ninguna empresa', { status: 403 })
        }

        const empresaId = usuario.empresas[0].empresaId
        const body = await request.json()

        // Verificar que la obra exista y pertenezca a la empresa
        const existing = await prisma.obra.findFirst({
            where: { id: params.id, empresaId }
        })

        if (!existing) {
            return new NextResponse('Obra no encontrada', { status: 404 })
        }

        // Validar cliente si se proporciona
        if (body.clienteId && body.clienteId !== existing.clienteId) {
            const cliente = await prisma.cliente.findFirst({
                where: {
                    id: body.clienteId,
                    empresaId
                }
            })

            if (!cliente) {
                return new NextResponse('Cliente no encontrado o no pertenece a tu empresa', { status: 404 })
            }
        }

        // Preparar datos para actualización
        const updateData: any = {}

        if (body.codigo !== undefined) updateData.codigo = body.codigo.toUpperCase()
        if (body.nombre !== undefined) updateData.nombre = body.nombre
        if (body.descripcion !== undefined) updateData.descripcion = body.descripcion
        if (body.ubicacion !== undefined) updateData.ubicacion = body.ubicacion
        if (body.estado !== undefined) updateData.estado = body.estado
        if (body.tipoContrato !== undefined) updateData.tipoContrato = body.tipoContrato
        if (body.fechaInicio !== undefined) {
            updateData.fechaInicio = body.fechaInicio ? new Date(body.fechaInicio) : null
        }
        if (body.fechaFinProgramada !== undefined) {
            updateData.fechaFinProgramada = body.fechaFinProgramada ? new Date(body.fechaFinProgramada) : null
        }
        if (body.fechaFinReal !== undefined) {
            updateData.fechaFinReal = body.fechaFinReal ? new Date(body.fechaFinReal) : null
        }
        if (body.montoContrato !== undefined) updateData.montoContrato = body.montoContrato
        if (body.anticipoPct !== undefined) updateData.anticipoPct = body.anticipoPct
        if (body.retencionPct !== undefined) updateData.retencionPct = body.retencionPct
        if (body.clienteId !== undefined) updateData.clienteId = body.clienteId || null

        const obra = await prisma.obra.update({
            where: { id: params.id },
            data: updateData,
            include: {
                cliente: {
                    select: {
                        id: true,
                        rfc: true,
                        razonSocial: true,
                        nombreComercial: true,
                    }
                }
            }
        })

        return NextResponse.json(obra)
    } catch (error) {
        console.error('[OBRA_PUT]', error)
        return new NextResponse('Internal Error', { status: 500 })
    }
}

export async function DELETE(
    request: Request,
    { params }: { params: { id: string } }
) {
    try {
        const supabase = createServerClient()
        const { data: { session } } = await supabase.auth.getSession()

        if (!session) {
            return new NextResponse('Unauthorized', { status: 401 })
        }

        const usuario = await prisma.usuario.findUnique({
            where: { authId: session.user.id },
            include: { empresas: true }
        })

        if (!usuario || usuario.empresas.length === 0) {
            return new NextResponse('Usuario no asignado a ninguna empresa', { status: 403 })
        }

        const empresaId = usuario.empresas[0].empresaId

        // Verificar existencia
        const existing = await prisma.obra.findFirst({
            where: { id: params.id, empresaId }
        })

        if (!existing) {
            return new NextResponse('Obra no encontrada', { status: 404 })
        }

        // Cambiar estado a CANCELADA en lugar de eliminar
        const obra = await prisma.obra.update({
            where: { id: params.id },
            data: { estado: 'CANCELADA' }
        })

        return NextResponse.json(obra)
    } catch (error) {
        console.error('[OBRA_DELETE]', error)
        return new NextResponse('Internal Error', { status: 500 })
    }
}
