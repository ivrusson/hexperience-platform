export interface Package {
  id: string
  name: string
  type: 'app' | 'package'
  dependencies: string[]
}

class MonorepoStore {
  private packages: Package[] = []
  private listeners: Set<() => void> = new Set()

  getPackages(): Package[] {
    return [...this.packages]
  }

  getApps(): Package[] {
    return this.packages.filter((p) => p.type === 'app')
  }

  getPackagesOnly(): Package[] {
    return this.packages.filter((p) => p.type === 'package')
  }

  getPackage(id: string): Package | undefined {
    return this.packages.find((p) => p.id === id)
  }

  addPackage(pkg: Omit<Package, 'id'>): Package {
    const id = pkg.name.toLowerCase().replace(/\s+/g, '-')
    const newPackage: Package = {
      ...pkg,
      id,
    }
    this.packages.push(newPackage)
    this.notify()
    return newPackage
  }

  updatePackage(id: string, updates: Partial<Omit<Package, 'id'>>): void {
    const index = this.packages.findIndex((p) => p.id === id)
    if (index >= 0) {
      this.packages[index] = { ...this.packages[index], ...updates }
      this.notify()
    }
  }

  deletePackage(id: string): void {
    // Remove from dependencies of other packages
    this.packages.forEach((pkg) => {
      pkg.dependencies = pkg.dependencies.filter((dep) => dep !== id)
    })
    this.packages = this.packages.filter((p) => p.id !== id)
    this.notify()
  }

  addDependency(packageId: string, dependencyId: string): void {
    const pkg = this.packages.find((p) => p.id === packageId)
    if (pkg && !pkg.dependencies.includes(dependencyId)) {
      pkg.dependencies.push(dependencyId)
      this.notify()
    }
  }

  removeDependency(packageId: string, dependencyId: string): void {
    const pkg = this.packages.find((p) => p.id === packageId)
    if (pkg) {
      pkg.dependencies = pkg.dependencies.filter((dep) => dep !== dependencyId)
      this.notify()
    }
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

  // Persistence
  save(): string {
    return JSON.stringify(this.packages, null, 2)
  }

  load(data: string): void {
    try {
      this.packages = JSON.parse(data) as Package[]
      this.notify()
    } catch (error) {
      throw new Error(
        `Failed to load monorepo structure: ${error instanceof Error ? error.message : String(error)}`
      )
    }
  }
}

export const monorepoStore = new MonorepoStore()
