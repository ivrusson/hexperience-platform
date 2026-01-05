# addon-auth

Add JWT-based authentication to a web server.

## Requirements

- `web-server`: Requires a web server base template (e.g., base-hono-drizzle)

## Provides

- `auth`: Authentication capability

## Variables

- `projectName`: Name of the project (automatically provided)

## Usage

This addon adds authentication to your web server with:

- **JWT Authentication**: Token-based authentication using @hono/jwt
- **Password Hashing**: Secure password storage with bcrypt
- **Validation**: Request validation with Zod
- **Routes**: Login, register, and me endpoints
- **Middleware**: Authentication middleware for protecting routes

## Structure

```
src/
└── auth/
    ├── middleware.ts  # JWT middleware
    ├── routes.ts      # Auth routes (login, register, me)
    ├── types.ts       # TypeScript types and Zod schemas
    └── utils.ts       # Password hashing utilities
```

## Routes

- `POST /auth/register`: Register a new user
- `POST /auth/login`: Login with email and password
- `GET /auth/me`: Get current user (requires authentication)

## Environment Variables

Add to your `.env` file:

```bash
JWT_SECRET=your-secret-key-change-in-production
```

## Operations

1. **copy**: Copies auth files to `src/auth/`
2. **textInsert**: Adds imports, middleware, and routes to `src/index.ts` using markers
3. **jsonMerge**: Adds dependencies (@hono/jwt, bcrypt, zod, @types/bcrypt)
4. **envAppend**: Adds JWT_SECRET to `.env.example`

## Integration

The addon automatically integrates with your server using markers:

- `// @addon:imports`: Adds auth imports
- `// @addon:auth`: Adds authentication middleware
- `// @addon:routes`: Adds authentication routes

## Example Request

### Register

```bash
curl -X POST http://localhost:3000/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "password": "password123",
    "name": "John Doe"
  }'
```

### Login

```bash
curl -X POST http://localhost:3000/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "password": "password123"
  }'
```

### Get Current User

```bash
curl -X GET http://localhost:3000/auth/me \
  -H "Cookie: token=YOUR_JWT_TOKEN"
```

## Database Integration

**Note**: The current implementation uses an in-memory array for demonstration. For production use, you should:

1. Replace the `users` array in `routes.ts` with your database queries
2. Use your ORM (e.g., Drizzle) to store and retrieve users
3. Add proper error handling and database transactions

## Compatible Bases

- `base-hono-drizzle`
- Any other base template with `web-server` capability
