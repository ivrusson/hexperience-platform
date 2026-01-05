import { Hono } from 'hono'
import { sign } from '@hono/jwt'
import { loginSchema, registerSchema } from './types.js'
import { hashPassword, verifyPassword } from './utils.js'

export const authRoutes = new Hono()

// TODO: Replace with your actual user database/ORM
// This is a placeholder implementation
const users: Array<{
  id: string
  email: string
  name: string
  passwordHash: string
}> = []

/**
 * Register a new user
 * POST /auth/register
 */
authRoutes.post('/register', async (c) => {
  try {
    const body = await c.req.json()
    const validated = registerSchema.parse(body)

    // Check if user already exists
    const existingUser = users.find((u) => u.email === validated.email)
    if (existingUser) {
      return c.json({ error: 'User already exists' }, 400)
    }

    // Hash password
    const passwordHash = await hashPassword(validated.password)

    // Create user
    const user = {
      id: crypto.randomUUID(),
      email: validated.email,
      name: validated.name,
      passwordHash,
    }
    users.push(user)

    // Generate JWT token
    const secret = process.env.JWT_SECRET || 'your-secret-key-change-in-production'
    const token = await sign(
      {
        id: user.id,
        email: user.email,
        name: user.name,
      },
      secret
    )

    return c.json(
      {
        message: 'User registered successfully',
        token,
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
        },
      },
      201
    )
  } catch (error) {
    if (error instanceof Error && 'issues' in error) {
      return c.json({ error: 'Validation error', details: error }, 400)
    }
    return c.json({ error: 'Internal server error' }, 500)
  }
})

/**
 * Login user
 * POST /auth/login
 */
authRoutes.post('/login', async (c) => {
  try {
    const body = await c.req.json()
    const validated = loginSchema.parse(body)

    // Find user
    const user = users.find((u) => u.email === validated.email)
    if (!user) {
      return c.json({ error: 'Invalid credentials' }, 401)
    }

    // Verify password
    const isValid = await verifyPassword(validated.password, user.passwordHash)
    if (!isValid) {
      return c.json({ error: 'Invalid credentials' }, 401)
    }

    // Generate JWT token
    const secret = process.env.JWT_SECRET || 'your-secret-key-change-in-production'
    const token = await sign(
      {
        id: user.id,
        email: user.email,
        name: user.name,
      },
      secret
    )

    return c.json({
      message: 'Login successful',
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
      },
    })
  } catch (error) {
    if (error instanceof Error && 'issues' in error) {
      return c.json({ error: 'Validation error', details: error }, 400)
    }
    return c.json({ error: 'Internal server error' }, 500)
  }
})

/**
 * Get current user
 * GET /auth/me
 * Requires authentication
 */
authRoutes.get('/me', async (c) => {
  const payload = c.get('jwtPayload')
  if (!payload) {
    return c.json({ error: 'Unauthorized' }, 401)
  }

  return c.json({
    user: {
      id: payload.id,
      email: payload.email,
      name: payload.name,
    },
  })
})
