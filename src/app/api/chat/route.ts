import { createOpenAI } from '@ai-sdk/openai'
import { streamText } from 'ai'
import { prisma } from '@/lib/prisma'
import { NextRequest } from 'next/server'
import { cookies } from 'next/headers'
import { createServerClient } from '@supabase/ssr'

export async function POST(req: NextRequest) {
    try {
        const cookieStore = cookies()
        const supabase = createServerClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
            {
                cookies: {
                    get(name: string) { return cookieStore.get(name)?.value },
                },
            }
        )

        const { data: { session } } = await supabase.auth.getSession()
        if (!session) return new Response('Unauthorized', { status: 401 })

        // Get User Company context
        const userEmpresa = await prisma.usuarioEmpresa.findFirst({
            where: { usuario: { authId: session.user.id }, activo: true },
            include: { empresa: true }
        })

        if (!userEmpresa || !userEmpresa.empresa.openaiApiKey) {
            return new Response('API Key no configurada en la empresa.', { status: 400 })
        }

        // Create Custom OpenAI Provider with User's Key
        const openai = createOpenAI({
            apiKey: userEmpresa.empresa.openaiApiKey
        })

        const { messages } = await req.json()

        // --- Context Injection ---
        // 1. Financial Summary (Last Month)
        const today = new Date()
        const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1)

        const transacciones = await prisma.transaccion.findMany({
            where: {
                cuenta: { empresaId: userEmpresa.empresaId },
                fecha: { gte: startOfMonth }
            }
        })

        const ingresos = transacciones
            .filter(t => t.tipo === 'INGRESO')
            .reduce((sum, t) => sum + Number(t.monto), 0)

        const egresos = transacciones
            .filter(t => t.tipo === 'EGRESO')
            .reduce((sum, t) => sum + Number(t.monto), 0)

        // 2. Low Stock
        const lowStock = await prisma.producto.findMany({
            where: {
                empresaId: userEmpresa.empresaId,
                stockActual: { lte: 0 }
            },
            take: 5,
            select: { nombre: true, stockActual: true }
        })
        const lowStockStr = lowStock.map(p => `${p.nombre} (${p.stockActual})`).join(', ')

        const systemPrompt = `
        Eres un asistente experto en ERP para constructoras ('ERP Construcción MX').
        Tienes acceso a los siguientes datos en tiempo real de la empresa '${userEmpresa.empresa.razonSocial}':
        
        - Finanzas (Mes Actual): Ingresos $${ingresos}, Egresos $${egresos}, Utilidad $${ingresos - egresos}.
        - Alertas de Inventario: ${lowStock.length > 0 ? 'Productos agotados: ' + lowStockStr : 'Inventario saludable'}.
        
        Responde preguntas sobre estos datos. Si te preguntan algo fuera de este contexto, di que solo tienes acceso a finanzas e inventario por ahora.
        Se breve y profesional.
        `

        const result = await streamText({
            model: openai('gpt-3.5-turbo'),
            messages: messages.map((m: any) => ({
                role: m.role,
                content: m.content
            })),
            system: systemPrompt,
        })

        return result.toDataStreamResponse()

    } catch (error) {
        console.error('Chat Error:', error)
        return new Response('Error procesando tu solicitud', { status: 500 })
    }
}
