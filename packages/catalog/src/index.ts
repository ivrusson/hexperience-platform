// Public API

// Types re-exported from shared
export type {
  AddonTemplate,
  BaseTemplate,
  Manifest,
  Operation,
  Prompt,
} from '@hexp/shared'
export { Catalog } from './catalog'
// Errors
export {
  ManifestNotFoundError,
  ManifestParseError,
  ManifestValidationError,
} from './errors'
// Internal utilities (exported for testing)
export { ManifestLoader } from './loader'
export type { CatalogResult } from './resolver'
export { CatalogResolver } from './resolver'
