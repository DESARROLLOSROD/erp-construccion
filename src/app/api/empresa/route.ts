import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { withRole, handleApiError, successResponse } from '@/lib/api-utils'

export async function GET(request: NextRequest) {
    return withRole(['ADMIN', 'CONTADOR', 'OBRAS', 'VENTAS', 'COMPRAS'], async (req, context) => {
        try {
            const empresa = await prisma.empresa.findUnique({
                where: { id: context.empresaId }
            })
            return successResponse(empresa)
        } catch (error) {
            return handleApiError(error)
        }
    })(request, {} as any)
}

export async function PUT(request: NextRequest) {
    return withRole(['ADMIN'], async (req, context) => {
        try {
            const body = await req.json()
            // Validate body if strictly needed, or just update allowed fields

            const updated = await prisma.empresa.update({
                where: { id: context.empresaId },
                data: {
                    razonSocial: body.razonSocial,
                    rfc: body.rfc,
                    direccion: body.direccion,
                    telefono: body.telefono,
                    email: body.email,
                    logo: body.logo
                    // Add other fields as necessary
                }
            })
            return successResponse(updated)
        } catch (error) {
            return handleApiError(error)
        }
    })(request, {} as any)
}
