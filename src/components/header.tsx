'use client'

import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Separator } from '@/components/ui/separator'
import { User } from '@supabase/supabase-js'
import { LogOut, Bell, Search, Building } from 'lucide-react'

interface HeaderProps {
  user: User
}

export function Header({ user }: HeaderProps) {
  const router = useRouter()

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
    <header className="sticky top-0 z-40 bg-white border-b">
      <div className="flex h-16 items-center justify-between px-6">
        {/* Búsqueda */}
        <div className="flex items-center flex-1 max-w-md">
          <div className="relative w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input
              type="search"
              placeholder="Buscar obras, clientes, facturas..."
              className="w-full h-10 pl-10 pr-4 rounded-lg bg-slate-100 border-0 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20"
            />
          </div>
        </div>

        {/* Acciones */}
        <div className="flex items-center gap-2">
          {/* Selector de empresa (placeholder) */}
          <Button variant="ghost" size="sm" className="hidden md:flex items-center gap-2 text-muted-foreground">
            <Building className="h-4 w-4" />
            <span className="text-sm">Mi Empresa</span>
          </Button>

          <Separator orientation="vertical" className="h-6 hidden md:block" />

          {/* Notificaciones */}
          <Button variant="ghost" size="icon" className="relative">
            <Bell className="h-5 w-5" />
            <span className="absolute top-1 right-1 h-2 w-2 rounded-full bg-red-500" />
          </Button>

          {/* Usuario */}
          <div className="flex items-center gap-3 ml-2">
            <Avatar className="h-9 w-9">
              <AvatarImage src={user.user_metadata?.avatar_url} />
              <AvatarFallback className="bg-primary text-primary-foreground text-sm">
                {userInitials}
              </AvatarFallback>
            </Avatar>
            <div className="hidden md:block">
              <p className="text-sm font-medium">
                {user.user_metadata?.nombre || 'Usuario'}
              </p>
              <p className="text-xs text-muted-foreground">
                {user.email}
              </p>
            </div>
          </div>

          {/* Logout */}
          <Button
            variant="ghost"
            size="icon"
            onClick={handleLogout}
            className="text-muted-foreground hover:text-red-600"
          >
            <LogOut className="h-5 w-5" />
          </Button>
        </div>
      </div>
    </header>
  )
}
