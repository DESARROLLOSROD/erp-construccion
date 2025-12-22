# ERP Construcción MX

Sistema ERP completo para empresas constructoras en México, desarrollado con Next.js 14, TypeScript, Prisma y Supabase.

## 🚀 Características Principales

### Módulos Implementados

- ✅ **Dashboard** - Resumen ejecutivo con estadísticas en tiempo real
- ✅ **Gestión de Obras** - CRUD completo con estados y seguimiento
- ✅ **Gestión de Clientes** - Catálogo con validación RFC y datos fiscales
- ✅ **Gestión de Proveedores** - Control de proveedores y contactos
- ✅ **Gestión de Productos** - Inventario con control de stock
- ✅ **Presupuestos** - Creación de presupuestos con conceptos detallados
- ✅ **Avance de Obra** - Tracking de progreso por concepto
- ✅ **Exportación PDF** - Generación profesional de presupuestos y avances
- ✅ **Búsqueda Global** - Búsqueda instantánea con Ctrl+K

### Características Técnicas

- 🏢 **Multi-tenancy** - Soporte para múltiples empresas
- 🔐 **Autenticación** - Sistema seguro con Supabase Auth
- 📱 **Responsive** - Diseño adaptable a todos los dispositivos
- 🎨 **UI Moderna** - Componentes con shadcn/ui y Tailwind CSS
- ⌨️ **Atajos de Teclado** - Navegación rápida (Ctrl+K para buscar)
- 📊 **Reportes PDF** - Generación de documentos profesionales
- 🔍 **Búsqueda Inteligente** - Búsqueda en tiempo real con debounce

## 📋 Requisitos Previos

- Node.js 18+
- PostgreSQL 14+
- Cuenta de Supabase (para autenticación)
- npm o pnpm

## 🛠️ Instalación

### 1. Clonar el repositorio

```bash
git clone <repository-url>
cd erp-construccion
```

### 2. Instalar dependencias

```bash
npm install
```

### 3. Configurar variables de entorno

Crear archivo `.env` en la raíz del proyecto:

```env
# Database
DATABASE_URL="postgresql://user:password@localhost:5432/erp_construccion"
DIRECT_URL="postgresql://user:password@localhost:5432/erp_construccion"

# Supabase
NEXT_PUBLIC_SUPABASE_URL="https://your-project.supabase.co"
NEXT_PUBLIC_SUPABASE_ANON_KEY="your-anon-key"
```

### 4. Ejecutar migraciones de base de datos

```bash
npx prisma migrate dev
npx prisma generate
```

### 5. Iniciar servidor de desarrollo

```bash
npm run dev
```

La aplicación estará disponible en `http://localhost:3000`

## 📊 Estadísticas del Proyecto

- **30 Rutas**: 21 páginas + 9 API routes
- **8 Módulos Principales**: Completamente funcionales
- **50+ Componentes**: Reutilizables y tipados
- **15 Modelos de Datos**: Con relaciones completas
- **100% TypeScript**: Tipado estático en todo el proyecto

## 🔧 Scripts Disponibles

```bash
# Desarrollo
npm run dev              # Iniciar servidor de desarrollo

# Build
npm run build            # Compilar para producción
npm start                # Iniciar servidor de producción

# Database
npx prisma studio        # Interfaz visual de base de datos
npx prisma migrate dev   # Crear y aplicar migración
npx prisma generate      # Generar cliente Prisma
```

## 📚 Tecnologías Utilizadas

### Frontend
- **Next.js 14** - Framework React con App Router
- **TypeScript 5** - Tipado estático
- **Tailwind CSS 3** - Estilos utility-first
- **shadcn/ui** - Componentes UI
- **Radix UI** - Primitivos accesibles

### Backend
- **Next.js API Routes** - Endpoints REST
- **Prisma 5** - ORM para PostgreSQL
- **Supabase** - Autenticación y base de datos
- **zod** - Validación de esquemas

### Generación de PDFs
- **jsPDF** - Creación de PDFs
- **jspdf-autotable** - Tablas en PDFs

## 🚧 Próximas Funcionalidades

- [ ] Estimaciones y Facturación
- [ ] Contratos y Convenios
- [ ] Módulo de Tesorería
- [ ] Contabilidad integrada
- [ ] Gestión de Usuarios y Permisos
- [ ] Reportes y Analytics

---

**Desarrollado con ❤️ para la industria de la construcción en México**
