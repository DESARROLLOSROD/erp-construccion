import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { HardHat, Users, FileText, DollarSign, AlertCircle, Clock, Plus } from 'lucide-react'
import { prisma } from '@/lib/prisma'
import { createServerClient } from '@/lib/supabase'
import { redirect } from 'next/navigation'
import Link from 'next/link'

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

  if (!usuario || usuario.empresas.length === 0) {
    return (
      <div className="p-8">
        <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4">
          <p className="text-sm text-yellow-700">
            Tu usuario no está asignado a ninguna empresa activa. Contacta al administrador.
          </p>
        </div>
      </div>
    )
  }

  const empresaId = usuario.empresas[0].empresaId

  // Obtener estadísticas reales
  const [totalObras, obrasActivas, totalClientes, obrasRecientes] = await Promise.all([
    prisma.obra.count({
      where: { empresaId }
    }),
    prisma.obra.count({
      where: { empresaId, estado: 'EN_PROCESO' }
    }),
    prisma.cliente.count({
      where: { empresaId, activo: true }
    }),
    prisma.obra.findMany({
      where: { empresaId, estado: 'EN_PROCESO' },
      include: {
        cliente: {
          select: {
            razonSocial: true,
            nombreComercial: true,
          }
        }
      },
      orderBy: { updatedAt: 'desc' },
      take: 5
    })
  ])

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
      name: 'Clientes',
      value: totalClientes.toString(),
      change: 'Activos',
      changeType: 'positive',
      icon: Users,
      color: 'bg-blue-500',
    },
    {
      name: 'Por facturar',
      value: '$0',
      change: 'Próximamente',
      changeType: 'neutral',
      icon: FileText,
      color: 'bg-green-500',
    },
    {
      name: 'Por cobrar',
      value: '$0',
      change: 'Próximamente',
      changeType: 'neutral',
      icon: DollarSign,
      color: 'bg-purple-500',
    },
  ]

  const alertas = [
    { tipo: 'info', mensaje: 'Sistema de facturación próximamente disponible', tiempo: 'Hoy' },
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
                  <p className={`text-xs mt-1 ${
                    stat.changeType === 'positive' ? 'text-green-600' :
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

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Obras recientes */}
        <Card className="lg:col-span-2">
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

        {/* Alertas */}
        <Card>
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
