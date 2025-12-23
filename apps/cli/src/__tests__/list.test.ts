import { strictEqual } from 'node:assert'
import { mkdir, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { describe, test } from 'node:test'
import { listCommand } from '../commands/list.js'

describe('listCommand', () => {
  let tempDir: string
  let templatesDir: string

  test.beforeEach(async () => {
    tempDir = join(tmpdir(), `list-test-${Date.now()}`)
    templatesDir = join(tempDir, 'templates')
    await mkdir(templatesDir, { recursive: true })
    await mkdir(join(templatesDir, 'bases'), { recursive: true })
    await mkdir(join(templatesDir, 'addons'), { recursive: true })
  })

  test.afterEach(async () => {
    await rm(tempDir, { recursive: true, force: true })
  })

  test('should list bases and addons when templates exist', async () => {
    // Create a base template
    const baseDir = join(templatesDir, 'bases', 'test-base')
    await mkdir(baseDir, { recursive: true })
    await writeFile(
      join(baseDir, 'manifest.json'),
      JSON.stringify({
        id: 'test-base',
        type: 'base',
        name: 'Test Base',
        description: 'A test base template',
        capabilities: ['web-server'],
        ops: [],
      })
    )

    // Create an addon template
    const addonDir = join(templatesDir, 'addons', 'test-addon')
    await mkdir(addonDir, { recursive: true })
    await writeFile(
      join(addonDir, 'manifest.json'),
      JSON.stringify({
        id: 'test-addon',
        type: 'addon',
        name: 'Test Addon',
        description: 'A test addon',
        requires: ['web-server'],
        ops: [],
      })
    )

    // Mock process.cwd to return tempDir
    const originalCwd = process.cwd
    process.cwd = () => tempDir

    // Mock console.log to capture output
    const logs: string[] = []
    const originalLog = console.log
    console.log = (...args: unknown[]) => {
      logs.push(args.map(String).join(' '))
    }

    try {
      await listCommand({ all: true })
      const output = logs.join('\n')

      strictEqual(output.includes('Test Base'), true)
      strictEqual(output.includes('Test Addon'), true)
    } finally {
      process.cwd = originalCwd
      console.log = originalLog
    }
  })

  test('should handle empty templates directory', async () => {
    const originalCwd = process.cwd
    process.cwd = () => tempDir

    const logs: string[] = []
    const originalLog = console.log
    console.log = (...args: unknown[]) => {
      logs.push(args.map(String).join(' '))
    }

    try {
      await listCommand({ all: true })
      const output = logs.join('\n')

      strictEqual(output.includes('No base templates'), true)
      strictEqual(output.includes('No addon templates'), true)
    } finally {
      process.cwd = originalCwd
      console.log = originalLog
    }
  })
})
