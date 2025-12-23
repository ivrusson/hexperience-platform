import { existsSync } from 'node:fs'
import { mkdir, readFile, writeFile } from 'node:fs/promises'
import { dirname, resolve } from 'node:path'
import type {
  ExecutionContext,
  JsonMergeOperation,
  OperationResult,
} from '@hexp/shared'
import merge from 'deepmerge'
import { JsonMergeError, OperationError } from '../errors.js'

export async function executeJsonMerge(
  operation: JsonMergeOperation,
  context: ExecutionContext
): Promise<OperationResult> {
  try {
    const targetPath = resolve(context.workspaceRoot, operation.target)
    let existingData: Record<string, unknown> = {}
    if (existsSync(targetPath)) {
      try {
        const content = await readFile(targetPath, 'utf-8')
        existingData = JSON.parse(content) as Record<string, unknown>
      } catch (error) {
        throw new JsonMergeError(
          `Failed to parse existing JSON file at ${operation.target}: ${error instanceof Error ? error.message : String(error)}`,
          { targetPath, error }
        )
      }
    }
    const arrayMergeStrategy =
      operation.arrayMerge === 'replace'
        ? (_destinationArray: unknown[], sourceArray: unknown[]) => sourceArray
        : operation.arrayMerge === 'merge'
          ? (destinationArray: unknown[], sourceArray: unknown[]) => {
              const result = [...destinationArray]
              sourceArray.forEach((item) => {
                if (
                  typeof item === 'object' &&
                  item !== null &&
                  !Array.isArray(item)
                ) {
                  // Try to find matching item by 'name' key if it exists
                  const itemName = (item as Record<string, unknown>).name
                  const matchingIndex = itemName
                    ? result.findIndex(
                        (r) =>
                          typeof r === 'object' &&
                          r !== null &&
                          !Array.isArray(r) &&
                          (r as Record<string, unknown>).name === itemName
                      )
                    : -1

                  if (matchingIndex >= 0) {
                    // Merge with matching item by name
                    result[matchingIndex] = merge(
                      result[matchingIndex] as Record<string, unknown>,
                      item as Record<string, unknown>
                    )
                  } else {
                    // No match found, append as new item
                    result.push(item)
                  }
                } else {
                  // Non-object item, append
                  result.push(item)
                }
              })
              return result
            }
          : undefined
    const mergedData = merge(
      existingData,
      operation.data,
      arrayMergeStrategy ? { arrayMerge: arrayMergeStrategy } : undefined
    )
    const targetDir = dirname(targetPath)
    if (!existsSync(targetDir)) {
      await mkdir(targetDir, { recursive: true })
    }
    const formattedJson = JSON.stringify(mergedData, null, 2)
    await writeFile(targetPath, formattedJson, 'utf-8')
    try {
      JSON.parse(formattedJson)
    } catch (error) {
      throw new JsonMergeError(
        `Merged JSON is invalid: ${error instanceof Error ? error.message : String(error)}`,
        { mergedData, error }
      )
    }
    return { success: true, filesAffected: [operation.target] }
  } catch (error) {
    if (error instanceof OperationError) throw error
    throw new JsonMergeError(
      `Failed to merge JSON at ${operation.target}: ${error instanceof Error ? error.message : String(error)}`,
      { error, operation }
    )
  }
}
