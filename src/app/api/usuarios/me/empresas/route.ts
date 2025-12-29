import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getApiContext, successResponse, handleApiError } from '@/lib/api-utils'

export async function GET(request: NextRequest) {
    try {
        const context = await getApiContext(request)
        if (!context) {
            return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
        }

        const usuario = await prisma.usuario.findUnique({
            where: { id: context.usuarioId },
            include: {
                empresas: {
                    where: { activo: true },
                    include: { empresa: true }
                }
            }
        })

        if (!usuario) {
            return NextResponse.json({ error: 'Usuario no encontrado' }, { status: 404 })
        }

        // Formatear respuesta
        const empresas = usuario.empresas.map(ue => ({
            id: ue.empresa.id,
            nombre: ue.empresa.nombre,
            rfc: ue.empresa.rfc,
            rol: ue.rol,
            esActiva: ue.empresa.id === context.empresaId
        }))

        return successResponse({ data: empresas })
    } catch (error) {
        return handleApiError(error)
    }
}
