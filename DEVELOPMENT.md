# Guía de Desarrollo - ERP Construcción MX

## 📐 Patrones de Arquitectura

### Server Components vs Client Components

#### Server Components (por defecto)
Usar para:
- Páginas que cargan datos
- Operaciones de base de datos
- Autenticación y validación de sesiones
- Renderizado de contenido estático

```typescript
// src/app/(dashboard)/obras/page.tsx
export default async function ObrasPage() {
  const supabase = createServerClient()
  const { data: { session } } = await supabase.auth.getSession()

  // Cargar datos en el servidor
  const obras = await prisma.obra.findMany({
    where: { empresaId }
  })

  return <ObrasView obras={obras} />
}
```

#### Client Components
Usar solo cuando necesites:
- Interactividad (onClick, onChange)
- Hooks de React (useState, useEffect)
- Navegación programática (useRouter)
- Eventos del navegador

```typescript
// src/app/(dashboard)/obras/obras-view.tsx
"use client"

export function ObrasView({ obras }: ObrasViewProps) {
  const [isDialogOpen, setIsDialogOpen] = useState(false)

  return (
    <div>
      <Button onClick={() => setIsDialogOpen(true)}>
        Nueva Obra
      </Button>
    </div>
  )
}
```

### Conversión de Decimales de Prisma

**Siempre convertir Decimals a Numbers antes de pasar a Client Components:**

```typescript
// ❌ INCORRECTO
const obras = await prisma.obra.findMany()
return <ObrasView obras={obras} /> // ⚠️ Decimal no serializable

// ✅ CORRECTO
const obrasRaw = await prisma.obra.findMany()
const obras = obrasRaw.map(obra => ({
  ...obra,
  montoContrato: Number(obra.montoContrato),
  anticipoPct: Number(obra.anticipoPct),
  retencionPct: Number(obra.retencionPct)
}))
return <ObrasView obras={obras} />
```

### Multi-Tenancy

**Siempre filtrar por empresaId en todas las queries:**

```typescript
// ✅ Patrón estándar
const usuario = await prisma.usuario.findUnique({
  where: { authId: session.user.id },
  include: { empresas: true }
})

if (!usuario || usuario.empresas.length === 0) {
  return NextResponse.json({ error: 'Usuario sin empresa' }, { status: 403 })
}

const empresaId = usuario.empresas[0].empresaId

// Todas las queries deben incluir empresaId
const obras = await prisma.obra.findMany({
  where: { empresaId } // ✅ Filtrado por empresa
})
```

## 🗂️ Estructura de Archivos

### Convenciones de Nombres

```
src/
├── app/
│   ├── (dashboard)/          # Grupo de rutas protegidas
│   │   ├── modulo/
│   │   │   ├── page.tsx      # Server Component (carga datos)
│   │   │   └── modulo-view.tsx  # Client Component (UI interactiva)
│   │   └── modulo/[id]/
│   │       ├── page.tsx
│   │       └── modulo-detail-view.tsx
│   └── api/
│       └── modulo/
│           ├── route.ts      # GET, POST
│           └── [id]/
│               └── route.ts  # GET, PUT, DELETE
├── components/
│   ├── ui/                   # Componentes base (shadcn/ui)
│   └── modulo/               # Componentes específicos del módulo
│       ├── ModuloForm.tsx
│       └── ModuloTable.tsx
└── types/
    └── modulo.ts             # Interfaces TypeScript
```

### Tipos TypeScript

**Crear interfaces para cada entidad:**

```typescript
// src/types/obra.ts

// Interface base (match con Prisma)
export interface Obra {
  id: string
  empresaId: string
  codigo: string
  nombre: string
  // ... todos los campos
}

// Interface para listas (con relaciones)
export interface ObraListItem extends Omit<Obra, 'cliente'> {
  cliente?: {
    id: string
    razonSocial: string
    nombreComercial: string | null
  } | null
}

// Interface con totales calculados
export interface ObraConTotales extends Obra {
  totalPresupuestos: number
  montoTotalPresupuestado: number
}

// Inputs para creación/actualización
export interface CreateObraInput {
  codigo: string
  nombre: string
  clienteId?: string
  // ... campos requeridos
}

export interface UpdateObraInput extends Partial<CreateObraInput> {
  estado?: EstadoObra
}
```

## 🎨 Componentes UI

### Estructura de Componentes

```typescript
// Componente típico de formulario
interface ModuloFormProps {
  onSubmit: (data: CreateModuloInput) => Promise<void>
  initialData?: Modulo
  mode?: 'create' | 'edit'
}

export function ModuloForm({ onSubmit, initialData, mode = 'create' }: ModuloFormProps) {
  const form = useForm<CreateModuloInput>({
    resolver: zodResolver(createModuloSchema),
    defaultValues: initialData || {}
  })

  const handleSubmit = async (data: CreateModuloInput) => {
    try {
      await onSubmit(data)
      form.reset()
    } catch (error) {
      console.error('Error:', error)
    }
  }

  return (
    <Form {...form}>
      {/* campos del formulario */}
    </Form>
  )
}
```

### Validación con Zod

```typescript
import { z } from 'zod'

export const createObraSchema = z.object({
  codigo: z.string()
    .min(1, 'El código es requerido')
    .max(20, 'El código es muy largo'),
  nombre: z.string()
    .min(1, 'El nombre es requerido')
    .max(200, 'El nombre es muy largo'),
  clienteId: z.string().optional(),
  montoContrato: z.number()
    .min(0, 'El monto debe ser positivo'),
  fechaInicio: z.date().optional(),
})
```

## 🔌 API Routes

### Estructura Estándar

```typescript
// src/app/api/modulo/route.ts

// GET - Listar con filtros
export async function GET(request: NextRequest) {
  try {
    const supabase = createServerClient()
    const { data: { session } } = await supabase.auth.getSession()

    if (!session) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    // Obtener empresaId
    const usuario = await prisma.usuario.findUnique({
      where: { authId: session.user.id },
      include: { empresas: true }
    })

    if (!usuario || usuario.empresas.length === 0) {
      return NextResponse.json({ error: 'Usuario sin empresa' }, { status: 403 })
    }

    const empresaId = usuario.empresas[0].empresaId

    // Obtener parámetros de búsqueda
    const searchParams = request.nextUrl.searchParams
    const filtro = searchParams.get('filtro')

    // Query a base de datos
    const items = await prisma.modulo.findMany({
      where: {
        empresaId,
        ...(filtro && { campo: { contains: filtro } })
      },
      orderBy: { createdAt: 'desc' }
    })

    return NextResponse.json({ items })
  } catch (error) {
    console.error('Error:', error)
    return NextResponse.json(
      { error: 'Error al obtener datos' },
      { status: 500 }
    )
  }
}

// POST - Crear nuevo
export async function POST(request: NextRequest) {
  try {
    const supabase = createServerClient()
    const { data: { session } } = await supabase.auth.getSession()

    if (!session) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const usuario = await prisma.usuario.findUnique({
      where: { authId: session.user.id },
      include: { empresas: true }
    })

    if (!usuario || usuario.empresas.length === 0) {
      return NextResponse.json({ error: 'Usuario sin empresa' }, { status: 403 })
    }

    const empresaId = usuario.empresas[0].empresaId
    const body = await request.json()

    // Validar con Zod
    const validatedData = createModuloSchema.parse(body)

    // Crear registro
    const item = await prisma.modulo.create({
      data: {
        ...validatedData,
        empresaId
      }
    })

    return NextResponse.json(item, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Datos inválidos', details: error.errors },
        { status: 400 }
      )
    }

    console.error('Error:', error)
    return NextResponse.json(
      { error: 'Error al crear registro' },
      { status: 500 }
    )
  }
}
```

## 🎯 Mejores Prácticas

### 1. Manejo de Errores

```typescript
// ✅ Siempre usar try-catch en API routes
try {
  const result = await someOperation()
  return NextResponse.json(result)
} catch (error) {
  console.error('Error detallado:', error)
  return NextResponse.json(
    { error: 'Mensaje amigable para el usuario' },
    { status: 500 }
  )
}

// ✅ Validar entradas con Zod
const validatedData = schema.parse(body)

// ✅ Mensajes de error específicos
if (!item) {
  return NextResponse.json(
    { error: 'Registro no encontrado' },
    { status: 404 }
  )
}
```

### 2. Performance

```typescript
// ✅ Usar Promise.all para queries paralelas
const [obras, clientes, presupuestos] = await Promise.all([
  prisma.obra.findMany({ where: { empresaId } }),
  prisma.cliente.findMany({ where: { empresaId } }),
  prisma.presupuesto.findMany({ where: { obra: { empresaId } } })
])

// ✅ Seleccionar solo campos necesarios
const obras = await prisma.obra.findMany({
  select: {
    id: true,
    codigo: true,
    nombre: true,
    cliente: {
      select: {
        razonSocial: true
      }
    }
  }
})

// ✅ Limitar resultados
const items = await prisma.modulo.findMany({
  take: 10,
  skip: page * 10
})
```

### 3. Seguridad

```typescript
// ✅ Siempre validar sesión
const { data: { session } } = await supabase.auth.getSession()
if (!session) {
  return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
}

// ✅ Validar pertenencia a empresa
const item = await prisma.modulo.findFirst({
  where: {
    id: params.id,
    empresaId // ✅ Validar que pertenece a la empresa
  }
})

if (!item) {
  return NextResponse.json({ error: 'No encontrado' }, { status: 404 })
}

// ✅ Validar inputs
const validatedData = schema.parse(body)
```

### 4. Consistencia

```typescript
// ✅ Usar mismo patrón para formateo
const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('es-MX', {
    style: 'currency',
    currency: 'MXN',
    minimumFractionDigits: 2,
  }).format(value)
}

const formatDate = (date: Date | null | undefined) => {
  if (!date) return 'No definida'
  return new Intl.DateTimeFormat('es-MX', {
    dateStyle: 'medium',
  }).format(new Date(date))
}

// ✅ Usar mismos colores para estados
const estadoColors = {
  EN_PROCESO: 'bg-green-100 text-green-800',
  TERMINADA: 'bg-slate-100 text-slate-800',
  CANCELADA: 'bg-red-100 text-red-800',
}
```

## 🧪 Testing (Futuro)

```typescript
// Estructura recomendada para tests
describe('ObraForm', () => {
  it('should validate required fields', () => {
    // test
  })

  it('should submit form with valid data', () => {
    // test
  })
})
```

## 📦 Deployment

### Variables de Entorno Requeridas

```env
# Producción
DATABASE_URL="postgresql://..."
DIRECT_URL="postgresql://..."
NEXT_PUBLIC_SUPABASE_URL="https://..."
NEXT_PUBLIC_SUPABASE_ANON_KEY="..."

# Opcional
NODE_ENV="production"
```

### Build para Producción

```bash
npm run build
npm start
```

## 🔧 Troubleshooting

### Error: Decimal no serializable
**Solución**: Convertir a Number antes de pasar a Client Component

### Error: Session undefined
**Solución**: Verificar que createServerClient() esté correctamente configurado

### Error: empresaId undefined
**Solución**: Asegurar que el usuario tenga empresa asignada

### Build Error: Type mismatch
**Solución**: Verificar que interfaces coincidan con schema Prisma

---

**Mantener este documento actualizado con nuevos patrones y mejores prácticas**
