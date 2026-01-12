# @hexp/validation

Sistema de validación de compatibilidad y resolución de dependencias para Hexperience Platform.

## Componentes

- **checkCompatibility**: Valida que la base provee todas las capabilities requeridas por los addons
- **ConflictDetector**: Detecta conflictos entre addons usando el campo `conflicts`
- **resolveDependencies**: Resuelve el orden correcto de aplicación de addons usando topological sort
- **checkFileCollisions**: Detecta colisiones de archivos antes de aplicar operaciones

## Uso

```typescript
import {
  checkCompatibility,
  getCompatibilityErrorMessage,
  ConflictDetector,
  resolveDependencies,
  getDependencyErrorMessage,
  checkFileCollisions,
  getFileCollisionErrorMessage,
} from '@hexp/validation'

// Validar compatibilidad
const compatibility = checkCompatibility(base, addons)
if (!compatibility.isCompatible) {
  const error = getCompatibilityErrorMessage(compatibility, base)
}

// Detectar conflictos
const conflicts = ConflictDetector.check(addons)

// Resolver orden de dependencias
const resolved = resolveDependencies(addons, base.capabilities)
if (resolved.hasCycles) {
  const error = getDependencyErrorMessage(resolved)
}

// Detectar colisiones de archivos
const collisions = checkFileCollisions(baseWithOps, addonsWithOps)
if (collisions.hasCollisions) {
  const error = getFileCollisionErrorMessage(collisions)
}
```
