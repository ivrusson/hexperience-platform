/**
 * Base types for Hexperience Platform templates
 */

import type { Operation } from './operations.js'

/**
 * Type of template
 */
export type TemplateType = 'base' | 'addon'

/**
 * Type of project that can be generated
 */
export type ProjectType = 'monorepo' | 'single'

/**
 * Prompt definition for collecting user input
 */
export interface Prompt {
  /** Unique identifier for the prompt */
  id: string
  /** Label/question to display to the user */
  label: string
  /** Type of prompt input */
  type: 'text' | 'select' | 'confirm' | 'multiselect'
  /** Default value (optional) */
  default?: string | boolean | string[]
  /** Options for select/multiselect types */
  options?: Array<{ label: string; value: string }>
  /** Whether this prompt is required */
  required?: boolean
  /** Validation message if validation fails */
  validation?: string
}

/**
 * Base manifest structure shared by all templates
 */
export interface Manifest {
  /** Unique identifier (kebab-case) */
  id: string
  /** Type of template */
  type: TemplateType
  /** Type of project this template generates (optional) */
  projectType?: ProjectType
  /** Human-readable name */
  name: string
  /** Description of the template */
  description: string
  /** Prompts for user input (optional) */
  prompts?: Prompt[]
  /** Operations to execute (optional, for Hito 2) */
  ops?: import('./operations.js').Operation[]
}

/**
 * Base template manifest
 */
export interface BaseTemplate extends Manifest {
  type: 'base'
  /** Capabilities provided by this base */
  capabilities: string[]
}

/**
 * Addon template manifest
 */
export interface AddonTemplate extends Manifest {
  type: 'addon'
  /** Required capabilities that must be provided by the base */
  requires?: string[]
  /** Capabilities provided by this addon */
  provides?: string[]
  /** IDs of addons that conflict with this one */
  conflicts?: string[]
}
