import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { createServerClient } from '@/lib/supabase'
import { handleApiError, successResponse, createdResponse } from '@/lib/api-utils'
import { z } from 'zod'

const empresaSchema = z.object({
    nombre: z.string().min(1, 'El nombre es requerido').max(100),
    rfc: z.string().min(12, 'RFC inválido').max(13, 'RFC inválido').regex(/^[A-Z&Ñ]{3,4}\d{6}[A-Z0-9]{3}$/, 'Formato de RFC inválido'),
    razonSocial: z.string().min(1, 'Razón Social requerida'),
    regimenFiscal: z.string().optional(),
    codigoPostal: z.string().optional(),
})

export async function POST(request: NextRequest) {
    try {
        const supabase = createServerClient()
        const { data: { user }, error: authError } = await supabase.auth.getUser()

        if (authError || !user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const body = await request.json()
        const data = empresaSchema.parse(body)

        // Check if RFC exists
        const existing = await prisma.empresa.findUnique({
            where: { rfc: data.rfc }
        })

        if (existing) {
            return NextResponse.json({ error: 'El RFC ya está registrado' }, { status: 400 })
        }

        // Ensure user exists in our DB (sync from Supabase Auth)
        let usuario = await prisma.usuario.findUnique({
            where: { authId: user.id }
        })

        if (!usuario) {
            console.log('[api/empresas] Sincronizando nuevo usuario:', user.email)
            usuario = await prisma.usuario.create({
                data: {
                    authId: user.id,
                    email: user.email!,
                    nombre: user.user_metadata?.nombre || user.email?.split('@')[0] || 'Usuario',
                    apellidos: user.user_metadata?.apellidos || '',
                    activo: true
                }
            })
        }

        // Transaction: Create Empresa AND Assign User as ADMIN
        const empresa = await prisma.$transaction(async (tx) => {
            const newEmpresa = await tx.empresa.create({
                data: {
                    nombre: data.nombre,
                    rfc: data.rfc,
                    razonSocial: data.razonSocial,
                    regimenFiscal: data.regimenFiscal,
                    codigoPostal: data.codigoPostal
                }
            })

            await tx.usuarioEmpresa.create({
                data: {
                    usuarioId: usuario.id,
                    empresaId: newEmpresa.id,
                    rol: 'ADMIN',
                    activo: true
                }
            })

            return newEmpresa
        })

        return createdResponse(empresa)

    } catch (error) {
        return handleApiError(error)
    }
}
