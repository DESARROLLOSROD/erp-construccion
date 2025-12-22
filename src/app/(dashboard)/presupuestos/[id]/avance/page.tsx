import { prisma } from '@/lib/prisma'
import { createServerClient } from '@/lib/supabase'
import { redirect } from 'next/navigation'
import { AvanceView } from './avance-view'

interface PageProps {
  params: { id: string }
}

export default async function AvancePage({ params }: PageProps) {
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
            Tu usuario no está asignado a ninguna empresa activa.
          </p>
        </div>
      </div>
    )
  }

  const empresaId = usuario.empresas[0].empresaId

  // Obtener presupuesto con obra
  const presupuesto = await prisma.presupuesto.findFirst({
    where: {
      id: params.id,
      obra: { empresaId }
    },
    include: {
      obra: {
        select: {
          id: true,
          codigo: true,
          nombre: true,
          estado: true,
        }
      }
    }
  })

  if (!presupuesto) {
    return (
      <div className="p-8">
        <div className="bg-red-50 border-l-4 border-red-400 p-4">
          <p className="text-sm text-red-700">
            Presupuesto no encontrado o no tienes acceso a él.
          </p>
        </div>
      </div>
    )
  }

  return <AvanceView presupuesto={presupuesto} />
}
