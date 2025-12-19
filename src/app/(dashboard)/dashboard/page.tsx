import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui'
import { HardHat, Users, FileText, DollarSign, AlertCircle, Clock } from 'lucide-react'

// Datos de ejemplo (después vendrán de la BD)
const stats = [
  {
    name: 'Obras activas',
    value: '12',
    change: '+2 este mes',
    changeType: 'positive',
    icon: HardHat,
    color: 'bg-orange-500',
  },
  {
    name: 'Clientes',
    value: '48',
    change: '+5 este mes',
    changeType: 'positive',
    icon: Users,
    color: 'bg-blue-500',
  },
  {
    name: 'Por facturar',
    value: '$2.4M',
    change: '8 estimaciones',
    changeType: 'neutral',
    icon: FileText,
    color: 'bg-green-500',
  },
  {
    name: 'Por cobrar',
    value: '$1.8M',
    change: '15 facturas',
    changeType: 'warning',
    icon: DollarSign,
    color: 'bg-purple-500',
  },
]

const obrasRecientes = [
  { id: 1, codigo: 'OBR-2024-001', nombre: 'Torre Residencial Santa Fe', cliente: 'Grupo Constructor ABC', avance: 45, monto: 25000000, estado: 'EN_PROCESO' },
  { id: 2, codigo: 'OBR-2024-002', nombre: 'Nave Industrial Querétaro', cliente: 'Desarrollos QRO SA', avance: 78, monto: 18500000, estado: 'EN_PROCESO' },
  { id: 3, codigo: 'OBR-2024-003', nombre: 'Plaza Comercial Satélite', cliente: 'Inmobiliaria del Norte', avance: 12, monto: 42000000, estado: 'EN_PROCESO' },
  { id: 4, codigo: 'OBR-2024-004', nombre: 'Puente Vehicular Reforma', cliente: 'Gobierno CDMX', avance: 92, monto: 85000000, estado: 'EN_PROCESO' },
]

const alertas = [
  { tipo: 'estimacion', mensaje: 'Estimación #3 de Torre Santa Fe pendiente de aprobar', tiempo: '2 horas' },
  { tipo: 'pago', mensaje: 'Factura FAC-2024-089 vence en 3 días', tiempo: '5 horas' },
  { tipo: 'material', mensaje: 'Stock bajo de cemento en almacén principal', tiempo: '1 día' },
]

export default function DashboardPage() {
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
            <div className="space-y-4">
              {obrasRecientes.map((obra) => (
                <div key={obra.id} className="flex items-center gap-4 p-3 rounded-lg hover:bg-slate-50 transition-colors cursor-pointer">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-mono text-muted-foreground">{obra.codigo}</span>
                    </div>
                    <p className="font-medium truncate">{obra.nombre}</p>
                    <p className="text-sm text-muted-foreground truncate">{obra.cliente}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium">
                      ${(obra.monto / 1000000).toFixed(1)}M
                    </p>
                    <div className="flex items-center gap-2 mt-1">
                      <div className="w-24 h-2 bg-slate-200 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-primary rounded-full transition-all"
                          style={{ width: `${obra.avance}%` }}
                        />
                      </div>
                      <span className="text-xs text-muted-foreground w-8">
                        {obra.avance}%
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
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
