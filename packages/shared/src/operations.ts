/**
 * Types for engine operations
 * @packageDocumentation
 */

export type OperationType =
  | 'copy'
  | 'templateRender'
  | 'jsonMerge'
  | 'textInsert'
  | 'textReplace'
  | 'codemod'
  | 'envAppend'

export interface BaseOperation {
  type: OperationType
}

export interface CopyOperation extends BaseOperation {
  type: 'copy'
  from: string
  to: string
  overwrite?: boolean
}

export interface TemplateRenderOperation extends BaseOperation {
  type: 'templateRender'
  from: string
  to: string
}

export interface JsonMergeOperation extends BaseOperation {
  type: 'jsonMerge'
  target: string
  data: Record<string, unknown>
  arrayMerge?: 'append' | 'replace' | 'merge'
  overwrite?: boolean
}

export interface TextInsertOperation extends BaseOperation {
  type: 'textInsert'
  target: string
  marker: string
  content: string
  position?: 'before' | 'after'
}

export interface TextReplaceOperation extends BaseOperation {
  type: 'textReplace'
  target: string
  pattern: string
  replacement: string
  isRegex?: boolean
}

export interface CodemodOperation extends BaseOperation {
  type: 'codemod'
  target: string
  transform: string
  options?: Record<string, unknown>
}

export interface EnvAppendOperation extends BaseOperation {
  type: 'envAppend'
  target: string
  variables: Record<string, string>
  envFile?: '.env' | '.env.example' | '.env.local'
}

export type Operation =
  | CopyOperation
  | TemplateRenderOperation
  | JsonMergeOperation
  | TextInsertOperation
  | TextReplaceOperation
  | CodemodOperation
  | EnvAppendOperation

export interface ExecutionContext {
  variables: Record<string, unknown>
  templateRoot: string
  workspaceRoot: string
}

export interface OperationResult {
  success: boolean
  error?: string
  filesAffected?: string[]
}

/**
 * Post-step types for final project generation steps
 */
export type PostStepType =
  | 'installDependencies'
  | 'formatCode'
  | 'lintCode'
  | 'typeCheck'
  | 'gitInit'
  | 'generateDocs'

export interface PostStep {
  type: PostStepType
  enabled?: boolean
  options?: Record<string, unknown>
}

export interface PostStepResult {
  success: boolean
  error?: string
  message?: string
}
