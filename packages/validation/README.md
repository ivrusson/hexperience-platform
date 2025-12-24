# @hexp/validation

Sistema de validación de compatibilidad y resolución de dependencias para Hexperience Platform.

## Componentes

- **CompatibilityChecker**: Valida que la base provee todas las capabilities requeridas por los addons
- **ConflictDetector**: Detecta conflictos entre addons usando el campo `conflicts`
- **DependencyResolver**: Resuelve el orden correcto de aplicación de addons usando topological sort
- **FileCollisionDetector**: Detecta colisiones de archivos antes de aplicar operaciones

## Uso

```typescript
import { CompatibilityChecker, ConflictDetector, DependencyResolver, FileCollisionDetector } from '@hexp/validation'

// Validar compatibilidad
const compatibility = CompatibilityChecker.check(base, addons)

// Detectar conflictos
const conflicts = ConflictDetector.check(addons)

// Resolver orden de dependencias
const resolved = DependencyResolver.resolve(addons, base.capabilities)

// Detectar colisiones de archivos
const collisions = FileCollisionDetector.check(baseWithOps, addonsWithOps)
```
