import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getApiContext } from '@/lib/api-utils'

export async function POST(request: NextRequest) {
    try {
        const { empresaId } = await request.json()
        if (!empresaId) {
            return NextResponse.json({ error: 'empresaId es requerido' }, { status: 400 })
        }

        const context = await getApiContext(request)
        if (!context) {
            return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
        }

        // Verificar que el usuario tenga acceso a esa empresa
        const vinculacion = await prisma.usuarioEmpresa.findUnique({
            where: {
                usuarioId_empresaId: {
                    usuarioId: context.usuarioId,
                    empresaId: empresaId
                }
            }
        })

        if (!vinculacion || !vinculacion.activo) {
            return NextResponse.json({ error: 'No tienes acceso a esta empresa' }, { status: 403 })
        }

        // Establecer cookie
        const response = NextResponse.json({ success: true })
        response.cookies.set('active_empresa_id', empresaId, {
            path: '/',
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            maxAge: 60 * 60 * 24 * 30 // 30 días
        })

        return response
    } catch (error) {
        console.error('[API Switch Empresa]', error)
        return NextResponse.json({ error: 'Error interno' }, { status: 500 })
    }
}
