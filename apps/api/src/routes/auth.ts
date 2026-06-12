import { FastifyInstance } from 'fastify'
import bcrypt from 'bcryptjs'
import { z } from 'zod'
import { prisma } from '../server'

const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  name: z.string().min(2)
})

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string()
})

export default async function authRoutes(app: FastifyInstance) {

  // POST /api/auth/register
  app.post('/register', async (request, reply) => {
    const body = registerSchema.parse(request.body)

    const existing = await prisma.user.findUnique({
      where: { email: body.email }
    })
    if (existing) {
      return reply.status(400).send({ error: 'Email already registered' })
    }

    const hashed = await bcrypt.hash(body.password, 12)
    const user = await prisma.user.create({
      data: { email: body.email, password: hashed, name: body.name },
      select: { id: true, email: true, name: true, role: true }
    })

    const token = app.jwt.sign(
      { id: user.id, email: user.email, role: user.role },
      { expiresIn: '7d' }
    )

    return reply.status(201).send({ user, token })
  })

  // POST /api/auth/login
  app.post('/login', async (request, reply) => {
    const body = loginSchema.parse(request.body)

    const user = await prisma.user.findUnique({
      where: { email: body.email }
    })
    if (!user) {
      return reply.status(401).send({ error: 'Invalid credentials' })
    }

    const valid = await bcrypt.compare(body.password, user.password)
    if (!valid) {
      return reply.status(401).send({ error: 'Invalid credentials' })
    }

    const token = app.jwt.sign(
      { id: user.id, email: user.email, role: user.role },
      { expiresIn: '7d' }
    )

    return {
      user: { id: user.id, email: user.email, name: user.name, role: user.role },
      token
    }
  })

  // GET /api/auth/me
  app.get('/me', {
    preHandler: [(app as any).authenticate]
  }, async (request: any) => {
    const user = await prisma.user.findUnique({
      where: { id: request.user.id },
      select: { id: true, email: true, name: true, role: true, createdAt: true }
    })
    return user
  })
}
