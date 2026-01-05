import type { AddonTemplate } from '@hexp/catalog'

/**
 * Resolved order of addons
 */
export interface ResolvedOrder {
  /** Addons in correct application order */
  orderedAddons: AddonTemplate[]
  /** Whether there are cycles in dependencies */
  hasCycles: boolean
  /** List of cycles detected */
  cycles: string[][]
  /** Dependency graph: addon ID -> list of addon IDs it depends on */
  dependencyGraph: Map<string, string[]>
}

/**
 * DependencyResolver resolves the correct order of addon application
 */
export class DependencyResolver {
  /**
   * Resolve addon order based on dependencies
   */
  static resolve(
    addons: AddonTemplate[],
    baseCapabilities: string[]
  ): ResolvedOrder {
    const addonMap = new Map<string, AddonTemplate>()
    const dependencyGraph = new Map<string, string[]>()
    const capabilityProviders = new Map<string, Set<string>>()

    // Build maps
    for (const addon of addons) {
      addonMap.set(addon.id, addon)
      dependencyGraph.set(addon.id, [])

      // Track which addons provide which capabilities
      const provides = addon.provides || []
      for (const cap of provides) {
        if (!capabilityProviders.has(cap)) {
          capabilityProviders.set(cap, new Set())
        }
        const providers = capabilityProviders.get(cap)
        if (providers) {
          providers.add(addon.id)
        }
      }
    }

    // Build dependency graph
    // Addon A depends on B if A requires a capability that only B provides
    for (const addon of addons) {
      const required = addon.requires || []
      const dependencies: string[] = []

      for (const req of required) {
        // If base provides it, no dependency needed
        if (baseCapabilities.includes(req)) {
          continue
        }

        // Find which addon(s) provide this capability
        const providers = capabilityProviders.get(req)
        if (providers && providers.size > 0) {
          // If multiple providers, we need all of them
          for (const providerId of providers) {
            if (providerId !== addon.id && !dependencies.includes(providerId)) {
              dependencies.push(providerId)
            }
          }
        }
      }

      dependencyGraph.set(addon.id, dependencies)
    }

    // Detect cycles and perform topological sort
    const cycles = DependencyResolver.detectCycles(dependencyGraph, Array.from(addonMap.keys()))
    const hasCycles = cycles.length > 0

    // If there are cycles, we can't resolve order
    if (hasCycles) {
      return {
        orderedAddons: addons, // Return original order
        hasCycles: true,
        cycles,
        dependencyGraph,
      }
    }

    // Perform topological sort using Kahn's algorithm
    const orderedAddons = DependencyResolver.topologicalSort(dependencyGraph, addonMap)

    return {
      orderedAddons,
      hasCycles: false,
      cycles: [],
      dependencyGraph,
    }
  }

  /**
   * Detect cycles in dependency graph using DFS
   */
  private static detectCycles(
    graph: Map<string, string[]>,
    allNodes: string[]
  ): string[][] {
    const cycles: string[][] = []
    const visited = new Set<string>()
    const recursionStack = new Set<string>()

    const dfs = (node: string, path: string[]): void => {
      visited.add(node)
      recursionStack.add(node)
      path.push(node)

      const neighbors = graph.get(node) || []
      for (const neighbor of neighbors) {
        if (!visited.has(neighbor)) {
          dfs(neighbor, [...path])
        } else if (recursionStack.has(neighbor)) {
          // Found a cycle
          const cycleStart = path.indexOf(neighbor)
          if (cycleStart !== -1) {
            const cycle = path.slice(cycleStart)
            cycle.push(neighbor) // Complete the cycle
            cycles.push(cycle)
          }
        }
      }

      recursionStack.delete(node)
    }

    for (const node of allNodes) {
      if (!visited.has(node)) {
        dfs(node, [])
      }
    }

    return cycles
  }

  /**
   * Topological sort using Kahn's algorithm
   * Graph: addon.id -> [dependencies] means "addon depends on these addons"
   * So we need to process dependencies first, then the addon
   */
  private static topologicalSort(
    graph: Map<string, string[]>,
    addonMap: Map<string, AddonTemplate>
  ): AddonTemplate[] {
    // Calculate in-degrees (how many addons this addon depends on)
    const inDegree = new Map<string, number>()
    for (const node of graph.keys()) {
      inDegree.set(node, 0)
    }

    // For each addon, count how many dependencies it has
    for (const [node, dependencies] of graph) {
      inDegree.set(node, dependencies.length)
    }

    // Find nodes with no dependencies (can be processed first)
    const queue: string[] = []
    for (const [node, degree] of inDegree) {
      if (degree === 0) {
        queue.push(node)
      }
    }

    const result: AddonTemplate[] = []

    // Process queue
    while (queue.length > 0) {
      const node = queue.shift()
      if (!node) break
      const addon = addonMap.get(node)
      if (addon) {
        result.push(addon)
      }

      // Find all addons that depend on this node and decrement their in-degree
      for (const [otherNode, dependencies] of graph) {
        if (dependencies.includes(node)) {
          const currentDegree = inDegree.get(otherNode) || 0
          inDegree.set(otherNode, currentDegree - 1)
          if (inDegree.get(otherNode) === 0) {
            queue.push(otherNode)
          }
        }
      }
    }

    // If we couldn't process all nodes, there might be cycles
    // (though we should have detected them earlier)
    if (result.length < addonMap.size) {
      // Add remaining nodes in arbitrary order
      for (const [id, addon] of addonMap) {
        if (!result.some((a) => a.id === id)) {
          result.push(addon)
        }
      }
    }

    return result
  }

  /**
   * Get error message for dependency cycles
   */
  static getErrorMessage(result: ResolvedOrder): string {
    if (!result.hasCycles) {
      return ''
    }

    const messages: string[] = []
    messages.push('Dependency cycles detected:')

    for (const cycle of result.cycles) {
      messages.push(`  Cycle: ${cycle.join(' -> ')}`)
    }

    return messages.join('\n')
  }
}
