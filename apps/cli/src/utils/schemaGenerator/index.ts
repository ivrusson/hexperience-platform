import type { Model } from '../../tui/stores/modelStore'
import { getLogger } from '../logger'
import { detectSchemaTypes, detectWebFramework } from './detector'
import { schemaGenerators } from './generators'
import { apiGenerators } from './generators/api'

const logger = getLogger()

export async function generateCode(
  projectPath: string,
  models: Model[]
): Promise<void> {
  if (models.length === 0) {
    logger.info('No models to generate')
    return
  }

  logger.info(`Generating code for ${models.length} model(s) in ${projectPath}`)

  // Detect what needs to be generated
  const schemaTypes = detectSchemaTypes(projectPath)
  const webFramework = detectWebFramework(projectPath)

  logger.info(`Detected schema types: ${schemaTypes.join(', ')}`)
  if (webFramework) {
    logger.info(`Detected web framework: ${webFramework}`)
  }

  // Generate schemas
  for (const schemaType of schemaTypes) {
    const generator = schemaGenerators[schemaType]
    if (generator) {
      try {
        logger.info(`Generating ${schemaType} schema...`)
        await generator.generate(models, projectPath)
        logger.info(`✓ Generated ${schemaType} schema`)
      } catch (error) {
        logger.error(
          `Failed to generate ${schemaType} schema: ${error instanceof Error ? error.message : String(error)}`
        )
        throw error
      }
    }
  }

  // Generate API code if framework is detected
  if (webFramework) {
    const apiGenerator = apiGenerators[webFramework]
    if (apiGenerator) {
      try {
        logger.info(`Generating ${webFramework} API code...`)
        await apiGenerator.generate(models, projectPath, webFramework)
        logger.info(`✓ Generated ${webFramework} API code`)
      } catch (error) {
        logger.error(
          `Failed to generate ${webFramework} API code: ${error instanceof Error ? error.message : String(error)}`
        )
        // Don't throw - API generation is optional
      }
    }
  } else {
    logger.info('No web framework detected, skipping API code generation')
  }

  logger.info('Code generation completed')
}
