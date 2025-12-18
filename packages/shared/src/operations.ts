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

export type Operation =
  | CopyOperation
  | TemplateRenderOperation
  | JsonMergeOperation
  | TextInsertOperation
  | TextReplaceOperation

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
