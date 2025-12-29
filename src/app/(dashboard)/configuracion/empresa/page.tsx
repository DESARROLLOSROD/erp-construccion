'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import Link from 'next/link'
import { Building, Users as UsersIcon, Upload, Link as LinkIcon, Brain } from 'lucide-react'

export default function EmpresaConfigPage() {
    const [empresa, setEmpresa] = useState<any>({})
    const [loading, setLoading] = useState(true)
    const [logoMode, setLogoMode] = useState<'url' | 'file'>('url')
    const [logoPreview, setLogoPreview] = useState('')

    useEffect(() => {
        fetch('/api/empresa')
            .then(res => res.json())
            .then(data => {
                setEmpresa(data)
                setLogoPreview(data.logo || '')
                setLoading(false)
            })
    }, [])

    const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (!file) return

        if (!file.type.startsWith('image/')) {
            alert('Solo se permiten archivos de imagen')
            return
        }

        if (file.size > 2 * 1024 * 1024) {
            alert('El archivo no debe superar 2MB')
            return
        }

        const reader = new FileReader()
        reader.onloadend = () => {
            const base64 = reader.result as string
            setEmpresa({ ...empresa, logo: base64 })
            setLogoPreview(base64)
        }
        reader.readAsDataURL(file)
    }

    const handleUrlChange = (url: string) => {
        setEmpresa({ ...empresa, logo: url })
        setLogoPreview(url)
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        try {
            const res = await fetch('/api/empresa', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(empresa)
            })
            if (res.ok) alert('Datos actualizados correctamente')
        } catch (err) {
            console.error(err)
            alert('Error al guardar')
        }
    }

    return (
        <div className="space-y-6">
            <h1 className="text-3xl font-bold">Configuración</h1>

            <div className="flex gap-4 border-b pb-1">
                <Link href="/configuracion/empresa" className="flex items-center gap-2 px-4 py-2 border-b-2 border-black font-semibold">
                    <Building className="h-4 w-4" /> Empresa
                </Link>
                <Link href="/configuracion/usuarios" className="flex items-center gap-2 px-4 py-2 text-gray-500 hover:text-black">
                    <UsersIcon className="h-4 w-4" /> Usuarios
                </Link>
            </div>

            <Card className="max-w-2xl">
                <CardHeader>
                    <CardTitle>Perfil de Empresa</CardTitle>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div>
                            <Label>Razón Social</Label>
                            <Input
                                value={empresa.razonSocial || ''}
                                onChange={e => setEmpresa({ ...empresa, razonSocial: e.target.value })}
                            />
                        </div>

                        {/* AI Provider Selection */}
                        <div className="space-y-2 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                            <div className="flex items-center gap-2 mb-2">
                                <Brain className="h-5 w-5 text-blue-600" />
                                <Label className="text-blue-900 font-semibold">Proveedor de Inteligencia Artificial</Label>
                            </div>
                            <p className="text-xs text-blue-700 mb-3">
                                Selecciona qué IA usar para extracción de documentos y asistente virtual
                            </p>
                            <Select
                                value={empresa.aiProvider || 'openai'}
                                onValueChange={(value) => setEmpresa({ ...empresa, aiProvider: value })}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Seleccionar proveedor" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="openai">
                                        <div className="flex items-center gap-2">
                                            <span>🤖</span>
                                            <div>
                                                <div className="font-medium">ChatGPT (OpenAI)</div>
                                                <div className="text-xs text-gray-500">Rápido y preciso - Costo medio</div>
                                            </div>
                                        </div>
                                    </SelectItem>
                                    <SelectItem value="anthropic">
                                        <div className="flex items-center gap-2">
                                            <span>🧠</span>
                                            <div>
                                                <div className="font-medium">Claude (Anthropic)</div>
                                                <div className="text-xs text-gray-500">Mejor para documentos - Costo medio</div>
                                            </div>
                                        </div>
                                    </SelectItem>
                                    <SelectItem value="google">
                                        <div className="flex items-center gap-2">
                                            <span>✨</span>
                                            <div>
                                                <div className="font-medium">Gemini (Google)</div>
                                                <div className="text-xs text-gray-500">Gratis hasta límite - Buena precisión</div>
                                            </div>
                                        </div>
                                    </SelectItem>
                                </SelectContent>
                            </Select>
                            <p className="text-xs text-gray-600 mt-2">
                                💡 El sistema intentará usar el proveedor seleccionado y cambiará automáticamente a otro si falla
                            </p>
                        </div>

                        <div>
                            <Label>Logo de la Empresa</Label>

                            {/* Preview */}
                            {logoPreview && (
                                <div className="flex justify-center p-4 bg-gray-50 rounded border">
                                    <img src={logoPreview} alt="Logo" className="max-h-32 object-contain" />
                                </div>
                            )}

                            {/* Mode Tabs */}
                            <div className="flex gap-2 border-b">
                                <button
                                    type="button"
                                    className={`px-4 py-2 text-sm font-medium border-b-2 transition ${logoMode === 'url' ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500'
                                        }`}
                                    onClick={() => setLogoMode('url')}
                                >
                                    <LinkIcon className="h-4 w-4 inline mr-1" /> URL
                                </button>
                                <button
                                    type="button"
                                    className={`px-4 py-2 text-sm font-medium border-b-2 transition ${logoMode === 'file' ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500'
                                        }`}
                                    onClick={() => setLogoMode('file')}
                                >
                                    <Upload className="h-4 w-4 inline mr-1" /> Subir Archivo
                                </button>
                            </div>

                            {/* URL Input */}
                            {logoMode === 'url' && (
                                <div>
                                    <Input
                                        type="url"
                                        placeholder="https://ejemplo.com/logo.png"
                                        value={empresa.logo || ''}
                                        onChange={e => handleUrlChange(e.target.value)}
                                    />
                                    <p className="text-xs text-gray-500 mt-1">Ingresa la URL de una imagen</p>
                                </div>
                            )}

                            {/* File Upload */}
                            {logoMode === 'file' && (
                                <div>
                                    <Input
                                        type="file"
                                        accept="image/*"
                                        onChange={handleFileUpload}
                                    />
                                    <p className="text-xs text-gray-500 mt-1">Máximo 2MB. Formatos: PNG, JPG, SVG</p>
                                </div>
                            )}
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <Label>RFC</Label>
                                <Input
                                    value={empresa.rfc || ''}
                                    onChange={e => setEmpresa({ ...empresa, rfc: e.target.value })}
                                />
                            </div>
                            <div>
                                <Label>Teléfono</Label>
                                <Input
                                    value={empresa.telefono || ''}
                                    onChange={e => setEmpresa({ ...empresa, telefono: e.target.value })}
                                />
                            </div>
                        </div>

                        <div>
                            <Label>Dirección Fiscal</Label>
                            <Input
                                value={empresa.direccion || ''}
                                onChange={e => setEmpresa({ ...empresa, direccion: e.target.value })}
                            />
                        </div>

                        <div className="pt-4 border-t">
                            <Label className="text-blue-600">Integración con Inteligencia Artificial</Label>
                            <p className="text-xs text-gray-500 mb-2">Ingresa tu API Key de OpenAI para activar el Chatbot.</p>
                            <Input
                                type="password"
                                value={empresa.openaiApiKey || ''}
                                onChange={e => setEmpresa({ ...empresa, openaiApiKey: e.target.value })}
                                placeholder="sk-..."
                            />
                        </div>

                        <Button type="submit" className="w-full">
                            Guardar Cambios
                        </Button>
                    </form>
                </CardContent>
            </Card>
        </div>
    )
}
