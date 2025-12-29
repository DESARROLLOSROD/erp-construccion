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
 * Robust text extraction from PDF focusing on the project's specific pdf-parse-plus/Kozan version
 * Version 4.x of pdfjs-dist (internal) changed some behaviors.
 */
async function extractTextFromPDF(buffer: Buffer): Promise<string> {
    try {
        console.log('--- Attempting PDF Text Extraction (Robust Mode) ---')

        // Strategy 1: The specific PDFParse class seen in logs
        if (pdf && pdf.PDFParse) {
            try {
                console.log('Trying PDFParse class extraction...')
                // NOTE: DO NOT set global.navigator, it is read-only in many Next.js environments

                const parser = new pdf.PDFParse();
                const result = await parser.parse(buffer);
                return result?.text || result?.content || '';
            } catch (e1: any) {
                console.warn('PDFParse class failed:', e1.message);
            }
        }

        // Strategy 2: Traditional function call
        if (typeof pdf === 'function') {
            try {
                console.log('Trying traditional function extraction...')
                const result = await pdf(buffer);
                return result?.text || '';
            } catch (e2: any) {
                console.warn('Traditional function failed:', e2.message);
            }
        }

        // Strategy 3: default export
        if (pdf && pdf.default && typeof pdf.default === 'function') {
            try {
                console.log('Trying default export extraction...')
                const result = await pdf.default(buffer);
                return result?.text || '';
            } catch (e3: any) {
                console.warn('Default export failed:', e3.message);
            }
        }

        console.error('All pdf-parse strategies failed. Keys available:', Object.keys(pdf));
        return '';
    } catch (error) {
        console.error('Final error in extractTextFromPDF:', error);
        return '';
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
        throw new Error('El PDF no contiene texto legible (posiblemente escaneado) y gpt-4o requiere texto.')
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
                Texto extraído:
                
                ${extractedText}

Retorna SOLO un JSON válido:
{
  "rfc": "string",
  "razonSocial": "string",
  "regimenFiscal": "string",
  "codigoPostal": "string",
  "direccion": "string"
}`
            },
        ],
        temperature: 0.1,
    })

    return parseAIResponse(completion.choices[0]?.message?.content || '{}')
}

/**
 * Extract data from CSF PDF using Anthropic Claude
 */
async function extractWithClaude(base64PDF: string): Promise<ExtractedCSFData> {
    const apiKey = process.env.ANTHROPIC_API_KEY
    if (!apiKey) throw new Error('Anthropic API key not configured')

    const anthropic = new Anthropic({ apiKey })

    // Given the date is late 2025, we try newer models and broad aliases
    const models = [
        'claude-3-5-sonnet-latest',
        'claude-3-5-sonnet-20241022',
        'claude-3-sonnet-20240229',
        'claude-3-opus-latest'
    ]
    let lastErr = null

    for (const model of models) {
        try {
            console.log(`Intentando Claude con modelo: ${model}...`)
            const message = await anthropic.messages.create({
                model: model,
                max_tokens: 1024,
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
                                text: `Extrae la siguiente información de esta Constancia de Situación Fiscal (CSF) del SAT de México:
- RFC
- Denominación o Razón Social
- Régimen Fiscal (Código y descripción)
- Código Postal
- Dirección completa (Calle, número, colonia, municipio/alcaldía, estado)

Responde SOLO un JSON válido con esta estructura:
{
  "rfc": "string",
  "razonSocial": "string",
  "regimenFiscal": "string",
  "codigoPostal": "string",
  "direccion": "string"
}`
                            }
                        ],
                    }
                ],
            })

            const responseText = message.content[0]?.type === 'text' ? message.content[0].text : '{}'
            return parseAIResponse(responseText)
        } catch (e: any) {
            console.warn(`Claude ${model} falló:`, e.message)
            lastErr = e
            if (e.status === 404) continue
            break
        }
    }

    // Fallback to Haiku with text
    console.log('Intentando fallback a Claude Haiku con texto extraído...')
    const buffer = Buffer.from(base64PDF, 'base64')
    const text = await extractTextFromPDF(buffer)
    if (text) {
        try {
            const message = await anthropic.messages.create({
                model: 'claude-3-haiku-20240307',
                max_tokens: 1024,
                messages: [{ role: 'user', content: `Extrae datos fiscales (JSON) de este texto: ${text}` }]
            })
            const responseText = message.content[0]?.type === 'text' ? message.content[0].text : '{}'
            return parseAIResponse(responseText)
        } catch (haikuErr: any) {
            console.error('Haiku fallback failed:', haikuErr.message)
        }
    }

    throw lastErr || new Error('Claude no pudo procesar el documento.')
}

/**
 * Extract data from CSF PDF using Google Gemini (Using models found in the account list)
 */
async function extractWithGemini(base64PDF: string): Promise<ExtractedCSFData> {
    const apiKey = process.env.GOOGLE_API_KEY
    if (!apiKey) throw new Error('Google API key not configured')

    const genAI = new GoogleGenerativeAI(apiKey)

    // Updated models found in the user's specific account list (Dec 2025)
    const models = [
        'gemini-2.0-flash',
        'gemini-2.0-flash-lite',
        'gemini-2.5-flash',
        'gemini-flash-latest'
    ]
    let lastErr = null

    for (const modelName of models) {
        try {
            console.log(`Intentando Gemini con modelo: ${modelName}...`)
            const model = genAI.getGenerativeModel({ model: modelName })
            const result = await model.generateContent([
                {
                    inlineData: {
                        mimeType: 'application/pdf',
                        data: base64PDF,
                    },
                },
                `Extrae la siguiente información de esta Constancia de Situación Fiscal del SAT de México:
- RFC
- Denominación o Razón Social
- Régimen Fiscal
- Código Postal
- Dirección completa

Responde SOLO con un objeto JSON válido que contenga estas llaves: rfc, razonSocial, regimenFiscal, codigoPostal, direccion. Si no encuentras algo, deja la cadena vacía.`
            ])

            const responseText = result.response.text()
            return parseAIResponse(responseText)
        } catch (e: any) {
            console.warn(`Gemini ${modelName} falló:`, e.message)
            lastErr = e
            if (e.message.includes('404') || e.message.includes('not found')) continue
            break
        }
    }

    throw lastErr || new Error('Gemini no pudo procesar el documento.')
}

/**
 * Parse AI response and extract structured data
 * Standardizes keys from various AI naming conventions
 */
function parseAIResponse(responseText: string): ExtractedCSFData {
    const cleanedText = responseText
        .replace(/```json\n?/g, '')
        .replace(/```\n?/g, '')
        .trim()

    try {
        const data = JSON.parse(cleanedText)

        // Helper to find value regardless of case or underscores
        const getVal = (keys: string[]) => {
            for (const k of keys) {
                if (data[k] !== undefined) return data[k].toString()
                // Check lowercase
                if (data[k.toLowerCase()] !== undefined) return data[k.toLowerCase()].toString()
                // Check snake_case if camelCase
                const snake = k.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`)
                if (data[snake] !== undefined) return data[snake].toString()
            }
            return ''
        }

        const structured = {
            rfc: getVal(['rfc', 'RFC']),
            razonSocial: getVal(['razonSocial', 'razon_social', 'nombre', 'denominacion']),
            regimenFiscal: getVal(['regimenFiscal', 'regimen_fiscal', 'regimen']),
            codigoPostal: getVal(['codigoPostal', 'cp', 'codigo_postal']),
            direccion: getVal(['direccion', 'domicilio', 'direccion_fiscal']),
        }

        return structured
    } catch (e) {
        console.error('Error al parsear JSON de la IA:', responseText)
        return { rfc: '', razonSocial: '', regimenFiscal: '', codigoPostal: '', direccion: '' }
    }
}

/**
 * Main function with fallback logic
 */
export async function extractCSFDataWithFallback(
    base64PDF: string,
    preferredProvider: AIProvider = 'openai'
): Promise<{ data: ExtractedCSFData; usedProvider: AIProvider }> {
    // Current environment stability ranking: Gemini (if model fits) > OpenAI (if text works) > Anthropic
    const order: AIProvider[] = [preferredProvider]
    if (preferredProvider !== 'google') order.push('google')
    if (preferredProvider !== 'openai') order.push('openai')
    if (preferredProvider !== 'anthropic') order.push('anthropic')

    let lastError = null

    for (const provider of order) {
        try {
            console.log(`--- Iniciando extracción con ${provider} ---`)
            let data: ExtractedCSFData
            switch (provider) {
                case 'google': data = await extractWithGemini(base64PDF); break
                case 'openai': data = await extractWithOpenAI(base64PDF); break
                case 'anthropic': data = await extractWithClaude(base64PDF); break
                default: throw new Error(`Proveedor desconocido: ${provider}`)
            }
            return { data, usedProvider: provider }
        } catch (e: any) {
            console.error(`Fallo crítico con ${provider}:`, e.message)
            lastError = e
        }
    }

    throw lastError || new Error('Todos los proveedores fallaron.')
}

export async function extractCSFData(base64PDF: string, provider: AIProvider): Promise<ExtractedCSFData> {
    const result = await extractCSFDataWithFallback(base64PDF, provider)
    return result.data
}
