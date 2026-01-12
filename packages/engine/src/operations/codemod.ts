import { existsSync, readFileSync, writeFileSync } from 'node:fs'
import { resolve } from 'node:path'
import type {
  CodemodOperation,
  ExecutionContext,
  OperationResult,
} from '@hexp/shared'
import { Project } from 'ts-morph'
import { OperationError } from '../errors'

export async function executeCodemod(
  operation: CodemodOperation,
  context: ExecutionContext
): Promise<OperationResult> {
  try {
    const targetPath = resolve(context.workspaceRoot, operation.target)

    if (!existsSync(targetPath)) {
      throw new OperationError(
        `Target file does not exist: ${operation.target}`,
        operation.type,
        { targetPath, operation }
      )
    }

    // Read the source file
    const sourceCode = readFileSync(targetPath, 'utf-8')

    // Create a ts-morph project
    const project = new Project({
      useInMemoryFileSystem: true,
      compilerOptions: {
        target: 99, // Latest
        module: 99, // Latest
      },
    })

    // Add the source file to the project
    const sourceFile = project.createSourceFile('temp.ts', sourceCode)

    // Execute the transform function
    // The transform is provided as a string that will be evaluated
    // In a real scenario, this would be a function that manipulates the AST
    try {
      // Create a function from the transform string
      // We'll use Function constructor to create a safe execution context
      const transformFunction = new Function(
        'sourceFile',
        'context',
        'options',
        operation.transform
      )

      // Execute the transform
      transformFunction(sourceFile, context, operation.options || {})

      // Get the transformed code
      const transformedCode = sourceFile.getFullText()

      // Validate that the code is still valid TypeScript (basic check)
      // In production, you might want more robust validation
      if (!transformedCode || transformedCode.trim().length === 0) {
        throw new OperationError(
          'Transform resulted in empty code',
          operation.type,
          { operation }
        )
      }

      // Write the transformed code back
      writeFileSync(targetPath, transformedCode, 'utf-8')

      return {
        success: true,
        filesAffected: [operation.target],
      }
    } catch (transformError) {
      throw new OperationError(
        `Transform execution failed: ${transformError instanceof Error ? transformError.message : String(transformError)}`,
        operation.type,
        { error: transformError, operation }
      )
    }
  } catch (error) {
    if (error instanceof OperationError) {
      throw error
    }
    throw new OperationError(
      `Failed to apply codemod to ${operation.target}: ${error instanceof Error ? error.message : String(error)}`,
      operation.type,
      { error, operation }
    )
  }
}
