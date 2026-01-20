export interface ModelField {
  name: string
  type: 'string' | 'number' | 'boolean' | 'date' | 'object' | 'array'
  required?: boolean
  defaultValue?: unknown
  // Validation options
  min?: number
  max?: number
  email?: boolean
  url?: boolean
  pattern?: string // regex pattern
}

export interface ModelRelation {
  type: 'one-to-many' | 'many-to-many' | 'one-to-one'
  target: string
}

export interface Model {
  id: string
  name: string
  fields: ModelField[]
  relations: ModelRelation[]
}

class ModelStore {
  private models: Model[] = []
  private listeners: Set<() => void> = new Set()

  getModels(): Model[] {
    return [...this.models]
  }

  getModel(id: string): Model | undefined {
    return this.models.find((m) => m.id === id)
  }

  addModel(model: Omit<Model, 'id'>): Model {
    const id = model.name.toLowerCase().replace(/\s+/g, '-')
    const newModel: Model = {
      ...model,
      id,
    }
    this.models.push(newModel)
    this.notify()
    return newModel
  }

  updateModel(id: string, updates: Partial<Omit<Model, 'id'>>): void {
    const index = this.models.findIndex((m) => m.id === id)
    if (index >= 0) {
      this.models[index] = { ...this.models[index], ...updates }
      this.notify()
    }
  }

  deleteModel(id: string): void {
    this.models = this.models.filter((m) => m.id !== id)
    this.notify()
  }

  subscribe(listener: () => void): () => void {
    this.listeners.add(listener)
    return () => {
      this.listeners.delete(listener)
    }
  }

  private notify(): void {
    this.listeners.forEach((listener) => {
      listener()
    })
  }

  // Persistence
  save(): string {
    return JSON.stringify(this.models, null, 2)
  }

  load(data: string): void {
    try {
      this.models = JSON.parse(data) as Model[]
      this.notify()
    } catch (error) {
      throw new Error(
        `Failed to load models: ${error instanceof Error ? error.message : String(error)}`
      )
    }
  }

  // File-based persistence
  async saveToFile(filePath: string): Promise<void> {
    const { writeFileSync } = await import('node:fs')
    const { dirname } = await import('node:path')
    const { mkdir } = await import('node:fs/promises')
    const { existsSync } = await import('node:fs')

    const dir = dirname(filePath)
    if (!existsSync(dir)) {
      await mkdir(dir, { recursive: true })
    }

    const data = this.save()
    writeFileSync(filePath, data, 'utf-8')
  }

  async loadFromFile(filePath: string): Promise<void> {
    const { readFileSync, existsSync } = await import('node:fs')

    if (!existsSync(filePath)) {
      // File doesn't exist, start with empty models
      this.models = []
      this.notify()
      return
    }

    try {
      const data = readFileSync(filePath, 'utf-8')
      this.load(data)
    } catch (error) {
      throw new Error(
        `Failed to load models from file: ${error instanceof Error ? error.message : String(error)}`
      )
    }
  }
}

export const modelStore = new ModelStore()
