// Public API

// Types re-exported from shared
export type {
  AddonTemplate,
  BaseTemplate,
  Manifest,
  Operation,
  Prompt,
} from '@hexp/shared'
export { Catalog } from './catalog.js'
// Errors
export {
  ManifestNotFoundError,
  ManifestParseError,
  ManifestValidationError,
} from './errors.js'
// Internal utilities (exported for testing)
export { ManifestLoader } from './loader.js'
export type { CatalogResult } from './resolver.js'
export { CatalogResolver } from './resolver.js'
