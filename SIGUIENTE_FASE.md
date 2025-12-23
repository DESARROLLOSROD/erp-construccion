# Siguiente Fase - Refactorización y Nuevas Funcionalidades

## 📋 Estado Actual

### ✅ Completado
1. **Sistema de Validación y Seguridad**
   - Validación Zod completa
   - Sistema de roles y permisos
   - Manejo de errores robusto

2. **Módulo de Estimaciones**
   - APIs completas (/api/estimaciones)
   - Modelo de base de datos
   - Validaciones de negocio

3. **Sistema de Notificaciones**
   - Toast components
   - Confirm dialogs

4. **Tests Unitarios**
   - 60 tests pasando

5. **APIs Refactorizadas**
   - ✅ /api/obras (GET, POST)
   - ✅ /api/obras/[id] (GET, PUT, DELETE)
   - ✅ /api/clientes (GET, POST)
   - ✅ /api/clientes/[id] (GET, PUT, DELETE)

---

## 🔄 APIs Pendientes de Refactorizar

### 1. Proveedores
**Archivos:**
- `src/app/api/proveedores/route.ts`
- `src/app/api/proveedores/[id]/route.ts`

**Patrón a aplicar:**
```typescript
import { NextRequest } from 'next/server'
import {
  withRole,
  handleApiError,
  successResponse,
  createdResponse,
  getPaginationParams,
  createPaginatedResponse,
  verifyResourceOwnership,
} from '@/lib/api-utils'
import { proveedorQuerySchema, proveedorCreateSchema, proveedorUpdateSchema, validateSchema, idSchema } from '@/lib/validations'

// GET - Roles: ADMIN, COMPRAS, CONTADOR, USUARIO
// POST - Roles: ADMIN, COMPRAS
// PUT - Roles: ADMIN, COMPRAS
// DELETE - Roles: ADMIN
```

### 2. Productos
**Archivos:**
- `src/app/api/productos/route.ts`
- `src/app/api/productos/[id]/route.ts`

**Patrón a aplicar:**
```typescript
// GET - Roles: ADMIN, COMPRAS, VENTAS, OBRAS, USUARIO
// POST - Roles: ADMIN, COMPRAS
// PUT - Roles: ADMIN, COMPRAS
// DELETE - Roles: ADMIN
```

### 3. Presupuestos
**Archivos:**
- `src/app/api/presupuestos/route.ts`
- `src/app/api/presupuestos/[id]/route.ts`
- `src/app/api/presupuestos/[id]/conceptos/route.ts`

**Patrón a aplicar:**
```typescript
// GET - Roles: ADMIN, OBRAS, CONTADOR, USUARIO
// POST - Roles: ADMIN, OBRAS
// PUT - Roles: ADMIN, OBRAS
// DELETE - Roles: ADMIN
```

---

## 🎨 Interfaz de Usuario para Estimaciones

### Página Principal: /estimaciones
**Archivo:** `src/app/(dashboard)/estimaciones/page.tsx`

**Componentes necesarios:**
1. **EstimacionTable** - Tabla con paginación
2. **EstimacionForm** - Formulario crear/editar
3. **EstimacionFilters** - Filtros (obra, estado, período)

**Ejemplo de estructura:**
```tsx
'use client'

import { useState, useEffect } from 'react'
import { useToast } from '@/hooks/use-toast'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Plus } from 'lucide-react'

export default function EstimacionesPage() {
  const { toast } = useToast()
  const [estimaciones, setEstimaciones] = useState([])
  const [loading, setLoading] = useState(true)
  const [pagination, setPagination] = useState({ page: 1, limit: 20 })

  // Fetch estimaciones
  useEffect(() => {
    fetchEstimaciones()
  }, [pagination.page])

  const fetchEstimaciones = async () => {
    try {
      const res = await fetch(`/api/estimaciones?page=${pagination.page}&limit=${pagination.limit}`)
      const data = await res.json()

      if (res.ok) {
        setEstimaciones(data.data)
        setPagination(prev => ({ ...prev, ...data.pagination }))
      }
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'No se pudieron cargar las estimaciones'
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold">Estimaciones</h1>
          <p className="text-muted-foreground">Gestión de estimaciones de obra</p>
        </div>
        <Button>
          <Plus className="h-4 w-4 mr-2" />
          Nueva Estimación
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Listado de Estimaciones</CardTitle>
        </CardHeader>
        <CardContent>
          {/* EstimacionTable component */}
        </CardContent>
      </Card>
    </div>
  )
}
```

### Página de Detalle: /estimaciones/[id]
**Archivo:** `src/app/(dashboard)/estimaciones/[id]/page.tsx`

**Funcionalidades:**
- Ver información de la estimación
- Lista de conceptos
- Agregar/editar conceptos
- Generar PDF
- Cambiar estado (BORRADOR → ENVIADA → APROBADA, etc.)

---

## 🔧 Actualización del Sidebar

**Archivo:** `src/components/sidebar.tsx`

**Agregar enlace:**
```tsx
{
  name: 'Estimaciones',
  href: '/estimaciones',
  icon: Calculator, // o FileText
  badge: estimacionesBorrador.length
}
```

---

## 🚀 Comandos Críticos

### 1. Migración de Base de Datos
```bash
npx prisma migrate dev --name add_concepto_estimacion
npx prisma generate
```

### 2. Ejecutar Tests
```bash
npm run test:run
```

### 3. Build del Proyecto
```bash
npm run build
```

---

## 📝 Checklist de Refactorización por API

Para cada API, seguir estos pasos:

### [ ] Proveedores
- [ ] GET /api/proveedores - Agregar paginación y validación
- [ ] POST /api/proveedores - Validar con Zod
- [ ] GET /api/proveedores/[id] - Validar ID y propiedad
- [ ] PUT /api/proveedores/[id] - Validar con Zod partial
- [ ] DELETE /api/proveedores/[id] - Soft delete con roles

### [ ] Productos
- [ ] GET /api/productos - Agregar paginación y filtros
- [ ] POST /api/productos - Validar con Zod
- [ ] GET /api/productos/[id] - Validar ID y propiedad
- [ ] PUT /api/productos/[id] - Validar con Zod partial
- [ ] DELETE /api/productos/[id] - Soft delete con roles

### [ ] Presupuestos
- [ ] GET /api/presupuestos - Agregar paginación
- [ ] POST /api/presupuestos - Validar con Zod
- [ ] GET /api/presupuestos/[id] - Incluir conceptos
- [ ] PUT /api/presupuestos/[id] - Validar con Zod partial
- [ ] DELETE /api/presupuestos/[id] - Validar relaciones
- [ ] GET /api/presupuestos/[id]/conceptos - Listar conceptos
- [ ] POST /api/presupuestos/[id]/conceptos - Crear concepto
- [ ] PUT /api/presupuestos/[id]/conceptos/[conceptoId] - Actualizar
- [ ] DELETE /api/presupuestos/[id]/conceptos/[conceptoId] - Eliminar

---

## 🎯 Prioridades

### Alta Prioridad (Esta Semana)
1. ✅ Ejecutar migración de Prisma
2. ✅ Refactorizar API de proveedores
3. ✅ Refactorizar API de productos
4. ✅ Crear página de listado de estimaciones

### Media Prioridad (Siguiente Semana)
1. Refactorizar API de presupuestos
2. Página de detalle de estimación
3. Componente para agregar conceptos
4. Integrar toasts en formularios existentes

### Baja Prioridad (Mes Siguiente)
1. Mejorar dashboard con gráficas de estimaciones
2. Reportes de estimaciones por obra
3. Exportación Excel de estimaciones
4. Notificaciones por email

---

## 💡 Tips de Desarrollo

### Patrón de Refactorización
1. Copiar código existente
2. Importar utilities de `@/lib/api-utils`
3. Importar schemas de `@/lib/validations`
4. Reemplazar autenticación manual con `withRole()`
5. Agregar validación con `validateSchema()`
6. Usar `handleApiError()` para errores
7. Usar `successResponse()` / `createdResponse()` para respuestas
8. Agregar paginación con `getPaginationParams()` y `createPaginatedResponse()`

### Testing de APIs
```bash
# Usar Thunder Client / Postman / curl

# Ejemplo GET con paginación
GET /api/estimaciones?page=1&limit=20&estado=BORRADOR

# Ejemplo POST
POST /api/estimaciones
Content-Type: application/json
{
  "obraId": "...",
  "numero": 1,
  "periodo": "2025-01",
  "fechaCorte": "2025-01-31T00:00:00.000Z",
  "importeBruto": 100000,
  "amortizacion": 0,
  "retencion": 0,
  "importeNeto": 100000
}
```

---

## 📚 Recursos Útiles

- **Documentación Zod:** https://zod.dev
- **Documentación Prisma:** https://prisma.io/docs
- **Radix UI:** https://radix-ui.com
- **Shadcn/ui:** https://ui.shadcn.com
- **Next.js 14:** https://nextjs.org/docs

---

## ⚠️ Notas Importantes

1. **La base de datos Supabase debe estar accesible** para ejecutar migraciones
2. **Todos los cambios deben pasar los tests** antes de commit
3. **Usar soft delete** (activo: false) en lugar de DELETE real
4. **Validar propiedad de recursos** antes de cualquier operación
5. **Roles correctos** según la operación (lectura vs escritura)

---

**Última actualización:** 2025-12-23
**Estado:** Listo para continuar desarrollo
