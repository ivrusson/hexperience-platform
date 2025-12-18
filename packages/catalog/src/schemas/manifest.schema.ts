import { z } from 'zod'

/**
 * Kebab-case regex validation
 */
const kebabCaseRegex = /^[a-z0-9]+(?:-[a-z0-9]+)*$/

/**
 * Schema for prompt definitions
 */
export const PromptSchema = z.object({
  id: z.string().min(1, 'Prompt ID is required'),
  label: z.string().min(1, 'Prompt label is required'),
  type: z.enum(['text', 'select', 'confirm', 'multiselect']),
  default: z.union([z.string(), z.boolean(), z.array(z.string())]).optional(),
  options: z
    .array(
      z.object({
        label: z.string(),
        value: z.string(),
      })
    )
    .optional(),
  required: z.boolean().optional(),
  validation: z.string().optional(),
})

/**
 * Schema for operation definitions (basic structure for Hito 2)
 */
export const OperationSchema = z
  .object({
    type: z.string().min(1, 'Operation type is required'),
  })
  .passthrough() // Allow additional properties

/**
 * Base manifest schema with common fields
 */
const BaseManifestSchema = z.object({
  id: z
    .string()
    .min(1, 'ID is required')
    .regex(
      kebabCaseRegex,
      'ID must be in kebab-case format (lowercase letters, numbers, and hyphens)'
    ),
  type: z.enum(['base', 'addon']),
  projectType: z.enum(['monorepo', 'single']).optional(),
  name: z.string().min(1, 'Name is required'),
  description: z.string().min(1, 'Description is required'),
  prompts: z.array(PromptSchema).optional(),
  ops: z.array(OperationSchema).optional(),
})

/**
 * Schema for base template manifests
 */
export const BaseTemplateSchema = BaseManifestSchema.extend({
  type: z.literal('base'),
  capabilities: z
    .array(z.string().min(1, 'Capability cannot be empty'))
    .min(1, 'Base template must have at least one capability'),
})

/**
 * Schema for addon template manifests
 */
export const AddonTemplateSchema = BaseManifestSchema.extend({
  type: z.literal('addon'),
  requires: z
    .array(z.string().min(1, 'Required capability cannot be empty'))
    .optional(),
  provides: z
    .array(z.string().min(1, 'Provided capability cannot be empty'))
    .optional(),
  conflicts: z
    .array(z.string().min(1, 'Conflicting addon ID cannot be empty'))
    .optional(),
}).refine(
  (data: {
    requires?: string[]
    provides?: string[]
    conflicts?: string[]
  }) => {
    // Addon must have at least one of requires, provides, or conflicts
    return (
      (data.requires && data.requires.length > 0) ||
      (data.provides && data.provides.length > 0) ||
      (data.conflicts && data.conflicts.length > 0)
    )
  },
  {
    message:
      'Addon template must have at least one of: requires, provides, or conflicts',
  }
)

/**
 * Union schema for any template type
 * Note: Using z.union() instead of z.discriminatedUnion() because AddonTemplateSchema
 * uses .refine() which returns ZodEffects, not compatible with discriminatedUnion
 */
export const ManifestSchema = z.union([BaseTemplateSchema, AddonTemplateSchema])
