# ERP Construcción MX 🏗️

Sistema Integral de Gestión (ERP) diseñado específicamente para empresas constructoras y de maquinaria pesada en México. Centraliza Obras, Finanzas, Compras y Maquinaria en una sola plataforma web y móvil.

![Dashboard Preview](/public/dashboard-preview.png)

## 🚀 Características Principales

### 🚧 Operaciones (Obras)
- **Control de Proyectos**: Gestión de costos y avances por obra.
- **Estimaciones**: Generación de estimaciones para cobro a clientes (con PDF).
- **Asistencia Técnica**: Bitácoras y control de residentes.

### 🚜 Maquinaria Pesada
- **Catálogo de Equipos**: Control de flotilla.
- **Mantenimiento**: Programación de servicios (preventivos/correctivos).
- **Asignaciones**: Rastreo de ubicación y horómetros.

### 💰 Financiero y Fiscal
- **Facturación 4.0**: Emisión de CFDI timbrados.
- **Tesorería**: Control bancario y flujo de efectivo.
- **Contabilidad**: Pólizas automáticas y manuales (cuadre Debe/Haber).
- **Reportes Consolidados**: Estado de resultados por obra y empresa.

### 📦 Compras e Inventario
- **Ciclo Completo**: Requisición -> Orden de Compra -> Recepción -> Factura.
- **Almacén**: Entradas, salidas a obra y control de stock mínimo.

### 🤖 ERP Copilot (IA)
- **Chat Inteligente**: Asistente virtual integrado.
- **Consultas Naturales**: "pregunta" sobre tus finanzas o inventario.
- **Alertas Proactivas**: Avisos de stock bajo o flujo negativo.

### 📱 Super App (PWA)
- **Modo Offline**: Funciona sin internet para captura en obra.
- **Instalable**: Descarga directa en iOS y Android.

## 🛠️ Stack Tecnológico
- **Frontend**: Next.js 14, React, Tailwind CSS, Shadcn UI.
- **Backend**: Next.js API Routes, Server Actions.
- **Base de Datos**: PostgreSQL (Supabase) + Prisma ORM.
- **IA**: Vercel AI SDK + OpenAI.
- **Móvil**: PWA (Service Workers).

## 🚀 Instalación y Despliegue

### Requisitos
- Node.js 18+
- PostgreSQL (Supabase recomendado)

### Pasos
1.  Clonar repositorio.
2.  `npm install`
3.  Configurar `.env` (ver `.env.example`).
4.  `npx prisma db push`
5.  `npm run dev`

### API Keys Requeridas
- `DATABASE_URL` (Supabase)
- `NEXT_PUBLIC_SUPABASE_URL` y Key
- `OPENAI_API_KEY` (Opcional, para Copilot)

## 📄 Licencia
Propiedad Privada - Desarrollado para gestión interna.
