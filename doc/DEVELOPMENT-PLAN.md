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
- [x] Definir interfaz `Operation` y tipos de operaciones base
- [x] Implementar `Workspace.create()` para crear directorio temporal de trabajo
- [x] Implementar operación `copy`: copiar archivos desde template a workspace
- [x] Implementar operación `templateRender`: renderizar archivos con variables (Mustache/EJS)
- [x] Crear `TemplateRenderer` con soporte para variables de prompts
- [x] Manejar errores de lectura/escritura de archivos
- [x] Tests para operaciones copy y templateRender

#### US-2.2: Como desarrollador, quiero aplicar addons sobre un proyecto base
**Tareas:**
- [x] Implementar `Engine.applyAddon()` que ejecuta las ops de un addon
- [x] Implementar pipeline de operaciones en orden secuencial
- [x] Manejar errores y rollback parcial si falla una operación
- [x] Tests para aplicación de addons con múltiples ops

#### US-2.3: Como desarrollador, quiero mergear configuraciones JSON
**Tareas:**
- [x] Implementar operación `jsonMerge`: merge profundo de objetos JSON
- [x] Soporte para merge de `package.json`, `tsconfig.json`, etc.
- [x] Validar JSON resultante después del merge
- [x] Manejar conflictos de claves (estrategias: overwrite, merge, skip)
- [x] Tests para jsonMerge con casos complejos (arrays, objetos anidados)

#### US-2.4: Como desarrollador, quiero insertar/reemplazar texto en archivos
**Tareas:**
- [x] Implementar operación `textInsert`: insertar texto en posición específica
- [x] Implementar operación `textReplace`: reemplazar texto por patrón
- [x] Soporte para marcadores (markers) como `// @addon:auth`
- [x] Validar que los marcadores existen antes de insertar
- [x] Tests para textInsert y textReplace

---

## Hito 3: CLI Básico - Interfaz de Usuario

**Objetivo:** Implementar la interfaz de línea de comandos mínima funcional.

### User Stories

#### US-3.1: Como usuario, quiero ver las bases y addons disponibles
**Tareas:**
- [x] Instalar y configurar Commander.js
- [x] Implementar comando `list` que muestra bases y addons
- [x] Formato de salida legible (tabla o lista, usar `chalk` para colores)
- [x] Mostrar metadata relevante (descripción, capabilities, projectType)
- [x] Integrar con Catalog para obtener templates
- [x] Opciones: `--bases`, `--addons`, `--all`
- [x] Tests de CLI con output capturado

#### US-3.2: Como usuario, quiero generar un proyecto de forma interactiva
**Tareas:**
- [x] Instalar y configurar @clack/prompts
- [x] Implementar modo interactivo con Clack
- [x] Prompt para seleccionar tipo de proyecto (single vs monorepo)
- [x] Prompt para seleccionar base stack (con descripciones)
- [x] Prompt múltiple para seleccionar addons (checkbox con compatibilidad validada)
- [x] Prompt para variables requeridas (projectName, db, etc.)
  - Usar `text`, `select`, `confirm`, `multiselect` según tipo
- [x] Mostrar resumen antes de generar
- [x] Validar inputs del usuario
- [x] Usar spinners (ora) durante generación
- [x] Tests E2E del flujo interactivo

#### US-3.3: Como usuario, quiero generar un proyecto de forma no-interactiva
**Tareas:**
- [x] Implementar flags CLI con Commander.js:
  - `--base <id>`: Seleccionar base
  - `--addons <ids...>`: Lista de addons
  - `--name <name>`: Nombre del proyecto
  - `--monorepo`: Forzar tipo monorepo
  - `--single`: Forzar tipo single package
  - `--output <dir>`: Directorio de salida
- [x] Soporte para archivo de configuración (`--config <file>`)
  - Formato JSON o YAML
  - Validación de estructura con Zod
- [x] Validar argumentos requeridos
- [x] Validar compatibilidad de base/addons en modo no-interactivo
- [x] Mostrar ayuda con `--help` (auto-generada por Commander)
- [x] Tests de CLI no-interactivo

#### US-3.4: Como usuario, quiero ver un preview antes de generar
**Tareas:**
- [x] Implementar flag `--dry-run` o `--preview`
- [x] Mostrar plan de generación sin ejecutar
- [x] Listar archivos que se crearían/modificarían
- [x] Mostrar operaciones que se ejecutarían
- [x] Tests de preview mode

#### US-3.5: Como usuario, quiero usar una interfaz TUI para tareas complejas
**Tareas:**
- [x] Instalar y configurar Ink + React para TUI
- [x] Crear componente base de navegación TUI
- [x] Implementar TUI para crear modelos de datos (similar a lazygit)
  - Editor de modelos con navegación por teclado
  - Definición de campos y tipos
  - Relaciones entre modelos
  - Preview de esquemas
- [x] Implementar TUI para gestionar estructura de monorepo
  - Agregar/eliminar apps
  - Agregar/eliminar packages
  - Configurar dependencias
  - Visualizar estructura
- [x] Navegación con teclado (flechas, tab, enter, escape)
- [x] Persistencia de estado en TUI
- [x] Tests de componentes TUI

#### US-3.6: Como usuario, quiero generar proyectos monorepo con Turbo
**Tareas:**
- [x] Agregar opción `--monorepo` en CLI o prompt para tipo de proyecto
- [x] Generar estructura de monorepo (apps/, packages/)
- [x] Generar `turbo.json` base con tareas estándar (build, lint, type-check, format, test)
- [x] Generar `pnpm-workspace.yaml`
- [x] Configurar LeftHook en proyecto generado:
  - `.lefthook.yml` con hooks pre-commit, commit-msg, pre-push
  - Scripts para ejecutar Biome y commit-lint
- [x] Configurar commit-lint:
  - `commitlint.config.ts` con config-conventional
  - Integración con LeftHook
- [x] Configurar Biome.js:
  - `biome.json` con configuración monorepo-wide
  - Scripts en package.json raíz
- [x] Generar `tsconfig.json` base con project references
- [x] Tests para generación de monorepos

#### US-3.7: Como usuario, quiero que los proyectos generados tengan estándares de calidad
**Tareas:**
- [x] Generar `.lefthook.yml` con hooks estándar:
  - pre-commit: Biome check/lint
  - commit-msg: commit-lint
  - pre-push: type-check (opcional)
- [x] Generar `commitlint.config.ts` con config-conventional
- [x] Generar `biome.json` con configuración estándar:
  - Formatter (2 espacios, single quotes, etc.)
  - Linter con reglas recomendadas
  - VCS integration
- [x] Agregar scripts de calidad en package.json:
  - `lint`, `format`, `type-check`, `check`
- [x] Configurar `.gitignore` con patrones estándar
- [x] Documentar estándares en README generado
- [x] Tests de generación de estándares

---

## Hito 4: Validación y Compatibilidad

**Objetivo:** Implementar sistema de validación de compatibilidad y resolución de dependencias.

### User Stories

#### US-4.1: Como desarrollador, quiero validar compatibilidad base-addon
**Tareas:**
- [x] Implementar `CompatibilityChecker.check()` que valida requires/provides
- [x] Verificar que base provee todas las capabilities requeridas por addons
- [x] Generar matriz de compatibilidad
- [x] Mensajes de error claros cuando falta una capability
- [x] Tests de compatibilidad con casos válidos e inválidos

#### US-4.2: Como desarrollador, quiero detectar conflictos entre addons
**Tareas:**
- [x] Implementar detección de conflictos usando array `conflicts` en manifest
- [x] Validar que addons seleccionados no se conflictúan entre sí
- [x] Mensajes de error explicando conflictos
- [x] Sugerencias de addons alternativos si hay conflicto
- [x] Tests de detección de conflictos

#### US-4.3: Como desarrollador, quiero resolver orden de aplicación de addons
**Tareas:**
- [x] Implementar `DependencyResolver.resolve()` que ordena addons por dependencias
- [x] Usar `requires` para construir grafo de dependencias
- [x] Detectar ciclos en dependencias
- [x] Aplicar orden topológico
- [x] Tests de resolución de orden con casos complejos

#### US-4.4: Como desarrollador, quiero validar que no hay colisiones de archivos
**Tareas:**
- [x] Implementar `FileCollisionDetector.check()` que detecta archivos duplicados
- [x] Validar antes de aplicar operaciones
- [x] Permitir overwrite explícito con flag o configuración
- [x] Mostrar lista de archivos que colisionarían
- [x] Tests de detección de colisiones

---

## Hito 5: Operaciones Avanzadas y Post-Steps

**Objetivo:** Implementar operaciones avanzadas (codemods, env) y pasos finales de generación.

### User Stories

#### US-5.1: Como desarrollador, quiero realizar transformaciones AST
**Tareas:**
- [x] Implementar operación `codemod`: transformaciones AST de TypeScript
- [x] Integrar `ts-morph` o `jscodeshift` para manipulación AST
- [x] Soporte para operaciones comunes (agregar imports, modificar clases, etc.)
- [x] Validar AST resultante después de transformación
- [x] Tests para codemods con casos reales

#### US-5.2: Como desarrollador, quiero agregar variables de entorno
**Tareas:**
- [x] Implementar operación `envAppend`: agregar variables a `.env`
- [x] Soporte para `.env`, `.env.example`, `.env.local`
- [x] Validar formato de variables de entorno
- [x] Evitar duplicados
- [x] Tests de envAppend

#### US-5.3: Como usuario, quiero que se instalen dependencias automáticamente
**Tareas:**
- [x] Implementar post-step `installDependencies`
- [x] Detectar package manager (pnpm, npm, yarn)
- [x] Ejecutar `pnpm install` o equivalente
- [x] Mostrar progreso de instalación
- [x] Manejar errores de instalación
- [x] Tests de instalación (mock de package managers)

#### US-5.4: Como usuario, quiero que se formatee y valide el código generado
**Tareas:**
- [x] Implementar post-step `formatCode` (usar Biome o Prettier)
- [x] Implementar post-step `lintCode` (usar Biome o ESLint)
- [x] Implementar post-step `typeCheck` (usar TypeScript)
- [x] Ejecutar solo si está configurado en el proyecto
- [x] Tests de post-steps

#### US-5.5: Como usuario, quiero inicializar git en el proyecto generado
**Tareas:**
- [x] Implementar post-step `gitInit`
- [x] Ejecutar `git init` si flag está activo
- [x] Crear commit inicial opcional
- [x] Configurar `.gitignore` si no existe
- [x] Tests de gitInit

#### US-5.6: Como usuario, quiero que se genere documentación básica
**Tareas:**
- [x] Implementar post-step `generateDocs`
- [x] Generar README.md básico con información del proyecto
- [x] Incluir instrucciones de setup y uso
- [x] Mostrar "Next steps" después de generación
- [x] Tests de generación de docs

---

## Hito 6: Templates de Ejemplo

**Objetivo:** Crear templates de ejemplo funcionales para validar el sistema.

### User Stories

#### US-6.1: Como desarrollador, quiero un template base para monorepo
**Tareas:**
- [x] Crear `templates/bases/base-monorepo-turbo/`
- [x] Manifest con `projectType: "monorepo"`
- [x] Estructura base con:
  - `turbo.json` configurado
  - `pnpm-workspace.yaml`
  - Configuración LeftHook, commit-lint, Biome
  - `tsconfig.json` base con project references
  - Estructura apps/ y packages/ vacía
- [x] Ejemplos de apps/ y packages/ opcionales
- [x] Documentación del template
- [x] Probar generación end-to-end

#### US-6.2: Como desarrollador, quiero un template base mínimo funcional (single package)
**Tareas:**
- [x] Crear `templates/bases/base-minimal-node/`
- [x] Definir `manifest.json` con metadata básica
- [x] Crear estructura `template/` con:
  - `package.json` básico
  - `tsconfig.json`
  - `src/index.ts` con hello world
  - `.gitignore`
- [x] Probar generación end-to-end
- [x] Documentar template

#### US-6.3: Como desarrollador, quiero un template base con Hono + Drizzle
**Tareas:**
- [x] Crear `templates/bases/base-hono-drizzle/`
- [x] Definir manifest con capabilities: `["web-server", "orm", "typescript"]`
- [x] Crear estructura con:
  - Servidor Hono básico
  - Configuración Drizzle
  - Ejemplo de ruta y modelo
- [x] Probar generación y que el proyecto funcione
- [x] Documentar template

#### US-6.4: Como desarrollador, quiero addons compatibles con monorepo
**Tareas:**
- [x] Asegurar que addons funcionen en contexto monorepo
- [x] Addon para agregar nueva app al monorepo:
  - Detectar estructura monorepo
  - Crear nueva app en apps/
  - Actualizar workspace si es necesario
- [x] Addon para agregar nuevo package al monorepo:
  - Crear package en packages/
  - Configurar dependencias
  - Actualizar project references
- [x] Tests de addons en contexto monorepo
- [x] Documentación de compatibilidad monorepo

#### US-6.5: Como desarrollador, quiero un addon de autenticación
**Tareas:**
- [x] Crear `templates/addons/addon-auth/`
- [x] Definir manifest con:
  - `requires: ["web-server"]`
  - `provides: ["auth"]`
  - Ops para agregar código de auth
- [x] Implementar ops:
  - `copy`: archivos de auth
  - `textInsert`: agregar middleware en servidor
  - `jsonMerge`: agregar dependencias
- [x] Probar con base-hono-drizzle
- [x] Documentar addon

#### US-6.6: Como desarrollador, quiero un addon de Docker
**Tareas:**
- [x] Crear `templates/addons/addon-docker/`
- [x] Definir manifest (sin requires, compatible con cualquier base)
- [x] Crear `Dockerfile` y `docker-compose.yml`
- [x] Implementar ops para copiar archivos Docker
- [x] Probar con diferentes bases
- [x] Documentar addon

---

## Hito 7: Mejoras y Optimizaciones

**Objetivo:** Mejorar UX, performance y robustez del sistema.

### User Stories

#### US-7.1: Como desarrollador, quiero logs detallados del proceso
**Tareas:**
- [x] Implementar sistema de logging estructurado
- [x] Niveles de log: debug, info, warn, error
- [x] Flag `--verbose` para logs detallados
- [x] Colores en terminal (usar `chalk` o similar)
- [x] Progress indicators para operaciones largas

#### US-7.2: Como usuario, quiero ver estadísticas de generación
**Tareas:**
- [x] Mostrar resumen al finalizar:
  - Archivos creados/modificados
  - Tiempo de ejecución
  - Operaciones ejecutadas
- [x] Flag `--stats` para mostrar solo estadísticas
- [x] Formato JSON opcional para CI/CD

#### US-7.3: Como desarrollador, quiero manejar errores de forma robusta
**Tareas:**
- [x] Implementar error handling centralizado
- [x] Tipos de error específicos (ValidationError, OperationError, etc.)
- [x] Mensajes de error claros y accionables
- [x] Stack traces solo en modo debug
- [x] Códigos de salida apropiados (0, 1, etc.)

#### US-7.4: Como desarrollador, quiero validar templates en CI
**Tareas:**
- [x] Comando `validate` que valida todos los templates
- [x] Validar estructura de manifests
- [x] Validar que archivos referenciados existen
- [x] Validar sintaxis de operaciones
- [ ] Integrar en GitHub Actions (opcional)

#### US-7.5: Como usuario, quiero poder cancelar la generación
**Tareas:**
- [x] Manejar señales SIGINT/SIGTERM
- [x] Limpiar workspace temporal al cancelar
- [x] Mensaje de confirmación antes de cancelar
- [x] Guardar progreso parcial opcional

---

## Hito 8: Documentación y Testing

**Objetivo:** Completar documentación y cobertura de tests.

### User Stories

#### US-8.1: Como desarrollador, quiero documentación completa de la API
**Tareas:**
- [x] Documentar API pública de cada package (JSDoc en código)
- [x] Generar docs con TypeDoc
- [x] Ejemplos de uso en documentación
- [x] Guías de desarrollo para contribuidores (CONTRIBUTING.md)

#### US-8.2: Como usuario, quiero guías de uso del CLI
**Tareas:**
- [x] README principal actualizado
- [x] Guía de uso del CLI (USER-GUIDE.md)
- [x] Guía de creación de templates (TEMPLATE-GUIDE.md)
- [x] Guía de creación de addons (ADDON-GUIDE.md)
- [x] Ejemplos y casos de uso (EXAMPLES.md)

#### US-8.3: Como desarrollador, quiero alta cobertura de tests
**Tareas:**
- [x] Tests unitarios para todas las funciones core
- [x] Tests de integración para flujos completos
- [x] Tests E2E para CLI
- [x] Tests de templates (snapshot testing)
- [x] Configurar coverage reports (target: >80%)

---

## Hito 9: Extras y Futuras Extensiones (Opcional)

**Objetivo:** Funcionalidades avanzadas para el futuro.

### User Stories

#### US-9.1: Como desarrollador, quiero un registry remoto de templates
**Tareas:**
- [x] Diseñar API de registry
- [x] Implementar cliente para descargar templates remotos
- [x] Soporte para versionado semántico
- [x] Caché local de templates remotos

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

