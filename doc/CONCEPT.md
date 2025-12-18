# Proyecto: Generador de Proyectos por Plantillas (CLI + Engine)

## 1. Visión general

Este proyecto define una **plataforma de generación de proyectos** basada en plantillas modulares, cuyo objetivo es permitir crear stacks backend (y eventualmente frontend) de forma consistente, extensible y mantenible.

La idea central es **separar completamente**:
- el *qué* se genera (plantillas),
- del *cómo* se genera (motor),
- y del *quién* inicia el proceso (CLI).

Esto permite escalar el número de stacks, combinaciones y variantes sin complejizar el generador.

---

## 2. Principios fundamentales

### 2.1 Separación de responsabilidades
- **CLI**: orquesta el flujo y la interacción con el usuario.
- **Engine**: aplica la lógica de composición (render, patches, codemods).
- **Templates**: contienen solo estructura y configuración, nunca lógica.
- **Catalog**: describe qué plantillas existen y cómo se combinan.

Ninguna plantilla conoce al CLI.  
El CLI no contiene lógica específica de stacks.

---

### 2.2 Composición por capas

Un proyecto final se construye como la suma de:

```
Proyecto = Base Stack + Addons + Post-steps
```

- **Base Stack**: stack funcional mínimo (ej. Hono + Drizzle).
- **Addons**: funcionalidades opcionales y reutilizables (auth, sentry, docker…).
- **Post-steps**: pasos finales (install, git, format, docs).

---

### 2.3 Declaratividad primero

Todo el sistema se describe mediante **manifests declarativos** (`manifest.json`):
- sin lógica imperativa,
- sin código específico por stack,
- fácilmente versionables y extensibles.

Esto permite añadir nuevas plantillas sin modificar el engine ni el CLI.

---

## 3. Componentes del sistema

### 3.1 CLI (create-xxx)

Responsabilidades:
- Descubrir bases y addons disponibles.
- Guiar al usuario (modo interactivo o CI).
- Validar compatibilidades.
- Construir un plan de generación.
- Ejecutar el engine.

El CLI **no genera código directamente**.

---

### 3.2 Engine (Composer)

El engine es el núcleo del sistema.

Responsabilidades:
- Renderizar la base stack.
- Aplicar addons en orden seguro.
- Ejecutar operaciones sobre archivos.
- Ejecutar pasos finales.

Pipeline fijo:
1. Render base template.
2. Apply addons (ops).
3. Post-steps.

---

### 3.3 Catalog

El catálogo es el sistema de descubrimiento y validación.

Responsabilidades:
- Localizar manifests en el repo.
- Construir la lista de bases y addons.
- Resolver compatibilidad (`requires`, `provides`, `conflicts`).
- Detectar errores antes de generar código.

---

### 3.4 Templates

#### Base Stack
Representa un stack mínimo funcional.

Incluye:
- estructura de carpetas,
- configuración base,
- scripts,
- puntos de integración conocidos para addons.

Ejemplos:
- `base-hono-drizzle`
- `base-nest-prisma`

#### Addon
Representa una feature reutilizable.

Incluye:
- archivos adicionales,
- modificaciones sobre el proyecto,
- dependencias y configuración.

Ejemplos:
- auth
- sentry
- docker
- CI/CD
- email

#### Tipo de Proyecto: Monorepo vs Single Package

La plataforma puede generar proyectos de dos tipos:

**Single Package:**
Proyecto simple con una sola aplicación o librería.

**Monorepo (Turbo):**
Proyecto multi-package usando Turbo, con estructura:
```
proyecto/
├── apps/          # Aplicaciones
├── packages/      # Librerías compartidas
├── turbo.json     # Configuración Turbo
└── pnpm-workspace.yaml
```

**Estándares del Monorepo:**
- **Turbo** para build system y caching
- **pnpm** como package manager
- **LeftHook** para git hooks (pre-commit, commit-msg, pre-push)
- **commit-lint** con config-conventional para validación de commits
- **Biome.js** para linting y formatting (monorepo-wide)

Los templates pueden especificar `projectType: "monorepo" | "single"` en su manifest.

---

## 4. Manifest (contrato común)

Cada base y addon define un `manifest.json`.

Conceptos clave:
- `id`, `type` (base | addon)
- `capabilities` / `requires`
- `conflicts`
- `prompts` (variables necesarias)
- `ops` (operaciones a ejecutar)

El manifest es el **contrato único** entre templates, engine y CLI.

---

## 5. Operaciones (ops)

Las operaciones definen cómo un addon modifica un proyecto:

- `copy`: copiar archivos.
- `templateRender`: renderizar con variables.
- `jsonMerge`: merge seguro de JSON.
- `textInsert / textReplace`: cambios simples.
- `codemod`: cambios AST seguros (TypeScript).
- `envAppend`: añadir variables de entorno.

Todas las operaciones son:
- deterministas,
- reproducibles,
- auditables.

---

## 6. Compatibilidad y seguridad

El sistema valida antes de generar:

- Compatibilidad base ↔ addons.
- Conflictos entre addons.
- Requisitos no satisfechos.
- Colisiones de archivos.
- Orden correcto de aplicación.

Opcionalmente:
- modo `dry-run`,
- preview del plan de generación.

---

## 7. Estructura recomendada del repositorio

```
repo/
  apps/cli/
  packages/engine/
  packages/catalog/
  templates/
    bases/
    addons/
```

---

## 8. Casos de uso principales

- Generar nuevos proyectos backend para una consultora.
- Asegurar consistencia técnica entre equipos.
- Reducir tiempo de arranque de proyectos.
- Evolucionar stacks sin migraciones manuales.
- Integrar fácilmente nuevos servicios.

---

## 9. Filosofía del proyecto

- **Composición > generación monolítica**
- **Declarativo > imperativo**
- **Motor único > N generadores**
- **Escalable por diseño**
- **Pensado para Platform Engineering**

---

## 10. Futuras extensiones

- Registry remoto de templates.
- Versionado semántico de stacks.
- Soporte frontend y mobile.
- Plugins externos.
- Integración con IA para sugerir addons.