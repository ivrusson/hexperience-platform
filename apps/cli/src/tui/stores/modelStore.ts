export interface ModelField {
  name: string
  type: 'string' | 'number' | 'boolean' | 'date' | 'object' | 'array'
  required?: boolean
  defaultValue?: unknown
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
    this.listeners.forEach((listener) => listener())
  }

  // Persistence (optional - can be implemented later)
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
}

export const modelStore = new ModelStore()
