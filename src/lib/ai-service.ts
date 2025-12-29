import OpenAI from 'openai'
import Anthropic from '@anthropic-ai/sdk'
import { GoogleGenerativeAI } from '@google/generative-ai'

// Use require for pdf-parse as it is a CommonJS module
const pdf = require('pdf-parse')

export type AIProvider = 'openai' | 'anthropic' | 'google'

interface ExtractedCSFData {
    rfc: string
    razonSocial: string
    regimenFiscal: string
    codigoPostal: string
    direccion: string
}

/**
 * Helper to extract text from PDF using the project's specific pdf-parse structure
 */
async function extractTextFromPDF(buffer: Buffer): Promise<string> {
    try {
        // Based on technical diagnostics, this version uses a static .parse method on the PDFParse class
        console.log('Attempting PDF text extraction...')

        let pdfData;
        if (pdf && pdf.PDFParse && typeof pdf.PDFParse.parse === 'function') {
            pdfData = await pdf.PDFParse.parse(buffer)
        } else if (typeof pdf === 'function') {
            pdfData = await pdf(buffer)
        } else if (pdf.default && typeof pdf.default === 'function') {
            pdfData = await pdf.default(buffer)
        } else {
            console.error('No recognized pdf-parse entry point found in:', Object.keys(pdf))
            throw new Error('No se encontró el punto de entrada de pdf-parse.')
        }

        return pdfData?.text || pdfData?.content || ''
    } catch (error) {
        console.error('Error in extractTextFromPDF:', error)
        throw new Error('Error al extraer texto del documento PDF.')
    }
}

/**
 * Extract data from CSF PDF using OpenAI
 */
async function extractWithOpenAI(base64PDF: string): Promise<ExtractedCSFData> {
    const apiKey = process.env.OPENAI_API_KEY
    if (!apiKey) throw new Error('OpenAI API key not configured')

    const buffer = Buffer.from(base64PDF, 'base64')
    const extractedText = await extractTextFromPDF(buffer)

    if (!extractedText || extractedText.trim().length === 0) {
        throw new Error('El PDF no contiene texto legible para OpenAI.')
    }

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
                content: `Extrae la siguiente información de esta Constancia de Situación Fiscal del SAT de México. 
                Aquí está el texto extraído del PDF:
                
                ${extractedText}

Retorna SOLO un JSON válido con esta estructura exacta (sin markdown, sin explicaciones):
{
  "rfc": "string (RFC completo)",
  "razonSocial": "string (nombre o razón social completa)",
  "regimenFiscal": "string (código y descripción del régimen fiscal)",
  "codigoPostal": "string (código postal de 5 dígitos)",
  "direccion": "string (direccion fiscal completa)"
}

Si no encuentras algún dato, usa una cadena vacía "".`
            },
        ],
        temperature: 0.1,
    })

    const responseText = completion.choices[0]?.message?.content || '{}'
    return parseAIResponse(responseText)
}

/**
 * Extract data from CSF PDF using Anthropic Claude
 */
async function extractWithClaude(base64PDF: string): Promise<ExtractedCSFData> {
    const apiKey = process.env.ANTHROPIC_API_KEY
    if (!apiKey) throw new Error('Anthropic API key not configured')

    const anthropic = new Anthropic({ apiKey })

    // Try models in order of capability and PDF support
    const attempts = [
        { model: 'claude-3-5-sonnet-20241022', supportsPDF: true },
        { model: 'claude-3-5-sonnet-20240620', supportsPDF: true },
        { model: 'claude-3-haiku-20240307', supportsPDF: false }
    ]

    let latestError = null

    for (const attempt of attempts) {
        try {
            console.log(`Trying Claude model: ${attempt.model}...`)

            let content: any[] = []

            if (attempt.supportsPDF) {
                content = [
                    {
                        type: 'document',
                        source: {
                            type: 'base64',
                            media_type: 'application/pdf',
                            data: base64PDF,
                        },
                    },
                    {
                        type: 'text',
                        text: `Extrae la siguiente información de esta Constancia de Situación Fiscal. Retorna SOLO JSON.`
                    }
                ]
            } else {
                // For models that don't support PDF, extract text first
                const buffer = Buffer.from(base64PDF, 'base64')
                const extractedText = await extractTextFromPDF(buffer)
                content = [
                    {
                        type: 'text',
                        text: `Extrae la siguiente información del texto: ${extractedText}. Retorna SOLO JSON.`
                    }
                ]
            }

            const message = await anthropic.messages.create({
                model: attempt.model,
                max_tokens: 1024,
                messages: [
                    {
                        role: 'user',
                        content: content
                    }
                ],
                system: 'Eres un extractor de datos fiscales. Responde siempre con JSON estructurado según se solicita, sin texto adicional.'
            })

            const responseText = message.content[0]?.type === 'text' ? message.content[0].text : '{}'
            return parseAIResponse(responseText)
        } catch (error: any) {
            console.warn(`Claude ${attempt.model} failed:`, error.message)
            latestError = error
            // Continue if it's a 404 (model not found) or 400 (PDF not supported)
            if (error.status === 404 || (error.status === 400 && attempt.supportsPDF)) {
                continue
            }
            throw error // Stop for other errors like Auth
        }
    }

    throw latestError || new Error('All Claude models failed')
}

/**
 * Extract data from CSF PDF using Google Gemini
 */
async function extractWithGemini(base64PDF: string): Promise<ExtractedCSFData> {
    const apiKey = process.env.GOOGLE_API_KEY
    if (!apiKey) {
        console.warn('Google API key not configured, skipping Gemini...')
        throw new Error('Google API key not configured')
    }

    const genAI = new GoogleGenerativeAI(apiKey)
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' })

    const result = await model.generateContent([
        {
            inlineData: {
                mimeType: 'application/pdf',
                data: base64PDF,
            },
        },
        `Extrae la siguiente información de esta Constancia de Situación Fiscal del SAT de México:

Retorna SOLO un JSON válido con esta estructura exacta (sin markdown, sin explicaciones):
{
  "rfc": "string (RFC completo)",
  "razonSocial": "string (nombre o razón social completa)",
  "regimenFiscal": "string (código y descripción del régimen fiscal)",
  "codigoPostal": "string (código postal de 5 dígitos)",
  "direccion": "string (direccion fiscal completa)"
}

Si no encuentras algún dato, usa una cadena vacía "".`,
    ])

    const responseText = result.response.text()
    return parseAIResponse(responseText)
}

/**
 * Parse AI response and extract structured data
 */
function parseAIResponse(responseText: string): ExtractedCSFData {
    // Remove markdown code blocks if present
    const cleanedText = responseText
        .replace(/```json\n?/g, '')
        .replace(/```\n?/g, '')
        .trim()

    try {
        const data = JSON.parse(cleanedText)
        return {
            rfc: (data.rfc || '').toString(),
            razonSocial: (data.razonSocial || '').toString(),
            regimenFiscal: (data.regimenFiscal || '').toString(),
            codigoPostal: (data.codigoPostal || '').toString(),
            direccion: (data.direccion || '').toString(),
        }
    } catch (e) {
        console.error('Failed to parse AI JSON response:', responseText)
        throw new Error('Respuesta de la IA no es un JSON válido.')
    }
}

/**
 * Main function to extract CSF data using specified AI provider
 */
export async function extractCSFData(
    base64PDF: string,
    provider: AIProvider = 'openai'
): Promise<ExtractedCSFData> {
    try {
        switch (provider) {
            case 'openai':
                return await extractWithOpenAI(base64PDF)
            case 'anthropic':
                return await extractWithClaude(base64PDF)
            case 'google':
                return await extractWithGemini(base64PDF)
            default:
                throw new Error(`Unknown AI provider: ${provider}`)
        }
    } catch (error) {
        console.error(`Error with ${provider}:`, error)
        throw error
    }
}

/**
 * Extract CSF data with automatic fallback to other providers
 */
export async function extractCSFDataWithFallback(
    base64PDF: string,
    preferredProvider: AIProvider = 'openai'
): Promise<{ data: ExtractedCSFData; usedProvider: AIProvider }> {
    const providers: AIProvider[] = [preferredProvider]

    // Add fallback providers
    if (preferredProvider !== 'anthropic') providers.push('anthropic')
    if (preferredProvider !== 'openai') providers.push('openai')
    if (preferredProvider !== 'google') providers.push('google')

    let lastError: Error | null = null

    for (const provider of providers) {
        try {
            console.log(`Intento de extracción con: ${provider}...`)
            const data = await extractCSFData(base64PDF, provider)
            console.log(`Extracción exitosa con: ${provider}`)
            return { data, usedProvider: provider }
        } catch (error) {
            console.warn(`Fallo con ${provider}:`, (error as Error).message)
            lastError = error as Error
            continue
        }
    }

    throw lastError || new Error('Todos los proveedores de IA fallaron')
}
