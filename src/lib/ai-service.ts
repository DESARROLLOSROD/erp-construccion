import OpenAI from 'openai'
import Anthropic from '@anthropic-ai/sdk'
import { GoogleGenerativeAI } from '@google/generative-ai'
import pdf from 'pdf-parse'

export type AIProvider = 'openai' | 'anthropic' | 'google'

interface ExtractedCSFData {
    rfc: string
    razonSocial: string
    regimenFiscal: string
    codigoPostal: string
    direccion: string
}

/**
 * Extract data from CSF PDF using OpenAI
 */
async function extractWithOpenAI(base64PDF: string): Promise<ExtractedCSFData> {
    const apiKey = process.env.OPENAI_API_KEY
    if (!apiKey) throw new Error('OpenAI API key not configured')

    // Convert base64 PDF to buffer and extract text
    const pdfBuffer = Buffer.from(base64PDF, 'base64')
    const pdfData = await pdf(pdfBuffer)
    const pdfText = pdfData.text

    const openai = new OpenAI({ apiKey })

    const completion = await openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [
            {
                role: 'system',
                content: 'Eres un asistente experto en extraer datos fiscales de documentos del SAT de México. Retornas SOLO JSON válido, sin markdown ni explicaciones.',
            },
            {
                role: 'user',
                content: `Extrae la siguiente información de esta Constancia de Situación Fiscal del SAT de México:

Retorna SOLO un JSON válido con esta estructura exacta (sin markdown, sin explicaciones):
{
  "rfc": "string (RFC completo)",
  "razonSocial": "string (nombre o razón social completa)",
  "regimenFiscal": "string (código y descripción del régimen fiscal)",
  "codigoPostal": "string (código postal de 5 dígitos)",
  "direccion": "string (dirección fiscal completa)"
}

Si no encuentras algún dato, usa una cadena vacía "".

Texto extraído del PDF:
${pdfText}`
            },
        ],
        temperature: 0.1,
        max_tokens: 500,
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

    const message = await anthropic.messages.create({
        model: 'claude-3-5-sonnet-20241022',
        max_tokens: 500,
        messages: [
            {
                role: 'user',
                content: [
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
                ],
            },
        ],
    })

    const responseText = message.content[0]?.type === 'text' ? message.content[0].text : '{}'
    return parseAIResponse(responseText)
}

/**
 * Extract data from CSF PDF using Google Gemini
 */
async function extractWithGemini(base64PDF: string): Promise<ExtractedCSFData> {
    const apiKey = process.env.GOOGLE_API_KEY
    if (!apiKey) throw new Error('Google API key not configured')

    const genAI = new GoogleGenerativeAI(apiKey)
    const model = genAI.getGenerativeModel({ model: 'gemini-pro-vision' })

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
  "direccion": "string (dirección fiscal completa)"
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

    const data = JSON.parse(cleanedText)

    return {
        rfc: data.rfc || '',
        razonSocial: data.razonSocial || '',
        regimenFiscal: data.regimenFiscal || '',
        codigoPostal: data.codigoPostal || '',
        direccion: data.direccion || '',
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
            const data = await extractCSFData(base64PDF, provider)
            return { data, usedProvider: provider }
        } catch (error) {
            console.warn(`Failed with ${provider}, trying next...`)
            lastError = error as Error
            continue
        }
    }

    throw lastError || new Error('All AI providers failed')
}
