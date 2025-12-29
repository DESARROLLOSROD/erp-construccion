import { NextRequest, NextResponse } from 'next/server'
import { extractCSFDataWithFallback, type AIProvider } from '@/lib/ai-service'

export async function POST(req: NextRequest) {
    try {
        // No authentication required - this is used during company registration
        // before the user has a company associated

        // Get form data with PDF file
        const formData = await req.formData()
        const file = formData.get('file') as File
        const provider = (formData.get('provider') as AIProvider) || 'openai'

        if (!file) {
            return NextResponse.json({ error: 'No se proporcionó archivo' }, { status: 400 })
        }

        // Validate file type
        if (file.type !== 'application/pdf') {
            return NextResponse.json({ error: 'El archivo debe ser PDF' }, { status: 400 })
        }

        // Validate file size (max 5MB)
        if (file.size > 5 * 1024 * 1024) {
            return NextResponse.json({ error: 'El archivo no debe superar 5MB' }, { status: 400 })
        }

        // Convert file to base64
        const arrayBuffer = await file.arrayBuffer()
        const buffer = Buffer.from(arrayBuffer)
        const base64PDF = buffer.toString('base64')

        // Extract data using AI service with fallback
        const { data, usedProvider } = await extractCSFDataWithFallback(base64PDF, provider)

        return NextResponse.json({
            success: true,
            data,
            usedProvider, // Informar qué proveedor se usó
        })
    } catch (error) {
        console.error('Error extracting CSF data:', error)
        return NextResponse.json(
            { error: 'Error al procesar el PDF. Verifica que sea una CSF válida del SAT.' },
            { status: 500 }
        )
    }
}
