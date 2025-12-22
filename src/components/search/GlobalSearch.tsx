"use client"

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { Dialog, DialogContent } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { ResultadoBusqueda } from '@/app/api/buscar/route'
import { Search, HardHat, Users, ClipboardList, Package, Building2, Loader2 } from 'lucide-react'

interface GlobalSearchProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

const iconMap = {
  obra: HardHat,
  cliente: Users,
  presupuesto: ClipboardList,
  producto: Package,
  proveedor: Building2,
}

const labelMap = {
  obra: 'Obra',
  cliente: 'Cliente',
  presupuesto: 'Presupuesto',
  producto: 'Producto',
  proveedor: 'Proveedor',
}

const colorMap = {
  obra: 'bg-orange-100 text-orange-700',
  cliente: 'bg-blue-100 text-blue-700',
  presupuesto: 'bg-green-100 text-green-700',
  producto: 'bg-purple-100 text-purple-700',
  proveedor: 'bg-slate-100 text-slate-700',
}

export function GlobalSearch({ open, onOpenChange }: GlobalSearchProps) {
  const router = useRouter()
  const [query, setQuery] = useState('')
  const [resultados, setResultados] = useState<ResultadoBusqueda[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [selectedIndex, setSelectedIndex] = useState(0)

  // Resetear estado cuando se cierra el dialog
  useEffect(() => {
    if (!open) {
      setQuery('')
      setResultados([])
      setSelectedIndex(0)
    }
  }, [open])

  // Buscar cuando cambia el query (con debounce)
  useEffect(() => {
    if (query.trim().length === 0) {
      setResultados([])
      return
    }

    const timer = setTimeout(async () => {
      setIsLoading(true)
      try {
        const response = await fetch(`/api/buscar?q=${encodeURIComponent(query)}`)
        if (response.ok) {
          const data = await response.json()
          setResultados(data.resultados || [])
          setSelectedIndex(0)
        }
      } catch (error) {
        console.error('Error al buscar:', error)
      } finally {
        setIsLoading(false)
      }
    }, 300) // Debounce de 300ms

    return () => clearTimeout(timer)
  }, [query])

  // Manejar navegación con teclado
  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (resultados.length === 0) return

    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setSelectedIndex(prev => (prev + 1) % resultados.length)
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setSelectedIndex(prev => (prev - 1 + resultados.length) % resultados.length)
    } else if (e.key === 'Enter' && resultados[selectedIndex]) {
      e.preventDefault()
      handleSelectResult(resultados[selectedIndex])
    }
  }, [resultados, selectedIndex])

  const handleSelectResult = (resultado: ResultadoBusqueda) => {
    onOpenChange(false)
    router.push(resultado.url)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl p-0 gap-0">
        <div className="flex items-center border-b px-4 py-3">
          <Search className="h-5 w-5 text-muted-foreground mr-3" />
          <Input
            placeholder="Buscar obras, clientes, presupuestos, productos..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            className="border-0 focus-visible:ring-0 focus-visible:ring-offset-0 text-base"
            autoFocus
          />
          {isLoading && <Loader2 className="h-4 w-4 animate-spin text-muted-foreground ml-2" />}
        </div>

        <div className="max-h-[400px] overflow-y-auto">
          {query.trim().length === 0 ? (
            <div className="py-12 text-center text-sm text-muted-foreground">
              <Search className="h-12 w-12 mx-auto mb-4 text-muted-foreground/50" />
              <p>Escribe para buscar en obras, clientes, presupuestos y más</p>
              <p className="text-xs mt-2">Usa ↑ ↓ para navegar y Enter para seleccionar</p>
            </div>
          ) : resultados.length === 0 && !isLoading ? (
            <div className="py-12 text-center text-sm text-muted-foreground">
              <Search className="h-12 w-12 mx-auto mb-4 text-muted-foreground/50" />
              <p>No se encontraron resultados para &quot;{query}&quot;</p>
            </div>
          ) : (
            <div className="py-2">
              {resultados.map((resultado, index) => {
                const Icon = iconMap[resultado.tipo]
                const isSelected = index === selectedIndex

                return (
                  <button
                    key={`${resultado.tipo}-${resultado.id}`}
                    onClick={() => handleSelectResult(resultado)}
                    onMouseEnter={() => setSelectedIndex(index)}
                    className={`w-full px-4 py-3 flex items-center gap-3 hover:bg-slate-50 transition-colors text-left ${
                      isSelected ? 'bg-slate-100' : ''
                    }`}
                  >
                    <div className={`p-2 rounded-lg ${colorMap[resultado.tipo]}`}>
                      <Icon className="h-4 w-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="font-medium text-sm truncate">{resultado.titulo}</p>
                        <span className={`text-xs px-2 py-0.5 rounded-full ${colorMap[resultado.tipo]}`}>
                          {labelMap[resultado.tipo]}
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground truncate mt-0.5">
                        {resultado.subtitulo}
                      </p>
                    </div>
                    {isSelected && (
                      <kbd className="hidden sm:inline-flex h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground">
                        <span className="text-xs">↵</span>
                      </kbd>
                    )}
                  </button>
                )
              })}
            </div>
          )}
        </div>

        <div className="border-t px-4 py-2 text-xs text-muted-foreground flex items-center justify-between">
          <span>
            {resultados.length > 0 && `${resultados.length} resultado${resultados.length !== 1 ? 's' : ''}`}
          </span>
          <div className="flex items-center gap-4">
            <span className="hidden sm:inline">
              <kbd className="pointer-events-none inline-flex h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground">
                ↑↓
              </kbd>{' '}
              navegar
            </span>
            <span className="hidden sm:inline">
              <kbd className="pointer-events-none inline-flex h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground">
                ↵
              </kbd>{' '}
              seleccionar
            </span>
            <span>
              <kbd className="pointer-events-none inline-flex h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground">
                Esc
              </kbd>{' '}
              cerrar
            </span>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
