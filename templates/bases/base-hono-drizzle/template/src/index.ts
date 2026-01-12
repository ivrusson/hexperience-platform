import { Hono } from 'hono'

// @addon:imports

const app = new Hono()

// @addon:auth

app.get('/', (c) => {
  return c.json({ message: `Hello from {{projectName}}!` })
})

// Example route
app.get('/api/example', async (c) => {
  // Example database query
  // const result = await db.select().from(exampleTable)
  return c.json({ message: 'Example route' })
})

// @addon:routes

const port = Number.parseInt(process.env.PORT || '{{port}}', 10)

export default {
  port,
  fetch: app.fetch,
}
