# ERP Construcción MX

Sistema ERP para empresas de construcción y minería en México.

## Stack Tecnológico

- **Frontend/Backend:** Next.js 14 (App Router)
- **Base de datos:** PostgreSQL (Supabase)
- **ORM:** Prisma
- **Autenticación:** Supabase Auth
- **Estilos:** Tailwind CSS
- **UI Components:** shadcn/ui

## Requisitos previos

- Node.js 18+
- npm o pnpm
- Cuenta de Supabase (gratis)

## Configuración inicial

### 1. Crear proyecto en Supabase

1. Ve a [supabase.com](https://supabase.com) y crea una cuenta
2. Click en "New Project"
3. Nombre: `erp-construccion`
4. Password: genera uno seguro y **guárdalo**
5. Region: `South America (São Paulo)` (más cercano a México)
6. Espera ~2 minutos a que se cree

### 2. Obtener credenciales de Supabase

Una vez creado el proyecto:

1. Ve a **Settings** → **API**
2. Copia estos valores:
   - `Project URL` → será tu `NEXT_PUBLIC_SUPABASE_URL`
   - `anon public` key → será tu `NEXT_PUBLIC_SUPABASE_ANON_KEY`
3. Ve a **Settings** → **Database**
4. En "Connection string" → URI, copia el string y reemplaza `[YOUR-PASSWORD]` con tu password

### 3. Configurar variables de entorno

Copia el archivo de ejemplo:

```bash
cp .env.example .env
```

Edita `.env` con tus valores de Supabase.

### 4. Instalar dependencias

```bash
npm install
```

### 5. Configurar base de datos

```bash
# Generar cliente de Prisma
npx prisma generate

# Crear tablas en Supabase
npx prisma db push
```

### 6. Ejecutar en desarrollo

```bash
npm run dev
```

Abre [http://localhost:3000](http://localhost:3000)

## Estructura del proyecto

```
erp-construccion/
├── prisma/
│   └── schema.prisma      # Modelo de datos
├── src/
│   ├── app/               # Rutas y páginas (App Router)
│   │   ├── (auth)/        # Páginas de login/registro
│   │   ├── (dashboard)/   # Páginas protegidas
│   │   ├── api/           # API Routes
│   │   ├── layout.tsx     # Layout principal
│   │   └── page.tsx       # Página inicial
│   ├── components/        # Componentes React
│   │   ├── ui/            # Componentes base (shadcn)
│   │   └── ...            # Componentes del negocio
│   ├── lib/               # Utilidades
│   │   ├── prisma.ts      # Cliente Prisma
│   │   ├── supabase.ts    # Cliente Supabase
│   │   └── utils.ts       # Funciones helper
│   └── types/             # TypeScript types
├── .env                   # Variables de entorno (no commitear)
├── .env.example           # Ejemplo de variables
└── package.json
```

## Módulos del sistema

### Fase 1 (actual)
- [x] Autenticación
- [x] Multi-empresa
- [ ] Gestión de obras
- [ ] Catálogos (clientes, proveedores, productos)

### Fase 2 (próxima)
- [ ] Facturación CFDI 4.0
- [ ] Complemento de pagos
- [ ] Compras

### Fase 3
- [ ] Contabilidad
- [ ] Bancos

### Fase 4
- [ ] Integración nómina (Runa/Nominax)

## Comandos útiles

```bash
# Desarrollo
npm run dev

# Build producción
npm run build

# Prisma Studio (ver BD visual)
npx prisma studio

# Actualizar BD después de cambiar schema
npx prisma db push

# Crear migración formal
npx prisma migrate dev --name descripcion
```

## Licencia

Propietario - Todos los derechos reservados
