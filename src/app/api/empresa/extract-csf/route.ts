import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { createServerClient } from '@supabase/ssr'
import OpenAI from 'openai'

export async function POST(req: NextRequest) {
    try {
        const cookieStore = cookies()
        const supabase = createServerClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
            {
                cookies: {
                    get(name: string) {
                        return cookieStore.get(name)?.value
                    },
                },
            }
        )

        const {
            data: { session },
        } = await supabase.auth.getSession()
        if (!session) {
            return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
        }

        // Get form data with PDF file
        const formData = await req.formData()
        const file = formData.get('file') as File

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

        // Use OpenAI API key from environment
        const apiKey = process.env.OPENAI_API_KEY

        if (!apiKey) {
            return NextResponse.json(
                { error: 'No se ha configurado la API Key de OpenAI en el servidor' },
                { status: 500 }
            )
        }

        // Use OpenAI to extract structured data directly from PDF
        const openai = new OpenAI({ apiKey })

        const completion = await openai.chat.completions.create({
            model: 'gpt-4o',
            messages: [
                {
                    role: 'system',
                    content: 'Eres un asistente experto en extraer datos fiscales de documentos del SAT de México. Retornas SOLO JSON válido, sin markdown ni explicaciones.',
                },
                {
                    role: 'user',
                    content: [
                        {
                            type: 'text',
                            text: `Extrae la siguiente información de esta Constancia de Situación Fiscal del SAT de México:

Retorna SOLO un JSON válido con esta estructura exacta (sin markdown, sin explicaciones):
{
  "rfc": "string (RFC completo)",
  "razonSocial": "string (nombre o razón social completa)",
  "regimenFiscal": "string (código y descripción del régimen fiscal)",
  "codigoPostal": "string (código postal de 5 dígitos)",
  "direccion": "string (dirección fiscal completa)"
}

Si no encuentras algún dato, usa una cadena vacía "".`
                        },
                        {
                            type: 'image_url',
                            image_url: {
                                url: `data:application/pdf;base64,${base64PDF}`,
                            },
                        },
                    ],
                },
            ],
            temperature: 0.1,
            max_tokens: 500,
        })

        const responseText = completion.choices[0]?.message?.content || '{}'

        // Parse JSON response
        let extractedData
        try {
            // Remove markdown code blocks if present
            const cleanedText = responseText.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim()
            extractedData = JSON.parse(cleanedText)
        } catch (parseError) {
            console.error('Error parsing OpenAI response:', responseText)
            return NextResponse.json(
                { error: 'Error al procesar la respuesta de IA' },
                { status: 500 }
            )
        }

        return NextResponse.json({
            success: true,
            data: {
                rfc: extractedData.rfc || '',
                razonSocial: extractedData.razonSocial || '',
                regimenFiscal: extractedData.regimenFiscal || '',
                codigoPostal: extractedData.codigoPostal || '',
                direccion: extractedData.direccion || '',
            },
        })
    } catch (error) {
        console.error('Error extracting CSF data:', error)
        return NextResponse.json(
            { error: 'Error al procesar el PDF' },
            { status: 500 }
        )
    }
}
