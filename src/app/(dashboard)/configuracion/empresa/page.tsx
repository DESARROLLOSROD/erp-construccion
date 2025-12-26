'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import Link from 'next/link'
import { Building, Users as UsersIcon } from 'lucide-react'

export default function EmpresaConfigPage() {
    const [empresa, setEmpresa] = useState<any>({})
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        fetch('/api/empresa')
            .then(res => res.json())
            .then(res => {
                if (res.data) setEmpresa(res.data)
                setLoading(false)
            })
    }, [])

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        try {
            const res = await fetch('/api/empresa', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(empresa)
            })
            if (res.ok) alert('Datos actualizados')
        } catch (err) {
            console.error(err)
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
                        <div>
                            <Label>Logo URL</Label>
                            <Input
                                value={empresa.logo || ''}
                                onChange={e => setEmpresa({ ...empresa, logo: e.target.value })}
                                placeholder="https://..."
                            />
                            {empresa.logo && <img src={empresa.logo} alt="Preview" className="h-16 mt-2 object-contain" />}
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
                        <Button type="submit">Guardar Cambios</Button>
                    </form>
                </CardContent>
            </Card>
        </div>
    )
}
