import { createClientComponentClient, createServerComponentClient } from '@supabase/auth-helpers-nextjs'

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
  // Importación dinámica de cookies solo cuando se ejecuta en servidor
  const { cookies } = require('next/headers')
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
