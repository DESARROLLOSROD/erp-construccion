import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { HardHat, Users, FileText, DollarSign, AlertCircle, Clock, Plus, ClipboardList, CheckCircle2, Truck, ShoppingCart } from 'lucide-react'
import { prisma } from '@/lib/prisma'
import { createServerClient } from '@/lib/supabase'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { StatsChart } from '@/components/dashboard/StatsChart'

export default async function DashboardPage() {
  const supabase = createServerClient()
  const { data: { session } } = await supabase.auth.getSession()

  if (!session) {
    redirect('/login')
  }

  // Obtener contexto de empresa
  const usuario = await prisma.usuario.findUnique({
    where: { authId: session.user.id },
    include: { empresas: true }
  })

  // If no empresa, show warning (simplified check, keeping original logic mostly)
  if (!usuario || usuario.empresas.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] p-8 text-center bg-slate-50/50 rounded-xl border border-dashed border-slate-200">
        <div className="bg-white p-4 rounded-full shadow-sm mb-4">
          {/* Using HardHat temporarily or importing Building2 if needed, using HardHat from existing imports is safe or check imports */}
          <HardHat className="w-8 h-8 text-slate-900" />
        </div>
        <h2 className="text-xl font-bold text-gray-900 mb-2">¡Bienvenido al ERP!</h2>
        <p className="text-gray-500 max-w-md mb-6">
          Para comenzar a gestionar tus obras, presupuestos y compras, necesitas registrar tu primera empresa.
        </p>
        <Link href="/empresas/nueva">
          <Button className="bg-slate-900 text-white hover:bg-slate-800">
            <Plus className="w-4 h-4 mr-2" />
            Registrar mi Empresa
          </Button>
        </Link>
      </div>
    )
  }

  const empresaId = usuario.empresas[0].empresaId

  // Obtener estadísticas reales (Enhanced)
  const [
    totalObras,
    obrasActivas,
    totalClientes,
    totalPresupuestos,
    presupuestosVigentes,
    obrasRecientes,
    presupuestosRecientes,
    obrasPorEstado,
    maquinariaTotal,
    maquinariaEnObra,
    ordenesRecientes
  ] = await Promise.all([
    prisma.obra.count({ where: { empresaId } }),
    prisma.obra.count({ where: { empresaId, estado: 'EN_PROCESO' } }),
    prisma.cliente.count({ where: { empresaId, activo: true } }),
    prisma.presupuesto.count({ where: { obra: { empresaId } } }),
    prisma.presupuesto.count({ where: { obra: { empresaId }, esVigente: true } }),

    // Obras Recientes
    prisma.obra.findMany({
      where: { empresaId, estado: 'EN_PROCESO' },
      include: { cliente: { select: { razonSocial: true, nombreComercial: true } } },
      orderBy: { updatedAt: 'desc' },
      take: 5
    }),

    // Presupuestos Recientes
    prisma.presupuesto.findMany({
      where: { obra: { empresaId } },
      include: {
        obra: { select: { codigo: true, nombre: true } },
        conceptos: { select: { importe: true } }
      },
      orderBy: { updatedAt: 'desc' },
      take: 5
    }),

    // Stats Obras
    prisma.obra.groupBy({
      by: ['estado'],
      where: { empresaId },
      _count: { id: true },
      _sum: { montoContrato: true }
    }),

    // Maquinaria Stats
    prisma.maquinaria.count({ where: { empresaId } }),
    prisma.maquinaria.count({ where: { empresaId, estado: 'EN_OBRA' } }),

    // Compras Recientes
    prisma.ordenCompra.findMany({
      where: { empresaId },
      include: { proveedor: { select: { nombreComercial: true } } },
      orderBy: { fecha: 'desc' },
      take: 5
    })
  ])

  // Preparar datos para gráficas
  const estadisticasPorEstado = obrasPorEstado.map(item => ({
    estado: item.estado,
    cantidad: item._count.id,
    monto: Number(item._sum.montoContrato || 0)
  }))

  const montoTotalCartera = estadisticasPorEstado.reduce((sum, item) => sum + item.monto, 0)

  const stats = [
    {
      name: 'Obras activas',
      value: obrasActivas.toString(),
      change: `${totalObras} total`,
      changeType: 'positive',
      icon: HardHat,
      color: 'bg-orange-500',
    },
    {
      name: 'Maquinaria',
      value: maquinariaTotal.toString(),
      change: `${maquinariaEnObra} en obra`,
      changeType: 'warning',
      icon: Truck,
      color: 'bg-blue-600',
    },
    {
      name: 'Presupuestos',
      value: totalPresupuestos.toString(),
      change: `${presupuestosVigentes} vigentes`,
      changeType: 'positive',
      icon: ClipboardList,
      color: 'bg-green-500',
    },
    {
      name: 'Compras',
      value: ordenesRecientes.length > 0 ? 'Activo' : 'Inactivo',
      change: 'Módulo listo',
      changeType: 'neutral',
      icon: ShoppingCart,
      color: 'bg-indigo-500',
    },
  ]

  const alertas = [
    { tipo: 'info', mensaje: 'Módulos de Maquinaria y Compras activados', tiempo: 'Hoy' },
  ]

  return (
    <div className="space-y-6">
      {/* Título */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Dashboard</h1>
        <p className="text-muted-foreground">Resumen general de tu operación</p>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <Card key={stat.name}>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">
                    {stat.name}
                  </p>
                  <p className="text-2xl font-bold mt-1">{stat.value}</p>
                  <p className={`text-xs mt-1 ${stat.changeType === 'positive' ? 'text-green-600' :
                    stat.changeType === 'warning' ? 'text-amber-600' :
                      'text-muted-foreground'
                    }`}>
                    {stat.change}
                  </p>
                </div>
                <div className={`p-3 rounded-lg ${stat.color}`}>
                  <stat.icon className="h-6 w-6 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Gráficas de Estadísticas */}
      <StatsChart
        obrasPorEstado={estadisticasPorEstado}
        montoTotal={montoTotalCartera}
      />

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Obras recientes */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Obras en proceso</CardTitle>
            <CardDescription>Resumen de avance de tus obras activas</CardDescription>
          </CardHeader>
          <CardContent>
            {obrasRecientes.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-muted-foreground mb-4">No hay obras en proceso</p>
                <Link href="/obras">
                  <Button>
                    <Plus className="h-4 w-4 mr-2" />
                    Crear primera obra
                  </Button>
                </Link>
              </div>
            ) : (
              <div className="space-y-4">
                {obrasRecientes.map((obra) => (
                  <Link key={obra.id} href={`/obras`}>
                    <div className="flex items-center gap-4 p-3 rounded-lg hover:bg-slate-50 transition-colors cursor-pointer">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-mono text-muted-foreground">{obra.codigo}</span>
                        </div>
                        <p className="font-medium truncate">{obra.nombre}</p>
                        <p className="text-sm text-muted-foreground truncate">
                          {obra.cliente?.nombreComercial || obra.cliente?.razonSocial || 'Sin cliente'}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-medium">
                          ${(Number(obra.montoContrato) / 1000000).toFixed(1)}M
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {obra.ubicacion || 'Sin ubicación'}
                        </p>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Compras recientes (Replaces Presupuestos or below? Replaces Presupuestos for now as per "Integrated" feel, or Add below) */}
        {/* Actually, let's look at Order. User might want Presupuestos. I will keep Presupuestos AND add Compras below in a new row or side by side if 3 cols. */}
        {/* Given existing code had 2 cols, let's stick to 2 cols for Obras/Presupuestos and add a full width or 2-col row for Compras/Maquinaria below */}

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Compras Recientes</CardTitle>
            <CardDescription>Últimas órdenes en el sistema</CardDescription>
          </CardHeader>
          <CardContent>
            {ordenesRecientes.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-muted-foreground mb-4">Sin actividad de compras</p>
                <Link href="/compras/nueva">
                  <Button variant="outline" size="sm"><Plus className="w-4 h-4 mr-1" /> Nueva Orden</Button>
                </Link>
              </div>
            ) : (
              <div className="space-y-3">
                {ordenesRecientes.map(oc => (
                  <Link key={oc.id} href={`/compras/${oc.id}`}>
                    <div className="flex items-center justify-between p-3 hover:bg-slate-50 rounded-lg cursor-pointer">
                      <div>
                        <div className="font-medium">OC-{oc.folio}</div>
                        <div className="text-xs text-gray-500">{oc.proveedor.nombreComercial} · {new Date(oc.fecha).toLocaleDateString()}</div>
                      </div>
                      <div className="text-right">
                        <div className="text-sm font-medium">${Number(oc.total).toLocaleString('es-MX')}</div>
                        <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${oc.estado === 'COMPLETADA' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
                          {oc.estado}
                        </span>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Alertas */}
      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-3">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-amber-500" />
              Alertas
            </CardTitle>
            <CardDescription>Requieren tu atención</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {alertas.map((alerta, i) => (
                <div key={i} className="p-3 rounded-lg bg-amber-50 border border-amber-100">
                  <p className="text-sm text-slate-700">{alerta.mensaje}</p>
                  <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    Hace {alerta.tiempo}
                  </p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

    </div>
  )
}
