'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Separator } from '@/components/ui/separator'
import { User } from '@supabase/supabase-js'
import { LogOut, Bell, Search, Building, ChevronDown, Check } from 'lucide-react'

interface HeaderProps {
  user: User
}

export function Header({ user }: HeaderProps) {
  const router = useRouter()
  const [empresas, setEmpresas] = useState<any[]>([])
  const [activeEmpresa, setActiveEmpresa] = useState<any>(null)
  const [isDropdownOpen, setIsDropdownOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    fetch('/api/usuarios/me/empresas')
      .then(res => res.json())
      .then(data => {
        if (data.data) {
          setEmpresas(data.data)
          const active = data.data.find((e: any) => e.esActiva)
          setActiveEmpresa(active || data.data[0])
        }
      })
      .catch(err => console.error('[Header] Fetch error:', err))
  }, [])

  // Cerrar al hacer clic afuera
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleSwitchEmpresa = async (empresaId: string) => {
    if (empresaId === activeEmpresa?.id) return

    try {
      const res = await fetch('/api/usuarios/switch-empresa', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ empresaId })
      })
      if (res.ok) {
        window.location.reload()
      }
    } catch (e) {
      console.error(e)
    }
  }

  const handleLogout = async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/login')
    router.refresh()
  }

  const userInitials = user.user_metadata?.nombre
    ? `${user.user_metadata.nombre.charAt(0)}${user.user_metadata.apellidos?.charAt(0) || ''}`
    : user.email?.substring(0, 2).toUpperCase()

  return (
    <header className="sticky top-0 z-40 bg-white border-b shadow-sm">
      <div className="flex h-16 items-center justify-between px-6">
        {/* Búsqueda */}
        <div className="flex items-center flex-1 max-w-md">
          <div className="relative w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input
              type="search"
              placeholder="Buscar obras, clientes, facturas..."
              className="w-full h-10 pl-10 pr-4 rounded-lg bg-slate-100 border-0 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all font-medium"
            />
          </div>
        </div>

        {/* Acciones */}
        <div className="flex items-center gap-2">

          {/* Selector de Empresa Premium */}
          {activeEmpresa && (
            <div className="relative" ref={dropdownRef}>
              <button
                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                className="flex items-center gap-3 px-3 py-1.5 hover:bg-slate-50 transition-colors rounded-lg group border border-transparent hover:border-slate-200"
              >
                <div className="flex flex-col items-end">
                  <span className="text-sm font-bold text-slate-800 leading-tight">
                    {activeEmpresa.nombre}
                  </span>
                  <span className="text-[10px] text-slate-500 font-medium uppercase tracking-wider">
                    Empresa Activa
                  </span>
                </div>
                <div className="bg-slate-100 p-1.5 rounded-md group-hover:bg-slate-200 transition-colors">
                  <Building className="h-4 w-4 text-slate-600" />
                </div>
                <ChevronDown className={`h-4 w-4 text-slate-400 transition-transform ${isDropdownOpen ? 'rotate-180' : ''}`} />
              </button>

              {isDropdownOpen && (
                <div className="absolute right-0 mt-2 w-64 bg-white border rounded-xl shadow-xl overflow-hidden animate-in fade-in zoom-in duration-200 z-50">
                  <div className="p-2 border-b bg-slate-50">
                    <p className="text-[10px] font-bold text-slate-500 uppercase px-2 py-1">Mis Empresas</p>
                  </div>
                  <div className="max-h-60 overflow-y-auto py-1">
                    {empresas.map((emp: any) => (
                      <button
                        key={emp.id}
                        onClick={() => handleSwitchEmpresa(emp.id)}
                        className={`w-full flex items-center justify-between px-4 py-3 text-sm hover:bg-slate-50 transition-colors ${emp.esActiva ? 'bg-blue-50/50 text-blue-700 font-semibold' : 'text-slate-600'
                          }`}
                      >
                        <div className="flex items-center gap-3">
                          <div className={`p-1.5 rounded-md ${emp.esActiva ? 'bg-blue-100' : 'bg-slate-100'}`}>
                            <Building className="h-4 w-4" />
                          </div>
                          <div className="text-left">
                            <p className="leading-none mb-1">{emp.nombre}</p>
                            <p className="text-[10px] text-slate-400 font-normal">{emp.rfc}</p>
                          </div>
                        </div>
                        {emp.esActiva && <Check className="h-4 w-4" />}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          <Separator orientation="vertical" className="h-8 mx-2 hidden md:block" />

          {/* Notificaciones */}
          <Button variant="ghost" size="icon" className="relative text-slate-500 hover:text-slate-800">
            <Bell className="h-5 w-5" />
            <span className="absolute top-2 right-2 h-2 w-2 rounded-full bg-red-500 border-2 border-white" />
          </Button>

          {/* Usuario con Avatar */}
          <div className="flex items-center gap-3 ml-2 border-l pl-4 py-1">
            <Avatar className="h-10 w-10 border-2 border-slate-100 shadow-sm ring-primary/10 ring-2 ring-offset-0">
              <AvatarImage src={user.user_metadata?.avatar_url} />
              <AvatarFallback className="bg-slate-900 text-white text-xs font-bold leading-none">
                {userInitials}
              </AvatarFallback>
            </Avatar>
            <div className="hidden lg:block">
              <p className="text-sm font-bold text-slate-800 leading-none mb-1">
                {user.user_metadata?.nombre || 'Mi Perfil'}
              </p>
              <p className="text-[11px] text-slate-500 truncate max-w-[120px]">
                {user.email}
              </p>
            </div>
          </div>

          {/* Logout */}
          <Button
            variant="ghost"
            size="icon"
            onClick={handleLogout}
            className="text-slate-400 hover:text-red-500 hover:bg-red-50 transition-all ml-1"
          >
            <LogOut className="h-5 w-5" />
          </Button>
        </div>
      </div>
    </header>
  )
}
