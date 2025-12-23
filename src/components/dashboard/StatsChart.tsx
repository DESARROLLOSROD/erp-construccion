"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts'

interface ObraStats {
  estado: string
  cantidad: number
  monto: number
}

interface StatsChartProps {
  obrasPorEstado: ObraStats[]
  montoTotal: number
}

const COLORS = {
  COTIZACION: '#f59e0b',
  CONTRATADA: '#3b82f6',
  EN_PROCESO: '#10b981',
  SUSPENDIDA: '#f97316',
  TERMINADA: '#6b7280',
  CANCELADA: '#ef4444',
}

export function StatsChart({ obrasPorEstado, montoTotal }: StatsChartProps) {
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('es-MX', {
      style: 'currency',
      currency: 'MXN',
      notation: 'compact',
      compactDisplay: 'short',
    }).format(value)
  }

  const pieData = obrasPorEstado.map(item => ({
    name: item.estado,
    value: item.cantidad,
    monto: item.monto
  }))

  return (
    <div className="grid gap-6 md:grid-cols-2">
      {/* Gráfica de Obras por Estado */}
      <Card>
        <CardHeader>
          <CardTitle>Obras por Estado</CardTitle>
          <CardDescription>Distribución del portafolio de obras</CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={pieData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) => `${name}: ${((percent || 0) * 100).toFixed(0)}%`}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
              >
                {pieData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[entry.name as keyof typeof COLORS] || '#6b7280'} />
                ))}
              </Pie>
              <Tooltip
                formatter={(value: number | undefined, name: string | undefined, props: any) => [
                  `${value || 0} obras - ${formatCurrency(props.payload.monto)}`,
                  name || ''
                ]}
              />
            </PieChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Gráfica de Montos por Estado */}
      <Card>
        <CardHeader>
          <CardTitle>Montos por Estado</CardTitle>
          <CardDescription>Valor total del portafolio: {formatCurrency(montoTotal)}</CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={obrasPorEstado}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis
                dataKey="estado"
                angle={-45}
                textAnchor="end"
                height={80}
                tick={{ fontSize: 12 }}
              />
              <YAxis
                tickFormatter={formatCurrency}
                tick={{ fontSize: 12 }}
              />
              <Tooltip
                formatter={(value: number | undefined) => formatCurrency(value || 0)}
                labelStyle={{ fontSize: 12 }}
              />
              <Bar
                dataKey="monto"
                fill="#3b82f6"
                radius={[8, 8, 0, 0]}
              >
                {obrasPorEstado.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[entry.estado as keyof typeof COLORS] || '#6b7280'} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  )
}
