import { coerce, gte, lte, satisfies, valid } from 'semver'
import { InvalidVersionError as InvalidVersionErrorClass } from './errors'

/**
 * Parse and validate a semantic version string
 */
export function parseVersion(version: string): string {
  if (version === 'latest' || version === '*' || version === '') {
    return 'latest'
  }

  // Try to coerce version strings like "1" or "1.0" to valid semver
  const coerced = coerce(version)
  if (coerced) {
    return coerced.version
  }

  // Check if it's already valid semver
  if (valid(version)) {
    return version
  }

  // Check if it's a range (^, ~, >=, <=)
  if (
    version.startsWith('^') ||
    version.startsWith('~') ||
    version.startsWith('>=') ||
    version.startsWith('<=')
  ) {
    return version
  }

  throw new InvalidVersionErrorClass(version)
}

/**
 * Check if a version satisfies a range
 */
export function satisfiesVersion(version: string, range: string): boolean {
  if (range === 'latest' || range === '*' || range === '') {
    return true
  }

  try {
    return satisfies(version, range)
  } catch {
    return false
  }
}

/**
 * Find the best matching version from a list of versions
 */
export function findBestVersion(
  versions: string[],
  range: string
): string | null {
  if (range === 'latest' || range === '*' || range === '') {
    // Return the highest version
    return (
      versions.sort((a, b) => {
        if (gte(a, b)) return -1
        if (lte(a, b)) return 1
        return 0
      })[0] || null
    )
  }

  // Filter versions that satisfy the range
  const matching = versions.filter((v) => satisfiesVersion(v, range))

  if (matching.length === 0) {
    return null
  }

  // Return the highest matching version
  return matching.sort((a, b) => {
    if (gte(a, b)) return -1
    if (lte(a, b)) return 1
    return 0
  })[0]
}

/**
 * Compare two versions
 * Returns: -1 if v1 < v2, 0 if v1 === v2, 1 if v1 > v2
 */
export function compareVersions(v1: string, v2: string): number {
  if (gte(v1, v2) && lte(v1, v2)) {
    return 0
  }
  if (gte(v1, v2)) {
    return 1
  }
  return -1
}

/**
 * Validate version format
 */
export function isValidVersion(version: string): boolean {
  if (version === 'latest' || version === '*' || version === '') {
    return true
  }
  return valid(version) !== null || /^[\^~]?\d+\.\d+\.\d+/.test(version)
}
