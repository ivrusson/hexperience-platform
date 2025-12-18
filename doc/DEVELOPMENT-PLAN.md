# Plan de Desarrollo - Hexperience Platform

Plan estructurado en hitos, user stories y tareas técnicas para el desarrollo de la plataforma de generación de proyectos por plantillas.

---

## Hito 1: Fundación - Catalog y Tipos Base

**Objetivo:** Implementar el sistema de catálogo que permite descubrir y validar plantillas.

### User Stories

#### US-1.1: Como desarrollador, quiero que el sistema escanee los templates disponibles
**Tareas:**
- [x] Definir tipos TypeScript para `BaseTemplate` y `AddonTemplate`
- [x] Implementar `CatalogResolver.scanTemplates()` que busca `manifest.json` en `templates/bases/` y `templates/addons/`
- [x] Implementar `ManifestLoader.load()` para parsear y validar schemas JSON
- [x] Crear schema JSON para validación de manifests (usar Zod o similar)
- [x] Manejar errores de parsing/validación con mensajes claros
- [x] Tests unitarios para scanner y loader

#### US-1.2: Como desarrollador, quiero validar la estructura de manifests
**Tareas:**
- [x] Definir schema de `manifest.json` (id, type, capabilities, requires, provides, conflicts, prompts, ops)
- [x] Implementar validación de tipos: `base` vs `addon`
- [x] Validar campos requeridos según el tipo
- [x] Validar formato de IDs (naming conventions)
- [x] Tests de validación con casos válidos e inválidos

#### US-1.3: Como desarrollador, quiero obtener la lista de bases y addons disponibles
**Tareas:**
- [x] Implementar `Catalog.getBases()` que retorna array de bases
- [x] Implementar `Catalog.getAddons()` que retorna array de addons
- [x] Implementar `Catalog.getTemplateById(id)` para búsqueda por ID
- [x] Cachear resultados del escaneo para performance
- [x] Tests de integración para el catálogo completo

---

## Hito 2: Engine Core - Operaciones Básicas

**Objetivo:** Implementar el motor de composición con operaciones básicas de manipulación de archivos.

### User Stories

#### US-2.1: Como desarrollador, quiero renderizar una base template
**Tareas:**
- [ ] Definir interfaz `Operation` y tipos de operaciones base
- [ ] Implementar `Workspace.create()` para crear directorio temporal de trabajo
- [ ] Implementar operación `copy`: copiar archivos desde template a workspace
- [ ] Implementar operación `templateRender`: renderizar archivos con variables (Mustache/EJS)
- [ ] Crear `TemplateRenderer` con soporte para variables de prompts
- [ ] Manejar errores de lectura/escritura de archivos
- [ ] Tests para operaciones copy y templateRender

#### US-2.2: Como desarrollador, quiero aplicar addons sobre un proyecto base
**Tareas:**
- [ ] Implementar `Engine.applyAddon()` que ejecuta las ops de un addon
- [ ] Implementar pipeline de operaciones en orden secuencial
- [ ] Manejar errores y rollback parcial si falla una operación
- [ ] Tests para aplicación de addons con múltiples ops

#### US-2.3: Como desarrollador, quiero mergear configuraciones JSON
**Tareas:**
- [ ] Implementar operación `jsonMerge`: merge profundo de objetos JSON
- [ ] Soporte para merge de `package.json`, `tsconfig.json`, etc.
- [ ] Validar JSON resultante después del merge
- [ ] Manejar conflictos de claves (estrategias: overwrite, merge, skip)
- [ ] Tests para jsonMerge con casos complejos (arrays, objetos anidados)

#### US-2.4: Como desarrollador, quiero insertar/reemplazar texto en archivos
**Tareas:**
- [ ] Implementar operación `textInsert`: insertar texto en posición específica
- [ ] Implementar operación `textReplace`: reemplazar texto por patrón
- [ ] Soporte para marcadores (markers) como `// @addon:auth`
- [ ] Validar que los marcadores existen antes de insertar
- [ ] Tests para textInsert y textReplace

---

## Hito 3: CLI Básico - Interfaz de Usuario

**Objetivo:** Implementar la interfaz de línea de comandos mínima funcional.

### User Stories

#### US-3.1: Como usuario, quiero ver las bases y addons disponibles
**Tareas:**
- [ ] Instalar y configurar Commander.js
- [ ] Implementar comando `list` que muestra bases y addons
- [ ] Formato de salida legible (tabla o lista, usar `chalk` para colores)
- [ ] Mostrar metadata relevante (descripción, capabilities, projectType)
- [ ] Integrar con Catalog para obtener templates
- [ ] Opciones: `--bases`, `--addons`, `--all`
- [ ] Tests de CLI con output capturado

#### US-3.2: Como usuario, quiero generar un proyecto de forma interactiva
**Tareas:**
- [ ] Instalar y configurar @clack/prompts
- [ ] Implementar modo interactivo con Clack
- [ ] Prompt para seleccionar tipo de proyecto (single vs monorepo)
- [ ] Prompt para seleccionar base stack (con descripciones)
- [ ] Prompt múltiple para seleccionar addons (checkbox con compatibilidad validada)
- [ ] Prompt para variables requeridas (projectName, db, etc.)
  - Usar `text`, `select`, `confirm`, `multiselect` según tipo
- [ ] Mostrar resumen antes de generar
- [ ] Validar inputs del usuario
- [ ] Usar spinners (ora) durante generación
- [ ] Tests E2E del flujo interactivo

#### US-3.3: Como usuario, quiero generar un proyecto de forma no-interactiva
**Tareas:**
- [ ] Implementar flags CLI con Commander.js:
  - `--base <id>`: Seleccionar base
  - `--addons <ids...>`: Lista de addons
  - `--name <name>`: Nombre del proyecto
  - `--monorepo`: Forzar tipo monorepo
  - `--single`: Forzar tipo single package
  - `--output <dir>`: Directorio de salida
- [ ] Soporte para archivo de configuración (`--config <file>`)
  - Formato JSON o YAML
  - Validar schema con Zod
- [ ] Validar argumentos requeridos
- [ ] Validar compatibilidad de base/addons en modo no-interactivo
- [ ] Mostrar ayuda con `--help` (auto-generada por Commander)
- [ ] Tests de CLI no-interactivo

#### US-3.4: Como usuario, quiero ver un preview antes de generar
**Tareas:**
- [ ] Implementar flag `--dry-run` o `--preview`
- [ ] Mostrar plan de generación sin ejecutar
- [ ] Listar archivos que se crearían/modificarían
- [ ] Mostrar operaciones que se ejecutarían
- [ ] Tests de preview mode

#### US-3.5: Como usuario, quiero usar una interfaz TUI para tareas complejas
**Tareas:**
- [ ] Instalar y configurar Ink + React para TUI
- [ ] Crear componente base de navegación TUI
- [ ] Implementar TUI para crear modelos de datos (similar a lazygit)
  - Editor de modelos con navegación por teclado
  - Definición de campos y tipos
  - Relaciones entre modelos
  - Preview de esquemas
- [ ] Implementar TUI para gestionar estructura de monorepo
  - Agregar/eliminar apps
  - Agregar/eliminar packages
  - Configurar dependencias
  - Visualizar estructura
- [ ] Navegación con teclado (flechas, tab, enter, escape)
- [ ] Persistencia de estado en TUI
- [ ] Tests de componentes TUI

#### US-3.6: Como usuario, quiero generar proyectos monorepo con Turbo
**Tareas:**
- [ ] Agregar opción `--monorepo` en CLI o prompt para tipo de proyecto
- [ ] Generar estructura de monorepo (apps/, packages/)
- [ ] Generar `turbo.json` base con tareas estándar (build, lint, type-check, format, test)
- [ ] Generar `pnpm-workspace.yaml`
- [ ] Configurar LeftHook en proyecto generado:
  - `.lefthook.yml` con hooks pre-commit, commit-msg, pre-push
  - Scripts para ejecutar Biome y commit-lint
- [ ] Configurar commit-lint:
  - `commitlint.config.ts` con config-conventional
  - Integración con LeftHook
- [ ] Configurar Biome.js:
  - `biome.json` con configuración monorepo-wide
  - Scripts en package.json raíz
- [ ] Generar `tsconfig.json` base con project references
- [ ] Tests para generación de monorepos

#### US-3.7: Como usuario, quiero que los proyectos generados tengan estándares de calidad
**Tareas:**
- [ ] Generar `.lefthook.yml` con hooks estándar:
  - pre-commit: Biome check/lint
  - commit-msg: commit-lint
  - pre-push: type-check (opcional)
- [ ] Generar `commitlint.config.ts` con config-conventional
- [ ] Generar `biome.json` con configuración estándar:
  - Formatter (2 espacios, single quotes, etc.)
  - Linter con reglas recomendadas
  - VCS integration
- [ ] Agregar scripts de calidad en package.json:
  - `lint`, `format`, `type-check`, `check`
- [ ] Configurar `.gitignore` con patrones estándar
- [ ] Documentar estándares en README generado
- [ ] Tests de generación de estándares

---

## Hito 4: Validación y Compatibilidad

**Objetivo:** Implementar sistema de validación de compatibilidad y resolución de dependencias.

### User Stories

#### US-4.1: Como desarrollador, quiero validar compatibilidad base-addon
**Tareas:**
- [ ] Implementar `CompatibilityChecker.check()` que valida requires/provides
- [ ] Verificar que base provee todas las capabilities requeridas por addons
- [ ] Generar matriz de compatibilidad
- [ ] Mensajes de error claros cuando falta una capability
- [ ] Tests de compatibilidad con casos válidos e inválidos

#### US-4.2: Como desarrollador, quiero detectar conflictos entre addons
**Tareas:**
- [ ] Implementar detección de conflictos usando array `conflicts` en manifest
- [ ] Validar que addons seleccionados no se conflictúan entre sí
- [ ] Mensajes de error explicando conflictos
- [ ] Sugerencias de addons alternativos si hay conflicto
- [ ] Tests de detección de conflictos

#### US-4.3: Como desarrollador, quiero resolver orden de aplicación de addons
**Tareas:**
- [ ] Implementar `DependencyResolver.resolve()` que ordena addons por dependencias
- [ ] Usar `requires` para construir grafo de dependencias
- [ ] Detectar ciclos en dependencias
- [ ] Aplicar orden topológico
- [ ] Tests de resolución de orden con casos complejos

#### US-4.4: Como desarrollador, quiero validar que no hay colisiones de archivos
**Tareas:**
- [ ] Implementar `FileCollisionDetector.check()` que detecta archivos duplicados
- [ ] Validar antes de aplicar operaciones
- [ ] Permitir overwrite explícito con flag o configuración
- [ ] Mostrar lista de archivos que colisionarían
- [ ] Tests de detección de colisiones

---

## Hito 5: Operaciones Avanzadas y Post-Steps

**Objetivo:** Implementar operaciones avanzadas (codemods, env) y pasos finales de generación.

### User Stories

#### US-5.1: Como desarrollador, quiero realizar transformaciones AST
**Tareas:**
- [ ] Implementar operación `codemod`: transformaciones AST de TypeScript
- [ ] Integrar `ts-morph` o `jscodeshift` para manipulación AST
- [ ] Soporte para operaciones comunes (agregar imports, modificar clases, etc.)
- [ ] Validar AST resultante después de transformación
- [ ] Tests para codemods con casos reales

#### US-5.2: Como desarrollador, quiero agregar variables de entorno
**Tareas:**
- [ ] Implementar operación `envAppend`: agregar variables a `.env`
- [ ] Soporte para `.env`, `.env.example`, `.env.local`
- [ ] Validar formato de variables de entorno
- [ ] Evitar duplicados
- [ ] Tests de envAppend

#### US-5.3: Como usuario, quiero que se instalen dependencias automáticamente
**Tareas:**
- [ ] Implementar post-step `installDependencies`
- [ ] Detectar package manager (pnpm, npm, yarn)
- [ ] Ejecutar `pnpm install` o equivalente
- [ ] Mostrar progreso de instalación
- [ ] Manejar errores de instalación
- [ ] Tests de instalación (mock de package managers)

#### US-5.4: Como usuario, quiero que se formatee y valide el código generado
**Tareas:**
- [ ] Implementar post-step `formatCode` (usar Biome o Prettier)
- [ ] Implementar post-step `lintCode` (usar Biome o ESLint)
- [ ] Implementar post-step `typeCheck` (usar TypeScript)
- [ ] Ejecutar solo si está configurado en el proyecto
- [ ] Tests de post-steps

#### US-5.5: Como usuario, quiero inicializar git en el proyecto generado
**Tareas:**
- [ ] Implementar post-step `gitInit`
- [ ] Ejecutar `git init` si flag está activo
- [ ] Crear commit inicial opcional
- [ ] Configurar `.gitignore` si no existe
- [ ] Tests de gitInit

#### US-5.6: Como usuario, quiero que se genere documentación básica
**Tareas:**
- [ ] Implementar post-step `generateDocs`
- [ ] Generar README.md básico con información del proyecto
- [ ] Incluir instrucciones de setup y uso
- [ ] Mostrar "Next steps" después de generación
- [ ] Tests de generación de docs

---

## Hito 6: Templates de Ejemplo

**Objetivo:** Crear templates de ejemplo funcionales para validar el sistema.

### User Stories

#### US-6.1: Como desarrollador, quiero un template base para monorepo
**Tareas:**
- [ ] Crear `templates/bases/base-monorepo-turbo/`
- [ ] Manifest con `projectType: "monorepo"`
- [ ] Estructura base con:
  - `turbo.json` configurado
  - `pnpm-workspace.yaml`
  - Configuración LeftHook, commit-lint, Biome
  - `tsconfig.json` base con project references
  - Estructura apps/ y packages/ vacía
- [ ] Ejemplos de apps/ y packages/ opcionales
- [ ] Documentación del template
- [ ] Probar generación end-to-end

#### US-6.2: Como desarrollador, quiero un template base mínimo funcional (single package)
**Tareas:**
- [ ] Crear `templates/bases/base-minimal-node/`
- [ ] Definir `manifest.json` con metadata básica
- [ ] Crear estructura `template/` con:
  - `package.json` básico
  - `tsconfig.json`
  - `src/index.ts` con hello world
  - `.gitignore`
- [ ] Probar generación end-to-end
- [ ] Documentar template

#### US-6.3: Como desarrollador, quiero un template base con Hono + Drizzle
**Tareas:**
- [ ] Crear `templates/bases/base-hono-drizzle/`
- [ ] Definir manifest con capabilities: `["web-server", "orm", "typescript"]`
- [ ] Crear estructura con:
  - Servidor Hono básico
  - Configuración Drizzle
  - Ejemplo de ruta y modelo
- [ ] Probar generación y que el proyecto funcione
- [ ] Documentar template

#### US-6.4: Como desarrollador, quiero addons compatibles con monorepo
**Tareas:**
- [ ] Asegurar que addons funcionen en contexto monorepo
- [ ] Addon para agregar nueva app al monorepo:
  - Detectar estructura monorepo
  - Crear nueva app en apps/
  - Actualizar workspace si es necesario
- [ ] Addon para agregar nuevo package al monorepo:
  - Crear package en packages/
  - Configurar dependencias
  - Actualizar project references
- [ ] Tests de addons en contexto monorepo
- [ ] Documentación de compatibilidad monorepo

#### US-6.5: Como desarrollador, quiero un addon de autenticación
**Tareas:**
- [ ] Crear `templates/addons/addon-auth/`
- [ ] Definir manifest con:
  - `requires: ["web-server"]`
  - `provides: ["auth"]`
  - Ops para agregar código de auth
- [ ] Implementar ops:
  - `copy`: archivos de auth
  - `textInsert`: agregar middleware en servidor
  - `jsonMerge`: agregar dependencias
- [ ] Probar con base-hono-drizzle
- [ ] Documentar addon

#### US-6.6: Como desarrollador, quiero un addon de Docker
**Tareas:**
- [ ] Crear `templates/addons/addon-docker/`
- [ ] Definir manifest (sin requires, compatible con cualquier base)
- [ ] Crear `Dockerfile` y `docker-compose.yml`
- [ ] Implementar ops para copiar archivos Docker
- [ ] Probar con diferentes bases
- [ ] Documentar addon

---

## Hito 7: Mejoras y Optimizaciones

**Objetivo:** Mejorar UX, performance y robustez del sistema.

### User Stories

#### US-7.1: Como desarrollador, quiero logs detallados del proceso
**Tareas:**
- [ ] Implementar sistema de logging estructurado
- [ ] Niveles de log: debug, info, warn, error
- [ ] Flag `--verbose` para logs detallados
- [ ] Colores en terminal (usar `chalk` o similar)
- [ ] Progress indicators para operaciones largas

#### US-7.2: Como usuario, quiero ver estadísticas de generación
**Tareas:**
- [ ] Mostrar resumen al finalizar:
  - Archivos creados/modificados
  - Tiempo de ejecución
  - Operaciones ejecutadas
- [ ] Flag `--stats` para mostrar solo estadísticas
- [ ] Formato JSON opcional para CI/CD

#### US-7.3: Como desarrollador, quiero manejar errores de forma robusta
**Tareas:**
- [ ] Implementar error handling centralizado
- [ ] Tipos de error específicos (ValidationError, OperationError, etc.)
- [ ] Mensajes de error claros y accionables
- [ ] Stack traces solo en modo debug
- [ ] Códigos de salida apropiados (0, 1, etc.)

#### US-7.4: Como desarrollador, quiero validar templates en CI
**Tareas:**
- [ ] Comando `validate` que valida todos los templates
- [ ] Validar estructura de manifests
- [ ] Validar que archivos referenciados existen
- [ ] Validar sintaxis de operaciones
- [ ] Integrar en GitHub Actions

#### US-7.5: Como usuario, quiero poder cancelar la generación
**Tareas:**
- [ ] Manejar señales SIGINT/SIGTERM
- [ ] Limpiar workspace temporal al cancelar
- [ ] Mensaje de confirmación antes de cancelar
- [ ] Guardar progreso parcial opcional

---

## Hito 8: Documentación y Testing

**Objetivo:** Completar documentación y cobertura de tests.

### User Stories

#### US-8.1: Como desarrollador, quiero documentación completa de la API
**Tareas:**
- [ ] Documentar API pública de cada package
- [ ] Generar docs con TypeDoc
- [ ] Ejemplos de uso en documentación
- [ ] Guías de desarrollo para contribuidores

#### US-8.2: Como usuario, quiero guías de uso del CLI
**Tareas:**
- [ ] README principal actualizado
- [ ] Guía de uso del CLI
- [ ] Guía de creación de templates
- [ ] Guía de creación de addons
- [ ] Ejemplos y casos de uso

#### US-8.3: Como desarrollador, quiero alta cobertura de tests
**Tareas:**
- [ ] Tests unitarios para todas las funciones core
- [ ] Tests de integración para flujos completos
- [ ] Tests E2E para CLI
- [ ] Tests de templates (snapshot testing)
- [ ] Configurar coverage reports (target: >80%)

---

## Hito 9: Extras y Futuras Extensiones (Opcional)

**Objetivo:** Funcionalidades avanzadas para el futuro.

### User Stories

#### US-9.1: Como desarrollador, quiero un registry remoto de templates
**Tareas:**
- [ ] Diseñar API de registry
- [ ] Implementar cliente para descargar templates remotos
- [ ] Soporte para versionado semántico
- [ ] Caché local de templates remotos

#### US-9.2: Como usuario, quiero sugerencias inteligentes de addons
**Tareas:**
- [ ] Integrar con IA (OpenAI, etc.)
- [ ] Analizar contexto del proyecto
- [ ] Sugerir addons relevantes
- [ ] Aprendizaje de patrones comunes

#### US-9.3: Como desarrollador, quiero plugins externos
**Tareas:**
- [ ] Sistema de plugins
- [ ] API para operaciones custom
- [ ] Carga dinámica de plugins
- [ ] Validación de plugins

---

## Resumen de Prioridades

### Fase 1 (MVP): Hitos 1-3
Fundación básica: Catalog, Engine con operaciones básicas, CLI funcional (comandos + prompts interactivos).

### Fase 2 (Core): Hitos 4-5
Completar funcionalidades core: validación, operaciones avanzadas, post-steps, soporte monorepo.

### Fase 3 (TUI): Hito 3.5
Implementar TUI con Ink para tareas complejas (gestión de modelos, monorepo).

### Fase 4 (Validación): Hito 6
Templates de ejemplo para validar que todo funciona (single package y monorepo).

### Fase 5 (Polish): Hitos 7-8
Mejoras, optimizaciones, documentación y tests.

### Fase 6 (Futuro): Hito 9
Funcionalidades avanzadas opcionales.

---

## Stack Tecnológico

Ver [CLI-TECH-STACK.md](./CLI-TECH-STACK.md) para detalles de librerías y arquitectura.

**Resumen:**
- **CLI Framework:** Commander.js
- **Prompts:** @clack/prompts
- **TUI:** Ink + React
- **Utilidades:** chalk, ora, listr2, fs-extra

**Estándares para proyectos generados:**
- Monorepo: Turbo + pnpm
- Git hooks: LeftHook
- Commits: commit-lint (conventional)
- Linting/Formatting: Biome.js

---

## Métricas de Éxito

- ✅ Generar un proyecto funcional con base + addon
- ✅ Generar proyecto monorepo con estándares (Turbo, LeftHook, commit-lint, Biome)
- ✅ TUI funcional para gestión de modelos y monorepo
- ✅ Validar compatibilidad correctamente
- ✅ 100% de tests pasando en CI
- ✅ Documentación completa y actualizada
- ✅ Al menos 2 bases (single + monorepo) y 4 addons de ejemplo funcionando

