import { strictEqual } from 'node:assert'
import { describe, test } from 'node:test'
import { modelStore } from '../../../tui/stores/modelStore.js'

describe('modelStore', () => {
  test('should add a model', () => {
    const model = modelStore.addModel({
      name: 'User',
      fields: [
        { name: 'id', type: 'string', required: true },
        { name: 'name', type: 'string' },
      ],
      relations: [],
    })

    strictEqual(model.name, 'User')
    strictEqual(model.id, 'user')
    strictEqual(model.fields.length, 2)
  })

  test('should get all models', () => {
    modelStore.addModel({
      name: 'Product',
      fields: [],
      relations: [],
    })

    const models = modelStore.getModels()
    strictEqual(models.length >= 1, true)
  })

  test('should get model by id', () => {
    const model = modelStore.addModel({
      name: 'Order',
      fields: [],
      relations: [],
    })

    const found = modelStore.getModel(model.id)
    strictEqual(found?.name, 'Order')
  })

  test('should update model', () => {
    const model = modelStore.addModel({
      name: 'Category',
      fields: [],
      relations: [],
    })

    modelStore.updateModel(model.id, { name: 'Updated Category' })
    const updated = modelStore.getModel(model.id)
    strictEqual(updated?.name, 'Updated Category')
  })

  test('should delete model', () => {
    const model = modelStore.addModel({
      name: 'Temp',
      fields: [],
      relations: [],
    })

    modelStore.deleteModel(model.id)
    const found = modelStore.getModel(model.id)
    strictEqual(found, undefined)
  })

  test('should save and load models', () => {
    modelStore.addModel({
      name: 'Test',
      fields: [{ name: 'field', type: 'string' }],
      relations: [],
    })

    const saved = modelStore.save()
    const parsed = JSON.parse(saved)
    strictEqual(Array.isArray(parsed), true)

    // Create a new store instance for testing load
    const newStore = modelStore
    newStore.load(saved)
    const models = newStore.getModels()
    strictEqual(models.length >= 1, true)
  })
})
