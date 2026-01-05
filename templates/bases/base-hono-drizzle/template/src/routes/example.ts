import { Hono } from 'hono'

export const exampleRoutes = new Hono()

exampleRoutes.get('/hello', (c) => {
  return c.json({ message: 'Hello from example route!' })
})
