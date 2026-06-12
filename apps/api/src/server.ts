import Fastify from 'fastify'
import cors from '@fastify/cors'
import jwt from '@fastify/jwt'
import multipart from '@fastify/multipart'
import { PrismaClient } from '@prisma/client'
import Redis from 'ioredis'
import dotenv from 'dotenv'

import authRoutes from './routes/auth'
import productRoutes from './routes/products'
import categoryRoutes from './routes/categories'
import orderRoutes from './routes/orders'
import cartRoutes from './routes/cart'
import uploadRoutes from './routes/upload'
import webhookRoutes from './routes/webhooks'

dotenv.config({ path: '/home/ec2-user/.env' })

// ── Clients ──────────────────────────────────────────────────────
export const prisma = new PrismaClient()
export const redis = new Redis(process.env.REDIS_URL!)

// ── Fastify instance ─────────────────────────────────────────────
const app = Fastify({
  logger: {
    level: process.env.NODE_ENV === 'production' ? 'info' : 'debug',
    transport: process.env.NODE_ENV !== 'production'
      ? { target: 'pino-pretty' }
      : undefined
  }
})

// ── Plugins ──────────────────────────────────────────────────────
app.register(cors, {
  origin: process.env.FRONTEND_URL || '*',
  credentials: true
})

app.register(jwt, {
  secret: process.env.JWT_SECRET!
})

app.register(multipart, {
  limits: { fileSize: 5 * 1024 * 1024 } // 5MB
})

// ── Decorators ───────────────────────────────────────────────────
app.decorate('authenticate', async (request: any, reply: any) => {
  try {
    await request.jwtVerify()
  } catch (err) {
    reply.status(401).send({ error: 'Unauthorized' })
  }
})

app.decorate('adminOnly', async (request: any, reply: any) => {
  try {
    await request.jwtVerify()
    if (request.user.role !== 'ADMIN') {
      reply.status(403).send({ error: 'Forbidden' })
    }
  } catch (err) {
    reply.status(401).send({ error: 'Unauthorized' })
  }
})

// ── Routes ───────────────────────────────────────────────────────
app.register(authRoutes,     { prefix: '/api/auth' })
app.register(productRoutes,  { prefix: '/api/products' })
app.register(categoryRoutes, { prefix: '/api/categories' })
app.register(orderRoutes,    { prefix: '/api/orders' })
app.register(cartRoutes,     { prefix: '/api/cart' })
app.register(uploadRoutes,   { prefix: '/api/upload' })
app.register(webhookRoutes,  { prefix: '/api/webhooks' })

// ── Health check ─────────────────────────────────────────────────
app.get('/health', async () => ({
  status: 'ok',
  timestamp: new Date().toISOString(),
  uptime: process.uptime()
}))

// ── Start ─────────────────────────────────────────────────────────
const start = async () => {
  try {
    await prisma.$connect()
    app.log.info('Database connected')

    await app.listen({
      port: parseInt(process.env.PORT || '3000'),
      host: '0.0.0.0'
    })
  } catch (err) {
    app.log.error(err)
    process.exit(1)
  }
}

start()
