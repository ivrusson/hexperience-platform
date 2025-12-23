import { strictEqual } from 'node:assert'
import { describe, test } from 'node:test'
import { monorepoStore } from '../../../tui/stores/monorepoStore.js'

describe('monorepoStore', () => {
  test('should add a package', () => {
    const pkg = monorepoStore.addPackage({
      name: 'my-app',
      type: 'app',
      dependencies: [],
    })

    strictEqual(pkg.name, 'my-app')
    strictEqual(pkg.type, 'app')
    strictEqual(pkg.id, 'my-app')
  })

  test('should get all packages', () => {
    monorepoStore.addPackage({
      name: 'my-package',
      type: 'package',
      dependencies: [],
    })

    const packages = monorepoStore.getPackages()
    strictEqual(packages.length >= 1, true)
  })

  test('should get apps only', () => {
    monorepoStore.addPackage({
      name: 'test-app',
      type: 'app',
      dependencies: [],
    })

    const apps = monorepoStore.getApps()
    strictEqual(apps.length >= 1, true)
    strictEqual(
      apps.every((a) => a.type === 'app'),
      true
    )
  })

  test('should get packages only', () => {
    monorepoStore.addPackage({
      name: 'test-package',
      type: 'package',
      dependencies: [],
    })

    const packages = monorepoStore.getPackagesOnly()
    strictEqual(packages.length >= 1, true)
    strictEqual(
      packages.every((p) => p.type === 'package'),
      true
    )
  })

  test('should add dependency', () => {
    const pkg1 = monorepoStore.addPackage({
      name: 'pkg1',
      type: 'package',
      dependencies: [],
    })
    const pkg2 = monorepoStore.addPackage({
      name: 'pkg2',
      type: 'package',
      dependencies: [],
    })

    monorepoStore.addDependency(pkg1.id, pkg2.id)
    const updated = monorepoStore.getPackage(pkg1.id)
    strictEqual(updated?.dependencies.includes(pkg2.id), true)
  })

  test('should remove dependency', () => {
    const pkg1 = monorepoStore.addPackage({
      name: 'pkg3',
      type: 'package',
      dependencies: [],
    })
    const pkg2 = monorepoStore.addPackage({
      name: 'pkg4',
      type: 'package',
      dependencies: [],
    })

    monorepoStore.addDependency(pkg1.id, pkg2.id)
    monorepoStore.removeDependency(pkg1.id, pkg2.id)
    const updated = monorepoStore.getPackage(pkg1.id)
    strictEqual(updated?.dependencies.includes(pkg2.id), false)
  })

  test('should delete package and remove from dependencies', () => {
    const pkg1 = monorepoStore.addPackage({
      name: 'pkg5',
      type: 'package',
      dependencies: [],
    })
    const pkg2 = monorepoStore.addPackage({
      name: 'pkg6',
      type: 'package',
      dependencies: [],
    })

    monorepoStore.addDependency(pkg1.id, pkg2.id)
    monorepoStore.deletePackage(pkg2.id)
    const updated = monorepoStore.getPackage(pkg1.id)
    strictEqual(updated?.dependencies.includes(pkg2.id), false)
  })
})
