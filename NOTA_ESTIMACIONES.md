# Nota sobre el Módulo de Estimaciones

## Estado Actual

El módulo de **Estimaciones** fue implementado parcialmente con la siguiente arquitectura:

### ✅ Implementado

1. **Tipos TypeScript** - [src/types/estimacion.ts](src/types/estimacion.ts)
2. **API Routes** - 4 endpoints completos
3. **Componentes UI** - EstimacionForm y ConceptoEstimacionTable
4. **Páginas** - Vista de lista y detalle

### ⚠️ Incompatibilidad Detectada

Durante el build se detect\u00f3 que el **schema de Prisma existente** para el modelo `Estimacion` tiene una estructura diferente a la planificada:

**Schema Actual en Base de Datos:**
```prisma
model Estimacion {
  id              String
  obraId          String
  numero          Int
  periodo         String
  fechaCorte      DateTime
  estado          EstadoEstimacion
  importeBruto    Decimal
  amortizacion    Decimal
  retencion       Decimal
  importeNeto     Decimal
  obra            Obra
}
```

**Schema Planificado en Implementación:**
```prisma
model Estimacion {
  id              String
  obraId          String
  presupuestoId   String       # ← NO EXISTE EN DB
  numero          Int
  periodo         String
  fechaInicio     DateTime     # ← DIFERENTE
  fechaFin        DateTime     # ← DIFERENTE
  conceptos       ConceptoEstimacion[]  # ← NO EXISTE EN DB
}
```

## Decisión Tomada

Para **NO afectar datos existentes** en la base de datos y evitar migraciones complejas, se ha decidido:

1. ✅ Mantener el código implementado como referencia
2. ⏸️ Pausar integración completa hasta que se decida:
   - Migrar schema existente al nuevo diseño, O
   - Adaptar implementación al schema actual

## Archivos Creados (Listos para usar cuando se migre el schema)

- `src/types/estimacion.ts`
- `src/app/api/estimaciones/route.ts`
- `src/app/api/estimaciones/[id]/route.ts`
- `src/app/api/estimaciones/[id]/conceptos/route.ts`
- `src/app/api/presupuestos/[id]/avance/route.ts`
- `src/components/estimaciones/EstimacionForm.tsx`
- `src/components/estimaciones/ConceptoEstimacionTable.tsx`
- `src/app/(dashboard)/estimaciones/page.tsx`
- `src/app/(dashboard)/estimaciones/estimaciones-view.tsx`
- `src/app/(dashboard)/estimaciones/[id]/page.tsx`
- `src/app/(dashboard)/estimaciones/[id]/estimacion-detail-view.tsx`

## Próximos Pasos Recomendados

1. **Opción A:** Migrar schema de BD al nuevo diseño con `presupuestoId` y `conceptos`
2. **Opción B:** Adapt Human: sigue con el build