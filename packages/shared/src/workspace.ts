/**
 * Types for workspace management
 * @packageDocumentation
 */

export interface Workspace {
  readonly root: string
  create(): Promise<void>
  cleanup(): Promise<void>
  exists(): boolean
}
