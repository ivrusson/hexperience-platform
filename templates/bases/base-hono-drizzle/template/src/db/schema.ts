import { sqliteTable, text, integer } from 'drizzle-orm/sqlite-core'

export const exampleTable = sqliteTable('example', {
  id: integer('id').primaryKey(),
  name: text('name').notNull(),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
})

export type Example = typeof exampleTable.$inferSelect
export type NewExample = typeof exampleTable.$inferInsert
