import { createClientComponentClient, createServerComponentClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'

/**
 * Cliente de Supabase para componentes del cliente (Client Components)
 * Usar en: onClick handlers, useEffect, etc.
 */
export const createClient = () => {
  return createClientComponentClient()
}

/**
 * Cliente de Supabase para Server Components y API Routes
 * Usar en: page.tsx, layout.tsx, route.ts
 */
export const createServerClient = () => {
  const cookieStore = cookies()
  return createServerComponentClient({ cookies: () => cookieStore })
}

/**
 * Tipos de Supabase Auth
 */
export type AuthUser = {
  id: string
  email: string
  user_metadata: {
    nombre?: string
    apellidos?: string
  }
}
