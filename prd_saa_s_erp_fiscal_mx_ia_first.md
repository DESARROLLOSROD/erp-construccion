# PRD – SaaS ERP Fiscal MX (IA‑First)

## 1. Visión del producto
Crear un **SaaS ERP 100% web, multi-empresa y multi-usuario**, diseñado **específicamente para empresas de construcción y minería en México**, que reemplace soluciones tradicionales como Aspel (SAE, COI, NOI, BANCO), considerando **obras, contratos, maquinaria pesada, control de costos por proyecto**, y **cumplimiento fiscal mexicano (SAT)**. El sistema será construido **IA-first**, permitiendo escalar como producto comercial especializado en el sector.

---

## 2. Objetivos clave
- Reemplazar procesos actuales hechos en Aspel
- Reducir dependencia de software local
- Automatizar contabilidad y fiscal con reglas
- Tener un sistema **web, moderno y escalable**
- Construir rápido usando **IA + validación humana**

---

## 3. Usuarios objetivo

### 3.1 Roles
- **Administrador general** (empresa)
- **Contador**
- **Ventas / Compras**
- **RH / Nómina**
- **Auditor (solo lectura)**

### 3.2 Tipo de empresa
- PYMES mexicanas
- 1 a 200 empleados
- 1 a múltiples sucursales

---

## 4. Alcance funcional (MVP → Completo)

### 4.1 Módulo 1 – Core SaaS (obligatorio)
- Autenticación (JWT / OAuth)
- Multi-tenant (empresa aislada)
- Roles y permisos por obra/proyecto
- Auditoría de acciones

---

### 4.2 Módulo 2 – Gestión de Obras y Proyectos (CRÍTICO)

**Funcionalidades**
- Obras / proyectos
- Contratos por obra
- Presupuestos por concepto
- Control de avances físicos y financieros
- Estimaciones
- Retenciones
- Bitácora de obra

**Reglas clave**
- Todo movimiento se asocia a una obra
- Control por centro de costos

---

### 4.3 Módulo 3 – ERP Administrativo

**Funcionalidades**
- Clientes (constructoras, mineras, gobierno)
- Proveedores (materiales, renta, servicios)
- Productos / insumos
- Compras
- Ventas
- Inventarios por almacén y obra

---

### 4.4 Módulo 4 – Facturación CFDI 4.0 (Obras)

**Funcionalidades**
- CFDI por estimación de obra
- CFDI por anticipo
- CFDI de retenciones
- Complemento de pagos
- Cancelaciones

**Integraciones**
- PAC autorizado
- Validación XSD SAT

---

### 4.5 Módulo 5 – Contabilidad por Proyecto

**Funcionalidades**
- Catálogo de cuentas SAT
- Pólizas automáticas por obra
- Estados financieros por proyecto
- Balanza consolidada
- Exportación XML SAT

---

### 4.6 Módulo 6 – Nómina especializada

**Funcionalidades**
- Empleados por obra
- Jornales
- Destajos
- Horas extra
- Nómina CFDI
- IMSS (SBC variable)

---

### 4.7 Módulo 7 – Maquinaria y Equipo (CRÍTICO)

**Funcionalidades**
- Maquinaria pesada
- Asignación por obra
- Horómetros
- Consumo de combustible
- Mantenimiento preventivo y correctivo
- Costeo por hora

---

### 4.8 Módulo 8 – Tesorería y Bancos

**Funcionalidades**
- Flujo de efectivo por obra
- Conciliación bancaria
- Control de anticipos

---

## 5. Requisitos no funcionales


- 100% web
- Tiempo de respuesta < 300ms
- Backups automáticos
- Cifrado en reposo y tránsito
- Cumplimiento OWASP Top 10

---

## 6. Arquitectura técnica

### 6.1 Stack base
- **Frontend:** Next.js + TypeScript
- **Backend:** NestJS
- **DB:** PostgreSQL
- **ORM:** Prisma
- **Infra:** Vercel + Railway / AWS

### 6.2 Arquitectura lógica
- Monorepo
- Modular por dominio
- APIs REST
- Eventos internos

---

## 7. IA como motor de desarrollo

### 7.1 Agentes IA definidos

| Agente | Responsabilidad |
|------|-----------------|
| Arquitecto | Definir estructura y límites |
| Backend | APIs y reglas |
| Frontend | UI/UX |
| QA | Tests automáticos |
| Fiscal | Validar reglas SAT |
| Refactor | Limpieza continua |
| Docs | Documentación |

---

### 7.2 Flujo IA
1. PRD → prompts
2. Generación de código
3. Tests automáticos
4. Refactor
5. Validación humana

---

## 8. Testing obligatorio

- Unit tests automáticos
- Tests fiscales por escenario
- Validación XML SAT
- Pruebas de regresión

---

## 9. Roadmap

### Fase 1 (30–45 días)
- Core SaaS
- ERP
- CFDI

### Fase 2 (60–90 días)
- Contabilidad

### Fase 3 (90–120 días)
- Nómina
- Bancos

---

## 10. Riesgos y mitigación

| Riesgo | Mitigación |
|-----|-----------|
| Error fiscal | Tests + validadores |
| Código inconsistente | Arquitecto IA |
| Dependencia IA | Docs automáticas |

---

## 11. Criterios de éxito

- Puede facturar legalmente
- Puede generar balanza SAT
- Puede emitir nómina CFDI
- Usuarios pueden operar sin Aspel

---

## 12. Estado del documento
**Versión:** 1.0  
**Tipo:** PRD para desarrollo con IA (Cursor / Claude / GPT)

