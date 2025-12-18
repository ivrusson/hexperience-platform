# Stack Tecnológico del CLI

## Librerías Principales

### CLI Framework: Commander.js
- **Package:** `commander`
- **Versión:** ^12.0.0
- **Uso:** Gestión de comandos, subcomandos, argumentos y opciones
- **Razón:** Maduro, bien documentado, ampliamente usado, excelente soporte TypeScript

### Prompts Interactivos: Clack
- **Package:** `@clack/prompts`
- **Versión:** ^1.0.0
- **Uso:** Prompts modernos para modo interactivo (selección de bases, addons, variables)
- **Razón:** Más moderno que inquirer, mejor UX, TypeScript first, componentes bellos

### TUI Framework: Ink
- **Package:** `ink`, `react`
- **Versión:** ^4.4.1, ^18.3.1
- **Uso:** Interfaces complejas tipo lazygit (gestión de modelos de datos, navegación interactiva)
- **Razón:** React en terminal, flexbox layout, componentes reutilizables, ecosistema maduro

### Utilidades Adicionales
- **`chalk`** (^5.3.0): Colores y estilos en terminal
- **`ora`** (^8.0.1): Spinners y indicadores de carga
- **`listr2`** (^8.0.0): Ejecución de tareas con progreso visual
- **`fs-extra`** (^11.2.0): Operaciones de archivos mejoradas
- **`zod`** (^3.23.0): Validación de esquemas y tipos

## Estructura del CLI

```
apps/cli/
├── src/
│   ├── commands/          # Comandos commander.js
│   │   ├── create.ts      # Comando principal create
│   │   ├── list.ts        # Listar templates
│   │   └── tui.ts         # Modo TUI
│   ├── tui/               # Componentes Ink para TUI
│   │   ├── ModelEditor/   # Editor de modelos de datos
│   │   ├── MonorepoManager/ # Gestor de estructura monorepo
│   │   └── Navigation/    # Componentes de navegación
│   ├── prompts/           # Prompts con Clack
│   │   ├── selectBase.ts
│   │   ├── selectAddons.ts
│   │   └── collectVars.ts
│   ├── utils/             # Utilidades compartidas
│   │   ├── logger.ts
│   │   └── validators.ts
│   └── index.ts           # Entry point
```

## Modos de Operación

### 1. Modo Comando (Commander.js)
Para uso en CI/CD y scripts:
```bash
create-hexp --base hono-drizzle --addons auth,docker --name my-project
```

### 2. Modo Interactivo (Clack)
Para guiar al usuario paso a paso:
```bash
create-hexp
# Muestra prompts interactivos para seleccionar base, addons, variables
```

### 3. Modo TUI (Ink)
Para tareas complejas tipo lazygit:
```bash
create-hexp tui models    # Editor de modelos de datos
create-hexp tui monorepo  # Gestor de estructura monorepo
```

## Casos de Uso TUI

### Gestión de Modelos de Datos
Interfaz tipo lazygit para:
- Crear/editar modelos de datos (Drizzle, Prisma, etc.)
- Definir relaciones entre modelos
- Gestionar migraciones
- Preview de esquemas

### Gestión de Monorepo
Interfaz para:
- Agregar nuevas apps al monorepo
- Agregar nuevos packages
- Configurar dependencias entre packages
- Visualizar estructura del monorepo

## Referencias

- [Commander.js Docs](https://github.com/tj/commander.js)
- [Clack Docs](https://github.com/bombshell-dev/clack)
- [Ink Docs](https://github.com/vadimdemedes/ink)
- [React Docs](https://react.dev/)

