import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { createServerClient } from '@/lib/supabase'

export async function GET(request: Request) {
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

        // Obtener parámetros de query
        const { searchParams } = new URL(request.url)
        const estado = searchParams.get('estado')
        const clienteId = searchParams.get('clienteId')

        const obras = await prisma.obra.findMany({
            where: {
                empresaId,
                ...(estado && { estado: estado as any }),
                ...(clienteId && { clienteId }),
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
                _count: {
                    select: {
                        presupuestos: true,
                        estimaciones: true,
                        contratos: true,
                    }
                }
            },
            orderBy: { updatedAt: 'desc' }
        })

        return NextResponse.json(obras)
    } catch (error) {
        console.error('[OBRAS_GET]', error)
        return new NextResponse('Internal Error', { status: 500 })
    }
}

export async function POST(request: Request) {
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

        const {
            codigo,
            nombre,
            descripcion,
            ubicacion,
            estado,
            tipoContrato,
            fechaInicio,
            fechaFinProgramada,
            montoContrato,
            anticipoPct,
            retencionPct,
            clienteId
        } = body

        // Validaciones básicas
        if (!codigo || !nombre) {
            return new NextResponse('Código y Nombre son requeridos', { status: 400 })
        }

        // Validar duplicados de código
        const existing = await prisma.obra.findFirst({
            where: {
                empresaId,
                codigo,
            }
        })

        if (existing) {
            return new NextResponse('Ya existe una obra con este código', { status: 409 })
        }

        // Validar que el cliente pertenezca a la misma empresa
        if (clienteId) {
            const cliente = await prisma.cliente.findFirst({
                where: {
                    id: clienteId,
                    empresaId
                }
            })

            if (!cliente) {
                return new NextResponse('Cliente no encontrado o no pertenece a tu empresa', { status: 404 })
            }
        }

        const obra = await prisma.obra.create({
            data: {
                empresaId,
                codigo: codigo.toUpperCase(),
                nombre,
                descripcion,
                ubicacion,
                estado: estado || 'EN_PROCESO',
                tipoContrato: tipoContrato || 'PRECIO_ALZADO',
                fechaInicio: fechaInicio ? new Date(fechaInicio) : null,
                fechaFinProgramada: fechaFinProgramada ? new Date(fechaFinProgramada) : null,
                montoContrato: montoContrato || 0,
                anticipoPct: anticipoPct || 0,
                retencionPct: retencionPct || 0,
                clienteId: clienteId || null,
            },
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
        console.error('[OBRAS_POST]', error)
        return new NextResponse('Internal Error', { status: 500 })
    }
}
