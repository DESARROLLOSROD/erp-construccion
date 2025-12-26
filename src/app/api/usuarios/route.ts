import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { withRole, handleApiError, successResponse } from '@/lib/api-utils'

// GET: List users
export async function GET(request: NextRequest) {
    return withRole(['ADMIN'], async (req, context) => {
        try {
            const users = await prisma.usuarioEmpresa.findMany({
                where: { empresaId: context.empresaId },
                include: { usuario: true },
                orderBy: { createdAt: 'desc' }
            })
            return successResponse(users)
        } catch (error) {
            return handleApiError(error)
        }
    })(request, {} as any)
}

// POST: Invite (Link) User
export async function POST(request: NextRequest) {
    return withRole(['ADMIN'], async (req, context) => {
        try {
            const { email, rol } = await req.json()

            // 1. Find User by Email
            const user = await prisma.usuario.findUnique({ where: { email } })

            if (!user) {
                // In a real app we would send an invite email. 
                // Here we might create a placeholder user or error.
                // For now, let's assume the user must exist in the system (e.g. signed up via Auth provider).
                // Or we create a placeholder:
                return NextResponse.json({ error: 'Usuario no encontrado. El usuario debe registrarse primero.' }, { status: 404 })
            }

            // 2. Link to Company
            const link = await prisma.usuarioEmpresa.create({
                data: {
                    usuarioId: user.id,
                    empresaId: context.empresaId,
                    rol: rol || 'USUARIO'
                }
            })

            return successResponse(link)
        } catch (error) {
            return handleApiError(error)
        }
    })(request, {} as any)
}

// PUT: Update Role
export async function PUT(request: NextRequest) {
    return withRole(['ADMIN'], async (req, context) => {
        try {
            const { id, rol, activo } = await req.json() // id is usuarioEmpresaId

            const updated = await prisma.usuarioEmpresa.update({
                where: { id },
                data: { rol, activo }
            })
            return successResponse(updated)
        } catch (error) {
            return handleApiError(error)
        }
    })(request, {} as any)
}

// DELETE: Remove Access
export async function DELETE(request: NextRequest) {
    return withRole(['ADMIN'], async (req, context) => {
        try {
            const { searchParams } = new URL(req.url)
            const id = searchParams.get('id')
            if (!id) throw new Error('ID Requerido')

            await prisma.usuarioEmpresa.delete({
                where: { id }
            })
            return successResponse({ deleted: true })
        } catch (error) {
            return handleApiError(error)
        }
    })(request, {} as any)
}
