import { existsSync } from 'node:fs'
import { mkdir, readFile, writeFile } from 'node:fs/promises'
import { dirname, resolve } from 'node:path'
import type {
  ExecutionContext,
  JsonMergeOperation,
  OperationResult,
} from '@hexp/shared'
import deepmerge from 'deepmerge'
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
              sourceArray.forEach((item, index) => {
                if (
                  typeof item === 'object' &&
                  item !== null &&
                  !Array.isArray(item)
                ) {
                  if (
                    result[index] &&
                    typeof result[index] === 'object' &&
                    result[index] !== null &&
                    !Array.isArray(result[index])
                  ) {
                    result[index] = deepmerge(
                      result[index] as Record<string, unknown>,
                      item as Record<string, unknown>
                    )
                  } else {
                    result[index] = item
                  }
                } else if (index < result.length) {
                  result[index] = item
                } else {
                  result.push(item)
                }
              })
              return result
            }
          : undefined
    const mergedData = deepmerge(
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
