'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import Link from 'next/link'
import { Building, Users as UsersIcon, Trash2, Plus } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

export default function UsuariosConfigPage() {
    const [usuarios, setUsuarios] = useState<any[]>([])
    const [loading, setLoading] = useState(true)

    // Invite Form
    const [newEmail, setNewEmail] = useState('')
    const [newRole, setNewRole] = useState('USUARIO')

    const fetchUsuarios = async () => {
        const res = await fetch('/api/usuarios')
        const data = await res.json()
        if (data.data) setUsuarios(data.data)
        setLoading(false)
    }

    useEffect(() => {
        fetchUsuarios()
    }, [])

    const handleInvite = async (e: React.FormEvent) => {
        e.preventDefault()
        try {
            const res = await fetch('/api/usuarios', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email: newEmail, rol: newRole })
            })
            if (res.ok) {
                setNewEmail('')
                fetchUsuarios()
                alert('Usuario vinculado (si existía)')
            } else {
                const err = await res.json()
                alert(err.error)
            }
        } catch (e) { console.error(e) }
    }

    const handleChangeRole = async (id: string, rol: string) => {
        await fetch('/api/usuarios', {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ id, rol })
        })
        // Optimistic update
        setUsuarios(usuarios.map(u => u.id === id ? { ...u, rol } : u))
    }

    const handleDelete = async (id: string) => {
        if (!confirm('¿Quitar acceso a este usuario?')) return
        await fetch(`/api/usuarios?id=${id}`, { method: 'DELETE' })
        setUsuarios(usuarios.filter(u => u.id !== id))
    }

    return (
        <div className="space-y-6">
            <h1 className="text-3xl font-bold">Configuración</h1>

            <div className="flex gap-4 border-b pb-1">
                <Link href="/configuracion/empresa" className="flex items-center gap-2 px-4 py-2 text-gray-500 hover:text-black">
                    <Building className="h-4 w-4" /> Empresa
                </Link>
                <Link href="/configuracion/usuarios" className="flex items-center gap-2 px-4 py-2 border-b-2 border-black font-semibold">
                    <UsersIcon className="h-4 w-4" /> Usuarios
                </Link>
            </div>

            <div className="grid gap-6 md:grid-cols-3">
                {/* List - Takes 2/3 */}
                <div className="md:col-span-2">
                    <Card>
                        <CardHeader>
                            <CardTitle>Usuarios del Equipo</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Usuario</TableHead>
                                        <TableHead>Rol</TableHead>
                                        <TableHead></TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {usuarios.map((u) => (
                                        <TableRow key={u.id}>
                                            <TableCell>
                                                <div className="font-medium">{u.usuario.nombre}</div>
                                                <div className="text-sm text-gray-500">{u.usuario.email}</div>
                                            </TableCell>
                                            <TableCell>
                                                <select
                                                    className="border rounded p-1 text-sm bg-transparent"
                                                    value={u.rol}
                                                    onChange={(e) => handleChangeRole(u.id, e.target.value)}
                                                >
                                                    <option value="ADMIN">Admin</option>
                                                    <option value="CONTADOR">Contador</option>
                                                    <option value="OBRAS">Obras</option>
                                                    <option value="ALMACEN">Almacén</option>
                                                    <option value="VENTAS">Ventas</option>
                                                    <option value="COMPRAS">Compras</option>
                                                    <option value="USUARIO">Usuario</option>
                                                </select>
                                            </TableCell>
                                            <TableCell>
                                                <Button
                                                    variant="ghost" size="icon" className="text-red-500"
                                                    onClick={() => handleDelete(u.id)}
                                                >
                                                    <Trash2 className="h-4 w-4" />
                                                </Button>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </CardContent>
                    </Card>
                </div>

                {/* Invite */}
                <div>
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-base">Invitar Nuevo Miembro</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <form onSubmit={handleInvite} className="space-y-4">
                                <div>
                                    <label className="text-sm font-medium">Email</label>
                                    <Input
                                        type="email"
                                        required
                                        value={newEmail}
                                        onChange={e => setNewEmail(e.target.value)}
                                    />
                                </div>
                                <div>
                                    <label className="text-sm font-medium">Rol</label>
                                    <select
                                        className="w-full border rounded p-2 text-sm"
                                        value={newRole}
                                        onChange={e => setNewRole(e.target.value)}
                                    >
                                        <option value="ADMIN">Administrador</option>
                                        <option value="CONTADOR">Contador</option>
                                        <option value="OBRAS">Jefe de Obras</option>
                                        <option value="ALMACEN">Almacenista</option>
                                        <option value="VENTAS">Ventas</option>
                                        <option value="COMPRAS">Compras</option>
                                        <option value="USUARIO">Lectura</option>
                                    </select>
                                </div>
                                <Button type="submit" className="w-full">
                                    <Plus className="h-4 w-4 mr-2" /> Agregar
                                </Button>
                                <p className="text-xs text-gray-500 text-center">
                                    El usuario debe estar registrado previamente en la plataforma.
                                </p>
                            </form>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    )
}
