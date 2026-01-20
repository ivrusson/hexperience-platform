import type { Operation } from '@hexp/shared'

/**
 * Template with operations
 */
export interface TemplateWithOps {
  templateDir: string
  ops?: Operation[]
}

/**
 * Collision information
 */
export interface CollisionInfo {
  file: string
  operations: Operation[]
  sources: string[]
}

/**
 * Result of file collision detection
 */
export interface CollisionResult {
  /** Whether there are any collisions */
  hasCollisions: boolean
  /** List of collisions found */
  collisions: CollisionInfo[]
  /** Map of file paths to operations that affect them */
  collisionMap: Map<string, Operation[]>
}

/**
 * Check for file collisions in operations
 */
export function checkFileCollisions(
  base: TemplateWithOps,
  addons: TemplateWithOps[]
): CollisionResult {
  const fileOperations = new Map<
    string,
    Array<{ op: Operation; source: string }>
  >()

  // Collect all file operations from base
  const baseOps = base.ops || []
  for (const op of baseOps) {
    const files = getAffectedFiles(op)
    for (const file of files) {
      if (!fileOperations.has(file)) {
        fileOperations.set(file, [])
      }
      fileOperations.get(file)?.push({ op, source: base.templateDir })
    }
  }

  // Collect all file operations from addons
  for (const addon of addons) {
    const addonOps = addon.ops || []
    for (const op of addonOps) {
      const files = getAffectedFiles(op)
      for (const file of files) {
        if (!fileOperations.has(file)) {
          fileOperations.set(file, [])
        }
        fileOperations.get(file)?.push({ op, source: addon.templateDir })
      }
    }
  }

  // Find collisions (files with multiple operations)
  const collisions: CollisionInfo[] = []
  const collisionMap = new Map<string, Operation[]>()

  for (const [file, ops] of fileOperations) {
    if (ops.length > 1) {
      // Skip collisions on "." (root directory) for templateRender operations
      // as these are typically designed to work together
      if (file === '.' || file === '') {
        const allTemplateRender = ops.every(
          (o: { op: Operation; source: string }) =>
            o.op.type === 'templateRender'
        )
        if (allTemplateRender) {
          continue // Allow multiple templateRender to "." operations
        }
      }

      // Check if collision is allowed
      const isAllowed = isCollisionAllowed(
        ops.map((o: { op: Operation; source: string }) => o.op)
      )

      if (!isAllowed) {
        collisions.push({
          file,
          operations: ops.map((o: { op: Operation; source: string }) => o.op),
          sources: ops.map((o: { op: Operation; source: string }) => o.source),
        })
        collisionMap.set(
          file,
          ops.map((o: { op: Operation; source: string }) => o.op)
        )
      }
    }
  }

  return {
    hasCollisions: collisions.length > 0,
    collisions,
    collisionMap,
  }
}

/**
 * Get files affected by an operation
 */
function getAffectedFiles(op: Operation): string[] {
  switch (op.type) {
    case 'copy':
      return op.to ? [op.to] : []
    case 'templateRender':
      return op.to ? [op.to] : []
    case 'jsonMerge':
      return op.target ? [op.target] : []
    case 'textInsert':
      return op.target ? [op.target] : []
    case 'textReplace':
      return op.target ? [op.target] : []
    default:
      return []
  }
}

/**
 * Check if a collision is allowed (e.g., jsonMerge operations can merge)
 */
function isCollisionAllowed(operations: Operation[]): boolean {
  // If all operations are jsonMerge on the same target, it's allowed (merging)
  if (operations.every((op) => op.type === 'jsonMerge')) {
    return true
  }

  // If all operations are textInsert on the same target, it's allowed
  // (they use different markers to insert at different locations)
  if (operations.every((op) => op.type === 'textInsert')) {
    // textInsert operations are designed to work together on the same file
    // Each one inserts at a different marker location
    return true
  }

  // If all operations are textReplace on the same target, it's allowed
  // (they replace different parts of the file)
  if (operations.every((op) => op.type === 'textReplace')) {
    return true
  }

  // If operations have explicit overwrite flag, it's allowed
  for (const op of operations) {
    if (
      (op.type === 'copy' && op.overwrite === true) ||
      (op.type === 'jsonMerge' && op.overwrite === true)
    ) {
      return true
    }
  }

  // Other collisions are not allowed
  return false
}

/**
 * Get error message for collisions
 */
export function getFileCollisionErrorMessage(result: CollisionResult): string {
  if (!result.hasCollisions) {
    return ''
  }

  const messages: string[] = []
  messages.push('File collisions detected:')

  for (const collision of result.collisions) {
    messages.push(`  File: ${collision.file}`)
    messages.push(
      `    Operations: ${collision.operations.map((op) => op.type).join(', ')}`
    )
    messages.push(`    Sources: ${collision.sources.join(', ')}`)
  }

  return messages.join('\n')
}
