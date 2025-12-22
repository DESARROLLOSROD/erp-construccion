'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import {
  Building2,
  LayoutDashboard,
  HardHat,
  Users,
  Truck,
  Package,
  FileText,
  Calculator,
  Wallet,
  Settings,
  ChevronLeft,
  ClipboardList
} from 'lucide-react'
import { useState } from 'react'
import { Button } from '@/components/ui'

const navigation = [
  { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { name: 'Obras', href: '/obras', icon: HardHat },
  { name: 'Presupuestos', href: '/presupuestos', icon: ClipboardList },
  { name: 'Clientes', href: '/clientes', icon: Users },
  { name: 'Proveedores', href: '/proveedores', icon: Truck },
  { name: 'Productos', href: '/productos', icon: Package },
  { name: 'Facturación', href: '/facturacion', icon: FileText },
  { name: 'Contabilidad', href: '/contabilidad', icon: Calculator },
  { name: 'Tesorería', href: '/tesoreria', icon: Wallet },
]

const secondaryNavigation = [
  { name: 'Configuración', href: '/configuracion', icon: Settings },
]

export function Sidebar() {
  const pathname = usePathname()
  const [collapsed, setCollapsed] = useState(false)

  return (
    <>
      {/* Sidebar para desktop */}
      <aside className={cn(
        "hidden lg:fixed lg:inset-y-0 lg:flex lg:flex-col bg-slate-900 transition-all duration-300",
        collapsed ? "lg:w-20" : "lg:w-64"
      )}>
        {/* Logo */}
        <div className="flex h-16 items-center justify-between px-4 border-b border-slate-800">
          <Link href="/dashboard" className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-primary">
              <Building2 className="h-5 w-5 text-white" />
            </div>
            {!collapsed && (
              <span className="text-lg font-semibold text-white">ERP</span>
            )}
          </Link>
          <Button
            variant="ghost"
            size="icon"
            className="text-slate-400 hover:text-white hover:bg-slate-800"
            onClick={() => setCollapsed(!collapsed)}
          >
            <ChevronLeft className={cn(
              "h-4 w-4 transition-transform",
              collapsed && "rotate-180"
            )} />
          </Button>
        </div>

        {/* Navegación principal */}
        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto scrollbar-thin">
          {navigation.map((item) => {
            const isActive = pathname === item.href || pathname?.startsWith(item.href + '/')
            return (
              <Link
                key={item.name}
                href={item.href}
                className={cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors",
                  isActive
                    ? "bg-primary text-white"
                    : "text-slate-300 hover:bg-slate-800 hover:text-white"
                )}
              >
                <item.icon className="h-5 w-5 flex-shrink-0" />
                {!collapsed && <span>{item.name}</span>}
              </Link>
            )
          })}
        </nav>

        {/* Navegación secundaria */}
        <div className="border-t border-slate-800 px-3 py-4">
          {secondaryNavigation.map((item) => {
            const isActive = pathname === item.href
            return (
              <Link
                key={item.name}
                href={item.href}
                className={cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors",
                  isActive
                    ? "bg-slate-800 text-white"
                    : "text-slate-400 hover:bg-slate-800 hover:text-white"
                )}
              >
                <item.icon className="h-5 w-5 flex-shrink-0" />
                {!collapsed && <span>{item.name}</span>}
              </Link>
            )
          })}
        </div>
      </aside>

      {/* Mobile: navbar inferior (opcional, simplificado) */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 bg-white border-t z-50">
        <div className="flex justify-around py-2">
          {navigation.slice(0, 5).map((item) => {
            const isActive = pathname === item.href || pathname?.startsWith(item.href + '/')
            return (
              <Link
                key={item.name}
                href={item.href}
                className={cn(
                  "flex flex-col items-center p-2 text-xs",
                  isActive ? "text-primary" : "text-slate-500"
                )}
              >
                <item.icon className="h-5 w-5" />
                <span className="mt-1">{item.name}</span>
              </Link>
            )
          })}
        </div>
      </nav>
    </>
  )
}
