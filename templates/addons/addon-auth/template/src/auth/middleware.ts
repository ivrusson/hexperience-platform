import { jwt } from '@hono/jwt'
import type { Context, Next } from 'hono'

/**
 * JWT authentication middleware
 * Adds user to context if valid token is present
 */
export const authMiddleware = jwt({
  secret: process.env.JWT_SECRET || 'your-secret-key-change-in-production',
  cookie: 'token',
})

/**
 * Optional: Require authentication middleware
 * Use this to protect routes that require authentication
 */
export async function requireAuth(c: Context, next: Next) {
  const payload = c.get('jwtPayload')
  if (!payload) {
    return c.json({ error: 'Unauthorized' }, 401)
  }
  await next()
}
