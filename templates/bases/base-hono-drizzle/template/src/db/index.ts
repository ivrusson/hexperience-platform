import { drizzle } from 'drizzle-orm/libsql'
import { createClient } from '@libsql/client'
import * as schema from './schema.js'

const client = createClient({
  url: process.env.DATABASE_URL || 'file:./db.sqlite',
})

export const db = drizzle(client, { schema })
